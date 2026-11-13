# Ride Heatmap on Azure

Each invited rider signs in, adds their own Garmin Connect **Personal API**
key, and gets a heatmap of this year's rides: every road drawn once as a
continuous line, colored by how many rides covered it. Maps rebuild every
morning, or on demand.

Built to cost close to nothing for a handful of users, with no secrets in
this (public) repository.

```
Browser ──Microsoft sign-in (built-in, Entra)──> Static Web App (Free)
  web/  page                                     /api/* needs role "rider"
  api/  managed functions (Node 20)              (invite-only, max 25 on Free)
     │ PUT /api/key: key encrypted with a Key Vault RSA public key, then queued
     │ GET /api/heatmap: the rider's own blob
     ▼
Storage (private): queue jobs · table profiles · blobs tracks/, heatmaps/, config/
     ▲
Function App (Flex Consumption, Python 3.12, managed identity)   worker/
  queue "jobs": set-key · delete-key · refresh · purge-user
  timer 11:00 UTC daily: rebuild every rider with a key
Key Vault (RBAC): secret garmin-<uid> per rider + RSA key garmin-wrap
```

## Security model

- **Sign-in:** Static Web Apps' built-in Microsoft login. Anyone can sign
  in, but `/api/*` requires the `rider` role, which is granted only through
  invitation links (`invite.sh`). The API re-checks the role itself.
- **Rider identity:** an opaque id (`sha256(provider:userId)`, 32 hex chars).
  The raw provider id is never stored; the display name sits in the profile
  row only.
- **Garmin keys:** the API never stores them. It encrypts each submitted key
  with the public half of the Key Vault RSA key (RSA-OAEP-256) and queues
  it. The worker decrypts it inside Key Vault, validates it with Garmin, and
  saves it as a Key Vault secret. Keys are never returned to the browser.
  "Remove Garmin key" deletes the secret; "Delete my data" also removes the
  rider's tracks, heatmap and profile.
- **The one stored secret:** the Static Web Apps Free managed API can't use
  a managed identity, so its app settings hold a storage connection string.
  It lives in Azure (not in git), and it cannot decrypt Garmin keys.
- **Worker:** uses its managed identity for storage and Key Vault. There are
  no keys in its settings.
- **CI:** GitHub Actions logs in with OIDC (a federated credential on a
  user-assigned identity with Contributor on this resource group only). The
  Static Web Apps deployment token is fetched and masked at run time.
  Repository variables hold only IDs.
- **Headers:** a strict Content-Security-Policy (no inline scripts), with
  Leaflet loaded with Subresource Integrity (SRI) hashes.

## Cost (a few riders)

| Resource | Tier | Expected |
|---|---|---|
| Static Web App | Free | $0 |
| Function App | Flex Consumption (on-demand) | $0, inside the monthly free grant |
| Storage | Standard LRS | cents (a few MB, low transactions) |
| Key Vault | Standard, RSA 2048 software key | cents ($0.03 / 10k operations) |
| Log Analytics / App Insights | pay-as-you-go, 0.1 GB/day cap | $0, inside the 5 GB free tier |

## Deploy

One time, from a machine with `az` (Owner on the subscription), `func`,
`gh`, `jq` and Node:

```bash
cd heatmap-azure
OWNER_EMAIL=you@outlook.com ./deploy.sh      # infra, GitHub variables, first deploy, your invite
```

After that, pushing changes under `heatmap-azure/` to `main` deploys through
`.github/workflows/heatmap-azure.yml`. Re-run `deploy.sh` only when
`infra/main.bicep` changes.

Invite a rider (they must sign in with that Microsoft account):

```bash
./invite.sh friend@example.com        # prints a one-time invitation link (7 days)
```

## Notes

- **Garmin's terms:** Garmin describes the Personal API as for individuals
  accessing their own data, "not intended for commercial applications
  serving multiple end users." Keep this a small, free, invite-only app for
  people who knowingly add their own key.
- **Key expiry:** Personal API keys expire after 30 days to 1 year. When
  Garmin rejects a key, the rider's status shows "Garmin rejected your key"
  and they can add a new one.
- **Schedule:** the timer runs at 11:00 UTC (6:00 Toronto in winter, 7:00 in
  summer), since Linux Function Apps use UTC.
- **Shared code:** `worker/heatmap_core.py` holds the same builder as
  `ride-map/garmin_heatmap.py`. Keep the two in sync.
