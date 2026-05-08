#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8796}"
KEEP_STATE="${KEEP_STATE:-0}"
SKIP_BUILD="${SKIP_BUILD:-0}"
MESSAGE_TEXT="${MESSAGE_TEXT:-晚上一起吃饭吗}"
FOLLOW_TEXT="${FOLLOW_TEXT:-FOLLOW_SMOKE_探针消息}"
FOLLOW_RESTART_TEXT="${FOLLOW_RESTART_TEXT:-FOLLOW_RESTART_SMOKE_探针消息}"
GATEWAY_BIN="${GATEWAY_BIN:-$ROOT_DIR/target/debug/lobster-waku-gateway}"
CLI_BIN="${CLI_BIN:-$ROOT_DIR/target/debug/lobster-cli}"
FOLLOW_PID=""

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing command: $1" >&2
    exit 1
  }
}

json_check() {
  local payload="$1"
  local mode="$2"
  local expected="$3"
  JSON_PAYLOAD="$payload" python3 - "$mode" "$expected" <<'PY'
import json
import os
import sys

mode = sys.argv[1]
expected = sys.argv[2]
payload = json.loads(os.environ["JSON_PAYLOAD"])

if mode == "send":
    assert payload["ok"] is True
    assert payload["conversation_id"] == expected
    assert payload["message_id"]
    assert isinstance(payload["delivered_at_ms"], int)
elif mode == "inbox":
    assert payload["identity"] == expected
    assert any(item["conversation_id"] == "dm:openclaw:zhangsan" for item in payload["conversations"])
elif mode == "rooms":
    assert payload["identity"] == expected
    assert any(item["conversation_id"] == "dm:openclaw:zhangsan" for item in payload["entries"])
elif mode == "tail":
    assert payload["identity"] == expected
    assert payload["conversation_id"] == "dm:openclaw:zhangsan"
    assert payload["messages"]
else:
    raise AssertionError(f"unsupported mode: {mode}")
PY
}

mktemp_dir() {
  local dir
  dir="$(mktemp -d "${TMPDIR:-/tmp}/lobster-cli-smoke.XXXXXX" 2>/dev/null)" \
    || dir="$(mktemp -d -t lobster-cli-smoke)"
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

start_gateway() {
  echo "== starting gateway on :$PORT =="
  "$GATEWAY_BIN" \
    --host "$HOST" \
    --port "$PORT" \
    --state-dir "$STATE_ROOT/gateway" \
    >"$GATEWAY_LOG" 2>&1 &
  GATEWAY_PID="$!"
  wait_for_health "http://$HOST:$PORT/health"
}

stop_gateway() {
  if [[ -n "$GATEWAY_PID" ]] && kill -0 "$GATEWAY_PID" >/dev/null 2>&1; then
    kill "$GATEWAY_PID" >/dev/null 2>&1 || true
    wait "$GATEWAY_PID" >/dev/null 2>&1 || true
  fi
  GATEWAY_PID=""
}

wait_for_follow_line() {
  local log_path="$1"
  local expected_text="$2"
  local deadline
  deadline=$((SECONDS + 15))
  while (( SECONDS < deadline )); do
    if FOLLOW_LOG_PATH="$log_path" FOLLOW_EXPECTED_TEXT="$expected_text" python3 - <<'PY'
import json
import os
import pathlib
import sys

path = pathlib.Path(os.environ["FOLLOW_LOG_PATH"])
expected = os.environ["FOLLOW_EXPECTED_TEXT"]
if not path.exists():
    raise SystemExit(1)

hits = 0
for raw in path.read_text(encoding="utf-8").splitlines():
    raw = raw.strip()
    if not raw or not raw.startswith("{"):
        continue
    payload = json.loads(raw)
    if payload.get("text") == expected:
        hits += 1

if hits == 1:
    raise SystemExit(0)
raise SystemExit(1)
PY
    then
      return 0
    fi
    sleep 0.25
  done
  echo "tail --follow did not emit expected single JSON line: $expected_text" >&2
  return 1
}

need_cmd cargo
need_cmd curl
need_cmd grep
need_cmd mktemp
need_cmd python3

if [[ "$SKIP_BUILD" != "1" ]]; then
  echo "== building lobster-waku-gateway + lobster-cli =="
  cargo build --manifest-path "$ROOT_DIR/Cargo.toml" -p lobster-waku-gateway -p lobster-cli
fi

if [[ ! -x "$GATEWAY_BIN" ]]; then
  echo "gateway binary not found: $GATEWAY_BIN" >&2
  exit 1
fi

if [[ ! -x "$CLI_BIN" ]]; then
  echo "cli binary not found: $CLI_BIN" >&2
  exit 1
fi

STATE_ROOT="$(mktemp_dir)"
GATEWAY_LOG="$STATE_ROOT/gateway.log"
GATEWAY_PID=""

cleanup() {
  local exit_code=$?
  if [[ -n "$FOLLOW_PID" ]] && kill -0 "$FOLLOW_PID" >/dev/null 2>&1; then
    kill "$FOLLOW_PID" >/dev/null 2>&1 || true
    wait "$FOLLOW_PID" >/dev/null 2>&1 || true
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

start_gateway
GATEWAY_URL="http://$HOST:$PORT"

echo "== sending direct message =="
send_output="$("$CLI_BIN" send \
  --from agent:openclaw \
  --to user:zhangsan \
  --text "$MESSAGE_TEXT" \
  --gateway "$GATEWAY_URL")"
printf '%s\n' "$send_output"
printf '%s' "$send_output" | grep -F "已投递到 dm:openclaw:zhangsan" >/dev/null || {
  echo "unexpected send output" >&2
  exit 1
}

echo "== checking inbox =="
inbox_output="$("$CLI_BIN" inbox --for user:zhangsan --gateway "$GATEWAY_URL")"
printf '%s\n' "$inbox_output"
printf '%s' "$inbox_output" | grep -F "收件箱 user:zhangsan" >/dev/null || {
  echo "inbox header missing" >&2
  exit 1
}
printf '%s' "$inbox_output" | grep -F "$MESSAGE_TEXT" >/dev/null || {
  echo "inbox did not include sent preview" >&2
  exit 1
}

echo "== checking rooms =="
rooms_output="$("$CLI_BIN" rooms --for user:zhangsan --gateway "$GATEWAY_URL")"
printf '%s\n' "$rooms_output"
printf '%s' "$rooms_output" | grep -F "会话列表 user:zhangsan" >/dev/null || {
  echo "rooms header missing" >&2
  exit 1
}
# Direct threads now render from the viewer's perspective instead of the raw route id.
printf '%s' "$rooms_output" | grep -F "正在与 openclaw 聊天" >/dev/null || {
  echo "rooms did not include viewer-specific direct title" >&2
  exit 1
}

echo "== checking tail =="
tail_output="$("$CLI_BIN" tail --for user:zhangsan --gateway "$GATEWAY_URL")"
printf '%s\n' "$tail_output"
printf '%s' "$tail_output" | grep -F "消息流 dm:openclaw:zhangsan" >/dev/null || {
  echo "tail header missing" >&2
  exit 1
}
printf '%s' "$tail_output" | grep -F "$MESSAGE_TEXT" >/dev/null || {
  echo "tail did not include sent message" >&2
  exit 1
}

echo "== checking json mode =="
send_json="$("$CLI_BIN" send \
  --from agent:openclaw \
  --to user:lisi \
  --text "JSON第二条" \
  --gateway "$GATEWAY_URL" \
  --json)"
printf '%s\n' "$send_json"
json_check "$send_json" "send" "dm:lisi:openclaw"

inbox_json="$("$CLI_BIN" inbox --for user:zhangsan --gateway "$GATEWAY_URL" --json)"
printf '%s\n' "$inbox_json"
json_check "$inbox_json" "inbox" "user:zhangsan"

rooms_json="$("$CLI_BIN" rooms --for user:zhangsan --gateway "$GATEWAY_URL" --json)"
printf '%s\n' "$rooms_json"
json_check "$rooms_json" "rooms" "user:zhangsan"

tail_json="$("$CLI_BIN" tail --for user:zhangsan --gateway "$GATEWAY_URL" --json)"
printf '%s\n' "$tail_json"
json_check "$tail_json" "tail" "user:zhangsan"

echo "== checking tail --follow live mode =="
FOLLOW_LOG="$STATE_ROOT/tail-follow.jsonl"
"$CLI_BIN" tail \
  --for user:zhangsan \
  --conversation-id dm:openclaw:zhangsan \
  --gateway "$GATEWAY_URL" \
  --json \
  --follow \
  >"$FOLLOW_LOG" 2>&1 &
FOLLOW_PID="$!"
sleep 1
"$CLI_BIN" send \
  --from agent:openclaw \
  --to user:zhangsan \
  --text "$FOLLOW_TEXT" \
  --gateway "$GATEWAY_URL" \
  >/dev/null
wait_for_follow_line "$FOLLOW_LOG" "$FOLLOW_TEXT"

echo "== checking tail --follow recovery across gateway restart =="
stop_gateway
start_gateway
"$CLI_BIN" send \
  --from agent:openclaw \
  --to user:zhangsan \
  --text "$FOLLOW_RESTART_TEXT" \
  --gateway "$GATEWAY_URL" \
  >/dev/null
wait_for_follow_line "$FOLLOW_LOG" "$FOLLOW_RESTART_TEXT"

kill "$FOLLOW_PID" >/dev/null 2>&1 || true
wait "$FOLLOW_PID" >/dev/null 2>&1 || true
FOLLOW_PID=""

echo "== lobster-cli smoke passed =="
echo "gateway: $GATEWAY_URL"
echo "state root: $STATE_ROOT"
if [[ "$KEEP_STATE" != "1" ]]; then
  echo "logs were temporary; rerun with KEEP_STATE=1 to inspect them."
fi
