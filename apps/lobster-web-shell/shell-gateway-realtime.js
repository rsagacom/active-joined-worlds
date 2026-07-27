// Owns the browser-side SSE connection and reconnect timer. Canonical chat state
// remains in the Gateway payload supplied through applyShellStatePayload.

export function gatewayRealtimeStateVersion(payload) {
  return typeof payload?.state_version === "string" && payload.state_version.trim()
    ? payload.state_version.trim()
    : null;
}

export function createGatewayRealtimeController({
  getGatewayUrl = () => "",
  getLastStateVersion = () => null,
  setLastStateVersion = () => {},
  buildEventsUrl = () => "",
  applyShellStatePayload = async () => false,
  onShellStateApplied = () => {},
  onSyncSuccess = () => {},
  onSyncError = () => {},
  refreshFromGateway = async () => {},
  startPolling = () => {},
  stopPolling = () => {},
  EventSourceCtor = globalThis.EventSource,
  setTimeoutFn = globalThis.setTimeout,
  clearTimeoutFn = globalThis.clearTimeout,
} = {}) {
  let eventSource = null;
  let restartTimer = null;

  function supported() {
    return Boolean(getGatewayUrl() && typeof EventSourceCtor === "function");
  }

  function stop({ clearRestart = true } = {}) {
    if (clearRestart && restartTimer !== null) {
      clearTimeoutFn(restartTimer);
      restartTimer = null;
    }
    eventSource?.close?.();
    eventSource = null;
  }

  function scheduleRestart(afterVersion) {
    if (!supported() || !afterVersion) return;
    if (restartTimer !== null) clearTimeoutFn(restartTimer);
    stop({ clearRestart: false });
    restartTimer = setTimeoutFn(() => {
      restartTimer = null;
      start({ afterVersion });
    }, 0);
  }

  async function handleShellStateEvent(event) {
    const payload = JSON.parse(event.data || "{}");
    const incomingStateVersion = gatewayRealtimeStateVersion(payload);
    if (incomingStateVersion && incomingStateVersion === getLastStateVersion()) {
      onSyncSuccess();
      scheduleRestart(incomingStateVersion);
      return true;
    }

    const changed = await applyShellStatePayload(payload, { persist: true });
    if (!changed) return false;
    if (incomingStateVersion) setLastStateVersion(incomingStateVersion);
    onSyncSuccess();
    onShellStateApplied();
    scheduleRestart(incomingStateVersion);
    return true;
  }

  function handleError(hasReceivedSnapshot) {
    stop();
    if (!hasReceivedSnapshot) {
      void Promise.resolve(refreshFromGateway()).catch(onSyncError);
      startPolling();
      return;
    }
    const lastStateVersion = getLastStateVersion();
    if (lastStateVersion) {
      scheduleRestart(lastStateVersion);
    } else {
      startPolling();
    }
  }

  function start({ afterVersion = getLastStateVersion() } = {}) {
    stop();
    if (!supported()) {
      startPolling();
      return null;
    }

    stopPolling();
    let hasReceivedSnapshot = false;
    eventSource = new EventSourceCtor(buildEventsUrl({ afterVersion }));
    const source = eventSource;
    source.addEventListener("shell-state", async (event) => {
      try {
        hasReceivedSnapshot = (await handleShellStateEvent(event)) || hasReceivedSnapshot;
      } catch (error) {
        onSyncError(error);
      }
    });
    source.onerror = () => handleError(hasReceivedSnapshot);
    return source;
  }

  return {
    handleShellStateEvent,
    scheduleRestart,
    start,
    stop,
    supported,
  };
}
