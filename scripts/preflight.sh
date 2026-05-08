#!/usr/bin/env bash
set -euo pipefail

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing command: $1" >&2
    exit 1
  }
}

need_cmd uname
need_cmd awk
need_cmd df
need_cmd sort

version_ge() {
  local current="$1"
  local minimum="$2"
  [[ -n "$current" ]] || return 1
  printf '%s\n%s\n' "$minimum" "$current" | sort -V -C
}

detect_target_triple() {
  local os="$1"
  local arch="$2"
  case "$os:$arch" in
    Linux:x86_64) echo "x86_64-unknown-linux-gnu" ;;
    Linux:aarch64|Linux:arm64) echo "aarch64-unknown-linux-gnu" ;;
    Darwin:x86_64) echo "x86_64-apple-darwin" ;;
    Darwin:arm64|Darwin:aarch64) echo "aarch64-apple-darwin" ;;
    *) echo "unknown" ;;
  esac
}

detect_mem_mib() {
  local os="$1"
  case "$os" in
    Linux)
      if [[ -r /proc/meminfo ]]; then
        awk '/MemTotal:/ { print int($2 / 1024) }' /proc/meminfo
      elif command -v free >/dev/null 2>&1; then
        free -m | awk 'NR==2 { for (i = 1; i <= NF; i++) if ($i ~ /^[0-9]+$/) { print $i; exit } }'
      else
        echo 0
      fi
      ;;
    Darwin)
      if command -v sysctl >/dev/null 2>&1; then
        sysctl -n hw.memsize 2>/dev/null | awk '{ print int($1 / 1024 / 1024) }'
      else
        echo 0
      fi
      ;;
    *)
      echo 0
      ;;
  esac
}

detect_disk_gib() {
  if df -BG / >/dev/null 2>&1; then
    df -BG / | awk 'NR==2 { gsub(/G/, "", $4); print $4 }'
  else
    df -g / | awk 'NR==2 { print $4 }'
  fi
}

os="$(uname -s)"
arch="$(uname -m)"
target_triple="$(detect_target_triple "$os" "$arch")"
mem_mib="$(detect_mem_mib "$os")"
disk_avail_gib="$(detect_disk_gib)"
case "$mem_mib" in
  ''|*[!0-9]*) mem_mib=0 ;;
esac
case "$disk_avail_gib" in
  ''|*[!0-9]*) disk_avail_gib=0 ;;
esac

echo "== lobster-chat preflight =="
echo "os:   $os"
echo "arch: $arch"
echo "triple: $target_triple"
echo "ram:  ${mem_mib}MiB"
echo "disk: ${disk_avail_gib}GiB free on /"

if command -v rustc >/dev/null 2>&1; then
  echo "rustc: $(rustc --version)"
else
  echo "rustc: not installed"
fi

if command -v cargo >/dev/null 2>&1; then
  cargo_version="$(cargo --version | awk '{ print $2 }')"
  echo "cargo: $(cargo --version)"
  if ! version_ge "$cargo_version" "1.85.0"; then
    echo "warning: cargo ${cargo_version} is older than the edition-2024 floor (1.85.0). install via rustup before building." >&2
  fi
else
  echo "cargo: not installed"
fi

if [[ "$os" != "Linux" ]]; then
  echo "warning: server install scripts are primarily tested on Linux." >&2
fi

if (( mem_mib < 1024 )); then
  echo "warning: less than 1 GiB memory detected. gateway may still run, but this is below the recommended floor." >&2
fi

if (( disk_avail_gib < 2 )); then
  echo "warning: less than 2 GiB free disk detected. this is below the recommended floor." >&2
fi

if command -v systemctl >/dev/null 2>&1; then
  echo "systemd: available"
else
  echo "warning: systemd not found. you will need another service supervisor." >&2
fi

if command -v nginx >/dev/null 2>&1; then
  echo "nginx: available"
else
  echo "nginx: not installed"
fi

echo "preflight complete"
