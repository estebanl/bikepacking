#!/usr/bin/env bash
# Invite someone to the Ride Heatmap: prints a one-time invitation link that
# grants the "rider" role after they sign in with that Microsoft account.
# Usage: ./invite.sh person@example.com [hours-valid]
set -euo pipefail
EMAIL="${1:?usage: invite.sh email [hours]}"
HOURS="${2:-168}"
RG="${RG:-rg-ride-heatmap}"
SWA=$(az staticwebapp list -g "$RG" --query "[0].name" -o tsv)
HOST=$(az staticwebapp show -n "$SWA" -g "$RG" --query defaultHostname -o tsv)
az staticwebapp users invite -n "$SWA" -g "$RG" \
  --authentication-provider aad --user-details "$EMAIL" --role rider \
  --domain "$HOST" --invitation-expiration-in-hours "$HOURS" \
  --query invitationUrl -o tsv
