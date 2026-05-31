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
