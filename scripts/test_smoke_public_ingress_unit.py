#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "smoke-public-ingress.sh"


def main() -> int:
    assert SCRIPT.exists(), f"missing public ingress smoke script: {SCRIPT}"
    text = SCRIPT.read_text(encoding="utf-8")

    assert 'BASE_URL="${BASE_URL:-${1:-}}"' in text
    assert 'EXPECT_HOME_TEXT="${EXPECT_HOME_TEXT:-龙虾聊天 · 主城群聊}"' in text
    assert 'EXPECT_RESIDENT_TEXT="${EXPECT_RESIDENT_TEXT:-龙虾聊天 · 住宅}"' in text
    assert 'EXPECT_ADMIN_TEXT="${EXPECT_ADMIN_TEXT:-AJW聊天 · 管理后台}"' in text
    assert 'EXPECT_PROVIDER_FRAGMENT="${EXPECT_PROVIDER_FRAGMENT:-\\"reachable\\":true}"' in text
    assert 'EXPECT_CORS_ORIGIN="${EXPECT_CORS_ORIGIN:-}"' in text
    assert 'CURL_BIN="${CURL_BIN:-curl}"' in text
    assert 'require_non_empty "BASE_URL" "$BASE_URL"' in text
    assert 'BASE_URL="${BASE_URL%/}"' in text
    assert 'mktemp "${TMPDIR:-/tmp}/lobster-public-smoke.XXXXXX"' in text
    assert 'trap \'rm -f "$BODY_FILE"\' EXIT' in text
    assert 'fetch_body "$BASE_URL/" "$BODY_FILE"' in text
    assert 'grep -F "$EXPECT_HOME_TEXT" "$BODY_FILE"' in text
    assert 'fetch_body "$BASE_URL/creative.html" "$BODY_FILE"' in text
    assert 'grep -F "$EXPECT_RESIDENT_TEXT" "$BODY_FILE"' in text
    assert 'fetch_body "$BASE_URL/admin-ds.html" "$BODY_FILE"' in text
    assert 'grep -F "$EXPECT_ADMIN_TEXT" "$BODY_FILE"' in text
    assert 'fetch_body "$BASE_URL/health" "$BODY_FILE"' in text
    assert 'if [[ "$(cat "$BODY_FILE")" != "ok" ]]; then' in text
    assert 'health_status="$(fetch_head_status "$BASE_URL/health")"' in text
    assert 'grep -F "200"' in text
    assert 'fetch_body "$BASE_URL/v1/provider" "$BODY_FILE"' in text
    assert 'grep -F "$EXPECT_PROVIDER_FRAGMENT" "$BODY_FILE"' in text
    assert 'fetch_status()' in text
    assert 'assert_status "401" "GET" "$BASE_URL/v1/admin/summary"' in text
    assert 'assert_status "401" "POST" "$BASE_URL/v1/auth/logout"' in text
    assert 'Origin: ${EXPECT_CORS_ORIGIN}' in text
    assert 'public ingress smoke passed' in text
    return 0


if __name__ == "__main__":
    sys.exit(main())
