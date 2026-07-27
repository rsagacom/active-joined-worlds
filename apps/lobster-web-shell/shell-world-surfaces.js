/* ============================================================
   shell-world-surfaces.js — 世界/治理公共表面 DOM 渲染
   只消费注入的 Gateway 投影、元素和动作，不持有页面状态。
   ============================================================ */

import { createLine } from "./shell-dom-helpers.js";
import {
  mirrorSourceCardModel,
  mirrorSourcesEmptyStateText,
  worldDirectoryCityCardModel,
  worldDirectoryEmptyStateText,
  worldSafetyAdvisoryCardModel,
  worldSafetyAdvisoryEmptyStateText,
  worldSafetyEmptyStateText,
  worldSafetyMirrorCardModel,
  worldSafetyReportCardModel,
  worldSafetyReportSummaryCardModel,
  worldSafetySanctionCardModel,
  worldSafetySanctionSummaryCardModel,
  worldSquareEmptyStateText,
  worldSquareNoticeCardModel,
} from "./shell-governance-render.js";

function clearChildren(element) {
  while (element?.firstChild) element.removeChild(element.firstChild);
}

function createEmptyNode(text) {
  const empty = document.createElement("li");
  empty.className = "empty-note";
  empty.textContent = text;
  return empty;
}

function createWorldDirectoryCityCardNode(model) {
  const li = document.createElement("li");
  li.className = model.className;

  const titleRow = document.createElement("div");
  titleRow.className = model.titleRowClassName;
  titleRow.appendChild(createLine("city-name", model.title));
  titleRow.appendChild(createLine("city-slug", model.slug));
  li.appendChild(titleRow);
  li.appendChild(createLine("city-sub", model.description));
  li.appendChild(createLine("city-sub", model.metrics));
  li.appendChild(createLine("city-role", model.mirror));
  return li;
}

function renderWorldDirectory({ listEl, snapshot, gatewayUrl }) {
  if (!listEl) return;
  clearChildren(listEl);
  if (!snapshot?.cities?.length) {
    listEl.appendChild(createEmptyNode(worldDirectoryEmptyStateText({ gatewayUrl })));
    return;
  }

  for (const city of snapshot.cities) {
    listEl.appendChild(createWorldDirectoryCityCardNode(worldDirectoryCityCardModel(city)));
  }
}

function createMirrorSourceCardNode(model) {
  const li = document.createElement("li");
  li.className = model.className;
  li.appendChild(createLine("city-name", model.title));
  li.appendChild(createLine("city-sub", model.status));
  li.appendChild(createLine("city-role", model.metrics));
  if (model.lastSnapshot) li.appendChild(createLine("city-role", model.lastSnapshot));
  return li;
}

function renderMirrorSources({ listEl, sources, gatewayUrl }) {
  if (!listEl) return;
  clearChildren(listEl);
  const sourceList = Array.isArray(sources) ? sources : [];
  if (!sourceList.length) {
    listEl.appendChild(createEmptyNode(mirrorSourcesEmptyStateText({ gatewayUrl })));
    return;
  }

  for (const source of sourceList) {
    listEl.appendChild(createMirrorSourceCardNode(mirrorSourceCardModel(source)));
  }
}

function createWorldSquareNoticeCardNode(model) {
  const li = document.createElement("li");
  li.className = model.className;

  const titleRow = document.createElement("div");
  titleRow.className = model.titleRowClassName;
  titleRow.appendChild(createLine("city-name", model.title));
  titleRow.appendChild(createLine("city-slug", model.meta));
  li.appendChild(titleRow);
  li.appendChild(createLine("city-sub", model.body));
  li.appendChild(createLine("city-role", model.tags));
  return li;
}

function renderWorldSquare({ listEl, notices, gatewayUrl }) {
  if (!listEl) return;
  clearChildren(listEl);
  const noticeList = Array.isArray(notices) ? notices : [];
  if (!noticeList.length) {
    listEl.appendChild(createEmptyNode(worldSquareEmptyStateText({ gatewayUrl })));
    return;
  }

  for (const notice of noticeList) {
    listEl.appendChild(createWorldSquareNoticeCardNode(worldSquareNoticeCardModel(notice)));
  }
}

function createWorldSafetyMirrorCard(model) {
  const li = document.createElement("li");
  li.className = model.className;
  li.appendChild(createLine("city-name", model.title));
  li.appendChild(createLine("city-sub", model.mirrors));
  li.appendChild(createLine("city-role", model.stewards));
  return li;
}

function createWorldSafetyAdvisoryCard(model) {
  const li = document.createElement("li");
  li.className = model.className;
  const titleRow = document.createElement("div");
  titleRow.className = model.titleRowClassName;
  titleRow.appendChild(createLine("city-name", model.title));
  titleRow.appendChild(createLine("city-slug", model.action));
  li.appendChild(titleRow);
  li.appendChild(createLine("city-sub", model.reason));
  li.appendChild(createLine("city-role", model.meta));
  return li;
}

function appendWorldSafetyAdvisoryCards(listEl, safety) {
  const advisories = safety?.advisories || [];
  if (!advisories.length) {
    listEl.appendChild(createEmptyNode(worldSafetyAdvisoryEmptyStateText()));
    return;
  }
  for (const advisory of advisories) {
    listEl.appendChild(createWorldSafetyAdvisoryCard(worldSafetyAdvisoryCardModel(advisory)));
  }
}

function createWorldSafetySanctionSummaryCard(model) {
  const li = document.createElement("li");
  li.className = model.className;
  li.appendChild(createLine("city-name", model.title));
  li.appendChild(createLine("city-sub", model.summary));
  li.appendChild(createLine("city-role", model.meta));
  return li;
}

function createWorldSafetyReportSummaryCard(model) {
  const li = document.createElement("li");
  li.className = model.className;
  li.appendChild(createLine("city-name", model.title));
  li.appendChild(createLine("city-sub", model.summary));
  li.appendChild(createLine("city-role", model.meta));
  return li;
}

function createWorldSafetySanctionCard(model) {
  const li = document.createElement("li");
  li.className = model.className;
  const titleRow = document.createElement("div");
  titleRow.className = model.titleRowClassName;
  titleRow.appendChild(createLine("city-name", model.title));
  titleRow.appendChild(createLine("city-slug", model.status));
  li.appendChild(titleRow);
  li.appendChild(createLine("city-sub", model.reason));
  li.appendChild(createLine("city-role", model.meta));
  return li;
}

function createWorldSafetyReportCard(model) {
  const li = document.createElement("li");
  li.className = model.className;
  const titleRow = document.createElement("div");
  titleRow.className = model.titleRowClassName;
  titleRow.appendChild(createLine("city-name", model.title));
  titleRow.appendChild(createLine("city-slug", model.status));
  li.appendChild(titleRow);
  li.appendChild(createLine("city-sub", model.summary));
  li.appendChild(createLine("city-role", model.meta));
  return li;
}

function renderWorldSafety({ listEl, safety, gatewayUrl }) {
  if (!listEl) return;
  clearChildren(listEl);
  if (!safety) {
    listEl.appendChild(createEmptyNode(worldSafetyEmptyStateText({ gatewayUrl })));
    return;
  }

  listEl.appendChild(createWorldSafetyMirrorCard(worldSafetyMirrorCardModel(safety)));
  appendWorldSafetyAdvisoryCards(listEl, safety);

  const residentSanctions = safety.resident_sanctions || [];
  const blacklistEntries = safety.registration_blacklist || [];
  const reports = safety.reports || [];
  listEl.appendChild(
    createWorldSafetySanctionSummaryCard(
      worldSafetySanctionSummaryCardModel(residentSanctions, blacklistEntries),
    ),
  );
  listEl.appendChild(
    createWorldSafetyReportSummaryCard(worldSafetyReportSummaryCardModel(reports)),
  );

  for (const sanction of residentSanctions.slice(0, 6)) {
    listEl.appendChild(createWorldSafetySanctionCard(worldSafetySanctionCardModel(sanction)));
  }
  for (const report of reports.slice(0, 6)) {
    listEl.appendChild(createWorldSafetyReportCard(worldSafetyReportCardModel(report)));
  }
}

export function createWorldSurfaceRenderers({
  worldDirectoryListEl = null,
  worldMirrorSourceListEl = null,
  worldSquareListEl = null,
  worldSafetyListEl = null,
  getGatewayUrl = () => "",
  getWorldDirectory = () => null,
  getWorldMirrorSources = () => [],
  getWorldSquare = () => [],
  getWorldSafety = () => null,
} = {}) {
  return {
    renderWorldDirectory() {
      renderWorldDirectory({
        listEl: worldDirectoryListEl,
        snapshot: getWorldDirectory(),
        gatewayUrl: getGatewayUrl(),
      });
    },
    renderMirrorSources() {
      renderMirrorSources({
        listEl: worldMirrorSourceListEl,
        sources: getWorldMirrorSources(),
        gatewayUrl: getGatewayUrl(),
      });
    },
    renderWorldSquare() {
      renderWorldSquare({
        listEl: worldSquareListEl,
        notices: getWorldSquare(),
        gatewayUrl: getGatewayUrl(),
      });
    },
    renderWorldSafety() {
      renderWorldSafety({
        listEl: worldSafetyListEl,
        safety: getWorldSafety(),
        gatewayUrl: getGatewayUrl(),
      });
    },
  };
}
