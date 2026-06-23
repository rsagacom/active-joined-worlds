/* ============================================================
   shell-message-body.test.mjs — 消息体 DOM spec 构造纯函数测试
   messageBodyDomSpec(message, options) 返回纯数据 spec 树
   { tag, className, dataset, text, children }，app.js 负责落地 DOM。
   覆盖：撤回/屏蔽终态、普通文本、结构化 quick-sheet（fields/notes/follow-up）、
        quick-action chip dataset/intensity、空消息。
   ============================================================ */

import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const modUrl = new URL("../shell-message-body.js", import.meta.url);
const mod = await import(pathToFileURL(modUrl.pathname).href);
const { messageBodyDomSpec } = mod;

// ---- 终态 ----

test("撤回消息返回 recalled 终态 spec", () => {
  const spec = messageBodyDomSpec({ is_recalled: true, text: "原内容" });
  assert.match(spec.className, /message-body-recalled/);
  assert.equal(spec.text, "消息已撤回");
  assert.equal(spec.children, undefined);
});

test("被屏蔽消息返回 blocked 终态 spec", () => {
  const spec = messageBodyDomSpec({ moderation_status: "blocked", text: "x" });
  assert.match(spec.className, /message-body-recalled/);
  assert.equal(spec.text, "消息已屏蔽");
});

test("终态优先于结构化/普通文本", () => {
  const spec = messageBodyDomSpec({ is_recalled: true, quick_action: "report", text: "x" });
  assert.equal(spec.text, "消息已撤回");
});

// ---- 普通文本 ----

test("无 quick_action 的普通文本返回 message-body + text", () => {
  const spec = messageBodyDomSpec({ text: "你好" });
  assert.equal(spec.tag, "div");
  assert.equal(spec.className, "message-body");
  assert.equal(spec.text, "你好");
  assert.equal(spec.children, undefined);
});

test("空消息文本为空串不崩", () => {
  const spec = messageBodyDomSpec({});
  assert.equal(spec.text, undefined);
});

// ---- quick_action dataset/intensity ----

test("有 quick_action 时 body 带 dataset.quickAction + actionIntensity", () => {
  const spec = messageBodyDomSpec({ text: "hi", quick_action: "整理" });
  assert.equal(spec.dataset.quickAction, "整理");
  assert.ok(spec.dataset.actionIntensity, "应有 actionIntensity");
});

// ---- 结构化 quick-sheet ----

test("结构化消息含 quick-sheet 子节点 + fields 行", () => {
  // parseStructuredQuickActionMessage: headline 须等于 action，fields 用 ---key:value 格式
  const msg = {
    text: "report\n---地点: A区\n---事件: 异常",
    quick_action: "report",
  };
  const spec = messageBodyDomSpec(msg);
  assert.match(spec.className, /message-body-structured/);
  assert.ok(Array.isArray(spec.children), "结构化应有 children");
  const sheet = spec.children.find((c) => c.className === "message-quick-sheet");
  assert.ok(sheet, "应有 message-quick-sheet 子节点");
  const rows = sheet.children.filter((c) => c.className === "message-quick-sheet-row");
  assert.ok(rows.length >= 2, "应有 2 个 field 行");
});

test("结构化消息无 notes 时不挂 notes 节点", () => {
  const msg = { text: "report\n---地点: A区", quick_action: "report" };
  const spec = messageBodyDomSpec(msg);
  const sheet = spec.children.find((c) => c.className === "message-quick-sheet");
  const notes = sheet.children.find((c) => /notes/.test(c.className));
  assert.equal(notes, undefined, "无 notes 时不挂 notes 节点");
});

test("结构化消息带 notes 时挂 notes 节点", () => {
  // fields 后的非 --- 行落入 notes
  const msg = { text: "report\n---地点: A区\n备注1\n备注2", quick_action: "report" };
  const spec = messageBodyDomSpec(msg);
  const sheet = spec.children.find((c) => c.className === "message-quick-sheet");
  const notes = sheet.children.find((c) => /message-quick-sheet-notes/.test(c.className));
  assert.ok(notes, "有 notes 时应挂 notes 节点");
});

// ---- follow-up ----

test("结构化消息带 quickState 时可能挂 follow-up 节点", () => {
  // follow-up 依赖 quickActionFollowUpLabel/Copy 对该 action+state 是否有文案
  const spec = messageBodyDomSpec(
    { text: "report\n---地点: A区", quick_action: "report" },
    { quickState: "resolved" },
  );
  const sheet = spec.children.find((c) => c.className === "message-quick-sheet");
  const followUp = sheet.children.find((c) => /message-quick-sheet-follow-up$/.test(c.className));
  // 不强制存在（取决于 label/copy 是否有值），但若存在应是 div
  if (followUp) {
    assert.equal(followUp.tag, "div");
  }
});

// ---- spec 树结构完整性 ----

test("spec 节点结构字段合法（tag/className/dataset/text/children）", () => {
  const spec = messageBodyDomSpec({ text: "x", quick_action: "report" });
  assert.equal(typeof spec.tag, "string");
  assert.equal(typeof spec.className, "string");
  if (spec.dataset) assert.equal(typeof spec.dataset, "object");
});

test("结构化 sheet 子节点都是合法 spec（无裸字符串/DOM 节点）", () => {
  const spec = messageBodyDomSpec({ text: "report\n---地点: A区\n---事件: B", quick_action: "report" });
  const sheet = spec.children.find((c) => c.className === "message-quick-sheet");
  for (const child of sheet.children) {
    assert.equal(typeof child, "object");
    assert.equal(typeof child.tag, "string");
    assert.equal(typeof child.className, "string");
  }
});
