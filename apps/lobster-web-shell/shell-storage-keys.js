/* ============================================================
   shell-storage-keys.js — localStorage key 生成器（纯函数）
   所有函数接受 (page, mode) 显式参数，零外部依赖。
   ============================================================ */

import { scopedShellStorageKey } from "./shell-shared.js";

export function workspaceStorageKey(page, mode) {
  return scopedShellStorageKey("workspace", page, mode);
}

export function chatPaneStorageKey(page, mode) {
  return scopedShellStorageKey("chat-pane", page, mode);
}

export function roomReadMarkersStorageKey(page, mode) {
  return scopedShellStorageKey("room-read-markers", page, mode);
}

export function roomDraftsStorageKey(page, mode) {
  return scopedShellStorageKey("room-drafts", page, mode);
}

export function roomQuickStatesStorageKey(page, mode) {
  return scopedShellStorageKey("room-quick-states", page, mode);
}

export function roomQuickSnapshotsStorageKey(page, mode) {
  return scopedShellStorageKey("room-quick-snapshots", page, mode);
}
