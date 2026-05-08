#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${0:A}")/.." && pwd)"
PORT="${1:-${PREVIEW_PORT:-18080}}"
HOST="${PREVIEW_HOST:-127.0.0.1}"
ROOT="${PREVIEW_ROOT:-$ROOT_DIR/apps/lobster-web-shell}"
PIDFILE="${PREVIEW_PIDFILE:-${TMPDIR:-/tmp}/lobster-web-preview-${PORT}.pid}"
LOGFILE="${PREVIEW_LOGFILE:-${TMPDIR:-/tmp}/lobster-web-preview-${PORT}.log}"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing command: $1" >&2
    exit 1
  }
}

read_pidfile() {
  [[ -f "$PIDFILE" ]] || return 0
  cat "$PIDFILE" 2>/dev/null || true
}

cmdline_for_pid() {
  local pid="$1"
  ps -p "$pid" -o command= 2>/dev/null | tr -d '\n'
}

contains_text() {
  local haystack="$1"
  local needle="$2"
  [[ "$haystack" == *"$needle"* ]]
}

is_preview_process() {
  local pid="$1"
  local cmdline

  cmdline="$(cmdline_for_pid "$pid")"
  [[ -n "$cmdline" ]] || return 1

  contains_text "$cmdline" "http.server" || return 1
  contains_text "$cmdline" "--bind $HOST" || return 1
  contains_text "$cmdline" "--directory $ROOT" || return 1
  contains_text "$cmdline" "$PORT" || return 1
}

listener_pids_for_port() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true
  fi
}

wait_for_server() {
  local url="http://$HOST:$PORT/"
  local attempt

  for attempt in $(seq 1 60); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.25
  done

  echo "timed out waiting for preview: $url" >&2
  return 1
}

ensure_dir() {
  mkdir -p "$(dirname "$PIDFILE")" "$(dirname "$LOGFILE")"
}

reconcile_existing_preview() {
  local pid
  local listener

  pid="$(read_pidfile | head -n 1 || true)"
  if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
    if is_preview_process "$pid"; then
      echo "reusing preview pid=$pid port=$PORT url=http://$HOST:$PORT/"
      exit 0
    fi
  fi

  if [[ -f "$PIDFILE" ]]; then
    rm -f "$PIDFILE"
  fi

  listener="$(listener_pids_for_port | head -n 1 || true)"
  if [[ -n "${listener:-}" ]] && kill -0 "$listener" 2>/dev/null; then
    if is_preview_process "$listener"; then
      echo "$listener" >"$PIDFILE"
      echo "reusing preview pid=$listener port=$PORT url=http://$HOST:$PORT/"
      exit 0
    fi

    echo "port $PORT is already in use by pid=$listener; refusing to kill a non-preview process" >&2
    echo "choose another port, or stop that process manually" >&2
    exit 1
  fi
}

start_preview() {
  local python_bin
  if command -v python3 >/dev/null 2>&1; then
    python_bin="python3"
  elif command -v python >/dev/null 2>&1; then
    python_bin="python"
  else
    echo "missing command: python3 (or python)" >&2
    exit 1
  fi

  if command -v setsid >/dev/null 2>&1; then
    setsid "$python_bin" -m http.server "$PORT" --bind "$HOST" --directory "$ROOT" >"$LOGFILE" 2>&1 < /dev/null &
  else
    nohup "$python_bin" -m http.server "$PORT" --bind "$HOST" --directory "$ROOT" >"$LOGFILE" 2>&1 < /dev/null &
  fi
  echo $! >"$PIDFILE"
}

need_cmd curl
[[ -d "$ROOT" ]] || {
  echo "preview root does not exist: $ROOT" >&2
  exit 1
}

ensure_dir
reconcile_existing_preview
start_preview

if wait_for_server; then
  NEW_PID="$(cat "$PIDFILE" 2>/dev/null || true)"
  echo "started pid=$NEW_PID port=$PORT root=$ROOT url=http://$HOST:$PORT/ log=$LOGFILE"
else
  echo "preview failed to become ready; see log: $LOGFILE" >&2
  exit 1
fi
