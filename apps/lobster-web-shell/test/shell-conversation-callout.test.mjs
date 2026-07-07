import { test } from "node:test";
import assert from "node:assert/strict";
import { conversationCalloutModelForState } from "../shell-conversation-callout.js";

const baseDeps = {
  roomThreadHeadline: () => "频道标题",
  roomAudienceLabel: () => "你与 peer",
  roomRouteLabel: () => "城镇频道可发言",
  roomChatStatusSummary: () => "在线",
  roomQueueSummary: () => "0 条待办",
  roomContextSummary: () => "上下文摘要",
  caretakerPendingCount: () => 2,
};

test("user: 有 room+caretaker 生成完整文案", () => {
  const room = { id: "r1" };
  const caretaker = { name: "小狗", auto_reply: "我来接客" };
  const model = conversationCalloutModelForState(room, caretaker, "user", baseDeps);
  assert.equal(model.variant, "user");
  assert.equal(model.title, "房间内聊天主界面");
  assert.equal(model.paragraphs[0].text, "频道标题 · 你与 peer");
  assert.equal(model.paragraphs[1].text, "小狗 在线 · 我来接客");
  assert.match(model.paragraphs[2].text, /我来接客 · 有 2 条访客提醒在排队/);
  assert.equal(model.paragraphs[2].className, "conversation-callout-note");
});

test("user: 无 room 用空态文案", () => {
  const model = conversationCalloutModelForState(null, null, "user", baseDeps);
  assert.match(model.paragraphs[0].text, /先从左侧点一个会话/);
  assert.match(model.paragraphs[1].text, /OpenClaw 小狗管家会在房间里接住访客留言/);
});

test("user: 无 caretaker 用默认 autoReply + pendingVisitors=0", () => {
  const room = { id: "r1" };
  const model = conversationCalloutModelForState(room, null, "user", baseDeps);
  assert.match(model.paragraphs[1].text, /OpenClaw 小狗管家会在房间里接住访客留言/);
  assert.match(model.paragraphs[2].text, /小狗会在房间里自动回复访客。 · 目前没有排队访客/);
});

test("user: caretaker 无 auto_reply 回退默认", () => {
  const room = { id: "r1" };
  const caretaker = { name: "小狗" }; // 无 auto_reply
  const model = conversationCalloutModelForState(room, caretaker, "user", baseDeps);
  assert.match(model.paragraphs[2].text, /小狗会在房间里自动回复访客/);
});

test("user: pendingVisitors=0 用空闲文案", () => {
  const room = { id: "r1" };
  const caretaker = { name: "小狗", auto_reply: "接客" };
  const deps = { ...baseDeps, caretakerPendingCount: () => 0 };
  const model = conversationCalloutModelForState(room, caretaker, "user", deps);
  assert.match(model.paragraphs[2].text, /目前没有排队访客/);
});

test("admin: 有 room 拼装 headline/audience/route + status/queue", () => {
  const room = { id: "r1" };
  const model = conversationCalloutModelForState(room, null, "admin", baseDeps);
  assert.equal(model.variant, "admin");
  assert.equal(model.title, "管理后台");
  assert.equal(model.paragraphs[0].text, "频道标题 · 你与 peer · 城镇频道可发言");
  assert.match(model.paragraphs[1].text, /在线 · 0 条待办/);
  assert.equal(model.paragraphs[1].className, "conversation-callout-note");
});

test("admin: 无 room 用空态文案", () => {
  const model = conversationCalloutModelForState(null, null, "admin", baseDeps);
  assert.match(model.paragraphs[0].text, /先在左边选一个会话/);
  assert.match(model.paragraphs[1].text, /左侧选功能分类，中间处理消息，右侧显示当前对象和工具 · 左侧选功能分类/);
});

test("unified: 有 room 用 headline + contextSummary", () => {
  const room = { id: "r1" };
  const model = conversationCalloutModelForState(room, null, "unified", baseDeps);
  assert.equal(model.variant, "unified");
  assert.equal(model.title, "城市外世界页");
  assert.equal(model.paragraphs[0].text, "频道标题");
  assert.equal(model.paragraphs[1].text, "上下文摘要");
  assert.equal(model.paragraphs[1].className, "conversation-callout-note");
});

test("unified: 无 room 用空态文案", () => {
  const model = conversationCalloutModelForState(null, null, "unified", baseDeps);
  assert.match(model.paragraphs[0].text, /中间保留聊天，边上按顺序摆世界/);
  assert.match(model.paragraphs[1].text, /左侧入口按需展开即可/);
});

test("shellMode 路由：未知 mode 走 unified", () => {
  const model = conversationCalloutModelForState({ id: "r1" }, null, "other", baseDeps);
  assert.equal(model.variant, "unified");
});
