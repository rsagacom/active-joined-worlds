#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "smoke-cli-channel.sh"


def main() -> int:
    assert SCRIPT.exists(), f"missing CLI smoke script: {SCRIPT}"
    text = SCRIPT.read_text(encoding="utf-8")

    assert 'need_cmd curl\nneed_cmd grep\nneed_cmd mktemp\nneed_cmd python3' in text
    assert text.index('if [[ "$SKIP_BUILD" != "1" ]]; then') < text.index("need_cmd cargo")
    assert text.index("need_cmd cargo") < text.index('cargo build --manifest-path "$ROOT_DIR/Cargo.toml" -p lobster-waku-gateway -p lobster-cli')
    assert text.index('if [[ ! -x "$GATEWAY_BIN" ]]') > text.index('fi\n\nif [[ ! -x "$GATEWAY_BIN" ]]')
    assert 'echo "== checking edit/recall =="' in text
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
