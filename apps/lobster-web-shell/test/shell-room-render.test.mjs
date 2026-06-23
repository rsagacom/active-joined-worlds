import test from "node:test";
import assert from "node:assert/strict";
import {
  chatRuntimeDetailModelForState,
  composerContextItemsForState,
  composerHeroModelForState,
  composerPlaceholderForState,
  composerHeroChipsData,
  composerHeroKicker,
  composerHeroNote,
  composerHeroTitle,
  composerMetaBaseStatus,
  composerMetaQuickHint,
  roomLastActivity,
  roomPreview,
  threadStatusRailModelForState,
} from "../shell-room-render.js";

const serial = { concurrency: false };

// ====== chatRuntimeDetailModelForState ======

test("chatRuntimeDetailModelForState: non-user room groups runtime rows around preview", serial, () => {
  const preview = { action: "委托", state: "待回执", detailText: "预览文本" };
  assert.deepEqual(
    chatRuntimeDetailModelForState({
      room: { id: "room:world:lobby", messages: [{}, {}] },
      shellPage: "admin",
      threadHeadline: "世界大厅",
      chatStatusSummary: "有待同步消息",
      queueSummary: "2 条待处理",
      syncLabel: "同步中",
      quickContext: {
        latestAction: "委托",
        quickState: "待回执",
        preview,
      },
      provider: { mode: "gateway-bridge", connection_state: "Connected" },
      gatewayUrl: "http://gw",
      isSendingMessage: true,
      caretakerStatus: "旺财在线值守",
      sendError: "网络超时",
    }),
    {
      rowsBeforePreview: [
        { label: "线程", value: "世界大厅" },
        { label: "聊天状态", value: "有待同步消息" },
        { label: "队列", value: "2 条待处理" },
        { label: "同步", value: "同步中" },
        { label: "消息数", value: "2 条" },
        { label: "最近动作", value: "委托 · 当前窗口正在跟进需求、截止和交付。" },
        { label: "动作状态", value: "待回执 · 委托单已发出，后续等待回执或补充交付。" },
      ],
      preview,
      rowsAfterPreview: [
        { label: "消息来源", value: "当前网关 · 已连接" },
        { label: "输入状态", value: "发送中" },
        { label: "管家状态", value: "旺财在线值守" },
        { label: "最近错误", value: "网络超时" },
      ],
    },
  );
});

test("chatRuntimeDetailModelForState: user room hides shell rows and falls back offline", serial, () => {
  const model = chatRuntimeDetailModelForState({
    room: { id: "dm:a:b", messages: [] },
    shellPage: "user",
    syncLabel: "离线",
    provider: { mode: "unknown", connection_state: "Disconnected" },
    gatewayUrl: "",
    isSendingMessage: false,
  });

  assert.deepEqual(model.rowsBeforePreview, [
    { label: "同步", value: "离线" },
    { label: "消息数", value: "0 条" },
  ]);
  assert.equal(model.preview, null);
  assert.deepEqual(model.rowsAfterPreview, [
    { label: "消息来源", value: "未知 · 已断开" },
    { label: "输入状态", value: "等待网关" },
  ]);
});

// ====== composerContextItemsForState ======

test("composerContextItemsForState: empty state follows shell page and gateway", serial, () => {
  assert.deepEqual(
    composerContextItemsForState({ shellPage: "admin", gatewayUrl: "" }),
    [{ label: "线程", value: "等待网关", tone: "muted" }],
  );
  assert.deepEqual(
    composerContextItemsForState({ shellPage: "hub", gatewayUrl: "http://gw" }),
    [{ label: "会话标题", value: "先打开一个会话", tone: "muted" }],
  );
});

test("composerContextItemsForState: user room keeps compact send target and input status", serial, () => {
  assert.deepEqual(
    composerContextItemsForState({
      room: { id: "dm:a:b", participant_label: "阿初", title: "备用标题" },
      shellPage: "user",
      threadHeadline: "",
      isSendingMessage: true,
    }),
    [
      { label: "发送到", value: "阿初", tone: "accent" },
      { label: "输入", value: "发送中", tone: "warm" },
    ],
  );
});

test("composerContextItemsForState: admin room marks route chat and input as failed", serial, () => {
  assert.deepEqual(
    composerContextItemsForState({
      room: { id: "room:world:lobby" },
      shellPage: "admin",
      threadHeadline: "合同线程标题",
      audienceLabel: "全城居民",
      routeLabel: "主城 / 大厅",
      chatStatusSummary: "待同步",
      queueSummary: "2 条待处理",
      sendError: "网络超时",
      caretakerPendingCount: 1,
      unreadCount: 0,
      visiblePendingEchoCount: 0,
    }),
    [
      { label: "线程", value: "合同线程标题", tone: "accent" },
      { label: "当前对象", value: "全城居民", tone: "accent" },
      { label: "消息去向", value: "主城 / 大厅", tone: "danger" },
      { label: "聊天状态", value: "待同步", tone: "danger" },
      { label: "队列", value: "2 条待处理", tone: "warm" },
      { label: "输入", value: "待重发", tone: "danger" },
    ],
  );
});

test("composerContextItemsForState: hub room uses route labels and pending tone", serial, () => {
  const items = composerContextItemsForState({
    room: { id: "room:world:lobby" },
    shellPage: "hub",
    threadHeadline: "世界大厅",
    audienceLabel: "12 人",
    routeLabel: "公共频道",
    chatStatusSummary: "有待同步消息",
    queueSummary: "1 条未读",
    visiblePendingEchoCount: 2,
  });

  assert.deepEqual(items.map((item) => item.label), [
    "会话标题",
    "聊天对象",
    "投递路线",
    "聊天状态",
    "队列",
    "输入",
  ]);
  assert.equal(items[3].tone, "warm");
  assert.equal(items[4].tone, "muted");
  assert.deepEqual(items[5], { label: "输入", value: "可发送", tone: "accent" });
});

// ====== composerHeroModelForState ======

test("composerHeroModelForState: empty state returns variant copy and waiting chip", serial, () => {
  assert.deepEqual(
    composerHeroModelForState({
      shellPage: "admin",
      gatewayUrl: "",
    }),
    {
      variant: "admin",
      kicker: "管理后台消息区",
      title: "先选会话",
      note: "先选会话，再把记录和跟进像聊天一样写下。",
      chips: [{ text: "等待网关", tone: "muted" }],
    },
  );
});

test("composerHeroModelForState: direct room prefers peer copy and admin follow-up chip", serial, () => {
  assert.deepEqual(
    composerHeroModelForState({
      room: { id: "dm:a:b", participant_label: "阿初" },
      shellPage: "admin",
      roomKind: "direct",
      translatedRoomKind: "私聊",
      roomThreadHeadline: "与阿初",
      roomDisplayPeer: "阿初",
      roomSyncLabel: "已同步",
      caretakerPendingCount: 2,
      refreshInProgress: false,
      gatewayUrl: "http://gw",
    }),
    {
      variant: "admin",
      kicker: "管理后台消息区",
      title: "发消息到 与阿初",
      note: "这里优先写记录和跟进，手感仍然像聊天一样顺手。",
      chips: [
        { text: "私聊", tone: "muted" },
        { text: "已同步", tone: "accent" },
        { text: "2 条待跟进", tone: "warm" },
      ],
    },
  );
});

test("composerHeroModelForState: world public room reports unread and refresh tone", serial, () => {
  const model = composerHeroModelForState({
    room: { id: "room:world:lobby" },
    shellPage: "hub",
    roomKind: "public",
    translatedRoomKind: "群聊",
    roomThreadHeadline: "世界大厅",
    roomDisplayPeer: "",
    roomSyncLabel: "同步中",
    unreadCount: 4,
    refreshInProgress: true,
    gatewayUrl: "http://gw",
  });

  assert.equal(model.variant, "hub");
  assert.equal(model.kicker, "城市外世界页");
  assert.equal(model.title, "发消息到 世界大厅");
  assert.equal(model.note, "这里就是当前会话的输入框，Enter 发送，Shift+Enter 换行。");
  assert.deepEqual(model.chips, [
    { text: "群聊", tone: "muted" },
    { text: "同步中", tone: "warm" },
    { text: "4 条未读", tone: "warm" },
  ]);
});

// ====== composerPlaceholderForState ======

test("composerPlaceholderForState: sending state wins", serial, () => {
  assert.equal(
    composerPlaceholderForState({ isSendingMessage: true }),
    "正在发送消息...",
  );
});

test("composerPlaceholderForState: gateway unavailable and login required", serial, () => {
  assert.equal(
    composerPlaceholderForState({ gatewayUnavailable: true }),
    "连接离线，等待同步恢复",
  );
  assert.equal(
    composerPlaceholderForState({ loginRequired: true }),
    "请先登录后发送",
  );
});

test("composerPlaceholderForState: direct room compact copy", serial, () => {
  assert.equal(
    composerPlaceholderForState({
      room: { id: "dm:a:b", participant_label: "阿初" },
      roomKind: "direct",
      roomDisplayPeer: "阿初",
      compactChatShell: true,
      composerAvailability: { canLiveSend: true },
      gatewayUrl: "http://gw",
    }),
    "发消息给 阿初",
  );
});

test("composerPlaceholderForState: public room noncompact copy", serial, () => {
  assert.equal(
    composerPlaceholderForState({
      room: { id: "room:world:lobby" },
      roomKind: "public",
      roomThreadHeadline: "世界大厅",
      compactChatShell: false,
      composerAvailability: { canLiveSend: true },
      gatewayUrl: "http://gw",
    }),
    "在 世界大厅 里说点什么",
  );
});

test("composerPlaceholderForState: local fallback suffix and hub override", serial, () => {
  assert.equal(
    composerPlaceholderForState({
      room: { id: "room:world:lobby" },
      roomKind: "public",
      roomThreadHeadline: "世界大厅",
      compactChatShell: true,
      composerAvailability: { canLiveSend: false },
      gatewayUrl: "",
    }),
    "发到 世界大厅（会先进入本地时间线）",
  );
  assert.equal(
    composerPlaceholderForState({
      room: { id: "room:world:lobby" },
      roomKind: "public",
      shellPage: "hub",
      composerAvailability: { canLiveSend: false },
      gatewayUrl: "http://gw",
    }),
    "说点什么…",
  );
});

test("composerPlaceholderForState: editing overrides previous copy", serial, () => {
  assert.equal(
    composerPlaceholderForState({
      room: { id: "room:world:lobby", participant_label: "大厅" },
      roomKind: "system",
      composerAvailability: { canLiveSend: true },
      editingMessage: true,
    }),
    "正在编辑已发送消息",
  );
});

// ====== composerMetaBaseStatus ======

test("composerMetaBaseStatus: 无房间返回先打开会话", serial, () => {
  assert.equal(composerMetaBaseStatus(null, null, false, false), "先打开会话");
});

test("composerMetaBaseStatus: 发送错误", serial, () => {
  assert.equal(composerMetaBaseStatus({ id: "r1" }, "网络错误", false, false), "待修改后重发");
});

test("composerMetaBaseStatus: 发送中", serial, () => {
  assert.equal(composerMetaBaseStatus({ id: "r1" }, null, true, false), "发送中");
});

test("composerMetaBaseStatus: 有草稿", serial, () => {
  assert.equal(composerMetaBaseStatus({ id: "r1" }, null, false, true), "草稿已保存");
});

test("composerMetaBaseStatus: 正常可发送", serial, () => {
  assert.equal(composerMetaBaseStatus({ id: "r1" }, null, false, false), "可直接发送");
});

// ====== composerMetaQuickHint ======

test("composerMetaQuickHint: admin 模式", serial, () => {
  assert.equal(composerMetaQuickHint("admin"), "更多 · 刷新");
});

test("composerMetaQuickHint: 非 admin 模式", serial, () => {
  assert.equal(composerMetaQuickHint("world"), "广场 · 刷新");
  assert.equal(composerMetaQuickHint("user"), "广场 · 刷新");
});

// ====== threadStatusRailModelForState ======

test("threadStatusRailModelForState: user 或空房间隐藏线程状态栏", serial, () => {
  assert.deepEqual(
    threadStatusRailModelForState({ room: null, shellPage: "admin" }),
    { visible: false, items: [] },
  );
  assert.deepEqual(
    threadStatusRailModelForState({ room: { id: "r1" }, shellPage: "user" }),
    { visible: false, items: [] },
  );
});

test("threadStatusRailModelForState: admin 基础项使用注入状态和 tone", serial, () => {
  assert.deepEqual(
    threadStatusRailModelForState({
      room: { id: "r1" },
      shellPage: "admin",
      threadHeadline: "治理大厅",
      chatStatusSummary: "有待同步消息",
      queueSummary: "2 条待处理",
      audienceLabel: "全城居民",
      routeLabel: "城市 / 大厅",
      syncLabel: "同步中",
      sendError: "网络超时",
      pendingEchoCount: 1,
      caretakerPendingCount: 0,
      unreadCount: 3,
      refreshInProgress: true,
      isSendingMessage: false,
    }),
    {
      visible: true,
      items: [
        { label: "线程", value: "治理大厅", tone: "muted" },
        { label: "聊天状态", value: "有待同步消息", tone: "danger" },
        { label: "队列", value: "2 条待处理", tone: "warm" },
        { label: "后台对象", value: "全城居民", tone: "accent" },
        { label: "路由", value: "城市 / 大厅", tone: "danger" },
        { label: "同步", value: "同步中", tone: "warm" },
        { label: "输入", value: "待重发", tone: "danger" },
      ],
    },
  );
});

test("threadStatusRailModelForState: 追加草稿和管家提醒项", serial, () => {
  const model = threadStatusRailModelForState({
    room: { id: "r1" },
    shellPage: "hub",
    threadHeadline: "世界大厅",
    chatStatusSummary: "实时",
    queueSummary: "无待处理",
    audienceLabel: "群聊",
    routeLabel: "公共频道",
    syncLabel: "已同步",
    draftLength: 12,
    caretaker: { name: "小管家", role_label: "房间管家" },
    caretakerStatus: "在线巡检",
    caretakerPendingCount: 2,
    caretakerNotificationCount: 1,
  });

  assert.equal(model.visible, true);
  assert.deepEqual(model.items.slice(-3), [
    { label: "草稿", value: "12 字", tone: "accent" },
    { label: "房间管家", value: "小管家 · 在线巡检", tone: "warm" },
    { label: "提醒", value: "1 条给主人", tone: "muted" },
  ]);
});

// ====== composerHeroKicker ======

test("composerHeroKicker: admin 页面", serial, () => {
  assert.equal(composerHeroKicker("admin"), "管理后台消息区");
});

test("composerHeroKicker: user 页面", serial, () => {
  assert.equal(composerHeroKicker("user"), "房间内聊天主界面");
});

test("composerHeroKicker: 其他页面", serial, () => {
  assert.equal(composerHeroKicker("world"), "城市外世界页");
});

// ====== composerHeroTitle ======

test("composerHeroTitle: 无房间 user 页", serial, () => {
  assert.equal(composerHeroTitle(null, "user", "", "", ""), "先选房间");
});

test("composerHeroTitle: 无房间 admin 页", serial, () => {
  assert.equal(composerHeroTitle(null, "admin", "", "", ""), "先选会话");
});

test("composerHeroTitle: admin 有房间", serial, () => {
  assert.equal(
    composerHeroTitle({ id: "r1" }, "admin", "测试会话", "", "public"),
    "发消息到 测试会话",
  );
});

test("composerHeroTitle: direct 房间", serial, () => {
  const room = { thread_headline: "", peer_label: "", participant_label: "张三" };
  assert.equal(
    composerHeroTitle(room, "user", "", "李四", "direct"),
    "发消息给 张三",
  );
});

test("composerHeroTitle: direct 房间 fallback 到 displayPeer", serial, () => {
  const room = { thread_headline: "", peer_label: "", participant_label: "" };
  assert.equal(
    composerHeroTitle(room, "user", "", "李四", "direct"),
    "发消息给 李四",
  );
});

test("composerHeroTitle: public 房间", serial, () => {
  assert.equal(
    composerHeroTitle({ id: "r1" }, "user", "大厅", "", "public"),
    "发消息到 大厅",
  );
});

// ====== composerHeroNote ======

test("composerHeroNote: 无房间 admin", serial, () => {
  assert.equal(composerHeroNote(null, "admin"), "先选会话，再把记录和跟进像聊天一样写下。");
});

test("composerHeroNote: 无房间 user", serial, () => {
  assert.equal(composerHeroNote(null, "user"), "先选会话，房间内聊天主界面才会点亮。");
});

test("composerHeroNote: 无房间 world", serial, () => {
  assert.equal(composerHeroNote(null, "world"), "先选会话，再开始发消息。");
});

test("composerHeroNote: 有房间 admin", serial, () => {
  assert.equal(composerHeroNote({ id: "r1" }, "admin"), "这里优先写记录和跟进，手感仍然像聊天一样顺手。");
});

test("composerHeroNote: 有房间 user", serial, () => {
  assert.equal(
    composerHeroNote({ id: "r1" }, "user"),
    "这里就是房间内聊天主界面的输入框，Enter 发送，Shift+Enter 换行。",
  );
});

test("composerHeroNote: 有房间 world", serial, () => {
  assert.equal(
    composerHeroNote({ id: "r1" }, "world"),
    "这里就是当前会话的输入框，Enter 发送，Shift+Enter 换行。",
  );
});

// ====== composerHeroChipsData ======

test("composerHeroChipsData: 无房间 无网关", serial, () => {
  const chips = composerHeroChipsData(null, "admin", "", "", 0, 0, false, "");
  assert.equal(chips.length, 1);
  assert.equal(chips[0].text, "等待网关");
  assert.equal(chips[0].tone, "muted");
});

test("composerHeroChipsData: 无房间 有网关", serial, () => {
  const chips = composerHeroChipsData(null, "admin", "", "", 0, 0, false, "http://gw");
  assert.equal(chips.length, 1);
  assert.equal(chips[0].text, "等待会话");
});

test("composerHeroChipsData: public 房间 admin", serial, () => {
  const chips = composerHeroChipsData({ id: "r1" }, "admin", "public", "同步中", 0, 0, true, "http://gw");
  assert.equal(chips.length, 3);
  assert.equal(chips[0].text, "public");
  assert.equal(chips[0].tone, "muted");
  assert.equal(chips[1].text, "同步中");
  assert.equal(chips[1].tone, "warm");
  assert.equal(chips[2].text, "当前窗口可继续记录");
  assert.equal(chips[2].tone, "muted");
});

test("composerHeroChipsData: direct 房间 admin 有待跟进", serial, () => {
  const chips = composerHeroChipsData({ id: "r1" }, "admin", "direct", "已同步", 3, 0, false, "http://gw");
  assert.equal(chips.length, 3);
  assert.equal(chips[0].text, "direct");
  assert.equal(chips[0].tone, "accent");
  assert.equal(chips[2].text, "3 条待跟进");
  assert.equal(chips[2].tone, "warm");
});

test("composerHeroChipsData: public 房间 user 有未读", serial, () => {
  const chips = composerHeroChipsData({ id: "r1" }, "user", "public", "已同步", 0, 5, false, "http://gw");
  assert.equal(chips.length, 3);
  assert.equal(chips[2].text, "5 条未读");
  assert.equal(chips[2].tone, "warm");
});

test("composerHeroChipsData: public 房间 user 无未读", serial, () => {
  const chips = composerHeroChipsData({ id: "r1" }, "user", "public", "已同步", 0, 0, false, "http://gw");
  assert.equal(chips.length, 3);
  assert.equal(chips[2].text, "当前已读");
  assert.equal(chips[2].tone, "muted");
});

// ====== roomPreview ======

test("roomPreview: structured preview field 优先", serial, () => {
  const room = { preview_text: "预览文本" };
  const result = roomPreview(
    room,
    () => ({ structured: { fields: [{ label: "主题", value: "测试" }] } }),
    () => null,
    (structured) => structured?.fields?.[0]?.value,
  );
  assert.equal(result, "测试");
});

test("roomPreview: preview_text 次优先", serial, () => {
  const room = { preview_text: "  预览文本  " };
  const result = roomPreview(room, () => null, () => null, () => null);
  assert.equal(result, "预览文本");
});

test("roomPreview: 最新消息 fallback", serial, () => {
  const room = {};
  const result = roomPreview(room, () => null, () => ({ text: "最新消息" }), () => null);
  assert.equal(result, "最新消息");
});

test("roomPreview: 完全无内容返回默认文本", serial, () => {
  const room = {};
  const result = roomPreview(room, () => null, () => null, () => null);
  assert.equal(result, "还没有消息，先发第一句吧。");
});

// ====== roomLastActivity ======

test("roomLastActivity: last_activity_label 优先", serial, () => {
  const room = { last_activity_label: "  刚刚  " };
  const result = roomLastActivity(room, () => null);
  assert.equal(result, "刚刚");
});

test("roomLastActivity: pending 消息显示待同步", serial, () => {
  const room = {};
  const result = roomLastActivity(room, () => ({ sender: "user", pending: true, timestamp: "10:00" }));
  assert.equal(result, "user · 待同步");
});

test("roomLastActivity: 最后一条消息 timestamp", serial, () => {
  const room = {};
  const result = roomLastActivity(room, () => ({ sender: "user", pending: false, timestamp: "10:30" }));
  assert.equal(result, "user · 10:30");
});

test("roomLastActivity: 无消息返回暂无消息", serial, () => {
  const room = {};
  const result = roomLastActivity(room, () => null);
  assert.equal(result, "暂无消息");
});
