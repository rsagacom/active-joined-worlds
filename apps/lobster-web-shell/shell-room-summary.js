/* shell-room-summary.js — 房间状态摘要纯函数
 * 从 app.js 提取。返回纯文案/数值，deps 注入 room-state 读取
 * (unreadCount/caretakerPendingCount/roomHasDraft/visiblePendingEchoCount/
 *  roomSendError/latestRoomQuickAction/latestRoomQuickState/shellPage/roomKind
 *  /roomMemberCount/roomQuickActionSummary/roomRouteLabel/resolveRoomQuickPreview
 *  /roomQuickPreviewFieldView/roomLastActivity)，脱离全局即可单测。
 *  quickActionFollowUpCopy/quickActionFollowUpLabel/quickActionPreviewFieldViewLabel
 *  从既有模块 import。
 */

import { quickActionFollowUpCopy, quickActionFollowUpLabel } from "./shell-quick-action-labels.js";
import { quickActionPreviewFieldViewLabel } from "./shell-quick-action-preview.js";
import { translateRoomKindForShellPage } from "./shell-labels.js";
import { joinOrFallback } from "./shell-payload.js";

export function roomFollowUpCountForState(room, deps) {
  if (!room) return 0;
  return (
    Number(deps.unreadCount(room) > 0) +
    Number(deps.roomHasDraft(room.id)) +
    Number(deps.visiblePendingEchoCount(room) > 0) +
    Number(Boolean(deps.roomSendError(room.id))) +
    Number(deps.caretakerPendingCount(room) > 0)
  );
}

export function roomChatStatusSummaryForState(room, deps) {
  if (!room) return "等待新消息";
  if (deps.roomSendError(room.id)) return "这条聊天有消息待重发";
  if (deps.visiblePendingEchoCount(room)) return "这条聊天有消息待同步";
  if (deps.roomHasDraft(room.id)) return "草稿已存在当前会话";
  if (deps.unreadCount(room) > 0) return `有 ${deps.unreadCount(room)} 条新消息待看`;
  const action = deps.latestRoomQuickAction(room);
  if (action) {
    return quickActionFollowUpCopy(action, deps.latestRoomQuickState(room)) || "这条聊天正在按动作继续推进";
  }
  if (typeof room?.chat_status_summary === "string" && room.chat_status_summary.trim()) {
    return room.chat_status_summary.trim();
  }
  if (deps.shellPage === "user") {
    return deps.roomKind(room) === "direct" ? "可以直接继续说" : "城镇里还算安静";
  }
  return deps.roomKind(room) === "direct" ? "可直接继续回复" : "群聊当前比较安静";
}

export function roomQueueSummaryForState(room, deps) {
  if (!room) return "等待新的后台窗口";
  const items = [];
  if (deps.caretakerPendingCount(room) > 0) {
    items.push(`${deps.caretakerPendingCount(room)} 条访客提醒`);
  }
  if (deps.unreadCount(room) > 0) {
    items.push(`${deps.unreadCount(room)} 条新动态`);
  }
  if (deps.roomHasDraft(room.id)) {
    items.push("有待发记录");
  }
  if (deps.visiblePendingEchoCount(room)) {
    items.push("消息待同步");
  }
  if (deps.roomSendError(room.id)) {
    items.push("发送失败待复核");
  }
  if (items.length) {
    return items.join(" · ");
  }
  if (typeof room?.queue_summary === "string" && room.queue_summary.trim()) {
    return room.queue_summary.trim();
  }
  return "窗口清爽，可继续巡视或记录";
}

export function roomSummaryLineForState(room, deps) {
  if (!room) return "未选择聊天";
  if (typeof room.list_summary === "string" && room.list_summary.trim()) {
    return room.list_summary.trim();
  }
  const shellPage = deps.shellPage;
  const parts = [room.kind_hint || translateRoomKindForShellPage(deps.roomKind(room), shellPage)];
  if (deps.roomKind(room) !== "system") {
    parts.push(`${deps.roomMemberCount(room)} 人`);
  }
  if ((room.messages || []).length) {
    parts.push(`${room.messages.length} 条消息`);
  }
  if (deps.roomQuickActionSummary(room)) {
    parts.push(deps.roomQuickActionSummary(room));
  }
  return joinOrFallback(
    parts.filter(Boolean),
    room.preview_text || room.overview_summary || room.subtitle || room.meta || "等待新消息",
  );
}

export function roomStatusLineForState(room, deps) {
  if (!room) return "等待新消息";
  if (typeof room.status_line === "string" && room.status_line.trim()) {
    return room.status_line.trim();
  }
  const parts = [deps.roomRouteLabel(room)];
  const quickAction = deps.latestRoomQuickAction(room);
  const followUp = quickActionFollowUpLabel(quickAction, deps.latestRoomQuickState(room));
  const preview = deps.resolveRoomQuickPreview(room, quickAction);
  if (followUp) {
    parts.push(`动作状态 ${followUp}`);
  }
  if (preview?.historyLabel) {
    const previewFieldView = deps.roomQuickPreviewFieldView(
      room.id,
      quickAction,
      preview.state,
      preview.snapshotIndex,
    );
    parts.push(`阶段预览 ${preview.historyLabel} · ${quickActionPreviewFieldViewLabel(previewFieldView)}`);
  }
  if (room.meta) {
    parts.push(room.meta);
  }
  const lastActivity = deps.roomLastActivity(room);
  if (lastActivity && lastActivity !== "暂无消息") {
    parts.push(lastActivity);
  }
  return joinOrFallback(parts.filter(Boolean), "等待新消息");
}

/* roomOwnershipForState — 私宅主客视角判断
 * gateway 在 ShellRoomState 暴露 owner_resident_id（personal_room=1人Direct 的主人，
 * 双方 DM/公共为 None）。前端直接读 room.owner_resident_id 判断主客，无需派生
 * myPersonalRoomId。owner_resident_id 来自 gateway 事实源 (ACT-031)。
 * owner===identity → own；owner 存在且≠identity → visitor；None → ""（不显示）。
 */
export function roomOwnershipForState(room, identity) {
  if (!identity || identity === "访客") return "";
  const owner = room?.owner_resident_id;
  if (!owner) return "";
  return owner === identity ? "own" : "visitor";
}

/* roomHostLabelForState — 访客视角下的主人名。
 * DM 双方私聊用 peer_label（对方）；personal_room 访客视角 peer_label 常为空，
 * 降级到 owner_resident_id（主人 id，由 gateway 暴露）。
 */
export function roomHostLabelForState(room) {
  return room?.peer_label || room?.participant_label || room?.owner_resident_id || "";
}
