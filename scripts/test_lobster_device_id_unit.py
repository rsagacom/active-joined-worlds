#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "lobster-device-id.sh"


def main() -> int:
    assert SCRIPT.exists(), f"missing device id script: {SCRIPT}"
    text = SCRIPT.read_text(encoding="utf-8")

    assert text.startswith("#!/bin/bash")
    assert "set -euo pipefail" in text
    assert "get_mac()" in text
    assert "for candidate in en0 en1 en2 eth0; do" in text
    assert 'ifconfig "$candidate"' in text
    assert "awk '/ether/{print $2; exit}'" in text
    assert 'ioreg -d2 -c IOPlatformExpertDevice' in text
    assert "awk -F\\\" '/IOPlatformUUID/{print $4; exit}'" in text
    assert 'echo "uuid:${uuid}"' in text
    assert 'echo "unknown"' in text
    assert "MAC=$(get_mac)" in text
    assert 'if [[ "${1:-}" == "--url" ]]; then' in text
    assert 'BASE="${2:-http://127.0.0.1:18081/index.html}"' in text
    assert 'if [[ "$BASE" == *\\?* ]]; then' in text
    assert 'echo "${BASE}&device_id=${MAC}"' in text
    assert 'echo "${BASE}?device_id=${MAC}"' in text
    assert 'echo "$MAC"' in text
    return 0


if __name__ == "__main__":
    sys.exit(main())
