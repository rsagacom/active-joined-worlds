#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-user}"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8787}"
STATE_DIR="${STATE_DIR:-$ROOT_DIR/.lobster-chat-dev/gateway}"
GATEWAY_URL="${LOBSTER_WAKU_GATEWAY_URL:-http://$HOST:$PORT}"
LOG_DIR="${LOG_DIR:-$ROOT_DIR/.lobster-chat-dev/logs}"
LOG_FILE="$LOG_DIR/gateway-terminal.log"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing command: $1" >&2
    exit 1
  }
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
  echo "timed out waiting for gateway: $url" >&2
  return 1
}

need_cmd cargo
need_cmd curl

if [[ ! -t 0 || ! -t 1 ]]; then
  echo "start-terminal.sh 必须从交互式终端启动；当前 stdin/stdout 不是 TTY。" >&2
  exit 1
fi

if [[ ! -r /dev/tty || ! -w /dev/tty ]]; then
  echo "当前环境不可访问 /dev/tty，无法进入交互式终端模式。" >&2
  exit 1
fi

mkdir -p "$LOG_DIR" "$(dirname "$STATE_DIR")"

if curl -fsS "$GATEWAY_URL/health" >/dev/null 2>&1; then
  echo "== reusing gateway: $GATEWAY_URL =="
else
  echo "== starting gateway: $GATEWAY_URL =="
  nohup cargo run -p lobster-waku-gateway -- \
    --host "$HOST" \
    --port "$PORT" \
    --state-dir "$STATE_DIR" \
    >"$LOG_FILE" 2>&1 &
  wait_for_health "$GATEWAY_URL/health"
  echo "== gateway ready, log: $LOG_FILE =="
fi

echo "== launching lobster terminal =="
echo "== mode: $MODE"
echo "== gateway: $GATEWAY_URL"
echo "== log: $LOG_FILE"
echo "== tips: startup focus stays on the conversation list; press i to enter input, Enter sends, /open switches the active conversation =="
echo "== /world switches to the world lobby, /governance only works when the current surface exposes a governance thread, /quit exits =="

echo "== building lobster terminal =="
cargo build -p lobster-tui

TTY_BIN="$ROOT_DIR/target/debug/lobster-tui"
if [[ ! -x "$TTY_BIN" ]]; then
  echo "missing built terminal binary: $TTY_BIN" >&2
  exit 1
fi

exec env \
  LOBSTER_WAKU_GATEWAY_URL="$GATEWAY_URL" \
  "$TTY_BIN" --mode "$MODE"
