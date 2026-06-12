#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "preflight.sh"


def main() -> int:
    assert SCRIPT.exists(), f"missing preflight script: {SCRIPT}"
    text = SCRIPT.read_text(encoding="utf-8")

    assert "need_cmd uname" in text
    assert "need_cmd awk" in text
    assert "need_cmd df" in text
    assert "need_cmd sort" in text
    assert "version_ge()" in text
    assert "sort -V -C" in text
    assert "detect_target_triple()" in text
    assert 'Linux:x86_64) echo "x86_64-unknown-linux-gnu"' in text
    assert 'Linux:aarch64|Linux:arm64) echo "aarch64-unknown-linux-gnu"' in text
    assert 'Darwin:x86_64) echo "x86_64-apple-darwin"' in text
    assert 'Darwin:arm64|Darwin:aarch64) echo "aarch64-apple-darwin"' in text
    assert "detect_mem_mib()" in text
    assert "detect_disk_gib()" in text
    assert "cargo_version=\"$(cargo --version | awk '{ print $2 }')\"" in text
    assert 'version_ge "$cargo_version" "1.85.0"' in text
    assert "edition-2024 floor (1.85.0)" in text
    assert 'if [[ "$os" != "Linux" ]]; then' in text
    assert "server install scripts are primarily tested on Linux" in text
    assert "mem_mib < 1024" in text
    assert "disk_avail_gib < 2" in text
    assert "systemd: available" in text
    assert "systemd not found" in text
    assert "nginx: available" in text
    assert "nginx: not installed" in text
    assert 'echo "preflight complete"' in text
    return 0


if __name__ == "__main__":
    sys.exit(main())
