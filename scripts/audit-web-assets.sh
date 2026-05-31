#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/apps/lobster-web-shell"
ASSET_DIR="$WEB_DIR/assets"

if [[ ! -d "$ASSET_DIR" ]]; then
  echo "missing asset directory: $ASSET_DIR" >&2
  exit 1
fi

echo "== Largest web image assets =="
find "$ASSET_DIR" -type f \
  \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' -o -name '*.avif' \) \
  -print0 |
  xargs -0 ls -lh |
  sort -k5 -hr |
  head -30

echo
echo "== 256px derivative references =="
find "$ASSET_DIR" -type f -name '*-256.*' -print |
  while IFS= read -r asset_path; do
    rel_path="${asset_path#"$WEB_DIR"/}"
    refs="$(rg -l --fixed-strings "$rel_path" "$WEB_DIR" "$ROOT_DIR/docs" "$ROOT_DIR/scripts" 2>/dev/null | wc -l | tr -d ' ')"
    printf "%s\trefs=%s\n" "$rel_path" "$refs"
  done |
  sort

echo
echo "== Source or concept assets above 1MB =="
find "$ASSET_DIR" -type f \
  \( -name '*source*' -o -path '*/concepts/*' \) -size +1M -print0 |
  xargs -0 ls -lh 2>/dev/null || true
