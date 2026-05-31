import test from "node:test";
import assert from "node:assert/strict";
import { composerStatusState } from "../shell-composer.js";

const serial = { concurrency: false };

// ====== composerStatusState ======

test("composerStatusState: gateway 不可用返回 danger", serial, () => {
  const result = composerStatusState({
    shellPage: "hub",
    gatewayUnavailable: true,
    loginRequired: false,
    activeRoomId: "r1",
  });
  assert.equal(result.tone, "danger");
  assert.ok(result.text.includes("离线"));
});

test("composerStatusState: 需要登录返回 warning", serial, () => {
  const result = composerStatusState({
    shellPage: "hub",
    gatewayUnavailable: false,
    loginRequired: true,
    activeRoomId: "r1",
  });
  assert.equal(result.tone, "warning");
  assert.ok(result.text.includes("登录"));
});

test("composerStatusState: 无房间有网关 hub 页", serial, () => {
  const result = composerStatusState({
    shellPage: "hub",
    gatewayUrl: "http://gw",
    gatewayUnavailable: false,
    loginRequired: false,
    activeRoomId: null,
  });
  assert.equal(result.tone, "muted");
  assert.ok(result.text.includes("先选会话"));
});

test("composerStatusState: 无房间无网关 admin 页", serial, () => {
  const result = composerStatusState({
    shellPage: "admin",
    gatewayUrl: "",
    gatewayUnavailable: false,
    loginRequired: false,
    activeRoomId: null,
  });
  assert.equal(result.tone, "muted");
  assert.ok(result.text.includes("记录"));
});

test("composerStatusState: 有房间有发送错误", serial, () => {
  const result = composerStatusState({
    shellPage: "hub",
    gatewayUrl: "http://gw",
    gatewayUnavailable: false,
    loginRequired: false,
    activeRoomId: "r1",
    roomSendErrors: { r1: "网络超时" },
  });
  assert.equal(result.tone, "danger");
  assert.ok(result.text.includes("网络超时"));
});

test("composerStatusState: 有房间有刷新错误", serial, () => {
  const result = composerStatusState({
    shellPage: "hub",
    gatewayUrl: "http://gw",
    gatewayUnavailable: false,
    loginRequired: false,
    activeRoomId: "r1",
    lastRefreshErrorMessage: "同步失败",
  });
  assert.equal(result.tone, "warning");
  assert.ok(result.text.includes("同步失败"));
});

test("composerStatusState: 发送中", serial, () => {
  const result = composerStatusState({
    shellPage: "hub",
    gatewayUrl: "http://gw",
    gatewayUnavailable: false,
    loginRequired: false,
    activeRoomId: "r1",
    isSendingMessage: true,
  });
  assert.equal(result.tone, "accent");
  assert.ok(result.text.includes("发送中"));
});

test("composerStatusState: 有草稿", serial, () => {
  const result = composerStatusState({
    shellPage: "hub",
    gatewayUrl: "http://gw",
    gatewayUnavailable: false,
    loginRequired: false,
    activeRoomId: "r1",
    draftText: "  测试草稿  ",
  });
  assert.equal(result.tone, "accent");
  assert.ok(result.text.includes("草稿已暂存") || result.text.includes("字"));
});

test("composerStatusState: 有草稿使用 quickActionDraftStatusCopyFn", serial, () => {
  const result = composerStatusState({
    shellPage: "hub",
    gatewayUrl: "http://gw",
    gatewayUnavailable: false,
    loginRequired: false,
    activeRoomId: "r1",
    draftText: "hello",
    quickAction: "整理",
    quickActionDraftStatusCopyFn: (action, len) => `${action} · ${len} 字`,
  });
  assert.equal(result.tone, "accent");
  assert.equal(result.text, "整理 · 5 字");
});

test("composerStatusState: 正常在线有房间", serial, () => {
  const result = composerStatusState({
    shellPage: "hub",
    gatewayUrl: "http://gw",
    gatewayUnavailable: false,
    loginRequired: false,
    activeRoomId: "r1",
    syncLabel: "已同步",
  });
  assert.equal(result.tone, "muted");
  assert.ok(result.text.includes("已同步"));
});

test("composerStatusState: 正常离线有房间", serial, () => {
  const result = composerStatusState({
    shellPage: "hub",
    gatewayUrl: "",
    gatewayUnavailable: false,
    loginRequired: false,
    activeRoomId: "r1",
  });
  assert.equal(result.tone, "muted");
  assert.ok(result.text.includes("离线预览态"));
});
