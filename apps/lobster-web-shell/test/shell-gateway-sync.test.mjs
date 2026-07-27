import test from "node:test";
import assert from "node:assert/strict";

let syncModule = null;
try {
  syncModule = await import("../shell-gateway-sync.js");
} catch {
  syncModule = null;
}

test("gateway sync controller owns refresh lifecycle and successful timestamp", async () => {
  assert.equal(typeof syncModule?.createGatewaySyncController, "function");
  const events = [];
  let controller = null;
  controller = syncModule.createGatewaySyncController({
    getGatewayUrl: () => "http://gateway",
    loadWorldState: async () => {
      events.push(["world", controller.isRefreshing(), controller.lastErrorMessage()]);
      return true;
    },
    loadShellState: async () => false,
    loadProviderState: async () => false,
    now: () => 42_000,
    onRefreshStart: () => events.push(["start", controller.isRefreshing()]),
    onRefreshSettled: (changes) => events.push(["settled", changes, controller.isRefreshing()]),
  });

  const changes = await controller.refresh();

  assert.deepEqual(changes, {
    worldChanged: true,
    shellChanged: false,
    providerChanged: false,
  });
  assert.equal(controller.isRefreshing(), false);
  assert.equal(controller.lastSuccessAtMs(), 42_000);
  assert.equal(controller.lastErrorMessage(), "");
  assert.deepEqual(events, [
    ["start", true],
    ["world", true, ""],
    ["settled", changes, false],
  ]);
});

test("gateway sync controller records an empty refresh without throwing by default", async () => {
  const settled = [];
  const controller = syncModule.createGatewaySyncController({
    getGatewayUrl: () => "http://gateway",
    loadWorldState: async () => false,
    loadShellState: async () => false,
    loadProviderState: async () => false,
    onRefreshSettled: (changes) => settled.push(changes),
  });

  await assert.doesNotReject(() => controller.refresh());

  assert.equal(controller.lastSuccessAtMs(), null);
  assert.equal(controller.lastErrorMessage(), "同步未取到新状态");
  assert.deepEqual(settled, [{
    worldChanged: false,
    shellChanged: false,
    providerChanged: false,
  }]);
});

test("required shell refresh rejects with the normalized failure and still settles", async () => {
  const events = [];
  const controller = syncModule.createGatewaySyncController({
    getGatewayUrl: () => "http://gateway",
    loadWorldState: async () => { throw new Error("network down"); },
    loadShellState: async () => false,
    loadProviderState: async () => false,
    formatError: (error, fallback) => `${fallback}: ${error.message}`,
    onRefreshSettled: (changes) => events.push(["settled", changes]),
  });

  await assert.rejects(
    () => controller.refresh({ requireShell: true }),
    /同步失败: network down/,
  );

  assert.equal(controller.isRefreshing(), false);
  assert.equal(controller.lastErrorMessage(), "同步失败: network down");
  assert.deepEqual(events, [["settled", {
    worldChanged: false,
    shellChanged: false,
    providerChanged: false,
  }]]);
});

test("external realtime and runtime outcomes update the same sync state", () => {
  let nowMs = 10_000;
  const controller = syncModule.createGatewaySyncController({
    now: () => nowMs,
    formatError: (error, fallback) => `${fallback}: ${error.message}`,
  });

  assert.equal(controller.recordFailure(new Error("sse failed"), "实时同步失败"), "实时同步失败: sse failed");
  assert.equal(controller.lastErrorMessage(), "实时同步失败: sse failed");

  nowMs = 11_000;
  controller.recordSuccess();
  assert.equal(controller.lastSuccessAtMs(), 11_000);
  assert.equal(controller.lastErrorMessage(), "");
});
