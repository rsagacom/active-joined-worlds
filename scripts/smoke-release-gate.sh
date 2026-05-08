#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_PREFLIGHT="${RUN_PREFLIGHT:-1}"
INCLUDE_PROVIDER_FEDERATION="${INCLUDE_PROVIDER_FEDERATION:-${WITH_PROVIDER_FEDERATION:-1}}"
KEEP_STATE="${KEEP_STATE:-0}"
SKIP_BUILD="${SKIP_BUILD:-0}"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing command: $1" >&2
    exit 1
  }
}

run_step() {
  local label="$1"
  shift
  echo "== $label =="
  "$@"
  echo
}

run_shell_step() {
  local label="$1"
  local script="$2"
  echo "== $label =="
  bash "$script"
  echo
}

need_cmd bash
need_cmd cargo
need_cmd python3

if [[ "$RUN_PREFLIGHT" == "1" ]]; then
  run_shell_step "preflight" "$ROOT_DIR/scripts/preflight.sh"
fi

if [[ "$SKIP_BUILD" != "1" ]]; then
  run_step \
    "building shared debug binaries" \
    cargo build --manifest-path "$ROOT_DIR/Cargo.toml" -p lobster-waku-gateway -p lobster-cli -p lobster-tui
fi

export KEEP_STATE
export SKIP_BUILD=1
export LOBSTER_CHAT_ROOT="${LOBSTER_CHAT_ROOT:-$ROOT_DIR}"
gateway_bin_default="${BIN_PATH:-$ROOT_DIR/target/debug/lobster-waku-gateway}"
export GATEWAY_BIN="${GATEWAY_BIN:-$gateway_bin_default}"
export BIN_PATH="$GATEWAY_BIN"
export CLI_BIN="${CLI_BIN:-$(dirname "$GATEWAY_BIN")/lobster-cli}"
export TUI_BIN="${TUI_BIN:-$(dirname "$GATEWAY_BIN")/lobster-tui}"

run_shell_step "cli channel smoke" "$ROOT_DIR/scripts/smoke-cli-channel.sh"
run_shell_step "auth registration smoke" "$ROOT_DIR/scripts/smoke-auth-registration.sh"
run_shell_step "resident mainline smoke" "$ROOT_DIR/scripts/smoke-resident-mainline.sh"
run_shell_step "web shell smoke" "$ROOT_DIR/scripts/smoke-web-shell.sh"
run_step "terminal smoke" python3 "$ROOT_DIR/scripts/test_start_terminal.py"

if [[ "$INCLUDE_PROVIDER_FEDERATION" == "1" ]]; then
  run_shell_step "provider federation smoke" "$ROOT_DIR/scripts/smoke-provider-federation.sh"
fi

echo "== release gate passed =="
echo "root: $ROOT_DIR"
if [[ "$INCLUDE_PROVIDER_FEDERATION" == "1" ]]; then
  echo "provider interlink smoke: included"
else
  echo "provider interlink smoke: skipped"
fi
