#!/bin/bash
# Restart lobster-waku-gateway on port 8787 with current source build
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${GATEWAY_PORT:-8787}"
LOG_FILE="${GATEWAY_LOG:-/tmp/lobster-gateway-${PORT}.log}"
BINARY="$PROJECT_DIR/target/debug/lobster-waku-gateway"

echo ">>> Building gateway..."
cd "$PROJECT_DIR"
cargo build -p lobster-waku-gateway 2>&1 | tail -3

echo ">>> Stopping old gateway on port $PORT..."
OLD_PID=$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)
if [ -n "$OLD_PID" ]; then
    echo "  Killing PID $OLD_PID"
    kill "$OLD_PID" 2>/dev/null || true
    sleep 1
fi

echo ">>> Starting gateway on port $PORT..."
nohup "$BINARY" > "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "  PID: $NEW_PID"
sleep 2

echo ">>> Health check..."
if curl -sf http://127.0.0.1:"$PORT"/health > /dev/null 2>&1; then
    echo "  /health: OK"
    echo "  /v1/shell/state?resident_id=qa-a: $(curl -sf "http://127.0.0.1:$PORT/v1/shell/state?resident_id=qa-a" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(f"{len(d[\"rooms\"])} rooms")' 2>/dev/null || echo 'FAIL')"
    echo "  /v1/admin/summary: $(curl -sf "http://127.0.0.1:$PORT/v1/admin/summary" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(f'{d[\"resident_count\"]} residents, {d[\"room_count\"]} rooms')' 2>/dev/null || echo 'FAIL')"
    echo ">>> Gateway ready on http://127.0.0.1:$PORT"
else
    echo ">>> ERROR: Gateway failed to start. Check $LOG_FILE"
    exit 1
fi
