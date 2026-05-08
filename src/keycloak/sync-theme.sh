#!/usr/bin/env bash
# sync-theme.sh — Copy Keycloak theme files directly into the running container.
#
# In start-dev mode Keycloak disables theme caching, so changes are visible
# immediately on the next browser refresh — no JAR rebuild or container restart
# required.
#
# Usage:
#   ./src/keycloak/sync-theme.sh           # sync all theme files
#   ./src/keycloak/sync-theme.sh login.ftl # sync a single file by name

set -euo pipefail

CONTAINER="${KC_CONTAINER:-keycloak}"
THEME_SRC="$(cd "$(dirname "$0")/providers/keycloak-phone-provider.resources/src/main/resources/theme/phone" && pwd)"
THEME_DEST="/opt/keycloak/themes/phone"

# Verify container is running
if ! docker inspect --format '{{.State.Running}}' "$CONTAINER" 2>/dev/null | grep -q true; then
  echo "Error: container '$CONTAINER' is not running." >&2
  exit 1
fi

if [[ $# -gt 0 ]]; then
  # Single-file mode: find the file under THEME_SRC and copy it
  FILE="$1"
  MATCH=$(find "$THEME_SRC" -name "$FILE" | head -1)
  if [[ -z "$MATCH" ]]; then
    echo "Error: '$FILE' not found under $THEME_SRC" >&2
    exit 1
  fi
  REL="${MATCH#$THEME_SRC/}"
  DEST_PATH="$THEME_DEST/$REL"
  docker cp "$MATCH" "$CONTAINER:$DEST_PATH"
  echo "Copied $REL → $CONTAINER:$DEST_PATH"
else
  # Full sync: copy every file, preserving directory structure
  echo "Syncing all theme files to $CONTAINER:$THEME_DEST ..."
  while IFS= read -r -d '' SRC_FILE; do
    REL="${SRC_FILE#$THEME_SRC/}"
    DEST_PATH="$THEME_DEST/$REL"
    docker cp "$SRC_FILE" "$CONTAINER:$DEST_PATH"
    echo "  $REL"
  done < <(find "$THEME_SRC" -type f -print0)
  echo "Done. Refresh your browser to see changes."
fi
