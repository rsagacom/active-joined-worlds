#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "smoke-shell-direct-http.sh"


def main() -> int:
    assert SCRIPT.exists(), f"missing shell direct HTTP smoke script: {SCRIPT}"
    text = SCRIPT.read_text(encoding="utf-8")

    assert "set -euo pipefail" in text
    assert 'PORT="${PORT:-}"' in text
    assert 'KEEP_STATE="${KEEP_STATE:-0}"' in text
    assert 'SKIP_BUILD="${SKIP_BUILD:-0}"' in text
    assert 'GATEWAY_BIN="${GATEWAY_BIN:-$ROOT_DIR/target/debug/lobster-waku-gateway}"' in text
    assert 'mktemp -d "${TMPDIR:-/tmp}/lobster-shell-direct-http.XXXXXX"' in text
    assert "wait_for_health()" in text
    assert "json_assert()" in text
    assert 'ROOM_ID = "dm:qa-a:qa-b"' in text
    assert 'mode == "direct-open"' in text
    assert 'payload["conversation_id"] == ROOM_ID' in text
    assert 'payload["group_id"] == "mls:dm:qa-a:qa-b"' in text
    assert 'payload["kind"] == "Direct"' in text
    assert 'payload["scope"] == "Private"' in text
    assert 'mode == "initial-state"' in text
    assert 'room.get("kind") == "direct"' in text
    assert 'room.get("scope") == "private"' in text
    assert 'mode == "send-response"' in text
    assert 'mode == "edit-response"' in text
    assert 'payload["edit_status"] == "edited"' in text
    assert 'mode == "recall-response"' in text
    assert 'payload["recall_status"] == "recalled"' in text
    assert 'mode == "edited-peer-state"' in text
    assert 'mode == "recalled-peer-state"' in text
    assert 'recalled["text"] == "消息已撤回"' in text
    assert 'mode == "outsider-state"' in text
    assert 'find_room(payload) is None' in text
    assert 'mode == "blocked-response"' in text
    assert '"not a participant" in message' in text
    assert 'mode == "event-body"' in text
    assert 'mode == "edited-event-body"' in text
    assert 'mode == "recalled-event-body"' in text
    assert 'state_version_from_payload()' in text
    assert 'urlencode_value()' in text
    assert 'start_peer_events_after_state()' in text
    assert 'wait_peer_events_assert()' in text
    assert 'need_cmd curl\nneed_cmd python3' in text
    assert 'export NO_PROXY="${NO_PROXY:+$NO_PROXY,}127.0.0.1,localhost"' in text
    assert 'export no_proxy="${no_proxy:+$no_proxy,}127.0.0.1,localhost"' in text
    assert "reserve_port()" in text
    assert 'if [[ -z "$PORT" ]]; then' in text
    assert text.index('if [[ "$SKIP_BUILD" != "1" ]]; then') < text.index("need_cmd cargo")
    assert text.index("need_cmd cargo") < text.index('cargo build --manifest-path "$ROOT_DIR/Cargo.toml" -p lobster-waku-gateway')
    assert text.index('if [[ ! -x "$GATEWAY_BIN" ]]') > text.index('fi\n\nif [[ ! -x "$GATEWAY_BIN" ]]')
    assert '"$GATEWAY_URL/v1/direct/open"' in text
    assert 'LOBSTER_DEV_AUTH_BYPASS=1 "$GATEWAY_BIN" \\' in text
    assert '"requester_id":"qa-a"' in text
    assert '"peer_id":"qa-b"' in text
    assert '"$GATEWAY_URL/v1/shell/state?resident_id=qa-b"' in text
    assert '"$GATEWAY_URL/v1/shell/events?resident_id=qa-b&after=$encoded&wait_ms=4000"' in text
    assert '"$GATEWAY_URL/v1/shell/message"' in text
    assert '\\"room_id\\":\\"dm:qa-a:qa-b\\"' in text
    assert '\\"device_id\\":\\"shell-direct-http-smoke\\"' in text
    assert '"$GATEWAY_URL/v1/shell/message/edit"' in text
    assert '\\"actor\\":\\"qa-a\\"' in text
    assert '"$GATEWAY_URL/v1/shell/message/recall"' in text
    assert '"$GATEWAY_URL/v1/shell/state?resident_id=qa-c"' in text
    assert '"sender":"qa-c"' in text
    assert '[[ "$blocked_code" != "400" ]]' in text
    assert 'echo "== shell direct HTTP smoke passed =="' in text
    assert 'kill "$EVENTS_PID"' in text
    assert 'kill "$GATEWAY_PID"' in text
    assert 'rm -rf "$STATE_ROOT"' in text
    return 0


if __name__ == "__main__":
    sys.exit(main())
