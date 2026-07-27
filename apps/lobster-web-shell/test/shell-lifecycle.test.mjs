import { test } from "node:test";
import assert from "node:assert/strict";

let lifecycleModule = null;
try {
  lifecycleModule = await import("../shell-lifecycle.js");
} catch {
  lifecycleModule = null;
}

test("runShellStartup preserves the shell boot sequence", async () => {
  assert.equal(typeof lifecycleModule?.runShellStartup, "function");
  const calls = [];

  await lifecycleModule.runShellStartup({
    initializeLocalState: () => calls.push("initialize-local"),
    loadInitialRuntimeState: async () => calls.push("load-runtime"),
    bindSceneEditorLink: () => calls.push("bind-scene-editor"),
    loadWorldEntry: async () => calls.push("load-world-entry"),
    renderInitialShell: () => calls.push("render-shell"),
    startGatewayRealtime: () => calls.push("start-realtime"),
    focusComposerInput: (options) => calls.push(["focus-composer", options]),
  });

  assert.deepEqual(calls, [
    "initialize-local",
    "load-runtime",
    "bind-scene-editor",
    "load-world-entry",
    "render-shell",
    "start-realtime",
    ["focus-composer", { force: true }],
  ]);
});

test("bindShellForegroundLifecycle refreshes visible pages and returns cleanup", async () => {
  assert.equal(typeof lifecycleModule?.bindShellForegroundLifecycle, "function");
  const documentHandlers = new Map();
  const windowHandlers = new Map();
  const removed = [];
  const doc = {
    visibilityState: "hidden",
    addEventListener(type, handler) { documentHandlers.set(type, handler); },
    removeEventListener(type, handler) { removed.push(["document", type, handler]); },
  };
  const win = {
    addEventListener(type, handler) { windowHandlers.set(type, handler); },
    removeEventListener(type, handler) { removed.push(["window", type, handler]); },
  };
  const refreshes = [];

  const cleanup = lifecycleModule.bindShellForegroundLifecycle({
    doc,
    win,
    refreshOnForeground: async (reason) => refreshes.push(reason),
  });

  await documentHandlers.get("visibilitychange")();
  assert.deepEqual(refreshes, []);
  doc.visibilityState = "visible";
  await documentHandlers.get("visibilitychange")();
  await windowHandlers.get("focus")();
  await windowHandlers.get("pageshow")();
  assert.deepEqual(refreshes, ["visibilitychange", "focus", "pageshow"]);

  cleanup();
  assert.deepEqual(
    removed.map(([target, type]) => [target, type]),
    [
      ["document", "visibilitychange"],
      ["window", "focus"],
      ["window", "pageshow"],
    ],
  );
});
