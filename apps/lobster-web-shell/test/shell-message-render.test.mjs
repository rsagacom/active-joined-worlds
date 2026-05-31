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
