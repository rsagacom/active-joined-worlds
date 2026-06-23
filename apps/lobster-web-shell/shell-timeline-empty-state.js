function roomKind(room) {
  if (room?.id?.startsWith("dm:")) return "direct";
  if (room?.id?.startsWith("room:")) return "public";
  return "system";
}

export function timelineNoRoomEmptyStateSpec({
  gatewayUrl = "",
  shellPage = "hub",
} = {}) {
  const hasGateway = Boolean(gatewayUrl);
  return {
    metaChips: [
      {
        text: hasGateway
          ? "先选会话，消息会显示在这里。"
          : "离线预览态，先选会话再发消息。",
        tone: "muted",
      },
    ],
    card: {
      className: "empty-note timeline-empty timeline-empty-card",
      titleClassName: "timeline-empty-title",
      titleText: "先选会话，再输入第一句",
      copyClassName: "timeline-empty-copy",
      copyText: hasGateway
        ? "消息会按当前线程展开，下面的输入区也会自动切到对应会话。"
        : "离线预览态也能先把第一句写出来，消息会暂存在本地时间线。",
      actionClassName: "timeline-empty-action",
      actionText: shellPage === "admin"
        ? "后台页先选会话，再像聊天一样记录。"
        : "选中会话后，直接在底部输入即可。",
    },
  };
}

export function localPreviewMessagesForEmptyRoom({
  room,
  gatewayUrl = "",
  shellPage = "hub",
  shellVariant = "",
  currentIdentity = "",
} = {}) {
  if (!room || gatewayUrl || shellPage !== "hub") return [];
  if (shellVariant !== "creative-terminal") return [];
  if (roomKind(room) !== "direct") return [];
  return [
    {
      sender: "rsaga",
      timestamp: "10:14",
      text: "这里按住宅私聊显示，对方消息在左边，自己的回复在右边。",
    },
    {
      sender: currentIdentity,
      timestamp: "10:15",
      text: "收到。住宅页保留房间画面，文字对话层可以点击空白临时清屏。",
    },
    {
      sender: "rsaga",
      timestamp: "10:16",
      text: "楼梯热点通往主城，热点只显示小标签，不再盖住场景。",
    },
  ];
}

export function shouldRenderTimelineSkeletonRows({
  room,
  localPreviewMessages = [],
  shellPage = "hub",
  shellVariant = "",
} = {}) {
  const isSceneOverlayShell =
    shellPage === "user" || shellVariant === "creative-terminal" || shellVariant === "public-square";
  return !isSceneOverlayShell && !room?.messages?.length && !localPreviewMessages.length;
}
