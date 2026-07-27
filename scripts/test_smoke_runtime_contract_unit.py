#!/usr/bin/env python3
"""Keep smoke build, binary, and artifact inputs on one explicit contract."""

from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "scripts"

REGULAR_SHELL_SMOKES = {
    "smoke-auth-registration.sh": ("GATEWAY_BIN",),
    "smoke-cli-channel.sh": ("GATEWAY_BIN", "CLI_BIN"),
    "smoke-resident-mainline.sh": ("GATEWAY_BIN", "CLI_BIN", "TUI_BIN"),
    "smoke-shell-direct-http.sh": ("GATEWAY_BIN",),
    "smoke-shell-dual-http.sh": ("GATEWAY_BIN",),
}


def assert_before(text: str, earlier: str, later: str, *, label: str) -> None:
    assert earlier in text, f"{label}: missing {earlier!r}"
    assert later in text, f"{label}: missing {later!r}"
    assert text.index(earlier) < text.index(later), f"{label}: {earlier!r} must precede {later!r}"


def main() -> int:
    release_gate = (SCRIPTS / "smoke-release-gate.sh").read_text(encoding="utf-8")
    quick_coverage = (SCRIPTS / "test_scripts_quick_unit_coverage.py").read_text(encoding="utf-8")

    for filename, binaries in REGULAR_SHELL_SMOKES.items():
        path = SCRIPTS / filename
        assert path.exists(), f"missing smoke script: {path}"
        text = path.read_text(encoding="utf-8")
        label = filename
        assert 'SKIP_BUILD="${SKIP_BUILD:-0}"' in text, f"{label}: SKIP_BUILD must be overridable"
        assert_before(
            text,
            'if [[ "$SKIP_BUILD" != "1" ]]; then',
            "need_cmd cargo",
            label=label,
        )
        assert_before(
            text,
            "need_cmd cargo",
            'cargo build --manifest-path "$ROOT_DIR/Cargo.toml"',
            label=label,
        )
        assert 'STATE_ROOT="$(mktemp_dir)"' in text, f"{label}: state must be created after inputs"
        for variable in binaries:
            declaration = f'{variable}="${{{variable}:-'
            check = f'if [[ ! -x "${variable}" ]]'
            assert declaration in text, f"{label}: {variable} must be overridable"
            assert check in text, f"{label}: {variable} must be executable-checked"
            assert_before(
                text,
                'cargo build --manifest-path "$ROOT_DIR/Cargo.toml"',
                check,
                label=f"{label}/{variable}",
            )
            assert_before(
                text,
                check,
                'STATE_ROOT="$(mktemp_dir)"',
                label=f"{label}/{variable}",
            )

    provider = (SCRIPTS / "smoke-provider-federation.sh").read_text(encoding="utf-8")
    assert 'GATEWAY_ARTIFACT="${GATEWAY_ARTIFACT:-}"' in provider
    assert 'SKIP_BUILD="${SKIP_BUILD:-0}"' in provider
    assert_before(
        provider,
        'if [[ "$SKIP_BUILD" != "1" && -z "$GATEWAY_ARTIFACT" ]]; then',
        "need_cmd cargo",
        label="smoke-provider-federation.sh",
    )
    assert_before(
        provider,
        'if [[ ! -x "$BIN_PATH" ]]',
        'STATE_ROOT="$(mktemp_dir)"',
        label="smoke-provider-federation.sh artifact",
    )

    web = (SCRIPTS / "smoke-web-dual-browser.mjs").read_text(encoding="utf-8")
    assert 'const SKIP_BUILD = process.env.SKIP_BUILD === "1";' in web
    assert 'process.env.GATEWAY_BIN || path.join(ROOT_DIR, "target", "debug", "lobster-waku-gateway")' in web
    assert_before(
        web,
        'if (!SKIP_BUILD) {',
        'await assertExecutable(GATEWAY_BIN, "gateway");',
        label="smoke-web-dual-browser.mjs build",
    )
    assert_before(
        web,
        'await assertExecutable(GATEWAY_BIN, "gateway");',
        'const stateRoot = await mkdtemp(path.join(os.tmpdir(), "lobster-web-dual-browser."));',
        label="smoke-web-dual-browser.mjs binary",
    )

    assert 'export SKIP_BUILD=1' in release_gate
    assert 'gateway_bin_default="$ROOT_DIR/target/debug/lobster-waku-gateway"' in release_gate
    assert '${BIN_PATH:-' not in release_gate, "release gate must not inherit provider-only BIN_PATH"
    assert 'export BIN_PATH=' not in release_gate, "release gate must not leak provider-only BIN_PATH"
    assert 'test_smoke_runtime_contract_unit.py' in release_gate
    assert 'test_smoke_runtime_contract_unit.py' in quick_coverage
    return 0


if __name__ == "__main__":
    sys.exit(main())
