#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "audit-web-assets.sh"


def main() -> int:
    assert SCRIPT.exists(), f"missing web assets audit script: {SCRIPT}"
    text = SCRIPT.read_text(encoding="utf-8")

    assert "set -euo pipefail" in text
    assert 'ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"' in text
    assert 'WEB_DIR="$ROOT_DIR/apps/lobster-web-shell"' in text
    assert 'ASSET_DIR="$WEB_DIR/assets"' in text
    assert 'if [[ ! -d "$ASSET_DIR" ]]; then' in text
    assert 'echo "missing asset directory: $ASSET_DIR"' in text
    assert 'echo "== Largest web image assets =="' in text
    assert 'find "$ASSET_DIR" -type f \\' in text
    assert "-name '*.png'" in text
    assert "-name '*.jpg'" in text
    assert "-name '*.jpeg'" in text
    assert "-name '*.webp'" in text
    assert "-name '*.avif'" in text
    assert "xargs -0 ls -lh" in text
    assert "sort -k5 -hr" in text
    assert "head -30" in text
    assert 'echo "== 256px derivative references =="' in text
    assert 'find "$ASSET_DIR" -type f -name \'*-256.*\' -print' in text
    assert 'rel_path="${asset_path#"$WEB_DIR"/}"' in text
    assert 'rg -l --fixed-strings "$rel_path" "$WEB_DIR" "$ROOT_DIR/docs" "$ROOT_DIR/scripts"' in text
    assert 'printf "%s\\trefs=%s\\n" "$rel_path" "$refs"' in text
    assert 'echo "== Source or concept assets above 1MB =="' in text
    assert "-name '*source*'" in text
    assert "-path '*/concepts/*'" in text
    assert "-size +1M" in text
    assert "xargs -0 ls -lh 2>/dev/null || true" in text
    return 0


if __name__ == "__main__":
    sys.exit(main())
