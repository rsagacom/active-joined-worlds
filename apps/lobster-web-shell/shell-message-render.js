/* ============================================================
   shell-message-render.js — 消息渲染纯规格函数
   从 app.js 提取的纯 helper，无 DOM / 无 fetch / 无状态变更
   ============================================================ */

import { caretakerProfile } from "./shell-room-profiles.js";
import { roomKind } from "./shell-room-rail.js";
import { currentShellPage } from "./shell-shared.js";

export function messageStableId(message) {
  return String(message?.message_id || message?.id || "").trim();
}

export function isSystemSender(sender) {
  const normalized = String(sender || "").trim().toLowerCase();
  return normalized === "system" || normalized === "sys" || normalized === "系统" || normalized === "系统消息";
}

export function messageAvatarTone(message, room, isSelf) {
  if (isSelf) return "self";
  if (isSystemSender(message?.sender)) return "system";
  if (caretakerProfile(room) && message?.sender === caretakerProfile(room).name) return "caretaker";
  return roomKind(room) === "direct" ? "direct" : "room";
}

export function messageThreadKind(message, room, isSelf) {
  if (isSelf) return "self";
  if (isSystemSender(message?.sender)) return "system";
  if (caretakerProfile(room) && message?.sender === caretakerProfile(room).name) {
    return "caretaker";
  }
  return roomKind(room) === "direct" ? "direct" : "room";
}

export function messageRoleLabel(message, room, isSelf) {
  const shellPage = currentShellPage();
  if (isSelf) {
    return shellPage === "admin" ? "后台记录" : "你";
  }
  if (isSystemSender(message?.sender)) return "系统";
  if (caretakerProfile(room) && message?.sender === caretakerProfile(room).name) return "管家";
  return roomKind(room) === "direct" ? "对方" : "群聊";
}

export function formatDateTime(timestampMs) {
  return new Date(timestampMs).toLocaleString();
}

const DAY_MS = 86400000;

export function formatDateLabel(timestampMs, referenceMs) {
  const date = new Date(timestampMs);
  const ref = referenceMs ? new Date(referenceMs) : new Date();
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = today - msgDay;

  if (diff <= 0) return "今天";
  if (diff <= DAY_MS) return "昨天";
  if (diff <= 2 * DAY_MS) return "前天";
  if (diff <= 7 * DAY_MS) {
    const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    return days[date.getDay()];
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function createDateSeparator(prevTimestampMs, currentTimestampMs) {
  if (!prevTimestampMs || !currentTimestampMs) return null;
  const prevDay = new Date(new Date(prevTimestampMs).getFullYear(), new Date(prevTimestampMs).getMonth(), new Date(prevTimestampMs).getDate()).getTime();
  const currDay = new Date(new Date(currentTimestampMs).getFullYear(), new Date(currentTimestampMs).getMonth(), new Date(currentTimestampMs).getDate()).getTime();
  if (prevDay === currDay) return null;
  return { label: formatDateLabel(currentTimestampMs), timestampMs: currentTimestampMs };
}

export function findReplyTarget(message, allMessages) {
  const replyId = message?.reply_to_message_id;
  if (!replyId || !Array.isArray(allMessages)) return null;
  return allMessages.find(m => messageStableId(m) === String(replyId)) || null;
}

export function buildReplyPreview(message, allMessages) {
  const target = findReplyTarget(message, allMessages);
  if (!target) return null;
  const sender = target.sender || "";
  const text = (target.text || target.body?.plain_text || "").substring(0, 80);
  return { sender, text: text + (text.length >= 80 ? "…" : ""), messageId: String(target.message_id || target.id || "") };
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[char]);
}
