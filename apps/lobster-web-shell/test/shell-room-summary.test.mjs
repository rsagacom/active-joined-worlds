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
