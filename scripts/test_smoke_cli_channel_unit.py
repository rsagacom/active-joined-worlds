#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "smoke-cli-channel.sh"


def main() -> int:
    assert SCRIPT.exists(), f"missing CLI smoke script: {SCRIPT}"
    text = SCRIPT.read_text(encoding="utf-8")

    assert 'PORT="${PORT:-}"' in text
    assert "reserve_port()" in text
    assert 'if [[ -z "$PORT" ]]; then' in text
    assert 'need_cmd curl\nneed_cmd grep\nneed_cmd mktemp\nneed_cmd python3' in text
    assert 'export NO_PROXY="${NO_PROXY:+$NO_PROXY,}127.0.0.1,localhost"' in text
    assert 'export no_proxy="${no_proxy:+$no_proxy,}127.0.0.1,localhost"' in text
    assert text.index('if [[ "$SKIP_BUILD" != "1" ]]; then') < text.index("need_cmd cargo")
    assert text.index("need_cmd cargo") < text.index('cargo build --manifest-path "$ROOT_DIR/Cargo.toml" -p lobster-waku-gateway -p lobster-cli')
    assert text.index('if [[ ! -x "$GATEWAY_BIN" ]]') > text.index('fi\n\nif [[ ! -x "$GATEWAY_BIN" ]]')
    assert 'echo "== checking edit/recall =="' in text
    assert 'LOBSTER_DEV_AUTH_BYPASS=1 "$GATEWAY_BIN"' in text
    assert 'LOBSTER_DEV_EMAIL_OTP_INLINE=1' in text
    assert '--token "$CLI_SESSION_TOKEN"' in text
    assert 'presence_json="$("$CLI_BIN" presence --for user:zhangsan --token "$CLI_SESSION_TOKEN"' in text
    assert 'read_json="$("$CLI_BIN" read --for user:zhangsan --conversation-id dm:openclaw:zhangsan --token "$CLI_SESSION_TOKEN"' in text
    assert 'search_output="$("$CLI_BIN" search "$MESSAGE_TEXT" --for user:zhangsan --token "$CLI_SESSION_TOKEN"' in text
    assert 'search_json="$("$CLI_BIN" search "$MESSAGE_TEXT" --for user:zhangsan --token "$CLI_SESSION_TOKEN"' in text
    assert 'admin_config_json="$("$CLI_BIN" config --get --token "$CLI_SESSION_TOKEN"' in text
    assert 'admin_residents_json="$("$CLI_BIN" residents --for user:zhangsan --token "$CLI_SESSION_TOKEN"' in text
    assert 'admin_rooms_json="$("$CLI_BIN" rooms-admin --for user:zhangsan --token "$CLI_SESSION_TOKEN"' in text
    assert 'mode == "config"' in text
    assert '"admin-residents", "admin-rooms"' in text
    assert 'mode == "search"' in text
    assert '"$CLI_BIN" edit \\' in text
    assert "--actor agent:openclaw" in text
    assert "--conversation-id dm:openclaw:zhangsan" in text
    assert "--message-id \"$edit_message_id\"" in text
    assert '"$CLI_BIN" recall \\' in text
    assert "--message-id \"$recall_message_id\"" in text
    assert 'payload["edit_status"] == "edited"' in text
    assert 'payload["recall_status"] == "recalled"' in text
    assert 'edited["is_edited"] is True' in text
    assert 'recalled["is_recalled"] is True' in text
    return 0


if __name__ == "__main__":
    sys.exit(main())
