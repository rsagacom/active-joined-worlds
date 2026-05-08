#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_PATH="${BIN_PATH:-$ROOT_DIR/target/release/lobster-waku-gateway}"
GATEWAY_ARTIFACT="${GATEWAY_ARTIFACT:-}"
HOST="${HOST:-127.0.0.1}"
UPSTREAM_PORT="${UPSTREAM_PORT:-18787}"
DOWNSTREAM_PORT="${DOWNSTREAM_PORT:-18788}"
KEEP_STATE="${KEEP_STATE:-0}"
SKIP_BUILD="${SKIP_BUILD:-0}"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing command: $1" >&2
    exit 1
  }
}

mktemp_dir() {
  local dir
  dir="$(mktemp -d "${TMPDIR:-/tmp}/lobster-chat-smoke.XXXXXX" 2>/dev/null)" \
    || dir="$(mktemp -d -t lobster-chat-smoke)"
  printf '%s\n' "$dir"
}

wait_for_health() {
  local name="$1"
  local url="$2"
  local attempt
  for attempt in $(seq 1 60); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.25
  done
  echo "timed out waiting for ${name} health: ${url}" >&2
  return 1
}

need_cmd cargo
need_cmd curl
need_cmd grep
need_cmd mktemp
need_cmd tar

if [[ -n "$GATEWAY_ARTIFACT" ]]; then
  if [[ ! -f "$GATEWAY_ARTIFACT" ]]; then
    echo "gateway artifact not found: $GATEWAY_ARTIFACT" >&2
    exit 1
  fi
fi

if [[ "$SKIP_BUILD" != "1" && -z "$GATEWAY_ARTIFACT" ]]; then
  echo "== building lobster-waku-gateway =="
  cargo build --manifest-path "$ROOT_DIR/Cargo.toml" --release -p lobster-waku-gateway
fi

STATE_ROOT="$(mktemp_dir)"
UPSTREAM_LOG="$STATE_ROOT/upstream.log"
DOWNSTREAM_LOG="$STATE_ROOT/downstream.log"
EXTRACT_DIR="$STATE_ROOT/extracted"
UPSTREAM_PID=""
DOWNSTREAM_PID=""

cleanup() {
  local exit_code=$?
  if [[ -n "$DOWNSTREAM_PID" ]] && kill -0 "$DOWNSTREAM_PID" >/dev/null 2>&1; then
    kill "$DOWNSTREAM_PID" >/dev/null 2>&1 || true
    wait "$DOWNSTREAM_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$UPSTREAM_PID" ]] && kill -0 "$UPSTREAM_PID" >/dev/null 2>&1; then
    kill "$UPSTREAM_PID" >/dev/null 2>&1 || true
    wait "$UPSTREAM_PID" >/dev/null 2>&1 || true
  fi
  if [[ "$KEEP_STATE" != "1" && -d "$STATE_ROOT" ]]; then
    rm -rf "$STATE_ROOT"
  fi
  exit "$exit_code"
}
trap cleanup EXIT

if [[ -n "$GATEWAY_ARTIFACT" ]]; then
  mkdir -p "$EXTRACT_DIR"
  tar -xzf "$GATEWAY_ARTIFACT" -C "$EXTRACT_DIR"
  BIN_PATH="$EXTRACT_DIR/lobster-waku-gateway"
fi

if [[ ! -x "$BIN_PATH" ]]; then
  echo "gateway binary not found: $BIN_PATH" >&2
  exit 1
fi

echo "== starting upstream gateway on :$UPSTREAM_PORT =="
"$BIN_PATH" \
  --host "$HOST" \
  --port "$UPSTREAM_PORT" \
  --state-dir "$STATE_ROOT/upstream" \
  >"$UPSTREAM_LOG" 2>&1 &
UPSTREAM_PID="$!"

echo "== starting downstream gateway on :$DOWNSTREAM_PORT bridged to upstream =="
"$BIN_PATH" \
  --host "$HOST" \
  --port "$DOWNSTREAM_PORT" \
  --state-dir "$STATE_ROOT/downstream" \
  --upstream-gateway-url "http://$HOST:$UPSTREAM_PORT" \
  >"$DOWNSTREAM_LOG" 2>&1 &
DOWNSTREAM_PID="$!"

wait_for_health "upstream" "http://$HOST:$UPSTREAM_PORT/health"
wait_for_health "downstream" "http://$HOST:$DOWNSTREAM_PORT/health"

provider_json="$(curl -fsS "http://$HOST:$DOWNSTREAM_PORT/v1/provider")"
printf '%s' "$provider_json" | grep -q '"mode":"remote-gateway"' || {
  echo "downstream gateway did not report remote-gateway mode" >&2
  echo "$provider_json" >&2
  exit 1
}
printf '%s' "$provider_json" | grep -q '"reachable":true' || {
  echo "downstream gateway reports upstream as unreachable" >&2
  echo "$provider_json" >&2
  exit 1
}

message="smoke-provider-federation-$(date +%s)"
payload="$(cat <<EOF
{"room_id":"room:world:lobby","sender":"smoke-bot","text":"$message","device_id":"smoke-script","language_tag":"en"}
EOF
)"

echo "== publishing shell message through downstream =="
curl -fsS \
  -H 'Content-Type: application/json' \
  -d "$payload" \
  "http://$HOST:$DOWNSTREAM_PORT/v1/shell/message" \
  >/dev/null

found=0
for _ in $(seq 1 60); do
  shell_state="$(curl -fsS "http://$HOST:$UPSTREAM_PORT/v1/shell/state" || true)"
  if printf '%s' "$shell_state" | grep -Fq "$message"; then
    found=1
    break
  fi
  sleep 0.25
done

if [[ "$found" != "1" ]]; then
  echo "upstream shell state never observed the downstream message" >&2
  echo "upstream log:   $UPSTREAM_LOG" >&2
  echo "downstream log: $DOWNSTREAM_LOG" >&2
  exit 1
fi

echo "== provider federation smoke passed =="
if [[ -n "$GATEWAY_ARTIFACT" ]]; then
  echo "gateway artifact: $GATEWAY_ARTIFACT"
else
  echo "gateway binary: $BIN_PATH"
fi
echo "provider status: $provider_json"
echo "state root: $STATE_ROOT"
if [[ "$KEEP_STATE" != "1" ]]; then
  echo "logs were temporary; rerun with KEEP_STATE=1 to inspect them."
fi
