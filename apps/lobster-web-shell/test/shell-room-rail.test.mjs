/* ============================================================
   shell-room-rail.test.mjs — shell-room-rail.js 纯函数单元测试
   覆盖：roomKind, badgeToken, roomDisplayPeer, roomThreadHeadline,
   roomActivityTime, latestRoomMessageLike, roomPreview,
   defaultActiveRoomId, roomMatchesSearch, filteredRooms, roomGroupBlueprints
   ============================================================ */

import test from "node:test";
import assert from "node:assert/strict";
import {
  initRail,
  roomKind,
  badgeToken,
  createRoomUnreadBadgeNode,
  roomAvatarSpec,
  roomButtonClassSpec,
  roomEmptyStateSpec,
  roomStatsSpec,
  roomDigestMetricsSpec,
  roomToolbarNoteSpec,
  roomTitleStackSpec,
  roomTopMetaSpec,
  roomDisplayPeer,
  roomThreadHeadline,
  roomAudienceLabel,
  roomMemberCount,
  roomActivityTime,
  latestRoomMessageLike,
  roomPreview,
  roomSummaryLine,
  roomStatusLine,
  unreadCount,
  markRoomRead,
  defaultActiveRoomId,
  roomMatchesSearch,
  filteredRooms,
  roomGroupBlueprints,
} from "../shell-room-rail.js";

const serial = { concurrency: false };

// --- 最小 document 环境 ---
function fakeCreateElement(tag) {
  const el = {
    tagName: tag.toUpperCase(),
    className: "",
    textContent: "",
    dataset: {},
    style: {},
    children: [],
    setAttribute(name, value) { this[name] = value; },
    getAttribute(name) { return this[name] || null; },
    appendChild(c) { this.children.push(c); return c; },
    addEventListener() {},
    removeEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    closest() { return null; },
  };
  return el;
}

function setupMinimalDoc(datasetOverrides = {}) {
  globalThis.document = {
    body: {
      dataset: { ...datasetOverrides },
    },
    createElement: fakeCreateElement,
    createTextNode(text) {
      return { nodeType: 3, textContent: text };
    },
  };
}

// --- initRail mock 工厂 ---
function setupRailMocks(overrides = {}) {
  initRail(
    {
      roomListEl: overrides.roomListEl || null,
      residentListEl: overrides.residentListEl || null,
      roomSearchInputEl: overrides.roomSearchInputEl || null,
      roomToolbarNoteEl: overrides.roomToolbarNoteEl || null,
      roomFilterButtons: overrides.roomFilterButtons || [],
      conversationOverviewEl: overrides.conversationOverviewEl || null,
      roomDigestEl: overrides.roomDigestEl || null,
    },
    {
      getRooms: overrides.getRooms || (() => []),
      getActiveRoomId: overrides.getActiveRoomId || (() => null),
      setActiveRoomId: overrides.setActiveRoomId || (() => {}),
      getRoomFilter: overrides.getRoomFilter || (() => "all"),
      setRoomFilter: overrides.setRoomFilter || (() => {}),
      getRoomSearch: overrides.getRoomSearch || (() => ""),
      setRoomSearch: overrides.setRoomSearch || (() => {}),
      getGatewayUrl: overrides.getGatewayUrl || (() => null),
      getShellPage: overrides.getShellPage || (() => "hub"),
      getCurrentIdentity: overrides.getCurrentIdentity || (() => ""),
      getRoomReadMarkers: overrides.getRoomReadMarkers || (() => ({})),
      persistRoomReadMarkers: overrides.persistRoomReadMarkers || (() => {}),
      onRoomFocused: overrides.onRoomFocused || (() => {}),
      onRoomsRendered: overrides.onRoomsRendered || (() => {}),
      createLine: overrides.createLine || ((label, text) => ({ className: label, textContent: text })),
      createPill: overrides.createPill || ((label, tone) => ({ textContent: label, className: `pill pill-${tone}` })),
      clearChildren: overrides.clearChildren || (() => {}),
      translateRoomKind: overrides.translateRoomKind || ((k) => k),
      translateRoomKindForShellPage: overrides.translateRoomKindForShellPage || ((k) => k),
      roomHasDraft: overrides.roomHasDraft || (() => false),
      visiblePendingEchoCount: overrides.visiblePendingEchoCount || (() => 0),
      roomSyncLabel: overrides.roomSyncLabel || (() => "已同步"),
      latestRoomQuickAction: overrides.latestRoomQuickAction || (() => ""),
      roomQuickActionSummary: overrides.roomQuickActionSummary || (() => ""),
      resolveRoomQuickPreview: overrides.resolveRoomQuickPreview || (() => null),
      createRoomQuickActionPill: overrides.createRoomQuickActionPill || (() => null),
      createRoomQuickPreviewPill: overrides.createRoomQuickPreviewPill || (() => null),
      createRoomInlineActions: overrides.createRoomInlineActions || (() => null),
      ensureRoomQuickActions: overrides.ensureRoomQuickActions || (() => {}),
      caretakerProfile: overrides.caretakerProfile || (() => null),
      caretakerPendingCount: overrides.caretakerPendingCount || (() => 0),
      roomSendErrors: overrides.roomSendErrors || (() => ({})),
      visiblePendingEchoesForRoom: overrides.visiblePendingEchoesForRoom || (() => []),
      quickActionPreviewPrimaryFieldText: overrides.quickActionPreviewPrimaryFieldText || (() => ""),
      joinOrFallback: overrides.joinOrFallback || ((items, fb) => items && items.length ? items.join("、") : fb),
      roomRouteLabel: overrides.roomRouteLabel || (() => ""),
      roomLastActivity: overrides.roomLastActivity || (() => ""),
    },
  );
}

// ====== roomKind ======

test("roomKind: dm 前缀识别为 direct", serial, () => {
  assert.equal(roomKind({ id: "dm:alice" }), "direct");
  assert.equal(roomKind({ id: "dm:alice:bob" }), "direct");
});

test("roomKind: room 前缀识别为 public", serial, () => {
  assert.equal(roomKind({ id: "room:world:lobby" }), "public");
  assert.equal(roomKind({ id: "room:tech" }), "public");
});

test("roomKind: 其他识别为 system", serial, () => {
  assert.equal(roomKind({ id: "system:sync" }), "system");
  assert.equal(roomKind({ id: "alert:001" }), "system");
});

test("roomKind: null/undefined 返回 system", serial, () => {
  assert.equal(roomKind(null), "system");
  assert.equal(roomKind(undefined), "system");
  assert.equal(roomKind({}), "system");
});

// ====== badgeToken ======

test("badgeToken: 正常文字取前 2 字符大写", serial, () => {
  assert.equal(badgeToken("爱丽丝"), "爱丽");
  assert.equal(badgeToken("Bob"), "BO");
});

test("badgeToken: 去除私信前缀后取 token", serial, () => {
  assert.equal(badgeToken("私信 · 鲍勃"), "鲍勃");
});

test("badgeToken: 去除 # @ 前缀", serial, () => {
  assert.equal(badgeToken("#频道"), "频道");
  assert.equal(badgeToken("@用户"), "用户");
});

test("badgeToken: 空值返回 fallback", serial, () => {
  assert.equal(badgeToken(""), "聊");
  assert.equal(badgeToken(null, "居"), "居");
  assert.equal(badgeToken(undefined, "城"), "城");
});

test("badgeToken: 默认 fallback 为 聊", serial, () => {
  assert.equal(badgeToken(""), "聊");
});

// ====== roomDisplayPeer ======

test("roomDisplayPeer: peer_label 优先使用", serial, () => {
  setupRailMocks();
  assert.equal(
    roomDisplayPeer({ peer_label: "爱丽丝" }),
    "爱丽丝",
  );
});

test("roomDisplayPeer: participant_label 去除 你与/与 前缀", serial, () => {
  setupRailMocks();
  assert.equal(
    roomDisplayPeer({ participant_label: "你与鲍勃" }),
    "鲍勃",
  );
  assert.equal(
    roomDisplayPeer({ participant_label: "与查理" }),
    "查理",
  );
});

test("roomDisplayPeer: title 含私信前缀时去除", serial, () => {
  setupRailMocks();
  assert.equal(
    roomDisplayPeer({ title: "私信 · 大卫" }),
    "大卫",
  );
  assert.equal(
    roomDisplayPeer({ title: "dm · 伊芙" }),
    "伊芙",
  );
});

test("roomDisplayPeer: dm room id 提取对方身份", serial, () => {
  setupRailMocks({ getCurrentIdentity: () => "我自己" });
  assert.equal(
    roomDisplayPeer({ id: "dm:我自己:爱丽丝" }),
    "爱丽丝",
  );
});

test("roomDisplayPeer: dm room id 提取失败时使用 subtitle 或 fallback", serial, () => {
  setupRailMocks();
  // dm id 中提取对方优先于 subtitle
  assert.equal(
    roomDisplayPeer({ id: "dm:unknown" }),
    "unknown",
  );
  // subtitle 仅对非 dm room 生效
  assert.equal(
    roomDisplayPeer({ id: "system:sync", subtitle: "系统通知" }),
    "系统通知",
  );
  assert.equal(
    roomDisplayPeer(null),
    "私聊对象",
  );
});

test("roomDisplayPeer: participant_label 不含前缀时原样使用", serial, () => {
  setupRailMocks();
  assert.equal(
    roomDisplayPeer({ participant_label: "查理" }),
    "查理",
  );
});

// ====== roomThreadHeadline ======

test("roomThreadHeadline: thread_headline 优先", serial, () => {
  setupRailMocks();
  assert.equal(
    roomThreadHeadline({ thread_headline: "最新消息摘要" }),
    "最新消息摘要",
  );
});

test("roomThreadHeadline: 其次使用 title", serial, () => {
  setupRailMocks();
  assert.equal(
    roomThreadHeadline({ title: "主城大厅" }),
    "主城大厅",
  );
});

test("roomThreadHeadline: hub 模式 direct 房间显示 正在与", serial, () => {
  setupRailMocks({ getShellPage: () => "hub" });
  const room = { id: "dm:alice", peer_label: "爱丽丝" };
  assert.ok(roomThreadHeadline(room).includes("爱丽丝"));
});

test("roomThreadHeadline: hub 模式 public 无标题房间显示群聊", serial, () => {
  setupRailMocks({ getShellPage: () => "hub" });
  const room = { id: "room:lobby", member_count: 5 };
  const line = roomThreadHeadline(room);
  assert.ok(line.includes("群聊"), `expected 群聊 in "${line}"`);
});

test("roomThreadHeadline: user 模式 direct 房间显示 正在和", serial, () => {
  setupRailMocks({ getShellPage: () => "user" });
  const room = { id: "dm:alice", peer_label: "爱丽丝" };
  assert.ok(roomThreadHeadline(room).includes("爱丽丝"));
});

test("roomThreadHeadline: user 模式 public 无标题房间显示城镇里", serial, () => {
  setupRailMocks({ getShellPage: () => "user" });
  const room = { id: "room:lobby", member_count: 5 };
  const line = roomThreadHeadline(room);
  assert.ok(line.includes("城镇里"), `expected 城镇里 in "${line}"`);
});

test("roomThreadHeadline: null room 返回 会话未打开", serial, () => {
  setupRailMocks();
  assert.equal(roomThreadHeadline(null), "会话未打开");
});

// ====== roomAudienceLabel ======

test("roomAudienceLabel: direct 房间使用 participant_label", serial, () => {
  setupRailMocks();
  assert.equal(
    roomAudienceLabel({ id: "dm:alice", participant_label: "爱丽丝" }),
    "爱丽丝",
  );
});

test("roomAudienceLabel: public 房间显示成员数", serial, () => {
  setupRailMocks();
  const label = roomAudienceLabel({ id: "room:lobby", member_count: 24 });
  assert.ok(label.includes("24"), `expected 24 in "${label}"`);
});

test("roomAudienceLabel: 无成员数的 public 房间 fallback", serial, () => {
  setupRailMocks();
  assert.equal(
    roomAudienceLabel({ id: "room:lobby" }),
    "群聊成员",
  );
});

test("roomAudienceLabel: system 房间标识", serial, () => {
  setupRailMocks();
  assert.equal(
    roomAudienceLabel({ id: "system:sync" }),
    "系统频道",
  );
});

test("roomAudienceLabel: null room 返回未选会话", serial, () => {
  setupRailMocks();
  assert.equal(roomAudienceLabel(null), "未选会话");
});

// ====== roomMemberCount ======

test("roomMemberCount: 显式 member_count 直接使用", serial, () => {
  setupRailMocks();
  assert.equal(roomMemberCount({ member_count: 42 }), 42);
});

test("roomMemberCount: messages 去重 sender 计算人数", serial, () => {
  setupRailMocks({ getCurrentIdentity: () => "alice" });
  const room = {
    messages: [
      { sender: "alice" },
      { sender: "bob" },
      { sender: "bob" },
      { sender: "charlie" },
    ],
  };
  assert.equal(roomMemberCount(room), 3);
});

test("roomMemberCount: direct 默认 2 人", serial, () => {
  setupRailMocks();
  assert.equal(roomMemberCount({ id: "dm:alice" }), 2);
});

test("roomMemberCount: 其他类型默认 1 人", serial, () => {
  setupRailMocks();
  assert.equal(roomMemberCount({ id: "room:empty" }), 1);
});

// ====== roomActivityTime ======

test("roomActivityTime: activity_time_label 优先", serial, () => {
  assert.equal(
    roomActivityTime({ activity_time_label: "刚刚" }),
    "刚刚",
  );
});

test("roomActivityTime: pending 消息显示待同步", serial, () => {
  const room = { messages: [{ pending: true, text: "hello" }] };
  assert.equal(roomActivityTime(room), "待同步");
});

test("roomActivityTime: 最后一条消息 timestamp", serial, () => {
  const room = { messages: [{ timestamp: "10:30", text: "hi" }] };
  assert.equal(roomActivityTime(room), "10:30");
});

test("roomActivityTime: 无消息返回暂无消息", serial, () => {
  assert.equal(roomActivityTime({}), "暂无消息");
  assert.equal(roomActivityTime(null), "暂无消息");
});

// ====== latestRoomMessageLike ======

test("latestRoomMessageLike: 有 pending echo 时与 committed 合并", serial, () => {
  const room = { messages: [{ text: "committed" }] };
  setupRailMocks({
    visiblePendingEchoesForRoom: () => [{ text: "pending echo" }],
  });
  const result = latestRoomMessageLike(room);
  assert.equal(result.text, "pending echo");
});

test("latestRoomMessageLike: 无 pending 时返回最后 committed", serial, () => {
  setupRailMocks({
    visiblePendingEchoesForRoom: () => [],
  });
  const room = { messages: [{ text: "first" }, { text: "second" }] };
  const result = latestRoomMessageLike(room);
  assert.equal(result.text, "second");
});

test("latestRoomMessageLike: 无消息返回 null", serial, () => {
  setupRailMocks();
  assert.equal(latestRoomMessageLike(null), null);
  assert.equal(latestRoomMessageLike({ messages: [] }), null);
});

// ====== roomPreview ======

test("roomPreview: structured quick preview 优先", serial, () => {
  setupRailMocks({
    resolveRoomQuickPreview: () => ({ structured: { type: "image", alt: "图片预览" } }),
    quickActionPreviewPrimaryFieldText: (s) => s.alt,
  });
  assert.equal(roomPreview({}), "图片预览");
});

test("roomPreview: preview_text 次优先", serial, () => {
  setupRailMocks({ resolveRoomQuickPreview: () => null });
  assert.equal(
    roomPreview({ preview_text: "最后一条消息预览" }),
    "最后一条消息预览",
  );
});

test("roomPreview: 最后 fallback 到最新消息", serial, () => {
  setupRailMocks({ resolveRoomQuickPreview: () => null });
  const room = { messages: [{ text: "你好世界" }] };
  assert.equal(roomPreview(room), "你好世界");
});

test("roomPreview: 完全无内容时返回默认文本", serial, () => {
  setupRailMocks({ resolveRoomQuickPreview: () => null });
  const result = roomPreview({});
  assert.ok(result.includes("还没有消息"), `expected fallback, got "${result}"`);
});

// ====== roomSummaryLine ======

test("roomSummaryLine: list_summary 优先", serial, () => {
  setupRailMocks();
  assert.equal(
    roomSummaryLine({ list_summary: "3 条未读 · 爱丽丝最后发言" }),
    "3 条未读 · 爱丽丝最后发言",
  );
});

test("roomSummaryLine: 拼接 kind / 人数 / 消息数", serial, () => {
  setupRailMocks({
    translateRoomKindForShellPage: (k) => (k === "direct" ? "私信" : k),
  });
  const room = { id: "dm:alice", kind_hint: "私人对话", messages: [{ text: "hi" }] };
  const result = roomSummaryLine(room);
  assert.ok(result.includes("2 人"), `expected 2 人 in "${result}"`);
  assert.ok(result.includes("1 条消息"), `expected 1 条消息 in "${result}"`);
});

test("roomSummaryLine: null room 返回未选择聊天", serial, () => {
  setupRailMocks();
  assert.equal(roomSummaryLine(null), "未选择聊天");
});

// ====== roomStatusLine ======

test("roomStatusLine: status_line 优先", serial, () => {
  setupRailMocks();
  assert.equal(
    roomStatusLine({ status_line: "爱丽丝正在输入…" }),
    "爱丽丝正在输入…",
  );
});

test("roomStatusLine: null room 返回等待新消息", serial, () => {
  setupRailMocks();
  assert.equal(roomStatusLine(null), "等待新消息");
});

// ====== unreadCount ======

test("unreadCount: 根据 read marker 计算未读", serial, () => {
  setupRailMocks({
    getRoomReadMarkers: () => ({ "dm:alice": 3 }),
  });
  const room = { id: "dm:alice", messages: [{}, {}, {}, {}, {}] };
  assert.equal(unreadCount(room), 2);
});

test("unreadCount: 无 marker 时全部未读", serial, () => {
  setupRailMocks({ getRoomReadMarkers: () => ({}) });
  const room = { id: "dm:alice", messages: [{}, {}, {}] };
  assert.equal(unreadCount(room), 3);
});

test("unreadCount: 全部已读时返回 0", serial, () => {
  setupRailMocks({
    getRoomReadMarkers: () => ({ "dm:alice": 5 }),
  });
  const room = { id: "dm:alice", messages: [{}, {}, {}, {}, {}] };
  assert.equal(unreadCount(room), 0);
});

// ====== markRoomRead ======

test("markRoomRead: 将 marker 更新为当前消息数", serial, () => {
  const markers = {};
  setupRailMocks({
    getRooms: () => [{ id: "dm:alice", messages: [{}, {}, {}] }],
    getRoomReadMarkers: () => markers,
    persistRoomReadMarkers: () => { markers._persisted = true; },
  });
  markRoomRead("dm:alice");
  assert.equal(markers["dm:alice"], 3);
  assert.equal(markers._persisted, true);
});

test("markRoomRead: room 不存在时不操作", serial, () => {
  const markers = { "dm:alice": 2 };
  setupRailMocks({
    getRooms: () => [],
    getRoomReadMarkers: () => markers,
    persistRoomReadMarkers: () => {},
  });
  markRoomRead("dm:nonexistent");
  assert.equal(markers["dm:nonexistent"], undefined);
});

// ====== defaultActiveRoomId ======

test("defaultActiveRoomId: 优先 document.body.dataset.defaultRoomId", serial, () => {
  setupMinimalDoc({ defaultRoomId: "dm:fav" });
  const rooms = [{ id: "dm:fav" }, { id: "room:lobby" }];
  assert.equal(defaultActiveRoomId(rooms), "dm:fav");
});

test("defaultActiveRoomId: creative-terminal 默认 direct", serial, () => {
  setupMinimalDoc({ shellVariant: "creative-terminal" });
  const rooms = [{ id: "room:lobby" }, { id: "dm:alice" }];
  assert.equal(defaultActiveRoomId(rooms), "dm:alice");
});

test("defaultActiveRoomId: creative-terminal 无 direct 时 fallback 首个", serial, () => {
  setupMinimalDoc({ shellVariant: "creative-terminal" });
  const rooms = [{ id: "room:lobby" }];
  assert.equal(defaultActiveRoomId(rooms), "room:lobby");
});

test("defaultActiveRoomId: public-square 优先 room:world:lobby", serial, () => {
  setupMinimalDoc({ shellVariant: "public-square" });
  const rooms = [
    { id: "dm:alice" },
    { id: "room:world:lobby" },
    { id: "room:other" },
  ];
  assert.equal(defaultActiveRoomId(rooms), "room:world:lobby");
});

test("defaultActiveRoomId: public-square 其次第一个 public", serial, () => {
  setupMinimalDoc({ shellVariant: "public-square" });
  const rooms = [{ id: "dm:alice" }, { id: "room:tech" }];
  assert.equal(defaultActiveRoomId(rooms), "room:tech");
});

test("defaultActiveRoomId: 其他 shellVariant 返回首个", serial, () => {
  setupMinimalDoc({ shellVariant: "hub" });
  const rooms = [{ id: "dm:first" }, { id: "room:second" }];
  assert.equal(defaultActiveRoomId(rooms), "dm:first");
});

test("defaultActiveRoomId: 空数组返回 null", serial, () => {
  setupMinimalDoc({});
  assert.equal(defaultActiveRoomId([]), null);
});

// ====== roomMatchesSearch ======

test("roomMatchesSearch: 空查询匹配全部", serial, () => {
  assert.equal(roomMatchesSearch({ id: "dm:alice" }, ""), true);
  assert.equal(roomMatchesSearch({ id: "dm:alice" }, null), true);
});

test("roomMatchesSearch: 匹配 room.id", serial, () => {
  assert.equal(roomMatchesSearch({ id: "dm:alice" }, "alice"), true);
});

test("roomMatchesSearch: 匹配 title 和 subtitle", serial, () => {
  assert.equal(
    roomMatchesSearch({ title: "主城大厅", subtitle: "欢迎来到龙虾城" }, "龙虾"),
    true,
  );
  assert.equal(
    roomMatchesSearch({ title: "主城大厅", subtitle: "欢迎来到龙虾城" }, "主城"),
    true,
  );
});

test("roomMatchesSearch: 匹配 thread_headline 和 preview_text", serial, () => {
  const room = {
    thread_headline: "鲍勃: 大家好",
    preview_text: "最后一条消息是关于龙虾的",
  };
  assert.equal(roomMatchesSearch(room, "鲍勃"), true);
  assert.equal(roomMatchesSearch(room, "龙虾"), true);
});

test("roomMatchesSearch: 匹配 kind_hint / meta / list_summary", serial, () => {
  const room = { kind_hint: "私人对话", meta: "高优先级", list_summary: "3条新消息" };
  assert.equal(roomMatchesSearch(room, "私人"), true);
  assert.equal(roomMatchesSearch(room, "高优先级"), true);
  assert.equal(roomMatchesSearch(room, "新消息"), true);
});

test("roomMatchesSearch: 匹配 stage_projection 字段", serial, () => {
  const room = {
    stage_projection: { title: "审核阶段", summary: "等待城主审批", badge: "进行中" },
  };
  assert.equal(roomMatchesSearch(room, "审核阶段"), true);
  assert.equal(roomMatchesSearch(room, "城主审批"), true);
  assert.equal(roomMatchesSearch(room, "进行中"), true);
});

test("roomMatchesSearch: 匹配 portrait_projection 字段", serial, () => {
  const room = {
    portrait_projection: { title: "爱丽丝", summary: "活跃居民", badge: "VIP", status: "在线" },
  };
  assert.equal(roomMatchesSearch(room, "爱丽丝"), true);
  assert.equal(roomMatchesSearch(room, "活跃"), true);
  assert.equal(roomMatchesSearch(room, "VIP"), true);
  assert.equal(roomMatchesSearch(room, "在线"), true);
});

test("roomMatchesSearch: 匹配 workflow 字段", serial, () => {
  const room = {
    workflow: { summary: "审批流程", steps: [{ label: "第一步", copy: "提交申请" }] },
  };
  assert.equal(roomMatchesSearch(room, "审批流程"), true);
  assert.equal(roomMatchesSearch(room, "第一步"), true);
  assert.equal(roomMatchesSearch(room, "提交申请"), true);
});

test("roomMatchesSearch: 匹配 inline_actions 字段", serial, () => {
  const room = {
    inline_actions: [{ label: "批准", action: "approve", next_state: "已通过" }],
  };
  assert.equal(roomMatchesSearch(room, "批准"), true);
  assert.equal(roomMatchesSearch(room, "approve"), true);
  assert.equal(roomMatchesSearch(room, "已通过"), true);
});

test("roomMatchesSearch: 匹配 detail_card.meta", serial, () => {
  const room = {
    detail_card: { meta: [{ label: "创建者", value: "城主大人" }] },
  };
  assert.equal(roomMatchesSearch(room, "创建者"), true);
  assert.equal(roomMatchesSearch(room, "城主大人"), true);
});

test("roomMatchesSearch: 匹配 scene_banner", serial, () => {
  assert.equal(
    roomMatchesSearch({ scene_banner: "欢迎周" }, "欢迎"),
    true,
  );
});

test("roomMatchesSearch: 不匹配时返回 false", serial, () => {
  assert.equal(
    roomMatchesSearch({ id: "room:lobby", title: "大厅" }, "xyznotfound"),
    false,
  );
});

test("roomMatchesSearch: 大小写不敏感", serial, () => {
  assert.equal(roomMatchesSearch({ title: "Hello World" }, "hello"), true);
  assert.equal(roomMatchesSearch({ title: "你好世界" }, "你好"), true);
});

// ====== filteredRooms ======

test("filteredRooms: all filter 返回所有", serial, () => {
  const rooms = [
    { id: "dm:alice" },
    { id: "room:lobby" },
    { id: "system:sync" },
  ];
  assert.equal(filteredRooms(rooms, "all", "").length, 3);
});

test("filteredRooms: direct filter 只返回 direct", serial, () => {
  const rooms = [
    { id: "dm:alice" },
    { id: "room:lobby" },
    { id: "dm:bob" },
  ];
  const result = filteredRooms(rooms, "direct", "");
  assert.equal(result.length, 2);
  assert.ok(result.every((r) => r.id.startsWith("dm:")));
});

test("filteredRooms: public filter 只返回 public", serial, () => {
  const rooms = [
    { id: "dm:alice" },
    { id: "room:lobby" },
    { id: "room:tech" },
  ];
  const result = filteredRooms(rooms, "public", "");
  assert.equal(result.length, 2);
  assert.ok(result.every((r) => r.id.startsWith("room:")));
});

test("filteredRooms: filter 与 search 组合", serial, () => {
  const rooms = [
    { id: "dm:alice", title: "爱丽丝" },
    { id: "dm:bob", title: "鲍勃" },
    { id: "room:lobby", title: "大厅" },
  ];
  const result = filteredRooms(rooms, "direct", "爱丽丝");
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "dm:alice");
});

// ====== roomGroupBlueprints ======

test("roomGroupBlueprints: hub 模式三组 group", serial, () => {
  const rooms = [
    { id: "dm:alice", messages: [{ text: "hi" }] },
    { id: "room:lobby", messages: [{ text: "hello" }] },
    { id: "system:sync", messages: [] },
  ];
  const result = roomGroupBlueprints("hub", rooms, null, {}, () => false, () => 0);
  assert.equal(result.length, 3);
  assert.equal(result[0].kind, "direct");
  assert.equal(result[0].title, "私信");
  assert.equal(result[1].kind, "public");
  assert.equal(result[1].title, "频道");
  assert.equal(result[2].kind, "system");
  assert.equal(result[2].title, "通知");
});

test("roomGroupBlueprints: admin 模式标题", serial, () => {
  const rooms = [
    { id: "dm:alice", messages: [{ text: "hi" }] },
    { id: "room:lobby", messages: [] },
    { id: "system:sync", messages: [] },
  ];
  const result = roomGroupBlueprints("admin", rooms, null, {}, () => false, () => 0);
  assert.equal(result[0].title, "待跟进会话");
  assert.equal(result[1].title, "后台频道");
  assert.equal(result[2].title, "系统提示");
});

test("roomGroupBlueprints: user 模式标题", serial, () => {
  const rooms = [
    { id: "dm:alice", messages: [{ text: "hi" }] },
    { id: "room:lobby", messages: [] },
    { id: "system:sync", messages: [] },
  ];
  const result = roomGroupBlueprints("user", rooms, null, {}, () => false, () => 0);
  assert.equal(result[0].title, "居民私信");
  assert.equal(result[1].title, "城镇频道");
  assert.equal(result[2].title, "城门消息");
});

test("roomGroupBlueprints: active room 排最前", serial, () => {
  const rooms = [
    { id: "dm:alice" },
    { id: "dm:bob" },
    { id: "dm:charlie" },
  ];
  const result = roomGroupBlueprints("hub", rooms, "dm:bob", {}, () => false, () => 0);
  assert.equal(result.length, 1);
  assert.equal(result[0].rooms[0].id, "dm:bob");
});

test("roomGroupBlueprints: send error 优先级高于 draft", serial, () => {
  const rooms = [
    { id: "dm:alice" },
    { id: "dm:bob" },
  ];
  const result = roomGroupBlueprints(
    "hub", rooms, null,
    { "dm:bob": "send failed" },
    (id) => id === "dm:alice",
    () => 0,
  );
  assert.equal(result[0].rooms[0].id, "dm:bob");
});

test("roomGroupBlueprints: 空 group 被过滤", serial, () => {
  const rooms = [
    { id: "room:lobby", messages: [{ text: "hi" }] },
  ];
  const result = roomGroupBlueprints("hub", rooms, null, {}, () => false, () => 0);
  assert.equal(result.length, 1);
  assert.equal(result[0].kind, "public");
});

test("roomGroupBlueprints: 无 rooms 时返回空数组", serial, () => {
  const result = roomGroupBlueprints("hub", [], null, {}, () => false, () => 0);
  assert.equal(result.length, 0);
});

// ====== createRoomUnreadBadgeNode ======

test("createRoomUnreadBadgeNode: unread 1 返回 badge，文本为 1", serial, () => {
  setupMinimalDoc();
  const badge = createRoomUnreadBadgeNode(1);
  assert.ok(badge, "应返回 badge 元素");
  assert.equal(badge.className, "room-unread-badge");
  assert.equal(badge.textContent, "1");
});

test("createRoomUnreadBadgeNode: unread 99 返回 99", serial, () => {
  setupMinimalDoc();
  const badge = createRoomUnreadBadgeNode(99);
  assert.equal(badge.textContent, "99");
});

test("createRoomUnreadBadgeNode: unread 100 返回 99+", serial, () => {
  setupMinimalDoc();
  const badge = createRoomUnreadBadgeNode(100);
  assert.equal(badge.textContent, "99+");
});

test("createRoomUnreadBadgeNode: unread 0 返回 null", serial, () => {
  setupMinimalDoc();
  assert.equal(createRoomUnreadBadgeNode(0), null);
});

test("createRoomUnreadBadgeNode: unread 负数返回 null", serial, () => {
  setupMinimalDoc();
  assert.equal(createRoomUnreadBadgeNode(-1), null);
  assert.equal(createRoomUnreadBadgeNode(-100), null);
});

test("createRoomUnreadBadgeNode: aria-label 正确", serial, () => {
  setupMinimalDoc();
  const badge = createRoomUnreadBadgeNode(42);
  assert.equal(badge.getAttribute("aria-label"), "42 条未读消息");
});

test("createRoomUnreadBadgeNode: 非数字返回 null", serial, () => {
  setupMinimalDoc();
  assert.equal(createRoomUnreadBadgeNode(null), null);
  assert.equal(createRoomUnreadBadgeNode(undefined), null);
  assert.equal(createRoomUnreadBadgeNode("abc"), null);
});

// ====== roomAvatarSpec ======

test("roomAvatarSpec: user 模式 direct 居民头像 spec", serial, () => {
  const room = { id: "dm:alice", participant_label: "爱丽丝" };
  const spec = roomAvatarSpec({ room, kind: "direct", shellPage: "user", headline: "爱丽丝的私信" });
  assert.equal(spec.text, "爱丽");
  assert.equal(spec.className, "room-avatar room-avatar-direct");
  assert.equal(spec.isResidentRoomEntry, true);
  assert.ok(spec.title.includes("爱丽丝的私信"), `title 应包含 headline, got "${spec.title}"`);
  assert.ok(spec.ariaLabel.includes("爱丽丝的私信"), `ariaLabel 应包含 headline`);
});

test("roomAvatarSpec: user 模式 public 头像 spec", serial, () => {
  const spec = roomAvatarSpec({ room: { id: "room:lobby" }, kind: "public", shellPage: "user", headline: "大厅" });
  assert.equal(spec.text, "城");
  assert.equal(spec.className, "room-avatar room-avatar-public");
  assert.equal(spec.isResidentRoomEntry, false);
  assert.equal(spec.title, "");
  assert.equal(spec.ariaLabel, "");
});

test("roomAvatarSpec: user 模式 system 头像 spec", serial, () => {
  const spec = roomAvatarSpec({ room: { id: "system:sync" }, kind: "system", shellPage: "user", headline: "同步通知" });
  assert.equal(spec.text, "门");
  assert.equal(spec.className, "room-avatar room-avatar-system");
  assert.equal(spec.isResidentRoomEntry, false);
});

test("roomAvatarSpec: hub 模式头像文案（私/群/通）", serial, () => {
  assert.equal(roomAvatarSpec({ room: {}, kind: "direct", shellPage: "hub", headline: "" }).text, "私");
  assert.equal(roomAvatarSpec({ room: {}, kind: "public", shellPage: "hub", headline: "" }).text, "群");
  assert.equal(roomAvatarSpec({ room: {}, kind: "system", shellPage: "hub", headline: "" }).text, "通");
});

test("roomAvatarSpec: admin 模式头像文案（私/群/通）", serial, () => {
  assert.equal(roomAvatarSpec({ room: {}, kind: "direct", shellPage: "admin", headline: "" }).text, "私");
  assert.equal(roomAvatarSpec({ room: {}, kind: "public", shellPage: "admin", headline: "" }).text, "群");
  assert.equal(roomAvatarSpec({ room: {}, kind: "system", shellPage: "admin", headline: "" }).text, "通");
});

test("roomAvatarSpec: hub/admin 模式 isResidentRoomEntry 始终 false", serial, () => {
  for (const shellPage of ["hub", "admin"]) {
    for (const kind of ["direct", "public", "system"]) {
      const spec = roomAvatarSpec({ room: {}, kind, shellPage, headline: "" });
      assert.equal(spec.isResidentRoomEntry, false, `${shellPage}/${kind} 不应是居民入口`);
      assert.equal(spec.title, "");
      assert.equal(spec.ariaLabel, "");
    }
  }
});

test("roomAvatarSpec: 缺失 participant_label 时 fallback 到 headline", serial, () => {
  const spec = roomAvatarSpec({
    room: { id: "dm:bob" },
    kind: "direct",
    shellPage: "user",
    headline: "鲍勃的聊天",
  });
  assert.equal(spec.text, "鲍勃");
  assert.equal(spec.isResidentRoomEntry, true);
});

test("roomAvatarSpec: 缺失 headline 空字符串 fallback", serial, () => {
  const spec = roomAvatarSpec({
    room: { id: "dm:unknown" },
    kind: "direct",
    shellPage: "user",
    headline: "",
  });
  // badgeToken("" || "", "居") → "居"
  assert.equal(spec.text, "居");
});

test("roomAvatarSpec: null room 安全 fallback", serial, () => {
  const spec = roomAvatarSpec({ room: null, kind: "direct", shellPage: "user", headline: "测试" });
  assert.equal(spec.text, "测试");
  assert.equal(spec.isResidentRoomEntry, false);
  assert.equal(spec.title, "");
});

test("roomAvatarSpec: null room 不标记为 resident room entry", serial, () => {
  // 即使 shellPage=user 且 kind=direct，room 为 null 时也不应该标记为可进入
  const spec = roomAvatarSpec({ room: null, kind: "direct", shellPage: "user", headline: "" });
  assert.equal(spec.isResidentRoomEntry, false);
});

test("roomAvatarSpec: room 无 id 时不标记为 resident room entry", serial, () => {
  // room 对象存在但没有 id 属性 — 保护无 room.id 也标记可进入居民房间
  const spec = roomAvatarSpec({ room: { title: "幽灵房间" }, kind: "direct", shellPage: "user", headline: "测试" });
  assert.equal(spec.isResidentRoomEntry, false);
});

// ====== roomButtonClassSpec ======

test("roomButtonClassSpec: active room 添加 active class", serial, () => {
  const spec = roomButtonClassSpec({ roomId: "dm:alice", activeRoomId: "dm:alice", unread: 5, kind: "direct" });
  assert.ok(spec.className.includes(" active"), "active room 应有 active class");
  assert.ok(!spec.className.includes("room-button-unread"), "active room 不应有 unread class");
  assert.equal(spec.isActive, true);
  assert.equal(spec.hasUnread, false);
  assert.equal(spec.datasetKind, "direct");
});

test("roomButtonClassSpec: 非 active 但有 unread", serial, () => {
  const spec = roomButtonClassSpec({ roomId: "dm:bob", activeRoomId: "dm:alice", unread: 3, kind: "direct" });
  assert.ok(!spec.className.includes(" active"), "非 active room 不应有 active class");
  assert.ok(spec.className.includes("room-button-unread"), "有 unread 应包含 unread class");
  assert.equal(spec.isActive, false);
  assert.equal(spec.hasUnread, true);
});

test("roomButtonClassSpec: 非 active 且无 unread", serial, () => {
  const spec = roomButtonClassSpec({ roomId: "dm:bob", activeRoomId: "dm:alice", unread: 0, kind: "public" });
  assert.equal(spec.className, "room-button");
  assert.equal(spec.isActive, false);
  assert.equal(spec.hasUnread, false);
});

test("roomButtonClassSpec: unread 为 0 时不标记", serial, () => {
  const spec = roomButtonClassSpec({ roomId: "dm:alice", activeRoomId: "dm:bob", unread: 0, kind: "system" });
  assert.ok(!spec.className.includes("room-button-unread"));
  assert.equal(spec.datasetKind, "system");
});

test("roomButtonClassSpec: unread 为 Infinity 时不误标记未读", serial, () => {
  const spec = roomButtonClassSpec({ roomId: "dm:alice", activeRoomId: "dm:bob", unread: Infinity, kind: "direct" });
  assert.equal(spec.hasUnread, false);
  assert.ok(!spec.className.includes("room-button-unread"));
});

test("roomButtonClassSpec: unread 为 NaN 时不误标记未读", serial, () => {
  const spec = roomButtonClassSpec({ roomId: "dm:alice", activeRoomId: "dm:bob", unread: NaN, kind: "direct" });
  assert.equal(spec.hasUnread, false);
});

test("roomButtonClassSpec: unread 为 undefined 时不误标记未读", serial, () => {
  const spec = roomButtonClassSpec({ roomId: "dm:alice", activeRoomId: "dm:bob", unread: undefined, kind: "direct" });
  assert.equal(spec.hasUnread, false);
});

test("roomButtonClassSpec: unread 为负数时不标记", serial, () => {
  const spec = roomButtonClassSpec({ roomId: "dm:alice", activeRoomId: "dm:bob", unread: -3, kind: "direct" });
  assert.equal(spec.hasUnread, false);
});

// ====== roomTitleStackSpec ======

test("roomTitleStackSpec: 使用内置 roomAudienceLabel 作为 kicker", serial, () => {
  setupRailMocks();
  const room = { id: "dm:alice", thread_headline: "爱丽丝的问候", participant_label: "爱丽丝" };
  const spec = roomTitleStackSpec(room);
  assert.equal(spec.name, "爱丽丝的问候");
  assert.equal(spec.kicker, "爱丽丝");
});

test("roomTitleStackSpec: 显式传入 kicker 覆盖内置值", serial, () => {
  setupRailMocks();
  const room = { id: "room:lobby", title: "主城大厅", member_count: 24 };
  const spec = roomTitleStackSpec(room, "龙虾城 · 中心广场");
  assert.equal(spec.name, "主城大厅");
  assert.equal(spec.kicker, "龙虾城 · 中心广场");
});

test("roomTitleStackSpec: system 房间返回系统频道", serial, () => {
  setupRailMocks();
  const room = { id: "system:sync" };
  const spec = roomTitleStackSpec(room);
  assert.equal(spec.name, "系统会话");
  assert.equal(spec.kicker, "系统频道");
});

test("roomTitleStackSpec: null room 安全 fallback", serial, () => {
  setupRailMocks();
  const spec = roomTitleStackSpec(null);
  assert.equal(spec.name, "会话未打开");
  assert.equal(spec.kicker, "未选会话");
});

// ====== roomTopMetaSpec ======

test("roomTopMetaSpec: active direct room in hub shell", serial, () => {
  setupRailMocks();
  const room = { id: "dm:alice", activity_time_label: "刚刚" };
  const spec = roomTopMetaSpec({
    room, kind: "direct", kindPillLabel: "私信",
    activeRoomId: "dm:alice", unread: 0, shellPage: "hub",
  });
  assert.equal(spec.activityLine, "刚刚");
  assert.equal(spec.kindPill.label, "私信");
  assert.equal(spec.kindPill.tone, "accent");
  assert.ok(spec.statusPill, "active room 应有 status pill");
  assert.equal(spec.statusPill.label, "当前");
  assert.equal(spec.statusPill.tone, "accent");
});

test("roomTopMetaSpec: inactive public room with unread", serial, () => {
  setupRailMocks();
  const room = { id: "room:lobby", activity_time_label: "5 分钟前" };
  const spec = roomTopMetaSpec({
    room, kind: "public", kindPillLabel: "公共频道",
    activeRoomId: "dm:alice", unread: 7, shellPage: "hub",
  });
  assert.equal(spec.activityLine, "5 分钟前");
  assert.equal(spec.kindPill.tone, "muted");
  assert.ok(spec.statusPill);
  assert.equal(spec.statusPill.label, "7 未读");
  assert.equal(spec.statusPill.tone, "warm");
});

test("roomTopMetaSpec: inactive room with no unread has null statusPill", serial, () => {
  setupRailMocks();
  const room = { id: "system:sync", activity_time_label: "1 小时前" };
  const spec = roomTopMetaSpec({
    room, kind: "system", kindPillLabel: "系统",
    activeRoomId: "dm:alice", unread: 0, shellPage: "hub",
  });
  assert.equal(spec.statusPill, null);
});

test("roomTopMetaSpec: admin shell active 显示 后台中", serial, () => {
  setupRailMocks();
  const spec = roomTopMetaSpec({
    room: { id: "dm:alice" }, kind: "direct", kindPillLabel: "私信",
    activeRoomId: "dm:alice", unread: 0, shellPage: "admin",
  });
  assert.equal(spec.statusPill.label, "后台中");
});

test("roomTopMetaSpec: user shell active 显示 聊天中", serial, () => {
  setupRailMocks();
  const spec = roomTopMetaSpec({
    room: { id: "dm:alice" }, kind: "direct", kindPillLabel: "居民私信",
    activeRoomId: "dm:alice", unread: 0, shellPage: "user",
  });
  assert.equal(spec.statusPill.label, "聊天中");
});

test("roomTopMetaSpec: null room 安全 fallback", serial, () => {
  setupRailMocks();
  const spec = roomTopMetaSpec({
    room: null, kind: "direct", kindPillLabel: "私信",
    activeRoomId: "x", unread: 0, shellPage: "hub",
  });
  assert.equal(spec.activityLine, "暂无消息");
});

test("roomTopMetaSpec: unread 为 Infinity 时不误显示未读", serial, () => {
  const spec = roomTopMetaSpec({
    room: { id: "dm:alice" }, kind: "direct", kindPillLabel: "私信",
    activeRoomId: "dm:bob", unread: Infinity, shellPage: "hub",
  });
  assert.equal(spec.statusPill, null);
});

test("roomTopMetaSpec: unread 为 NaN 时不显示 statusPill", serial, () => {
  const spec = roomTopMetaSpec({
    room: { id: "dm:alice" }, kind: "direct", kindPillLabel: "私信",
    activeRoomId: "dm:bob", unread: NaN, shellPage: "hub",
  });
  assert.equal(spec.statusPill, null);
});

test("roomTopMetaSpec: unread 为负数时不显示 statusPill", serial, () => {
  const spec = roomTopMetaSpec({
    room: { id: "dm:alice" }, kind: "direct", kindPillLabel: "私信",
    activeRoomId: "dm:bob", unread: -5, shellPage: "hub",
  });
  assert.equal(spec.statusPill, null);
});

// ====== roomStatsSpec ======

test("roomStatsSpec: 空数组返回零统计", serial, () => {
  const stats = roomStatsSpec([], [], () => false, () => 0, () => 0, {});
  assert.equal(stats.unreadTotal, 0);
  assert.equal(stats.draftTotal, 0);
  assert.equal(stats.followUpTotal, 0);
  assert.equal(stats.directCount, 0);
  assert.equal(stats.publicCount, 0);
});

test("roomStatsSpec: 正确计算未读和草稿", serial, () => {
  const rooms = [
    { id: "dm:alice", messages: [{}, {}, {}] },
    { id: "room:lobby", messages: [{}, {}] },
  ];
  const stats = roomStatsSpec(
    rooms,
    rooms,
    () => false,
    (room) => room.messages.length,
    () => 0,
    {},
  );
  assert.equal(stats.unreadTotal, 5);
  assert.equal(stats.draftTotal, 0);
  assert.equal(stats.directCount, 1);
  assert.equal(stats.publicCount, 1);
});

test("roomStatsSpec: 正确计算 followUpTotal", serial, () => {
  const rooms = [
    { id: "dm:alice" },
    { id: "dm:bob" },
    { id: "room:lobby" },
  ];
  const stats = roomStatsSpec(
    rooms,
    rooms,
    (id) => id === "dm:alice",
    () => 0,
    () => 0,
    { "dm:bob": "send failed" },
  );
  assert.equal(stats.followUpTotal, 2);
});

test("roomStatsSpec: pending echo 计入 followUp", serial, () => {
  const rooms = [{ id: "dm:alice" }];
  const stats = roomStatsSpec(
    rooms,
    rooms,
    () => false,
    () => 0,
    (room) => room.id === "dm:alice" ? 1 : 0,
    {},
  );
  assert.equal(stats.followUpTotal, 1);
});

test("roomStatsSpec: unread 计入 followUp", serial, () => {
  const rooms = [{ id: "dm:alice" }];
  const stats = roomStatsSpec(
    rooms,
    rooms,
    () => false,
    () => 3,
    () => 0,
    {},
  );
  assert.equal(stats.followUpTotal, 1);
});

test("roomStatsSpec: 过滤后房间与全部房间分离统计", serial, () => {
  const allRooms = [
    { id: "dm:alice" },
    { id: "dm:bob" },
    { id: "room:lobby" },
  ];
  const filtered = [{ id: "dm:alice" }];
  const stats = roomStatsSpec(
    filtered,
    allRooms,
    () => false,
    () => 1,
    () => 0,
    {},
  );
  assert.equal(stats.unreadTotal, 3);
  assert.equal(stats.directCount, 1);
  assert.equal(stats.publicCount, 0);
});

test("roomDigestMetricsSpec: 聚合会话摘要指标并保持类型安全", serial, () => {
  const metrics = roomDigestMetricsSpec([
    { id: "dm:alice", kind: "direct" },
    { id: "room:town", kind: "public" },
    { id: "system:notice", kind: "system" },
  ], {
    roomKind: (room) => room.kind,
    unreadCount: (room) => room.id === "dm:alice" ? 2 : 0,
    roomHasDraft: (roomId) => roomId === "room:town",
    roomFollowUpCount: (room) => room.id === "room:town" ? 1 : 0,
    caretakerPendingCount: (room) => room.id === "dm:alice" ? 2 : 0,
    caretakerNotificationCount: (room) => room.id === "system:notice" ? 3 : 0,
  });

  assert.deepEqual(metrics, {
    activeRoom: null,
    directCount: 1,
    publicCount: 1,
    systemCount: 1,
    unreadTotal: 2,
    draftTotal: 1,
    followUpCount: 1,
    caretakerQueue: 2,
    notificationTotal: 3,
  });
});

// ====== roomEmptyStateSpec ======

test("roomEmptyStateSpec: 有 gatewayUrl 返回搜索提示", serial, () => {
  const text = roomEmptyStateSpec("http://127.0.0.1:8787");
  assert.ok(text.includes("切换筛选"));
  assert.ok(text.includes("清空搜索"));
});

test("roomEmptyStateSpec: 无 gatewayUrl 返回离线提示", serial, () => {
  const text = roomEmptyStateSpec("");
  assert.ok(text.includes("离线样例数据"));
});

test("roomEmptyStateSpec: null gatewayUrl 返回离线提示", serial, () => {
  const text = roomEmptyStateSpec(null);
  assert.ok(text.includes("离线样例数据"));
});

// ====== roomToolbarNoteSpec ======

const baseStats = { followUpTotal: 0, directCount: 1, publicCount: 2, unreadTotal: 0, draftTotal: 0 };

function callRoomToolbarNoteSpec(overrides = {}) {
  return roomToolbarNoteSpec({
    shellPage: "hub",
    visibleCount: 3,
    totalCount: 5,
    roomFilter: "all",
    roomSearch: "",
    stats: baseStats,
    activeVisible: true,
    activeRoomId: null,
    syncLabel: "已同步",
    roomKindLabel: "私信",
    ...overrides,
  });
}

test("roomToolbarNoteSpec: 默认 hub 页面返回基础信息", serial, () => {
  const pieces = callRoomToolbarNoteSpec();
  assert.ok(pieces[0].includes("已同步"));
  assert.ok(pieces[0].includes("展示 3 / 5 个会话"));
  assert.ok(pieces[1].includes("私信 1"));
  assert.ok(pieces[1].includes("频道 2"));
});

test("roomToolbarNoteSpec: admin 页面返回后台文案", serial, () => {
  const pieces = callRoomToolbarNoteSpec({ shellPage: "admin", visibleCount: 4, totalCount: 6 });
  assert.ok(pieces[0].includes("后台 4 / 6 个窗口"));
  assert.ok(pieces[1].includes("待跟进 0"));
});

test("roomToolbarNoteSpec: 有筛选时追加筛选文案", serial, () => {
  const pieces = callRoomToolbarNoteSpec({ roomFilter: "direct", roomKindLabel: "私信" });
  assert.ok(pieces.some((p) => p.includes("筛选：私信")));
});

test("roomToolbarNoteSpec: 有搜索时追加搜索文案", serial, () => {
  const pieces = callRoomToolbarNoteSpec({ roomSearch: "test" });
  assert.ok(pieces.some((p) => p.includes("搜索：test")));
});

test("roomToolbarNoteSpec: 有未读时追加未读文案", serial, () => {
  const pieces = callRoomToolbarNoteSpec({ stats: { ...baseStats, unreadTotal: 5 } });
  assert.ok(pieces.some((p) => p.includes("总未读 5")));
});

test("roomToolbarNoteSpec: 有草稿时追加草稿文案", serial, () => {
  const pieces = callRoomToolbarNoteSpec({ stats: { ...baseStats, draftTotal: 2 } });
  assert.ok(pieces.some((p) => p.includes("草稿 2")));
});

test("roomToolbarNoteSpec: activeVisible 为 false 且 activeRoomId 存在时追加隐藏提示", serial, () => {
  const pieces = callRoomToolbarNoteSpec({ activeVisible: false, activeRoomId: "room:test" });
  assert.ok(pieces.some((p) => p.includes("当前会话被筛选隐藏")));
});

test("roomToolbarNoteSpec: activeVisible 为 false 但无 activeRoomId 时不追加隐藏提示", serial, () => {
  const pieces = callRoomToolbarNoteSpec({ activeVisible: false, activeRoomId: null });
  assert.ok(!pieces.some((p) => p.includes("当前会话被筛选隐藏")));
});

test("roomToolbarNoteSpec: 组合条件全部出现", serial, () => {
  const pieces = callRoomToolbarNoteSpec({
    shellPage: "admin",
    roomFilter: "public",
    roomSearch: "lobby",
    stats: { followUpTotal: 3, directCount: 1, publicCount: 4, unreadTotal: 7, draftTotal: 2 },
    activeVisible: false,
    activeRoomId: "room:x",
    roomKindLabel: "群聊",
  });
  assert.ok(pieces.some((p) => p.includes("后台")));
  assert.ok(pieces.some((p) => p.includes("待跟进 3")));
  assert.ok(pieces.some((p) => p.includes("筛选：群聊")));
  assert.ok(pieces.some((p) => p.includes("搜索：lobby")));
  assert.ok(pieces.some((p) => p.includes("总未读 7")));
  assert.ok(pieces.some((p) => p.includes("草稿 2")));
  assert.ok(pieces.some((p) => p.includes("当前会话被筛选隐藏")));
});
