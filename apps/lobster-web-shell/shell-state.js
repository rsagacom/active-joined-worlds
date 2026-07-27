/* ============================================================
   shell-state.js — workspace / chatFocus / drafts / markers /
   quickStates / quickSnapshots 读写操作

   设计原则：
   - 所有函数接受显式参数，不读取 app.js 全局变量
   - 只依赖 localStorage，不依赖 DOM
   - 依赖的纯函数从已提取模块 import
   ============================================================ */

import {
  safeLocalStorageGet,
  safeLocalStorageSet,
  parseStoredObject,
  defaultWorkspaceForShellMode,
  availableWorkspacesForShellMode,
} from "./shell-shared.js";

import {
  workspaceStorageKey,
  chatPaneStorageKey,
  roomReadMarkersStorageKey,
  roomDraftsStorageKey,
  roomQuickStatesStorageKey,
  roomQuickSnapshotsStorageKey,
} from "./shell-storage-keys.js";

import { quickActionStateStages } from "./shell-quick-action-labels.js";

import {
  quickActionSnapshotHistoryFromRecord,
  quickActionSnapshotFromHistory,
  normalizeQuickActionStructured,
  quickActionPreviewSelectedState,
  quickActionPreviewSelectedSnapshotIndex,
} from "./shell-quick-action-preview.js";

// ─── Chat Focus ───────────────────────────────────────────

const CHAT_FOCUS_STORAGE_KEY = "lobster-chat-focus";

export function loadChatFocusPreference() {
  return safeLocalStorageGet(CHAT_FOCUS_STORAGE_KEY) === "true";
}

export function persistChatFocusPreference(value) {
  safeLocalStorageSet(CHAT_FOCUS_STORAGE_KEY, value ? "true" : "false");
}

// ─── Workspace / Chat Pane ────────────────────────────────

export function resolveWorkspace(shellPage, shellMode, url, stored) {
  if (shellPage === "user" || shellPage === "admin" || shellPage === "unified") {
    return "chat";
  }
  const allowed = availableWorkspacesForShellMode(shellMode);
  const query = (url?.searchParams?.get("surface") || "").trim().toLowerCase();
  if (allowed.includes(query)) {
    return query;
  }
  if (allowed.includes(stored)) {
    return stored;
  }
  return defaultWorkspaceForShellMode(shellMode);
}

export function defaultChatPaneForViewport(matchMedia, activeRoomId) {
  if (matchMedia?.("(max-width: 960px)")?.matches) {
    return activeRoomId ? "thread" : "list";
  }
  return "split";
}

export function resolveChatPaneMode(page, mode, fallback = "split") {
  const stored = safeLocalStorageGet(chatPaneStorageKey(page, mode));
  if (stored === "list" || stored === "thread" || stored === "split") {
    return stored;
  }
  return fallback === "list" || fallback === "thread" || fallback === "split"
    ? fallback
    : "split";
}

// ─── Room Read Markers ────────────────────────────────────

export function loadRoomReadMarkers(page, mode) {
  return parseStoredObject(safeLocalStorageGet(roomReadMarkersStorageKey(page, mode)));
}

export function persistRoomReadMarkersToStorage(page, mode, markers) {
  safeLocalStorageSet(roomReadMarkersStorageKey(page, mode), JSON.stringify(markers));
}

// ─── Room Drafts ──────────────────────────────────────────

export function loadRoomDrafts(page, mode) {
  return parseStoredObject(safeLocalStorageGet(roomDraftsStorageKey(page, mode)));
}

export function persistRoomDraftsToStorage(page, mode, drafts) {
  safeLocalStorageSet(roomDraftsStorageKey(page, mode), JSON.stringify(drafts));
}

export function draftForRoom(roomId, drafts) {
  if (!roomId) return "";
  return typeof drafts?.[roomId] === "string" ? drafts[roomId] : "";
}

export function roomHasDraft(roomId, drafts) {
  return Boolean(draftForRoom(roomId, drafts).trim());
}

export function updateRoomDraft(roomId, value, drafts, page, mode) {
  if (!roomId) return drafts;
  const nextValue = typeof value === "string" ? value : "";
  const next = { ...drafts };
  if (nextValue.trim()) {
    next[roomId] = nextValue;
  } else {
    delete next[roomId];
  }
  safeLocalStorageSet(roomDraftsStorageKey(page, mode), JSON.stringify(next));
  return next;
}

// ─── Room Quick States ────────────────────────────────────

export function loadRoomQuickStates(page, mode) {
  return parseStoredObject(safeLocalStorageGet(roomQuickStatesStorageKey(page, mode)));
}

export function persistRoomQuickStatesToStorage(page, mode, states) {
  safeLocalStorageSet(roomQuickStatesStorageKey(page, mode), JSON.stringify(states));
}

export function roomQuickStateRecord(roomId, quickStates) {
  if (!roomId) return null;
  const record = quickStates?.[roomId];
  return record && typeof record === "object" ? record : null;
}

export function roomQuickState(roomId, action, quickStates) {
  if (!roomId || !action) return "";
  const stages = quickActionStateStages(action);
  if (!stages.length) return "";
  const record = roomQuickStateRecord(roomId, quickStates);
  if (record?.action === action && stages.some((stage) => stage.label === record.state)) {
    return record.state;
  }
  return stages[0].label;
}

export function setRoomQuickState(roomId, action, state, quickStates, page, mode) {
  const next = { ...quickStates };
  if (!roomId || !action || !state) {
    delete next[roomId];
  } else {
    next[roomId] = { action, state };
  }
  safeLocalStorageSet(roomQuickStatesStorageKey(page, mode), JSON.stringify(next));
  return next;
}

export function resetRoomQuickState(roomId, action, quickStates, page, mode) {
  const stages = quickActionStateStages(action);
  if (!roomId || !stages.length) {
    return setRoomQuickState(roomId, "", "", quickStates, page, mode);
  }
  return setRoomQuickState(roomId, action, stages[0].label, quickStates, page, mode);
}

// ─── Room Quick Snapshots ─────────────────────────────────

export function loadRoomQuickSnapshots(page, mode) {
  return parseStoredObject(safeLocalStorageGet(roomQuickSnapshotsStorageKey(page, mode)));
}

export function persistRoomQuickSnapshotsToStorage(page, mode, snapshots) {
  safeLocalStorageSet(roomQuickSnapshotsStorageKey(page, mode), JSON.stringify(snapshots));
}

export function roomQuickSnapshotHistory(roomId, action, state, snapshots) {
  if (!roomId || !action || !state) return [];
  const roomRecord = snapshots?.[roomId];
  return quickActionSnapshotHistoryFromRecord(roomRecord, action, state);
}

export function roomQuickSnapshot(roomId, action, state, snapshotIndex, snapshots) {
  const history = roomQuickSnapshotHistory(roomId, action, state, snapshots);
  return quickActionSnapshotFromHistory(history, snapshotIndex);
}

export function latestRoomQuickSnapshotIndex(roomId, action, state, snapshots) {
  const history = roomQuickSnapshotHistory(roomId, action, state, snapshots);
  return history.length ? history.length - 1 : -1;
}

export function setRoomQuickSnapshot(roomId, action, state, structured, snapshots, page, mode) {
  if (!roomId || !action || !state) return snapshots;
  const normalized = normalizeQuickActionStructured(structured, action);
  if (!normalized) return snapshots;
  const next = { ...snapshots };
  const roomRecord =
    next?.[roomId] && typeof next[roomId] === "object"
      ? { ...next[roomId] }
      : {};
  const actionRecord =
    roomRecord?.[action] && typeof roomRecord[action] === "object"
      ? { ...roomRecord[action] }
      : {};
  const history = roomQuickSnapshotHistory(roomId, action, state, next);
  actionRecord[state] = [...history, {
    action: normalized.action || action,
    state,
    fields: normalized.fields.map((field) => ({ ...field })),
    notes: [...normalized.notes],
    capturedAtMs: Date.now(),
  }];
  roomRecord[action] = actionRecord;
  next[roomId] = roomRecord;
  safeLocalStorageSet(roomQuickSnapshotsStorageKey(page, mode), JSON.stringify(next));
  return next;
}

// ─── Quick Preview (read-only helpers) ────────────────────

export function roomQuickPreviewRecord(roomId, previews) {
  if (!roomId) return null;
  const record = previews?.[roomId];
  return record && typeof record === "object" ? record : null;
}

export function roomQuickPreviewState(roomId, action, quickStates, previews) {
  if (!roomId || !action) return "";
  const stages = quickActionStateStages(action);
  const record = roomQuickPreviewRecord(roomId, previews);
  return quickActionPreviewSelectedState(record, action, stages);
}

export function roomQuickPreviewSnapshotIndex(roomId, action, state, quickStates, previews, snapshots) {
  if (!roomId) return null;
  const history = roomQuickSnapshotHistory(roomId, action, state, snapshots);
  const record = roomQuickPreviewRecord(roomId, previews);
  return quickActionPreviewSelectedSnapshotIndex(record, action, state, history.length);
}
