# Ride Heatmap on Azure

Each invited rider signs in, adds their own Garmin Connect **Personal API**
key, and gets a heatmap of this year's rides: every road drawn once as a
continuous line, colored by how many rides covered it. Maps rebuild every
morning, or on demand.

Built to cost close to nothing for a handful of users, with no secrets in
this (public) repository.

```
Browser ──Auth0 SPA SDK (PKCE + refresh tokens)──> Static Web App (Free)
  web/  page                                       GET /api/config (public IDs)
  api/  managed functions (Node 22)                /api/* verifies Auth0 JWT + role "rider"
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

- **Sign-in:** Auth0 Universal Login via `@auth0/auth0-spa-js` (Authorization
  Code + PKCE). Anyone who signs in still needs the `rider` role in their
  Auth0 access token; the API verifies the JWT signature against Auth0's JWKS
  endpoint and requires the `rider` role on every `/api/*` call (except
  `GET /api/config`, which returns the non-secret `domain`, `clientId`, and
  `audience`).
- **Rider identity:** an opaque id (`sha256("auth0:" + sub)`, 32 hex chars).
  The raw provider `sub` is never stored; the display name sits in the profile
  row only.
- **Garmin keys:** the API never stores them. It encrypts each submitted key
  with a one-time AES-256-GCM key, wraps that with the public half of the
  Key Vault RSA key (RSA-OAEP-2048), and queues it. The worker has Key Vault
  unwrap the AES key, decrypts the Garmin key, validates it with Garmin, and
  saves it as a Key Vault secret. Keys are never returned to the browser.
  "Remove Garmin key" deletes the secret; "Delete my data" also removes the
  rider's tracks, heatmap and profile.
- **Deleting data:** "Delete my data" marks the profile before the purge is
  queued. A sync still running for that rider (possibly on another worker
  instance) checks the mark around every write, stops, and removes what it
  just wrote, so nothing reappears after the purge. Queued jobs carry the
  profile's generation id, so one delayed until after the rider starts over
  is dropped.
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
  Leaflet and `@auth0/auth0-spa-js` loaded with Subresource Integrity (SRI) hashes.

## Cost (a few riders)

| Resource | Tier | Expected |
|---|---|---|
| Static Web App | Free | $0 |
| Function App | Flex Consumption (on-demand) | $0, inside the monthly free grant |
| Storage | Standard LRS | cents (a few MB, low transactions) |
| Key Vault | Standard, RSA 2048 software key | cents ($0.03 / 10k operations) |
| Log Analytics / App Insights | pay-as-you-go, 0.1 GB/day cap | $0, inside the 5 GB free tier |
| Auth0 | Free | $0 (up to 25,000 MAU) |

## Auth0 setup (one-time)

You can run `./setup-auth0.sh https://<your-swa-hostname>` (requires `auth0 login` with the [Auth0 CLI](https://auth0.github.io/auth0-cli/)), or configure it manually in the Auth0 Dashboard:

1. **Create an API** in Auth0 Dashboard → *Applications → APIs* (e.g. identifier `https://ride-heatmap-api`, signing algorithm `RS256`).
2. **Create a Single Page Application** in *Applications → Applications*:
   - Allowed Callback URLs, Allowed Logout URLs, Allowed Web Origins: `https://<your-swa-hostname>` (and `http://localhost:4280` if testing locally).
   - Enable **Refresh Token Rotation** (required when third-party cookies are blocked).
3. **Create the `rider` role** in *User Management → Roles* (`rider`).
4. **Add a Post-Login Action** (*Actions → Triggers → post-login*) to include roles in the access token:
   ```js
   exports.onExecutePostLogin = async (event, api) => {
     const roles = event.authorization ? event.authorization.roles : [];
     api.accessToken.setCustomClaim('https://ride-heatmap/roles', roles);
     if (event.user.email) {
       api.accessToken.setCustomClaim('email', event.user.email);
     }
   };
   ```
5. *(Recommended)* Disable public sign-ups on your Database connection (*Authentication → Database → Settings → Disable Sign Ups*) so only invited users can log in.

## Deploy

One time, from a machine with `az` (Owner on the subscription), `func`,
`gh`, `jq` and Node:

```bash
cd heatmap-azure
AUTH0_DOMAIN=dev-xxxx.us.auth0.com \
AUTH0_CLIENT_ID=<spa-client-id> \
AUTH0_AUDIENCE=https://ride-heatmap-api \
./deploy.sh
```

After that, pushing changes under `heatmap-azure/` to `main` deploys through
`.github/workflows/heatmap-azure.yml`. Re-run `deploy.sh` only when
`infra/main.bicep` changes (existing `AUTH0_*` app settings are preserved if omitted).

Invite a rider (creates the Auth0 user if needed, assigns `rider`, and prints a one-time setup link):

```bash
AUTH0_MGMT_TOKEN=<mgmt-api-token> ./invite.sh friend@example.com
# or using an Auth0 Machine-to-Machine app:
AUTH0_M2M_CLIENT_ID=... AUTH0_M2M_CLIENT_SECRET=... ./invite.sh friend@example.com
```

### Migrating existing Entra riders

If you have existing riders from the previous Microsoft Entra setup, list their old `uid`s and copy each rider's profile, tracks, heatmaps, and Key Vault secret to their Auth0 `sub` (from Auth0 Dashboard → *User Management → Users*):

```bash
./migrate-uid.sh --list
./migrate-uid.sh <old-uid> "<auth0-user-id>"
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
