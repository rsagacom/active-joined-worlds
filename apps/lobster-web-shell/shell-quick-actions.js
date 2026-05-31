/* ============================================================
   shell-quick-actions.js — Quick Action 运行时核心函数
   从 app.js 提取：合同查找、模板解析、状态读写、流程推进标签
   依赖 shell-quick-action-labels / templates / preview 模块
   ============================================================ */

import { quickActionStage } from "./shell-quick-action-labels.js";
import {
  QUICK_ACTION_BLUEPRINTS,
  quickActionWorkflowTemplate as _quickActionWorkflowTemplate,
} from "./shell-quick-action-templates.js";

// ── 模块内部状态 ────────────────────────────────────────────
let _getState = () => ({});

/** app.js 初始化后调用一次即可（闭包捕获 let state） */
export function setStateGetter(fn) {
  if (typeof fn === "function") _getState = fn;
}

function getActionTemplates() {
  const s = _getState();
  const templates = s?.conversation_shell?.action_templates;
  return Array.isArray(templates) ? templates.filter(Boolean) : [];
}

let roomQuickActions = {};

export function resetRoomQuickActions() {
  roomQuickActions = {};
}

// ── 房间快速操作状态 ─────────────────────────────────────────
export function roomQuickAction(roomId) {
  if (!roomId) return "";
  const value = roomQuickActions?.[roomId];
  return typeof value === "string" ? value : "";
}

export function setRoomQuickAction(roomId, action = "") {
  if (!roomId) return;
  if (!action) {
    delete roomQuickActions[roomId];
    return;
  }
  roomQuickActions[roomId] = action;
}

// ── 合同与模板查找 ───────────────────────────────────────────
export function quickActionContract(action) {
  if (!action) return null;
  return (
    getActionTemplates().find(
      (item) => typeof item?.action === "string" && item.action.trim() === action,
    ) || null
  );
}

export function quickActionContractStateTemplate(action, state = "") {
  if (!action || !state) return null;
  const contract = quickActionContract(action);
  if (!Array.isArray(contract?.state_templates)) return null;
  return (
    contract.state_templates.find(
      (item) => typeof item?.state === "string" && item.state.trim() === state,
    ) || null
  );
}

export function quickActionTemplate(action) {
  if (!action) return "";
  const contractTemplate = quickActionContract(action)?.draft_template;
  if (typeof contractTemplate === "string" && contractTemplate.trim()) {
    return contractTemplate;
  }
  return QUICK_ACTION_BLUEPRINTS[action]?.template || `${action}：`;
}

export function quickActionWorkflowTemplate(action, state = "") {
  const stateTemplate = quickActionContractStateTemplate(action, state)?.draft_template;
  if (typeof stateTemplate === "string" && stateTemplate.trim()) return stateTemplate;
  return _quickActionWorkflowTemplate(action, state, quickActionTemplate(action));
}

// ── 标签工具 ─────────────────────────────────────────────────
export function quickActionAdvanceLabel(action, state = "") {
  return quickActionStage(action, state)?.advanceLabel || "";
}
