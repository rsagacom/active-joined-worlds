import {
  translateProviderMode,
  translateRoomKind,
} from "./shell-labels.js";
import {
  quickActionFollowUpCopy,
  quickActionFollowUpLabel,
  quickActionStatusCopy,
} from "./shell-quick-action-labels.js";
import {
  translateProviderConnectionState,
} from "./shell-shared.js";

function chatRuntimeShellRows({ shellPage = "", threadHeadline = "", chatStatusSummary = "", queueSummary = "" } = {}) {
  if (shellPage === "user") return [];
  return [
    { label: shellPage === "admin" ? "线程" : "会话标题", value: threadHeadline },
    { label: "聊天状态", value: chatStatusSummary },
    { label: "队列", value: queueSummary },
  ];
}

function chatRuntimeSyncRows({ room = null, syncLabel = "" } = {}) {
  return [
    { label: "同步", value: syncLabel },
    { label: "消息数", value: `${room?.messages?.length || 0} 条` },
  ];
}

function chatRuntimeQuickActionRows(quickContext = null) {
  if (!quickContext?.latestAction) return [];
  const { latestAction, quickState } = quickContext;
  return [
    { label: "最近动作", value: `${latestAction} · ${quickActionStatusCopy(latestAction)}` },
    {
      label: "动作状态",
      value: `${quickActionFollowUpLabel(latestAction, quickState)} · ${quickActionFollowUpCopy(latestAction, quickState)}`,
    },
  ];
}

function chatRuntimeProviderRows({
  provider = {},
  gatewayUrl = "",
  isSendingMessage = false,
  caretakerStatus = "",
  sendError = "",
} = {}) {
  const rows = [
    {
      label: "消息来源",
      value: `${translateProviderMode(provider?.mode || "unknown")} · ${translateProviderConnectionState(
        provider?.connection_state,
      )}`,
    },
    {
      label: "输入状态",
      value: gatewayUrl ? (isSendingMessage ? "发送中" : "可发送") : "等待网关",
    },
  ];
  if (caretakerStatus) {
    rows.push({ label: "管家状态", value: caretakerStatus });
  }
  if (sendError) {
    rows.push({ label: "最近错误", value: sendError });
  }
  return rows;
}

export function chatRuntimeDetailModelForState({
  room = null,
  shellPage = "",
  threadHeadline = "",
  chatStatusSummary = "",
  queueSummary = "",
  syncLabel = "",
  quickContext = null,
  provider = {},
  gatewayUrl = "",
  isSendingMessage = false,
  caretakerStatus = "",
  sendError = "",
} = {}) {
  return {
    rowsBeforePreview: [
      ...chatRuntimeShellRows({ shellPage, threadHeadline, chatStatusSummary, queueSummary }),
      ...chatRuntimeSyncRows({ room, syncLabel }),
      ...chatRuntimeQuickActionRows(quickContext),
    ],
    preview: quickContext?.preview || null,
    rowsAfterPreview: chatRuntimeProviderRows({
      provider,
      gatewayUrl,
      isSendingMessage,
      caretakerStatus,
      sendError,
    }),
  };
}

export function composerPlaceholderForState({
  room = null,
  roomKind = "",
  roomThreadHeadline = "",
  roomDisplayPeer = "",
  shellPage = "",
  compactChatShell = false,
  composerAvailability = {},
  isSendingMessage = false,
  gatewayUnavailable = false,
  loginRequired = false,
  gatewayUrl = "",
  editingMessage = false,
} = {}) {
  let placeholder;
  if (isSendingMessage) {
    placeholder = "正在发送消息...";
  } else if (gatewayUnavailable) {
    placeholder = "连接离线，等待同步恢复";
  } else if (loginRequired) {
    placeholder = "请先登录后发送";
  } else if (room) {
    placeholder = composerRoomPlaceholder(room, roomKind, roomThreadHeadline, roomDisplayPeer, compactChatShell);
  } else {
    placeholder = compactChatShell
      ? "先选会话，再输入第一句"
      : "先选会话，再写跟进或公告";
  }
  if (!loginRequired && !isSendingMessage && room && !composerAvailability.canLiveSend) {
    placeholder += gatewayUrl ? "（会先保存在本地，等待同步）" : "（会先进入本地时间线）";
  }
  if (shellPage === "hub" && !gatewayUnavailable && !isSendingMessage) {
    placeholder = "说点什么…";
  }
  if (editingMessage) {
    placeholder = "正在编辑已发送消息";
  }
  return placeholder;
}

function composerRoomPlaceholder(room, roomKind, roomThreadHeadline, roomDisplayPeer, compactChatShell) {
  if (roomKind === "direct") {
    const peer = room.thread_headline || room.peer_label || room.participant_label || roomDisplayPeer;
    return compactChatShell ? `发消息给 ${peer}` : `发给 ${peer}`;
  }
  if (roomKind === "public") {
    return compactChatShell ? `发到 ${roomThreadHeadline}` : `在 ${roomThreadHeadline} 里说点什么`;
  }
  return `回复 ${room.participant_label || room.route_label || room.title}`;
}

function composerContextInputStatusItem({ inputLabel = "输入", sendError = "", isSendingMessage = false } = {}) {
  return {
    label: inputLabel,
    value: isSendingMessage ? "发送中" : sendError ? "待重发" : "可发送",
    tone: sendError ? "danger" : isSendingMessage ? "warm" : "accent",
  };
}

export function composerContextItemsForState({
  room = null,
  shellPage = "",
  gatewayUrl = "",
  threadHeadline = "",
  audienceLabel = "",
  routeLabel = "",
  chatStatusSummary = "",
  queueSummary = "",
  caretakerPendingCount = 0,
  unreadCount = 0,
  visiblePendingEchoCount = 0,
  sendError = "",
  isSendingMessage = false,
  inputLabel = "输入",
} = {}) {
  if (!room) {
    return [
      {
        label: shellPage === "admin" ? "线程" : "会话标题",
        value: gatewayUrl ? "先打开一个会话" : "等待网关",
        tone: "muted",
      },
    ];
  }
  const inputItem = composerContextInputStatusItem({ inputLabel, sendError, isSendingMessage });
  if (shellPage === "user") {
    return [
      {
        label: "发送到",
        value: threadHeadline || room.participant_label || room.title,
        tone: "accent",
      },
      inputItem,
    ];
  }
  return [
    {
      label: shellPage === "admin" ? "线程" : "会话标题",
      value: threadHeadline,
      tone: "accent",
    },
    {
      label: shellPage === "admin" ? "当前对象" : "聊天对象",
      value: audienceLabel,
      tone: "accent",
    },
    {
      label: shellPage === "admin" ? "消息去向" : "投递路线",
      value: routeLabel,
      tone: sendError ? "danger" : "muted",
    },
    {
      label: "聊天状态",
      value: chatStatusSummary,
      tone: sendError ? "danger" : visiblePendingEchoCount ? "warm" : "accent",
    },
    {
      label: "队列",
      value: queueSummary,
      tone: caretakerPendingCount > 0 || unreadCount > 0 ? "warm" : "muted",
    },
    inputItem,
  ];
}

export function composerMetaBaseStatus(room, sendError, isSending, hasDraft) {
  if (!room) return "先打开会话";
  if (sendError) return "待修改后重发";
  if (isSending) return "发送中";
  if (hasDraft) return "草稿已保存";
  return "可直接发送";
}

export function composerMetaQuickHint(shellMode) {
  return shellMode === "admin" ? "更多 · 刷新" : "广场 · 刷新";
}

export function threadStatusRailModelForState({
  room = null,
  shellPage = "",
  threadHeadline = "",
  chatStatusSummary = "",
  queueSummary = "",
  audienceLabel = "",
  routeLabel = "",
  syncLabel = "",
  sendError = "",
  pendingEchoCount = 0,
  caretakerPendingCount = 0,
  unreadCount = 0,
  refreshInProgress = false,
  isSendingMessage = false,
  draftLength = 0,
  caretaker = null,
  caretakerStatus = "",
  caretakerNotificationCount = 0,
} = {}) {
  if (!room || shellPage === "user") return { visible: false, items: [] };
  const hasSendError = Boolean(sendError);
  const items = [
    {
      label: shellPage === "admin" ? "线程" : "会话标题",
      value: threadHeadline,
      tone: "muted",
    },
    {
      label: "聊天状态",
      value: chatStatusSummary,
      tone: hasSendError ? "danger" : pendingEchoCount ? "warm" : "accent",
    },
    {
      label: "队列",
      value: queueSummary,
      tone: caretakerPendingCount > 0 || unreadCount > 0 ? "warm" : "muted",
    },
    {
      label: shellPage === "admin" ? "后台对象" : "聊天对象",
      value: audienceLabel,
      tone: "accent",
    },
    {
      label: "路由",
      value: routeLabel,
      tone: hasSendError ? "danger" : "muted",
    },
    {
      label: "同步",
      value: syncLabel,
      tone: refreshInProgress ? "warm" : "muted",
    },
    {
      label: "输入",
      value: isSendingMessage ? "发送中" : hasSendError ? "待重发" : "可输入",
      tone: hasSendError ? "danger" : isSendingMessage ? "warm" : "accent",
    },
  ];
  if (draftLength > 0) {
    items.push({ label: "草稿", value: `${draftLength} 字`, tone: "accent" });
  }
  if (caretaker) {
    items.push({
      label: caretaker.role_label || "房间管家",
      value: `${caretaker.name} · ${caretakerStatus}`,
      tone: caretakerPendingCount > 0 ? "warm" : "accent",
    });
    if (caretakerNotificationCount > 0) {
      items.push({ label: "提醒", value: `${caretakerNotificationCount} 条给主人`, tone: "muted" });
    }
  }
  return { visible: true, items };
}

export function conversationOverviewHeaderModel({
  shellPage = "",
  threadHeadline = "",
  summaryLine = "",
  overviewSummary = "",
  contextSummary = "",
  subtitle = "",
  roomKind = "",
  roomKindLabel = "",
  audienceLabel = "",
  identity = "",
  compactChatShell = false,
  sceneBanner = "",
  caretaker = null,
} = {}) {
  const summary =
    shellPage === "user"
      ? overviewSummary || contextSummary || subtitle || summaryLine
      : shellPage === "admin"
        ? `后台对象 · ${summaryLine}`
        : summaryLine;
  const pills = [
    { text: roomKindLabel, tone: roomKind === "direct" ? "accent" : "muted" },
    { text: audienceLabel, tone: "muted" },
  ];
  if (!compactChatShell) {
    pills.push({ text: `身份 ${identity}`, tone: "muted" });
  }
  if (sceneBanner) {
    pills.push({ text: sceneBanner, tone: "warm" });
  }
  if (caretaker) {
    pills.push({ text: `${caretaker.name} · ${caretaker.role_label}`, tone: "accent" });
  }
  return { title: threadHeadline, summary, pills };
}

export function conversationOverviewContextModel({
  shellPage = "",
  summaryLine = "",
  contextSummary = "",
  statusLine = "",
} = {}) {
  return {
    title: shellPage === "admin" ? `后台摘要 · ${summaryLine}` : summaryLine,
    copies: [contextSummary, statusLine],
  };
}

export function conversationOverviewBaseStatusPills({
  chatStatusSummary = "",
  queueSummary = "",
  syncLabel = "",
  routeLabel = "",
  hasSendError = false,
  pendingEchoCount = 0,
  caretakerPendingCount = 0,
  unreadCount = 0,
  refreshInProgress = false,
  compactChatShell = false,
  messageCount = 0,
} = {}) {
  const pills = [
    {
      text: chatStatusSummary,
      tone: hasSendError ? "danger" : pendingEchoCount ? "warm" : "accent",
    },
    {
      text: queueSummary,
      tone: caretakerPendingCount > 0 || unreadCount > 0 ? "warm" : "muted",
    },
    { text: syncLabel, tone: refreshInProgress ? "warm" : "accent" },
    { text: routeLabel, tone: hasSendError ? "danger" : "muted" },
  ];
  if (!compactChatShell) {
    pills.push({ text: `${messageCount} 条消息`, tone: "muted" });
  }
  pills.push({
    text: unreadCount > 0 ? `${unreadCount} 条未读` : "已读",
    tone: unreadCount > 0 ? "warm" : "muted",
  });
  return pills;
}

export function conversationOverviewDraftPill({ hasDraft = false, draftLength = 0 } = {}) {
  if (!hasDraft) return null;
  return { text: `${draftLength} 字草稿`, tone: "accent" };
}

export function conversationOverviewCaretakerStatusPillModel({
  caretaker = null,
  caretakerPendingCount = 0,
} = {}) {
  if (!caretaker) return null;
  return {
    text: `${caretaker.status} · ${caretakerPendingCount} 条访客提醒`,
    tone: caretakerPendingCount > 0 ? "warm" : "accent",
  };
}

export function conversationOverviewRuntimeStatusPills({
  isSendingMessage = false,
  hasSendError = false,
  hasSyncFallback = false,
} = {}) {
  const pills = [];
  if (isSendingMessage) {
    pills.push({ text: "发送中", tone: "warm" });
  }
  if (hasSendError) {
    pills.push({ text: "发送失败", tone: "danger" });
  }
  if (hasSyncFallback) {
    pills.push({ text: "回退快照", tone: "warm" });
  }
  return pills;
}

export function userConversationStatusPills({
  syncLabel = "",
  refreshInProgress = false,
  unreadCount = 0,
  caretaker = null,
  caretakerPendingCount = 0,
  hasDraft = false,
  hasSendError = false,
  isSendingMessage = false,
} = {}) {
  const leadingPills = [
    { text: syncLabel, tone: refreshInProgress ? "warm" : "accent" },
    {
      text: unreadCount > 0 ? `${unreadCount} 条未读` : "已读",
      tone: unreadCount > 0 ? "warm" : "muted",
    },
  ];
  const trailingPills = [];
  if (caretaker) {
    trailingPills.push({
      text: `${caretaker.name} 在线`,
      tone: caretakerPendingCount > 0 ? "warm" : "accent",
    });
  }
  if (hasDraft) {
    trailingPills.push({ text: "草稿已保存", tone: "accent" });
  }
  if (hasSendError) {
    trailingPills.push({ text: "发送失败", tone: "danger" });
  }
  if (isSendingMessage) {
    trailingPills.push({ text: "发送中", tone: "warm" });
  }
  return { leadingPills, trailingPills };
}

export function composerHeroKicker(shellPage) {
  if (shellPage === "admin") return "管理后台消息区";
  if (shellPage === "user") return "房间内聊天主界面";
  return "城市外世界页";
}

export function composerHeroTitle(room, shellPage, roomThreadHeadline, roomDisplayPeer, roomKind) {
  if (!room) {
    return shellPage === "user" ? "先选房间" : "先选会话";
  }
  if (shellPage === "admin") {
    return `发消息到 ${roomThreadHeadline}`;
  }
  if (roomKind === "direct") {
    const peerName = room.thread_headline || room.peer_label || room.participant_label || roomDisplayPeer;
    return `发消息给 ${peerName}`;
  }
  return `发消息到 ${roomThreadHeadline}`;
}

export function composerHeroNote(room, shellPage) {
  if (!room) {
    if (shellPage === "admin") return "先选会话，再把记录和跟进像聊天一样写下。";
    if (shellPage === "user") return "先选会话，房间内聊天主界面才会点亮。";
    return "先选会话，再开始发消息。";
  }
  if (shellPage === "admin") return "这里优先写记录和跟进，手感仍然像聊天一样顺手。";
  if (shellPage === "user") return "这里就是房间内聊天主界面的输入框，Enter 发送，Shift+Enter 换行。";
  return "这里就是当前会话的输入框，Enter 发送，Shift+Enter 换行。";
}

export function roomPreview(room, resolveQuickPreview, latestMessageLike, previewPrimaryFieldText) {
  const preview = resolveQuickPreview?.(room);
  const previewField = previewPrimaryFieldText?.(preview?.structured);
  if (previewField) return previewField;
  if (typeof room?.preview_text === "string" && room.preview_text.trim()) {
    return room.preview_text.trim();
  }
  return latestMessageLike?.(room)?.text || "还没有消息，先发第一句吧。";
}

export function roomLastActivity(room, latestMessageLike) {
  if (typeof room?.last_activity_label === "string" && room.last_activity_label.trim()) {
    return room.last_activity_label.trim();
  }
  const lastMessage = latestMessageLike?.(room);
  if (!lastMessage) return "暂无消息";
  return `${lastMessage.sender} · ${lastMessage.pending ? "待同步" : lastMessage.timestamp}`;
}

export function composerHeroChipsData(room, shellPage, roomKind, roomSyncLabel, caretakerPendingCount, unreadCount, refreshInProgress, gatewayUrl) {
  if (!room) {
    return [{ text: gatewayUrl ? "等待会话" : "等待网关", tone: "muted" }];
  }
  const chips = [
    { text: roomKind, tone: roomKind === "direct" ? "accent" : "muted" },
    { text: roomSyncLabel, tone: refreshInProgress ? "warm" : "accent" },
  ];
  if (shellPage === "admin") {
    chips.push({
      text: caretakerPendingCount > 0 ? `${caretakerPendingCount} 条待跟进` : "当前窗口可继续记录",
      tone: caretakerPendingCount > 0 ? "warm" : "muted",
    });
  } else {
    chips.push({
      text: unreadCount > 0 ? `${unreadCount} 条未读` : "当前已读",
      tone: unreadCount > 0 ? "warm" : "muted",
    });
  }
  return chips;
}

export function composerHeroModelForState({
  room = null,
  shellPage = "",
  roomKind = "",
  translatedRoomKind = "",
  roomThreadHeadline = "",
  roomDisplayPeer = "",
  roomSyncLabel = "",
  caretakerPendingCount = 0,
  unreadCount = 0,
  refreshInProgress = false,
  gatewayUrl = "",
} = {}) {
  const roomKindLabel = translatedRoomKind || (roomKind ? translateRoomKind(roomKind) : "");
  return {
    variant: shellPage,
    kicker: composerHeroKicker(shellPage),
    title: composerHeroTitle(room, shellPage, roomThreadHeadline, roomDisplayPeer, roomKind),
    note: composerHeroNote(room, shellPage),
    chips: composerHeroChipsData(
      room,
      shellPage,
      roomKindLabel,
      roomSyncLabel,
      caretakerPendingCount,
      unreadCount,
      refreshInProgress,
      gatewayUrl,
    ),
  };
}
