/* ============================================================
   shell-conversation-callout.js — 会话导引文案纯规格函数
   从 app.js 提取。返回 { variant, title, paragraphs } 纯数据对象，
   无 DOM / 无 fetch / 无状态变更。
   roomThreadHeadline / roomAudienceLabel / roomRouteLabel /
   roomChatStatusSummary / roomQueueSummary / roomContextSummary /
   caretakerPendingCount 通过 deps 注入；shellMode 作为参数传入，
   脱离全局即可单测。
   ============================================================ */

function conversationCalloutUserModelForState(room, caretaker, deps) {
  const roomCopy = room
    ? `${deps.roomThreadHeadline(room)} · ${deps.roomAudienceLabel(room)}`
    : "先从左侧点一个会话，房间里的消息流和输入区就会跟上。";
  const caretakerCopy = caretaker
    ? `${caretaker.name} 在线 · ${caretaker.auto_reply}`
    : "OpenClaw 小狗管家会在房间里接住访客留言。";
  const autoReply = caretaker?.auto_reply || "小狗会在房间里自动回复访客。";
  const pendingVisitors = caretaker ? deps.caretakerPendingCount(room) : 0;
  const visitorNote = pendingVisitors > 0
    ? `有 ${pendingVisitors} 条访客提醒在排队，先把当前房间聊顺。`
    : "目前没有排队访客，继续像在房间里聊天即可。";
  return {
    variant: "user",
    title: "房间内聊天主界面",
    paragraphs: [
      { text: roomCopy },
      { text: caretakerCopy },
      { text: `${autoReply} · ${visitorNote}`, className: "conversation-callout-note" },
    ],
  };
}

function conversationCalloutAdminModelForState(room, deps) {
  const roomCopy = room
    ? `${deps.roomThreadHeadline(room)} · ${deps.roomAudienceLabel(room)} · ${deps.roomRouteLabel(room)}`
    : "先在左边选一个会话，右边的补充信息会跟着切换。";
  const governanceNote = room
    ? `${deps.roomChatStatusSummary(room)} · ${deps.roomQueueSummary(room)}`
    : "左侧选功能分类，中间处理消息，右侧显示当前对象和工具。";
  return {
    variant: "admin",
    title: "管理后台",
    paragraphs: [
      { text: roomCopy },
      {
        text: `左侧选功能分类，中间处理消息，右侧显示当前对象和工具 · ${governanceNote}`,
        className: "conversation-callout-note",
      },
    ],
  };
}

function conversationCalloutUnifiedModelForState(room, deps) {
  const roomCopy = room
    ? deps.roomThreadHeadline(room)
    : "中间保留聊天，边上按顺序摆世界、城市、公告、安全和身份。";
  const roomContext = room
    ? deps.roomContextSummary(room)
    : "左侧入口按需展开即可，消息流始终是主位。";
  return {
    variant: "unified",
    title: "城市外世界页",
    paragraphs: [
      { text: roomCopy },
      { text: roomContext, className: "conversation-callout-note" },
    ],
  };
}

export function conversationCalloutModelForState(room, caretaker, shellMode, deps) {
  if (shellMode === "user") return conversationCalloutUserModelForState(room, caretaker, deps);
  if (shellMode === "admin") return conversationCalloutAdminModelForState(room, deps);
  return conversationCalloutUnifiedModelForState(room, deps);
}
