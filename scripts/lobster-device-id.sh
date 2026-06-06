#!/bin/bash
# lobster-device-id — 获取本机 MAC 地址作为设备标识
# 用法:
#   ./scripts/lobster-device-id.sh              → 只输出 MAC
#   ./scripts/lobster-device-id.sh --url <base> → 输出完整 URL（带 device_id 参数）

set -euo pipefail

# macOS: 优先取 en0（Wi-Fi），fallback 到 en1/en2/eth0
get_mac() {
  local iface=""
  for candidate in en0 en1 en2 eth0; do
    iface=$(ifconfig "$candidate" 2>/dev/null | awk '/ether/{print $2; exit}')
    if [[ -n "$iface" ]]; then
      echo "$iface"
      return 0
    fi
  done
  # 最后的 fallback：用 platform UUID（虽然不是 MAC，但是唯一且稳定）
  local uuid
  uuid=$(ioreg -d2 -c IOPlatformExpertDevice 2>/dev/null | awk -F\" '/IOPlatformUUID/{print $4; exit}')
  if [[ -n "$uuid" ]]; then
    echo "uuid:${uuid}"
    return 0
  fi
  echo "unknown"
  return 1
}

MAC=$(get_mac)

if [[ "${1:-}" == "--url" ]]; then
  BASE="${2:-http://127.0.0.1:18081/index.html}"
  # 检查 URL 是否已有参数
  if [[ "$BASE" == *\?* ]]; then
    echo "${BASE}&device_id=${MAC}"
  else
    echo "${BASE}?device_id=${MAC}"
  fi
else
  echo "$MAC"
fi
