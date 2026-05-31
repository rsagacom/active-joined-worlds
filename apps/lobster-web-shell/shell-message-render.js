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

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[char]);
}
