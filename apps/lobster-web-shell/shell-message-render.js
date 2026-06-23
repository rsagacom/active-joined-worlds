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

export function messageOwnerActionSpecs({
  gatewayUrl = "",
  isSelf = false,
  message = null,
  messageKind = "",
} = {}) {
  const messageId = messageStableId(message);
  if (
    !gatewayUrl ||
    !isSelf ||
    !messageId ||
    message?.is_recalled ||
    message?.moderation_status === "blocked" ||
    messageKind === "system"
  ) {
    return [];
  }
  return [
    { action: "edit", className: "message-action", label: "编辑" },
    { action: "recall", className: "message-action message-action-danger", label: "撤回" },
  ];
}

export function buildReplyPreview(message, messages) {
  const replyToId = message?.reply_to_message_id || message?.replyTo || message?.reply_to;
  if (!replyToId || !Array.isArray(messages)) return null;
  const target = messages.find((m) => messageStableId(m) === String(replyToId));
  if (!target) return null;
  const text = String(target.text || target.body || "").trim();
  if (!text) return null;
  return { sender: target.sender || "", text };
}

export function createDateSeparator(prevTimestampMs, timestampMs) {
  if (!prevTimestampMs || !timestampMs) return null;
  const prev = new Date(prevTimestampMs);
  const curr = new Date(timestampMs);
  if (
    prev.getFullYear() === curr.getFullYear() &&
    prev.getMonth() === curr.getMonth() &&
    prev.getDate() === curr.getDate()
  ) {
    return null;
  }
  const y = curr.getFullYear();
  const m = String(curr.getMonth() + 1).padStart(2, "0");
  const d = String(curr.getDate()).padStart(2, "0");
  return { label: `${y}-${m}-${d}` };
}

export function timelineDividerSpecsForMessage({
  index = 0,
  message = null,
  prevMessage = null,
  unreadStartIndex = -1,
  unreadForDivider = 0,
} = {}) {
  const dividers = [];
  if (unreadForDivider > 0 && index === unreadStartIndex) {
    dividers.push({
      className: "timeline-divider",
      text: unreadForDivider === 1
        ? "以下是 1 条未读消息"
        : `以下是 ${unreadForDivider} 条未读消息`,
    });
  }
  if (prevMessage && message?.timestamp_ms) {
    const dateSep = createDateSeparator(prevMessage.timestamp_ms, message.timestamp_ms);
    if (dateSep) {
      dividers.push({
        className: "timeline-divider",
        text: dateSep.label,
      });
    }
  }
  return dividers;
}

export function timelineCommittedMessageRenderItems({
  messages = [],
  flowSpec = {},
} = {}) {
  const sourceMessages = Array.isArray(messages) ? messages : [];
  const {
    unreadForDivider = 0,
    unreadStartIndex = -1,
    allowMessageGrouping = false,
    staggerBase = 0,
    staggerCap = 0,
  } = flowSpec || {};
  const items = [];

  for (const [index, message] of sourceMessages.entries()) {
    const prevMessage = index > 0 ? sourceMessages[index - 1] : null;
    const dividerSpecs = timelineDividerSpecsForMessage({
      index,
      message,
      prevMessage,
      unreadStartIndex,
      unreadForDivider,
    });
    for (const divider of dividerSpecs) {
      items.push({ type: "divider", divider });
    }
    items.push({
      type: "message",
      message,
      rowInput: {
        message,
        prevMessage,
        index,
        unreadStartIndex,
        messages: sourceMessages,
        allowMessageGrouping,
        staggerBase,
        staggerCap,
      },
    });
  }

  return items;
}

export function timelineTypingIndicatorSpec(pendingMessages = []) {
  const pending = Array.isArray(pendingMessages) ? pendingMessages : [];
  if (!pending.some((message) => !message?.failed)) return null;
  return {
    className: "timeline-typing",
    dotsClassName: "timeline-typing-dots",
    dotClassName: "timeline-typing-dot",
    dotCount: 3,
    labelText: "发送中…",
  };
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

export function timelineMessageRowSpec({
  message,
  prevMessage = null,
  room = null,
  currentIdentity = "",
  index = 0,
  unreadStartIndex = -1,
  messagesLength = 0,
  allowMessageGrouping = false,
  staggerBase = 0,
  staggerCap = 0,
} = {}) {
  const isSelf = message?.sender === currentIdentity;
  const messageKind = messageThreadKind(message, room, isSelf);
  const prevIsSelf = prevMessage?.sender === currentIdentity;
  const prevMessageKind = prevMessage
    ? messageThreadKind(prevMessage, room, prevIsSelf)
    : "";
  const grouped = Boolean(
    allowMessageGrouping &&
      prevMessage &&
      prevMessage.sender === message?.sender &&
      messageKind === prevMessageKind &&
      index !== unreadStartIndex,
  );
  const messageId = messageStableId(message);
  const dataset = {
    messageKind,
    messageSide: messageKind === "system" ? "system" : isSelf ? "self" : "peer",
  };
  if (messageId) {
    dataset.messageId = messageId;
  }
  const recentWindowStart = messagesLength - 6;
  const delay = staggerBase > 0 && index >= recentWindowStart
    ? Math.min((index - recentWindowStart) * staggerBase, staggerCap)
    : null;

  return {
    isSelf,
    messageKind,
    className: `message-row${isSelf ? " self" : ""}`,
    dataset,
    grouped,
    style: delay == null ? "" : `--msg-stagger:${delay}ms`,
  };
}

export function timelinePendingMessageRowSpec({
  message = null,
  currentIdentity = "",
  badgeToken = (value, fallback = "") => String(value || fallback).slice(0, 2).toUpperCase(),
} = {}) {
  const failed = Boolean(message?.failed);
  return {
    rowClassName: "message-row self",
    rowDataset: {
      messageKind: "pending",
      messageSide: "self",
    },
    avatarClassName: "message-avatar message-avatar-self",
    avatarText: badgeToken(currentIdentity, "我"),
    articleClassName: `message self message-pending${failed ? " message-pending-failed" : ""}`,
    articleDataset: {
      messageKind: "pending",
    },
    senderText: currentIdentity,
    roleText: failed ? "待重发" : "待同步",
    timestampText: failed ? "发送失败" : "正在投递",
    showRetry: failed,
  };
}

export function timelineMessageFlowSpec({
  roomMessages = [],
  localPreviewMessages = [],
  pendingMessages = [],
  unread = 0,
  shellPage = "hub",
} = {}) {
  const sourceMessages = Array.isArray(roomMessages) && roomMessages.length
    ? roomMessages
    : Array.isArray(localPreviewMessages)
      ? localPreviewMessages
      : [];
  const messages = sourceMessages.filter(
    (message) => !(typeof message?.text === "string" && message.text.includes("探针消息")),
  );
  const pending = Array.isArray(pendingMessages) ? pendingMessages : [];
  const allowUnreadDivider = shellPage !== "hub" && shellPage !== "user";
  const unreadForDivider = allowUnreadDivider ? unread : 0;
  const unreadStartIndex =
    unreadForDivider > 0 ? Math.max(messages.length - unreadForDivider, 0) : -1;
  const totalRows = messages.length + pending.length;
  const allowMessageStagger = shellPage !== "hub" && shellPage !== "creative";
  const shouldStagger = allowMessageStagger && totalRows <= 20;

  return {
    messages,
    pending,
    unreadForDivider,
    unreadStartIndex,
    allowMessageGrouping: shellPage !== "hub" && shellPage !== "user",
    staggerBase: shouldStagger ? 30 : 0,
    staggerCap: shouldStagger ? 300 : 0,
  };
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

export function timelineMetaChips({
  room = null,
  activeRoomId = "",
  shellPage = "hub",
  bootstrapDisplayName = "",
  routePrefix = "",
  currentIdentity = "",
  roomKind = "system",
  roomKindLabel = "",
  roomLastActivity = "",
  unread = 0,
  hasDraft = false,
  pendingCount = 0,
  sendError = false,
  isSendingMessage = false,
  lastRefreshErrorMessage = "",
  roomChatStatusSummary = "",
  roomSyncLabel = "",
  refreshInProgress = false,
  providerConnectionState = "",
  translateProviderConnectionState = (value) => value,
  translateClientDisplayName = (value) => value,
  translateRoutePrefix = (value) => value,
} = {}) {
  const chips = [];
  const compactChatShell = shellPage === "user" || shellPage === "admin";

  if (shellPage === "unified") {
    chips.push(
      { text: translateClientDisplayName(bootstrapDisplayName), tone: "muted" },
      {
        text: room?.id === activeRoomId ? "当前会话" : "旁侧会话",
        tone: room?.id === activeRoomId ? "accent" : "muted",
      },
      { text: `入口 ${translateRoutePrefix(routePrefix)}`, tone: "muted" },
    );
  } else {
    chips.push({ text: roomKindLabel, tone: roomKind === "direct" ? "accent" : "muted" });
    chips.push({ text: roomLastActivity, tone: "muted" });
  }

  if (unread > 0) {
    chips.push({ text: `${unread} 条未读`, tone: "warm" });
  }
  if (!compactChatShell) {
    chips.push({ text: `身份 ${currentIdentity}`, tone: "muted" });
  }
  if (shellPage !== "user") {
    chips.push({
      text: roomChatStatusSummary,
      tone: sendError ? "danger" : pendingCount ? "warm" : "accent",
    });
  }
  if (hasDraft) {
    chips.push({ text: "有草稿未发", tone: "accent" });
  }
  if (pendingCount) {
    chips.push({
      text: sendError ? "有待重发消息" : "有待同步消息",
      tone: sendError ? "danger" : "warm",
    });
  }
  if (isSendingMessage) {
    chips.push({ text: "发送中", tone: "warm" });
  }
  if (sendError) {
    chips.push({ text: "发送失败", tone: "danger" });
  }
  if (lastRefreshErrorMessage) {
    chips.push({ text: "回退快照", tone: "warm" });
  }

  chips.push({ text: roomSyncLabel, tone: refreshInProgress ? "warm" : "muted" });
  chips.push({
    text: `消息来源${translateProviderConnectionState(providerConnectionState)}`,
    tone: providerConnectionState === "Connected" ? "accent" : "danger",
  });

  return chips;
}
