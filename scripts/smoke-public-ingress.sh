#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-${1:-}}"
EXPECT_HOME_TEXT="${EXPECT_HOME_TEXT:-龙虾聊天 · 主城群聊}"
EXPECT_RESIDENT_TEXT="${EXPECT_RESIDENT_TEXT:-龙虾聊天 · 住宅}"
EXPECT_ADMIN_TEXT="${EXPECT_ADMIN_TEXT:-AJW聊天 · 管理后台}"
EXPECT_PROVIDER_FRAGMENT="${EXPECT_PROVIDER_FRAGMENT:-\"reachable\":true}"
EXPECT_CORS_ORIGIN="${EXPECT_CORS_ORIGIN:-}"
CURL_BIN="${CURL_BIN:-curl}"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing command: $1" >&2
    exit 1
  }
}

require_non_empty() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "missing required value: $name" >&2
    exit 1
  fi
}

mktemp_file() {
  local file
  file="$(mktemp "${TMPDIR:-/tmp}/lobster-public-smoke.XXXXXX" 2>/dev/null)" \
    || file="$(mktemp -t lobster-public-smoke)"
  printf '%s\n' "$file"
}

fetch_body() {
  local url="$1"
  local output="$2"
  "$CURL_BIN" -fsS "$url" -o "$output"
}

fetch_head_status() {
  local url="$1"
  "$CURL_BIN" -fsSI "$url" | head -n 1
}

fetch_status() {
  local method="$1"
  local url="$2"
  "$CURL_BIN" -sS -X "$method" -o /dev/null -w '%{http_code}' "$url"
}

assert_status() {
  local expected="$1"
  local method="$2"
  local url="$3"
  local actual
  actual="$(fetch_status "$method" "$url")"
  [[ "$actual" == "$expected" ]] || {
    echo "unexpected HTTP status for $url: expected $expected, got $actual" >&2
    exit 1
  }
}

need_cmd "$CURL_BIN"
need_cmd grep
need_cmd head
need_cmd mktemp

require_non_empty "BASE_URL" "$BASE_URL"
BASE_URL="${BASE_URL%/}"

BODY_FILE="$(mktemp_file)"
trap 'rm -f "$BODY_FILE"' EXIT

echo "== public ingress smoke =="
echo "base: $BASE_URL"

echo "== homepage =="
fetch_body "$BASE_URL/" "$BODY_FILE"
grep -F "$EXPECT_HOME_TEXT" "$BODY_FILE" >/dev/null || {
  echo "homepage did not contain expected marker: $EXPECT_HOME_TEXT" >&2
  exit 1
}

echo "== H5 resident page =="
fetch_body "$BASE_URL/creative.html" "$BODY_FILE"
grep -F "$EXPECT_RESIDENT_TEXT" "$BODY_FILE" >/dev/null || {
  echo "resident page did not contain expected marker: $EXPECT_RESIDENT_TEXT" >&2
  exit 1
}

echo "== admin page =="
fetch_body "$BASE_URL/admin-ds.html" "$BODY_FILE"
grep -F "$EXPECT_ADMIN_TEXT" "$BODY_FILE" >/dev/null || {
  echo "admin page did not contain expected marker: $EXPECT_ADMIN_TEXT" >&2
  exit 1
}

echo "== GET /health =="
fetch_body "$BASE_URL/health" "$BODY_FILE"
if [[ "$(cat "$BODY_FILE")" != "ok" ]]; then
  echo "unexpected /health body:" >&2
  cat "$BODY_FILE" >&2
  exit 1
fi

echo "== HEAD /health =="
health_status="$(fetch_head_status "$BASE_URL/health")"
printf '%s\n' "$health_status"
printf '%s' "$health_status" | grep -F "200" >/dev/null || {
  echo "HEAD /health did not return 200" >&2
  exit 1
}

echo "== /v1/provider =="
fetch_body "$BASE_URL/v1/provider" "$BODY_FILE"
grep -F "$EXPECT_PROVIDER_FRAGMENT" "$BODY_FILE" >/dev/null || {
  echo "provider response missing expected fragment: $EXPECT_PROVIDER_FRAGMENT" >&2
  cat "$BODY_FILE" >&2
  exit 1
}

echo "== protected route without bearer =="
assert_status "401" "GET" "$BASE_URL/v1/admin/summary"
assert_status "401" "POST" "$BASE_URL/v1/auth/logout"

if [[ -n "$EXPECT_CORS_ORIGIN" ]]; then
  echo "== CORS origin =="
  headers="$($CURL_BIN -fsS -D - -o /dev/null -H "Origin: ${EXPECT_CORS_ORIGIN}" "$BASE_URL/health")"
  printf '%s\n' "$headers" | grep -F "Access-Control-Allow-Origin: ${EXPECT_CORS_ORIGIN}" >/dev/null || {
    echo "public CORS origin did not match: $EXPECT_CORS_ORIGIN" >&2
    exit 1
  }
fi

echo "public ingress smoke passed"
