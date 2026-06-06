import {
  QUICK_ACTION_INLINE_FIELD_PRIORITY,
  QUICK_ACTION_INLINE_STATE_FIELD_PRIORITY,
  quickActionWorkflowTemplate,
} from "./shell-quick-action-templates.js";
import {
  quickActionIntensity,
  quickActionStage,
  quickActionTone,
} from "./shell-quick-action-labels.js";

export function quickActionPreviewFieldViewLabel(fieldView = "snapshot") {
  return fieldView === "stage" ? "阶段字段" : "原始快照";
}

export function buildQuickActionPreviewModel(options = {}) {
  const action = typeof options.action === "string" ? options.action.trim() : "";
  const state = typeof options.state === "string" ? options.state.trim() : "";
  if (!action || !state) return null;
  const history = Array.isArray(options.history) ? options.history : [];
  const snapshotIndex = Number.isInteger(options.snapshotIndex) ? options.snapshotIndex : null;
  const historyLabel = typeof options.historyLabel === "string" ? options.historyLabel.trim() : "";
  const followUpCopy = typeof options.followUpCopy === "string" ? options.followUpCopy.trim() : "";
  const detailParts = [state, historyLabel, followUpCopy].filter(Boolean);
  return {
    action,
    state,
    history,
    snapshotIndex,
    structured: options.structured || null,
    historyLabel,
    historyToneClass: quickActionPreviewHistoryToneClass(history.length, snapshotIndex),
    followUpCopy,
    detailText: detailParts.join(" · "),
    summaryText: `阶段预览：${detailParts.join(" · ")}`,
  };
}

export function buildQuickActionPreviewSummaryLineDomSpec(preview = null, options = {}) {
  if (!preview?.state) return null;
  const resolvedPreview =
    resolveQuickActionPreviewView(preview, options.fieldView) ||
    resolveQuickActionPreviewView(preview, "snapshot");
  if (!resolvedPreview) return null;
  const parts = [
    {
      className: "quick-action-preview-summary-copy",
      text: `${options.includePrefix ? `${resolvedPreview.fieldViewLabel}：` : ""}${resolvedPreview.state}`,
    },
  ];
  if (resolvedPreview.historyLabel) {
    parts.push(
      { className: "quick-action-preview-summary-copy", text: " · " },
      {
        className: resolvedPreview.historyToneClass || "summary-round",
        text: resolvedPreview.historyLabel,
      },
    );
  }
  if (resolvedPreview.summaryCopy) {
    parts.push({
      className: "quick-action-preview-summary-copy",
      text: ` · ${resolvedPreview.summaryCopy}`,
    });
  }
  return {
    tagName: options.tagName || "div",
    className: options.className || "quick-action-preview-summary",
    parts,
  };
}

export function buildRoomQuickPreviewPillDomSpec(preview = null, fieldView = "snapshot") {
  if (!preview?.historyLabel) return null;
  const previewFieldView = fieldView === "stage" ? "stage" : "snapshot";
  return {
    text: `预览 ${preview.historyLabel} · ${quickActionPreviewFieldViewLabel(previewFieldView)}`,
    tone: preview.historyToneClass === "summary-history" ? "muted" : "warm",
    classNames: ["pill-room-preview", "is-clickable"],
    dataset: {
      previewState: preview.state || "",
      previewRound: preview.historyLabel,
      previewFieldView,
    },
    title: "点击回到当前预览快照",
  };
}

export function buildQuickActionPreviewCardModel(action = "", previewState = "", structured = null, options = {}) {
  if (!action || !previewState || !structured) return null;
  const history = Array.isArray(options.history) ? options.history.filter(Boolean) : [];
  const selectedHistoryIndex =
    Number.isInteger(options.selectedHistoryIndex) &&
    options.selectedHistoryIndex >= 0 &&
    options.selectedHistoryIndex < history.length
      ? options.selectedHistoryIndex
      : history.length
        ? history.length - 1
        : -1;
  const selectedFieldView =
    options.fieldView === "stage" || options.fieldView === "snapshot" ? options.fieldView : "snapshot";
  const structuredViews = quickActionPreviewStructuredViews(action, previewState, structured);
  const resolvedPreviewView = resolveQuickActionPreviewView(
    {
      action,
      state: previewState,
      structured,
      historyLabel: options.historyLabel || "",
      historyToneClass: "",
      followUpCopy: options.followUpCopy || "",
    },
    selectedFieldView,
  );
  const activeStructured =
    selectedFieldView === "stage" ? structuredViews.stageStructured : structuredViews.snapshotStructured;
  const chromeModel = buildQuickActionPreviewCardChromeModel({
    previewState,
    historyLabel: options.historyLabel || "",
    fieldViewLabel: resolvedPreviewView?.fieldViewLabel || "",
    selectedFieldView,
    historyLength: history.length,
    selectedHistoryIndex,
    hasViewToggle: structuredViews.hasViewToggle,
  });
  return {
    action,
    previewState,
    history,
    selectedHistoryIndex,
    selectedFieldView,
    structuredViews,
    resolvedPreviewView,
    activeStructured,
    chromeModel,
  };
}

export function buildQuickActionPreviewCardRenderDomSpec(options = {}) {
  if (!options || typeof options !== "object") return null;
  const action = typeof options.action === "string" ? options.action.trim() : "";
  const previewState = typeof options.previewState === "string" ? options.previewState.trim() : "";
  const model = options.previewCardModel;
  if (!action || !previewState || !model?.activeStructured) return null;
  const history = Array.isArray(model.history) ? model.history : [];
  const chromeModel = model.chromeModel || {};
  const card = buildQuickActionPreviewCardDomSpec(action, previewState, {
    className: options.className || "",
  });
  card.dataset = {
    ...card.dataset,
    previewHistoryControlsCollapsed:
      typeof chromeModel.historyControlsCollapsed === "string" ? chromeModel.historyControlsCollapsed : "false",
    previewFieldViewControlsCollapsed:
      typeof chromeModel.fieldViewControlsCollapsed === "string" ? chromeModel.fieldViewControlsCollapsed : "false",
  };
  const header = buildQuickActionPreviewCardHeaderDomSpec(action, previewState, {
    title: options.title || "",
    fieldViewLabel: model.resolvedPreviewView?.fieldViewLabel || "",
  });
  const pills = buildQuickActionPreviewCardPillsDomSpec({
    action,
    previewState,
    history,
    selectedHistoryIndex: model.selectedHistoryIndex,
    selectedFieldView: model.selectedFieldView,
    fieldViewLabel: model.resolvedPreviewView?.fieldViewLabel || "",
    historyLabel: options.historyLabel || "",
    currentStripText: chromeModel.currentStripText,
    historyTone: chromeModel.historyTone,
    historySnapshotRole: chromeModel.historySnapshotRole,
    historyToggleTitle: chromeModel.historyToggleTitle,
    nextHistoryIndex: chromeModel.nextHistoryIndex,
    fieldViewToggleTitle: chromeModel.fieldViewToggleTitle,
    nextFieldView: chromeModel.nextFieldView,
    hasViewToggle: Boolean(model.structuredViews?.hasViewToggle),
  });
  const historyControls = buildQuickActionPreviewHistoryControlsDomSpec(history, model.selectedHistoryIndex, {
    historyTitle: options.historyTitle || "",
  });
  const fieldViewControls = buildQuickActionPreviewFieldViewControlsDomSpec(
    Boolean(model.structuredViews?.hasViewToggle),
    model.selectedFieldView,
    {
      previewState,
      historyLabel: options.historyLabel || "",
    },
  );
  const sheet = buildQuickActionPreviewCardSheetRenderDomSpec(
    buildQuickActionPreviewCardSheetDomSpec(model.activeStructured, {
      maxFields: options.maxFields,
    }),
  );
  return {
    card,
    header,
    pillsWrapperClassName: pills.wrapperClassName,
    pillSections: buildQuickActionPreviewCardPillSectionsRenderDomSpec(pills),
    copy: buildQuickActionPreviewCardCopyDomSpec({
      summaryCopy: model.resolvedPreviewView?.summaryCopy || "",
      followUpCopy: options.followUpCopy || "",
    }),
    controlPanels: buildQuickActionPreviewControlPanelsRenderDomSpec({
      historyControls,
      historyCollapsed: card.dataset.previewHistoryControlsCollapsed,
      fieldViewControls,
      fieldViewCollapsed: card.dataset.previewFieldViewControlsCollapsed,
    }),
    sheet,
  };
}

export function buildQuickActionPreviewCardDomSpec(action = "", previewState = "", options = {}) {
  const actionText = typeof action === "string" ? action.trim() : "";
  const stateText = typeof previewState === "string" ? previewState.trim() : "";
  const classNames = ["quick-action-preview-card"];
  if (typeof options.className === "string") {
    classNames.push(...options.className.split(/\s+/).map((item) => item.trim()).filter(Boolean));
  }
  const actionIntensityValue =
    typeof options.actionIntensity === "string" ? options.actionIntensity.trim() : quickActionIntensity(actionText);
  const dataset = {};
  if (actionIntensityValue) dataset.actionIntensity = actionIntensityValue;
  if (actionText) dataset.quickAction = actionText;
  if (stateText) dataset.previewState = stateText;
  return { classNames, dataset };
}

export function buildQuickActionPreviewCardHeaderDomSpec(action = "", previewState = "", options = {}) {
  const actionText = typeof action === "string" ? action.trim() : "";
  const stateText = typeof previewState === "string" ? previewState.trim() : "";
  const title = typeof options.title === "string" ? options.title.trim() : "";
  const fieldViewLabel = typeof options.fieldViewLabel === "string" ? options.fieldViewLabel.trim() : "";
  return {
    headerClassName: "quick-action-preview-card-header",
    headingClassName: "quick-action-preview-card-heading",
    kickerLine: {
      className: "quick-action-preview-card-kicker",
      text: title || fieldViewLabel || "阶段快照",
    },
    titleLine: {
      className: "quick-action-preview-card-title",
      text: [actionText, stateText].filter(Boolean).join(" · "),
    },
  };
}

export function buildQuickActionPreviewCardCopyDomSpec(options = {}) {
  if (!options || typeof options !== "object") return null;
  const summaryCopy = typeof options.summaryCopy === "string" ? options.summaryCopy.trim() : "";
  const followUpCopy = typeof options.followUpCopy === "string" ? options.followUpCopy.trim() : "";
  const text = summaryCopy || followUpCopy;
  if (!text) return null;
  return {
    className: "quick-action-preview-card-copy",
    text,
  };
}

export function buildQuickActionPreviewCardPillsDomSpec(options = {}) {
  const action = typeof options.action === "string" ? options.action.trim() : "";
  const previewState = typeof options.previewState === "string" ? options.previewState.trim() : "";
  const history = Array.isArray(options.history) ? options.history.filter(Boolean) : [];
  const selectedHistoryIndex =
    Number.isInteger(options.selectedHistoryIndex) &&
    options.selectedHistoryIndex >= 0 &&
    options.selectedHistoryIndex < history.length
      ? options.selectedHistoryIndex
      : history.length
        ? history.length - 1
        : -1;
  const selectedFieldView = options.selectedFieldView === "stage" ? "stage" : "snapshot";
  const fieldViewLabel = typeof options.fieldViewLabel === "string" ? options.fieldViewLabel.trim() : "";
  const historyLabel = typeof options.historyLabel === "string" ? options.historyLabel.trim() : "";
  const currentStripText = typeof options.currentStripText === "string" ? options.currentStripText.trim() : "";
  const historyTone = typeof options.historyTone === "string" ? options.historyTone.trim() : "muted";
  const historySnapshotRole =
    typeof options.historySnapshotRole === "string" && options.historySnapshotRole.trim()
      ? options.historySnapshotRole.trim()
      : "history";
  const historyToggleTitle =
    typeof options.historyToggleTitle === "string" ? options.historyToggleTitle.trim() : "";
  const nextHistoryIndex =
    Number.isInteger(options.nextHistoryIndex) && options.nextHistoryIndex >= 0 ? options.nextHistoryIndex : null;
  const fieldViewToggleTitle =
    typeof options.fieldViewToggleTitle === "string" ? options.fieldViewToggleTitle.trim() : "";
  const nextFieldView = options.nextFieldView === "stage" ? "stage" : "snapshot";
  const hasViewToggle = Boolean(options.hasViewToggle);
  const actionIntensity = quickActionIntensity(action);
  const actionTone = quickActionTone(action);
  const labels = [];
  const current = [];
  const addLabel = (section, text) => {
    labels.push({
      className: "quick-action-preview-card-pills-label",
      dataset: { pillSection: section },
      text,
    });
  };

  if (action) {
    current.push({
      text: action,
      tone: actionTone,
      dataset: { actionIntensity, quickAction: action, currentMetaRole: "action" },
    });
  }
  if (currentStripText) {
    current.push({
      className: "quick-action-preview-card-current-strip",
      dataset: { currentMetaRole: "summary" },
      text: currentStripText,
    });
  }
  if (previewState) {
    current.push({
      text: previewState,
      tone: actionTone,
      dataset: { actionIntensity, quickAction: action, currentMetaRole: "state" },
    });
  }
  if (historyLabel) {
    current.push({
      text: historyLabel,
      tone: historyTone,
      dataset: { previewMeta: "history", snapshotRole: historySnapshotRole, currentMetaRole: "history" },
      action:
        nextHistoryIndex == null
          ? null
          : { kind: "history", title: historyToggleTitle, snapshotIndex: nextHistoryIndex },
    });
  }
  if (fieldViewLabel) {
    current.push({
      text: fieldViewLabel,
      tone: "muted",
      dataset: { previewMeta: "field-view", previewFieldView: selectedFieldView, currentMetaRole: "field-view" },
      action: { kind: "field-view", title: fieldViewToggleTitle, fieldView: nextFieldView },
    });
  }

  const historyPills =
    history.length > 1
      ? history.map((snapshot, index) => ({
          text: quickActionPreviewHistoryLabel(snapshot, index, history.length),
          tone: index === selectedHistoryIndex ? "warm" : "muted",
          dataset: {
            previewMetaOption: "history",
            snapshotIndex: String(index),
            snapshotRole: index === history.length - 1 ? "latest" : "history",
            selected: String(index === selectedHistoryIndex),
          },
          action: {
            kind: "history",
            title: quickActionPreviewHistoryDescription(snapshot, index, history.length),
            snapshotIndex: index,
          },
        }))
      : [];
  const fieldViewPills = hasViewToggle
    ? [
        {
          text: "阶段字段",
          tone: selectedFieldView === "stage" ? "warm" : "muted",
          dataset: {
            previewMetaOption: "field-view",
            previewFieldView: "stage",
            selected: String(selectedFieldView === "stage"),
          },
          action: { kind: "field-view", title: `切到${previewState || "当前阶段"}阶段字段`, fieldView: "stage" },
        },
        {
          text: "原始快照",
          tone: selectedFieldView === "snapshot" ? "warm" : "muted",
          dataset: {
            previewMetaOption: "field-view",
            previewFieldView: "snapshot",
            selected: String(selectedFieldView === "snapshot"),
          },
          action: {
            kind: "field-view",
            title: `切到${historyLabel || "当前轮次"}的原始快照字段`,
            fieldView: "snapshot",
          },
        },
      ]
    : [];

  if (current.length > 0) addLabel("current", "当前");
  if (historyPills.length > 0) addLabel("history", "轮次");
  if (fieldViewPills.length > 0) addLabel("field-view", "视图");

  return {
    wrapperClassName: "quick-action-preview-card-pills",
    currentClassName: "quick-action-preview-card-pills-current",
    optionClassName: "quick-action-preview-card-pills-options",
    labels,
    current,
    historyOptions: historyPills.length > 0 ? { dataset: { optionKind: "history" }, pills: historyPills } : null,
    fieldViewOptions: fieldViewPills.length > 0
      ? { dataset: { optionKind: "field-view" }, pills: fieldViewPills }
      : null,
  };
}

export function buildQuickActionPreviewCardPillSectionsDomSpec(pillsDomSpec = null) {
  if (!pillsDomSpec || typeof pillsDomSpec !== "object") return [];
  const labels = Array.isArray(pillsDomSpec.labels) ? pillsDomSpec.labels.filter(Boolean) : [];
  const currentPills = Array.isArray(pillsDomSpec.current) ? pillsDomSpec.current.filter(Boolean) : [];
  const historyPills = Array.isArray(pillsDomSpec.historyOptions?.pills)
    ? pillsDomSpec.historyOptions.pills.filter(Boolean)
    : [];
  const fieldViewPills = Array.isArray(pillsDomSpec.fieldViewOptions?.pills)
    ? pillsDomSpec.fieldViewOptions.pills.filter(Boolean)
    : [];
  const sections = [];
  labels.forEach((label) => {
    const section = label?.dataset?.pillSection;
    if (section === "current" && currentPills.length) {
      sections.push({
        label,
        group: {
          className: pillsDomSpec.currentClassName || "",
          dataset: {},
          pills: currentPills,
        },
      });
    }
    if (section === "history" && historyPills.length) {
      sections.push({
        label,
        group: {
          className: pillsDomSpec.optionClassName || "",
          dataset: pillsDomSpec.historyOptions?.dataset || {},
          pills: historyPills,
        },
      });
    }
    if (section === "field-view" && fieldViewPills.length) {
      sections.push({
        label,
        group: {
          className: pillsDomSpec.optionClassName || "",
          dataset: pillsDomSpec.fieldViewOptions?.dataset || {},
          pills: fieldViewPills,
        },
      });
    }
  });
  return sections;
}

export function buildQuickActionPreviewCardPillSectionsRenderDomSpec(pillsDomSpec = null) {
  return buildQuickActionPreviewCardPillSectionsDomSpec(pillsDomSpec).map((section) => ({
    ...section,
    group: {
      ...section.group,
      pills: section.group.pills.map((pill) => ({
        ...pill,
        actionTarget: quickActionPreviewCardPillActionTarget(pill),
      })),
    },
  }));
}

export function quickActionPreviewCardPillActionTarget(pillSpec = null) {
  const action = pillSpec?.action;
  if (!action || typeof action !== "object") return null;
  if (action.kind === "history") {
    const snapshotIndex = Number.isInteger(action.snapshotIndex) ? action.snapshotIndex : -1;
    if (snapshotIndex < 0) return null;
    return {
      kind: "history",
      title: typeof action.title === "string" ? action.title.trim() : "",
      snapshotIndex,
    };
  }
  if (action.kind === "field-view") {
    const fieldView = action.fieldView === "stage" || action.fieldView === "snapshot" ? action.fieldView : "";
    if (!fieldView) return null;
    return {
      kind: "field-view",
      title: typeof action.title === "string" ? action.title.trim() : "",
      fieldView,
    };
  }
  return null;
}

export function buildQuickActionPreviewCardSheetDomSpec(structured = null, options = {}) {
  const fields = Array.isArray(structured?.fields)
    ? structured.fields
        .filter(Boolean)
        .map((field) => ({
          label: typeof field.label === "string" ? field.label.trim() : "",
          value: field.value == null ? "" : String(field.value),
        }))
        .filter((field) => field.label)
    : [];
  const fieldLimit = Math.max(1, Number(options.maxFields) || fields.length || 1);
  const notes = Array.isArray(structured?.notes)
    ? structured.notes.map((note) => (typeof note === "string" ? note.trim() : "")).filter(Boolean)
    : [];
  return {
    wrapperClassName: "message-quick-sheet quick-action-preview-card-sheet",
    rowClassName: "message-quick-sheet-row quick-action-preview-card-row",
    labelClassName: "message-quick-sheet-label quick-action-preview-card-label",
    valueClassName: "message-quick-sheet-value quick-action-preview-card-value",
    rows: fields.slice(0, fieldLimit),
    notes: notes.length
      ? {
          className: "message-quick-sheet-notes quick-action-preview-card-notes",
          text: notes.join("\n"),
        }
      : null,
  };
}

export function buildQuickActionPreviewCardSheetRenderDomSpec(sheetDomSpec = null) {
  if (!sheetDomSpec?.wrapperClassName) return null;
  const rowSpecs = Array.isArray(sheetDomSpec.rows)
    ? sheetDomSpec.rows
        .filter(Boolean)
        .map((row) => ({
          kind: "row",
          className: sheetDomSpec.rowClassName || "",
          label: {
            className: sheetDomSpec.labelClassName || "",
            text: typeof row.label === "string" ? row.label : "",
          },
          value: {
            className: sheetDomSpec.valueClassName || "",
            text: row.value == null ? "" : String(row.value),
          },
        }))
        .filter((row) => row.label.text)
    : [];
  const notesText = typeof sheetDomSpec.notes?.text === "string" ? sheetDomSpec.notes.text : "";
  const notesSpec = notesText
    ? {
        kind: "notes",
        className: sheetDomSpec.notes?.className || "",
        text: notesText,
      }
    : null;
  const children = notesSpec ? [...rowSpecs, notesSpec] : rowSpecs;
  if (!children.length) return null;
  return {
    wrapperClassName: sheetDomSpec.wrapperClassName,
    children,
  };
}

export function buildQuickActionPreviewHistoryControlsDomSpec(history = [], selectedHistoryIndex = -1, options = {}) {
  const snapshots = Array.isArray(history) ? history.filter(Boolean) : [];
  if (snapshots.length <= 1) return null;
  const selectedIndex =
    Number.isInteger(selectedHistoryIndex) && selectedHistoryIndex >= 0 && selectedHistoryIndex < snapshots.length
      ? selectedHistoryIndex
      : snapshots.length - 1;
  const historyTitle = typeof options.historyTitle === "string" && options.historyTitle.trim()
    ? options.historyTitle.trim()
    : `历史快照 · ${snapshots.length} 轮`;
  return {
    wrapperClassName: "quick-action-preview-history",
    hidden: true,
    attributes: { "aria-hidden": "true" },
    labelLine: {
      className: "quick-action-preview-history-label",
      text: historyTitle,
    },
    buttonsClassName: "quick-action-preview-history-buttons",
    buttons: snapshots.map((snapshot, index) => ({
      type: "button",
      className: "quick-action-preview-history-button",
      dataset: {
        selected: String(index === selectedIndex),
        snapshotIndex: String(index),
        snapshotRole: index === snapshots.length - 1 ? "latest" : "history",
      },
      text: quickActionPreviewHistoryLabel(snapshot, index, snapshots.length),
      title: quickActionPreviewHistoryDescription(snapshot, index, snapshots.length),
      snapshotIndex: index,
    })),
  };
}

export function buildQuickActionPreviewControlWrapperDomState(controlSpec = null, collapsed = false) {
  if (!controlSpec?.wrapperClassName) return null;
  const hidden = collapsed === true || collapsed === "true" || Boolean(controlSpec.hidden);
  return {
    className: controlSpec.wrapperClassName,
    hidden,
    attributes: {
      ...(controlSpec.attributes || {}),
      "aria-hidden": hidden ? "true" : "false",
    },
  };
}

export function buildQuickActionPreviewControlPanelDomSpec(controlSpec = null, collapsed = false) {
  const wrapper = buildQuickActionPreviewControlWrapperDomState(controlSpec, collapsed);
  if (!wrapper) return null;
  return {
    wrapper,
    labelLine: controlSpec?.labelLine || null,
    buttonsClassName: typeof controlSpec?.buttonsClassName === "string" ? controlSpec.buttonsClassName : "",
    buttons: Array.isArray(controlSpec?.buttons) ? controlSpec.buttons.filter(Boolean) : [],
  };
}

export function buildQuickActionPreviewControlPanelRenderDomSpec(controlSpec = null, collapsed = false, controlKind = "") {
  const panel = buildQuickActionPreviewControlPanelDomSpec(controlSpec, collapsed);
  if (!panel) return null;
  return {
    ...panel,
    buttons: panel.buttons
      .map((button) => buildQuickActionPreviewControlButtonDomSpec(button))
      .filter(Boolean)
      .map((button) => ({
        ...button,
        actionTarget: quickActionPreviewCardControlActionTarget(button, controlKind),
      })),
  };
}

export function buildQuickActionPreviewControlPanelsRenderDomSpec(options = {}) {
  const panels = [
    {
      kind: "history",
      spec: options.historyControls || null,
      collapsed: options.historyCollapsed,
    },
    {
      kind: "field-view",
      spec: options.fieldViewControls || null,
      collapsed: options.fieldViewCollapsed,
    },
  ];
  return panels
    .map((panel) => {
      const renderSpec = buildQuickActionPreviewControlPanelRenderDomSpec(
        panel.spec,
        panel.collapsed,
        panel.kind,
      );
      return renderSpec ? { kind: panel.kind, ...renderSpec } : null;
    })
    .filter(Boolean);
}

export function buildQuickActionPreviewControlButtonDomSpec(buttonSpec = null) {
  if (!buttonSpec || typeof buttonSpec !== "object") return null;
  const source = {};
  if (Number.isInteger(buttonSpec.snapshotIndex)) source.snapshotIndex = buttonSpec.snapshotIndex;
  if (buttonSpec.fieldView === "stage" || buttonSpec.fieldView === "snapshot") {
    source.fieldView = buttonSpec.fieldView;
  }
  return {
    type: typeof buttonSpec.type === "string" && buttonSpec.type.trim() ? buttonSpec.type.trim() : "button",
    className: typeof buttonSpec.className === "string" ? buttonSpec.className.trim() : "",
    dataset: buttonSpec.dataset && typeof buttonSpec.dataset === "object" ? buttonSpec.dataset : {},
    text: typeof buttonSpec.text === "string" ? buttonSpec.text : "",
    title: typeof buttonSpec.title === "string" ? buttonSpec.title : "",
    source,
  };
}

export function quickActionPreviewCardControlActionTarget(buttonSpec = null, controlKind = "") {
  if (!buttonSpec || typeof buttonSpec !== "object") return null;
  const source = buttonSpec.source && typeof buttonSpec.source === "object" ? buttonSpec.source : buttonSpec;
  if (controlKind === "history") {
    const snapshotIndex = Number.isInteger(source.snapshotIndex) ? source.snapshotIndex : -1;
    if (snapshotIndex < 0) return null;
    return {
      kind: "history",
      title: typeof buttonSpec.title === "string" ? buttonSpec.title.trim() : "",
      snapshotIndex,
    };
  }
  if (controlKind === "field-view") {
    const fieldView = source.fieldView === "stage" || source.fieldView === "snapshot"
      ? source.fieldView
      : "";
    if (!fieldView) return null;
    return {
      kind: "field-view",
      title: typeof buttonSpec.title === "string" ? buttonSpec.title.trim() : "",
      fieldView,
    };
  }
  return null;
}

export function buildQuickActionPreviewFieldViewControlsDomSpec(hasViewToggle = false, selectedFieldView = "snapshot", options = {}) {
  if (!hasViewToggle) return null;
  const selectedView = selectedFieldView === "stage" ? "stage" : "snapshot";
  const previewState = typeof options.previewState === "string" && options.previewState.trim()
    ? options.previewState.trim()
    : "当前阶段";
  const historyLabel = typeof options.historyLabel === "string" && options.historyLabel.trim()
    ? options.historyLabel.trim()
    : "当前轮次";
  return {
    wrapperClassName: "quick-action-preview-card-view",
    hidden: true,
    attributes: { "aria-hidden": "true" },
    buttons: [
      {
        type: "button",
        dataset: {
          selected: String(selectedView === "stage"),
          previewFieldView: "stage",
        },
        text: "阶段字段",
        title: `切到${previewState}阶段字段`,
        fieldView: "stage",
      },
      {
        type: "button",
        dataset: {
          selected: String(selectedView === "snapshot"),
          previewFieldView: "snapshot",
        },
        text: "原始快照",
        title: `切到${historyLabel}的原始快照字段`,
        fieldView: "snapshot",
      },
    ],
  };
}

export function buildQuickActionPreviewCardChromeModel(options = {}) {
  const previewState = typeof options.previewState === "string" ? options.previewState.trim() : "";
  const historyLabel = typeof options.historyLabel === "string" ? options.historyLabel.trim() : "";
  const fieldViewLabel = typeof options.fieldViewLabel === "string" ? options.fieldViewLabel.trim() : "";
  const selectedFieldView = options.selectedFieldView === "stage" ? "stage" : "snapshot";
  const historyLength =
    Number.isInteger(options.historyLength) && options.historyLength > 0 ? options.historyLength : 0;
  const selectedHistoryIndex =
    Number.isInteger(options.selectedHistoryIndex) && options.selectedHistoryIndex >= 0
      ? options.selectedHistoryIndex
      : -1;
  const selectedHistoryIsLatest = historyLength > 0 && selectedHistoryIndex === historyLength - 1;
  return {
    currentStripText: [previewState, historyLabel, fieldViewLabel].filter(Boolean).join(" · "),
    historyTone: selectedHistoryIsLatest ? "warm" : "muted",
    historySnapshotRole: selectedHistoryIsLatest ? "latest" : "history",
    historyToggleTitle: historyLength > 1 ? "切到下一轮历史快照" : "",
    nextHistoryIndex:
      historyLength > 1 && selectedHistoryIndex >= 0
        ? (selectedHistoryIndex + 1 + historyLength) % historyLength
        : null,
    fieldViewToggleTitle: selectedFieldView === "stage" ? "切到原始快照字段" : "切到阶段字段",
    nextFieldView: selectedFieldView === "stage" ? "snapshot" : "stage",
    historyControlsCollapsed: historyLength > 1 ? "true" : "false",
    fieldViewControlsCollapsed: options.hasViewToggle ? "true" : "false",
  };
}

export function buildQuickActionInlinePreviewCardModel(options = {}) {
  const preview = options.preview;
  if (!preview?.action || !preview?.state || !preview?.structured) return null;
  const fieldSets = quickActionInlinePreviewFieldSets(preview.action, preview.structured, {
    maxFields: Math.max(1, Number(options.maxFields) || 2),
    state: preview.state,
  });
  const history = Array.isArray(preview.history) ? preview.history : [];
  const isLatestSnapshot =
    history.length > 0 &&
    Number.isInteger(preview.snapshotIndex) &&
    preview.snapshotIndex === history.length - 1;
  const resolvedFieldView =
    options.resolvedPreviewView?.fieldView === "stage" || options.resolvedPreviewView?.fieldView === "snapshot"
      ? options.resolvedPreviewView.fieldView
      : "";
  const selectedFieldView =
    options.selectedFieldView === "stage" || options.selectedFieldView === "snapshot"
      ? options.selectedFieldView
      : "";
  const fieldView =
    resolvedFieldView ||
    selectedFieldView ||
    (fieldSets.hasViewToggle ? "" : isLatestSnapshot ? "stage" : "snapshot") ||
    (isLatestSnapshot ? "stage" : "snapshot");
  const fields = fieldView === "snapshot" ? fieldSets.snapshotFields : fieldSets.stageFields;
  const summary =
    fieldView === "stage" && preview.followUpCopy
      ? preview.followUpCopy
      : fields[0]?.label && fields[0]?.value
      ? `${fields[0].label}：${fields[0].value}`
      : options.previewField || "";
  return {
    fieldSets,
    history,
    fieldView,
    fields,
    summary,
  };
}

export function buildQuickActionInlinePreviewCardDomModel(options = {}) {
  const actionIntensity = typeof options.actionIntensity === "string" ? options.actionIntensity.trim() : "";
  const meta = options.meta || {};
  return {
    className: "room-inline-preview-card",
    dataset: actionIntensity ? { actionIntensity } : {},
    datasetFlags: {
      inlineHistoryControlsCollapsed:
        typeof meta.historyControlsCollapsed === "string" ? meta.historyControlsCollapsed : "false",
      inlineFieldViewControlsCollapsed:
        typeof meta.fieldViewControlsCollapsed === "string" ? meta.fieldViewControlsCollapsed : "false",
    },
  };
}

export function quickActionPreviewViewingLatest(preview) {
  const history = Array.isArray(preview?.history) ? preview.history.filter(Boolean) : [];
  if (!history.length || !Number.isInteger(preview?.snapshotIndex)) return true;
  return preview.snapshotIndex >= history.length - 1;
}

export function buildQuickActionInlinePreviewRenderModel(options = {}) {
  const preview = options.preview;
  const card = buildQuickActionInlinePreviewCardModel(options);
  if (!card) return null;
  const viewingLatest =
    typeof options.viewingLatest === "boolean"
      ? options.viewingLatest
      : quickActionPreviewViewingLatest(preview);
  const header = buildQuickActionInlinePreviewHeaderModel({
    preview,
    summary: card.summary,
  });
  const meta = buildQuickActionInlinePreviewMetaModel({
    preview,
    history: card.history,
    fieldView: card.fieldView,
    hasViewToggle: card.fieldSets.hasViewToggle,
  });
  const cardDom = buildQuickActionInlinePreviewCardDomModel({
    actionIntensity: quickActionIntensity(preview.action),
    meta,
  });
  const metaSections = buildQuickActionInlinePreviewMetaSectionsModel(meta);
  const controls = buildQuickActionInlinePreviewControlsModel({
    preview,
    history: card.history,
    fieldView: card.fieldView,
    hasViewToggle: card.fieldSets.hasViewToggle,
  });
  const fieldRows = buildQuickActionInlinePreviewFieldRowsModel(card.fields);
  const actions = buildQuickActionInlinePreviewActionModel({
    action: preview.action,
    state: preview.state,
    viewingLatest,
    historyLabel: preview.historyLabel,
  });
  return {
    card,
    cardDom,
    header,
    meta,
    metaSections,
    controls,
    fieldRows,
    actions,
  };
}

export function buildQuickActionInlinePreviewCardRenderDomModel(renderModel = {}) {
  const source = renderModel && typeof renderModel === "object" ? renderModel : {};
  if (!source.cardDom) return null;
  const header = buildQuickActionInlinePreviewHeaderDomModel(source.header);
  const meta = buildQuickActionInlinePreviewMetaRenderDomModel(
    source.metaSections,
    source.meta?.currentStripText || "",
  );
  const controls = buildQuickActionInlinePreviewControlsRenderDomModel(source.controls);
  const fieldRows = buildQuickActionInlinePreviewFieldRowsRenderDomModel(source.fieldRows);
  const actions = buildQuickActionInlinePreviewActionRenderDomModel(source.actions);
  const headerChildren = Array.isArray(header?.children) ? header.children : [];
  const children = [
    {
      kind: "header",
      placement: "before-meta",
      children: headerChildren.filter((child) => child.placement === "before-meta"),
    },
    meta ? { kind: "meta", model: meta } : null,
    {
      kind: "header",
      placement: "after-meta",
      children: headerChildren.filter((child) => child.placement === "after-meta"),
    },
    controls ? { kind: "controls", model: controls } : null,
    fieldRows ? { kind: "fieldRows", model: fieldRows } : null,
    actions ? { kind: "actions", model: actions } : null,
  ].filter((child) => {
    if (!child) return false;
    if (child.kind === "header") return child.children.length > 0;
    return true;
  });
  return {
    card: source.cardDom,
    header,
    meta,
    controls,
    fieldRows,
    actions,
    children,
  };
}

export function buildQuickActionInlinePreviewPanelModel(options = {}) {
  const previewField =
    typeof options.previewField === "string" && options.previewField.trim()
      ? options.previewField.trim()
      : typeof options.resolvedPreviewView?.primaryFieldText === "string"
        ? options.resolvedPreviewView.primaryFieldText.trim()
        : "";
  const hint = buildQuickActionInlinePreviewHintModel({
    preview: options.preview,
    previewField,
  });
  if (!hint) return null;
  const render = buildQuickActionInlinePreviewRenderModel({
    ...options,
    previewField,
  });
  if (!render) return null;
  return {
    hint,
    render,
  };
}

export function buildQuickActionInlinePreviewPanelRenderDomModel(panelModel = {}, actionIntensity = "") {
  const source = panelModel && typeof panelModel === "object" ? panelModel : {};
  const hint = buildQuickActionInlinePreviewHintRenderDomModel(source.hint, actionIntensity);
  const card = buildQuickActionInlinePreviewCardRenderDomModel(source.render);
  if (!hint || !card) return null;
  return {
    hint,
    card,
  };
}

export function buildQuickActionInlinePreviewMetaModel(options = {}) {
  const preview = options.preview || {};
  const history = Array.isArray(options.history) ? options.history : [];
  const fieldView = options.fieldView === "stage" ? "stage" : "snapshot";
  const hasViewToggle = Boolean(options.hasViewToggle);
  const historyLength = history.length;
  const snapshotIndex =
    Number.isInteger(preview.snapshotIndex) && preview.snapshotIndex >= 0
      ? preview.snapshotIndex
      : historyLength
        ? historyLength - 1
        : null;
  const latestSnapshotIndex = historyLength ? historyLength - 1 : null;
  const nextHistoryIndex =
    historyLength > 1 && Number.isInteger(snapshotIndex)
      ? (snapshotIndex + 1) % historyLength
      : null;
  const nextFieldView = fieldView === "stage" ? "snapshot" : "stage";
  const fieldViewToggleTitle =
    nextFieldView === "stage"
      ? `切到${preview.state || "当前"}阶段字段`
      : `切到${preview.historyLabel || "当前轮次"}的原始快照字段`;
  const pill = (label, kind, dataset = {}, action = null) => {
    const text = typeof label === "string" ? label.trim() : "";
    if (!text) return null;
    return { label: text, kind, dataset, action };
  };
  const currentPills = [
    pill(preview.state, "state", {
      previewMeta: "state",
      currentMetaRole: "state",
    }),
    pill(
      preview.historyLabel,
      "history",
      {
        previewMeta: "history",
        currentMetaRole: "history",
        snapshotIndex: Number.isInteger(snapshotIndex) ? String(snapshotIndex) : "",
        snapshotRole: snapshotIndex === latestSnapshotIndex ? "latest" : "history",
        selected: "true",
      },
      nextHistoryIndex === null
        ? null
        : {
            type: "history",
            snapshotIndex: nextHistoryIndex,
            title: quickActionPreviewHistoryDescription(history[nextHistoryIndex], nextHistoryIndex, historyLength),
          },
    ),
    pill(
      quickActionPreviewFieldViewLabel(fieldView),
      "field-view",
      {
        previewMeta: "field-view",
        currentMetaRole: "field-view",
        previewFieldView: fieldView,
        selected: "true",
      },
      hasViewToggle
        ? {
            type: "field-view",
            fieldView: nextFieldView,
            nextFieldView,
            title: fieldViewToggleTitle,
          }
        : null,
    ),
  ].filter(Boolean);
  const historyOptions =
    historyLength > 1
      ? history.map((snapshot, index) =>
          pill(
            quickActionPreviewHistoryLabel(snapshot, index, historyLength),
            "history",
            {
              previewMetaOption: "history",
              snapshotIndex: String(index),
              snapshotRole: index === latestSnapshotIndex ? "latest" : "history",
              selected: String(index === snapshotIndex),
            },
            {
              type: "history",
              snapshotIndex: index,
              title: quickActionPreviewHistoryDescription(snapshot, index, historyLength),
            },
          ),
        ).filter(Boolean)
      : [];
  const fieldViewOptions = hasViewToggle
    ? [
        ["stage", "阶段字段"],
        ["snapshot", "原始快照"],
      ].map(([viewId, label]) =>
        pill(
          label,
          "field-view",
          {
            previewMetaOption: "field-view",
            previewFieldView: viewId,
            selected: String(fieldView === viewId),
          },
          {
            type: "field-view",
            fieldView: viewId,
            title:
              viewId === "stage"
                ? `切到${preview.state || "当前"}阶段字段`
                : `切到${preview.historyLabel || "当前轮次"}的原始快照字段`,
          },
        ),
      ).filter(Boolean)
    : [];
  return {
    currentStripText: [preview.state, preview.historyLabel, quickActionPreviewFieldViewLabel(fieldView)]
      .filter(Boolean)
      .join(" · "),
    currentPills,
    historyOptions,
    fieldViewOptions,
    historyControlsCollapsed: historyOptions.length > 0 ? "true" : "false",
    fieldViewControlsCollapsed: fieldViewOptions.length > 0 ? "true" : "false",
  };
}

export function buildQuickActionInlinePreviewMetaSectionsModel(metaModel = {}) {
  const sectionSpecs = [
    ["current", "当前", metaModel?.currentPills],
    ["history", "轮次", metaModel?.historyOptions],
    ["field-view", "视图", metaModel?.fieldViewOptions],
  ];
  const sections = sectionSpecs
    .map(([id, label, pills]) => ({
      id,
      label,
      pills: Array.isArray(pills) ? pills.filter(Boolean) : [],
    }))
    .filter((section) => section.pills.length > 0);
  return {
    sections,
    hasSections: sections.length > 0,
  };
}

export function buildQuickActionInlinePreviewMetaDomModel(metaSectionsModel = {}, currentStripText = "") {
  const sections = Array.isArray(metaSectionsModel?.sections) ? metaSectionsModel.sections : [];
  if (!metaSectionsModel?.hasSections || !sections.length) return null;
  const stripText = typeof currentStripText === "string" ? currentStripText.trim() : "";
  const cleanDataset = (dataset = {}) =>
    Object.fromEntries(
      Object.entries(dataset || {})
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => [key, String(value)]),
    );
  const pillModel = (pillSpec) => {
    const label = typeof pillSpec?.label === "string" ? pillSpec.label.trim() : "";
    if (!label) return null;
    return {
      className: "room-inline-preview-card-meta-pill",
      label,
      dataset: {
        metaKind: String(pillSpec.kind || ""),
        ...cleanDataset(pillSpec.dataset),
      },
      action: pillSpec.action || null,
    };
  };
  const sectionModels = sections
    .map((section) => {
      const id = typeof section?.id === "string" ? section.id.trim() : "";
      const label = typeof section?.label === "string" ? section.label.trim() : "";
      const pills = Array.isArray(section?.pills) ? section.pills.map(pillModel).filter(Boolean) : [];
      if (!id || !label || !pills.length) return null;
      const isCurrent = id === "current";
      return {
        id,
        labelNode: {
          className: "room-inline-preview-card-meta-label",
          dataset: { metaSection: id },
          label,
        },
        container: isCurrent
          ? {
              className: "room-inline-preview-card-meta-current",
              dataset: {},
              currentStrip: {
                className: "room-inline-preview-card-current-strip",
                dataset: { currentMetaRole: "summary" },
                label: stripText,
              },
            }
          : {
              className: "room-inline-preview-card-meta-options",
              dataset: { optionKind: id },
            },
        pills,
      };
    })
    .filter(Boolean);
  if (!sectionModels.length) return null;
  return {
    className: "room-inline-preview-card-meta",
    sections: sectionModels,
  };
}

export function buildQuickActionInlinePreviewMetaRenderDomModel(
  metaSectionsModel = {},
  currentStripText = "",
) {
  const domModel = buildQuickActionInlinePreviewMetaDomModel(metaSectionsModel, currentStripText);
  if (!domModel) return null;
  const metaChildNode = (nodeSpec = {}) => ({
    type: nodeSpec.type || "span",
    className: nodeSpec.className,
    dataset: nodeSpec.dataset || {},
    text: nodeSpec.label || "",
  });
  return {
    ...domModel,
    sections: domModel.sections.map((section) => {
      const pills = section.pills.map((pill) => {
        const actionTarget = quickActionInlinePreviewMetaActionTarget(pill.action);
        return {
          ...pill,
          actionTarget,
          clickable: actionTarget ? quickActionInlinePreviewClickableDomSpec(actionTarget.title) : null,
        };
      });
      const containerChildren = [
        section.container.currentStrip ? metaChildNode(section.container.currentStrip) : null,
        ...pills.map((pill) => ({
          type: "span",
          className: pill.className,
          dataset: pill.dataset,
          text: pill.label,
          actionTarget: pill.actionTarget,
          clickable: pill.clickable,
        })),
      ].filter(Boolean);
      return {
        ...section,
        pills,
        children: [
          metaChildNode(section.labelNode),
          {
            type: "div",
            className: section.container.className,
            dataset: section.container.dataset || {},
            children: containerChildren,
          },
        ],
      };
    }),
  };
}

export function quickActionInlinePreviewMetaActionTarget(actionSpec = null) {
  const title = typeof actionSpec?.title === "string" ? actionSpec.title.trim() : "";
  if (actionSpec?.type === "history") {
    const snapshotIndex = Number.isInteger(actionSpec.snapshotIndex) ? actionSpec.snapshotIndex : -1;
    if (snapshotIndex < 0) return null;
    return {
      type: "history",
      title,
      snapshotIndex,
    };
  }
  if (actionSpec?.type === "field-view") {
    const fieldView =
      actionSpec.fieldView === "stage" || actionSpec.fieldView === "snapshot"
        ? actionSpec.fieldView
        : "";
    if (!fieldView) return null;
    return {
      type: "field-view",
      title,
      fieldView,
    };
  }
  return null;
}

export function buildQuickActionInlinePreviewHeaderModel(options = {}) {
  const preview = options?.preview || {};
  const stageText = typeof preview.state === "string" ? preview.state.trim() : "";
  const summaryText = typeof options?.summary === "string" ? options.summary.trim() : "";
  return {
    stageText,
    summaryText,
    hasStage: Boolean(stageText),
    hasSummary: Boolean(summaryText),
  };
}

export function buildQuickActionInlinePreviewHeaderDomModel(headerModel = {}) {
  const lineSpecs = [
    ["stage", "before-meta", "room-inline-preview-card-stage", headerModel.stageText],
    ["summary", "after-meta", "room-inline-preview-card-summary", headerModel.summaryText],
  ];
  const lines = lineSpecs
    .map(([key, placement, className, label]) => ({
      key,
      className,
      label: typeof label === "string" ? label.trim() : "",
      placement,
    }))
    .filter((line) => line.label);
  return lines.length
    ? {
        lines: lines.map(({ key, className, label }) => ({ key, className, label })),
        children: lines.map((line) => ({
          type: "div",
          key: line.key,
          placement: line.placement,
          className: line.className,
          text: line.label,
        })),
      }
    : null;
}

export function buildQuickActionInlinePreviewControlsModel(options = {}) {
  const preview = options.preview || {};
  const history = Array.isArray(options.history) ? options.history : [];
  const fieldView = options.fieldView === "stage" ? "stage" : "snapshot";
  const selectedSnapshotIndex =
    Number.isInteger(preview.snapshotIndex) && preview.snapshotIndex >= 0
      ? preview.snapshotIndex
      : history.length
        ? history.length - 1
        : null;
  const historyButtons =
    history.length > 1
      ? history.map((snapshot, index) => ({
          label: quickActionPreviewHistoryLabel(snapshot, index, history.length),
          title: quickActionPreviewHistoryDescription(snapshot, index, history.length),
          dataset: {
            selected: String(index === selectedSnapshotIndex),
            snapshotIndex: String(index),
            snapshotRole: index === history.length - 1 ? "latest" : "history",
          },
          action: {
            type: "history",
            snapshotIndex: index,
          },
        }))
      : [];
  const fieldViewButtons = options.hasViewToggle
    ? [
        ["stage", "阶段字段"],
        ["snapshot", "原始快照"],
      ].map(([viewId, label]) => ({
        label,
        title:
          viewId === "stage"
            ? `切到${preview.state || "当前"}阶段字段`
            : `切到${preview.historyLabel || "当前轮次"}的原始快照字段`,
        dataset: {
          roomInlinePreviewView: viewId,
          selected: String(fieldView === viewId),
        },
        action: {
          type: "field-view",
          fieldView: viewId,
        },
      }))
    : [];
  return {
    historyButtons,
    historyHidden: historyButtons.length > 0,
    historyAriaHidden: historyButtons.length > 0 ? "true" : "false",
    fieldViewButtons,
    fieldViewHidden: fieldViewButtons.length > 0,
    fieldViewAriaHidden: fieldViewButtons.length > 0 ? "true" : "false",
  };
}

export function buildQuickActionInlinePreviewControlsDomModel(controlsModel = {}) {
  const source = controlsModel && typeof controlsModel === "object" ? controlsModel : {};
  const cleanDataset = (dataset = {}) =>
    Object.fromEntries(
      Object.entries(dataset || {})
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => [key, String(value)]),
    );
  const buttonModel = (buttonSpec) => {
    const label = typeof buttonSpec?.label === "string" ? buttonSpec.label.trim() : "";
    if (!label) return null;
    return {
      type: "button",
      label,
      title: typeof buttonSpec?.title === "string" ? buttonSpec.title.trim() : "",
      dataset: cleanDataset(buttonSpec.dataset),
      action: buttonSpec.action || null,
    };
  };
  const groupSpecs = [
    {
      key: "history",
      className: "room-inline-preview-card-history",
      buttons: source.historyButtons,
      hidden: source.historyHidden,
      ariaHidden: source.historyAriaHidden,
    },
    {
      key: "field-view",
      className: "room-inline-preview-card-view",
      buttons: source.fieldViewButtons,
      hidden: source.fieldViewHidden,
      ariaHidden: source.fieldViewAriaHidden,
    },
  ];
  const groups = groupSpecs
    .map((group) => ({
      key: group.key,
      className: group.className,
      hidden: Boolean(group.hidden),
      ariaHidden: typeof group.ariaHidden === "string" ? group.ariaHidden : "false",
      buttons: Array.isArray(group.buttons) ? group.buttons.map(buttonModel).filter(Boolean) : [],
    }))
    .filter((group) => group.buttons.length > 0);
  return groups.length ? { groups } : null;
}

export function buildQuickActionInlinePreviewControlsRenderDomModel(controlsModel = {}) {
  const domModel = buildQuickActionInlinePreviewControlsDomModel(controlsModel);
  if (!domModel) return null;
  const renderButton = (button) => {
    const actionTarget = quickActionInlinePreviewControlActionTarget(button.action);
    const clickable = actionTarget ? quickActionInlinePreviewClickableDomSpec(button.title) : null;
    return {
      ...button,
      actionTarget,
      clickable,
    };
  };
  const buttonChild = (button) => ({
    type: "button",
    buttonType: button.type,
    dataset: button.dataset,
    text: button.label,
    title: button.title,
    actionTarget: button.actionTarget,
    clickable: button.clickable,
  });
  return {
    ...domModel,
    groups: domModel.groups.map((group) => {
      const buttons = group.buttons.map(renderButton);
      return {
        ...group,
        buttons,
        children: buttons.map(buttonChild),
      };
    }),
  };
}

export function quickActionInlinePreviewControlActionTarget(actionSpec = null) {
  if (actionSpec?.type === "history") {
    const snapshotIndex = Number.isInteger(actionSpec.snapshotIndex) ? actionSpec.snapshotIndex : -1;
    if (snapshotIndex < 0) return null;
    return {
      type: "history",
      snapshotIndex,
    };
  }
  if (actionSpec?.type === "field-view") {
    const fieldView =
      actionSpec.fieldView === "stage" || actionSpec.fieldView === "snapshot"
        ? actionSpec.fieldView
        : "";
    if (!fieldView) return null;
    return {
      type: "field-view",
      fieldView,
    };
  }
  return null;
}

export function buildQuickActionInlinePreviewActionModel(options = {}) {
  const action = typeof options.action === "string" ? options.action.trim() : "";
  const state = typeof options.state === "string" ? options.state.trim() : "";
  const viewingLatest = options.viewingLatest !== false;
  const labels = quickActionInlinePreviewActionLabels(action, state);
  const orderedActionIds = quickActionInlinePreviewActionOrder(action, state, { viewingLatest });
  const actions = orderedActionIds
    .map((actionId, index) => {
      const label = labels[actionId];
      if (!label) return null;
      const title = quickActionInlinePreviewActionHint(action, state, actionId, {
        viewingLatest,
        historyLabel: options.historyLabel,
      });
      return {
        id: actionId,
        label,
        title,
        dataset: {
          roomInlinePreviewAction: actionId,
          roomInlinePreviewPriority: index === 0 ? "primary" : "secondary",
          roomInlinePreviewDefault: index === 0 ? "true" : "false",
        },
      };
    })
    .filter(Boolean);
  return { actions };
}

export function buildQuickActionInlinePreviewActionDomModel(actionModel = {}) {
  const cleanDataset = (dataset = {}) =>
    Object.fromEntries(
      Object.entries(dataset || {})
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => [key, String(value)]),
    );
  const buttons = (Array.isArray(actionModel.actions) ? actionModel.actions : [])
    .map((actionSpec) => {
      const id = typeof actionSpec?.id === "string" ? actionSpec.id.trim() : "";
      const label = typeof actionSpec?.label === "string" ? actionSpec.label.trim() : "";
      if (!id || !label) return null;
      const title = typeof actionSpec?.title === "string" ? actionSpec.title.trim() : "";
      return {
        type: "button",
        id,
        label,
        title,
        ariaLabel: title,
        dataset: cleanDataset(actionSpec.dataset),
      };
    })
    .filter(Boolean);
  return buttons.length
    ? {
        className: "room-inline-preview-card-actions",
        buttons,
      }
    : null;
}

export function buildQuickActionInlinePreviewActionRenderDomModel(actionModel = {}) {
  const domModel = buildQuickActionInlinePreviewActionDomModel(actionModel);
  if (!domModel) return null;
  const renderButton = (button) => {
    const actionTarget = quickActionInlinePreviewActionTarget(button);
    const clickable = actionTarget ? quickActionInlinePreviewClickableDomSpec(button.title) : null;
    return {
      ...button,
      actionTarget,
      clickable,
    };
  };
  const buttonChild = (button) => ({
    type: "button",
    buttonType: button.type,
    dataset: button.dataset,
    text: button.label,
    title: button.title,
    ariaLabel: button.ariaLabel,
    actionTarget: button.actionTarget,
    clickable: button.clickable,
  });
  const buttons = domModel.buttons.map(renderButton);
  return {
    ...domModel,
    buttons,
    children: buttons.map(buttonChild),
  };
}

export function quickActionInlinePreviewActionTarget(buttonSpec = null) {
  if (buttonSpec?.id === "snapshot") {
    return { type: "snapshot" };
  }
  if (buttonSpec?.id === "workflow") {
    return { type: "workflow" };
  }
  return null;
}

export function quickActionPreviewClickableDomSpec(title = "") {
  const label = typeof title === "string" ? title.trim() : "";
  const attributes = { role: "button" };
  if (label) {
    attributes.title = label;
    attributes["aria-label"] = label;
  }
  return {
    classNames: ["is-clickable"],
    tabIndex: 0,
    attributes,
  };
}

export function quickActionInlinePreviewClickableDomSpec(title = "") {
  return quickActionPreviewClickableDomSpec(title);
}

export function quickActionPreviewKeyActivates(key = "") {
  return key === "Enter" || key === " ";
}

export function buildQuickActionInlinePreviewHintModel(options = {}) {
  const preview = options.preview || {};
  const previewField = typeof options.previewField === "string" ? options.previewField.trim() : "";
  if (!preview?.state || !previewField) return null;
  const history = Array.isArray(preview.history) ? preview.history : [];
  const roundLabel = typeof preview.historyLabel === "string" ? preview.historyLabel.trim() : "";
  const historyToneClass =
    typeof preview.historyToneClass === "string" ? preview.historyToneClass.trim() : "";
  const round = roundLabel
    ? {
        label: roundLabel,
        className: ["room-inline-preview-round", historyToneClass].filter(Boolean).join(" "),
        title: "",
        action: null,
      }
    : null;
  if (round && history.length > 1) {
    const nextSnapshotIndex =
      Number.isInteger(preview.snapshotIndex) && preview.snapshotIndex >= 0
        ? (preview.snapshotIndex + 1) % history.length
        : Math.max(history.length - 1, 0);
    round.title = quickActionPreviewHistoryDescription(
      history[nextSnapshotIndex],
      nextSnapshotIndex,
      history.length,
    );
    round.action = {
      type: "history",
      snapshotIndex: nextSnapshotIndex,
    };
  }
  return {
    stage: {
      label: preview.state,
      title: "点击继续当前阶段",
      action: { type: "workflow" },
    },
    field: {
      label: previewField,
      title: "点击回到当前预览快照",
      action: { type: "snapshot" },
    },
    round,
  };
}

export function buildQuickActionInlinePreviewHintDomModel(hintModel, actionIntensity = "") {
  if (!hintModel?.stage?.label || !hintModel?.field?.label) return null;
  const dataset = {};
  const intensity = typeof actionIntensity === "string" ? actionIntensity.trim() : "";
  if (intensity) {
    dataset.actionIntensity = intensity;
  }
  const nodePart = (key, source, fallbackClassName) => ({
    kind: "node",
    key,
    className: source.className || fallbackClassName,
    label: source.label,
    title: source.title || "",
    action: source.action || null,
  });
  const parts = [
    nodePart("stage", hintModel.stage, "room-inline-preview-stage"),
    { kind: "separator", label: " · " },
    nodePart("field", hintModel.field, "room-inline-preview-field"),
  ];
  if (hintModel.round?.label) {
    parts.push(
      { kind: "separator", label: " · " },
      nodePart("round", hintModel.round, "room-inline-preview-round"),
    );
  }
  return {
    className: "room-inline-preview-hint",
    dataset,
    parts,
  };
}

export function buildQuickActionInlinePreviewHintRenderDomModel(hintModel, actionIntensity = "") {
  const domModel = buildQuickActionInlinePreviewHintDomModel(hintModel, actionIntensity);
  if (!domModel) return null;
  return {
    ...domModel,
    parts: domModel.parts.map((part) => {
      if (part.kind !== "node") return part;
      const actionTarget = quickActionInlinePreviewHintActionTarget(part.action);
      return {
        ...part,
        actionTarget,
        clickable: actionTarget ? quickActionInlinePreviewClickableDomSpec(part.title) : null,
      };
    }),
  };
}

export function quickActionInlinePreviewHintActionTarget(actionSpec = null) {
  if (actionSpec?.type === "workflow") {
    return { type: "workflow" };
  }
  if (actionSpec?.type === "snapshot") {
    return { type: "snapshot" };
  }
  if (actionSpec?.type === "history") {
    const snapshotIndex = Number.isInteger(actionSpec.snapshotIndex) ? actionSpec.snapshotIndex : -1;
    if (snapshotIndex < 0) return null;
    return {
      type: "history",
      snapshotIndex,
    };
  }
  return null;
}

export function buildQuickActionInlinePreviewFieldRowsModel(fields = []) {
  const rows = Array.isArray(fields)
    ? fields
        .map((field) => ({
          label: String(field?.label || "").trim(),
          value: String(field?.value || "").trim() || "待补充",
        }))
        .filter((field) => field.label)
    : [];
  return {
    rows,
    hasRows: rows.length > 0,
  };
}

export function buildQuickActionInlinePreviewFieldRowsDomModel(fieldRowsModel = {}) {
  const rows = (Array.isArray(fieldRowsModel.rows) ? fieldRowsModel.rows : [])
    .map((row) => {
      const label = typeof row?.label === "string" ? row.label.trim() : "";
      if (!label) return null;
      const value = typeof row?.value === "string" && row.value.trim() ? row.value.trim() : "待补充";
      return {
        className: "room-inline-preview-card-row",
        labelNode: {
          className: "room-inline-preview-card-row-label",
          label,
        },
        valueNode: {
          className: "room-inline-preview-card-row-value",
          label: value,
        },
      };
    })
    .filter(Boolean);
  return rows.length
    ? {
        className: "room-inline-preview-card-fields",
        rows,
      }
    : null;
}

export function buildQuickActionInlinePreviewFieldRowsRenderDomModel(fieldRowsModel = {}) {
  const domModel = buildQuickActionInlinePreviewFieldRowsDomModel(fieldRowsModel);
  if (!domModel) return null;
  const childSpec = (nodeSpec) => ({
    type: "div",
    ...nodeSpec,
    text: nodeSpec.label,
  });
  return {
    ...domModel,
    rows: domModel.rows.map((row) => ({
      ...row,
      children: [row.labelNode, row.valueNode].filter(Boolean).map(childSpec),
    })),
  };
}

export function quickActionSnapshotHistoryFromRecord(roomRecord, action = "", state = "") {
  if (!action || !state || !roomRecord || typeof roomRecord !== "object") return [];
  const actionRecord = roomRecord?.[action];
  if (!actionRecord || typeof actionRecord !== "object") return [];
  const raw = actionRecord?.[state];
  if (Array.isArray(raw)) {
    return raw.filter((item) => item && typeof item === "object");
  }
  if (raw && typeof raw === "object") {
    return [raw];
  }
  return [];
}

export function quickActionSnapshotFromHistory(history = [], snapshotIndex = null) {
  if (!Array.isArray(history) || !history.length) return null;
  if (Number.isInteger(snapshotIndex) && snapshotIndex >= 0 && snapshotIndex < history.length) {
    return history[snapshotIndex];
  }
  return history[history.length - 1] || null;
}

export function quickActionPreviewDefaultFieldView(historyLength, snapshotIndex = null) {
  if (!Number.isInteger(historyLength) || historyLength <= 0) return "stage";
  if (Number.isInteger(snapshotIndex) && snapshotIndex >= 0 && snapshotIndex < historyLength) {
    return snapshotIndex === historyLength - 1 ? "stage" : "snapshot";
  }
  return "stage";
}

export function quickActionPreviewResolvedSnapshotIndex(historyLength, snapshotIndex = null) {
  if (!Number.isInteger(historyLength) || historyLength <= 0) return null;
  if (Number.isInteger(snapshotIndex) && snapshotIndex >= 0 && snapshotIndex < historyLength) {
    return snapshotIndex;
  }
  return historyLength - 1;
}

export function quickActionPreviewSelectedState(record, action = "", stages = []) {
  if (!action || !Array.isArray(stages) || !stages.length) return "";
  if (record?.action !== action) return "";
  return stages.some((stage) => stage?.label === record?.state) ? record.state : "";
}

export function quickActionPreviewSelectedSnapshotIndex(
  record,
  action = "",
  state = "",
  historyLength = 0,
) {
  if (!action || !state) return null;
  if (!Number.isInteger(historyLength) || historyLength <= 0) return null;
  if (record?.action === action && record?.state === state) {
    return quickActionPreviewResolvedSnapshotIndex(historyLength, record?.snapshotIndex);
  }
  return quickActionPreviewResolvedSnapshotIndex(historyLength, null);
}

export function quickActionPreviewSelectedFieldView(
  record,
  action = "",
  state = "",
  historyLength = 0,
  snapshotIndex = null,
  options = {},
) {
  const fieldKey = options.fieldKey || "fieldView";
  const resolvedSnapshotIndex = quickActionPreviewResolvedSnapshotIndex(historyLength, snapshotIndex);
  const recordSnapshotIndex = quickActionPreviewResolvedSnapshotIndex(historyLength, record?.snapshotIndex);
  const recordFieldView = record?.[fieldKey];
  if (
    record?.action === action &&
    record?.state === state &&
    recordSnapshotIndex === resolvedSnapshotIndex &&
    (recordFieldView === "stage" || recordFieldView === "snapshot")
  ) {
    return recordFieldView;
  }
  if (options.fallback === "stage" || options.fallback === "snapshot") {
    return options.fallback;
  }
  return quickActionPreviewDefaultFieldView(historyLength, resolvedSnapshotIndex);
}

export function quickActionPreviewHistoryToneClass(historyLength, snapshotIndex = null) {
  if (
    !Number.isInteger(historyLength) ||
    historyLength <= 1 ||
    !Number.isInteger(snapshotIndex) ||
    snapshotIndex < 0 ||
    snapshotIndex >= historyLength
  ) {
    return "";
  }
  return snapshotIndex === historyLength - 1 ? "summary-round" : "summary-history";
}

export function normalizeQuickActionFieldLabel(label = "") {
  return String(label || "")
    .replace(/^[\-•\s]+/u, "")
    .replace(/[：:]\s*$/u, "")
    .trim();
}

export function quickActionPreviewRoundLabel(index, historyLength, options = {}) {
  if (!Number.isInteger(index) || index < 0 || !Number.isInteger(historyLength) || historyLength <= 0) {
    return "";
  }
  if (index === historyLength - 1) {
    return options.includeLatestIndex ? `最新轮（第${index + 1}轮）` : "最新轮";
  }
  return `第${index + 1}轮`;
}

export function quickActionPreviewHistorySummary(snapshot) {
  const firstField = Array.isArray(snapshot?.fields)
    ? snapshot.fields.find((field) => typeof field?.label === "string" && field.label.trim())
    : null;
  if (!firstField) return "";
  return String(firstField.label)
    .replace(/^[\-•\s]+/u, "")
    .replace(/[：:]\s*$/u, "")
    .trim();
}

export function quickActionPreviewHistoryLabel(snapshot, index, historyLength) {
  const prefix = quickActionPreviewRoundLabel(index, historyLength);
  const summary = quickActionPreviewHistorySummary(snapshot);
  return summary ? `${prefix} · ${summary}` : prefix;
}

export function quickActionPreviewHistoryDescription(snapshot, index, historyLength) {
  const prefix = quickActionPreviewRoundLabel(index, historyLength, { includeLatestIndex: true });
  const summary = quickActionPreviewHistorySummary(snapshot);
  return summary ? `${prefix} · ${summary}` : prefix;
}

export function quickActionPreviewPrimaryField(structured) {
  const firstField = Array.isArray(structured?.fields)
    ? structured.fields.find((field) => typeof field?.label === "string" && field.label.trim())
    : null;
  if (!firstField) return null;
  const label = normalizeQuickActionFieldLabel(firstField.label);
  const value = String(firstField.value || "").trim();
  if (!label && !value) return null;
  return { label, value };
}

export function quickActionPreviewPrimaryFieldText(structured) {
  const field = quickActionPreviewPrimaryField(structured);
  if (!field) return "";
  const { label, value } = field;
  if (!label) return value;
  if (!value) return label;
  return `${label}：${value}`;
}

export function quickActionInlinePreviewFields(action, structured, options = {}) {
  const maxFields = Math.max(1, Number(options.maxFields) || 2);
  if (!Array.isArray(structured?.fields) || !structured.fields.length) return [];
  const normalizedFields = structured.fields
    .map((field) => ({
      label: normalizeQuickActionFieldLabel(field?.label),
      value: String(field?.value || "").trim(),
    }))
    .filter((field) => field.label || field.value);
  if (!normalizedFields.length) return [];

  const selected = [];
  const used = new Set();
  const preferred =
    (options.preferCurrentStage
      ? QUICK_ACTION_INLINE_STATE_FIELD_PRIORITY[action]?.[options.state]
      : null) ||
    QUICK_ACTION_INLINE_FIELD_PRIORITY[action] ||
    [];

  if (options.preferCurrentStage && preferred.length) {
    for (const preferredLabel of preferred.slice(0, maxFields)) {
      const matchIndex = normalizedFields.findIndex(
        (field, index) => !used.has(index) && field.label === preferredLabel,
      );
      if (matchIndex >= 0) {
        selected.push(normalizedFields[matchIndex]);
        used.add(matchIndex);
      } else {
        selected.push({ label: preferredLabel, value: "待补充" });
      }
    }
    return selected;
  }

  for (const preferredLabel of preferred) {
    const matchIndex = normalizedFields.findIndex(
      (field, index) => !used.has(index) && field.label === preferredLabel,
    );
    if (matchIndex >= 0) {
      selected.push(normalizedFields[matchIndex]);
      used.add(matchIndex);
    }
    if (selected.length >= maxFields) return selected;
  }

  for (let index = 0; index < normalizedFields.length; index += 1) {
    if (used.has(index)) continue;
    selected.push(normalizedFields[index]);
    if (selected.length >= maxFields) break;
  }

  return selected;
}

export function quickActionInlinePreviewFieldSets(action, structured, options = {}) {
  const maxFields = Math.max(1, Number(options.maxFields) || 2);
  const stageFields = quickActionInlinePreviewFields(action, structured, {
    maxFields,
    state: options.state,
    preferCurrentStage: true,
  });
  const snapshotFields = quickActionInlinePreviewFields(action, structured, {
    maxFields,
    state: options.state,
    preferCurrentStage: false,
  });
  return {
    stageFields,
    snapshotFields,
    hasViewToggle: JSON.stringify(stageFields) !== JSON.stringify(snapshotFields),
  };
}

export function quickActionInlinePreviewActionLabels(action = "", state = "") {
  if (!state) {
    return {
      snapshot: "当前快照",
      workflow: "当前阶段模板",
    };
  }
  return {
    snapshot: `查看${state}`,
    workflow: `${state}模板`,
  };
}

export function quickActionInlinePreviewActionOrder(action = "", state = "", options = {}) {
  const viewingLatest = options.viewingLatest !== false;
  if (!viewingLatest) {
    return ["snapshot", "workflow"];
  }
  return quickActionStage(action, state)?.advanceLabel
    ? ["workflow", "snapshot"]
    : ["snapshot", "workflow"];
}

export function quickActionInlinePreviewActionHint(action = "", state = "", actionId = "", options = {}) {
  const viewingLatest = options.viewingLatest !== false;
  const historyLabel = String(options.historyLabel || "").trim();
  if (actionId === "snapshot") {
    if (!viewingLatest && historyLabel) {
      return `点击回看${historyLabel}的${state}快照并回填到输入框`;
    }
    return `点击查看${state}快照并回填到输入框`;
  }
  if (actionId === "workflow") {
    if (!viewingLatest && historyLabel) {
      return `点击切回当前${state}阶段模板，继续${action || "当前动作"}`;
    }
    return `点击按${state}阶段模板继续${action || "当前动作"}`;
  }
  return "";
}

export function parseStructuredQuickActionMessage(message) {
  const action = typeof message?.quick_action === "string" ? message.quick_action.trim() : "";
  const text = typeof message?.text === "string" ? message.text : "";
  if (!action || !text.includes("\n")) return null;

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const headline = lines[0].replace(/[：:]$/u, "").trim();
  if (headline && headline !== action) {
    return null;
  }

  const fields = [];
  const notes = [];
  for (const line of lines.slice(1)) {
    const match = line.match(/^-+\s*([^：:]+)[：:]\s*(.*)$/u);
    if (match) {
      fields.push({
        label: `- ${match[1].trim()}：`,
        value: match[2].trim() || "待补充",
      });
      continue;
    }
    notes.push(line);
  }

  if (!fields.length) return null;
  return { action, fields, notes };
}

export function normalizeQuickActionStructured(structured, fallbackAction = "") {
  if (!structured || !Array.isArray(structured.fields) || !structured.fields.length) return null;
  const fields = structured.fields
    .map((field) => ({
      label: typeof field?.label === "string" ? field.label.trim() : "",
      value: typeof field?.value === "string" && field.value.trim() ? field.value.trim() : "待补充",
    }))
    .filter((field) => field.label);
  if (!fields.length) return null;
  return {
    action:
      (typeof structured.action === "string" && structured.action.trim()) ||
      (typeof fallbackAction === "string" ? fallbackAction.trim() : ""),
    fields,
    notes: Array.isArray(structured.notes)
      ? structured.notes
          .map((note) => (typeof note === "string" ? note.trim() : ""))
          .filter(Boolean)
      : [],
  };
}

export function quickActionWorkflowStructured(action = "", state = "") {
  if (!action) return null;
  return normalizeQuickActionStructured(
    parseStructuredQuickActionMessage({
      text: quickActionWorkflowTemplate(action, state),
      quick_action: action,
    }),
    action,
  );
}

export function quickActionPreviewStructuredViews(action = "", state = "", structured = null) {
  const snapshotStructured = normalizeQuickActionStructured(structured, action);
  const stageStructured = quickActionWorkflowStructured(action, state) || snapshotStructured;
  return {
    snapshotStructured,
    stageStructured,
    hasViewToggle:
      JSON.stringify(snapshotStructured?.fields || []) !== JSON.stringify(stageStructured?.fields || []),
  };
}

export function resolveQuickActionPreviewView(preview, fieldView = "snapshot") {
  if (!preview?.action || !preview?.state || !preview?.structured) return null;
  const resolvedFieldView = fieldView === "stage" ? "stage" : "snapshot";
  const structuredViews = quickActionPreviewStructuredViews(
    preview.action,
    preview.state,
    preview.structured,
  );
  const activeStructured =
    resolvedFieldView === "stage" ? structuredViews.stageStructured : structuredViews.snapshotStructured;
  const primaryField = quickActionPreviewPrimaryField(activeStructured);
  const primaryFieldText = quickActionPreviewPrimaryFieldText(activeStructured);
  const summaryCopy =
    resolvedFieldView === "stage"
      ? preview.followUpCopy || primaryFieldText
      : primaryFieldText || preview.followUpCopy;
  const detailParts = [preview.state, preview.historyLabel, summaryCopy].filter(Boolean);
  return {
    ...preview,
    fieldView: resolvedFieldView,
    fieldViewLabel: quickActionPreviewFieldViewLabel(resolvedFieldView),
    activeStructured,
    primaryField,
    primaryFieldText,
    summaryCopy,
    detailText: detailParts.join(" · "),
    summaryText: `${quickActionPreviewFieldViewLabel(resolvedFieldView)}：${detailParts.join(" · ")}`,
  };
}
