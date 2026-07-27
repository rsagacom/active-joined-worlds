import test from "node:test";
import assert from "node:assert/strict";

let pollingModule = null;
try {
  pollingModule = await import("../shell-gateway-polling.js");
} catch {
  pollingModule = null;
}

test("gateway polling controller owns and replaces its interval", () => {
  assert.equal(typeof pollingModule?.createGatewayPollingController, "function");
  const scheduled = new Map();
  const cleared = [];
  let nextId = 1;
  const controller = pollingModule.createGatewayPollingController({
    getGatewayUrl: () => "http://gateway",
    getRefreshIntervalMs: () => 3200,
    refreshFromGateway: async () => {},
    setIntervalFn: (callback, intervalMs) => {
      const id = nextId++;
      scheduled.set(id, { callback, intervalMs });
      return id;
    },
    clearIntervalFn: (id) => {
      cleared.push(id);
      scheduled.delete(id);
    },
  });

  assert.equal(controller.start(), 1);
  assert.equal(scheduled.get(1).intervalMs, 3200);
  assert.equal(controller.start(), 2);
  assert.deepEqual(cleared, [1]);
  controller.stop();
  assert.deepEqual(cleared, [1, 2]);
  assert.equal(scheduled.size, 0);
});

test("foreground refresh respects visibility, in-flight state and throttle", async () => {
  let nowMs = 10_000;
  let hidden = false;
  let refreshing = false;
  const refreshes = [];
  const controller = pollingModule.createGatewayPollingController({
    getGatewayUrl: () => "http://gateway",
    isRefreshInProgress: () => refreshing,
    isDocumentHidden: () => hidden,
    now: () => nowMs,
    foregroundThrottleMs: 1200,
    refreshFromGateway: async () => { refreshes.push(nowMs); },
  });

  assert.equal(await controller.refreshOnForeground("focus"), true);
  nowMs = 10_500;
  assert.equal(await controller.refreshOnForeground("pageshow"), false);
  nowMs = 11_500;
  hidden = true;
  assert.equal(await controller.refreshOnForeground("visibilitychange"), false);
  hidden = false;
  refreshing = true;
  assert.equal(await controller.refreshOnForeground("focus"), false);
  refreshing = false;
  assert.equal(await controller.refreshOnForeground("focus"), true);

  assert.deepEqual(refreshes, [10_000, 11_500]);
});

test("polling refresh failures are reported without escaping the timer", async () => {
  let tick = null;
  const errors = [];
  const controller = pollingModule.createGatewayPollingController({
    getGatewayUrl: () => "http://gateway",
    refreshFromGateway: async () => { throw new Error("poll failed"); },
    onPollingError: (error) => errors.push(error.message),
    setIntervalFn: (callback) => { tick = callback; return 1; },
    clearIntervalFn: () => {},
  });

  controller.start();
  await assert.doesNotReject(() => tick());
  assert.deepEqual(errors, ["poll failed"]);
});

test("foreground refresh failures include the lifecycle reason", async () => {
  const errors = [];
  const controller = pollingModule.createGatewayPollingController({
    getGatewayUrl: () => "http://gateway",
    now: () => 10_000,
    refreshFromGateway: async () => { throw new Error("foreground failed"); },
    onForegroundError: (error, reason) => errors.push([error.message, reason]),
  });

  assert.equal(await controller.refreshOnForeground("pageshow"), false);
  assert.deepEqual(errors, [["foreground failed", "pageshow"]]);
});
