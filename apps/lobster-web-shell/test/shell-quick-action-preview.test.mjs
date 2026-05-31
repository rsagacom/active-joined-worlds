import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeQuickActionFieldLabel,
  normalizeQuickActionStructured,
  parseStructuredQuickActionMessage,
  quickActionPreviewFieldViewLabel,
  quickActionPreviewRoundLabel,
  quickActionPreviewHistorySummary,
  quickActionPreviewHistoryLabel,
  quickActionPreviewHistoryDescription,
  quickActionPreviewPrimaryField,
  quickActionPreviewPrimaryFieldText,
  quickActionInlinePreviewFields,
  quickActionInlinePreviewFieldSets,
  quickActionInlinePreviewActionLabels,
  quickActionInlinePreviewActionOrder,
  quickActionInlinePreviewActionHint,
  quickActionWorkflowStructured,
  quickActionPreviewStructuredViews,
} from "../shell-quick-action-preview.js";

const serial = { concurrency: false };

// ====== normalizeQuickActionFieldLabel ======

test("normalizeQuickActionFieldLabel: 去除前导符号和尾部冒号", serial, () => {
  assert.equal(normalizeQuickActionFieldLabel("- 标签："), "标签");
  assert.equal(normalizeQuickActionFieldLabel("• 名称:"), "名称");
});

test("normalizeQuickActionFieldLabel: 空值安全", serial, () => {
  assert.equal(normalizeQuickActionFieldLabel(""), "");
  assert.equal(normalizeQuickActionFieldLabel(null), "");
  assert.equal(normalizeQuickActionFieldLabel(undefined), "");
});

// ====== quickActionPreviewFieldViewLabel ======

test("quickActionPreviewFieldViewLabel: snapshot 默认", serial, () => {
  assert.equal(quickActionPreviewFieldViewLabel(), "原始快照");
  assert.equal(quickActionPreviewFieldViewLabel("snapshot"), "原始快照");
});

test("quickActionPreviewFieldViewLabel: stage 视图", serial, () => {
  assert.equal(quickActionPreviewFieldViewLabel("stage"), "阶段字段");
});

// ====== quickActionPreviewRoundLabel ======

test("quickActionPreviewRoundLabel: 基本轮次", serial, () => {
  assert.equal(quickActionPreviewRoundLabel(0, 3), "第1轮");
  assert.equal(quickActionPreviewRoundLabel(1, 3), "第2轮");
});

test("quickActionPreviewRoundLabel: 最新轮", serial, () => {
  assert.equal(quickActionPreviewRoundLabel(2, 3), "最新轮");
  assert.equal(quickActionPreviewRoundLabel(2, 3, { includeLatestIndex: true }), "最新轮（第3轮）");
});

test("quickActionPreviewRoundLabel: 边界安全", serial, () => {
  assert.equal(quickActionPreviewRoundLabel(-1, 3), "");
  assert.equal(quickActionPreviewRoundLabel(0, 0), "");
  assert.equal(quickActionPreviewRoundLabel("a", 3), "");
});

// ====== quickActionPreviewHistorySummary ======

test("quickActionPreviewHistorySummary: 提取第一个有标签的字段", serial, () => {
  const summary = quickActionPreviewHistorySummary({
    fields: [{ label: "- 主题：", value: "v" }, { label: "其他", value: "v2" }],
  });
  assert.equal(summary, "主题");
});

test("quickActionPreviewHistorySummary: 无字段返回空", serial, () => {
  assert.equal(quickActionPreviewHistorySummary(null), "");
  assert.equal(quickActionPreviewHistorySummary({ fields: [] }), "");
  assert.equal(quickActionPreviewHistorySummary({ fields: [{ value: "无标签" }] }), "");
});

// ====== quickActionPreviewHistoryLabel ======

test("quickActionPreviewHistoryLabel: 包含轮次和摘要", serial, () => {
  const result = quickActionPreviewHistoryLabel(
    { fields: [{ label: "主题", value: "" }] },
    0,
    2,
  );
  assert.equal(result, "第1轮 · 主题");
});

test("quickActionPreviewHistoryLabel: 无摘要只返回轮次", serial, () => {
  const result = quickActionPreviewHistoryLabel({ fields: [] }, 0, 2);
  assert.equal(result, "第1轮");
});

// ====== quickActionPreviewHistoryDescription ======

test("quickActionPreviewHistoryDescription: 最新轮包含索引", serial, () => {
  const result = quickActionPreviewHistoryDescription(
    { fields: [{ label: "总结", value: "" }] },
    1,
    2,
  );
  assert.equal(result, "最新轮（第2轮） · 总结");
});

// ====== quickActionPreviewPrimaryField ======

test("quickActionPreviewPrimaryField: 返回第一个有效字段", serial, () => {
  const field = quickActionPreviewPrimaryField({
    fields: [{ label: "- 标题：", value: " 内容 " }],
  });
  assert.deepEqual(field, { label: "标题", value: "内容" });
});

test("quickActionPreviewPrimaryField: 无有效字段返回 null", serial, () => {
  assert.equal(quickActionPreviewPrimaryField(null), null);
  assert.equal(quickActionPreviewPrimaryField({ fields: [{ value: "无标签" }] }), null);
});

test("quickActionPreviewPrimaryField: 标签值都空返回 null", serial, () => {
  assert.equal(quickActionPreviewPrimaryField({ fields: [{ label: "  ", value: "  " }] }), null);
});

// ====== quickActionPreviewPrimaryFieldText ======

test("quickActionPreviewPrimaryFieldText: 组合输出", serial, () => {
  assert.equal(
    quickActionPreviewPrimaryFieldText({ fields: [{ label: "标题", value: "内容" }] }),
    "标题：内容",
  );
});

test("quickActionPreviewPrimaryFieldText: 只有标签", serial, () => {
  assert.equal(quickActionPreviewPrimaryFieldText({ fields: [{ label: "标题", value: "" }] }), "标题");
});

test("quickActionPreviewPrimaryFieldText: 无字段返回空", serial, () => {
  assert.equal(quickActionPreviewPrimaryFieldText(null), "");
});

// ====== quickActionInlinePreviewFields ======

test("quickActionInlinePreviewFields: 空字段返回空数组", serial, () => {
  assert.deepEqual(quickActionInlinePreviewFields("test", null), []);
  assert.deepEqual(quickActionInlinePreviewFields("test", { fields: [] }), []);
});

test("quickActionInlinePreviewFields: 默认取前2个字段", serial, () => {
  const result = quickActionInlinePreviewFields("test", {
    fields: [
      { label: "A", value: "1" },
      { label: "B", value: "2" },
      { label: "C", value: "3" },
    ],
  });
  assert.equal(result.length, 2);
  assert.equal(result[0].label, "A");
  assert.equal(result[1].label, "B");
});

test("quickActionInlinePreviewFields: maxFields 控制数量", serial, () => {
  const result = quickActionInlinePreviewFields("test", {
    fields: [{ label: "A", value: "1" }, { label: "B", value: "2" }],
  }, { maxFields: 1 });
  assert.equal(result.length, 1);
});

test("quickActionInlinePreviewFields: 过滤空字段", serial, () => {
  const result = quickActionInlinePreviewFields("test", {
    fields: [
      { label: "", value: "" },
      { label: "A", value: "1" },
    ],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].label, "A");
});

// ====== quickActionInlinePreviewFieldSets ======

test("quickActionInlinePreviewFieldSets: 返回 stage/snapshot 两组字段", serial, () => {
  const result = quickActionInlinePreviewFieldSets("test", {
    fields: [{ label: "A", value: "1" }],
  });
  assert.ok(Array.isArray(result.stageFields));
  assert.ok(Array.isArray(result.snapshotFields));
  assert.equal(typeof result.hasViewToggle, "boolean");
});

// ====== quickActionInlinePreviewActionLabels ======

test("quickActionInlinePreviewActionLabels: 无状态返回默认", serial, () => {
  const labels = quickActionInlinePreviewActionLabels("", "");
  assert.equal(labels.snapshot, "当前快照");
  assert.equal(labels.workflow, "当前阶段模板");
});

test("quickActionInlinePreviewActionLabels: 有状态返回定制", serial, () => {
  const labels = quickActionInlinePreviewActionLabels("", "整理");
  assert.equal(labels.snapshot, "查看整理");
  assert.equal(labels.workflow, "整理模板");
});

// ====== quickActionInlinePreviewActionOrder ======

test("quickActionInlinePreviewActionOrder: 非最新视图固定顺序", serial, () => {
  const order = quickActionInlinePreviewActionOrder("", "", { viewingLatest: false });
  assert.deepEqual(order, ["snapshot", "workflow"]);
});

test("quickActionInlinePreviewActionOrder: 最新视图默认 snapshot 优先", serial, () => {
  const order = quickActionInlinePreviewActionOrder("", "");
  assert.deepEqual(order, ["snapshot", "workflow"]);
});

// ====== quickActionInlinePreviewActionHint ======

test("quickActionInlinePreviewActionHint: snapshot 提示", serial, () => {
  const hint = quickActionInlinePreviewActionHint("", "整理", "snapshot", {});
  assert.ok(hint.includes("查看整理快照"));
});

test("quickActionInlinePreviewActionHint: workflow 提示", serial, () => {
  const hint = quickActionInlinePreviewActionHint("委托", "整理", "workflow", {});
  assert.ok(hint.includes("整理阶段模板"));
  assert.ok(hint.includes("委托"));
});

test("quickActionInlinePreviewActionHint: 未知 actionId 返回空", serial, () => {
  assert.equal(quickActionInlinePreviewActionHint("", "", "unknown", {}), "");
});

test("quickActionInlinePreviewActionHint: 历史标签回看提示", serial, () => {
  const hint = quickActionInlinePreviewActionHint("", "整理", "snapshot", {
    viewingLatest: false,
    historyLabel: "第一轮",
  });
  assert.ok(hint.includes("回看第一轮"));
});

// ====== parseStructuredQuickActionMessage ======

test("parseStructuredQuickActionMessage: 解析标准格式", serial, () => {
  const result = parseStructuredQuickActionMessage({
    quick_action: "整理",
    text: "整理：\n- 主题：测试\n- 优先级：高\n备注信息",
  });
  assert.equal(result.action, "整理");
  assert.equal(result.fields.length, 2);
  assert.equal(result.fields[0].label, "- 主题：");
  assert.equal(result.fields[0].value, "测试");
  assert.equal(result.notes.length, 1);
  assert.equal(result.notes[0], "备注信息");
});

test("parseStructuredQuickActionMessage: 不匹配 headline 返回 null", serial, () => {
  const result = parseStructuredQuickActionMessage({
    quick_action: "整理",
    text: "其他标题：\n- 主题：测试",
  });
  assert.equal(result, null);
});

test("parseStructuredQuickActionMessage: 无字段返回 null", serial, () => {
  const result = parseStructuredQuickActionMessage({
    quick_action: "整理",
    text: "整理：\n无格式行",
  });
  assert.equal(result, null);
});

test("parseStructuredQuickActionMessage: 空输入返回 null", serial, () => {
  assert.equal(parseStructuredQuickActionMessage(null), null);
  assert.equal(parseStructuredQuickActionMessage({ quick_action: "", text: "" }), null);
});

// ====== normalizeQuickActionStructured ======

test("normalizeQuickActionStructured: 规范化字段", serial, () => {
  const result = normalizeQuickActionStructured({
    action: "整理",
    fields: [{ label: "  主题  ", value: "  测试  " }],
    notes: ["  备注  "],
  });
  assert.equal(result.action, "整理");
  assert.equal(result.fields[0].label, "主题");
  assert.equal(result.fields[0].value, "测试");
  assert.equal(result.notes[0], "备注");
});

test("normalizeQuickActionStructured: 使用 fallbackAction", serial, () => {
  const result = normalizeQuickActionStructured({
    fields: [{ label: "主题", value: "测试" }],
  }, "整理");
  assert.equal(result.action, "整理");
});

test("normalizeQuickActionStructured: 空字段返回 null", serial, () => {
  assert.equal(normalizeQuickActionStructured(null), null);
  assert.equal(normalizeQuickActionStructured({ fields: [] }), null);
  assert.equal(normalizeQuickActionStructured({ fields: [{ value: "无标签" }] }), null);
});

// ====== quickActionWorkflowStructured ======

test("quickActionWorkflowStructured: 空 action 返回 null", serial, () => {
  assert.equal(quickActionWorkflowStructured(""), null);
});

// ====== quickActionPreviewStructuredViews ======

test("quickActionPreviewStructuredViews: 返回 snapshot 和 stage", serial, () => {
  const result = quickActionPreviewStructuredViews("整理", "", {
    action: "整理",
    fields: [{ label: "主题", value: "测试" }],
  });
  assert.ok(result.snapshotStructured);
  assert.ok(result.stageStructured || result.snapshotStructured);
  assert.equal(typeof result.hasViewToggle, "boolean");
});

test("quickActionPreviewStructuredViews: 空 action 返回 null", serial, () => {
  const result = quickActionPreviewStructuredViews("", "", null);
  assert.equal(result.snapshotStructured, null);
  assert.equal(result.stageStructured, null);
  assert.equal(result.hasViewToggle, false);
});
