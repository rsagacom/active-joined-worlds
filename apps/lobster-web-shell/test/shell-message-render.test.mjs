// shell-message-render.test.mjs — 消息渲染纯函数单元测试
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  messageStableId,
  isSystemSender,
  messageAvatarTone,
  messageThreadKind,
  messageRoleLabel,
  formatDateTime,
  escapeHtml,
  timelineMetaChips,
  timelineDividerSpecsForMessage,
  timelineMessageFlowSpec,
  timelineMessageRowSpec,
  timelinePendingMessageRowSpec,
  timelineTypingIndicatorSpec,
} from "../shell-message-render.js";

// ====== messageStableId ======

test("messageStableId: 优先使用 message_id", () => {
  assert.equal(messageStableId({ message_id: "msg-001", id: "msg-002" }), "msg-001");
});

test("messageStableId: 回退到 id", () => {
  assert.equal(messageStableId({ id: "msg-003" }), "msg-003");
});

test("messageStableId: null/undefined 返回空字符串", () => {
  assert.equal(messageStableId(null), "");
  assert.equal(messageStableId(undefined), "");
  assert.equal(messageStableId({}), "");
});

// ====== isSystemSender ======

test("isSystemSender: 识别 system", () => {
  assert.equal(isSystemSender("system"), true);
  assert.equal(isSystemSender("sys"), true);
  assert.equal(isSystemSender("系统"), true);
  assert.equal(isSystemSender("系统消息"), true);
});

test("isSystemSender: 大小写不敏感", () => {
  assert.equal(isSystemSender("SYSTEM"), true);
  assert.equal(isSystemSender("System"), true);
});

test("isSystemSender: 普通用户不匹配", () => {
  assert.equal(isSystemSender("alice"), false);
  assert.equal(isSystemSender(""), false);
  assert.equal(isSystemSender(null), false);
});

// ====== messageAvatarTone ======

test("messageAvatarTone: 自己的消息返回 self", () => {
  assert.equal(messageAvatarTone({ sender: "alice" }, { id: "dm:bob" }, true), "self");
});

test("messageAvatarTone: 系统消息返回 system", () => {
  assert.equal(messageAvatarTone({ sender: "system" }, { id: "room:lobby" }, false), "system");
});

test("messageAvatarTone: direct 房间对方返回 direct", () => {
  assert.equal(messageAvatarTone({ sender: "bob" }, { id: "dm:bob" }, false), "direct");
});

test("messageAvatarTone: public 房间返回 room", () => {
  assert.equal(messageAvatarTone({ sender: "charlie" }, { id: "room:lobby" }, false), "room");
});

// ====== messageThreadKind ======

test("messageThreadKind: 自己的消息返回 self", () => {
  assert.equal(messageThreadKind({ sender: "alice" }, { id: "dm:bob" }, true), "self");
});

test("messageThreadKind: 系统消息返回 system", () => {
  assert.equal(messageThreadKind({ sender: "system" }, { id: "room:lobby" }, false), "system");
});

test("messageThreadKind: direct 返回 direct", () => {
  assert.equal(messageThreadKind({ sender: "bob" }, { id: "dm:bob" }, false), "direct");
});

test("messageThreadKind: public 返回 room", () => {
  assert.equal(messageThreadKind({ sender: "dave" }, { id: "room:lobby" }, false), "room");
});

// ====== messageRoleLabel ======

test("messageRoleLabel: 自己的消息用户端返回 你", () => {
  assert.equal(messageRoleLabel({ sender: "alice" }, { id: "dm:bob" }, true), "你");
});

test("messageRoleLabel: 系统消息返回 系统", () => {
  assert.equal(messageRoleLabel({ sender: "system" }, { id: "room:lobby" }, false), "系统");
});

test("messageRoleLabel: direct 对方返回 对方", () => {
  assert.equal(messageRoleLabel({ sender: "bob" }, { id: "dm:bob" }, false), "对方");
});

test("messageRoleLabel: public 他人返回 群聊", () => {
  assert.equal(messageRoleLabel({ sender: "eve" }, { id: "room:lobby" }, false), "群聊");
});

// ====== formatDateTime ======

test("formatDateTime: 返回本地化时间字符串", () => {
  const result = formatDateTime(1700000000000);
  assert.equal(typeof result, "string");
  assert.ok(result.length > 0, "不应为空字符串");
});

test("formatDateTime: 不同时间戳返回不同值", () => {
  assert.notEqual(formatDateTime(1700000000000), formatDateTime(1800000000000));
});

// ====== escapeHtml ======

test("escapeHtml: 转义 &", () => {
  assert.equal(escapeHtml("a & b"), "a &amp; b");
});

test("escapeHtml: 转义 <>", () => {
  assert.equal(escapeHtml("<script>"), "&lt;script&gt;");
});

test("escapeHtml: 转义引号", () => {
  assert.equal(escapeHtml('"hello"'), "&quot;hello&quot;");
  assert.equal(escapeHtml("it's"), "it&#39;s");
});

test("escapeHtml: 普通文本不变", () => {
  assert.equal(escapeHtml("hello world"), "hello world");
});

test("escapeHtml: 数字转为字符串", () => {
  assert.equal(escapeHtml(123), "123");
});

// ====== timelineMetaChips ======

test("timelineMetaChips: unified 页面显示入口、会话状态、身份和 provider", () => {
  const chips = timelineMetaChips({
    room: { id: "room:lobby" },
    activeRoomId: "room:lobby",
    shellPage: "unified",
    bootstrapDisplayName: "Mobile Web",
    routePrefix: "/app",
    currentIdentity: "alice",
    roomChatStatusSummary: "可发送",
    providerConnectionState: "Connected",
    translateProviderConnectionState: (value) => value,
    translateClientDisplayName: (value) => `client:${value}`,
    translateRoutePrefix: (value) => `route:${value}`,
    roomSyncLabel: "已同步",
  });

  assert.deepEqual(chips, [
    { text: "client:Mobile Web", tone: "muted" },
    { text: "当前会话", tone: "accent" },
    { text: "入口 route:/app", tone: "muted" },
    { text: "身份 alice", tone: "muted" },
    { text: "可发送", tone: "accent" },
    { text: "已同步", tone: "muted" },
    { text: "消息来源Connected", tone: "accent" },
  ]);
});

test("timelineMetaChips: 用户房间隐藏身份和聊天状态但保留未读草稿发送状态", () => {
  const chips = timelineMetaChips({
    room: { id: "dm:bob" },
    activeRoomId: "dm:bob",
    shellPage: "user",
    roomKind: "direct",
    roomKindLabel: "私聊",
    roomLastActivity: "刚刚",
    unread: 2,
    hasDraft: true,
    pendingCount: 1,
    isSendingMessage: true,
    refreshInProgress: true,
    providerConnectionState: "Disconnected",
    translateProviderConnectionState: (value) => value,
    roomSyncLabel: "刷新中",
  });

  assert.deepEqual(chips, [
    { text: "私聊", tone: "accent" },
    { text: "刚刚", tone: "muted" },
    { text: "2 条未读", tone: "warm" },
    { text: "有草稿未发", tone: "accent" },
    { text: "有待同步消息", tone: "warm" },
    { text: "发送中", tone: "warm" },
    { text: "刷新中", tone: "warm" },
    { text: "消息来源Disconnected", tone: "danger" },
  ]);
});

test("timelineMetaChips: 发送失败优先显示危险态并保留回退快照提示", () => {
  const chips = timelineMetaChips({
    room: { id: "room:lobby" },
    activeRoomId: "room:lobby",
    shellPage: "hub",
    roomKind: "public",
    roomKindLabel: "群聊",
    roomLastActivity: "暂无消息",
    currentIdentity: "alice",
    sendError: true,
    pendingCount: 3,
    lastRefreshErrorMessage: "timeout",
    providerConnectionState: "Connecting",
    translateProviderConnectionState: (value) => value,
    roomChatStatusSummary: "待重发",
    roomSyncLabel: "待同步",
  });

  assert.deepEqual(chips, [
    { text: "群聊", tone: "muted" },
    { text: "暂无消息", tone: "muted" },
    { text: "身份 alice", tone: "muted" },
    { text: "待重发", tone: "danger" },
    { text: "有待重发消息", tone: "danger" },
    { text: "发送失败", tone: "danger" },
    { text: "回退快照", tone: "warm" },
    { text: "待同步", tone: "muted" },
    { text: "消息来源Connecting", tone: "danger" },
  ]);
});

// ====== timelineMessageRowSpec ======

test("timelineMessageRowSpec: 自己的消息生成右侧行和 messageId dataset", () => {
  const spec = timelineMessageRowSpec({
    message: { message_id: "msg-1", sender: "alice" },
    room: { id: "dm:bob" },
    currentIdentity: "alice",
    index: 0,
    messagesLength: 2,
  });

  assert.deepEqual(spec, {
    isSelf: true,
    messageKind: "self",
    className: "message-row self",
    dataset: {
      messageKind: "self",
      messageSide: "self",
      messageId: "msg-1",
    },
    grouped: false,
    style: "",
  });
});

test("timelineMessageRowSpec: 系统消息居中并不会错误归到 peer", () => {
  const spec = timelineMessageRowSpec({
    message: { id: "sys-1", sender: "system" },
    room: { id: "room:lobby" },
    currentIdentity: "alice",
  });

  assert.equal(spec.messageKind, "system");
  assert.equal(spec.dataset.messageSide, "system");
  assert.equal(spec.className, "message-row");
});

test("timelineMessageRowSpec: 连续同发送者同类型消息可分组但未读起点不分组", () => {
  const grouped = timelineMessageRowSpec({
    message: { id: "msg-2", sender: "bob" },
    prevMessage: { id: "msg-1", sender: "bob" },
    room: { id: "dm:bob" },
    currentIdentity: "alice",
    index: 1,
    unreadStartIndex: -1,
    allowMessageGrouping: true,
  });
  const unreadStart = timelineMessageRowSpec({
    message: { id: "msg-2", sender: "bob" },
    prevMessage: { id: "msg-1", sender: "bob" },
    room: { id: "dm:bob" },
    currentIdentity: "alice",
    index: 1,
    unreadStartIndex: 1,
    allowMessageGrouping: true,
  });

  assert.equal(grouped.grouped, true);
  assert.equal(unreadStart.grouped, false);
});

test("timelineMessageRowSpec: 最近六条消息应用 stagger 并受 cap 限制", () => {
  const spec = timelineMessageRowSpec({
    message: { id: "msg-9", sender: "bob" },
    room: { id: "room:lobby" },
    currentIdentity: "alice",
    index: 8,
    messagesLength: 10,
    staggerBase: 30,
    staggerCap: 90,
  });

  assert.equal(spec.style, "--msg-stagger:90ms");
});

// ====== timelinePendingMessageRowSpec ======

test("timelinePendingMessageRowSpec: 待同步消息生成 self/pending 行规格", () => {
  const spec = timelinePendingMessageRowSpec({
    message: { id: "pending-1", text: "hello" },
    currentIdentity: "alice",
  });

  assert.deepEqual(spec, {
    rowClassName: "message-row self",
    rowDataset: {
      messageKind: "pending",
      messageSide: "self",
    },
    avatarClassName: "message-avatar message-avatar-self",
    avatarText: "AL",
    articleClassName: "message self message-pending",
    articleDataset: {
      messageKind: "pending",
    },
    senderText: "alice",
    roleText: "待同步",
    timestampText: "正在投递",
    showRetry: false,
  });
});

test("timelinePendingMessageRowSpec: 失败消息生成待重发状态和 retry 标记", () => {
  const spec = timelinePendingMessageRowSpec({
    message: { id: "pending-2", failed: true },
    currentIdentity: "alice",
  });

  assert.equal(spec.articleClassName, "message self message-pending message-pending-failed");
  assert.equal(spec.roleText, "待重发");
  assert.equal(spec.timestampText, "发送失败");
  assert.equal(spec.showRetry, true);
});

// ====== timelineMessageFlowSpec ======

test("timelineMessageFlowSpec: 空房间使用本地预览并过滤探针消息", () => {
  const preview = [
    { id: "probe", text: "探针消息：忽略" },
    { id: "preview-1", text: "可见预览" },
  ];
  const spec = timelineMessageFlowSpec({
    roomMessages: [],
    localPreviewMessages: preview,
    pendingMessages: [],
    unread: 0,
    shellPage: "hub",
  });

  assert.deepEqual(spec.messages, [{ id: "preview-1", text: "可见预览" }]);
  assert.equal(spec.unreadForDivider, 0);
  assert.equal(spec.unreadStartIndex, -1);
  assert.equal(spec.allowMessageGrouping, false);
  assert.equal(spec.staggerBase, 0);
});

test("timelineMessageFlowSpec: 非 hub/user 页面计算未读起点与 stagger", () => {
  const spec = timelineMessageFlowSpec({
    roomMessages: [
      { id: "m1", text: "1" },
      { id: "m2", text: "2" },
      { id: "m3", text: "3" },
    ],
    pendingMessages: [{ id: "p1", text: "pending" }],
    unread: 2,
    shellPage: "unified",
  });

  assert.equal(spec.messages.length, 3);
  assert.deepEqual(spec.pending, [{ id: "p1", text: "pending" }]);
  assert.equal(spec.unreadForDivider, 2);
  assert.equal(spec.unreadStartIndex, 1);
  assert.equal(spec.allowMessageGrouping, true);
  assert.equal(spec.staggerBase, 30);
  assert.equal(spec.staggerCap, 300);
});

test("timelineMessageFlowSpec: 超过二十行时关闭 stagger", () => {
  const messages = Array.from({ length: 21 }, (_, index) => ({ id: `m${index}`, text: String(index) }));
  const spec = timelineMessageFlowSpec({
    roomMessages: messages,
    shellPage: "unified",
  });

  assert.equal(spec.messages.length, 21);
  assert.equal(spec.staggerBase, 0);
  assert.equal(spec.staggerCap, 0);
});

// ====== timelineDividerSpecsForMessage ======

test("timelineDividerSpecsForMessage: 未读起点生成未读分隔文案", () => {
  const spec = timelineDividerSpecsForMessage({
    index: 2,
    message: { id: "m3", timestamp_ms: 1700086400000 },
    prevMessage: { id: "m2", timestamp_ms: 1700086300000 },
    unreadStartIndex: 2,
    unreadForDivider: 3,
  });

  assert.deepEqual(spec, [
    { className: "timeline-divider", text: "以下是 3 条未读消息" },
  ]);
});

test("timelineDividerSpecsForMessage: 跨日期消息生成日期分隔文案", () => {
  const spec = timelineDividerSpecsForMessage({
    index: 1,
    message: { id: "m2", timestamp_ms: new Date(2026, 5, 16, 1, 0, 0).getTime() },
    prevMessage: { id: "m1", timestamp_ms: new Date(2026, 5, 15, 23, 0, 0).getTime() },
    unreadStartIndex: -1,
    unreadForDivider: 0,
  });

  assert.deepEqual(spec, [
    { className: "timeline-divider", text: "2026-06-16" },
  ]);
});

test("timelineDividerSpecsForMessage: 同时命中时保持未读分隔在日期分隔前", () => {
  const spec = timelineDividerSpecsForMessage({
    index: 1,
    message: { id: "m2", timestamp_ms: new Date(2026, 5, 16, 1, 0, 0).getTime() },
    prevMessage: { id: "m1", timestamp_ms: new Date(2026, 5, 15, 23, 0, 0).getTime() },
    unreadStartIndex: 1,
    unreadForDivider: 1,
  });

  assert.deepEqual(spec, [
    { className: "timeline-divider", text: "以下是 1 条未读消息" },
    { className: "timeline-divider", text: "2026-06-16" },
  ]);
});

// ====== timelineTypingIndicatorSpec ======

test("timelineTypingIndicatorSpec: 有未失败 pending 时生成发送中规格", () => {
  const spec = timelineTypingIndicatorSpec([
    { id: "p1", failed: true },
    { id: "p2", failed: false },
  ]);

  assert.deepEqual(spec, {
    className: "timeline-typing",
    dotsClassName: "timeline-typing-dots",
    dotClassName: "timeline-typing-dot",
    dotCount: 3,
    labelText: "发送中…",
  });
});

test("timelineTypingIndicatorSpec: 全部失败或空 pending 不显示发送中", () => {
  assert.equal(timelineTypingIndicatorSpec([]), null);
  assert.equal(timelineTypingIndicatorSpec([{ id: "p1", failed: true }]), null);
});
