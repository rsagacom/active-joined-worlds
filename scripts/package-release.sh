#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${DIST_DIR:-$ROOT_DIR/dist}"
SKIP_BUILD="${SKIP_BUILD:-0}"
HOST_TARGET_OVERRIDE="${HOST_TARGET_OVERRIDE:-}"
GATEWAY_BINARY_PATH="${GATEWAY_BINARY_PATH:-$ROOT_DIR/target/release/lobster-waku-gateway}"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing command: $1" >&2
    exit 1
  }
}

need_cmd tar

mkdir -p "$DIST_DIR"

if [[ -z "$HOST_TARGET_OVERRIDE" ]]; then
  need_cmd rustc
  host_target="$(rustc -vV | awk '/host:/ { print $2 }')"
else
  host_target="$HOST_TARGET_OVERRIDE"
fi
bin_name="lobster-waku-gateway-${host_target}"
binary_path="$GATEWAY_BINARY_PATH"

if [[ "$SKIP_BUILD" != "1" ]]; then
  need_cmd cargo
  echo "== building release gateway for $host_target =="
  cargo build --manifest-path "$ROOT_DIR/Cargo.toml" --release -p lobster-waku-gateway
fi

echo "== packaging source archive =="
tar \
  --exclude="$(basename "$ROOT_DIR")/.git" \
  --exclude="$(basename "$ROOT_DIR")/.playwright-cli" \
  --exclude=".DS_Store" \
  --exclude="*/.DS_Store" \
  --exclude="$(basename "$ROOT_DIR")/node_modules" \
  --exclude="*/node_modules" \
  --exclude="$(basename "$ROOT_DIR")/target" \
  --exclude="$(basename "$ROOT_DIR")/dist" \
  --exclude="$(basename "$ROOT_DIR")/.lobster-chat-dev" \
  --exclude="$(basename "$ROOT_DIR")/backups" \
  --exclude="*/backups" \
  --exclude="*/test-results" \
  --exclude="*/screenshots" \
  --exclude="*/.tmp" \
  --exclude="*.source.html" \
  --exclude="*/*.source.html" \
  -czf "$DIST_DIR/lobster-chat-source.tar.gz" \
  -C "$(dirname "$ROOT_DIR")" \
  "$(basename "$ROOT_DIR")"

echo "== packaging H5 shell =="
tar \
  --exclude="./node_modules" \
  --exclude="./backups" \
  --exclude="./.tmp" \
  --exclude="./test" \
  --exclude="./test-results" \
  --exclude="./screenshots" \
  --exclude="./*.mjs" \
  --exclude="./.DS_Store" \
  --exclude="*/.DS_Store" \
  --exclude="*.source.html" \
  --exclude="*/*.source.html" \
  -czf "$DIST_DIR/lobster-web-shell.tar.gz" \
  -C "$ROOT_DIR/apps/lobster-web-shell" \
  .

if [[ -x "$binary_path" ]]; then
  echo "== packaging gateway binary for $host_target =="
  tar -czf "$DIST_DIR/${bin_name}.tar.gz" -C "$(dirname "$binary_path")" lobster-waku-gateway
else
  echo "warning: release gateway binary not found at $binary_path" >&2
fi

echo "artifacts written to $DIST_DIR"
