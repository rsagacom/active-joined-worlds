#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8800}"
KEEP_STATE="${KEEP_STATE:-0}"
SKIP_BUILD="${SKIP_BUILD:-0}"
GATEWAY_BIN="${GATEWAY_BIN:-$ROOT_DIR/target/debug/lobster-waku-gateway}"
CLI_BIN="${CLI_BIN:-$ROOT_DIR/target/debug/lobster-cli}"
TUI_BIN="${TUI_BIN:-$ROOT_DIR/target/debug/lobster-tui}"
GATEWAY_PID=""

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing command: $1" >&2
    exit 1
  }
}

mktemp_dir() {
  local dir
  dir="$(mktemp -d "${TMPDIR:-/tmp}/lobster-resident-smoke.XXXXXX" 2>/dev/null)" || dir="$(mktemp -d -t lobster-resident-smoke)"
  printf '%s
' "$dir"
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

need_cmd cargo
need_cmd curl
need_cmd python3

if [[ "$SKIP_BUILD" != "1" ]]; then
  cargo build --manifest-path "$ROOT_DIR/Cargo.toml" -p lobster-waku-gateway -p lobster-cli -p lobster-tui >/dev/null
fi

STATE_ROOT="$(mktemp_dir)"
GATEWAY_LOG="$STATE_ROOT/gateway.log"
GATEWAY_URL="http://$HOST:$PORT"
RESIDENT_ID="novel-reader"
JOIN_TEXT="USER_RESIDENT_MAINLINE_SMOKE_首条消息"
DM_PEER_ID="builder"
DM_TEXT="USER_RESIDENT_DM_SMOKE_私帖首条消息"
DM_CONVERSATION_ID="dm:builder:novel-reader"
RESIDENCE_CONVERSATION_ID="dm:guide:novel-reader"

cleanup() {
  local exit_code=$?
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

LOBSTER_DEV_EMAIL_OTP_INLINE=1 "$GATEWAY_BIN"   --host "$HOST"   --port "$PORT"   --state-dir "$STATE_ROOT/gateway"   >"$GATEWAY_LOG" 2>&1 &
GATEWAY_PID="$!"
wait_for_health "$GATEWAY_URL/health"

join_unregistered_body="$STATE_ROOT/join-unregistered.json"
join_unregistered_status="$(curl -sS -o "$join_unregistered_body" -w '%{http_code}' -X POST "$GATEWAY_URL/v1/cities/join" -H 'content-type: application/json' -d '{"city":"core-harbor","resident_id":"guest-01"}')"
[[ "$join_unregistered_status" == "400" ]] || {
  echo "expected unregistered join to fail with 400" >&2
  cat "$join_unregistered_body" >&2 || true
  exit 1
}
grep -F 'not registered' "$join_unregistered_body" >/dev/null || {
  echo "expected unregistered join response to mention registration" >&2
  cat "$join_unregistered_body" >&2 || true
  exit 1
}

preflight_allowed="$(curl -fsS -X POST "$GATEWAY_URL/v1/auth/preflight" -H 'content-type: application/json' -d '{"email":"novel.reader@example.com","mobile":"+86 13800138000","device_physical_address":"66:55:44:33:22:11"}')"
JSON_PAYLOAD="$preflight_allowed" python3 - <<'PY2'
import json, os
payload = json.loads(os.environ['JSON_PAYLOAD'])
assert payload['allowed'] is True
assert payload['blocked_reasons'] == []
PY2

otp_request="$(curl -fsS -X POST "$GATEWAY_URL/v1/auth/email-otp/request" -H 'content-type: application/json' -d '{"email":"novel.reader@example.com","mobile":"+86 13800138000","device_physical_address":"66:55:44:33:22:11","resident_id":"novel-reader"}')"
challenge_id="$(JSON_PAYLOAD="$otp_request" python3 - <<'PY2'
import json, os
print(json.loads(os.environ['JSON_PAYLOAD'])['challenge_id'])
PY2
)"
dev_code="$(JSON_PAYLOAD="$otp_request" python3 - <<'PY2'
import json, os
print(json.loads(os.environ['JSON_PAYLOAD'])['dev_code'])
PY2
)"

otp_verify="$(curl -fsS -X POST "$GATEWAY_URL/v1/auth/email-otp/verify" -H 'content-type: application/json' -d "{\"challenge_id\":\"$challenge_id\",\"code\":\"$dev_code\",\"resident_id\":\"$RESIDENT_ID\"}")"
JSON_PAYLOAD="$otp_verify" python3 - <<'PY2'
import json, os
payload = json.loads(os.environ['JSON_PAYLOAD'])
assert payload['resident_id'] == 'novel-reader'
assert payload['state'] == 'Active'
PY2

join_registered="$(curl -fsS -X POST "$GATEWAY_URL/v1/cities/join" -H 'content-type: application/json' -d '{"city":"core-harbor","resident_id":"novel-reader"}')"
JSON_PAYLOAD="$join_registered" python3 - <<'PY2'
import json, os
payload = json.loads(os.environ['JSON_PAYLOAD'])
assert payload['resident_id'] == 'novel-reader'
assert payload['state'] == 'Active'
PY2

residents_json="$(curl -fsS "$GATEWAY_URL/v1/residents")"
JSON_PAYLOAD="$residents_json" python3 - <<'PY2'
import json, os
payload = json.loads(os.environ['JSON_PAYLOAD'])
record = next(item for item in payload if item['resident_id'] == 'novel-reader')
assert 'core-harbor' in record['active_cities']
PY2

rooms_json="$($CLI_BIN rooms --for "user:$RESIDENT_ID" --gateway "$GATEWAY_URL" --json)"
JSON_PAYLOAD="$rooms_json" python3 - <<'PY2'
import json, os
payload = json.loads(os.environ['JSON_PAYLOAD'])
conversation_ids = {entry['conversation_id'] for entry in payload['entries']}
assert 'room:city:core-harbor:lobby' in conversation_ids
assert 'dm:guide:novel-reader' in conversation_ids
PY2

direct_snapshot="$(
  LOBSTER_WAKU_GATEWAY_URL="$GATEWAY_URL" \
  LOBSTER_TUI_STATE_DIR="$STATE_ROOT/tui-direct" \
  LOBSTER_TUI_RESIDENT_ID="$RESIDENT_ID" \
  LOBSTER_TUI_SMOKE_DUMP=json \
  "$TUI_BIN" --mode direct
)"
JSON_PAYLOAD="$direct_snapshot" python3 - <<'PY2'
import json, os
payload = json.loads(os.environ['JSON_PAYLOAD'])
assert payload['surface_kind'] == 'ResidenceDirect'
assert payload['active_conversation_id'] == 'dm:guide:novel-reader'
assert 'actions' in payload['visible_panels']
PY2

LOBSTER_WAKU_GATEWAY_URL="$GATEWAY_URL" \
LOBSTER_TUI_STATE_DIR="$STATE_ROOT/tui-state" \
LOBSTER_TUI_RESIDENT_ID="$RESIDENT_ID" \
LOBSTER_TUI_SMOKE_DUMP=plain \
LOBSTER_TUI_SMOKE_SCRIPT="$(printf '%s\n%s\n%s\n' "$JOIN_TEXT" "/dm $DM_PEER_ID" "$DM_TEXT")" \
"$TUI_BIN" --mode user >/dev/null

tail_json="$($CLI_BIN tail --for "user:$RESIDENT_ID" --conversation-id room:city:core-harbor:lobby --gateway "$GATEWAY_URL" --json)"
JSON_PAYLOAD="$tail_json" python3 - <<'PY2'
import json, os
payload = json.loads(os.environ['JSON_PAYLOAD'])
assert any(item['text'] == 'USER_RESIDENT_MAINLINE_SMOKE_首条消息' for item in payload['messages'])
PY2

dm_tail_json="$($CLI_BIN tail --for "user:$RESIDENT_ID" --conversation-id "$DM_CONVERSATION_ID" --gateway "$GATEWAY_URL" --json)"
JSON_PAYLOAD="$dm_tail_json" python3 - <<'PY2'
import json, os
payload = json.loads(os.environ['JSON_PAYLOAD'])
assert any(item['text'] == 'USER_RESIDENT_DM_SMOKE_私帖首条消息' for item in payload['messages'])
PY2

echo "resident mainline smoke passed"
echo "gateway: $GATEWAY_URL"
echo "state root: $STATE_ROOT"
