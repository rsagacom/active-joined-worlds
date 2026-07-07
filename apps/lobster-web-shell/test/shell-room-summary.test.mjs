/* ============================================================
   shell-room-summary.test.mjs — 房间状态摘要纯函数测试
   roomQueueSummaryForState / roomChatStatusSummaryForState /
   roomFollowUpCountForState 从 app.js 提取，deps 注入 room-state 读取，
   脱离全局即可单测。
   ============================================================ */

import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const modUrl = new URL("../shell-room-summary.js", import.meta.url);
const mod = await import(pathToFileURL(modUrl.pathname).href);
const {
  roomQueueSummaryForState,
  roomChatStatusSummaryForState,
  roomFollowUpCountForState,
  roomSummaryLineForState,
  roomStatusLineForState,
  roomOwnershipForState,
  roomHostLabelForState,
} = mod;

// 默认 deps：所有状态为零/空
function deps(over = {}) {
  return {
    unreadCount: () => 0,
    caretakerPendingCount: () => 0,
    roomHasDraft: () => false,
    visiblePendingEchoCount: () => 0,
    roomSendError: () => "",
    latestRoomQuickAction: () => "",
    latestRoomQuickState: () => "",
    shellPage: "admin",
    roomKind: () => "public",
    roomMemberCount: () => 1,
    roomQuickActionSummary: () => "",
    roomRouteLabel: () => "房间标签",
    resolveRoomQuickPreview: () => null,
    roomQuickPreviewFieldView: () => null,
    roomLastActivity: () => "暂无消息",
    ...over,
  };
}

// ====== roomFollowUpCount ======

test("followUpCount: null room 返回 0", () => {
  assert.equal(roomFollowUpCountForState(null, deps()), 0);
});

test("followUpCount: 全空状态返回 0", () => {
  assert.equal(roomFollowUpCountForState({ id: "r1" }, deps()), 0);
});

test("followUpCount: 每个状态各贡献 1", () => {
  const d = deps({
    unreadCount: () => 3,
    roomHasDraft: () => true,
    visiblePendingEchoCount: () => 2,
    roomSendError: () => "err",
    caretakerPendingCount: () => 1,
  });
  assert.equal(roomFollowUpCountForState({ id: "r1" }, d), 5);
});

test("followUpCount: unreadCount=0 不计数（>0 才算）", () => {
  const d = deps({ unreadCount: () => 0, roomHasDraft: () => true });
  assert.equal(roomFollowUpCountForState({ id: "r1" }, d), 1);
});

// ====== roomQueueSummary ======

test("queueSummary: null room 返回等待提示", () => {
  assert.equal(roomQueueSummaryForState(null, deps()), "等待新的后台窗口");
});

test("queueSummary: 全空状态返回清爽提示", () => {
  assert.equal(roomQueueSummaryForState({ id: "r1" }, deps()), "窗口清爽，可继续巡视或记录");
});

test("queueSummary: 有未读+草稿时拼接条目", () => {
  const d = deps({ unreadCount: () => 2, roomHasDraft: () => true });
  assert.equal(roomQueueSummaryForState({ id: "r1" }, d), "2 条新动态 · 有待发记录");
});

test("queueSummary: 全部 5 种状态都出现时按序拼接", () => {
  const d = deps({
    caretakerPendingCount: () => 1,
    unreadCount: () => 2,
    roomHasDraft: () => true,
    visiblePendingEchoCount: () => 3,
    roomSendError: () => "err",
  });
  assert.equal(
    roomQueueSummaryForState({ id: "r1" }, d),
    "1 条访客提醒 · 2 条新动态 · 有待发记录 · 消息待同步 · 发送失败待复核",
  );
});

test("queueSummary: 无状态但有 queue_summary 字段时用字段值", () => {
  const room = { id: "r1", queue_summary: "  自定义摘要  " };
  assert.equal(roomQueueSummaryForState(room, deps()), "自定义摘要");
});

test("queueSummary: 状态优先于 queue_summary 字段", () => {
  const room = { id: "r1", queue_summary: "自定义" };
  const d = deps({ unreadCount: () => 1 });
  assert.equal(roomQueueSummaryForState(room, d), "1 条新动态");
});

// ====== roomChatStatusSummary ======

test("chatStatus: null room 返回等待新消息", () => {
  assert.equal(roomChatStatusSummaryForState(null, deps()), "等待新消息");
});

test("chatStatus: 发送错误优先", () => {
  const d = deps({ roomSendError: () => "err", unreadCount: () => 5, roomHasDraft: () => true });
  assert.equal(roomChatStatusSummaryForState({ id: "r1" }, d), "这条聊天有消息待重发");
});

test("chatStatus: 待同步优先于草稿", () => {
  const d = deps({ visiblePendingEchoCount: () => 1, roomHasDraft: () => true });
  assert.equal(roomChatStatusSummaryForState({ id: "r1" }, d), "这条聊天有消息待同步");
});

test("chatStatus: 草稿状态", () => {
  const d = deps({ roomHasDraft: () => true });
  assert.equal(roomChatStatusSummaryForState({ id: "r1" }, d), "草稿已存在当前会话");
});

test("chatStatus: 未读消息数", () => {
  const d = deps({ unreadCount: () => 3 });
  assert.equal(roomChatStatusSummaryForState({ id: "r1" }, d), "有 3 条新消息待看");
});

test("chatStatus: 无状态时 user+direct 返回可直接继续说", () => {
  const d = deps({ shellPage: "user", roomKind: () => "direct" });
  assert.equal(roomChatStatusSummaryForState({ id: "r1" }, d), "可以直接继续说");
});

test("chatStatus: 无状态时 user+public 返回城镇里还算安静", () => {
  const d = deps({ shellPage: "user", roomKind: () => "public" });
  assert.equal(roomChatStatusSummaryForState({ id: "r1" }, d), "城镇里还算安静");
});

test("chatStatus: 无状态时 admin+direct 返回可直接继续回复", () => {
  const d = deps({ shellPage: "admin", roomKind: () => "direct" });
  assert.equal(roomChatStatusSummaryForState({ id: "r1" }, d), "可直接继续回复");
});

test("chatStatus: 无状态时 admin+public 返回群聊当前比较安静", () => {
  const d = deps({ shellPage: "admin", roomKind: () => "public" });
  assert.equal(roomChatStatusSummaryForState({ id: "r1" }, d), "群聊当前比较安静");
});

test("chatStatus: 有 chat_status_summary 字段优先于 shellPage 回退", () => {
  const room = { id: "r1", chat_status_summary: "  自定义状态  " };
  assert.equal(roomChatStatusSummaryForState(room, deps()), "自定义状态");
});

// ====== roomSummaryLine ======

test("summaryLine: null room 返回未选择聊天", () => {
  assert.equal(roomSummaryLineForState(null, deps()), "未选择聊天");
});

test("summaryLine: list_summary 字段优先", () => {
  assert.equal(roomSummaryLineForState({ id: "r1", list_summary: "  自定义摘要  " }, deps()), "自定义摘要");
});

test("summaryLine: public 房间拼接 kind+人数+消息数", () => {
  const d = deps({ roomKind: () => "public", roomMemberCount: () => 5 });
  const room = { id: "r1", messages: [{}, {}, {}] };
  // admin 页 public kind -> "公共频道"
  assert.equal(roomSummaryLineForState(room, d), "公共频道、5 人、3 条消息");
});

test("summaryLine: system 房间不拼人数", () => {
  const d = deps({ roomKind: () => "system" });
  const room = { id: "sys", messages: [{}] };
  // admin 页 system kind -> "系统通知"
  assert.equal(roomSummaryLineForState(room, d), "系统通知、1 条消息");
});

test("summaryLine: 有 quickActionSummary 时拼入", () => {
  const d = deps({ roomKind: () => "public", roomMemberCount: () => 2, roomQuickActionSummary: () => "委托进行中" });
  const room = { id: "r1", messages: [{}] };
  assert.equal(roomSummaryLineForState(room, d), "公共频道、2 人、1 条消息、委托进行中");
});

test("summaryLine: kind_hint 优先于 translateRoomKindForShellPage", () => {
  const d = deps({ roomKind: () => "public", roomMemberCount: () => 1 });
  const room = { id: "r1", kind_hint: "自定义类型" };
  assert.equal(roomSummaryLineForState(room, d), "自定义类型、1 人");
});

test("summaryLine: 空消息无 quickAction 时 parts 非空直接 join", () => {
  const d = deps({ roomKind: () => "public", roomMemberCount: () => 1 });
  const room = { id: "r1", preview_text: "预览文本" };
  // parts = ["公共频道", "1 人"]，非空 -> join，不走 fallback
  assert.equal(roomSummaryLineForState(room, d), "公共频道、1 人");
});

test("summaryLine: user 页 direct kind 翻译为居民私信", () => {
  const d = deps({ shellPage: "user", roomKind: () => "direct", roomMemberCount: () => 2 });
  const room = { id: "dm:a:b", messages: [{}] };
  assert.equal(roomSummaryLineForState(room, d), "居民私信、2 人、1 条消息");
});

// ====== roomStatusLine ======
// 注：quickActionFollowUpLabel / quickActionPreviewFieldViewLabel 是直接 import 的
// 真实函数，单测里无法 mock，故此处只覆盖 null / status_line / meta / lastActivity
// 等独立分支，避开依赖 quickAction 返回值的精确断言。followUp/preview 分支由
// shell-room-rail.test.mjs 的接线测试（调 app.js 包装器）间接覆盖。

test("statusLine: null room 返回等待新消息", () => {
  assert.equal(roomStatusLineForState(null, deps()), "等待新消息");
});

test("statusLine: status_line 字段优先", () => {
  assert.equal(
    roomStatusLineForState({ id: "r1", status_line: "  爱丽丝正在输入…  " }, deps()),
    "爱丽丝正在输入…",
  );
});

test("statusLine: roomRouteLabel 值出现在结果中", () => {
  const d = deps({ roomRouteLabel: () => "【自定义标签】" });
  const result = roomStatusLineForState({ id: "r1" }, d);
  assert.ok(result.includes("【自定义标签】"), `expected roomRouteLabel in "${result}"`);
});

test("statusLine: meta 拼入结果", () => {
  const room = { id: "r1", meta: "备注信息" };
  const result = roomStatusLineForState(room, deps());
  assert.ok(result.includes("备注信息"), `expected meta in "${result}"`);
});

test("statusLine: lastActivity 非'暂无消息'拼入", () => {
  const d = deps({ roomLastActivity: () => "刚刚活跃" });
  const result = roomStatusLineForState({ id: "r1" }, d);
  assert.ok(result.includes("刚刚活跃"), `expected lastActivity in "${result}"`);
});

test("statusLine: lastActivity='暂无消息' 不拼入", () => {
  const d = deps({ roomLastActivity: () => "暂无消息" });
  const result = roomStatusLineForState({ id: "r1" }, d);
  assert.ok(!result.includes("暂无消息"), `expected no 暂无消息 in "${result}"`);
});

// ====== roomOwnership / roomHostLabel（私宅主客视角） ======

test("ownership: null room 返回空", () => {
  assert.equal(roomOwnershipForState(null, "alice"), "");
});

test("ownership: 无 owner_resident_id（双方DM/公共）返回空", () => {
  assert.equal(roomOwnershipForState({ id: "dm:alice:bob" }, "alice"), "");
  assert.equal(roomOwnershipForState({ id: "room:world:lobby" }, "alice"), "");
});

test("ownership: 未登录（访客）返回空", () => {
  assert.equal(roomOwnershipForState({ owner_resident_id: "alice" }, "访客"), "");
});

test("ownership: identity 为空返回空", () => {
  assert.equal(roomOwnershipForState({ owner_resident_id: "alice" }, ""), "");
});

test("ownership: owner === identity → own（我的私宅）", () => {
  assert.equal(roomOwnershipForState({ owner_resident_id: "alice" }, "alice"), "own");
});

test("ownership: owner 存在且 ≠ identity → visitor（别人的私宅）", () => {
  assert.equal(roomOwnershipForState({ owner_resident_id: "bob" }, "alice"), "visitor");
});

test("hostLabel: peer_label 优先", () => {
  assert.equal(roomHostLabelForState({ peer_label: "波波", participant_label: "你与波波" }), "波波");
});

test("hostLabel: peer_label 空时降级 participant_label", () => {
  assert.equal(roomHostLabelForState({ participant_label: "你与波波" }), "你与波波");
});

test("hostLabel: peer/participant 都空时降级 owner_resident_id（personal_room 主人）", () => {
  assert.equal(roomHostLabelForState({ owner_resident_id: "builder" }), "builder");
});

test("hostLabel: 全空返回空字符串", () => {
  assert.equal(roomHostLabelForState({ id: "dm:bob:carol" }), "");
  assert.equal(roomHostLabelForState(null), "");
});
