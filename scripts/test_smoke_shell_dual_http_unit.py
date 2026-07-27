#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "smoke-shell-dual-http.sh"


def main() -> int:
    assert SCRIPT.exists(), f"missing shell dual HTTP smoke script: {SCRIPT}"
    text = SCRIPT.read_text(encoding="utf-8")

    assert "set -euo pipefail" in text
    assert 'PORT="${PORT:-}"' in text
    assert 'KEEP_STATE="${KEEP_STATE:-0}"' in text
    assert 'SKIP_BUILD="${SKIP_BUILD:-0}"' in text
    assert 'GATEWAY_BIN="${GATEWAY_BIN:-$ROOT_DIR/target/debug/lobster-waku-gateway}"' in text
    assert 'mktemp -d "${TMPDIR:-/tmp}/lobster-shell-dual-http.XXXXXX"' in text
    assert "wait_for_health()" in text
    assert "json_assert()" in text
    assert 'mode == "initial-state"' in text
    assert 'payload["conversation_shell"]["conversations"]' in text
    assert 'mode == "send-response"' in text
    assert 'payload["delivery_status"] == "delivered"' in text
    assert 'payload["sender"] == "qa-a"' in text
    assert 'mode == "peer-state"' in text
    assert 'conversation["conversation_id"] == "room:city:core-harbor:lobby"' in text
    assert 'mode == "event-body"' in text
    assert '"event: shell-state" in raw_payload' in text
    assert 'data_lines, "SSE shell-state must include the smoke message payload"' in text
    assert 'need_cmd curl\nneed_cmd python3' in text
    assert 'export NO_PROXY="${NO_PROXY:+$NO_PROXY,}127.0.0.1,localhost"' in text
    assert 'export no_proxy="${no_proxy:+$no_proxy,}127.0.0.1,localhost"' in text
    assert "reserve_port()" in text
    assert 'if [[ -z "$PORT" ]]; then' in text
    assert text.index('if [[ "$SKIP_BUILD" != "1" ]]; then') < text.index("need_cmd cargo")
    assert text.index("need_cmd cargo") < text.index('cargo build --manifest-path "$ROOT_DIR/Cargo.toml" -p lobster-waku-gateway')
    assert text.index('if [[ ! -x "$GATEWAY_BIN" ]]') > text.index('fi\n\nif [[ ! -x "$GATEWAY_BIN" ]]')
    assert 'cargo build --manifest-path "$ROOT_DIR/Cargo.toml" -p lobster-waku-gateway' in text
    assert '"$GATEWAY_BIN" \\' in text
    assert 'LOBSTER_DEV_AUTH_BYPASS=1 "$GATEWAY_BIN" \\' in text
    assert '--state-dir "$STATE_ROOT/gateway"' in text
    assert 'curl -fsS "$GATEWAY_URL/v1/shell/state?resident_id=qa-b"' in text
    assert 'INITIAL_VERSION="$initial_version" python3 -' in text
    assert 'urllib.parse.quote(os.environ["INITIAL_VERSION"], safe="")' in text
    assert '"$GATEWAY_URL/v1/shell/events?resident_id=qa-b&after=$encoded_after&wait_ms=4000"' in text
    assert '"$GATEWAY_URL/v1/shell/message"' in text
    assert '\\"room_id\\":\\"room:city:core-harbor:lobby\\"' in text
    assert '\\"sender\\":\\"qa-a\\"' in text
    assert '\\"device_id\\":\\"shell-dual-http-smoke\\"' in text
    assert 'wait "$EVENTS_PID"' in text
    assert 'json_assert "$event_body" "event-body"' in text
    assert 'json_assert "$peer_state" "peer-state"' in text
    assert 'echo "== shell dual HTTP smoke passed =="' in text
    assert 'kill "$EVENTS_PID"' in text
    assert 'kill "$GATEWAY_PID"' in text
    assert 'rm -rf "$STATE_ROOT"' in text
    return 0


if __name__ == "__main__":
    sys.exit(main())
