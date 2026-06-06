import test from "node:test";
import assert from "node:assert/strict";
import {
  buildQuickActionInlinePreviewPanelModel,
  buildQuickActionInlinePreviewPanelRenderDomModel,
  buildQuickActionInlinePreviewRenderModel,
  buildQuickActionInlinePreviewCardRenderDomModel,
  buildQuickActionInlinePreviewHeaderModel,
  buildQuickActionInlinePreviewHeaderDomModel,
  buildQuickActionInlinePreviewMetaDomModel,
  buildQuickActionInlinePreviewMetaRenderDomModel,
  buildQuickActionInlinePreviewMetaSectionsModel,
  buildQuickActionInlinePreviewFieldRowsModel,
  buildQuickActionInlinePreviewFieldRowsDomModel,
  buildQuickActionInlinePreviewFieldRowsRenderDomModel,
  buildQuickActionInlinePreviewHintDomModel,
  buildQuickActionInlinePreviewHintRenderDomModel,
  buildQuickActionInlinePreviewHintModel,
  buildQuickActionInlinePreviewActionModel,
  buildQuickActionInlinePreviewActionDomModel,
  buildQuickActionInlinePreviewActionRenderDomModel,
  buildQuickActionInlinePreviewControlsDomModel,
  buildQuickActionInlinePreviewControlsRenderDomModel,
  buildQuickActionInlinePreviewControlsModel,
  buildQuickActionInlinePreviewMetaModel,
  buildQuickActionInlinePreviewCardModel,
  buildQuickActionInlinePreviewCardDomModel,
  buildQuickActionPreviewSummaryLineDomSpec,
  buildQuickActionPreviewCardChromeModel,
  buildQuickActionPreviewCardHeaderDomSpec,
  buildQuickActionPreviewCardCopyDomSpec,
  buildQuickActionPreviewCardPillsDomSpec,
  buildQuickActionPreviewCardRenderDomSpec,
  buildRoomQuickPreviewPillDomSpec,
  buildQuickActionPreviewCardPillSectionsDomSpec,
  buildQuickActionPreviewCardPillSectionsRenderDomSpec,
  buildQuickActionPreviewCardSheetDomSpec,
  buildQuickActionPreviewCardSheetRenderDomSpec,
  buildQuickActionPreviewControlButtonDomSpec,
  buildQuickActionPreviewControlPanelRenderDomSpec,
  buildQuickActionPreviewControlPanelsRenderDomSpec,
  buildQuickActionPreviewControlPanelDomSpec,
  buildQuickActionPreviewControlWrapperDomState,
  quickActionPreviewCardControlActionTarget,
  buildQuickActionPreviewHistoryControlsDomSpec,
  buildQuickActionPreviewFieldViewControlsDomSpec,
  buildQuickActionPreviewCardDomSpec,
  buildQuickActionPreviewCardModel,
  buildQuickActionPreviewModel,
  normalizeQuickActionFieldLabel,
  normalizeQuickActionStructured,
  parseStructuredQuickActionMessage,
  quickActionSnapshotFromHistory,
  quickActionSnapshotHistoryFromRecord,
  quickActionPreviewDefaultFieldView,
  quickActionPreviewFieldViewLabel,
  quickActionPreviewHistoryToneClass,
  quickActionPreviewRoundLabel,
  quickActionPreviewHistorySummary,
  quickActionPreviewHistoryLabel,
  quickActionPreviewHistoryDescription,
  quickActionPreviewPrimaryField,
  quickActionPreviewPrimaryFieldText,
  quickActionPreviewKeyActivates,
  resolveQuickActionPreviewView,
  quickActionPreviewResolvedSnapshotIndex,
  quickActionPreviewSelectedFieldView,
  quickActionPreviewSelectedSnapshotIndex,
  quickActionPreviewSelectedState,
  quickActionPreviewViewingLatest,
  quickActionInlinePreviewFields,
  quickActionInlinePreviewFieldSets,
  quickActionInlinePreviewActionLabels,
  quickActionInlinePreviewActionOrder,
  quickActionInlinePreviewActionHint,
  quickActionInlinePreviewActionTarget,
  quickActionInlinePreviewClickableDomSpec,
  quickActionPreviewClickableDomSpec,
  quickActionPreviewCardPillActionTarget,
  quickActionInlinePreviewControlActionTarget,
  quickActionInlinePreviewHintActionTarget,
  quickActionInlinePreviewMetaActionTarget,
  quickActionWorkflowStructured,
  quickActionPreviewStructuredViews,
} from "../shell-quick-action-preview.js";

const serial = { concurrency: false };

// ====== buildQuickActionPreviewModel ======

test("buildQuickActionPreviewModel: 组装阶段预览模型", serial, () => {
  const history = [{ fields: [{ label: "主题", value: "旧" }] }];
  const structured = { action: "整理", fields: [{ label: "主题", value: "新" }] };
  const model = buildQuickActionPreviewModel({
    action: "整理",
    state: "已归档",
    history,
    snapshotIndex: 0,
    structured,
    historyLabel: "最新轮",
    followUpCopy: "继续整理",
  });
  assert.equal(model.action, "整理");
  assert.equal(model.state, "已归档");
  assert.equal(model.history, history);
  assert.equal(model.snapshotIndex, 0);
  assert.equal(model.structured, structured);
  assert.equal(model.historyToneClass, "");
  assert.equal(model.detailText, "已归档 · 最新轮 · 继续整理");
  assert.equal(model.summaryText, "阶段预览：已归档 · 最新轮 · 继续整理");
});

test("buildQuickActionPreviewModel: 多轮历史设置 historyToneClass", serial, () => {
  const history = [{ fields: [] }, { fields: [] }, { fields: [] }];
  assert.equal(
    buildQuickActionPreviewModel({
      action: "整理",
      state: "已归档",
      history,
      snapshotIndex: 1,
    }).historyToneClass,
    "summary-history",
  );
  assert.equal(
    buildQuickActionPreviewModel({
      action: "整理",
      state: "已归档",
      history,
      snapshotIndex: 2,
    }).historyToneClass,
    "summary-round",
  );
});

test("buildQuickActionPreviewModel: 缺少 action 或 state 返回 null", serial, () => {
  assert.equal(buildQuickActionPreviewModel({ action: "", state: "已归档" }), null);
  assert.equal(buildQuickActionPreviewModel({ action: "整理", state: "" }), null);
});

test("buildQuickActionPreviewSummaryLineDomSpec: 生成 summary 行节点规格", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewSummaryLineDomSpec(
      {
        action: "整理",
        state: "已归档",
        structured: { fields: [{ label: "主题", value: "旧城公告" }] },
        historyLabel: "第1轮",
        historyToneClass: "summary-history",
        followUpCopy: "继续整理",
      },
      {
        fieldView: "stage",
        includePrefix: true,
        tagName: "p",
        className: "overview-summary quick-action-preview-summary",
      },
    ),
    {
      tagName: "p",
      className: "overview-summary quick-action-preview-summary",
      parts: [
        { className: "quick-action-preview-summary-copy", text: "阶段字段：已归档" },
        { className: "quick-action-preview-summary-copy", text: " · " },
        { className: "summary-history", text: "第1轮" },
        { className: "quick-action-preview-summary-copy", text: " · 继续整理" },
      ],
    },
  );
});

test("buildQuickActionPreviewSummaryLineDomSpec: snapshot fallback 和空输入安全", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewSummaryLineDomSpec({
      action: "整理",
      state: "已归档",
      structured: { fields: [{ label: "主题", value: "旧城公告" }] },
      historyLabel: "",
      historyToneClass: "",
      followUpCopy: "继续整理",
    }),
    {
      tagName: "div",
      className: "quick-action-preview-summary",
      parts: [
        { className: "quick-action-preview-summary-copy", text: "已归档" },
        { className: "quick-action-preview-summary-copy", text: " · 主题：旧城公告" },
      ],
    },
  );
  assert.equal(buildQuickActionPreviewSummaryLineDomSpec(null), null);
  assert.equal(buildQuickActionPreviewSummaryLineDomSpec({ action: "整理", state: "已归档" }), null);
});

test("buildRoomQuickPreviewPillDomSpec: 生成房间预览 pill 规格", serial, () => {
  assert.deepEqual(
    buildRoomQuickPreviewPillDomSpec(
      {
        state: "已归档",
        historyLabel: "最新轮",
        historyToneClass: "summary-round",
      },
      "stage",
    ),
    {
      text: "预览 最新轮 · 阶段字段",
      tone: "warm",
      classNames: ["pill-room-preview", "is-clickable"],
      dataset: {
        previewState: "已归档",
        previewRound: "最新轮",
        previewFieldView: "stage",
      },
      title: "点击回到当前预览快照",
    },
  );
});

test("buildRoomQuickPreviewPillDomSpec: 历史轮使用 muted 且缺少 historyLabel 返回 null", serial, () => {
  assert.deepEqual(
    buildRoomQuickPreviewPillDomSpec(
      {
        state: "已归档",
        historyLabel: "第 1 轮",
        historyToneClass: "summary-history",
      },
      "snapshot",
    ),
    {
      text: "预览 第 1 轮 · 原始快照",
      tone: "muted",
      classNames: ["pill-room-preview", "is-clickable"],
      dataset: {
        previewState: "已归档",
        previewRound: "第 1 轮",
        previewFieldView: "snapshot",
      },
      title: "点击回到当前预览快照",
    },
  );
  assert.equal(buildRoomQuickPreviewPillDomSpec({ state: "已归档" }, "stage"), null);
});

// ====== buildQuickActionPreviewCardModel ======

test("buildQuickActionPreviewCardModel: 规范化历史索引和字段视图", serial, () => {
  const history = [{ id: 1 }, null, { id: 2 }];
  const model = buildQuickActionPreviewCardModel("整理", "已归档", {
    action: "整理",
    fields: [{ label: "主题", value: "新记录" }],
  }, {
    history,
    selectedHistoryIndex: 0,
    fieldView: "stage",
    historyLabel: "第1轮",
  });
  assert.equal(model.action, "整理");
  assert.equal(model.previewState, "已归档");
  assert.deepEqual(model.history, [{ id: 1 }, { id: 2 }]);
  assert.equal(model.selectedHistoryIndex, 0);
  assert.equal(model.selectedFieldView, "stage");
  assert.ok(model.structuredViews.stageStructured);
  assert.ok(model.activeStructured);
  assert.equal(model.resolvedPreviewView.fieldView, "stage");
});

test("buildQuickActionPreviewCardModel: 无有效索引时默认最新历史", serial, () => {
  const model = buildQuickActionPreviewCardModel("整理", "已归档", {
    action: "整理",
    fields: [{ label: "主题", value: "新记录" }],
  }, {
    history: [{ id: 1 }, { id: 2 }],
    selectedHistoryIndex: 99,
    fieldView: "bad",
  });
  assert.equal(model.selectedHistoryIndex, 1);
  assert.equal(model.selectedFieldView, "snapshot");
});

test("buildQuickActionPreviewCardModel: 缺少必要输入返回 null", serial, () => {
  assert.equal(buildQuickActionPreviewCardModel("", "已归档", { fields: [{ label: "主题" }] }), null);
  assert.equal(buildQuickActionPreviewCardModel("整理", "", { fields: [{ label: "主题" }] }), null);
  assert.equal(buildQuickActionPreviewCardModel("整理", "已归档", null), null);
});

// ====== buildQuickActionPreviewCardChromeModel ======

test("buildQuickActionPreviewCardChromeModel: 生成当前条和折叠状态", serial, () => {
  const model = buildQuickActionPreviewCardChromeModel({
    previewState: "已归档",
    historyLabel: "最新轮",
    fieldViewLabel: "阶段字段",
    selectedFieldView: "stage",
    historyLength: 3,
    selectedHistoryIndex: 2,
    hasViewToggle: true,
  });
  assert.equal(model.currentStripText, "已归档 · 最新轮 · 阶段字段");
  assert.equal(model.historyTone, "warm");
  assert.equal(model.historySnapshotRole, "latest");
  assert.equal(model.historyToggleTitle, "切到下一轮历史快照");
  assert.equal(model.nextHistoryIndex, 0);
  assert.equal(model.fieldViewToggleTitle, "切到原始快照字段");
  assert.equal(model.nextFieldView, "snapshot");
  assert.equal(model.historyControlsCollapsed, "true");
  assert.equal(model.fieldViewControlsCollapsed, "true");
});

test("buildQuickActionPreviewCardChromeModel: 历史轮次和 snapshot 视图 fallback", serial, () => {
  const model = buildQuickActionPreviewCardChromeModel({
    previewState: "已归档",
    historyLabel: "第1轮",
    fieldViewLabel: "原始快照",
    selectedFieldView: "snapshot",
    historyLength: 2,
    selectedHistoryIndex: 0,
    hasViewToggle: false,
  });
  assert.equal(model.historyTone, "muted");
  assert.equal(model.historySnapshotRole, "history");
  assert.equal(model.nextHistoryIndex, 1);
  assert.equal(model.fieldViewToggleTitle, "切到阶段字段");
  assert.equal(model.nextFieldView, "stage");
  assert.equal(model.fieldViewControlsCollapsed, "false");
});

test("buildQuickActionPreviewCardChromeModel: 无历史或字段标签时保持安全默认", serial, () => {
  const model = buildQuickActionPreviewCardChromeModel({
    previewState: "待归档",
    historyLength: 0,
    selectedHistoryIndex: -1,
  });
  assert.equal(model.currentStripText, "待归档");
  assert.equal(model.historyTone, "muted");
  assert.equal(model.historySnapshotRole, "history");
  assert.equal(model.historyToggleTitle, "");
  assert.equal(model.nextHistoryIndex, null);
  assert.equal(model.fieldViewToggleTitle, "切到阶段字段");
  assert.equal(model.nextFieldView, "stage");
  assert.equal(model.historyControlsCollapsed, "false");
});

test("buildQuickActionPreviewCardDomSpec: 生成 preview card 容器 class 和 dataset", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewCardDomSpec("整理", "已归档", {
      actionIntensity: "steady",
      className: "is-compact  is-focused",
    }),
    {
      classNames: ["quick-action-preview-card", "is-compact", "is-focused"],
      dataset: {
        actionIntensity: "steady",
        quickAction: "整理",
        previewState: "已归档",
      },
    },
  );
});

test("buildQuickActionPreviewCardDomSpec: 空输入过滤额外 class 和空 dataset", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewCardDomSpec("", "待归档", {
      actionIntensity: "",
      className: "  ",
    }),
    {
      classNames: ["quick-action-preview-card"],
      dataset: {
        previewState: "待归档",
      },
    },
  );
});

test("buildQuickActionPreviewCardHeaderDomSpec: 生成 header 与标题行 DOM 规格", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewCardHeaderDomSpec("整理", "已归档", {
      title: "阶段字段",
      fieldViewLabel: "原始快照",
    }),
    {
      headerClassName: "quick-action-preview-card-header",
      headingClassName: "quick-action-preview-card-heading",
      kickerLine: {
        className: "quick-action-preview-card-kicker",
        text: "阶段字段",
      },
      titleLine: {
        className: "quick-action-preview-card-title",
        text: "整理 · 已归档",
      },
    },
  );
});

test("buildQuickActionPreviewCardHeaderDomSpec: 标题 fallback 到视图标签和默认文案", serial, () => {
  assert.equal(
    buildQuickActionPreviewCardHeaderDomSpec("委托", "已回执", {
      fieldViewLabel: "阶段字段",
    }).kickerLine.text,
    "阶段字段",
  );
  assert.equal(
    buildQuickActionPreviewCardHeaderDomSpec("委托", "已回执").kickerLine.text,
    "阶段快照",
  );
});

test("buildQuickActionPreviewCardCopyDomSpec: summaryCopy 优先生成 copy 行规格", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewCardCopyDomSpec({
      summaryCopy: "  结构化摘要  ",
      followUpCopy: "继续整理",
    }),
    {
      className: "quick-action-preview-card-copy",
      text: "结构化摘要",
    },
  );
});

test("buildQuickActionPreviewCardCopyDomSpec: fallback copy 和空输入安全", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewCardCopyDomSpec({
      summaryCopy: "",
      followUpCopy: "  继续推进  ",
    }),
    {
      className: "quick-action-preview-card-copy",
      text: "继续推进",
    },
  );
  assert.equal(buildQuickActionPreviewCardCopyDomSpec({ summaryCopy: "", followUpCopy: "" }), null);
  assert.equal(buildQuickActionPreviewCardCopyDomSpec(null), null);
});

test("buildQuickActionPreviewCardPillsDomSpec: 生成当前/轮次/视图 pill 规格", serial, () => {
  const history = [
    { fields: [{ label: "主题", value: "旧" }] },
    { fields: [{ label: "主题", value: "新" }] },
  ];
  assert.deepEqual(
    buildQuickActionPreviewCardPillsDomSpec({
      action: "整理",
      previewState: "已归档",
      history,
      selectedHistoryIndex: 0,
      selectedFieldView: "stage",
      fieldViewLabel: "阶段字段",
      historyLabel: "第1轮",
      currentStripText: "已归档 · 第1轮 · 阶段字段",
      historyTone: "muted",
      historySnapshotRole: "history",
      historyToggleTitle: "切到下一轮历史快照",
      nextHistoryIndex: 1,
      fieldViewToggleTitle: "切到原始快照字段",
      nextFieldView: "snapshot",
      hasViewToggle: true,
    }),
    {
      wrapperClassName: "quick-action-preview-card-pills",
      currentClassName: "quick-action-preview-card-pills-current",
      optionClassName: "quick-action-preview-card-pills-options",
      labels: [
        { className: "quick-action-preview-card-pills-label", dataset: { pillSection: "current" }, text: "当前" },
        { className: "quick-action-preview-card-pills-label", dataset: { pillSection: "history" }, text: "轮次" },
        { className: "quick-action-preview-card-pills-label", dataset: { pillSection: "field-view" }, text: "视图" },
      ],
      current: [
        {
          text: "整理",
          tone: "accent",
          dataset: { actionIntensity: "steady", quickAction: "整理", currentMetaRole: "action" },
        },
        {
          className: "quick-action-preview-card-current-strip",
          dataset: { currentMetaRole: "summary" },
          text: "已归档 · 第1轮 · 阶段字段",
        },
        {
          text: "已归档",
          tone: "accent",
          dataset: { actionIntensity: "steady", quickAction: "整理", currentMetaRole: "state" },
        },
        {
          text: "第1轮",
          tone: "muted",
          dataset: { previewMeta: "history", snapshotRole: "history", currentMetaRole: "history" },
          action: { kind: "history", title: "切到下一轮历史快照", snapshotIndex: 1 },
        },
        {
          text: "阶段字段",
          tone: "muted",
          dataset: { previewMeta: "field-view", previewFieldView: "stage", currentMetaRole: "field-view" },
          action: { kind: "field-view", title: "切到原始快照字段", fieldView: "snapshot" },
        },
      ],
      historyOptions: {
        dataset: { optionKind: "history" },
        pills: [
          {
            text: "第1轮 · 主题",
            tone: "warm",
            dataset: {
              previewMetaOption: "history",
              snapshotIndex: "0",
              snapshotRole: "history",
              selected: "true",
            },
            action: { kind: "history", title: "第1轮 · 主题", snapshotIndex: 0 },
          },
          {
            text: "最新轮 · 主题",
            tone: "muted",
            dataset: {
              previewMetaOption: "history",
              snapshotIndex: "1",
              snapshotRole: "latest",
              selected: "false",
            },
            action: { kind: "history", title: "最新轮（第2轮） · 主题", snapshotIndex: 1 },
          },
        ],
      },
      fieldViewOptions: {
        dataset: { optionKind: "field-view" },
        pills: [
          {
            text: "阶段字段",
            tone: "warm",
            dataset: { previewMetaOption: "field-view", previewFieldView: "stage", selected: "true" },
            action: { kind: "field-view", title: "切到已归档阶段字段", fieldView: "stage" },
          },
          {
            text: "原始快照",
            tone: "muted",
            dataset: { previewMetaOption: "field-view", previewFieldView: "snapshot", selected: "false" },
            action: { kind: "field-view", title: "切到第1轮的原始快照字段", fieldView: "snapshot" },
          },
        ],
      },
    },
  );
});

test("buildQuickActionPreviewCardPillsDomSpec: 无历史和无视图切换时只保留当前基础 pill", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewCardPillsDomSpec({
      action: "委托",
      previewState: "待确认",
      currentStripText: "待确认",
    }),
    {
      wrapperClassName: "quick-action-preview-card-pills",
      currentClassName: "quick-action-preview-card-pills-current",
      optionClassName: "quick-action-preview-card-pills-options",
      labels: [
        { className: "quick-action-preview-card-pills-label", dataset: { pillSection: "current" }, text: "当前" },
      ],
      current: [
        {
          text: "委托",
          tone: "warm",
          dataset: { actionIntensity: "strong", quickAction: "委托", currentMetaRole: "action" },
        },
        {
          className: "quick-action-preview-card-current-strip",
          dataset: { currentMetaRole: "summary" },
          text: "待确认",
        },
        {
          text: "待确认",
          tone: "warm",
          dataset: { actionIntensity: "strong", quickAction: "委托", currentMetaRole: "state" },
        },
      ],
      historyOptions: null,
      fieldViewOptions: null,
    },
  );
});

test("buildQuickActionPreviewCardPillSectionsDomSpec: 按 label 顺序生成 pill 分区规格", serial, () => {
  const spec = buildQuickActionPreviewCardPillsDomSpec({
    action: "整理",
    previewState: "已归档",
    history: [{ fields: [{ label: "主题", value: "旧" }] }, { fields: [{ label: "主题", value: "新" }] }],
    selectedHistoryIndex: 1,
    selectedFieldView: "snapshot",
    fieldViewLabel: "原始快照",
    historyLabel: "最新轮",
    hasViewToggle: true,
  });
  assert.deepEqual(buildQuickActionPreviewCardPillSectionsDomSpec(spec), [
    {
      label: { className: "quick-action-preview-card-pills-label", dataset: { pillSection: "current" }, text: "当前" },
      group: {
        className: "quick-action-preview-card-pills-current",
        dataset: {},
        pills: spec.current,
      },
    },
    {
      label: { className: "quick-action-preview-card-pills-label", dataset: { pillSection: "history" }, text: "轮次" },
      group: {
        className: "quick-action-preview-card-pills-options",
        dataset: { optionKind: "history" },
        pills: spec.historyOptions.pills,
      },
    },
    {
      label: { className: "quick-action-preview-card-pills-label", dataset: { pillSection: "field-view" }, text: "视图" },
      group: {
        className: "quick-action-preview-card-pills-options",
        dataset: { optionKind: "field-view" },
        pills: spec.fieldViewOptions.pills,
      },
    },
  ]);
});

test("buildQuickActionPreviewCardPillSectionsDomSpec: 过滤空分区和未知 label", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewCardPillSectionsDomSpec({
      currentClassName: "current",
      optionClassName: "options",
      labels: [
        { className: "label", dataset: { pillSection: "current" }, text: "当前" },
        { className: "label", dataset: { pillSection: "history" }, text: "轮次" },
        { className: "label", dataset: { pillSection: "unknown" }, text: "未知" },
      ],
      current: [],
      historyOptions: { dataset: { optionKind: "history" }, pills: [] },
      fieldViewOptions: null,
    }),
    [],
  );
  assert.deepEqual(buildQuickActionPreviewCardPillSectionsDomSpec(null), []);
});

test("buildQuickActionPreviewCardPillSectionsRenderDomSpec: 组合分区并规范化 pill target", serial, () => {
  const pillsDomSpec = buildQuickActionPreviewCardPillsDomSpec({
    action: "整理",
    previewState: "已归档",
    history: [{ fields: [{ label: "主题", value: "旧" }] }, { fields: [{ label: "主题", value: "新" }] }],
    selectedHistoryIndex: 1,
    selectedFieldView: "snapshot",
    fieldViewLabel: "原始快照",
    historyLabel: "最新轮",
    currentStripText: "已归档",
    historyToggleTitle: "切到上一轮",
    nextHistoryIndex: 0,
    fieldViewToggleTitle: "切到阶段字段",
    nextFieldView: "stage",
    hasViewToggle: true,
  });
  const renderSpec = buildQuickActionPreviewCardPillSectionsRenderDomSpec(pillsDomSpec);
  assert.deepEqual(renderSpec.map((section) => section.label.text), ["当前", "轮次", "视图"]);
  assert.deepEqual(renderSpec[1].group.pills[0].actionTarget, {
    kind: "history",
    title: "第1轮 · 主题",
    snapshotIndex: 0,
  });
  assert.deepEqual(renderSpec[2].group.pills[0].actionTarget, {
    kind: "field-view",
    title: "切到已归档阶段字段",
    fieldView: "stage",
  });
});

test("buildQuickActionPreviewCardPillSectionsRenderDomSpec: 无效 action target 保持 null 且空输入安全", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewCardPillSectionsRenderDomSpec({
      currentClassName: "quick-action-preview-card-pills-current",
      optionClassName: "quick-action-preview-card-pills-options",
      labels: [{ className: "quick-action-preview-card-pills-label", dataset: { pillSection: "current" }, text: "当前" }],
      current: [{ text: "已归档", tone: "accent", action: { kind: "noop" } }],
      historyOptions: null,
      fieldViewOptions: null,
    }),
    [
      {
        label: { className: "quick-action-preview-card-pills-label", dataset: { pillSection: "current" }, text: "当前" },
        group: {
          className: "quick-action-preview-card-pills-current",
          dataset: {},
          pills: [{ text: "已归档", tone: "accent", action: { kind: "noop" }, actionTarget: null }],
        },
      },
    ],
  );
  assert.deepEqual(buildQuickActionPreviewCardPillSectionsRenderDomSpec(null), []);
});

test("quickActionPreviewCardPillActionTarget: 解析普通 preview card pill action target", serial, () => {
  assert.deepEqual(
    quickActionPreviewCardPillActionTarget({
      action: { kind: "history", title: "查看第 2 轮", snapshotIndex: 1 },
    }),
    { kind: "history", title: "查看第 2 轮", snapshotIndex: 1 },
  );

  assert.deepEqual(
    quickActionPreviewCardPillActionTarget({
      action: { kind: "field-view", title: "切换视图", fieldView: "stage" },
    }),
    { kind: "field-view", title: "切换视图", fieldView: "stage" },
  );
});

test("quickActionPreviewCardPillActionTarget: 过滤无效普通 preview card pill action", serial, () => {
  assert.equal(
    quickActionPreviewCardPillActionTarget({
      action: { kind: "history", title: "坏索引", snapshotIndex: -1 },
    }),
    null,
  );
  assert.equal(
    quickActionPreviewCardPillActionTarget({
      action: { kind: "field-view", title: "坏视图", fieldView: "detail" },
    }),
    null,
  );
  assert.equal(quickActionPreviewCardPillActionTarget({ action: { kind: "noop" } }), null);
  assert.equal(quickActionPreviewCardPillActionTarget(null), null);
});

test("buildQuickActionPreviewCardSheetDomSpec: 生成字段行和 notes DOM 规格", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewCardSheetDomSpec(
      {
        fields: [
          { label: "主题", value: "旧城公告" },
          { label: "处理人", value: "管理员" },
          { label: "空值", value: "" },
        ],
        notes: ["需要复核", "已同步"],
      },
      { maxFields: 2 },
    ),
    {
      wrapperClassName: "message-quick-sheet quick-action-preview-card-sheet",
      rowClassName: "message-quick-sheet-row quick-action-preview-card-row",
      labelClassName: "message-quick-sheet-label quick-action-preview-card-label",
      valueClassName: "message-quick-sheet-value quick-action-preview-card-value",
      rows: [
        { label: "主题", value: "旧城公告" },
        { label: "处理人", value: "管理员" },
      ],
      notes: {
        className: "message-quick-sheet-notes quick-action-preview-card-notes",
        text: "需要复核\n已同步",
      },
    },
  );
});

test("buildQuickActionPreviewCardSheetDomSpec: 无效字段和空 notes 安全过滤", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewCardSheetDomSpec({
      fields: [{ label: "主题", value: null }, null, { label: "", value: "忽略" }],
      notes: ["", "  "],
    }),
    {
      wrapperClassName: "message-quick-sheet quick-action-preview-card-sheet",
      rowClassName: "message-quick-sheet-row quick-action-preview-card-row",
      labelClassName: "message-quick-sheet-label quick-action-preview-card-label",
      valueClassName: "message-quick-sheet-value quick-action-preview-card-value",
      rows: [{ label: "主题", value: "" }],
      notes: null,
    },
  );
});

test("buildQuickActionPreviewCardSheetRenderDomSpec: 组合 sheet wrapper、字段行和 notes 节点规格", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewCardSheetRenderDomSpec({
      wrapperClassName: "message-quick-sheet quick-action-preview-card-sheet",
      rowClassName: "message-quick-sheet-row quick-action-preview-card-row",
      labelClassName: "message-quick-sheet-label quick-action-preview-card-label",
      valueClassName: "message-quick-sheet-value quick-action-preview-card-value",
      rows: [
        { label: "主题", value: "旧城公告" },
        { label: "处理人", value: "" },
      ],
      notes: {
        className: "message-quick-sheet-notes quick-action-preview-card-notes",
        text: "需要复核",
      },
    }),
    {
      wrapperClassName: "message-quick-sheet quick-action-preview-card-sheet",
      children: [
        {
          kind: "row",
          className: "message-quick-sheet-row quick-action-preview-card-row",
          label: {
            className: "message-quick-sheet-label quick-action-preview-card-label",
            text: "主题",
          },
          value: {
            className: "message-quick-sheet-value quick-action-preview-card-value",
            text: "旧城公告",
          },
        },
        {
          kind: "row",
          className: "message-quick-sheet-row quick-action-preview-card-row",
          label: {
            className: "message-quick-sheet-label quick-action-preview-card-label",
            text: "处理人",
          },
          value: {
            className: "message-quick-sheet-value quick-action-preview-card-value",
            text: "",
          },
        },
        {
          kind: "notes",
          className: "message-quick-sheet-notes quick-action-preview-card-notes",
          text: "需要复核",
        },
      ],
    },
  );
});

test("buildQuickActionPreviewCardSheetRenderDomSpec: 空 wrapper 或无内容返回 null", serial, () => {
  assert.equal(buildQuickActionPreviewCardSheetRenderDomSpec(null), null);
  assert.equal(
    buildQuickActionPreviewCardSheetRenderDomSpec({
      wrapperClassName: "",
      rows: [{ label: "主题", value: "旧城公告" }],
    }),
    null,
  );
  assert.equal(
    buildQuickActionPreviewCardSheetRenderDomSpec({
      wrapperClassName: "message-quick-sheet quick-action-preview-card-sheet",
      rows: [],
      notes: null,
    }),
    null,
  );
});

test("buildQuickActionPreviewHistoryControlsDomSpec: 多轮生成历史按钮区规格", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewHistoryControlsDomSpec(
      [{ fields: [{ label: "主题", value: "旧" }] }, { fields: [{ label: "主题", value: "新" }] }],
      1,
      { historyTitle: "历史记录" },
    ),
    {
      wrapperClassName: "quick-action-preview-history",
      hidden: true,
      attributes: { "aria-hidden": "true" },
      labelLine: {
        className: "quick-action-preview-history-label",
        text: "历史记录",
      },
      buttonsClassName: "quick-action-preview-history-buttons",
      buttons: [
        {
          type: "button",
          className: "quick-action-preview-history-button",
          dataset: { selected: "false", snapshotIndex: "0", snapshotRole: "history" },
          text: "第1轮 · 主题",
          title: "第1轮 · 主题",
          snapshotIndex: 0,
        },
        {
          type: "button",
          className: "quick-action-preview-history-button",
          dataset: { selected: "true", snapshotIndex: "1", snapshotRole: "latest" },
          text: "最新轮 · 主题",
          title: "最新轮（第2轮） · 主题",
          snapshotIndex: 1,
        },
      ],
    },
  );
});

test("buildQuickActionPreviewHistoryControlsDomSpec: 单轮或空历史返回 null", serial, () => {
  assert.equal(buildQuickActionPreviewHistoryControlsDomSpec([], 0), null);
  assert.equal(buildQuickActionPreviewHistoryControlsDomSpec([{ fields: [] }], 0), null);
});

test("buildQuickActionPreviewControlWrapperDomState: 折叠标记和规格 hidden 合并为 wrapper 状态", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewControlWrapperDomState(
      {
        wrapperClassName: "quick-action-preview-history",
        hidden: false,
        attributes: { "aria-hidden": "false", role: "group" },
      },
      "true",
    ),
    {
      className: "quick-action-preview-history",
      hidden: true,
      attributes: { "aria-hidden": "true", role: "group" },
    },
  );
  assert.deepEqual(
    buildQuickActionPreviewControlWrapperDomState(
      {
        wrapperClassName: "quick-action-preview-card-view",
        hidden: true,
        attributes: { "aria-hidden": "false" },
      },
      "false",
    ),
    {
      className: "quick-action-preview-card-view",
      hidden: true,
      attributes: { "aria-hidden": "true" },
    },
  );
});

test("buildQuickActionPreviewControlWrapperDomState: 展开时 aria-hidden 跟随可见状态", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewControlWrapperDomState(
      {
        wrapperClassName: "quick-action-preview-history",
        hidden: false,
        attributes: { "aria-hidden": "true" },
      },
      "false",
    ),
    {
      className: "quick-action-preview-history",
      hidden: false,
      attributes: { "aria-hidden": "false" },
    },
  );
  assert.equal(buildQuickActionPreviewControlWrapperDomState(null, "true"), null);
});

test("buildQuickActionPreviewControlPanelDomSpec: 组合历史控制区 wrapper、label 和按钮", serial, () => {
  const historyControls = buildQuickActionPreviewHistoryControlsDomSpec(
    [{ fields: [{ label: "主题", value: "旧" }] }, { fields: [{ label: "主题", value: "新" }] }],
    0,
    { historyTitle: "历史记录" },
  );
  assert.deepEqual(buildQuickActionPreviewControlPanelDomSpec(historyControls, "false"), {
    wrapper: {
      className: "quick-action-preview-history",
      hidden: true,
      attributes: { "aria-hidden": "true" },
    },
    labelLine: {
      className: "quick-action-preview-history-label",
      text: "历史记录",
    },
    buttonsClassName: "quick-action-preview-history-buttons",
    buttons: historyControls.buttons,
  });
});

test("buildQuickActionPreviewControlPanelDomSpec: 组合字段视图控制区并过滤空输入", serial, () => {
  const fieldViewControls = buildQuickActionPreviewFieldViewControlsDomSpec(true, "stage", {
    previewState: "已整理",
    historyLabel: "第2轮",
  });
  assert.deepEqual(buildQuickActionPreviewControlPanelDomSpec(fieldViewControls, "false"), {
    wrapper: {
      className: "quick-action-preview-card-view",
      hidden: true,
      attributes: { "aria-hidden": "true" },
    },
    labelLine: null,
    buttonsClassName: "",
    buttons: fieldViewControls.buttons,
  });
  assert.equal(buildQuickActionPreviewControlPanelDomSpec(null, "true"), null);
});

test("buildQuickActionPreviewControlPanelRenderDomSpec: 组合控制区并规范化按钮", serial, () => {
  const historyControls = buildQuickActionPreviewHistoryControlsDomSpec(
    [{ fields: [{ label: "主题", value: "旧" }] }, { fields: [{ label: "主题", value: "新" }] }],
    1,
    { historyTitle: "历史记录" },
  );
  const renderSpec = buildQuickActionPreviewControlPanelRenderDomSpec(historyControls, "false", "history");
  assert.deepEqual(renderSpec.wrapper, {
    className: "quick-action-preview-history",
    hidden: true,
    attributes: { "aria-hidden": "true" },
  });
  assert.deepEqual(renderSpec.labelLine, {
    className: "quick-action-preview-history-label",
    text: "历史记录",
  });
  assert.equal(renderSpec.buttonsClassName, "quick-action-preview-history-buttons");
  assert.deepEqual(renderSpec.buttons.map((button) => button.source), [{ snapshotIndex: 0 }, { snapshotIndex: 1 }]);
  assert.deepEqual(renderSpec.buttons.map((button) => button.actionTarget), [
    { kind: "history", title: "第1轮 · 主题", snapshotIndex: 0 },
    { kind: "history", title: "最新轮（第2轮） · 主题", snapshotIndex: 1 },
  ]);
  assert.deepEqual(renderSpec.buttons[1].dataset, {
    selected: "true",
    snapshotIndex: "1",
    snapshotRole: "latest",
  });
});

test("buildQuickActionPreviewControlPanelRenderDomSpec: 空按钮过滤且空输入安全", serial, () => {
  const fieldViewControls = buildQuickActionPreviewFieldViewControlsDomSpec(true, "snapshot", {
    previewState: "已归档",
    historyLabel: "已归档",
  });
  fieldViewControls.buttons.push(null);
  const renderSpec = buildQuickActionPreviewControlPanelRenderDomSpec(fieldViewControls, "true", "field-view");
  assert.equal(renderSpec.wrapper.hidden, true);
  assert.deepEqual(renderSpec.buttons.map((button) => button.source), [
    { fieldView: "stage" },
    { fieldView: "snapshot" },
  ]);
  assert.deepEqual(renderSpec.buttons.map((button) => button.actionTarget), [
    { kind: "field-view", title: "切到已归档阶段字段", fieldView: "stage" },
    { kind: "field-view", title: "切到已归档的原始快照字段", fieldView: "snapshot" },
  ]);
  assert.equal(buildQuickActionPreviewControlPanelRenderDomSpec(null, "true"), null);
});

test("buildQuickActionPreviewControlPanelsRenderDomSpec: 组合 history 与 field-view 控制面板", serial, () => {
  const historyControls = buildQuickActionPreviewHistoryControlsDomSpec(
    [{ fields: [{ label: "主题", value: "旧" }] }, { fields: [{ label: "主题", value: "新" }] }],
    1,
    { historyTitle: "历史记录" },
  );
  const fieldViewControls = buildQuickActionPreviewFieldViewControlsDomSpec(true, "snapshot", {
    previewState: "已归档",
    historyLabel: "第2轮",
  });

  const panels = buildQuickActionPreviewControlPanelsRenderDomSpec({
    historyControls,
    historyCollapsed: "false",
    fieldViewControls,
    fieldViewCollapsed: "true",
  });

  assert.equal(panels.length, 2);
  assert.equal(panels[0].kind, "history");
  assert.equal(panels[0].wrapper.className, "quick-action-preview-history");
  assert.equal(panels[0].labelLine.text, "历史记录");
  assert.equal(panels[0].buttonsClassName, "quick-action-preview-history-buttons");
  assert.deepEqual(panels[0].buttons.map((button) => button.actionTarget?.kind), ["history", "history"]);

  assert.equal(panels[1].kind, "field-view");
  assert.equal(panels[1].wrapper.className, "quick-action-preview-card-view");
  assert.equal(panels[1].wrapper.hidden, true);
  assert.deepEqual(panels[1].buttons.map((button) => button.actionTarget?.fieldView), ["stage", "snapshot"]);
});

test("buildQuickActionPreviewCardRenderDomSpec: 组合普通 preview card 渲染规格", serial, () => {
  const history = [
    {
      stage: "draft",
      state: "草稿",
      fields: [{ label: "主题", value: "旧主题" }],
    },
    {
      stage: "review",
      state: "复核",
      fields: [{ label: "主题", value: "新主题" }],
      notes: ["补充约束"],
    },
  ];
  const structured = {
    fields: [{ label: "主题", value: "新主题" }],
    notes: ["补充约束"],
  };
  const model = buildQuickActionPreviewCardModel("整理", "已归档", structured, {
    history,
    selectedHistoryIndex: 1,
    fieldView: "snapshot",
    followUpCopy: "继续整理",
  });

  const spec = buildQuickActionPreviewCardRenderDomSpec({
    action: "整理",
    previewState: "已归档",
    previewCardModel: model,
    className: "message-preview",
    title: "阶段预览",
    historyLabel: "第 2 轮",
    historyTitle: "历史快照 · 2 轮",
    followUpCopy: "继续整理",
  });

  assert.deepEqual(spec.card.classNames, ["quick-action-preview-card", "message-preview"]);
  assert.deepEqual(spec.card.dataset, {
    actionIntensity: "steady",
    quickAction: "整理",
    previewState: "已归档",
    previewHistoryControlsCollapsed: "true",
    previewFieldViewControlsCollapsed: "true",
  });
  assert.equal(spec.header.kickerLine.text, "阶段预览");
  assert.equal(spec.header.titleLine.text, "整理 · 已归档");
  assert.equal(spec.pillsWrapperClassName, "quick-action-preview-card-pills");
  assert.equal(spec.pillSections.length, 3);
  assert.equal(spec.copy.text, "主题：新主题");
  assert.equal(spec.controlPanels.length, 2);
  assert.equal(spec.controlPanels[0].kind, "history");
  assert.equal(spec.controlPanels[1].kind, "field-view");
  assert.equal(spec.sheet.children.at(-1).kind, "notes");
  assert.equal(spec.sheet.children.at(-1).text, "补充约束");
});

test("buildQuickActionPreviewCardRenderDomSpec: 缺少模型或 activeStructured 时返回 null", serial, () => {
  assert.equal(buildQuickActionPreviewCardRenderDomSpec(null), null);
  assert.equal(
    buildQuickActionPreviewCardRenderDomSpec({
      action: "整理",
      previewState: "复核",
      previewCardModel: { activeStructured: null },
    }),
    null,
  );
});

test("buildQuickActionPreviewControlButtonDomSpec: 规范化 history 控制按钮属性", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewControlButtonDomSpec({
      type: "button",
      className: "quick-action-preview-history-button",
      dataset: { selected: "true", snapshotIndex: "1", snapshotRole: "latest" },
      text: "最新轮 · 主题",
      title: "最新轮（第2轮） · 主题",
      snapshotIndex: 1,
    }),
    {
      type: "button",
      className: "quick-action-preview-history-button",
      dataset: { selected: "true", snapshotIndex: "1", snapshotRole: "latest" },
      text: "最新轮 · 主题",
      title: "最新轮（第2轮） · 主题",
      source: {
        snapshotIndex: 1,
      },
    },
  );
});

test("buildQuickActionPreviewControlButtonDomSpec: 字段视图按钮安全默认并保留 target 字段", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewControlButtonDomSpec({
      dataset: { selected: "false", previewFieldView: "stage" },
      text: "阶段字段",
      title: "切到阶段字段",
      fieldView: "stage",
    }),
    {
      type: "button",
      className: "",
      dataset: { selected: "false", previewFieldView: "stage" },
      text: "阶段字段",
      title: "切到阶段字段",
      source: {
        fieldView: "stage",
      },
    },
  );
  assert.equal(buildQuickActionPreviewControlButtonDomSpec(null), null);
});

test("quickActionPreviewCardControlActionTarget: 解析普通 preview card 控制按钮 target", serial, () => {
  assert.deepEqual(
    quickActionPreviewCardControlActionTarget({ snapshotIndex: 2, title: "第 3 轮" }, "history"),
    { kind: "history", title: "第 3 轮", snapshotIndex: 2 },
  );
  assert.deepEqual(
    quickActionPreviewCardControlActionTarget(
      buildQuickActionPreviewControlButtonDomSpec({
        snapshotIndex: 1,
        title: "最新轮",
      }),
      "history",
    ),
    { kind: "history", title: "最新轮", snapshotIndex: 1 },
  );
  assert.deepEqual(
    quickActionPreviewCardControlActionTarget({ fieldView: "snapshot", title: "原始快照" }, "field-view"),
    { kind: "field-view", title: "原始快照", fieldView: "snapshot" },
  );
  assert.deepEqual(
    quickActionPreviewCardControlActionTarget(
      buildQuickActionPreviewControlButtonDomSpec({
        fieldView: "stage",
        title: "阶段字段",
      }),
      "field-view",
    ),
    { kind: "field-view", title: "阶段字段", fieldView: "stage" },
  );
});

test("quickActionPreviewCardControlActionTarget: 过滤无效普通 preview card 控制按钮 target", serial, () => {
  assert.equal(quickActionPreviewCardControlActionTarget({ snapshotIndex: -1 }, "history"), null);
  assert.equal(quickActionPreviewCardControlActionTarget({ fieldView: "detail" }, "field-view"), null);
  assert.equal(quickActionPreviewCardControlActionTarget({ snapshotIndex: 0 }, "noop"), null);
  assert.equal(quickActionPreviewCardControlActionTarget(null, "history"), null);
});

test("buildQuickActionPreviewFieldViewControlsDomSpec: 生成字段视图按钮区规格", serial, () => {
  assert.deepEqual(
    buildQuickActionPreviewFieldViewControlsDomSpec(true, "snapshot", {
      previewState: "已归档",
      historyLabel: "最新轮",
    }),
    {
      wrapperClassName: "quick-action-preview-card-view",
      hidden: true,
      attributes: { "aria-hidden": "true" },
      buttons: [
        {
          type: "button",
          dataset: {
            selected: "false",
            previewFieldView: "stage",
          },
          text: "阶段字段",
          title: "切到已归档阶段字段",
          fieldView: "stage",
        },
        {
          type: "button",
          dataset: {
            selected: "true",
            previewFieldView: "snapshot",
          },
          text: "原始快照",
          title: "切到最新轮的原始快照字段",
          fieldView: "snapshot",
        },
      ],
    },
  );
});

test("buildQuickActionPreviewFieldViewControlsDomSpec: 无切换时返回 null", serial, () => {
  assert.equal(buildQuickActionPreviewFieldViewControlsDomSpec(false, "snapshot"), null);
});

// ====== buildQuickActionInlinePreviewCardModel ======

test("buildQuickActionInlinePreviewCardModel: 最新轮优先阶段字段并使用 followUpCopy 摘要", serial, () => {
  const model = buildQuickActionInlinePreviewCardModel({
    preview: {
      action: "整理",
      state: "已归档",
      structured: { fields: [{ label: "主题", value: "新记录" }] },
      history: [{ id: 1 }, { id: 2 }],
      snapshotIndex: 1,
      followUpCopy: "继续整理",
    },
    resolvedPreviewView: { fieldView: "" },
    selectedFieldView: "",
    previewField: "主题：新记录",
  });
  assert.equal(model.fieldView, "stage");
  assert.equal(model.summary, "继续整理");
  assert.equal(model.history.length, 2);
  assert.ok(model.fieldSets.hasViewToggle);
  assert.ok(model.fields.length >= 1);
});

test("buildQuickActionInlinePreviewCardModel: 历史轮默认 snapshot 字段", serial, () => {
  const model = buildQuickActionInlinePreviewCardModel({
    preview: {
      action: "整理",
      state: "已归档",
      structured: { fields: [{ label: "主题", value: "旧记录" }] },
      history: [{ id: 1 }, { id: 2 }],
      snapshotIndex: 0,
      followUpCopy: "继续整理",
    },
    previewField: "主题：旧记录",
  });
  assert.equal(model.fieldView, "snapshot");
  assert.equal(model.summary, "主题：旧记录");
});

test("buildQuickActionInlinePreviewCardModel: 显式 resolved fieldView 优先", serial, () => {
  const model = buildQuickActionInlinePreviewCardModel({
    preview: {
      action: "整理",
      state: "已归档",
      structured: { fields: [{ label: "主题", value: "记录" }] },
      history: [{ id: 1 }],
      snapshotIndex: 0,
      followUpCopy: "继续整理",
    },
    resolvedPreviewView: { fieldView: "snapshot" },
    selectedFieldView: "stage",
    previewField: "主题：记录",
  });
  assert.equal(model.fieldView, "snapshot");
});

test("buildQuickActionInlinePreviewCardModel: 缺少 preview 返回 null", serial, () => {
  assert.equal(buildQuickActionInlinePreviewCardModel({ preview: null }), null);
});

test("buildQuickActionInlinePreviewCardDomModel: 生成 inline card 容器和 dataset flag 规格", serial, () => {
  const model = buildQuickActionInlinePreviewCardDomModel({
    actionIntensity: "strong",
    meta: {
      historyControlsCollapsed: "true",
      fieldViewControlsCollapsed: "false",
    },
  });
  assert.equal(model.className, "room-inline-preview-card");
  assert.deepEqual(model.dataset, { actionIntensity: "strong" });
  assert.deepEqual(model.datasetFlags, {
    inlineHistoryControlsCollapsed: "true",
    inlineFieldViewControlsCollapsed: "false",
  });
});

test("buildQuickActionInlinePreviewCardDomModel: 空 intensity 和缺失 meta 使用安全默认", serial, () => {
  const model = buildQuickActionInlinePreviewCardDomModel({
    actionIntensity: "  ",
  });
  assert.deepEqual(model.dataset, {});
  assert.deepEqual(model.datasetFlags, {
    inlineHistoryControlsCollapsed: "false",
    inlineFieldViewControlsCollapsed: "false",
  });
});

// ====== buildQuickActionInlinePreviewRenderModel ======

test("buildQuickActionInlinePreviewRenderModel: 组合 inline card 渲染所需纯模型", serial, () => {
  const history = [
    { fields: [{ label: "主题", value: "旧记录" }] },
    { fields: [{ label: "主题", value: "新记录" }] },
  ];
  const model = buildQuickActionInlinePreviewRenderModel({
    preview: {
      action: "整理",
      state: "已归档",
      structured: { fields: [{ label: "主题", value: "新记录" }] },
      history,
      snapshotIndex: 1,
      historyLabel: "最新轮",
      followUpCopy: "继续整理",
    },
    selectedFieldView: "stage",
    previewField: "主题：新记录",
    viewingLatest: true,
  });
  assert.equal(model.card.fieldView, "stage");
  assert.equal(model.cardDom.className, "room-inline-preview-card");
  assert.deepEqual(model.cardDom.dataset, { actionIntensity: "steady" });
  assert.deepEqual(model.cardDom.datasetFlags, {
    inlineHistoryControlsCollapsed: "true",
    inlineFieldViewControlsCollapsed: "true",
  });
  assert.equal(model.header.summaryText, "继续整理");
  assert.equal(model.meta.currentStripText, "已归档 · 最新轮 · 阶段字段");
  assert.deepEqual(model.metaSections.sections.map((section) => section.id), [
    "current",
    "history",
    "field-view",
  ]);
  assert.equal(model.controls.historyButtons.length, 2);
  assert.equal(model.fieldRows.rows[0].label, "回看");
  assert.deepEqual(model.actions.actions.map((action) => action.id), ["snapshot", "workflow"]);
});

test("buildQuickActionInlinePreviewRenderModel: 缺少 card 输入返回 null", serial, () => {
  assert.equal(buildQuickActionInlinePreviewRenderModel({ preview: null }), null);
});

test("buildQuickActionInlinePreviewCardRenderDomModel: 组合 inline card DOM render 规格", serial, () => {
  const history = [
    { fields: [{ label: "主题", value: "旧记录" }] },
    { fields: [{ label: "主题", value: "新记录" }] },
  ];
  const renderModel = buildQuickActionInlinePreviewRenderModel({
    preview: {
      action: "整理",
      state: "已归档",
      structured: { fields: [{ label: "主题", value: "新记录" }] },
      history,
      snapshotIndex: 1,
      historyLabel: "最新轮",
      followUpCopy: "继续整理",
    },
    selectedFieldView: "stage",
    previewField: "主题：新记录",
    viewingLatest: true,
  });
  const model = buildQuickActionInlinePreviewCardRenderDomModel(renderModel);

  assert.equal(model.card.className, "room-inline-preview-card");
  assert.equal(model.header.lines[0].key, "stage");
  assert.equal(model.header.lines[1].key, "summary");
  assert.equal(model.meta.className, "room-inline-preview-card-meta");
  assert.deepEqual(model.meta.sections.map((section) => section.id), [
    "current",
    "history",
    "field-view",
  ]);
  assert.equal(model.controls.groups.length, 2);
  assert.deepEqual(model.controls.groups[0].buttons[0].actionTarget, {
    type: "history",
    snapshotIndex: 0,
  });
  assert.equal(model.fieldRows.rows[0].children[0].label, "回看");
  assert.deepEqual(model.actions.buttons.map((button) => button.actionTarget?.type), [
    "snapshot",
    "workflow",
  ]);
  assert.deepEqual(
    model.children.map((child) => `${child.kind}${child.placement ? ":" + child.placement : ""}`),
    ["header:before-meta", "meta", "header:after-meta", "controls", "fieldRows", "actions"],
  );
  assert.equal(model.children[0].children[0].text, "已归档");
  assert.equal(model.children[2].children[0].text, "继续整理");
});

test("buildQuickActionInlinePreviewCardRenderDomModel: 缺少 render model 时返回 null", serial, () => {
  assert.equal(buildQuickActionInlinePreviewCardRenderDomModel(null), null);
  assert.equal(buildQuickActionInlinePreviewCardRenderDomModel({ cardDom: null }), null);
});

// ====== buildQuickActionInlinePreviewPanelModel ======

test("buildQuickActionInlinePreviewPanelModel: 组合 hint 与 card render model", serial, () => {
  const history = [
    { fields: [{ label: "主题", value: "旧记录" }] },
    { fields: [{ label: "主题", value: "新记录" }] },
  ];
  const model = buildQuickActionInlinePreviewPanelModel({
    preview: {
      action: "整理",
      state: "已归档",
      structured: { fields: [{ label: "主题", value: "新记录" }] },
      history,
      snapshotIndex: 1,
      historyLabel: "最新轮",
      followUpCopy: "继续整理",
      historyToneClass: "summary-round",
    },
    previewField: "主题：新记录",
    selectedFieldView: "stage",
    viewingLatest: true,
  });
  assert.equal(model.hint.stage.label, "已归档");
  assert.equal(model.hint.field.label, "主题：新记录");
  assert.equal(model.render.header.summaryText, "继续整理");
  assert.equal(model.render.controls.historyButtons.length, 2);
});

test("buildQuickActionInlinePreviewPanelModel: 缺少 hint 或 render 输入返回 null", serial, () => {
  assert.equal(
    buildQuickActionInlinePreviewPanelModel({
      preview: { action: "整理", state: "已归档", structured: { fields: [] } },
      previewField: "",
    }),
    null,
  );
  assert.equal(buildQuickActionInlinePreviewPanelModel({ preview: null, previewField: "主题：记录" }), null);
});

test("buildQuickActionInlinePreviewPanelRenderDomModel: 组合 hint 与 card render DOM model", serial, () => {
  const history = [
    { fields: [{ label: "主题", value: "旧记录" }] },
    { fields: [{ label: "主题", value: "新记录" }] },
  ];
  const panelModel = buildQuickActionInlinePreviewPanelModel({
    preview: {
      action: "整理",
      state: "已归档",
      structured: { fields: [{ label: "主题", value: "新记录" }] },
      history,
      snapshotIndex: 1,
      historyLabel: "最新轮",
      followUpCopy: "继续整理",
    },
    previewField: "主题：新记录",
    selectedFieldView: "stage",
    viewingLatest: true,
  });
  const model = buildQuickActionInlinePreviewPanelRenderDomModel(panelModel, "steady");

  assert.equal(model.hint.className, "room-inline-preview-hint");
  assert.deepEqual(model.hint.dataset, { actionIntensity: "steady" });
  assert.equal(model.card.card.className, "room-inline-preview-card");
  assert.equal(model.card.header.lines[0].key, "stage");
  assert.equal(model.card.meta.sections[0].id, "current");
  assert.equal(model.card.controls.groups.length, 2);
  assert.equal(model.card.fieldRows.rows[0].children[0].label, "回看");
  assert.deepEqual(model.card.actions.buttons.map((button) => button.actionTarget?.type), [
    "snapshot",
    "workflow",
  ]);
});

test("buildQuickActionInlinePreviewPanelRenderDomModel: 缺少 panel 输入返回 null", serial, () => {
  assert.equal(buildQuickActionInlinePreviewPanelRenderDomModel(null, "steady"), null);
  assert.equal(buildQuickActionInlinePreviewPanelRenderDomModel({ hint: null, render: {} }, "steady"), null);
});

test("buildQuickActionInlinePreviewPanelModel: 可从 resolved preview view 推导主字段", serial, () => {
  const model = buildQuickActionInlinePreviewPanelModel({
    preview: {
      action: "整理",
      state: "已归档",
      structured: { fields: [{ label: "主题", value: "新记录" }] },
      history: [{ fields: [{ label: "主题", value: "新记录" }] }],
      snapshotIndex: 0,
      historyLabel: "最新轮",
      followUpCopy: "继续整理",
    },
    resolvedPreviewView: {
      fieldView: "stage",
      primaryFieldText: "主题：新记录",
    },
    selectedFieldView: "stage",
    viewingLatest: true,
  });
  assert.equal(model.hint.field.label, "主题：新记录");
  assert.equal(model.render.header.summaryText, "继续整理");
});

test("buildQuickActionInlinePreviewPanelModel: 未传 viewingLatest 时从历史快照推导", serial, () => {
  const model = buildQuickActionInlinePreviewPanelModel({
    preview: {
      action: "整理",
      state: "已归档",
      structured: { fields: [{ label: "主题", value: "旧记录" }] },
      history: [
        { fields: [{ label: "主题", value: "旧记录" }] },
        { fields: [{ label: "主题", value: "新记录" }] },
      ],
      snapshotIndex: 0,
      historyLabel: "第一轮",
      followUpCopy: "继续整理",
    },
    resolvedPreviewView: {
      fieldView: "snapshot",
      primaryFieldText: "主题：旧记录",
    },
    selectedFieldView: "snapshot",
  });
  assert.equal(quickActionPreviewViewingLatest({ history: [{}, {}], snapshotIndex: 0 }), false);
  assert.equal(model.render.actions.actions[0].id, "snapshot");
  assert.ok(model.render.actions.actions[0].title.includes("回看第一轮"));
});

// ====== buildQuickActionInlinePreviewMetaModel ======

test("buildQuickActionInlinePreviewMetaModel: 生成当前、轮次、视图 pill 规则", serial, () => {
  const history = [
    { fields: [{ label: "主题", value: "旧记录" }] },
    { fields: [{ label: "主题", value: "新记录" }] },
  ];
  const model = buildQuickActionInlinePreviewMetaModel({
    preview: {
      action: "整理",
      state: "已归档",
      history,
      snapshotIndex: 0,
      historyLabel: "第1轮",
    },
    history,
    fieldView: "snapshot",
    hasViewToggle: true,
  });
  assert.equal(model.currentStripText, "已归档 · 第1轮 · 原始快照");
  assert.deepEqual(model.currentPills.map((pill) => pill.label), ["已归档", "第1轮", "原始快照"]);
  assert.deepEqual(model.currentPills[1].dataset, {
    previewMeta: "history",
    currentMetaRole: "history",
    snapshotIndex: "0",
    snapshotRole: "history",
    selected: "true",
  });
  assert.equal(model.currentPills[1].action.type, "history");
  assert.equal(model.currentPills[1].action.snapshotIndex, 1);
  assert.equal(model.currentPills[1].action.title, "最新轮（第2轮） · 主题");
  assert.deepEqual(model.historyOptions.map((pill) => pill.dataset.selected), ["true", "false"]);
  assert.equal(model.historyOptions[1].dataset.snapshotRole, "latest");
  assert.deepEqual(model.fieldViewOptions.map((pill) => pill.dataset.selected), ["false", "true"]);
  assert.equal(model.currentPills[2].action.nextFieldView, "stage");
  assert.equal(model.currentPills[2].action.title, "切到已归档阶段字段");
  assert.equal(model.historyControlsCollapsed, "true");
  assert.equal(model.fieldViewControlsCollapsed, "true");
});

test("buildQuickActionInlinePreviewMetaModel: 单轮无切换时只保留当前 pill", serial, () => {
  const history = [{ fields: [{ label: "主题", value: "记录" }] }];
  const model = buildQuickActionInlinePreviewMetaModel({
    preview: {
      action: "整理",
      state: "已归档",
      history,
      snapshotIndex: 0,
      historyLabel: "最新轮",
    },
    history,
    fieldView: "stage",
    hasViewToggle: false,
  });
  assert.equal(model.currentStripText, "已归档 · 最新轮 · 阶段字段");
  assert.equal(model.currentPills.length, 3);
  assert.equal(model.currentPills[1].action, null);
  assert.deepEqual(model.historyOptions, []);
  assert.deepEqual(model.fieldViewOptions, []);
  assert.equal(model.historyControlsCollapsed, "false");
  assert.equal(model.fieldViewControlsCollapsed, "false");
});

// ====== buildQuickActionInlinePreviewMetaSectionsModel ======

test("buildQuickActionInlinePreviewMetaSectionsModel: 按固定顺序组装非空 meta 分区", serial, () => {
  const model = buildQuickActionInlinePreviewMetaSectionsModel({
    currentPills: [{ label: "已归档" }],
    historyOptions: [{ label: "第1轮" }],
    fieldViewOptions: [{ label: "阶段字段" }],
  });
  assert.deepEqual(model.sections, [
    { id: "current", label: "当前", pills: [{ label: "已归档" }] },
    { id: "history", label: "轮次", pills: [{ label: "第1轮" }] },
    { id: "field-view", label: "视图", pills: [{ label: "阶段字段" }] },
  ]);
  assert.equal(model.hasSections, true);
});

test("buildQuickActionInlinePreviewMetaSectionsModel: 过滤空分区且空输入返回无分区", serial, () => {
  assert.deepEqual(
    buildQuickActionInlinePreviewMetaSectionsModel({
      currentPills: [],
      historyOptions: [{ label: "第1轮" }],
      fieldViewOptions: [],
    }),
    {
      sections: [{ id: "history", label: "轮次", pills: [{ label: "第1轮" }] }],
      hasSections: true,
    },
  );
  assert.deepEqual(buildQuickActionInlinePreviewMetaSectionsModel(null), {
    sections: [],
    hasSections: false,
  });
});

test("buildQuickActionInlinePreviewMetaDomModel: 生成 meta 分区 DOM 规格", serial, () => {
  const model = buildQuickActionInlinePreviewMetaDomModel({
    sections: [
      {
        id: "current",
        label: "当前",
        pills: [
          {
            label: "已归档",
            kind: "state",
            dataset: { previewMeta: "state", currentMetaRole: "state" },
          },
        ],
      },
      {
        id: "history",
        label: "轮次",
        pills: [
          {
            label: "第1轮",
            kind: "history",
            dataset: { snapshotIndex: "0", selected: "true" },
            action: { type: "history", snapshotIndex: 0, title: "第1轮" },
          },
        ],
      },
    ],
    hasSections: true,
  }, "已归档 · 第1轮 · 原始快照");
  assert.equal(model.className, "room-inline-preview-card-meta");
  assert.deepEqual(model.sections.map((section) => section.id), ["current", "history"]);
  assert.equal(model.sections[0].container.className, "room-inline-preview-card-meta-current");
  assert.deepEqual(model.sections[0].container.currentStrip, {
    className: "room-inline-preview-card-current-strip",
    dataset: { currentMetaRole: "summary" },
    label: "已归档 · 第1轮 · 原始快照",
  });
  assert.deepEqual(model.sections[1].labelNode, {
    className: "room-inline-preview-card-meta-label",
    dataset: { metaSection: "history" },
    label: "轮次",
  });
  assert.equal(model.sections[1].container.className, "room-inline-preview-card-meta-options");
  assert.deepEqual(model.sections[1].container.dataset, { optionKind: "history" });
  assert.deepEqual(model.sections[1].pills[0], {
    className: "room-inline-preview-card-meta-pill",
    label: "第1轮",
    dataset: {
      metaKind: "history",
      snapshotIndex: "0",
      selected: "true",
    },
    action: { type: "history", snapshotIndex: 0, title: "第1轮" },
  });
});

test("buildQuickActionInlinePreviewMetaDomModel: 无分区时返回 null 并过滤空 pill", serial, () => {
  assert.equal(buildQuickActionInlinePreviewMetaDomModel({ sections: [], hasSections: false }), null);
  const model = buildQuickActionInlinePreviewMetaDomModel({
    sections: [
      {
        id: "field-view",
        label: "视图",
        pills: [null, { label: "", kind: "bad" }, { label: "阶段字段", kind: "field-view" }],
      },
    ],
    hasSections: true,
  });
  assert.equal(model.sections.length, 1);
  assert.equal(model.sections[0].pills.length, 1);
  assert.equal(model.sections[0].pills[0].dataset.metaKind, "field-view");
});

test("buildQuickActionInlinePreviewMetaRenderDomModel: 预解析 meta pill action target 与 clickable 规格", serial, () => {
  const model = buildQuickActionInlinePreviewMetaRenderDomModel({
    sections: [
      {
        id: "history",
        label: "轮次",
        pills: [
          {
            label: "第1轮",
            kind: "history",
            dataset: { snapshotIndex: "0" },
            action: { type: "history", snapshotIndex: 0, title: "切到第1轮" },
          },
        ],
      },
      {
        id: "field-view",
        label: "视图",
        pills: [
          {
            label: "阶段字段",
            kind: "field-view",
            dataset: { fieldView: "stage" },
            action: { type: "field-view", fieldView: "stage", title: "切到阶段字段" },
          },
        ],
      },
    ],
    hasSections: true,
  });

  assert.equal(model.className, "room-inline-preview-card-meta");
  assert.deepEqual(model.sections[0].pills[0].actionTarget, {
    type: "history",
    title: "切到第1轮",
    snapshotIndex: 0,
  });
  assert.deepEqual(model.sections[0].pills[0].clickable, {
    classNames: ["is-clickable"],
    tabIndex: 0,
    attributes: {
      role: "button",
      title: "切到第1轮",
      "aria-label": "切到第1轮",
    },
  });
  assert.deepEqual(model.sections[1].pills[0].actionTarget, {
    type: "field-view",
    title: "切到阶段字段",
    fieldView: "stage",
  });
  assert.deepEqual(model.sections[0].children, [
    {
      type: "span",
      className: "room-inline-preview-card-meta-label",
      dataset: { metaSection: "history" },
      text: "轮次",
    },
    {
      type: "div",
      className: "room-inline-preview-card-meta-options",
      dataset: { optionKind: "history" },
      children: [
        {
          type: "span",
          className: "room-inline-preview-card-meta-pill",
          dataset: { metaKind: "history", snapshotIndex: "0" },
          text: "第1轮",
          actionTarget: {
            type: "history",
            title: "切到第1轮",
            snapshotIndex: 0,
          },
          clickable: {
            classNames: ["is-clickable"],
            tabIndex: 0,
            attributes: {
              role: "button",
              title: "切到第1轮",
              "aria-label": "切到第1轮",
            },
          },
        },
      ],
    },
  ]);
});

test("buildQuickActionInlinePreviewMetaRenderDomModel: 无效 action 不生成 clickable 规格", serial, () => {
  const model = buildQuickActionInlinePreviewMetaRenderDomModel({
    sections: [
      {
        id: "field-view",
        label: "视图",
        pills: [
          {
            label: "异常视图",
            kind: "field-view",
            action: { type: "field-view", fieldView: "bad", title: "异常" },
          },
        ],
      },
    ],
    hasSections: true,
  });

  assert.equal(model.sections[0].pills[0].actionTarget, null);
  assert.equal(model.sections[0].pills[0].clickable, null);
  assert.equal(buildQuickActionInlinePreviewMetaRenderDomModel({ sections: [], hasSections: false }), null);
});

test("quickActionInlinePreviewMetaActionTarget: 解析 history 和 field-view action target", serial, () => {
  assert.deepEqual(
    quickActionInlinePreviewMetaActionTarget({
      type: "history",
      title: "第1轮",
      snapshotIndex: 0,
    }),
    {
      type: "history",
      title: "第1轮",
      snapshotIndex: 0,
    },
  );
  assert.deepEqual(
    quickActionInlinePreviewMetaActionTarget({
      type: "field-view",
      title: "切到阶段字段",
      fieldView: "stage",
    }),
    {
      type: "field-view",
      title: "切到阶段字段",
      fieldView: "stage",
    },
  );
});

test("quickActionInlinePreviewMetaActionTarget: 过滤无效 action target", serial, () => {
  assert.equal(quickActionInlinePreviewMetaActionTarget(null), null);
  assert.equal(quickActionInlinePreviewMetaActionTarget({ type: "history", snapshotIndex: -1 }), null);
  assert.equal(quickActionInlinePreviewMetaActionTarget({ type: "field-view", fieldView: "bad" }), null);
  assert.equal(quickActionInlinePreviewMetaActionTarget({ type: "unknown" }), null);
});

// ====== buildQuickActionInlinePreviewHeaderModel ======

test("buildQuickActionInlinePreviewHeaderModel: 组装顶部阶段与摘要文本", serial, () => {
  const model = buildQuickActionInlinePreviewHeaderModel({
    preview: { state: "已归档" },
    summary: "主题：新记录",
  });
  assert.deepEqual(model, {
    stageText: "已归档",
    summaryText: "主题：新记录",
    hasStage: true,
    hasSummary: true,
  });
});

test("buildQuickActionInlinePreviewHeaderModel: 过滤空文本且空输入安全", serial, () => {
  assert.deepEqual(
    buildQuickActionInlinePreviewHeaderModel({
      preview: { state: "  " },
      summary: "  ",
    }),
    {
      stageText: "",
      summaryText: "",
      hasStage: false,
      hasSummary: false,
    },
  );
  assert.deepEqual(buildQuickActionInlinePreviewHeaderModel(null), {
    stageText: "",
    summaryText: "",
    hasStage: false,
    hasSummary: false,
  });
});

test("buildQuickActionInlinePreviewHeaderDomModel: 生成阶段和摘要 line DOM 规格", serial, () => {
  const model = buildQuickActionInlinePreviewHeaderDomModel({
    stageText: "已归档",
    summaryText: "主题：新记录",
    hasStage: true,
    hasSummary: true,
  });
  assert.deepEqual(model.lines, [
    {
      key: "stage",
      className: "room-inline-preview-card-stage",
      label: "已归档",
    },
    {
      key: "summary",
      className: "room-inline-preview-card-summary",
      label: "主题：新记录",
    },
  ]);
  assert.deepEqual(model.children, [
    {
      type: "div",
      key: "stage",
      placement: "before-meta",
      className: "room-inline-preview-card-stage",
      text: "已归档",
    },
    {
      type: "div",
      key: "summary",
      placement: "after-meta",
      className: "room-inline-preview-card-summary",
      text: "主题：新记录",
    },
  ]);
});

test("buildQuickActionInlinePreviewHeaderDomModel: 空标题返回 null 并过滤空行", serial, () => {
  assert.equal(
    buildQuickActionInlinePreviewHeaderDomModel({
      stageText: "",
      summaryText: "",
      hasStage: false,
      hasSummary: false,
    }),
    null,
  );
  const model = buildQuickActionInlinePreviewHeaderDomModel({
    stageText: "  ",
    summaryText: "仅摘要",
    hasStage: true,
    hasSummary: true,
  });
  assert.deepEqual(model.lines, [
    {
      key: "summary",
      className: "room-inline-preview-card-summary",
      label: "仅摘要",
    },
  ]);
});

// ====== buildQuickActionInlinePreviewControlsModel ======

test("buildQuickActionInlinePreviewControlsModel: 生成历史按钮和字段视图按钮规则", serial, () => {
  const history = [
    { fields: [{ label: "主题", value: "旧记录" }] },
    { fields: [{ label: "主题", value: "新记录" }] },
  ];
  const model = buildQuickActionInlinePreviewControlsModel({
    preview: {
      action: "整理",
      state: "已归档",
      snapshotIndex: 0,
      historyLabel: "第1轮",
    },
    history,
    fieldView: "snapshot",
    hasViewToggle: true,
  });
  assert.equal(model.historyHidden, true);
  assert.equal(model.historyAriaHidden, "true");
  assert.deepEqual(model.historyButtons.map((button) => button.label), ["第1轮 · 主题", "最新轮 · 主题"]);
  assert.deepEqual(model.historyButtons[0].dataset, {
    selected: "true",
    snapshotIndex: "0",
    snapshotRole: "history",
  });
  assert.equal(model.historyButtons[1].title, "最新轮（第2轮） · 主题");
  assert.equal(model.historyButtons[1].action.snapshotIndex, 1);
  assert.equal(model.fieldViewHidden, true);
  assert.equal(model.fieldViewAriaHidden, "true");
  assert.deepEqual(model.fieldViewButtons.map((button) => button.label), ["阶段字段", "原始快照"]);
  assert.deepEqual(model.fieldViewButtons[1].dataset, {
    roomInlinePreviewView: "snapshot",
    selected: "true",
  });
  assert.equal(model.fieldViewButtons[0].title, "切到已归档阶段字段");
  assert.equal(model.fieldViewButtons[0].action.fieldView, "stage");
});

test("buildQuickActionInlinePreviewControlsModel: 无多轮和无视图切换时返回空按钮组", serial, () => {
  const model = buildQuickActionInlinePreviewControlsModel({
    preview: {
      action: "整理",
      state: "已归档",
      snapshotIndex: 0,
      historyLabel: "最新轮",
    },
    history: [{ fields: [{ label: "主题", value: "记录" }] }],
    fieldView: "stage",
    hasViewToggle: false,
  });
  assert.equal(model.historyHidden, false);
  assert.equal(model.historyAriaHidden, "false");
  assert.deepEqual(model.historyButtons, []);
  assert.equal(model.fieldViewHidden, false);
  assert.equal(model.fieldViewAriaHidden, "false");
  assert.deepEqual(model.fieldViewButtons, []);
});

test("buildQuickActionInlinePreviewControlsDomModel: 生成历史和字段视图按钮 DOM 规格", serial, () => {
  const model = buildQuickActionInlinePreviewControlsDomModel({
    historyButtons: [
      {
        label: "第1轮 · 主题",
        title: "第1轮（第1轮） · 主题",
        dataset: { snapshotIndex: "0", selected: "true" },
        action: { type: "history", snapshotIndex: 0 },
      },
    ],
    historyHidden: true,
    historyAriaHidden: "true",
    fieldViewButtons: [
      {
        label: "阶段字段",
        title: "切到阶段字段",
        dataset: { roomInlinePreviewView: "stage", selected: "false" },
        action: { type: "field-view", fieldView: "stage" },
      },
    ],
    fieldViewHidden: true,
    fieldViewAriaHidden: "true",
  });
  assert.deepEqual(model.groups.map((group) => group.key), ["history", "field-view"]);
  assert.deepEqual(model.groups[0], {
    key: "history",
    className: "room-inline-preview-card-history",
    hidden: true,
    ariaHidden: "true",
    buttons: [
      {
        type: "button",
        label: "第1轮 · 主题",
        title: "第1轮（第1轮） · 主题",
        dataset: { snapshotIndex: "0", selected: "true" },
        action: { type: "history", snapshotIndex: 0 },
      },
    ],
  });
  assert.equal(model.groups[1].className, "room-inline-preview-card-view");
  assert.equal(model.groups[1].buttons[0].action.fieldView, "stage");
});

test("buildQuickActionInlinePreviewControlsDomModel: 空按钮组返回 null 并过滤空标签", serial, () => {
  assert.equal(
    buildQuickActionInlinePreviewControlsDomModel({
      historyButtons: [],
      fieldViewButtons: [],
    }),
    null,
  );
  const model = buildQuickActionInlinePreviewControlsDomModel({
    historyButtons: [{ label: "", dataset: { selected: "true" } }, { label: "最新轮" }],
    historyHidden: false,
    historyAriaHidden: "false",
  });
  assert.equal(model.groups.length, 1);
  assert.equal(model.groups[0].buttons.length, 1);
  assert.equal(model.groups[0].buttons[0].label, "最新轮");
});

test("buildQuickActionInlinePreviewControlsRenderDomModel: 预解析 history 和 field-view target", serial, () => {
  const model = buildQuickActionInlinePreviewControlsRenderDomModel({
    historyButtons: [
      {
        label: "第1轮",
        title: "切到第1轮",
        dataset: { snapshotIndex: "0" },
        action: { type: "history", snapshotIndex: 0 },
      },
    ],
    historyHidden: false,
    historyAriaHidden: "false",
    fieldViewButtons: [
      {
        label: "阶段字段",
        title: "切到阶段字段",
        dataset: { roomInlinePreviewView: "stage" },
        action: { type: "field-view", fieldView: "stage" },
      },
    ],
    fieldViewHidden: true,
    fieldViewAriaHidden: "true",
  });

  assert.deepEqual(model.groups[0].buttons[0].actionTarget, {
    type: "history",
    snapshotIndex: 0,
  });
  assert.deepEqual(model.groups[0].children, [
    {
      type: "button",
      buttonType: "button",
      dataset: { snapshotIndex: "0" },
      text: "第1轮",
      title: "切到第1轮",
      actionTarget: {
        type: "history",
        snapshotIndex: 0,
      },
      clickable: {
        classNames: ["is-clickable"],
        tabIndex: 0,
        attributes: {
          role: "button",
          title: "切到第1轮",
          "aria-label": "切到第1轮",
        },
      },
    },
  ]);
  assert.deepEqual(model.groups[0].buttons[0].clickable, {
    classNames: ["is-clickable"],
    tabIndex: 0,
    attributes: {
      role: "button",
      title: "切到第1轮",
      "aria-label": "切到第1轮",
    },
  });
  assert.deepEqual(model.groups[1].buttons[0].actionTarget, {
    type: "field-view",
    fieldView: "stage",
  });
  assert.equal(model.groups[1].hidden, true);
});

test("buildQuickActionInlinePreviewControlsRenderDomModel: 无效 target 不生成 clickable 规格", serial, () => {
  const model = buildQuickActionInlinePreviewControlsRenderDomModel({
    historyButtons: [
      {
        label: "坏按钮",
        title: "不应可点击",
        action: { type: "history", snapshotIndex: -1 },
      },
    ],
    historyHidden: false,
    historyAriaHidden: "false",
  });

  assert.equal(model.groups.length, 1);
  assert.equal(model.groups[0].buttons[0].actionTarget, null);
  assert.equal(model.groups[0].buttons[0].clickable, null);
  assert.equal(buildQuickActionInlinePreviewControlsRenderDomModel(null), null);
});

test("quickActionInlinePreviewControlActionTarget: 解析 history 和 field-view target", serial, () => {
  assert.deepEqual(quickActionInlinePreviewControlActionTarget({ type: "history", snapshotIndex: 2 }), {
    type: "history",
    snapshotIndex: 2,
  });
  assert.deepEqual(quickActionInlinePreviewControlActionTarget({ type: "field-view", fieldView: "snapshot" }), {
    type: "field-view",
    fieldView: "snapshot",
  });
});

test("quickActionInlinePreviewControlActionTarget: 过滤无效 target", serial, () => {
  assert.equal(quickActionInlinePreviewControlActionTarget(null), null);
  assert.equal(quickActionInlinePreviewControlActionTarget({ type: "history", snapshotIndex: -1 }), null);
  assert.equal(quickActionInlinePreviewControlActionTarget({ type: "history", snapshotIndex: 1.5 }), null);
  assert.equal(quickActionInlinePreviewControlActionTarget({ type: "field-view", fieldView: "bad" }), null);
  assert.equal(quickActionInlinePreviewControlActionTarget({ type: "workflow" }), null);
});

// ====== buildQuickActionInlinePreviewActionModel ======

test("buildQuickActionInlinePreviewActionModel: 可推进的最新阶段优先 workflow CTA", serial, () => {
  const model = buildQuickActionInlinePreviewActionModel({
    action: "整理",
    state: "待归档",
    viewingLatest: true,
    historyLabel: "最新轮",
  });
  assert.deepEqual(model.actions.map((action) => action.id), ["workflow", "snapshot"]);
  assert.deepEqual(model.actions[0].dataset, {
    roomInlinePreviewAction: "workflow",
    roomInlinePreviewPriority: "primary",
    roomInlinePreviewDefault: "true",
  });
  assert.equal(model.actions[0].label, "待归档模板");
  assert.equal(model.actions[0].title, "点击按待归档阶段模板继续整理");
  assert.equal(model.actions[1].dataset.roomInlinePreviewPriority, "secondary");
  assert.equal(model.actions[1].label, "查看待归档");
});

test("buildQuickActionInlinePreviewActionModel: 不可推进的最新阶段保持 snapshot 优先", serial, () => {
  const model = buildQuickActionInlinePreviewActionModel({
    action: "整理",
    state: "已归档",
    viewingLatest: true,
    historyLabel: "最新轮",
  });
  assert.deepEqual(model.actions.map((action) => action.id), ["snapshot", "workflow"]);
  assert.equal(model.actions[0].label, "查看已归档");
  assert.equal(model.actions[1].label, "已归档模板");
});

test("buildQuickActionInlinePreviewActionModel: 历史轮固定 snapshot 优先并使用回看提示", serial, () => {
  const model = buildQuickActionInlinePreviewActionModel({
    action: "整理",
    state: "已归档",
    viewingLatest: false,
    historyLabel: "第1轮",
  });
  assert.deepEqual(model.actions.map((action) => action.id), ["snapshot", "workflow"]);
  assert.equal(model.actions[0].dataset.roomInlinePreviewPriority, "primary");
  assert.equal(model.actions[0].title, "点击回看第1轮的已归档快照并回填到输入框");
  assert.equal(model.actions[1].dataset.roomInlinePreviewPriority, "secondary");
  assert.equal(model.actions[1].title, "点击切回当前已归档阶段模板，继续整理");
});

test("buildQuickActionInlinePreviewActionDomModel: 生成 CTA 容器和按钮 DOM 规格", serial, () => {
  const model = buildQuickActionInlinePreviewActionDomModel({
    actions: [
      {
        id: "snapshot",
        label: "查看已归档",
        title: "点击查看已归档快照并回填到输入框",
        dataset: {
          roomInlinePreviewAction: "snapshot",
          roomInlinePreviewPriority: "primary",
          roomInlinePreviewDefault: "true",
        },
      },
      {
        id: "workflow",
        label: "已归档模板",
        title: "",
        dataset: {
          roomInlinePreviewAction: "workflow",
        },
      },
    ],
  });
  assert.equal(model.className, "room-inline-preview-card-actions");
  assert.deepEqual(model.buttons[0], {
    type: "button",
    id: "snapshot",
    label: "查看已归档",
    title: "点击查看已归档快照并回填到输入框",
    ariaLabel: "点击查看已归档快照并回填到输入框",
    dataset: {
      roomInlinePreviewAction: "snapshot",
      roomInlinePreviewPriority: "primary",
      roomInlinePreviewDefault: "true",
    },
  });
  assert.deepEqual(model.buttons[1], {
    type: "button",
    id: "workflow",
    label: "已归档模板",
    title: "",
    ariaLabel: "",
    dataset: {
      roomInlinePreviewAction: "workflow",
    },
  });
});

test("buildQuickActionInlinePreviewActionDomModel: 空按钮组返回 null 并过滤空标签", serial, () => {
  assert.equal(buildQuickActionInlinePreviewActionDomModel({ actions: [] }), null);
  const model = buildQuickActionInlinePreviewActionDomModel({
    actions: [
      null,
      { id: "snapshot", label: "" },
      { id: "workflow", label: "继续", dataset: { roomInlinePreviewAction: null } },
    ],
  });
  assert.equal(model.buttons.length, 1);
  assert.deepEqual(model.buttons[0], {
    type: "button",
    id: "workflow",
    label: "继续",
    title: "",
    ariaLabel: "",
    dataset: {},
  });
});

test("buildQuickActionInlinePreviewActionRenderDomModel: 预解析 CTA target 和 clickable 规格", serial, () => {
  const model = buildQuickActionInlinePreviewActionRenderDomModel({
    actions: [
      {
        id: "snapshot",
        label: "查看已归档",
        title: "点击查看已归档快照并回填到输入框",
        dataset: {
          roomInlinePreviewAction: "snapshot",
          roomInlinePreviewPriority: "primary",
        },
      },
      {
        id: "workflow",
        label: "已归档模板",
        title: "",
        dataset: {
          roomInlinePreviewAction: "workflow",
        },
      },
      {
        id: "history",
        label: "无效动作",
        title: "不应可点击",
      },
    ],
  });

  assert.equal(model.className, "room-inline-preview-card-actions");
  assert.deepEqual(model.buttons[0].actionTarget, { type: "snapshot" });
  assert.deepEqual(model.children[0], {
    type: "button",
    buttonType: "button",
    dataset: {
      roomInlinePreviewAction: "snapshot",
      roomInlinePreviewPriority: "primary",
    },
    text: "查看已归档",
    title: "点击查看已归档快照并回填到输入框",
    ariaLabel: "点击查看已归档快照并回填到输入框",
    actionTarget: { type: "snapshot" },
    clickable: {
      classNames: ["is-clickable"],
      tabIndex: 0,
      attributes: {
        role: "button",
        title: "点击查看已归档快照并回填到输入框",
        "aria-label": "点击查看已归档快照并回填到输入框",
      },
    },
  });
  assert.deepEqual(model.buttons[0].clickable, {
    classNames: ["is-clickable"],
    tabIndex: 0,
    attributes: {
      role: "button",
      title: "点击查看已归档快照并回填到输入框",
      "aria-label": "点击查看已归档快照并回填到输入框",
    },
  });
  assert.deepEqual(model.buttons[1].actionTarget, { type: "workflow" });
  assert.deepEqual(model.buttons[1].clickable, {
    classNames: ["is-clickable"],
    tabIndex: 0,
    attributes: {
      role: "button",
    },
  });
  assert.equal(model.buttons[2].actionTarget, null);
  assert.equal(model.buttons[2].clickable, null);
});

test("buildQuickActionInlinePreviewActionRenderDomModel: 空输入返回 null", serial, () => {
  assert.equal(buildQuickActionInlinePreviewActionRenderDomModel({ actions: [] }), null);
});

test("quickActionInlinePreviewActionTarget: 解析 snapshot 和 workflow CTA target", serial, () => {
  assert.deepEqual(quickActionInlinePreviewActionTarget({ id: "snapshot" }), {
    type: "snapshot",
  });
  assert.deepEqual(quickActionInlinePreviewActionTarget({ id: "workflow" }), {
    type: "workflow",
  });
});

test("quickActionInlinePreviewActionTarget: 过滤无效 CTA target", serial, () => {
  assert.equal(quickActionInlinePreviewActionTarget(null), null);
  assert.equal(quickActionInlinePreviewActionTarget({ id: "" }), null);
  assert.equal(quickActionInlinePreviewActionTarget({ id: "history" }), null);
  assert.equal(quickActionInlinePreviewActionTarget({ type: "snapshot" }), null);
});

// ====== buildQuickActionInlinePreviewHintModel ======

test("buildQuickActionInlinePreviewHintModel: 多轮预览生成可切换轮次 hint", serial, () => {
  const history = [
    { fields: [{ label: "主题", value: "旧记录" }] },
    { fields: [{ label: "主题", value: "新记录" }] },
  ];
  const model = buildQuickActionInlinePreviewHintModel({
    preview: {
      action: "整理",
      state: "已归档",
      history,
      snapshotIndex: 0,
      historyLabel: "第1轮",
      historyToneClass: "summary-history",
    },
    previewField: "主题：旧记录",
  });
  assert.deepEqual(model.stage, {
    label: "已归档",
    title: "点击继续当前阶段",
    action: { type: "workflow" },
  });
  assert.deepEqual(model.field, {
    label: "主题：旧记录",
    title: "点击回到当前预览快照",
    action: { type: "snapshot" },
  });
  assert.equal(model.round.label, "第1轮");
  assert.equal(model.round.className, "room-inline-preview-round summary-history");
  assert.equal(model.round.title, "最新轮（第2轮） · 主题");
  assert.deepEqual(model.round.action, { type: "history", snapshotIndex: 1 });
});

test("buildQuickActionInlinePreviewHintModel: 单轮预览保留不可点击轮次", serial, () => {
  const model = buildQuickActionInlinePreviewHintModel({
    preview: {
      action: "整理",
      state: "已归档",
      history: [{ fields: [{ label: "主题", value: "记录" }] }],
      snapshotIndex: 0,
      historyLabel: "最新轮",
      historyToneClass: "",
    },
    previewField: "主题：记录",
  });
  assert.equal(model.round.label, "最新轮");
  assert.equal(model.round.className, "room-inline-preview-round");
  assert.equal(model.round.title, "");
  assert.equal(model.round.action, null);
});

test("buildQuickActionInlinePreviewHintModel: 缺少必要输入返回 null", serial, () => {
  assert.equal(buildQuickActionInlinePreviewHintModel({ preview: null, previewField: "主题：记录" }), null);
  assert.equal(
    buildQuickActionInlinePreviewHintModel({ preview: { state: "已归档" }, previewField: "" }),
    null,
  );
});

test("buildQuickActionInlinePreviewHintDomModel: 生成 hint DOM 节点规格", serial, () => {
  const model = buildQuickActionInlinePreviewHintDomModel({
    stage: {
      label: "已归档",
      title: "点击按已归档阶段模板继续整理",
      action: { type: "workflow" },
    },
    field: {
      label: "主题：新记录",
      title: "点击查看已归档快照并回填到输入框",
      action: { type: "snapshot" },
    },
    round: {
      className: "room-inline-preview-round summary-round",
      label: "最新轮",
      title: "切到第 1 轮快照",
      action: { type: "history", snapshotIndex: 0 },
    },
  }, "strong");
  assert.equal(model.className, "room-inline-preview-hint");
  assert.deepEqual(model.dataset, { actionIntensity: "strong" });
  assert.deepEqual(model.parts.map((part) => part.kind), ["node", "separator", "node", "separator", "node"]);
  assert.deepEqual(model.parts[0], {
    kind: "node",
    key: "stage",
    className: "room-inline-preview-stage",
    label: "已归档",
    title: "点击按已归档阶段模板继续整理",
    action: { type: "workflow" },
  });
  assert.deepEqual(model.parts[4], {
    kind: "node",
    key: "round",
    className: "room-inline-preview-round summary-round",
    label: "最新轮",
    title: "切到第 1 轮快照",
    action: { type: "history", snapshotIndex: 0 },
  });
});

test("buildQuickActionInlinePreviewHintDomModel: 无 round 时只保留阶段和字段", serial, () => {
  const model = buildQuickActionInlinePreviewHintDomModel({
    stage: { label: "待归档", title: "", action: null },
    field: { label: "主题：记录", title: "", action: null },
  }, "");
  assert.deepEqual(model.dataset, {});
  assert.deepEqual(model.parts.map((part) => part.kind === "separator" ? part.label : part.key), [
    "stage",
    " · ",
    "field",
  ]);
});

test("buildQuickActionInlinePreviewHintRenderDomModel: 预解析 hint action target 与 clickable 规格", serial, () => {
  const model = buildQuickActionInlinePreviewHintRenderDomModel({
    stage: {
      label: "已归档",
      title: "点击按已归档阶段模板继续整理",
      action: { type: "workflow" },
    },
    field: {
      label: "主题：新记录",
      title: "点击查看已归档快照并回填到输入框",
      action: { type: "snapshot" },
    },
    round: {
      className: "room-inline-preview-round summary-round",
      label: "第 1 轮",
      title: "切到第 1 轮快照",
      action: { type: "history", snapshotIndex: 0 },
    },
  }, "strong");

  assert.equal(model.className, "room-inline-preview-hint");
  assert.deepEqual(model.dataset, { actionIntensity: "strong" });
  assert.deepEqual(model.parts[0], {
    kind: "node",
    key: "stage",
    className: "room-inline-preview-stage",
    label: "已归档",
    title: "点击按已归档阶段模板继续整理",
    action: { type: "workflow" },
    actionTarget: { type: "workflow" },
    clickable: {
      classNames: ["is-clickable"],
      tabIndex: 0,
      attributes: {
        role: "button",
        title: "点击按已归档阶段模板继续整理",
        "aria-label": "点击按已归档阶段模板继续整理",
      },
    },
  });
  assert.deepEqual(model.parts[4].actionTarget, { type: "history", snapshotIndex: 0 });
  assert.deepEqual(model.parts[4].clickable.attributes, {
    role: "button",
    title: "切到第 1 轮快照",
    "aria-label": "切到第 1 轮快照",
  });
});

test("buildQuickActionInlinePreviewHintRenderDomModel: 无效 action 不生成 clickable 规格", serial, () => {
  const model = buildQuickActionInlinePreviewHintRenderDomModel({
    stage: { label: "待归档", title: "继续", action: { type: "field-view", fieldView: "stage" } },
    field: { label: "主题：记录", title: "", action: null },
  }, "");

  assert.deepEqual(model.dataset, {});
  assert.deepEqual(model.parts.map((part) => part.kind === "separator" ? part.label : part.key), [
    "stage",
    " · ",
    "field",
  ]);
  assert.equal(model.parts[0].actionTarget, null);
  assert.equal(model.parts[0].clickable, null);
  assert.equal(model.parts[2].actionTarget, null);
  assert.equal(model.parts[2].clickable, null);
  assert.equal(buildQuickActionInlinePreviewHintRenderDomModel(null), null);
});

test("quickActionInlinePreviewHintActionTarget: 解析 workflow/snapshot/history target", serial, () => {
  assert.deepEqual(quickActionInlinePreviewHintActionTarget({ type: "workflow" }), {
    type: "workflow",
  });
  assert.deepEqual(quickActionInlinePreviewHintActionTarget({ type: "snapshot" }), {
    type: "snapshot",
  });
  assert.deepEqual(quickActionInlinePreviewHintActionTarget({ type: "history", snapshotIndex: 1 }), {
    type: "history",
    snapshotIndex: 1,
  });
});

test("quickActionInlinePreviewHintActionTarget: 过滤无效 target", serial, () => {
  assert.equal(quickActionInlinePreviewHintActionTarget(null), null);
  assert.equal(quickActionInlinePreviewHintActionTarget({ type: "history", snapshotIndex: -1 }), null);
  assert.equal(quickActionInlinePreviewHintActionTarget({ type: "history", snapshotIndex: 1.5 }), null);
  assert.equal(quickActionInlinePreviewHintActionTarget({ type: "field-view", fieldView: "stage" }), null);
  assert.equal(quickActionInlinePreviewHintActionTarget({ type: "unknown" }), null);
});

test("quickActionInlinePreviewClickableDomSpec: 生成可点击节点可访问性规格", serial, () => {
  assert.deepEqual(quickActionInlinePreviewClickableDomSpec("  切到第1轮  "), {
    classNames: ["is-clickable"],
    tabIndex: 0,
    attributes: {
      role: "button",
      title: "切到第1轮",
      "aria-label": "切到第1轮",
    },
  });
});

test("quickActionInlinePreviewClickableDomSpec: 空 title 只保留基础按钮规格", serial, () => {
  assert.deepEqual(quickActionInlinePreviewClickableDomSpec(""), {
    classNames: ["is-clickable"],
    tabIndex: 0,
    attributes: {
      role: "button",
    },
  });
});

test("quickActionPreviewClickableDomSpec: 生成通用 preview 可点击规格", serial, () => {
  assert.deepEqual(quickActionPreviewClickableDomSpec("  切到第1轮  "), {
    classNames: ["is-clickable"],
    tabIndex: 0,
    attributes: {
      role: "button",
      title: "切到第1轮",
      "aria-label": "切到第1轮",
    },
  });
});

test("quickActionPreviewClickableDomSpec: 空 title 只保留按钮基础规格", serial, () => {
  assert.deepEqual(quickActionPreviewClickableDomSpec(""), {
    classNames: ["is-clickable"],
    tabIndex: 0,
    attributes: {
      role: "button",
    },
  });
});

test("quickActionPreviewKeyActivates: Enter 和空格触发按钮激活", serial, () => {
  assert.equal(quickActionPreviewKeyActivates("Enter"), true);
  assert.equal(quickActionPreviewKeyActivates(" "), true);
});

test("quickActionPreviewKeyActivates: 其他键或非字符串输入不触发激活", serial, () => {
  assert.equal(quickActionPreviewKeyActivates("Escape"), false);
  assert.equal(quickActionPreviewKeyActivates("Spacebar"), false);
  assert.equal(quickActionPreviewKeyActivates(""), false);
  assert.equal(quickActionPreviewKeyActivates(null), false);
});

// ====== buildQuickActionInlinePreviewFieldRowsModel ======

test("buildQuickActionInlinePreviewFieldRowsModel: 规范化字段行并补齐空值", serial, () => {
  const model = buildQuickActionInlinePreviewFieldRowsModel([
    { label: "主题", value: "  新记录  " },
    { label: "状态", value: "" },
  ]);
  assert.deepEqual(model.rows, [
    { label: "主题", value: "新记录" },
    { label: "状态", value: "待补充" },
  ]);
  assert.equal(model.hasRows, true);
});

test("buildQuickActionInlinePreviewFieldRowsModel: 过滤空标签且空输入返回空模型", serial, () => {
  assert.deepEqual(buildQuickActionInlinePreviewFieldRowsModel([{ label: "", value: "x" }]), {
    rows: [],
    hasRows: false,
  });
  assert.deepEqual(buildQuickActionInlinePreviewFieldRowsModel(null), {
    rows: [],
    hasRows: false,
  });
});

test("buildQuickActionInlinePreviewFieldRowsDomModel: 生成字段列表和行 DOM 规格", serial, () => {
  const model = buildQuickActionInlinePreviewFieldRowsDomModel({
    rows: [
      { label: "主题", value: "新记录" },
      { label: "状态", value: "待补充" },
    ],
    hasRows: true,
  });
  assert.equal(model.className, "room-inline-preview-card-fields");
  assert.deepEqual(model.rows[0], {
    className: "room-inline-preview-card-row",
    labelNode: {
      className: "room-inline-preview-card-row-label",
      label: "主题",
    },
    valueNode: {
      className: "room-inline-preview-card-row-value",
      label: "新记录",
    },
  });
  assert.equal(model.rows[1].valueNode.label, "待补充");
});

test("buildQuickActionInlinePreviewFieldRowsDomModel: 空行返回 null 并过滤空标签", serial, () => {
  assert.equal(buildQuickActionInlinePreviewFieldRowsDomModel({ rows: [], hasRows: false }), null);
  const model = buildQuickActionInlinePreviewFieldRowsDomModel({
    rows: [
      { label: "", value: "忽略" },
      { label: "状态", value: "" },
    ],
  });
  assert.equal(model.rows.length, 1);
  assert.deepEqual(model.rows[0], {
    className: "room-inline-preview-card-row",
    labelNode: {
      className: "room-inline-preview-card-row-label",
      label: "状态",
    },
    valueNode: {
      className: "room-inline-preview-card-row-value",
      label: "待补充",
    },
  });
});

test("buildQuickActionInlinePreviewFieldRowsRenderDomModel: 组合字段行子节点规格", serial, () => {
  const model = buildQuickActionInlinePreviewFieldRowsRenderDomModel({
    rows: [
      { label: "主题", value: "新记录" },
      { label: "状态", value: "" },
    ],
  });

  assert.equal(model.className, "room-inline-preview-card-fields");
  assert.deepEqual(model.rows[0].children, [
    {
      type: "div",
      className: "room-inline-preview-card-row-label",
      label: "主题",
      text: "主题",
    },
    {
      type: "div",
      className: "room-inline-preview-card-row-value",
      label: "新记录",
      text: "新记录",
    },
  ]);
  assert.deepEqual(model.rows[1].children[1], {
    type: "div",
    className: "room-inline-preview-card-row-value",
    label: "待补充",
    text: "待补充",
  });
});

test("buildQuickActionInlinePreviewFieldRowsRenderDomModel: 空字段行返回 null", serial, () => {
  assert.equal(buildQuickActionInlinePreviewFieldRowsRenderDomModel({ rows: [] }), null);
});

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

test("quickActionSnapshotHistoryFromRecord: 从数组记录读取有效快照", serial, () => {
  const history = quickActionSnapshotHistoryFromRecord({
    整理: {
      已归档: [{ id: 1 }, null, { id: 2 }],
    },
  }, "整理", "已归档");
  assert.deepEqual(history, [{ id: 1 }, { id: 2 }]);
});

test("quickActionSnapshotHistoryFromRecord: 单对象记录包装为数组", serial, () => {
  const history = quickActionSnapshotHistoryFromRecord({
    整理: {
      已归档: { id: 1 },
    },
  }, "整理", "已归档");
  assert.deepEqual(history, [{ id: 1 }]);
});

test("quickActionSnapshotHistoryFromRecord: 缺少 action/state 或无效记录返回空数组", serial, () => {
  assert.deepEqual(quickActionSnapshotHistoryFromRecord(null, "整理", "已归档"), []);
  assert.deepEqual(quickActionSnapshotHistoryFromRecord({ 整理: {} }, "整理", "已归档"), []);
  assert.deepEqual(quickActionSnapshotHistoryFromRecord({ 整理: { 已归档: "bad" } }, "整理", "已归档"), []);
  assert.deepEqual(quickActionSnapshotHistoryFromRecord({ 整理: { 已归档: [{ id: 1 }] } }, "", "已归档"), []);
});

test("quickActionSnapshotFromHistory: 有效索引取指定快照，否则取最新", serial, () => {
  const history = [{ id: 1 }, { id: 2 }];
  assert.deepEqual(quickActionSnapshotFromHistory(history, 0), { id: 1 });
  assert.deepEqual(quickActionSnapshotFromHistory(history, null), { id: 2 });
  assert.deepEqual(quickActionSnapshotFromHistory(history, 9), { id: 2 });
  assert.equal(quickActionSnapshotFromHistory([], 0), null);
});

test("quickActionPreviewDefaultFieldView: 无历史时回退阶段字段", serial, () => {
  assert.equal(quickActionPreviewDefaultFieldView(0, null), "stage");
});

test("quickActionPreviewDefaultFieldView: 最新快照使用阶段字段", serial, () => {
  assert.equal(quickActionPreviewDefaultFieldView(3, 2), "stage");
});

test("quickActionPreviewDefaultFieldView: 历史快照使用原始快照", serial, () => {
  assert.equal(quickActionPreviewDefaultFieldView(3, 0), "snapshot");
});

test("quickActionPreviewHistoryToneClass: 多轮最新快照为 summary-round", serial, () => {
  assert.equal(quickActionPreviewHistoryToneClass(3, 2), "summary-round");
});

test("quickActionPreviewHistoryToneClass: 多轮历史快照为 summary-history", serial, () => {
  assert.equal(quickActionPreviewHistoryToneClass(3, 0), "summary-history");
});

test("quickActionPreviewHistoryToneClass: 单轮或无效索引为空", serial, () => {
  assert.equal(quickActionPreviewHistoryToneClass(1, 0), "");
  assert.equal(quickActionPreviewHistoryToneClass(3, -1), "");
  assert.equal(quickActionPreviewHistoryToneClass(3, 3), "");
});

test("quickActionPreviewResolvedSnapshotIndex: 有效索引原样返回", serial, () => {
  assert.equal(quickActionPreviewResolvedSnapshotIndex(3, 1), 1);
});

test("quickActionPreviewResolvedSnapshotIndex: 无效索引回退最新轮", serial, () => {
  assert.equal(quickActionPreviewResolvedSnapshotIndex(3, null), 2);
  assert.equal(quickActionPreviewResolvedSnapshotIndex(3, 9), 2);
});

test("quickActionPreviewResolvedSnapshotIndex: 无历史返回 null", serial, () => {
  assert.equal(quickActionPreviewResolvedSnapshotIndex(0, 0), null);
});

test("quickActionPreviewSelectedState: 匹配 action 且阶段有效时返回记录状态", serial, () => {
  const stages = [{ label: "待回执" }, { label: "已完成" }];
  assert.equal(
    quickActionPreviewSelectedState({ action: "委托", state: "已完成" }, "委托", stages),
    "已完成",
  );
});

test("quickActionPreviewSelectedState: action 不匹配或阶段无效时返回空", serial, () => {
  const stages = [{ label: "待回执" }];
  assert.equal(quickActionPreviewSelectedState({ action: "交易", state: "待回执" }, "委托", stages), "");
  assert.equal(quickActionPreviewSelectedState({ action: "委托", state: "不存在" }, "委托", stages), "");
});

test("quickActionPreviewSelectedSnapshotIndex: 匹配记录时使用记录索引", serial, () => {
  assert.equal(
    quickActionPreviewSelectedSnapshotIndex(
      { action: "整理", state: "已归档", snapshotIndex: 1 },
      "整理",
      "已归档",
      3,
    ),
    1,
  );
});

test("quickActionPreviewSelectedSnapshotIndex: 记录无效时回退最新轮", serial, () => {
  assert.equal(
    quickActionPreviewSelectedSnapshotIndex(
      { action: "整理", state: "已归档", snapshotIndex: 9 },
      "整理",
      "已归档",
      3,
    ),
    2,
  );
});

test("quickActionPreviewSelectedSnapshotIndex: 缺少 action/state/history 返回 null", serial, () => {
  assert.equal(quickActionPreviewSelectedSnapshotIndex(null, "整理", "已归档", 3), 2);
  assert.equal(quickActionPreviewSelectedSnapshotIndex({ action: "整理", state: "已归档" }, "", "已归档", 3), null);
  assert.equal(quickActionPreviewSelectedSnapshotIndex({ action: "整理", state: "已归档" }, "整理", "", 3), null);
  assert.equal(quickActionPreviewSelectedSnapshotIndex({ action: "整理", state: "已归档" }, "整理", "已归档", 0), null);
});

test("quickActionPreviewSelectedFieldView: 匹配记录时使用记录视图", serial, () => {
  const result = quickActionPreviewSelectedFieldView(
    { action: "整理", state: "已归档", snapshotIndex: 0, fieldView: "snapshot" },
    "整理",
    "已归档",
    3,
    0,
  );
  assert.equal(result, "snapshot");
});

test("quickActionPreviewSelectedFieldView: 记录不匹配时使用默认视图", serial, () => {
  const result = quickActionPreviewSelectedFieldView(
    { action: "整理", state: "已归档", snapshotIndex: 0, fieldView: "snapshot" },
    "整理",
    "待归档",
    3,
    0,
  );
  assert.equal(result, "snapshot");
});

test("quickActionPreviewSelectedFieldView: 支持卡片视图键和自定义 fallback", serial, () => {
  const result = quickActionPreviewSelectedFieldView(
    { action: "交易", state: "已确认", snapshotIndex: 1, cardFieldView: "stage" },
    "交易",
    "已确认",
    2,
    1,
    { fieldKey: "cardFieldView", fallback: "snapshot" },
  );
  assert.equal(result, "stage");
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

// ====== resolveQuickActionPreviewView ======

test("resolveQuickActionPreviewView: snapshot 视图优先显示快照主字段", serial, () => {
  const view = resolveQuickActionPreviewView({
    action: "整理",
    state: "已归档",
    structured: {
      action: "整理",
      fields: [{ label: "- 主题：", value: "邻里记录" }],
    },
    historyLabel: "最新轮",
    followUpCopy: "继续整理这条线索",
  }, "snapshot");
  assert.equal(view.fieldView, "snapshot");
  assert.equal(view.fieldViewLabel, "原始快照");
  assert.deepEqual(view.primaryField, { label: "主题", value: "邻里记录" });
  assert.equal(view.summaryCopy, "主题：邻里记录");
  assert.equal(view.detailText, "已归档 · 最新轮 · 主题：邻里记录");
  assert.equal(view.summaryText, "原始快照：已归档 · 最新轮 · 主题：邻里记录");
});

test("resolveQuickActionPreviewView: stage 视图优先显示阶段跟进文案", serial, () => {
  const view = resolveQuickActionPreviewView({
    action: "整理",
    state: "已归档",
    structured: {
      action: "整理",
      fields: [{ label: "- 主题：", value: "邻里记录" }],
    },
    followUpCopy: "按归档结果继续补一条",
  }, "stage");
  assert.equal(view.fieldView, "stage");
  assert.equal(view.fieldViewLabel, "阶段字段");
  assert.equal(view.summaryCopy, "按归档结果继续补一条");
  assert.equal(view.summaryText, "阶段字段：已归档 · 按归档结果继续补一条");
});

test("resolveQuickActionPreviewView: 缺少结构化内容返回 null", serial, () => {
  assert.equal(resolveQuickActionPreviewView(null), null);
  assert.equal(resolveQuickActionPreviewView({ action: "整理", state: "已归档" }), null);
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
