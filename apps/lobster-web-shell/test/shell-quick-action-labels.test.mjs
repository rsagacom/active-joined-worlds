// shell-quick-action-labels.test.mjs — quickAction 纯标签函数单元测试
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  quickActionStatusCopy,
  quickActionTone,
  quickActionIntensity,
  quickActionOverviewSummary,
  quickActionOverviewCtaLabel,
  quickActionDraftStatusCopy,
  quickActionStateStages,
  quickActionStage,
} from "../shell-quick-action-labels.js";

// ====== quickActionStatusCopy ======

test("quickActionStatusCopy: 整理", () => {
  assert.match(quickActionStatusCopy("整理"), /收拢目标/);
});

test("quickActionStatusCopy: 留条", () => {
  assert.match(quickActionStatusCopy("留条"), /留言备注/);
});

test("quickActionStatusCopy: 委托", () => {
  assert.match(quickActionStatusCopy("委托"), /需求、截止和交付/);
});

test("quickActionStatusCopy: 交易", () => {
  assert.match(quickActionStatusCopy("交易"), /标的、数量和备注/);
});

test("quickActionStatusCopy: 未知 action 返回通用文案", () => {
  assert.match(quickActionStatusCopy("unknown"), /继续推进/);
});

test("quickActionStatusCopy: 空 action 返回空字符串", () => {
  assert.equal(quickActionStatusCopy(""), "");
});

// ====== quickActionTone ======

test("quickActionTone: 整理/留条 返回 accent", () => {
  assert.equal(quickActionTone("整理"), "accent");
  assert.equal(quickActionTone("留条"), "accent");
});

test("quickActionTone: 委托/交易 返回 warm", () => {
  assert.equal(quickActionTone("委托"), "warm");
  assert.equal(quickActionTone("交易"), "warm");
});

test("quickActionTone: 续聊/私聊 返回 muted", () => {
  assert.equal(quickActionTone("续聊"), "muted");
  assert.equal(quickActionTone("私聊"), "muted");
});

test("quickActionTone: 未知返回 muted", () => {
  assert.equal(quickActionTone(""), "muted");
});

// ====== quickActionIntensity ======

test("quickActionIntensity: 委托/交易 返回 strong", () => {
  assert.equal(quickActionIntensity("委托"), "strong");
  assert.equal(quickActionIntensity("交易"), "strong");
});

test("quickActionIntensity: 整理/留条 返回 steady", () => {
  assert.equal(quickActionIntensity("整理"), "steady");
  assert.equal(quickActionIntensity("留条"), "steady");
});

test("quickActionIntensity: 续聊/私聊 返回 soft", () => {
  assert.equal(quickActionIntensity("续聊"), "soft");
  assert.equal(quickActionIntensity("私聊"), "soft");
});

test("quickActionIntensity: 未知返回空字符串", () => {
  assert.equal(quickActionIntensity(""), "");
});

// ====== quickActionOverviewSummary ======

test("quickActionOverviewSummary: 六个已知 action 返回非空", () => {
  for (const action of ["整理", "留条", "委托", "交易", "续聊", "私聊"]) {
    const summary = quickActionOverviewSummary(action);
    assert.ok(summary.length > 0, action + " 应有 summary");
    assert.ok(summary.includes(action), summary + " 应包含 action 名称");
  }
});

test("quickActionOverviewSummary: 未知 action 返回空字符串", () => {
  assert.equal(quickActionOverviewSummary(""), "");
});

// ====== quickActionOverviewCtaLabel ======

test("quickActionOverviewCtaLabel: 整理已归档返回重开", () => {
  assert.equal(quickActionOverviewCtaLabel("整理", "已归档"), "重开整理");
});

test("quickActionOverviewCtaLabel: 委托已完成返回重开委托", () => {
  assert.equal(quickActionOverviewCtaLabel("委托", "已完成"), "重开委托");
});

test("quickActionOverviewCtaLabel: 委托默认返回跟进委托", () => {
  assert.equal(quickActionOverviewCtaLabel("委托", ""), "跟进委托");
});

test("quickActionOverviewCtaLabel: 交易已结清返回新建交易", () => {
  assert.equal(quickActionOverviewCtaLabel("交易", "已结清"), "新建交易");
});

test("quickActionOverviewCtaLabel: 交易未指定状态默认继续交易", () => {
  assert.equal(quickActionOverviewCtaLabel("交易", ""), "继续交易");
});

test("quickActionOverviewCtaLabel: 续聊已续上返回再续一句", () => {
  assert.equal(quickActionOverviewCtaLabel("续聊", "已续上"), "再续一句");
});

test("quickActionOverviewCtaLabel: 私聊已回复返回继续跟进", () => {
  assert.equal(quickActionOverviewCtaLabel("私聊", "已回复"), "继续跟进");
});

test("quickActionOverviewCtaLabel: 未知 action 返回空字符串", () => {
  assert.equal(quickActionOverviewCtaLabel("", ""), "");
});

// ====== quickActionDraftStatusCopy ======

test("quickActionDraftStatusCopy: 整理草稿包含字数和结构化整理卡", () => {
  const result = quickActionDraftStatusCopy("整理", 42);
  assert.ok(result.includes("42"), "应包含字数: " + result);
  assert.ok(result.includes("结构化整理卡"), "应包含整理卡: " + result);
});

test("quickActionDraftStatusCopy: 交易草稿包含结构化交易卡", () => {
  const result = quickActionDraftStatusCopy("交易", 100);
  assert.ok(result.includes("结构化交易卡"), "应包含交易卡: " + result);
});

test("quickActionDraftStatusCopy: 续聊不包含结构化字样", () => {
  const result = quickActionDraftStatusCopy("续聊", 10);
  assert.ok(!result.includes("结构化"), "续聊不应包含结构化: " + result);
});

test("quickActionDraftStatusCopy: 未知 action 返回空字符串", () => {
  assert.equal(quickActionDraftStatusCopy("", 0), "");
});

// ====== quickActionStateStages ======

test("quickActionStateStages: 整理有 2 个 stages", () => {
  assert.equal(quickActionStateStages("整理").length, 2);
});

test("quickActionStateStages: 委托有 3 个 stages", () => {
  assert.equal(quickActionStateStages("委托").length, 3);
});

test("quickActionStateStages: 每个 stage 有 label 和 copy", () => {
  for (const action of ["整理", "留条", "委托", "交易", "续聊", "私聊"]) {
    const stages = quickActionStateStages(action);
    for (const stage of stages) {
      assert.ok(typeof stage.label === "string" && stage.label.length > 0, action + " stage 应有 label");
      assert.ok(typeof stage.copy === "string" && stage.copy.length > 0, action + " stage 应有 copy");
    }
  }
});

test("quickActionStateStages: 未知 action 返回空数组", () => {
  assert.deepEqual(quickActionStateStages(""), []);
});

// ====== quickActionStage ======

test("quickActionStage: 按 label 匹配返回对应 stage", () => {
  const stage = quickActionStage("整理", "已归档");
  assert.equal(stage.label, "已归档");
  assert.ok(stage.copy.length > 0);
});

test("quickActionStage: 无匹配时返回第一个 stage", () => {
  const stage = quickActionStage("整理", "不存在的状态");
  assert.equal(stage.label, "待归档");
});

test("quickActionStage: 空 state 返回第一个 stage", () => {
  const stage = quickActionStage("委托", "");
  assert.equal(stage.label, "待回执");
});

test("quickActionStage: 未知 action 返回 null", () => {
  assert.equal(quickActionStage("", "任意"), null);
});
