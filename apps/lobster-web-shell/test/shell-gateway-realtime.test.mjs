import test from "node:test";
import assert from "node:assert/strict";

let realtimeModule = null;
try {
  realtimeModule = await import("../shell-gateway-realtime.js");
} catch {
  realtimeModule = null;
}

class FakeEventSource {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.closed = false;
    this.listeners = new Map();
    this.onerror = null;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type, handler) {
    this.listeners.set(type, handler);
  }

  async emit(type, payload) {
    return this.listeners.get(type)?.({ data: JSON.stringify(payload) });
  }

  close() {
    this.closed = true;
  }
}

function createHarness({ gatewayUrl = "http://gateway", lastVersion = null } = {}) {
  FakeEventSource.instances = [];
  const calls = [];
  const timers = new Map();
  let nextTimerId = 1;
  let currentVersion = lastVersion;
  const controller = realtimeModule?.createGatewayRealtimeController?.({
    getGatewayUrl: () => gatewayUrl,
    getLastStateVersion: () => currentVersion,
    setLastStateVersion: (value) => { currentVersion = value; },
    buildEventsUrl: ({ afterVersion }) => `${gatewayUrl}/events?after=${afterVersion || ""}`,
    applyShellStatePayload: async (payload, options) => {
      calls.push(["apply", payload, options]);
      return true;
    },
    onShellStateApplied: () => calls.push(["render"]),
    onSyncSuccess: () => calls.push(["success"]),
    onSyncError: (error) => calls.push(["error", error.message]),
    refreshFromGateway: async () => { calls.push(["refresh"]); },
    startPolling: () => calls.push(["poll"]),
    stopPolling: () => calls.push(["stop-poll"]),
    EventSourceCtor: FakeEventSource,
    setTimeoutFn: (callback) => {
      const id = nextTimerId++;
      timers.set(id, callback);
      return id;
    },
    clearTimeoutFn: (id) => timers.delete(id),
  });
  return {
    calls,
    controller,
    get currentVersion() { return currentVersion; },
    runNextTimer() {
      const [id, callback] = timers.entries().next().value || [];
      if (!callback) return false;
      timers.delete(id);
      callback();
      return true;
    },
    timers,
  };
}

test("gateway realtime controller falls back to polling when SSE is unavailable", () => {
  assert.equal(typeof realtimeModule?.createGatewayRealtimeController, "function");
  const calls = [];
  const controller = realtimeModule.createGatewayRealtimeController({
    getGatewayUrl: () => "",
    startPolling: () => calls.push("poll"),
    EventSourceCtor: FakeEventSource,
  });

  controller.start();

  assert.deepEqual(calls, ["poll"]);
  assert.equal(FakeEventSource.instances.length, 0);
});

test("gateway realtime controller applies a snapshot and reconnects from its version", async () => {
  const harness = createHarness();

  harness.controller.start();
  const firstSource = FakeEventSource.instances[0];
  assert.equal(firstSource.url, "http://gateway/events?after=");
  await firstSource.emit("shell-state", { state_version: "version-2", rooms: [] });

  assert.equal(harness.currentVersion, "version-2");
  assert.deepEqual(harness.calls, [
    ["stop-poll"],
    ["apply", { state_version: "version-2", rooms: [] }, { persist: true }],
    ["success"],
    ["render"],
  ]);
  assert.equal(firstSource.closed, true);
  assert.equal(harness.timers.size, 1);

  assert.equal(harness.runNextTimer(), true);
  assert.equal(FakeEventSource.instances[1].url, "http://gateway/events?after=version-2");
});

test("gateway realtime controller skips duplicate snapshots but keeps the stream cursor alive", async () => {
  const harness = createHarness({ lastVersion: "version-2" });

  harness.controller.start();
  await FakeEventSource.instances[0].emit("shell-state", { state_version: "version-2" });

  assert.deepEqual(harness.calls, [["stop-poll"], ["success"]]);
  assert.equal(harness.timers.size, 1);
});

test("gateway realtime controller refreshes and polls after a pre-snapshot transport error", () => {
  const harness = createHarness();

  harness.controller.start();
  const source = FakeEventSource.instances[0];
  source.onerror();

  assert.equal(source.closed, true);
  assert.deepEqual(harness.calls, [["stop-poll"], ["refresh"], ["poll"]]);
  assert.equal(harness.timers.size, 0);
});

test("gateway realtime controller reports malformed snapshots without claiming success", async () => {
  const harness = createHarness();

  harness.controller.start();
  const source = FakeEventSource.instances[0];
  await source.listeners.get("shell-state")({ data: "{" });

  assert.equal(harness.calls[0][0], "stop-poll");
  assert.equal(harness.calls[1][0], "error");
  assert.match(harness.calls[1][1], /JSON|position|property/i);
  assert.equal(harness.timers.size, 0);
});
