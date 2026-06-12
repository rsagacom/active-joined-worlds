#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "smoke-auth-registration.sh"


def main() -> int:
    assert SCRIPT.exists(), f"missing auth registration smoke script: {SCRIPT}"
    text = SCRIPT.read_text(encoding="utf-8")

    assert "set -euo pipefail" in text
    assert 'PORT="${PORT:-8799}"' in text
    assert 'KEEP_STATE="${KEEP_STATE:-0}"' in text
    assert 'SKIP_BUILD="${SKIP_BUILD:-0}"' in text
    assert 'GATEWAY_BIN="${GATEWAY_BIN:-$ROOT_DIR/target/debug/lobster-waku-gateway}"' in text
    assert 'mktemp -d "${TMPDIR:-/tmp}/lobster-auth-smoke.XXXXXX"' in text
    assert "wait_for_health()" in text
    assert "json_assert()" in text
    assert 'mode == "preflight-allowed"' in text
    assert 'payload["allowed"] is True' in text
    assert 'payload["normalized_email"] == "novel.reader@example.com"' in text
    assert 'payload["normalized_mobile"] == "8613800138000"' in text
    assert 'payload["normalized_device_physical_address"] == "665544332211"' in text
    assert 'mode == "otp-request"' in text
    assert 'payload["challenge_id"].startswith("otp:")' in text
    assert 'payload["delivery_mode"] == "inline-dev"' in text
    assert 'payload["dev_code"]' in text
    assert 'mode == "otp-verify"' in text
    assert 'payload["resident_id"] == "novel-reader"' in text
    assert 'mode == "preflight-blocked"' in text
    assert 'payload["allowed"] is False' in text
    assert 'len(payload["blocked_reasons"]) == 3' in text
    assert "need_cmd curl\nneed_cmd python3" in text
    assert text.index('if [[ "$SKIP_BUILD" != "1" ]]; then') < text.index("need_cmd cargo")
    assert text.index("need_cmd cargo") < text.index('cargo build --manifest-path "$ROOT_DIR/Cargo.toml" -p lobster-waku-gateway')
    assert text.index('if [[ ! -x "$GATEWAY_BIN" ]]') > text.index('fi\n\nif [[ ! -x "$GATEWAY_BIN" ]]')
    assert 'LOBSTER_DEV_EMAIL_OTP_INLINE=1 "$GATEWAY_BIN"' in text
    assert '"$GATEWAY_URL/v1/auth/preflight"' in text
    assert '"$GATEWAY_URL/v1/auth/email-otp/request"' in text
    assert '"$GATEWAY_URL/v1/auth/email-otp/verify"' in text
    assert 'AUTH_STATE_FILE="$AUTH_STATE_FILE" python3 -' in text
    assert 'payload["registrations"]' in text
    assert 'payload["email_otp_challenges"]' in text
    assert '"$GATEWAY_URL/v1/world-safety/residents/sanction"' in text
    assert 'otp_blocked_status="$(' in text
    assert '[[ "$otp_blocked_status" == "400" ]]' in text
    assert 'grep -F "world-blacklisted" "$otp_blocked_body"' in text
    assert 'echo "== auth smoke passed =="' in text
    assert 'kill "$GATEWAY_PID"' in text
    assert 'rm -rf "$STATE_ROOT"' in text
    return 0


if __name__ == "__main__":
    sys.exit(main())
