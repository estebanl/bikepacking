// Ride Heatmap on Azure — near-zero cost, no secrets in the repo.
//
//   Static Web App (Free)  : page + managed API (Node), built-in Microsoft login,
//                            invite-only "rider" role.
//   Function App (Flex)    : Python worker, managed identity. Queue trigger for
//                            key changes / refreshes, timer every morning.
//   Storage (private)      : queue "jobs", table "profiles", blobs for tracks,
//                            heatmaps and the public wrap key.
//   Key Vault (RBAC)       : one secret per rider's Garmin key + an RSA key the
//                            API uses to encrypt keys before they leave it.
//   GitHub OIDC identity   : user-assigned identity with a federated credential
//                            for this repo's main branch (no client secrets).

@description('Region for storage, Key Vault and the Function App.')
param location string = resourceGroup().location

@description('Region for the Static Web App (Free tier is offered in a few regions only).')
@allowed(['centralus', 'eastus2', 'westus2', 'westeurope', 'eastasia'])
param swaLocation string = 'eastus2'

@description('GitHub repository allowed to deploy via OIDC, as owner/name.')
param githubRepo string

@description('Branch allowed to deploy via OIDC.')
param githubBranch string = 'main'

param prefix string = 'heatmap'

var suffix = take(uniqueString(resourceGroup().id), 6)
var tags = { app: 'ride-heatmap' }

// ---------------------------------------------------------------- storage
resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'st${prefix}${suffix}'
  location: location
  tags: tags
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    // The SWA Free managed API cannot use a managed identity, so it needs a
    // connection string. Everything else uses Entra auth.
    allowSharedKeyAccess: true
  }
}

resource blobSvc 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource containers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = [for c in ['deployment', 'tracks', 'heatmaps', 'config']: {
  parent: blobSvc
  name: c
  properties: { publicAccess: 'None' }
}]

resource queueSvc 'Microsoft.Storage/storageAccounts/queueServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource jobsQueue 'Microsoft.Storage/storageAccounts/queueServices/queues@2023-05-01' = {
  parent: queueSvc
  name: 'jobs'
}

resource tableSvc 'Microsoft.Storage/storageAccounts/tableServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource profilesTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-05-01' = {
  parent: tableSvc
  name: 'profiles'
}

// ---------------------------------------------------------------- key vault
resource vault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-${prefix}-${suffix}'
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: { family: 'A', name: 'standard' }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    publicNetworkAccess: 'Enabled'
  }
}

// RSA key the API encrypts Garmin keys with (it only ever sees the public half).
resource wrapKey 'Microsoft.KeyVault/vaults/keys@2023-07-01' = {
  parent: vault
  name: 'garmin-wrap'
  properties: {
    kty: 'RSA'
    keySize: 2048
    keyOps: ['encrypt', 'decrypt']
  }
}

// ---------------------------------------------------------------- monitoring
resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'log-${prefix}-${suffix}'
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    workspaceCapping: { dailyQuotaGb: json('0.1') }   // stays inside the free 5 GB/month
  }
}

resource insights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${prefix}-${suffix}'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logs.id
  }
}

// ---------------------------------------------------------------- function app (Flex Consumption)
resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: 'plan-${prefix}-${suffix}'
  location: location
  tags: tags
  kind: 'functionapp'
  sku: { name: 'FC1', tier: 'FlexConsumption' }
  properties: { reserved: true }
}

resource worker 'Microsoft.Web/sites@2024-04-01' = {
  name: 'func-${prefix}-${suffix}'
  location: location
  tags: tags
  kind: 'functionapp,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    functionAppConfig: {
      deployment: {
        storage: {
          type: 'blobContainer'
          value: '${storage.properties.primaryEndpoints.blob}deployment'
          authentication: { type: 'SystemAssignedIdentity' }
        }
      }
      scaleAndConcurrency: {
        maximumInstanceCount: 40
        instanceMemoryMB: 2048
      }
      runtime: { name: 'python', version: '3.12' }
    }
    siteConfig: {
      minTlsVersion: '1.2'
      appSettings: [
        { name: 'AzureWebJobsStorage__accountName', value: storage.name }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: insights.properties.ConnectionString }
        { name: 'STORAGE_ACCOUNT_NAME', value: storage.name }
        { name: 'KEY_VAULT_URI', value: vault.properties.vaultUri }
        { name: 'WRAP_KEY_NAME', value: wrapKey.name }
      ]
    }
  }
}

// ---------------------------------------------------------------- static web app (Free)
resource swa 'Microsoft.Web/staticSites@2023-12-01' = {
  name: 'swa-${prefix}-${suffix}'
  location: swaLocation
  tags: tags
  sku: { name: 'Free', tier: 'Free' }
  properties: {
    stagingEnvironmentPolicy: 'Disabled'
    allowConfigFileUpdates: true
  }
}

resource swaSettings 'Microsoft.Web/staticSites/config@2023-12-01' = {
  parent: swa
  name: 'appsettings'
  properties: {
    STORAGE_CONNECTION: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${storage.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
    // Managed API telemetry (requests, failures, exceptions) into the same App Insights.
    APPLICATIONINSIGHTS_CONNECTION_STRING: insights.properties.ConnectionString
  }
}

// ---------------------------------------------------------------- RBAC for the worker identity
var roles = {
  blobOwner: 'b7e6dc6d-f1e8-4753-8033-0f276bb0955b'        // Storage Blob Data Owner
  queueContributor: '974c5e8b-45b9-4653-ba55-5f855dd0fb88' // Storage Queue Data Contributor
  tableContributor: '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3' // Storage Table Data Contributor
  kvSecretsOfficer: 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7' // Key Vault Secrets Officer
  kvCryptoUser: '12338af0-0e69-4776-bea7-57ae8d297424'     // Key Vault Crypto User
  contributor: 'b24988ac-6180-42a0-ab88-20f7382dd24c'      // Contributor
}

resource storageRoles 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for r in [roles.blobOwner, roles.queueContributor, roles.tableContributor]: {
  scope: storage
  name: guid(storage.id, worker.id, r)
  properties: {
    principalId: worker.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', r)
  }
}]

resource vaultRoles 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for r in [roles.kvSecretsOfficer, roles.kvCryptoUser]: {
  scope: vault
  name: guid(vault.id, worker.id, r)
  properties: {
    principalId: worker.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', r)
  }
}]

// ---------------------------------------------------------------- GitHub Actions OIDC identity
resource github 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${prefix}-github-${suffix}'
  location: location
  tags: tags
}

resource githubFederation 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = {
  parent: github
  name: 'github-${githubBranch}'
  properties: {
    issuer: 'https://token.actions.githubusercontent.com'
    subject: 'repo:${githubRepo}:ref:refs/heads/${githubBranch}'
    audiences: ['api://AzureADTokenExchange']
  }
}

// Contributor on this resource group only: deploy function code, read the SWA
// deployment token at run time. Cannot grant roles or touch other groups.
resource githubRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, github.id, roles.contributor)
  properties: {
    principalId: github.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.contributor)
  }
}

output swaName string = swa.name
output swaHostname string = swa.properties.defaultHostname
output functionAppName string = worker.name
output storageName string = storage.name
output keyVaultName string = vault.name
output githubClientId string = github.properties.clientId
output tenantId string = subscription().tenantId
output subscriptionId string = subscription().subscriptionId
