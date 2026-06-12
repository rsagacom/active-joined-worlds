#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "smoke-web-shell.sh"


def main() -> int:
    assert SCRIPT.exists(), f"missing web shell smoke script: {SCRIPT}"
    text = SCRIPT.read_text(encoding="utf-8")

    assert text.startswith("#!/usr/bin/env bash\n")
    assert "set -euo pipefail" in text
    assert 'ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"' in text
    assert 'cd "$ROOT"' in text
    assert "node --test --test-force-exit apps/lobster-web-shell/test/*.test.mjs" in text
    assert "npm test" not in text
    assert "apps/lobster-web-shell/generated" not in text
    return 0


if __name__ == "__main__":
    sys.exit(main())
