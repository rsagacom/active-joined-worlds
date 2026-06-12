#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
MAKEFILE = ROOT / "Makefile"


def main() -> int:
    assert MAKEFILE.exists(), f"missing Makefile: {MAKEFILE}"
    text = MAKEFILE.read_text(encoding="utf-8")

    assert "make smoke          — CLI + shell + web smoke" in text
    assert "make dev            — build + restart gateway" in text
    assert "dev:" in text
    assert "\t./scripts/restart-gateway.sh" in text
    assert "\tcargo build --release -p lobster-waku-gateway && ./scripts/restart-gateway.sh" not in text
    assert "smoke:" in text
    assert "\tpython3 ./scripts/test_smoke_cli_channel_unit.py" in text
    assert "\t./scripts/smoke-cli-channel.sh" in text
    assert "\t./scripts/smoke-shell-dual-http.sh" in text
    assert "\t./scripts/smoke-web-shell.sh" in text
    assert "dual-browser HTTP smoke" not in text
    return 0


if __name__ == "__main__":
    sys.exit(main())
