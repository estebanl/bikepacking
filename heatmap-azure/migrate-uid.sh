#!/usr/bin/env bash
# One-time migration of an existing rider's Azure data from an old Entra uid
# to their new Auth0 uid (sha256("auth0:" + auth0_sub)[0:32]).
#
# Usage:
#   ./migrate-uid.sh --list                    # list existing profile uids and names
#   ./migrate-uid.sh <old-uid> <auth0-sub>     # e.g. ./migrate-uid.sh 9f8a... "auth0|673..."
#
# Copies:
#   - Table "profiles" row (user, <old-uid>) -> (user, <new-uid>)
#   - Blobs in "tracks/<old-uid>/*" -> "tracks/<new-uid>/*"
#   - Blobs in "heatmaps/<old-uid>.json" and "heatmaps/<old-uid>/*"
#   - Key Vault secret "garmin-<old-uid>" -> "garmin-<new-uid>"
#
# Old data is left intact so you can verify the rider's map before deleting it.
set -euo pipefail

RG="${RG:-rg-ride-heatmap}"
ST=$(az storage account list -g "$RG" --query "[0].name" -o tsv)
KV=$(az keyvault list -g "$RG" --query "[0].name" -o tsv)
CONN=$(az storage account show-connection-string -n "$ST" -g "$RG" --query connectionString -o tsv)

if [[ "${1:-}" == "--list" ]]; then
  az storage entity query --connection-string "$CONN" --table-name profiles \
    --query "items[?PartitionKey=='user'].{uid:RowKey, name:displayName, hasKey:hasKey}" -o table
  exit 0
fi

OLD_UID="${1:?usage: migrate-uid.sh [--list | <old-uid> <auth0-sub>]}"
AUTH0_SUB="${2:?usage: migrate-uid.sh <old-uid> <auth0-sub>}"
NEW_UID=$(printf '%s' "auth0:${AUTH0_SUB}" | sha256sum | cut -c1-32)

if [[ "$OLD_UID" == "$NEW_UID" ]]; then
  echo "Old and new uid are identical ($OLD_UID)." >&2
  exit 1
fi

echo "Migrating $OLD_UID -> $NEW_UID (storage=$ST, vault=$KV)"

# 1. Profile table row
if entity=$(az storage entity show --connection-string "$CONN" --table-name profiles \
  --partition-key user --row-key "$OLD_UID" -o json 2>/dev/null); then
  args=$(python3 - "$NEW_UID" "$entity" <<'PY'
import json, sys
new_uid, raw = sys.argv[1], json.loads(sys.argv[2])
skip = {'PartitionKey', 'RowKey', 'Timestamp', 'etag'}
out = [f'PartitionKey=user', f'RowKey={new_uid}']
for k, v in raw.items():
    if k in skip or k.startswith('odata.') or '@' in k or v is None:
        continue
    if isinstance(v, bool):
        out.append(f'{k}={str(v).lower()}@Edm.Boolean')
    elif isinstance(v, int):
        out.append(f'{k}={v}@Edm.Int64')
    else:
        out.append(f'{k}={v}')
print(json.dumps(out))
PY
)
  mapfile -t entity_args < <(jq -r '.[]' <<<"$args")
  az storage entity insert --connection-string "$CONN" --table-name profiles \
    --if-exists replace --entity "${entity_args[@]}" -o none
  echo "  [ok] profile row copied"
else
  echo "  [skip] no profile row for $OLD_UID"
fi

# 2. Blobs in tracks/ and heatmaps/
copy_blob() {
  local container="$1" src="$2" dst="$3"
  local url
  url=$(az storage blob url --connection-string "$CONN" -c "$container" -n "$src" -o tsv)
  az storage blob copy start --connection-string "$CONN" \
    --destination-container "$container" --destination-blob "$dst" --source-uri "$url" -o none
}

for container in tracks heatmaps; do
  while IFS= read -r blob; do
    [[ -z "$blob" ]] && continue
    dst="${NEW_UID}${blob#"$OLD_UID"}"
    copy_blob "$container" "$blob" "$dst"
    echo "  [ok] $container/$blob -> $container/$dst"
  done < <(az storage blob list --connection-string "$CONN" -c "$container" --prefix "${OLD_UID}/" --query "[].name" -o tsv)
done

if az storage blob exists --connection-string "$CONN" -c heatmaps -n "${OLD_UID}.json" --query exists -o tsv | grep -q true; then
  copy_blob heatmaps "${OLD_UID}.json" "${NEW_UID}.json"
  echo "  [ok] heatmaps/${OLD_UID}.json -> heatmaps/${NEW_UID}.json"
fi

# 3. Key Vault secret
if secret=$(az keyvault secret show --vault-name "$KV" -n "garmin-${OLD_UID}" --query value -o tsv 2>/dev/null); then
  az keyvault secret set --vault-name "$KV" -n "garmin-${NEW_UID}" --value "$secret" -o none
  echo "  [ok] Key Vault secret garmin-${OLD_UID} -> garmin-${NEW_UID}"
else
  echo "  [skip] no Key Vault secret garmin-${OLD_UID}"
fi

echo "Done. Verify the rider can sign in and see their map before removing old data."
