#!/usr/bin/env bash
# One-time (and re-runnable) bootstrap for the Ride Heatmap on Azure.
#   - creates/updates the resource group and infra/main.bicep
#   - sets non-secret GitHub Actions variables for OIDC deploys
#   - deploys the worker and the site + API once from this machine
#   - optionally invites the first rider (OWNER_EMAIL)
# Needs: az (logged in, Owner on the subscription), func, gh, node/npm.
# Nothing secret is written to disk or to the repo.
set -euo pipefail
cd "$(dirname "$0")"

RG="${RG:-rg-ride-heatmap}"
LOCATION="${LOCATION:-canadacentral}"
REPO="${REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

echo "==> resource group $RG ($LOCATION)"
az group create -n "$RG" -l "$LOCATION" -o none

echo "==> infrastructure"
# Preserve existing AUTH0_* SWA settings on re-deploy if not overridden in env.
existing_swa=$(az staticwebapp list -g "$RG" --query "[0].name" -o tsv 2>/dev/null || true)
if [[ -n "$existing_swa" ]]; then
  existing_cfg=$(az staticwebapp appsettings list -n "$existing_swa" -g "$RG" --query properties -o json 2>/dev/null || echo '{}')
  AUTH0_DOMAIN="${AUTH0_DOMAIN:-$(jq -r '.AUTH0_DOMAIN // ""' <<<"$existing_cfg")}"
  AUTH0_CLIENT_ID="${AUTH0_CLIENT_ID:-$(jq -r '.AUTH0_CLIENT_ID // ""' <<<"$existing_cfg")}"
  AUTH0_AUDIENCE="${AUTH0_AUDIENCE:-$(jq -r '.AUTH0_AUDIENCE // ""' <<<"$existing_cfg")}"
  AUTH0_ROLES_CLAIM="${AUTH0_ROLES_CLAIM:-$(jq -r '.AUTH0_ROLES_CLAIM // "https://ride-heatmap/roles"' <<<"$existing_cfg")}"
fi
out=$(az deployment group create -g "$RG" -n heatmap -f infra/main.bicep \
  -p githubRepo="$REPO" \
     auth0Domain="${AUTH0_DOMAIN:-}" \
     auth0ClientId="${AUTH0_CLIENT_ID:-}" \
     auth0Audience="${AUTH0_AUDIENCE:-}" \
     auth0RolesClaim="${AUTH0_ROLES_CLAIM:-https://ride-heatmap/roles}" \
  --query properties.outputs -o json)
o() { jq -r ".$1.value" <<<"$out"; }
SWA=$(o swaName); HOST=$(o swaHostname); FUNC=$(o functionAppName); ST=$(o storageName)

echo "==> GitHub Actions variables on $REPO (IDs only, no secrets)"
gh variable set AZURE_CLIENT_ID       -R "$REPO" -b "$(o githubClientId)"
gh variable set AZURE_TENANT_ID       -R "$REPO" -b "$(o tenantId)"
gh variable set AZURE_SUBSCRIPTION_ID -R "$REPO" -b "$(o subscriptionId)"
gh variable set AZURE_RESOURCE_GROUP  -R "$REPO" -b "$RG"
gh variable set HEATMAP_FUNCTION_APP  -R "$REPO" -b "$FUNC"
gh variable set HEATMAP_SWA_NAME      -R "$REPO" -b "$SWA"

echo "==> worker -> $FUNC"
(cd worker && func azure functionapp publish "$FUNC" --python)

echo "==> ask the worker to publish the Key Vault wrap key"
az storage message put --account-name "$ST" --auth-mode key --queue-name jobs \
  --content "$(printf '{"op":"publish-key"}' | base64)" -o none

echo "==> site + API -> $SWA"
(cd api && npm ci --omit=dev --no-audit --no-fund --loglevel=error)
TOKEN=$(az staticwebapp secrets list -n "$SWA" -g "$RG" --query properties.apiKey -o tsv)
npx -y @azure/static-web-apps-cli@2 deploy ./web --api-location ./api \
  --api-language node --api-version 22 --env production --deployment-token "$TOKEN" >/dev/null
unset TOKEN

if [[ -n "${OWNER_EMAIL:-}" ]]; then
  echo "==> inviting $OWNER_EMAIL as rider"
  ./invite.sh "$OWNER_EMAIL"
fi

echo
echo "Done: https://$HOST"
