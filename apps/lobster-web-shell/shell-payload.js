/* ============================================================
   shell-payload.js — 载荷/状态标准化纯函数
   从 app.js 提取，无 DOM / 无 fetch / 无状态变更
   ============================================================ */

import { translateMembershipState, translateRole } from "./shell-labels.js";

export function joinOrFallback(items, fallback) {
  return items && items.length ? items.join("、") : fallback;
}

export function humanMembership(membership) {
  if (!membership) return "尚未入城";
  return `${translateRole(membership.role)} · ${translateMembershipState(membership.state)}`;
}

export function hasConversationShellPayload(payload) {
  return Array.isArray(payload?.conversation_shell?.conversations) &&
    payload.conversation_shell.conversations.length > 0;
}

export function hasAnyShellPayload(payload) {
  return (Array.isArray(payload?.rooms) && payload.rooms.length > 0) || hasConversationShellPayload(payload);
}

export function normalizeShellMessages(messages) {
  return (messages || []).map((message) => ({
    ...message,
    timestamp:
      message.timestamp ||
      message.timestamp_label ||
      (typeof message.timestamp_ms === "number"
        ? new Date(message.timestamp_ms).toLocaleTimeString()
        : "刚刚"),
  }));
}
