#!/usr/bin/env bash
# Invite someone to the Ride Heatmap via the Auth0 Management API:
#   - creates the user (if needed) in Username-Password-Authentication
#   - assigns the "rider" role
#   - prints a one-time password-setup / invitation link
#
# Usage:
#   AUTH0_DOMAIN=dev-xxx.us.auth0.com AUTH0_MGMT_TOKEN=... ./invite.sh person@example.com [hours-valid]
#   # or with an M2M app (read:users create:users read:roles create:role_members create:user_tickets):
#   AUTH0_DOMAIN=... AUTH0_M2M_CLIENT_ID=... AUTH0_M2M_CLIENT_SECRET=... ./invite.sh person@example.com [hours-valid]
set -euo pipefail

EMAIL="${1:?usage: invite.sh email [hours]}"
HOURS="${2:-168}"
TTL_SEC=$((HOURS * 3600))
CONNECTION="${AUTH0_CONNECTION:-Username-Password-Authentication}"

if [[ -z "${AUTH0_DOMAIN:-}" ]]; then
  RG="${RG:-rg-ride-heatmap}"
  SWA=$(az staticwebapp list -g "$RG" --query "[0].name" -o tsv)
  AUTH0_DOMAIN=$(az staticwebapp appsettings list -n "$SWA" -g "$RG" --query "properties.AUTH0_DOMAIN" -o tsv)
fi
AUTH0_DOMAIN="${AUTH0_DOMAIN#https://}"
AUTH0_DOMAIN="${AUTH0_DOMAIN%/}"
: "${AUTH0_DOMAIN:?Set AUTH0_DOMAIN (e.g. dev-xxx.us.auth0.com)}"

if [[ -n "${AUTH0_MGMT_TOKEN:-}" ]]; then
  TOKEN="$AUTH0_MGMT_TOKEN"
else
  : "${AUTH0_M2M_CLIENT_ID:?Set AUTH0_MGMT_TOKEN or AUTH0_M2M_CLIENT_ID + AUTH0_M2M_CLIENT_SECRET}"
  : "${AUTH0_M2M_CLIENT_SECRET:?Set AUTH0_M2M_CLIENT_SECRET}"
  TOKEN=$(curl -fsS -X POST "https://${AUTH0_DOMAIN}/oauth/token" \
    -H 'Content-Type: application/json' \
    -d "$(jq -n --arg cid "$AUTH0_M2M_CLIENT_ID" --arg sec "$AUTH0_M2M_CLIENT_SECRET" --arg aud "https://${AUTH0_DOMAIN}/api/v2/" \
      '{grant_type:"client_credentials", client_id:$cid, client_secret:$sec, audience:$aud}')" \
    | jq -er '.access_token')
fi

api() {
  local method="$1" path="$2" body="${3:-}"
  if [[ -n "$body" ]]; then
    curl -fsS -X "$method" "https://${AUTH0_DOMAIN}/api/v2${path}" \
      -H "Authorization: Bearer ${TOKEN}" -H 'Content-Type: application/json' -d "$body"
  else
    curl -fsS -X "$method" "https://${AUTH0_DOMAIN}/api/v2${path}" \
      -H "Authorization: Bearer ${TOKEN}"
  fi
}

ROLE_ID=$(api GET "/roles?name_filter=rider" | jq -er '.[] | select(.name=="rider") | .id')
ENC_EMAIL=$(jq -rn --arg e "$EMAIL" '$e|@uri')
USER_ID=$(api GET "/users-by-email?email=${ENC_EMAIL}" | jq -r '.[0].user_id // empty')

if [[ -z "$USER_ID" ]]; then
  RAND_PW=$(openssl rand -base64 24)
  USER_ID=$(api POST "/users" "$(jq -n --arg email "$EMAIL" --arg conn "$CONNECTION" --arg pw "$RAND_PW" \
    '{email:$email, connection:$conn, password:$pw, email_verified:false}')" | jq -er '.user_id')
fi

api POST "/users/${USER_ID}/roles" "$(jq -n --arg r "$ROLE_ID" '{roles:[$r]}')" >/dev/null

TICKET=$(api POST "/tickets/password-change" "$(jq -n --arg uid "$USER_ID" --argjson ttl "$TTL_SEC" \
  '{user_id:$uid, ttl_sec:$ttl, mark_email_as_verified:true}')" | jq -er '.ticket')

echo "$TICKET"
