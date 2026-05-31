// shell-quick-action-templates.test.mjs — quickAction 模板常量与 workflow 模板单元测试
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  QUICK_ACTION_BLUEPRINTS,
  QUICK_ACTION_INLINE_FIELD_PRIORITY,
  QUICK_ACTION_INLINE_STATE_FIELD_PRIORITY,
  quickActionWorkflowTemplate,
} from "../shell-quick-action-templates.js";

// ====== QUICK_ACTION_BLUEPRINTS ======

test("QUICK_ACTION_BLUEPRINTS: 六个 action 有模板", () => {
  const actions = ["续聊", "私聊", "整理", "留条", "委托", "交易"];
  for (const action of actions) {
    const bp = QUICK_ACTION_BLUEPRINTS[action];
    assert.ok(bp, action + " 应有 blueprint");
    assert.ok(typeof bp.template === "string" && bp.template.length > 0, action + " 模板应非空");
  }
});

test("QUICK_ACTION_BLUEPRINTS: 整理模板包含结构字段", () => {
  assert.ok(QUICK_ACTION_BLUEPRINTS["整理"].template.includes("目标"));
  assert.ok(QUICK_ACTION_BLUEPRINTS["整理"].template.includes("待办"));
});

test("QUICK_ACTION_BLUEPRINTS: 交易模板包含结构字段", () => {
  assert.ok(QUICK_ACTION_BLUEPRINTS["交易"].template.includes("标的"));
  assert.ok(QUICK_ACTION_BLUEPRINTS["交易"].template.includes("数量"));
});

// ====== QUICK_ACTION_INLINE_FIELD_PRIORITY ======

test("QUICK_ACTION_INLINE_FIELD_PRIORITY: 四个结构化 action 有字段优先级", () => {
  for (const action of ["整理", "留条", "委托", "交易"]) {
    const fields = QUICK_ACTION_INLINE_FIELD_PRIORITY[action];
    assert.ok(Array.isArray(fields) && fields.length >= 2, action + " 应有至少 2 个优先字段");
  }
});

test("QUICK_ACTION_INLINE_FIELD_PRIORITY: 续聊和私聊无字段优先级", () => {
  assert.equal(QUICK_ACTION_INLINE_FIELD_PRIORITY["续聊"], undefined);
  assert.equal(QUICK_ACTION_INLINE_FIELD_PRIORITY["私聊"], undefined);
});

// ====== QUICK_ACTION_INLINE_STATE_FIELD_PRIORITY ======

test("QUICK_ACTION_INLINE_STATE_FIELD_PRIORITY: 整理已归档有回看字段", () => {
  assert.ok(QUICK_ACTION_INLINE_STATE_FIELD_PRIORITY["整理"]["已归档"].includes("回看"));
});

test("QUICK_ACTION_INLINE_STATE_FIELD_PRIORITY: 委托有两个状态", () => {
  const states = Object.keys(QUICK_ACTION_INLINE_STATE_FIELD_PRIORITY["委托"]);
  assert.equal(states.length, 2);
});

// ====== quickActionWorkflowTemplate ======

test("quickActionWorkflowTemplate: 整理已归档返回回看模板", () => {
  const result = quickActionWorkflowTemplate("整理", "已归档", "fallback");
  assert.ok(result.includes("回看"));
  assert.ok(result.includes("新补充"));
});

test("quickActionWorkflowTemplate: 委托已完成返回新需求模板", () => {
  const result = quickActionWorkflowTemplate("委托", "已完成", "fallback");
  assert.ok(result.includes("新需求"));
  assert.ok(result.includes("截止"));
});

test("quickActionWorkflowTemplate: 委托已回执返回回执模板", () => {
  const result = quickActionWorkflowTemplate("委托", "已回执", "fallback");
  assert.ok(result.includes("回执"));
  assert.ok(result.includes("待确认"));
});

test("quickActionWorkflowTemplate: 交易已结清返回新标的模板", () => {
  const result = quickActionWorkflowTemplate("交易", "已结清", "fallback");
  assert.ok(result.includes("新标的"));
});

test("quickActionWorkflowTemplate: 交易已确认返回结果模板", () => {
  const result = quickActionWorkflowTemplate("交易", "已确认", "fallback");
  assert.ok(result.includes("结果"));
  assert.ok(result.includes("待结清"));
});

test("quickActionWorkflowTemplate: 无匹配 state 返回 fallback", () => {
  assert.equal(quickActionWorkflowTemplate("整理", "未知状态", "fallback"), "fallback");
  assert.equal(quickActionWorkflowTemplate("委托", "", "fallback"), "fallback");
});

test("quickActionWorkflowTemplate: 未知 action 返回 fallback", () => {
  assert.equal(quickActionWorkflowTemplate("未知", "任意", "fallback"), "fallback");
});

test("quickActionWorkflowTemplate: 空 action 返回 fallback", () => {
  assert.equal(quickActionWorkflowTemplate("", "", "fallback"), "fallback");
});

test("quickActionWorkflowTemplate: 续聊任何 state 返回 fallback", () => {
  assert.equal(quickActionWorkflowTemplate("续聊", "已续上", "fallback"), "fallback");
});
