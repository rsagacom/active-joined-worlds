/* ============================================================
   shell-quick-action-reader.js — Quick Action 纯读取器函数
   从 app.js 提取：房间状态查询、快速操作读取、回显读取
   所有函数零 DOM / fetch / 状态写入，仅通过闭包读取内部状态
   依赖 shell-quick-action-* / shell-room-profiles / shell-message-state 模块
   ============================================================ */

import { quickActionStage, quickActionStateStages, quickActionFollowUpCopy, quickActionContextCopy, quickActionSummary, quickActionDefaultSendLabel } from "./shell-quick-action-labels.js";
import { roomQuickAction, quickActionContract } from "./shell-quick-actions.js";
import {
  quickActionSnapshotHistoryFromRecord,
  quickActionSnapshotFromHistory,
  quickActionPreviewHistoryLabel,
  quickActionPreviewSelectedState,
  quickActionPreviewSelectedSnapshotIndex,
  quickActionPreviewSelectedFieldView,
  buildQuickActionPreviewModel,
  parseStructuredQuickActionMessage,
  resolveQuickActionPreviewView,
} from "./shell-quick-action-preview.js";
import { workflowProfile } from "./shell-room-profiles.js";
import { visiblePendingEchoesForRoomData } from "./shell-message-state.js";

const emptyRecord = () => ({});
const noLatestMessage = () => null;

/**
 * 创建一组只读取调用方状态的 Quick Action reader。
 * 每个实例持有自己的依赖，避免模块级可变状态和初始化顺序耦合。
 */
export function createQuickActionReaders({
  getSnapshots = emptyRecord,
  getPreviews = emptyRecord,
  getStates = emptyRecord,
  getPendingEchoes = emptyRecord,
  latestRoomMessageLike = noLatestMessage,
} = {}) {
  const readSnapshots = typeof getSnapshots === "function" ? getSnapshots : emptyRecord;
  const readPreviews = typeof getPreviews === "function" ? getPreviews : emptyRecord;
  const readStates = typeof getStates === "function" ? getStates : emptyRecord;
  const readPendingEchoes = typeof getPendingEchoes === "function" ? getPendingEchoes : emptyRecord;
  const readLatestRoomMessageLike = typeof latestRoomMessageLike === "function" ? latestRoomMessageLike : noLatestMessage;

  function pendingEchoesForRoom(roomId) {
    const echoes = readPendingEchoes();
    return Array.isArray(echoes?.[roomId]) ? echoes[roomId] : [];
  }

  function roomQuickStateRecord(roomId) {
    if (!roomId) return null;
    const record = readStates()?.[roomId];
    return record && typeof record === "object" ? record : null;
  }

  function roomQuickPreviewRecord(roomId) {
    if (!roomId) return null;
    const record = readPreviews()?.[roomId];
    return record && typeof record === "object" ? record : null;
  }

  function roomQuickSnapshotHistory(roomId, action = "", state = "") {
    if (!roomId || !action || !state) return [];
    return quickActionSnapshotHistoryFromRecord(readSnapshots()?.[roomId], action, state);
  }

  function roomQuickSnapshot(roomId, action = "", state = "", snapshotIndex = null) {
    return quickActionSnapshotFromHistory(roomQuickSnapshotHistory(roomId, action, state), snapshotIndex);
  }

  function latestRoomQuickSnapshotIndex(roomId, action = "", state = "") {
    const history = roomQuickSnapshotHistory(roomId, action, state);
    return history.length ? history.length - 1 : -1;
  }

  function roomQuickState(roomId, action = roomQuickAction(roomId)) {
    if (!roomId || !action) return "";
    const stages = quickActionStateStages(action);
    if (!stages.length) return "";
    const record = roomQuickStateRecord(roomId);
    if (record?.action === action && stages.some((stage) => stage.label === record.state)) return record.state;
    return stages[0].label;
  }

  function roomQuickStage(roomId, action) {
    return quickActionStage(action, roomQuickState(roomId, action));
  }

  function roomQuickPreviewState(roomId, action = roomQuickAction(roomId)) {
    if (!roomId || !action) return "";
    return quickActionPreviewSelectedState(roomQuickPreviewRecord(roomId), action, quickActionStateStages(action));
  }

  function roomQuickPreviewSnapshotIndex(roomId, action = roomQuickAction(roomId), state = roomQuickPreviewState(roomId, action)) {
    if (!roomId) return null;
    const history = roomQuickSnapshotHistory(roomId, action, state);
    return quickActionPreviewSelectedSnapshotIndex(roomQuickPreviewRecord(roomId), action, state, history.length);
  }

  function roomQuickPreviewFieldView(
    roomId,
    action = roomQuickAction(roomId),
    state = roomQuickPreviewState(roomId, action),
    snapshotIndex = roomQuickPreviewSnapshotIndex(roomId, action, state),
  ) {
    if (!roomId || !action || !state) return "stage";
    const history = roomQuickSnapshotHistory(roomId, action, state);
    return quickActionPreviewSelectedFieldView(roomQuickPreviewRecord(roomId), action, state, history.length, snapshotIndex);
  }

  function roomQuickPreviewCardFieldView(
    roomId,
    action = roomQuickAction(roomId),
    state = roomQuickPreviewState(roomId, action),
    snapshotIndex = roomQuickPreviewSnapshotIndex(roomId, action, state),
  ) {
    if (!roomId || !action || !state) return "snapshot";
    const history = roomQuickSnapshotHistory(roomId, action, state);
    return quickActionPreviewSelectedFieldView(roomQuickPreviewRecord(roomId), action, state, history.length, snapshotIndex, {
      fieldKey: "cardFieldView",
      fallback: "snapshot",
    });
  }

  function latestStructuredQuickActionPreview(room, action = "", state = "", snapshotIndex = null) {
    if (!room || !action) return null;
    const snapshot = roomQuickSnapshot(room.id, action, state, snapshotIndex);
    if (snapshot) return snapshot;
    const committed = Array.isArray(room.messages) ? room.messages : [];
    const pending = visiblePendingEchoesForRoomData(room, pendingEchoesForRoom(room?.id));
    const combined = [...committed, ...pending];
    for (let index = combined.length - 1; index >= 0; index -= 1) {
      const message = combined[index];
      const messageAction = typeof message?.quick_action === "string" ? message.quick_action.trim() : "";
      if (messageAction !== action) continue;
      const structured = parseStructuredQuickActionMessage(message);
      if (structured) return structured;
    }
    return null;
  }

  function latestRoomQuickAction(room) {
    const action = readLatestRoomMessageLike(room)?.quick_action;
    if (typeof action === "string" && action.trim()) return action.trim();
    const workflowAction = workflowProfile(room)?.action;
    return typeof workflowAction === "string" ? workflowAction.trim() : "";
  }

  function quickActionSendLabel(action) {
    const contractSendLabel = quickActionContract(action)?.send_label;
    return typeof contractSendLabel === "string" && contractSendLabel.trim()
      ? contractSendLabel
      : quickActionDefaultSendLabel(action);
  }

  function roomQuickPreviewSummary(room) {
    const preview = resolveRoomQuickPreview(room);
    if (!preview) return "";
    const fieldView = roomQuickPreviewFieldView(room.id, preview.action, preview.state, preview.snapshotIndex);
    return resolveQuickActionPreviewView(preview, fieldView)?.summaryText || "";
  }

  function roomQuickPreviewHistoryLabel(room, action = latestRoomQuickAction(room), previewState = roomQuickPreviewState(room?.id, action)) {
    if (!room?.id || !action || !previewState) return "";
    const history = roomQuickSnapshotHistory(room.id, action, previewState);
    const snapshotIndex = roomQuickPreviewSnapshotIndex(room.id, action, previewState);
    if (!history.length || snapshotIndex == null || snapshotIndex < 0 || snapshotIndex >= history.length) return "";
    return quickActionPreviewHistoryLabel(history[snapshotIndex], snapshotIndex, history.length);
  }

  function resolveRoomQuickPreview(room, action = latestRoomQuickAction(room)) {
    if (!room?.id || !action) return null;
    const state = roomQuickPreviewState(room.id, action);
    if (!state) return null;
    const history = roomQuickSnapshotHistory(room.id, action, state);
    const snapshotIndex = roomQuickPreviewSnapshotIndex(room.id, action, state);
    return buildQuickActionPreviewModel({
      action,
      state,
      history,
      snapshotIndex,
      structured: latestStructuredQuickActionPreview(room, action, state, snapshotIndex),
      historyLabel: roomQuickPreviewHistoryLabel(room, action, state),
      followUpCopy: quickActionFollowUpCopy(action, state),
    });
  }

  function latestRoomQuickState(room) {
    if (!room?.id) return "";
    const action = latestRoomQuickAction(room);
    const localState = roomQuickState(room.id, action);
    if (localState) return localState;
    const workflowState = workflowProfile(room)?.state;
    return typeof workflowState === "string" ? workflowState.trim() : "";
  }

  function roomQuickActionSummary(room) {
    return quickActionSummary(latestRoomQuickAction(room));
  }

  function roomQuickActionContextCopy(room) {
    return quickActionContextCopy(latestRoomQuickAction(room));
  }

  return {
    pendingEchoesForRoom,
    roomQuickStateRecord,
    roomQuickPreviewRecord,
    roomQuickSnapshotHistory,
    roomQuickSnapshot,
    latestRoomQuickSnapshotIndex,
    roomQuickState,
    roomQuickStage,
    roomQuickPreviewState,
    roomQuickPreviewSnapshotIndex,
    roomQuickPreviewFieldView,
    roomQuickPreviewCardFieldView,
    latestStructuredQuickActionPreview,
    latestRoomQuickAction,
    quickActionSendLabel,
    roomQuickPreviewSummary,
    roomQuickPreviewHistoryLabel,
    resolveRoomQuickPreview,
    latestRoomQuickState,
    roomQuickActionSummary,
    roomQuickActionContextCopy,
  };
}
