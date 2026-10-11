#!/bin/sh
# Copy the deck's model files into the app, unchanged. The deck repository is only read.
# Usage: scripts/sync-model.sh [path-to-chagee-deck]   (default: ../../chagee-deck)
set -e
DECK="${1:-$(cd "$(dirname "$0")/../../.." && pwd)/chagee-deck}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/src/model/vendor"
for f in sim/sim.js sim/store.js assumptions.json deck/build/data.json; do
  [ -f "$DECK/$f" ] || { echo "missing dependency: $DECK/$f" >&2; exit 1; }
done
cp "$DECK/sim/sim.js" "$DECK/sim/store.js" "$DECK/assumptions.json" "$DECK/deck/build/data.json" "$OUT/"
COMMIT=$(git -C "$DECK" rev-parse --short HEAD 2>/dev/null || echo unknown)
DIRTY=$(git -C "$DECK" status --porcelain 2>/dev/null | head -1)
printf '{\n  "deckCommit": "%s",\n  "deckDirty": %s,\n  "syncedAt": "%s"\n}\n' "$COMMIT" "$([ -n "$DIRTY" ] && echo true || echo false)" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$OUT/source.json"
echo "synced from $DECK @ $COMMIT"
