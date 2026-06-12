#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8807}"
KEEP_STATE="${KEEP_STATE:-0}"
SKIP_BUILD="${SKIP_BUILD:-0}"
GATEWAY_BIN="${GATEWAY_BIN:-$ROOT_DIR/target/debug/lobster-waku-gateway}"
GATEWAY_PID=""
EVENTS_BODY=""

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing command: $1" >&2
    exit 1
  }
}

mktemp_dir() {
  local dir
  dir="$(mktemp -d "${TMPDIR:-/tmp}/lobster-shell-dual-http.XXXXXX" 2>/dev/null)" \
    || dir="$(mktemp -d -t lobster-shell-dual-http)"
  printf '%s\n' "$dir"
}

wait_for_health() {
  local url="$1"
  local attempt
  for attempt in $(seq 1 80); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.25
  done
  echo "timed out waiting for gateway health: $url" >&2
  return 1
}

json_assert() {
  local payload="$1"
  local mode="$2"
  JSON_PAYLOAD="$payload" python3 - "$mode" <<'PY'
import json
import os
import sys

mode = sys.argv[1]
raw_payload = os.environ["JSON_PAYLOAD"]
payload = None if mode == "event-body" else json.loads(raw_payload)

def conversations():
    return payload["conversation_shell"]["conversations"]

def find_message(text):
    for conversation in conversations():
        for message in conversation.get("messages", []):
            if message.get("text") == text:
                return conversation, message
    return None, None

if mode == "initial-state":
    assert isinstance(payload.get("state_version"), str) and payload["state_version"]
    assert conversations(), "state must expose conversations"
elif mode == "send-response":
    assert payload["delivery_status"] == "delivered"
    assert payload["message_id"]
    assert payload["sender"] == "qa-a"
    assert payload["text"] == os.environ["SMOKE_TEXT"]
elif mode == "peer-state":
    conversation, message = find_message(os.environ["SMOKE_TEXT"])
    assert conversation is not None, "peer viewer must see the public message"
    assert conversation["conversation_id"] == "room:city:core-harbor:lobby"
    assert message["sender"] == "qa-a"
    assert message["delivery_status"] == "delivered"
elif mode == "event-body":
    assert "event: shell-state" in raw_payload
    assert os.environ["SMOKE_TEXT"] in raw_payload
    data_lines = [
        line.removeprefix("data: ")
        for line in raw_payload.splitlines()
        if line.startswith("data: ") and os.environ["SMOKE_TEXT"] in line
    ]
    assert data_lines, "SSE shell-state must include the smoke message payload"
    event_payload = json.loads(data_lines[-1])
    payload = event_payload
    _conversation, event_message = find_message(os.environ["SMOKE_TEXT"])
    assert event_message is not None, "SSE message projection missing"
    assert event_message["sender"] == "qa-a"
    assert event_message["delivery_status"] == "delivered"
else:
    raise AssertionError(f"unsupported mode: {mode}")
PY
}

need_cmd curl
need_cmd python3

if [[ "$SKIP_BUILD" != "1" ]]; then
  need_cmd cargo
  echo "== building lobster-waku-gateway =="
  cargo build --manifest-path "$ROOT_DIR/Cargo.toml" -p lobster-waku-gateway >/dev/null
fi

if [[ ! -x "$GATEWAY_BIN" ]]; then
  echo "gateway binary not found: $GATEWAY_BIN" >&2
  exit 1
fi

STATE_ROOT="$(mktemp_dir)"
GATEWAY_LOG="$STATE_ROOT/gateway.log"
EVENTS_BODY="$STATE_ROOT/events.body"
EVENTS_PID=""
SMOKE_TEXT="${SMOKE_TEXT:-SHELL_DUAL_HTTP_SMOKE_$(date +%s)}"
export SMOKE_TEXT

cleanup() {
  local exit_code=$?
  if [[ -n "${EVENTS_PID:-}" ]] && kill -0 "$EVENTS_PID" >/dev/null 2>&1; then
    kill "$EVENTS_PID" >/dev/null 2>&1 || true
    wait "$EVENTS_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$GATEWAY_PID" ]] && kill -0 "$GATEWAY_PID" >/dev/null 2>&1; then
    kill "$GATEWAY_PID" >/dev/null 2>&1 || true
    wait "$GATEWAY_PID" >/dev/null 2>&1 || true
  fi
  if [[ "$KEEP_STATE" != "1" && -d "$STATE_ROOT" ]]; then
    rm -rf "$STATE_ROOT"
  fi
  exit "$exit_code"
}
trap cleanup EXIT

echo "== starting gateway on :$PORT =="
"$GATEWAY_BIN" \
  --host "$HOST" \
  --port "$PORT" \
  --state-dir "$STATE_ROOT/gateway" \
  >"$GATEWAY_LOG" 2>&1 &
GATEWAY_PID="$!"
wait_for_health "http://$HOST:$PORT/health"
GATEWAY_URL="http://$HOST:$PORT"

echo "== reading qa-b initial shell state =="
initial_state="$(curl -fsS "$GATEWAY_URL/v1/shell/state?resident_id=qa-b")"
json_assert "$initial_state" "initial-state"
initial_version="$(
  JSON_PAYLOAD="$initial_state" python3 - <<'PY'
import json
import os
print(json.loads(os.environ["JSON_PAYLOAD"])["state_version"])
PY
)"
encoded_after="$(
  INITIAL_VERSION="$initial_version" python3 - <<'PY'
import os
import urllib.parse
print(urllib.parse.quote(os.environ["INITIAL_VERSION"], safe=""))
PY
)"

echo "== waiting for qa-b shell events =="
curl -fsS \
  "$GATEWAY_URL/v1/shell/events?resident_id=qa-b&after=$encoded_after&wait_ms=4000" \
  >"$EVENTS_BODY" &
EVENTS_PID="$!"
sleep 0.2

echo "== qa-a sends public shell message =="
send_response_file="$STATE_ROOT/send-response.json"
curl -fsS \
    -X POST "$GATEWAY_URL/v1/shell/message" \
    -H 'content-type: application/json' \
    -d "{\"room_id\":\"room:city:core-harbor:lobby\",\"sender\":\"qa-a\",\"text\":\"$SMOKE_TEXT\",\"device_id\":\"shell-dual-http-smoke\",\"language_tag\":\"zh-CN\"}" \
    >"$send_response_file"
send_response="$(cat "$send_response_file")"
json_assert "$send_response" "send-response"

wait "$EVENTS_PID"
EVENTS_PID=""
event_body="$(cat "$EVENTS_BODY")"
json_assert "$event_body" "event-body"

echo "== qa-b sees qa-a delivered message =="
peer_state="$(curl -fsS "$GATEWAY_URL/v1/shell/state?resident_id=qa-b")"
json_assert "$peer_state" "peer-state"

echo "== shell dual HTTP smoke passed =="
echo "gateway: $GATEWAY_URL"
echo "message: $SMOKE_TEXT"
