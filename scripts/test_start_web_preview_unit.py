#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "start-web-preview.sh"


def main() -> int:
    assert SCRIPT.exists(), f"missing web preview script: {SCRIPT}"
    text = SCRIPT.read_text(encoding="utf-8")

    assert text.startswith("#!/bin/zsh")
    assert 'ROOT_DIR="$(cd "$(dirname "${0:A}")/.." && pwd)"' in text
    assert 'PORT="${1:-${PREVIEW_PORT:-18080}}"' in text
    assert 'HOST="${PREVIEW_HOST:-127.0.0.1}"' in text
    assert 'ROOT="${PREVIEW_ROOT:-$ROOT_DIR/apps/lobster-web-shell}"' in text
    assert 'PIDFILE="${PREVIEW_PIDFILE:-${TMPDIR:-/tmp}/lobster-web-preview-${PORT}.pid}"' in text
    assert 'LOGFILE="${PREVIEW_LOGFILE:-${TMPDIR:-/tmp}/lobster-web-preview-${PORT}.log}"' in text
    assert "read_pidfile()" in text
    assert "cmdline_for_pid()" in text
    assert "contains_text()" in text
    assert "is_preview_process()" in text
    assert 'contains_text "$cmdline" "http.server"' in text
    assert 'contains_text "$cmdline" "--bind $HOST"' in text
    assert 'contains_text "$cmdline" "--directory $ROOT"' in text
    assert "listener_pids_for_port()" in text
    assert 'lsof -tiTCP:"$PORT" -sTCP:LISTEN' in text
    assert "wait_for_server()" in text
    assert 'curl -fsS "$url"' in text
    assert "reconcile_existing_preview()" in text
    assert 'echo "reusing preview pid=$pid port=$PORT url=http://$HOST:$PORT/"' in text
    assert 'echo "$listener" >"$PIDFILE"' in text
    assert "refusing to kill a non-preview process" in text
    assert "start_preview()" in text
    assert 'python_bin="python3"' in text
    assert 'python_bin="python"' in text
    assert 'setsid "$python_bin" -m http.server "$PORT" --bind "$HOST" --directory "$ROOT"' in text
    assert 'nohup "$python_bin" -m http.server "$PORT" --bind "$HOST" --directory "$ROOT"' in text
    assert 'echo $! >"$PIDFILE"' in text
    assert '[[ -d "$ROOT" ]]' in text
    assert 'echo "started pid=$NEW_PID port=$PORT root=$ROOT url=http://$HOST:$PORT/ log=$LOGFILE"' in text
    assert "preview failed to become ready" in text
    return 0


if __name__ == "__main__":
    sys.exit(main())
