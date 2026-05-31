import assert from "node:assert/strict";
import test from "node:test";
import {
  applyLocalTimeOfDayState,
  availableWorkspacesForShellMode,
  currentShellPage,
  defaultIdentityForShellMode,
  defaultWorkspaceForShellMode,
  localTimeOfDay,
  normalizeProviderConnectionState,
  parseStoredObject,
  providerIndicatesGatewayOffline,
  resolveShellMode,
  safeLocalStorageGet,
  safeLocalStorageSet,
  scopedShellStorageKey,
  setNodeText,
  shellModeConfig,
  translateDeliveryMode,
  translateProviderConnectionState,
  translateWorkspace,
  translateShellMode,
} from "../shell-shared.js";

test("localTimeOfDay switches at day/night boundaries", () => {
  assert.equal(localTimeOfDay(new Date("2026-05-16T05:59:00")), "night");
  assert.equal(localTimeOfDay(new Date("2026-05-16T06:00:00")), "day");
  assert.equal(localTimeOfDay(new Date("2026-05-16T17:59:00")), "day");
  assert.equal(localTimeOfDay(new Date("2026-05-16T18:00:00")), "night");
});

test("shell page and mode helpers read body defaults and query fallback", () => {
  const body = { dataset: { shellPage: "user", defaultShellMode: "admin" } };
  assert.equal(currentShellPage(body), "user");
  assert.equal(currentShellPage({ dataset: {} }), "hub");
  assert.equal(resolveShellMode({ body, href: "http://localhost/?mode=user" }), "admin");
  assert.equal(resolveShellMode({ body: { dataset: {} }, href: "http://localhost/?mode=user" }), "user");
  assert.equal(resolveShellMode({ body: { dataset: {} }, href: "http://localhost/?mode=bad" }), "unified");
});

test("applyLocalTimeOfDayState only fills missing body time marker", () => {
  const body = { dataset: {} };
  applyLocalTimeOfDayState(body, new Date("2026-05-16T06:00:00"));
  assert.equal(body.dataset.timeOfDay, "day");
  applyLocalTimeOfDayState(body, new Date("2026-05-16T18:00:00"));
  assert.equal(body.dataset.timeOfDay, "day");
});

test("storage and text helpers tolerate unavailable browser APIs", () => {
  const storage = new Map();
  const facade = {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, value);
    },
  };
  safeLocalStorageSet("draft", "hello", facade);
  assert.equal(safeLocalStorageGet("draft", facade), "hello");
  assert.equal(safeLocalStorageGet("draft", { getItem: () => { throw new Error("blocked"); } }), null);
  assert.doesNotThrow(() => safeLocalStorageSet("draft", "x", { setItem: () => { throw new Error("blocked"); } }));
  const node = { textContent: "" };
  setNodeText(node, "状态");
  assert.equal(node.textContent, "状态");
  assert.doesNotThrow(() => setNodeText(null, "ignored"));
});

test("scoped storage helpers keep shell page and mode isolated", () => {
  assert.equal(
    scopedShellStorageKey("room-drafts", "creative", "user"),
    "lobster-room-drafts:creative:user",
  );
  assert.equal(
    scopedShellStorageKey("workspace", "hub", "unified"),
    "lobster-workspace:hub:unified",
  );
  assert.deepEqual(parseStoredObject('{"room":"draft"}'), { room: "draft" });
  assert.deepEqual(parseStoredObject("[]"), {});
  assert.deepEqual(parseStoredObject("{bad json"), {});
  assert.deepEqual(parseStoredObject(""), {});
});

test("shellModeConfig returns stable copy for each shell mode", () => {
  assert.equal(shellModeConfig("user").title, "房间内聊天主界面");
  assert.equal(shellModeConfig("admin").title, "左侧选工具，中间处理当前事务");
  assert.equal(shellModeConfig("unified").title, "城市外世界页");
  assert.equal(shellModeConfig("unknown").guide.length, 4);
});

test("shell mode labels and default identities stay aligned", () => {
  assert.equal(translateShellMode("user"), "房间聊天");
  assert.equal(translateShellMode("admin"), "管理后台");
  assert.equal(translateShellMode("unified"), "城市外世界页");
  assert.equal(defaultIdentityForShellMode("user"), "访客");
  assert.equal(defaultIdentityForShellMode("admin"), "rsaga");
  assert.equal(defaultIdentityForShellMode("unified"), "builder");
});

test("workspace helpers keep user mode chat-only and label management surfaces", () => {
  assert.equal(defaultWorkspaceForShellMode("admin"), "chat");
  assert.deepEqual(availableWorkspacesForShellMode("user"), ["chat"]);
  assert.deepEqual(availableWorkspacesForShellMode("admin"), ["chat", "world", "auth", "governance"]);
  assert.equal(translateWorkspace("world"), "广场");
  assert.equal(translateWorkspace("auth"), "身份");
  assert.equal(translateWorkspace("governance"), "后台");
  assert.equal(translateWorkspace("chat"), "聊天");
});

test("provider connection states normalize and translate provider aliases", () => {
  assert.equal(normalizeProviderConnectionState("online"), "Connected");
  assert.equal(normalizeProviderConnectionState("CONNECTED"), "Connected");
  assert.equal(normalizeProviderConnectionState("offline"), "Disconnected");
  assert.equal(normalizeProviderConnectionState("syncing"), "Connecting");
  assert.equal(normalizeProviderConnectionState("bad-state"), "Unknown");
  assert.equal(translateProviderConnectionState("online"), "已连接");
  assert.equal(translateProviderConnectionState("offline"), "已断开");
  assert.equal(translateProviderConnectionState("syncing"), "连线中");
  assert.equal(translateProviderConnectionState("bad-state"), "状态未知");
});

test("provider availability keeps local memory gateway online without upstream", () => {
  assert.equal(
    providerIndicatesGatewayOffline({
      providerLoaded: true,
      provider: {
        mode: "local-memory",
        reachable: true,
        connection_state: "Disconnected",
        base_url: null,
      },
    }),
    false,
  );
  assert.equal(
    providerIndicatesGatewayOffline({
      providerLoaded: true,
      provider: {
        mode: "remote-gateway",
        reachable: true,
        connection_state: "Disconnected",
        base_url: "http://127.0.0.1:8787",
      },
    }),
    true,
  );
  assert.equal(
    providerIndicatesGatewayOffline({
      providerLoaded: true,
      provider: {
        mode: "local-memory",
        reachable: false,
        connection_state: "Connected",
        base_url: null,
      },
    }),
    true,
  );
  assert.equal(providerIndicatesGatewayOffline({ providerLoaded: false }), false);
});

test("translateDeliveryMode maps OTP delivery labels", () => {
  assert.equal(translateDeliveryMode("dev-inline-code"), "开发环境直出验证码");
  assert.equal(translateDeliveryMode("mailer-adapter-pending"), "邮件通道待接入");
  assert.equal(translateDeliveryMode("email"), "邮箱投递");
  assert.equal(translateDeliveryMode("unknown"), "未知投递方式");
});
