#!/usr/bin/env bash
# One-time Auth0 tenant setup using the Auth0 CLI (https://auth0.github.io/auth0-cli/).
# Creates:
#   - API (RS256, offline_access enabled for refresh tokens)
#   - SPA Application (with callback / logout / web-origin URLs)
#   - "rider" role
#   - Post-Login Action that adds https://ride-heatmap/roles + email to the access token
#
# Usage:
#   auth0 login
#   ./setup-auth0.sh https://<your-swa-hostname> [api-audience]
set -euo pipefail

ORIGIN="${1:?usage: setup-auth0.sh https://<swa-hostname> [api-audience]}"
ORIGIN="${ORIGIN%/}"
AUDIENCE="${2:-https://ride-heatmap-api}"
ROLES_CLAIM="${AUTH0_ROLES_CLAIM:-https://ride-heatmap/roles}"

command -v auth0 >/dev/null || { echo "Install the Auth0 CLI first: https://auth0.github.io/auth0-cli/" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq is required." >&2; exit 1; }

DOMAIN=$(auth0 tenants list --json < /dev/null 2>/dev/null | jq -r '.[0].name // empty' || true)
if [[ -z "$DOMAIN" ]]; then
  echo "Not logged in to Auth0 CLI. Run: auth0 login" >&2
  exit 1
fi
echo "==> Using Auth0 tenant: $DOMAIN"

# 1. API
if ! auth0 apis list --json < /dev/null | jq -e --arg a "$AUDIENCE" '.[] | select(.identifier == $a)' >/dev/null; then
  echo "==> Creating API ($AUDIENCE)"
  auth0 apis create --data "$(jq -cn --arg id "$AUDIENCE" \
    '{name:"Ride Heatmap API", identifier:$id, signing_alg:"RS256", allow_offline_access:true}')" \
    --json < /dev/null >/dev/null
else
  echo "==> API already exists ($AUDIENCE)"
fi

# 2. SPA Application
CLIENT_ID=$(auth0 apps list --json < /dev/null | jq -r '.[] | select(.name == "Ride Heatmap") | .client_id' | head -n1)
if [[ -z "$CLIENT_ID" ]]; then
  echo "==> Creating SPA Application (Ride Heatmap)"
  CLIENT_ID=$(auth0 apps create --data "$(jq -cn --arg o "$ORIGIN" \
    '{name:"Ride Heatmap", app_type:"spa", oidc_conformant:true, callbacks:[$o], allowed_logout_urls:[$o], web_origins:[$o]}')" \
    --json < /dev/null | jq -er '.client_id')
else
  echo "==> SPA Application already exists ($CLIENT_ID)"
fi

# Enable Refresh Token Rotation on the SPA app
auth0 api patch "clients/${CLIENT_ID}" --data '{"oidc_conformant":true,"refresh_token":{"rotation_type":"rotating","expiration_type":"expiring","leeway":0,"token_lifetime":2592000,"infinite_token_lifetime":false,"idle_token_lifetime":1296000,"infinite_idle_token_lifetime":false}}' < /dev/null >/dev/null

# 3. "rider" role
if ! auth0 roles list --json < /dev/null | jq -e '.[] | select(.name == "rider")' >/dev/null; then
  echo "==> Creating role: rider"
  auth0 roles create --data '{"name":"rider","description":"Invited Ride Heatmap rider"}' --json < /dev/null >/dev/null
else
  echo "==> Role already exists: rider"
fi

# 4. Post-Login Action
ACTION_NAME="add-rider-roles"
ACTION_CODE=$(cat <<EOF
exports.onExecutePostLogin = async (event, api) => {
  const roles = event.authorization ? event.authorization.roles : [];
  api.accessToken.setCustomClaim('${ROLES_CLAIM}', roles);
  if (event.user.email) {
    api.accessToken.setCustomClaim('email', event.user.email);
  }
};
EOF
)
ACTION_ID=$(auth0 actions list --json < /dev/null | jq -r --arg n "$ACTION_NAME" '.[] | select(.name == $n) | .id' | head -n1)
if [[ -z "$ACTION_ID" ]]; then
  echo "==> Creating Post-Login Action ($ACTION_NAME)"
  ACTION_ID=$(auth0 actions create \
    --name "$ACTION_NAME" \
    --trigger post-login \
    --code "$ACTION_CODE" \
    --json --no-input < /dev/null | jq -er '.id')
else
  echo "==> Updating Post-Login Action ($ACTION_NAME)"
  auth0 actions update "$ACTION_ID" --code "$ACTION_CODE" --no-input < /dev/null >/dev/null
fi

echo "==> Deploying and binding Post-Login Action"
auth0 actions deploy "$ACTION_ID" < /dev/null >/dev/null
BINDINGS=$(auth0 api get actions/triggers/post-login/bindings < /dev/null | jq -c --arg id "$ACTION_ID" --arg name "$ACTION_NAME" '
  (.bindings // [])
  | map({ref: {type: "action_id", value: .action.id}, display_name: .display_name})
  | if any(.ref.value == $id) then . else . + [{ref: {type: "action_id", value: $id}, display_name: $name}] end
  | {bindings: .}
')
auth0 api patch actions/triggers/post-login/bindings --data "$BINDINGS" < /dev/null >/dev/null

echo
echo "Done! Next:"
echo "  1. (Recommended) In Auth0 Dashboard -> Authentication -> Database -> Settings, enable 'Disable Sign Ups'."
echo "  2. Deploy or update Azure SWA settings:"
echo "     AUTH0_DOMAIN=$DOMAIN AUTH0_CLIENT_ID=$CLIENT_ID AUTH0_AUDIENCE=$AUDIENCE ./deploy.sh"
