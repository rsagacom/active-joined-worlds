// Owns one shell instance's fallback polling interval. Gateway snapshots remain
// canonical and are applied by the injected refresh function.

export function createGatewayPollingController({
  getGatewayUrl = () => "",
  getRefreshIntervalMs = () => 4000,
  isRefreshInProgress = () => false,
  isDocumentHidden = () => false,
  refreshFromGateway = async () => {},
  onPollingError = () => {},
  onForegroundError = () => {},
  now = Date.now,
  foregroundThrottleMs = 1200,
  setIntervalFn = globalThis.setInterval,
  clearIntervalFn = globalThis.clearInterval,
} = {}) {
  let intervalId = null;
  let lastForegroundRefreshAtMs = 0;

  function stop() {
    if (intervalId === null) return;
    clearIntervalFn(intervalId);
    intervalId = null;
  }

  function start() {
    stop();
    if (!getGatewayUrl()) return null;
    intervalId = setIntervalFn(async () => {
      try {
        await refreshFromGateway();
      } catch (error) {
        onPollingError(error);
      }
    }, getRefreshIntervalMs());
    return intervalId;
  }

  async function refreshOnForeground(reason = "foreground") {
    if (!getGatewayUrl() || isRefreshInProgress() || isDocumentHidden()) return false;
    const currentTimeMs = now();
    if (currentTimeMs - lastForegroundRefreshAtMs < foregroundThrottleMs) return false;
    lastForegroundRefreshAtMs = currentTimeMs;
    try {
      await refreshFromGateway();
      return true;
    } catch (error) {
      onForegroundError(error, reason);
      return false;
    }
  }

  return { refreshOnForeground, start, stop };
}
