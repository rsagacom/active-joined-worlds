/* shell-room-summary.js — 房间状态摘要纯函数
 * 从 app.js 提取。返回纯文案/数值，deps 注入 room-state 读取
 * (unreadCount/caretakerPendingCount/roomHasDraft/visiblePendingEchoCount/
 *  roomSendError/latestRoomQuickAction/latestRoomQuickState/shellPage/roomKind)，
 * 脱离全局即可单测。quickActionFollowUpCopy 从既有模块 import。
 */

import { quickActionFollowUpCopy } from "./shell-quick-action-labels.js";

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
