#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "start-terminal.sh"


def main() -> int:
    assert SCRIPT.exists(), f"missing start terminal script: {SCRIPT}"
    text = SCRIPT.read_text(encoding="utf-8")

    assert text.startswith("#!/usr/bin/env bash")
    assert "set -euo pipefail" in text
    assert 'ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"' in text
    assert 'MODE="${1:-user}"' in text
    assert 'HOST="${HOST:-127.0.0.1}"' in text
    assert 'PORT="${PORT:-8787}"' in text
    assert 'STATE_DIR="${STATE_DIR:-$ROOT_DIR/.lobster-chat-dev/gateway}"' in text
    assert 'GATEWAY_URL="${LOBSTER_WAKU_GATEWAY_URL:-http://$HOST:$PORT}"' in text
    assert 'SKIP_BUILD="${SKIP_BUILD:-0}"' in text
    assert 'GATEWAY_BIN="${GATEWAY_BIN:-$ROOT_DIR/target/debug/lobster-waku-gateway}"' in text
    assert 'TUI_BIN="${TUI_BIN:-$ROOT_DIR/target/debug/lobster-tui}"' in text
    assert 'LOG_DIR="${LOG_DIR:-$ROOT_DIR/.lobster-chat-dev/logs}"' in text
    assert 'LOG_FILE="$LOG_DIR/gateway-terminal.log"' in text
    assert "wait_for_health()" in text
    assert 'curl -fsS "$url"' in text
    assert text.index('if [[ "$SKIP_BUILD" != "1" ]]; then') < text.index("need_cmd cargo")
    assert 'need_cmd curl' in text
    assert 'if [[ ! -t 0 || ! -t 1 ]]; then' in text
    assert "必须从交互式终端启动" in text
    assert 'if [[ ! -r /dev/tty || ! -w /dev/tty ]]; then' in text
    assert "无法进入交互式终端模式" in text
    assert 'mkdir -p "$LOG_DIR" "$(dirname "$STATE_DIR")"' in text
    assert 'if curl -fsS "$GATEWAY_URL/health" >/dev/null 2>&1; then' in text
    assert 'cargo build -p lobster-waku-gateway' in text
    assert 'if [[ ! -x "$GATEWAY_BIN" ]]; then' in text
    assert 'echo "gateway binary not found: $GATEWAY_BIN" >&2' in text
    assert 'nohup "$GATEWAY_BIN" \\' in text
    assert '--state-dir "$STATE_DIR"' in text
    assert 'wait_for_health "$GATEWAY_URL/health"' in text
    assert 'cargo build -p lobster-tui' in text
    assert 'if [[ ! -x "$TUI_BIN" ]]; then' in text
    assert 'echo "missing terminal binary: $TUI_BIN" >&2' in text
    assert 'exec env \\' in text
    assert 'LOBSTER_WAKU_GATEWAY_URL="$GATEWAY_URL"' in text
    assert '"$TUI_BIN" --mode "$MODE"' in text
    return 0


if __name__ == "__main__":
    sys.exit(main())
