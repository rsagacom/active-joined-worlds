// shell-storage-keys.test.mjs — storage key 生成器纯函数单元测试
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  workspaceStorageKey,
  chatPaneStorageKey,
  roomReadMarkersStorageKey,
  roomDraftsStorageKey,
  roomQuickStatesStorageKey,
  roomQuickSnapshotsStorageKey,
} from "../shell-storage-keys.js";

// ====== workspaceStorageKey ======

test("workspaceStorageKey: 返回 scoped key", () => {
  assert.equal(workspaceStorageKey("hub", "unified"), "lobster-workspace:hub:unified");
});

test("workspaceStorageKey: 区分 page", () => {
  assert.equal(workspaceStorageKey("user", "unified"), "lobster-workspace:user:unified");
});

test("workspaceStorageKey: 区分 mode", () => {
  assert.equal(workspaceStorageKey("hub", "creative"), "lobster-workspace:hub:creative");
});

// ====== chatPaneStorageKey ======

test("chatPaneStorageKey: 返回 scoped key", () => {
  assert.equal(chatPaneStorageKey("admin", "unified"), "lobster-chat-pane:admin:unified");
});

// ====== roomReadMarkersStorageKey ======

test("roomReadMarkersStorageKey: 返回 scoped key", () => {
  assert.equal(roomReadMarkersStorageKey("user", "creative"), "lobster-room-read-markers:user:creative");
});

// ====== roomDraftsStorageKey ======

test("roomDraftsStorageKey: 返回 scoped key", () => {
  assert.equal(roomDraftsStorageKey("hub", "unified"), "lobster-room-drafts:hub:unified");
});

// ====== roomQuickStatesStorageKey ======

test("roomQuickStatesStorageKey: 返回 scoped key", () => {
  assert.equal(roomQuickStatesStorageKey("world-entry", "metro"), "lobster-room-quick-states:world-entry:metro");
});

// ====== roomQuickSnapshotsStorageKey ======

test("roomQuickSnapshotsStorageKey: 返回 scoped key", () => {
  assert.equal(roomQuickSnapshotsStorageKey("admin", "unified"), "lobster-room-quick-snapshots:admin:unified");
});

// ====== 通用格式验证 ======

test("所有 key 以 lobster- 开头", () => {
  const fns = [workspaceStorageKey, chatPaneStorageKey, roomReadMarkersStorageKey, roomDraftsStorageKey, roomQuickStatesStorageKey, roomQuickSnapshotsStorageKey];
  for (const fn of fns) {
    const key = fn("test", "mode");
    assert.ok(key.startsWith("lobster-"), fn.name + " 应以 lobster- 开头: " + key);
    assert.ok(key.includes(":test:mode"), fn.name + " 应包含 page 和 mode: " + key);
  }
});
