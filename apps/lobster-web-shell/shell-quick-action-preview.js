import {
  QUICK_ACTION_INLINE_FIELD_PRIORITY,
  QUICK_ACTION_INLINE_STATE_FIELD_PRIORITY,
  quickActionWorkflowTemplate,
} from "./shell-quick-action-templates.js";
import { quickActionStage } from "./shell-quick-action-labels.js";

export function quickActionPreviewFieldViewLabel(fieldView = "snapshot") {
  return fieldView === "stage" ? "阶段字段" : "原始快照";
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
