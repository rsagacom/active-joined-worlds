// Owns one shell instance's Gateway refresh lifecycle and status projection.
// Canonical room/world/provider data still comes from the injected Gateway loaders.

export function createGatewaySyncController({
  getGatewayUrl = () => "",
  loadWorldState = async () => false,
  loadShellState = async () => false,
  loadProviderState = async () => false,
  formatError = (error, fallback) => error?.message || fallback,
  onRefreshStart = () => {},
  onRefreshSettled = () => {},
  now = Date.now,
} = {}) {
  let refreshing = false;
  let successAtMs = null;
  let errorMessage = "";

  function isRefreshing() {
    return refreshing;
  }

  function lastSuccessAtMs() {
    return successAtMs;
  }

  function lastErrorMessage() {
    return errorMessage;
  }

  function recordSuccess(atMs = now()) {
    successAtMs = atMs;
    errorMessage = "";
  }

  function recordFailure(error, fallback = "同步失败") {
    errorMessage = formatError(error, fallback);
    return errorMessage;
  }

  async function refresh({ requireShell = false } = {}) {
    refreshing = true;
    errorMessage = "";
    onRefreshStart();

    const changes = {
      worldChanged: false,
      shellChanged: false,
      providerChanged: false,
    };

    try {
      [changes.worldChanged, changes.shellChanged, changes.providerChanged] = await Promise.all([
        loadWorldState(),
        loadShellState(),
        loadProviderState(),
      ]);
      const changed = changes.worldChanged || changes.shellChanged || changes.providerChanged;
      if (!changed && getGatewayUrl()) {
        errorMessage = "同步未取到新状态";
        if (requireShell) throw new Error(errorMessage);
      } else if (changed) {
        recordSuccess();
      }
    } catch (error) {
      recordFailure(error, "同步失败");
      if (requireShell) throw new Error(errorMessage);
    } finally {
      refreshing = false;
      onRefreshSettled(changes);
    }

    return changes;
  }

  return {
    isRefreshing,
    lastErrorMessage,
    lastSuccessAtMs,
    recordFailure,
    recordSuccess,
    refresh,
  };
}
