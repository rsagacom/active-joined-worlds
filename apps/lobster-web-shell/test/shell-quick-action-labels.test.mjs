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
  quickActionFollowUpLabel,
  quickActionFollowUpCopy,
  quickActionBadgeLabel,
  quickActionBadgeTone,
  quickActionBadgeIntensity,
  quickActionSummary,
  quickActionContextCopy,
  nextQuickActionState,
  quickActionDefaultSendLabel,
  buildRoomQuickActionPillDomSpec,
  buildRoomInlineActionDomSpec,
  buildRoomInlineProgressDomSpec,
  buildRoomInlineProgressRenderDomSpec,
  buildRoomInlineActionsRailDomSpec,
  buildWorkflowProgressDomSpec,
  workflowProgressStageState,
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

test("buildRoomQuickActionPillDomSpec: 生成房间动作 pill 规格", () => {
  assert.deepEqual(buildRoomQuickActionPillDomSpec("委托"), {
    text: "动作 委托",
    tone: "warm",
    classNames: ["pill-room-action", "is-clickable"],
    dataset: {
      actionIntensity: "strong",
      quickAction: "委托",
    },
    title: "点击继续当前动作",
  });
});

test("buildRoomQuickActionPillDomSpec: 空 action 返回 null", () => {
  assert.equal(buildRoomQuickActionPillDomSpec(""), null);
});

test("buildRoomInlineProgressDomSpec: 生成房间 inline progress 规格", () => {
  assert.deepEqual(buildRoomInlineProgressDomSpec("委托", "已回执"), {
    className: "room-inline-progress",
    dataset: {
      actionIntensity: "strong",
    },
    title: "委托已有回执，后续等待确认完成。",
    tabIndex: 0,
    attributes: {
      role: "button",
    },
    count: {
      className: "room-inline-progress-count",
      text: "2 / 3",
    },
    label: {
      className: "room-inline-progress-label",
      text: "已回执",
    },
    stageIndex: 1,
    stageCount: 3,
  });
});

test("buildRoomInlineProgressDomSpec: 未知状态回退第一阶段，未知 action 返回 null", () => {
  const spec = buildRoomInlineProgressDomSpec("整理", "未知状态");
  assert.equal(spec.count.text, "1 / 2");
  assert.equal(spec.label.text, "未知状态");
  assert.equal(spec.stageIndex, 0);
  assert.equal(buildRoomInlineProgressDomSpec("", ""), null);
});

test("buildRoomInlineProgressRenderDomSpec: 组合 progress 容器和子节点规格", () => {
  assert.deepEqual(buildRoomInlineProgressRenderDomSpec("委托", "已回执"), {
    type: "div",
    className: "room-inline-progress",
    dataset: {
      actionIntensity: "strong",
    },
    title: "委托已有回执，后续等待确认完成。",
    tabIndex: 0,
    attributes: {
      role: "button",
    },
    children: [
      {
        type: "span",
        className: "room-inline-progress-count",
        text: "2 / 3",
      },
      {
        type: "span",
        className: "room-inline-progress-label",
        text: "已回执",
      },
    ],
    stageIndex: 1,
    stageCount: 3,
  });
});

test("buildRoomInlineProgressRenderDomSpec: 空输入返回 null", () => {
  assert.equal(buildRoomInlineProgressRenderDomSpec("", ""), null);
});

test("buildRoomInlineActionsRailDomSpec: 生成房间 inline actions rail 规格", () => {
  assert.deepEqual(buildRoomInlineActionsRailDomSpec("交易"), {
    className: "room-inline-actions",
    dataset: {
      quickAction: "交易",
      actionIntensity: "strong",
    },
  });
});

test("buildRoomInlineActionsRailDomSpec: 未知 action 只保留 quickAction，空 action 返回 null", () => {
  assert.deepEqual(buildRoomInlineActionsRailDomSpec("自定义"), {
    className: "room-inline-actions",
    dataset: {
      quickAction: "自定义",
    },
  });
  assert.equal(buildRoomInlineActionsRailDomSpec(""), null);
});

test("buildRoomInlineActionDomSpec: 生成 primary/secondary 动作节点规格", () => {
  assert.deepEqual(buildRoomInlineActionDomSpec("委托", "跟进委托", "primary"), {
    type: "span",
    className: "room-inline-action room-inline-action-primary",
    text: "跟进委托",
    dataset: {
      roomInlineRole: "primary",
      actionIntensity: "strong",
    },
    tabIndex: 0,
    attributes: {
      role: "button",
    },
  });

  assert.deepEqual(buildRoomInlineActionDomSpec("整理", "标记已归档", "secondary"), {
    type: "span",
    className: "room-inline-action room-inline-action-secondary",
    text: "标记已归档",
    dataset: {
      roomInlineRole: "secondary",
      actionIntensity: "steady",
    },
    tabIndex: 0,
    attributes: {
      role: "button",
    },
  });
});

test("buildRoomInlineActionDomSpec: 空 label/role 返回 null，未知 action 不写 intensity", () => {
  assert.equal(buildRoomInlineActionDomSpec("委托", "", "primary"), null);
  assert.equal(buildRoomInlineActionDomSpec("委托", "跟进委托", ""), null);
  assert.deepEqual(buildRoomInlineActionDomSpec("自定义", "继续", "primary"), {
    type: "span",
    className: "room-inline-action room-inline-action-primary",
    text: "继续",
    dataset: {
      roomInlineRole: "primary",
    },
    tabIndex: 0,
    attributes: {
      role: "button",
    },
  });
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

// ====== quickActionFollowUp helpers ======

test("quickActionFollowUpLabel: 返回匹配阶段标签", () => {
  assert.equal(quickActionFollowUpLabel("委托", "已回执"), "已回执");
});

test("quickActionFollowUpCopy: 返回匹配阶段文案", () => {
  assert.match(quickActionFollowUpCopy("交易", "已确认"), /等待结清/);
});

test("quickActionFollowUp helpers: 未知 action 返回空字符串", () => {
  assert.equal(quickActionFollowUpLabel("", "任意"), "");
  assert.equal(quickActionFollowUpCopy("", "任意"), "");
});

// ====== quickActionBadge helpers ======

test("quickActionBadgeLabel: 有 action 时返回动作标签", () => {
  assert.equal(quickActionBadgeLabel("整理"), "动作 整理");
});

test("quickActionBadgeLabel: 空 action 返回空字符串", () => {
  assert.equal(quickActionBadgeLabel(""), "");
});

test("quickActionBadgeTone 和 Intensity 复用 action 视觉规则", () => {
  assert.equal(quickActionBadgeTone("交易"), "warm");
  assert.equal(quickActionBadgeIntensity("交易"), "strong");
  assert.equal(quickActionBadgeTone("未知"), "muted");
  assert.equal(quickActionBadgeIntensity("未知"), "");
});

// ====== quickAction summary helpers ======

test("quickActionSummary: 有 action 时返回最近动作摘要", () => {
  assert.equal(quickActionSummary("整理"), "最近动作：整理");
});

test("quickActionSummary: 空 action 返回空字符串", () => {
  assert.equal(quickActionSummary(""), "");
});

test("quickActionContextCopy: 拼接最近动作和动作状态文案", () => {
  assert.match(quickActionContextCopy("委托"), /^最近动作：委托 · 当前窗口正在跟进需求、截止和交付。$/);
});

test("quickActionContextCopy: 空 action 返回空字符串", () => {
  assert.equal(quickActionContextCopy(""), "");
});

// ====== nextQuickActionState ======

test("nextQuickActionState: 返回当前阶段之后的阶段", () => {
  assert.equal(nextQuickActionState("委托", "待回执"), "已回执");
});

test("nextQuickActionState: 最后阶段返回空字符串", () => {
  assert.equal(nextQuickActionState("交易", "已结清"), "");
});

test("nextQuickActionState: 未知阶段或未知 action 返回空字符串", () => {
  assert.equal(nextQuickActionState("整理", "不存在"), "");
  assert.equal(nextQuickActionState("", "任意"), "");
});

// ====== quickActionDefaultSendLabel ======

test("quickActionDefaultSendLabel: 已知 action 返回默认发送文案", () => {
  assert.equal(quickActionDefaultSendLabel("整理"), "提交整理");
  assert.equal(quickActionDefaultSendLabel("留条"), "留下便条");
  assert.equal(quickActionDefaultSendLabel("委托"), "发出委托");
  assert.equal(quickActionDefaultSendLabel("交易"), "记录交易");
  assert.equal(quickActionDefaultSendLabel("续聊"), "继续发送");
  assert.equal(quickActionDefaultSendLabel("私聊"), "发起私聊");
});

test("quickActionDefaultSendLabel: 未知或空 action 返回发送", () => {
  assert.equal(quickActionDefaultSendLabel("未知"), "发送");
  assert.equal(quickActionDefaultSendLabel(""), "发送");
});

// ====== workflowProgressStageState ======

test("workflowProgressStageState: 已经过的阶段返回 done", () => {
  assert.equal(workflowProgressStageState(0, 2), "done");
});

test("workflowProgressStageState: 当前阶段返回 current", () => {
  assert.equal(workflowProgressStageState(2, 2), "current");
});

test("workflowProgressStageState: 未到阶段返回 upcoming", () => {
  assert.equal(workflowProgressStageState(3, 2), "upcoming");
});

test("buildWorkflowProgressDomSpec: 为委托阶段生成稳定 DOM 规格", () => {
  const spec = buildWorkflowProgressDomSpec("委托", "已回执", {
    className: "chat-detail-card-workflow",
    title: "委托阶段",
    onStageClick: true,
  });

  assert.deepEqual(spec.classNames, ["workflow-progress", "chat-detail-card-workflow"]);
  assert.deepEqual(spec.dataset, {
    actionIntensity: "strong",
    quickAction: "委托",
  });
  assert.deepEqual(spec.titleLine, {
    className: "workflow-progress-title",
    text: "委托阶段",
  });
  assert.equal(spec.stepsClassName, "workflow-progress-steps");
  assert.deepEqual(
    spec.steps.map((step) => ({
      className: step.className,
      dataset: step.dataset,
      markerText: step.markerText,
      labelText: step.labelText,
      clickable: step.clickable,
    })),
    [
      {
        className: "workflow-progress-step",
        dataset: { stageState: "done", stageLabel: "待回执" },
        markerText: "1",
        labelText: "待回执",
        clickable: true,
      },
      {
        className: "workflow-progress-step",
        dataset: { stageState: "current", stageLabel: "已回执" },
        markerText: "2",
        labelText: "已回执",
        clickable: true,
      },
      {
        className: "workflow-progress-step",
        dataset: { stageState: "upcoming", stageLabel: "已完成" },
        markerText: "3",
        labelText: "已完成",
        clickable: true,
      },
    ],
  );
});

test("buildWorkflowProgressDomSpec: 支持自定义阶段并过滤空 class", () => {
  const spec = buildWorkflowProgressDomSpec("自定义", "二", {
    className: "  compact   is-inline  ",
    stages: [{ label: "一" }, { label: "二" }],
  });

  assert.deepEqual(spec.classNames, ["workflow-progress", "compact", "is-inline"]);
  assert.deepEqual(spec.dataset, { quickAction: "自定义" });
  assert.equal(spec.titleLine, null);
  assert.deepEqual(spec.steps.map((step) => step.dataset.stageState), ["done", "current"]);
  assert.deepEqual(spec.steps.map((step) => step.clickable), [false, false]);
});

test("buildWorkflowProgressDomSpec: 无阶段时返回 null", () => {
  assert.equal(buildWorkflowProgressDomSpec("", ""), null);
  assert.equal(buildWorkflowProgressDomSpec("x", "", { stages: [] }), null);
});
