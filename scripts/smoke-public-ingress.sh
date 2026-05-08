#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-${1:-}}"
EXPECT_HOME_TEXT="${EXPECT_HOME_TEXT:-龙虾聊天 · 聊天入口}"
EXPECT_PROVIDER_FRAGMENT="${EXPECT_PROVIDER_FRAGMENT:-\"reachable\":true}"
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

echo "public ingress smoke passed"
