#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "smoke-release-gate.sh"


def main() -> int:
    assert SCRIPT.exists(), f"missing release gate script: {SCRIPT}"
    text = SCRIPT.read_text(encoding="utf-8")

    assert "smoke-auth-registration.sh" in text
    assert "smoke-resident-mainline.sh" in text
    assert "smoke-cli-channel.sh" in text
    assert "test_start_terminal.py" in text
    assert "smoke-provider-federation.sh" in text
    assert "run_shell_step()" in text
    assert 'run_shell_step "preflight" "$ROOT_DIR/scripts/preflight.sh"' in text
    assert 'run_shell_step "cli channel smoke" "$ROOT_DIR/scripts/smoke-cli-channel.sh"' in text
    assert 'run_shell_step "auth registration smoke" "$ROOT_DIR/scripts/smoke-auth-registration.sh"' in text
    assert 'run_shell_step "resident mainline smoke" "$ROOT_DIR/scripts/smoke-resident-mainline.sh"' in text
    assert 'run_shell_step "web shell smoke" "$ROOT_DIR/scripts/smoke-web-shell.sh"' in text
    assert 'run_shell_step "provider federation smoke" "$ROOT_DIR/scripts/smoke-provider-federation.sh"' in text
    assert 'export GATEWAY_BIN="' in text
    assert 'export CLI_BIN="' in text
    assert 'export TUI_BIN="' in text
    return 0


if __name__ == "__main__":
    sys.exit(main())
