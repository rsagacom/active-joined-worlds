#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "restart-gateway.sh"


def main() -> int:
    assert SCRIPT.exists(), f"missing restart gateway script: {SCRIPT}"
    text = SCRIPT.read_text(encoding="utf-8")

    assert 'PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"' in text
    assert 'PORT="${GATEWAY_PORT:-8787}"' in text
    assert 'LOG_FILE="${GATEWAY_LOG:-/tmp/lobster-gateway-${PORT}.log}"' in text
    assert 'SKIP_BUILD="${SKIP_BUILD:-0}"' in text
    assert 'BINARY="${GATEWAY_BIN:-$PROJECT_DIR/target/debug/lobster-waku-gateway}"' in text
    assert text.index('if [[ "$SKIP_BUILD" != "1" ]]; then') < text.index("need_cmd cargo")
    assert text.index("need_cmd cargo") < text.index('cargo build -p lobster-waku-gateway')
    assert 'if [[ ! -x "$BINARY" ]]' in text
    assert 'echo "gateway binary not found: $BINARY" >&2' in text
    assert text.index('if [[ ! -x "$BINARY" ]]') > text.index('fi\n\nif [[ ! -x "$BINARY" ]]')
    assert 'OLD_PID=$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)' in text
    assert 'kill "$OLD_PID" 2>/dev/null || true' in text
    assert 'nohup "$BINARY" > "$LOG_FILE" 2>&1 &' in text
    assert 'NEW_PID=$!' in text
    assert 'curl -sf http://127.0.0.1:"$PORT"/health' in text
    assert 'http://127.0.0.1:$PORT/v1/shell/state?resident_id=qa-a' in text
    assert 'http://127.0.0.1:$PORT/v1/admin/summary' in text
    assert 'Gateway ready on http://127.0.0.1:$PORT' in text
    assert 'Gateway failed to start. Check $LOG_FILE' in text
    return 0


if __name__ == "__main__":
    sys.exit(main())
