#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${DIST_DIR:-$ROOT_DIR/dist}"
SKIP_BUILD="${SKIP_BUILD:-0}"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing command: $1" >&2
    exit 1
  }
}

need_cmd tar
need_cmd rustc
need_cmd cargo

mkdir -p "$DIST_DIR"

host_target="$(rustc -vV | awk '/host:/ { print $2 }')"
bin_name="lobster-waku-gateway-${host_target}"
binary_path="$ROOT_DIR/target/release/lobster-waku-gateway"

if [[ "$SKIP_BUILD" != "1" ]]; then
  echo "== building release gateway for $host_target =="
  cargo build --manifest-path "$ROOT_DIR/Cargo.toml" --release -p lobster-waku-gateway
fi

echo "== packaging source archive =="
tar \
  --exclude="$(basename "$ROOT_DIR")/target" \
  --exclude="$(basename "$ROOT_DIR")/dist" \
  --exclude="$(basename "$ROOT_DIR")/.lobster-chat-dev" \
  --exclude="$(basename "$ROOT_DIR")/backups" \
  -czf "$DIST_DIR/lobster-chat-source.tar.gz" \
  -C "$(dirname "$ROOT_DIR")" \
  "$(basename "$ROOT_DIR")"

echo "== packaging H5 shell =="
tar -czf "$DIST_DIR/lobster-web-shell.tar.gz" -C "$ROOT_DIR/apps/lobster-web-shell" .

if [[ -x "$binary_path" ]]; then
  echo "== packaging gateway binary for $host_target =="
  tar -czf "$DIST_DIR/${bin_name}.tar.gz" -C "$(dirname "$binary_path")" lobster-waku-gateway
else
  echo "warning: release gateway binary not found at $binary_path" >&2
fi

echo "artifacts written to $DIST_DIR"
