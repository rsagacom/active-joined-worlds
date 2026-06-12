/* ============================================================
   shell-state.test.mjs — shell-state.js 单元测试
   覆盖：chatFocus / workspace / drafts / markers / quickStates / quickSnapshots
   ============================================================ */

import test from "node:test";
import assert from "node:assert/strict";

const storage = new Map();
const mockStorage = {
  getItem(k) { return storage.get(k) ?? null; },
  setItem(k, v) { storage.set(k, String(v)); },
  removeItem(k) { storage.delete(k); },
};

// Mock globalThis.window.localStorage before import
Object.defineProperty(globalThis, "window", {
  value: { localStorage: mockStorage },
  writable: true,
  configurable: true,
});

const mod = await import("../shell-state.js");

function resetStorage() {
  storage.clear();
}

// ─── Chat Focus ───────────────────────────────────────────

test("loadChatFocusPreference: 默认 false", () => {
  resetStorage();
  assert.equal(mod.loadChatFocusPreference(), false);
});

test("loadChatFocusPreference: 已存储 true 返回 true", () => {
  resetStorage();
  mockStorage.setItem("lobster-chat-focus", "true");
  assert.equal(mod.loadChatFocusPreference(), true);
});

test("persistChatFocusPreference: 存 true 写入 'true'", () => {
  resetStorage();
  mod.persistChatFocusPreference(true);
  assert.equal(mockStorage.getItem("lobster-chat-focus"), "true");
});

test("persistChatFocusPreference: 存 false 写入 'false'", () => {
  resetStorage();
  mod.persistChatFocusPreference(false);
  assert.equal(mockStorage.getItem("lobster-chat-focus"), "false");
});

// ─── Workspace / Chat Pane ────────────────────────────────

test("resolveWorkspace: admin 页面直接返回 'chat'", () => {
  assert.equal(mod.resolveWorkspace("admin", "sfc", null, null), "chat");
});

test("resolveWorkspace: user 页面直接返回 'chat'", () => {
  assert.equal(mod.resolveWorkspace("user", "sfc", null, null), "chat");
});

test("resolveWorkspace: 优先使用 URL surface 参数 (chat)", () => {
  const url = new URL("http://localhost/?surface=chat");
  assert.equal(mod.resolveWorkspace("index", "sfc", url, null), "chat");
});

test("resolveWorkspace: 优先使用 URL surface 参数 (world)", () => {
  const url = new URL("http://localhost/?surface=world");
  assert.equal(mod.resolveWorkspace("index", "sfc", url, null), "world");
});

test("resolveWorkspace: URL 无 surface 时使用 stored", () => {
  resetStorage();
  const url = new URL("http://localhost/");
  assert.equal(mod.resolveWorkspace("index", "sfc", url, "chat"), "chat");
});

test("resolveWorkspace: 无有效值时 fallback 到 defaultWorkspace", () => {
  resetStorage();
  const url = new URL("http://localhost/");
  assert.equal(mod.resolveWorkspace("index", "sfc", url, "invalid"), "chat");
});

test("defaultChatPaneForViewport: 窄屏无 activeRoom 返回 'list'", () => {
  const mm = () => ({ matches: true });
  assert.equal(mod.defaultChatPaneForViewport(mm, null), "list");
});

test("defaultChatPaneForViewport: 窄屏有 activeRoom 返回 'thread'", () => {
  const mm = () => ({ matches: true });
  assert.equal(mod.defaultChatPaneForViewport(mm, "room:1"), "thread");
});

test("defaultChatPaneForViewport: 宽屏返回 'split'", () => {
  const mm = () => ({ matches: false });
  assert.equal(mod.defaultChatPaneForViewport(mm, "room:1"), "split");
});

test("resolveChatPaneMode: 返回有效 stored 值", () => {
  resetStorage();
  mockStorage.setItem("lobster-chat-pane:index:sfc", "thread");
  assert.equal(mod.resolveChatPaneMode("index", "sfc"), "thread");
});

test("resolveChatPaneMode: 无效 stored 值返回 'split'", () => {
  resetStorage();
  assert.equal(mod.resolveChatPaneMode("index", "sfc"), "split");
});

// ─── Room Read Markers ────────────────────────────────────

test("loadRoomReadMarkers: 空存储返回空对象", () => {
  resetStorage();
  const result = mod.loadRoomReadMarkers("index", "sfc");
  assert.deepEqual(result, {});
});

test("persistRoomReadMarkersToStorage + loadRoomReadMarkers 往返", () => {
  resetStorage();
  const markers = { "room:1": 12345 };
  mod.persistRoomReadMarkersToStorage("index", "sfc", markers);
  const loaded = mod.loadRoomReadMarkers("index", "sfc");
  assert.deepEqual(loaded, markers);
});

// ─── Room Drafts ──────────────────────────────────────────

test("loadRoomDrafts: 空存储返回空对象", () => {
  resetStorage();
  assert.deepEqual(mod.loadRoomDrafts("index", "sfc"), {});
});

test("draftForRoom: 返回已有草稿", () => {
  const drafts = { "room:1": "hello" };
  assert.equal(mod.draftForRoom("room:1", drafts), "hello");
});

test("draftForRoom: 空 roomId 返回空字符串", () => {
  assert.equal(mod.draftForRoom("", { "room:1": "hello" }), "");
});

test("draftForRoom: 无草稿返回空字符串", () => {
  assert.equal(mod.draftForRoom("room:2", { "room:1": "hello" }), "");
});

test("roomHasDraft: 有内容返回 true", () => {
  assert.equal(mod.roomHasDraft("room:1", { "room:1": "hello" }), true);
});

test("roomHasDraft: 空内容返回 false", () => {
  assert.equal(mod.roomHasDraft("room:1", { "room:1": "  " }), false);
});

test("updateRoomDraft: 新增草稿", () => {
  resetStorage();
  const drafts = {};
  const next = mod.updateRoomDraft("room:1", "hello", drafts, "index", "sfc");
  assert.equal(next["room:1"], "hello");
});

test("updateRoomDraft: 清空草稿删除 key", () => {
  resetStorage();
  const drafts = { "room:1": "hello" };
  const next = mod.updateRoomDraft("room:1", "", drafts, "index", "sfc");
  assert.equal(next["room:1"], undefined);
});

test("updateRoomDraft: 空 roomId 不修改", () => {
  resetStorage();
  const drafts = { "room:1": "hello" };
  const next = mod.updateRoomDraft("", "world", drafts, "index", "sfc");
  assert.deepEqual(next, drafts);
});

// ─── Room Quick States ────────────────────────────────────

test("loadRoomQuickStates: 空存储返回空对象", () => {
  resetStorage();
  assert.deepEqual(mod.loadRoomQuickStates("index", "sfc"), {});
});

test("roomQuickStateRecord: 返回已有记录", () => {
  const qs = { "room:1": { action: "translate", state: "idle" } };
  assert.deepEqual(mod.roomQuickStateRecord("room:1", qs), { action: "translate", state: "idle" });
});

test("roomQuickStateRecord: 空 roomId 返回 null", () => {
  assert.equal(mod.roomQuickStateRecord("", {}), null);
});

test("roomQuickState: 无匹配记录返回第一个 stage (中文 action)", () => {
  // "整理" action 有 stages: "待归档" → "已归档"
  assert.equal(mod.roomQuickState("room:1", "整理", {}), "待归档");
});

test("roomQuickState: 无 stages 的 action 返回空字符串", () => {
  assert.equal(mod.roomQuickState("room:1", "translate", {}), "");
});

test("setRoomQuickState: 设置后返回新对象", () => {
  resetStorage();
  const next = mod.setRoomQuickState("room:1", "translate", "idle", {}, "index", "sfc");
  assert.deepEqual(next["room:1"], { action: "translate", state: "idle" });
});

test("setRoomQuickState: 空参数删除 key", () => {
  resetStorage();
  const qs = { "room:1": { action: "translate", state: "idle" } };
  const next = mod.setRoomQuickState("room:1", "", "", qs, "index", "sfc");
  assert.equal(next["room:1"], undefined);
});

// ─── Room Quick Snapshots ─────────────────────────────────

test("loadRoomQuickSnapshots: 空存储返回空对象", () => {
  resetStorage();
  assert.deepEqual(mod.loadRoomQuickSnapshots("index", "sfc"), {});
});

test("roomQuickSnapshotHistory: 空参数返回空数组", () => {
  assert.deepEqual(mod.roomQuickSnapshotHistory("", "a", "s", {}), []);
});

test("roomQuickSnapshotHistory: 无匹配记录返回空数组", () => {
  assert.deepEqual(mod.roomQuickSnapshotHistory("room:1", "translate", "idle", {}), []);
});

test("latestRoomQuickSnapshotIndex: 空历史返回 -1", () => {
  assert.equal(mod.latestRoomQuickSnapshotIndex("room:1", "a", "s", {}), -1);
});

// ─── Quick Preview ────────────────────────────────────────

test("roomQuickPreviewRecord: 返回已有记录", () => {
  const previews = { "room:1": { action: "translate", selectedState: "idle" } };
  assert.deepEqual(mod.roomQuickPreviewRecord("room:1", previews), { action: "translate", selectedState: "idle" });
});

test("roomQuickPreviewRecord: 空 roomId 返回 null", () => {
  assert.equal(mod.roomQuickPreviewRecord("", {}), null);
});

test("roomQuickPreviewSnapshotIndex: 空 roomId 返回 null", () => {
  assert.equal(mod.roomQuickPreviewSnapshotIndex("", "a", "s", {}, {}, {}), null);
});
