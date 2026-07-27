export async function runShellStartup({
  initializeLocalState,
  loadInitialRuntimeState,
  bindSceneEditorLink,
  loadWorldEntry,
  renderInitialShell,
  startGatewayRealtime,
  focusComposerInput,
}) {
  initializeLocalState();
  await loadInitialRuntimeState();
  bindSceneEditorLink();
  await loadWorldEntry();
  renderInitialShell();
  startGatewayRealtime();
  focusComposerInput({ force: true });
}

export function bindShellForegroundLifecycle({
  doc = globalThis.document,
  win = globalThis.window,
  refreshOnForeground,
}) {
  const onVisibilityChange = async () => {
    if (doc.visibilityState === "visible") {
      await refreshOnForeground("visibilitychange");
    }
  };
  const onFocus = async () => {
    await refreshOnForeground("focus");
  };
  const onPageShow = async () => {
    await refreshOnForeground("pageshow");
  };

  doc.addEventListener("visibilitychange", onVisibilityChange);
  win.addEventListener("focus", onFocus);
  win.addEventListener("pageshow", onPageShow);

  return () => {
    doc.removeEventListener("visibilitychange", onVisibilityChange);
    win.removeEventListener("focus", onFocus);
    win.removeEventListener("pageshow", onPageShow);
  };
}
