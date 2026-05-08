#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8799}"
KEEP_STATE="${KEEP_STATE:-0}"
SKIP_BUILD="${SKIP_BUILD:-0}"
GATEWAY_BIN="${GATEWAY_BIN:-$ROOT_DIR/target/debug/lobster-waku-gateway}"
GATEWAY_PID=""

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing command: $1" >&2
    exit 1
  }
}

mktemp_dir() {
  local dir
  dir="$(mktemp -d "${TMPDIR:-/tmp}/lobster-auth-smoke.XXXXXX" 2>/dev/null)" \
    || dir="$(mktemp -d -t lobster-auth-smoke)"
  printf '%s\n' "$dir"
}

wait_for_health() {
  local url="$1"
  local attempt
  for attempt in $(seq 1 80); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.25
  done
  echo "timed out waiting for gateway health: $url" >&2
  return 1
}

json_assert() {
  local payload="$1"
  local mode="$2"
  JSON_PAYLOAD="$payload" python3 - "$mode" <<'PY'
import json
import os
import sys

mode = sys.argv[1]
payload = json.loads(os.environ["JSON_PAYLOAD"])

if mode == "preflight-allowed":
    assert payload["allowed"] is True
    assert payload["normalized_email"] == "novel.reader@example.com"
    assert payload["normalized_mobile"] == "8613800138000"
    assert payload["normalized_device_physical_address"] == "665544332211"
    assert payload["blocked_reasons"] == []
elif mode == "otp-request":
    assert payload["challenge_id"].startswith("otp:")
    assert payload["delivery_mode"] == "inline-dev"
    assert payload["dev_code"]
    assert payload["masked_email"] == "n***@example.com"
elif mode == "otp-verify":
    assert payload["resident_id"] == "novel-reader"
    assert payload["email"] == "novel.reader@example.com"
    assert payload["state"] == "Active"
elif mode == "preflight-blocked":
    assert payload["allowed"] is False
    assert len(payload["blocked_reasons"]) == 3
    text = " ".join(payload["blocked_reasons"])
    assert "email is world-blacklisted" in text
    assert "mobile is world-blacklisted" in text
    assert "device physical address is world-blacklisted" in text
else:
    raise AssertionError(f"unsupported mode: {mode}")
PY
}

need_cmd cargo
need_cmd curl
need_cmd python3

if [[ "$SKIP_BUILD" != "1" ]]; then
  echo "== building lobster-waku-gateway =="
  cargo build --manifest-path "$ROOT_DIR/Cargo.toml" -p lobster-waku-gateway
fi

if [[ ! -x "$GATEWAY_BIN" ]]; then
  echo "gateway binary not found: $GATEWAY_BIN" >&2
  exit 1
fi

STATE_ROOT="$(mktemp_dir)"
GATEWAY_LOG="$STATE_ROOT/gateway.log"
AUTH_STATE_FILE="$STATE_ROOT/gateway/auth-state.json"

cleanup() {
  local exit_code=$?
  if [[ -n "$GATEWAY_PID" ]] && kill -0 "$GATEWAY_PID" >/dev/null 2>&1; then
    kill "$GATEWAY_PID" >/dev/null 2>&1 || true
    wait "$GATEWAY_PID" >/dev/null 2>&1 || true
  fi
  if [[ "$KEEP_STATE" != "1" && -d "$STATE_ROOT" ]]; then
    rm -rf "$STATE_ROOT"
  fi
  exit "$exit_code"
}
trap cleanup EXIT

echo "== starting gateway on :$PORT with inline dev OTP =="
LOBSTER_DEV_EMAIL_OTP_INLINE=1 "$GATEWAY_BIN" \
  --host "$HOST" \
  --port "$PORT" \
  --state-dir "$STATE_ROOT/gateway" \
  >"$GATEWAY_LOG" 2>&1 &
GATEWAY_PID="$!"
wait_for_health "http://$HOST:$PORT/health"
GATEWAY_URL="http://$HOST:$PORT"

echo "== auth preflight allows clean handles =="
preflight_allowed="$(
  curl -fsS \
    -X POST "$GATEWAY_URL/v1/auth/preflight" \
    -H 'content-type: application/json' \
    -d '{"email":"novel.reader@example.com","mobile":"+86 13800138000","device_physical_address":"66:55:44:33:22:11"}'
)"
printf '%s\n' "$preflight_allowed"
json_assert "$preflight_allowed" "preflight-allowed"

echo "== requesting email OTP =="
otp_request="$(
  curl -fsS \
    -X POST "$GATEWAY_URL/v1/auth/email-otp/request" \
    -H 'content-type: application/json' \
    -d '{"email":"novel.reader@example.com","mobile":"+86 13800138000","device_physical_address":"66:55:44:33:22:11","resident_id":"novel-reader"}'
)"
printf '%s\n' "$otp_request"
json_assert "$otp_request" "otp-request"

challenge_id="$(
  JSON_PAYLOAD="$otp_request" python3 - <<'PY'
import json
import os
print(json.loads(os.environ["JSON_PAYLOAD"])["challenge_id"])
PY
)"
dev_code="$(
  JSON_PAYLOAD="$otp_request" python3 - <<'PY'
import json
import os
print(json.loads(os.environ["JSON_PAYLOAD"])["dev_code"])
PY
)"

echo "== verifying email OTP =="
otp_verify="$(
  curl -fsS \
    -X POST "$GATEWAY_URL/v1/auth/email-otp/verify" \
    -H 'content-type: application/json' \
    -d "{\"challenge_id\":\"$challenge_id\",\"code\":\"$dev_code\",\"resident_id\":\"novel-reader\"}"
)"
printf '%s\n' "$otp_verify"
json_assert "$otp_verify" "otp-verify"

echo "== checking persisted auth state =="
AUTH_STATE_FILE="$AUTH_STATE_FILE" python3 - <<'PY'
import json
import os
import pathlib

path = pathlib.Path(os.environ["AUTH_STATE_FILE"])
assert path.exists(), f"missing auth state: {path}"
payload = json.loads(path.read_text(encoding="utf-8"))
assert any(
    item["resident_id"] == "novel-reader" and item["email"] == "novel.reader@example.com"
    for item in payload["registrations"]
), payload
assert any(
    item["challenge_id"].startswith("otp:") and item.get("consumed_at_ms")
    for item in payload["email_otp_challenges"]
), payload
PY

echo "== blacklisting handles and re-checking preflight =="
sanction_response="$(
  curl -fsS \
    -X POST "$GATEWAY_URL/v1/world-safety/residents/sanction" \
    -H 'content-type: application/json' \
    -d '{"actor_id":"rsaga","resident_id":"repeat-offender","city":"core-harbor","report_id":"report:blacklist","reason":"repeat harassment","email":"blocked@example.com","mobile":"+86 13900000000","device_physical_addresses":["00-22-44-66-88-AA"],"portability_revoked":true}'
)"
printf '%s\n' "$sanction_response"

preflight_blocked="$(
  curl -fsS \
    -X POST "$GATEWAY_URL/v1/auth/preflight" \
    -H 'content-type: application/json' \
    -d '{"email":"blocked@example.com","mobile":"+86 13900000000","device_physical_address":"00:22:44:66:88:aa"}'
)"
printf '%s\n' "$preflight_blocked"
json_assert "$preflight_blocked" "preflight-blocked"

echo "== blacklisted handles should not receive OTP =="
otp_blocked_body="$STATE_ROOT/otp-blocked.json"
otp_blocked_status="$(
  curl -sS \
    -o "$otp_blocked_body" \
    -w '%{http_code}' \
    -X POST "$GATEWAY_URL/v1/auth/email-otp/request" \
    -H 'content-type: application/json' \
    -d '{"email":"blocked@example.com","mobile":"+86 13900000000","device_physical_address":"00:22:44:66:88:AA","resident_id":"new-handle"}'
)"
printf 'status=%s\n' "$otp_blocked_status"
cat "$otp_blocked_body"
[[ "$otp_blocked_status" == "400" ]] || {
  echo "expected blacklisted OTP request to fail with 400" >&2
  exit 1
}
grep -F "world-blacklisted" "$otp_blocked_body" >/dev/null || {
  echo "expected blacklisted OTP response to mention world-blacklisted" >&2
  exit 1
}

echo
echo "== auth smoke passed =="
echo "gateway: $GATEWAY_URL"
echo "state root: $STATE_ROOT"
if [[ "$KEEP_STATE" != "1" ]]; then
  echo "logs were temporary; rerun with KEEP_STATE=1 to inspect them."
fi
