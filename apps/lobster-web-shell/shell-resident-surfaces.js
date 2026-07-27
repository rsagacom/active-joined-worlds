/* ============================================================
   shell-resident-surfaces.js — 居民目录与紧凑居民列表 DOM
   只持有注入的页面节点/动作，不读取 Gateway 或页面全局状态。
   ============================================================ */

import { applyAvatarStyle } from "./shell-avatar.js";
import { createLine } from "./shell-dom-helpers.js";
import { localizedRuntimeError } from "./shell-errors.js";
import {
  residentDirectoryCardModel,
  residentDirectoryEmptyStateText,
  residentRelationshipActionModel,
  residentRelationshipSubmitRequestState,
} from "./shell-governance-render.js";

function clearChildren(element) {
  while (element?.firstChild) element.removeChild(element.firstChild);
}

function createResidentDirectoryEmptyNode({ gatewayUrl }) {
  const empty = document.createElement("li");
  empty.className = "empty-note";
  empty.textContent = residentDirectoryEmptyStateText({ gatewayUrl });
  return empty;
}

function appendResidentDirectoryTitleRow(li, model) {
  const titleRow = document.createElement("div");
  titleRow.className = model.titleRowClassName;
  titleRow.appendChild(createLine("city-name", model.title));
  titleRow.appendChild(createLine("city-slug", model.slug));
  li.appendChild(titleRow);
}

function appendResidentDirectoryMetaRows(li, model) {
  for (const row of model.rows) {
    li.appendChild(createLine(row.className, row.text));
  }
}

async function submitResidentRelationshipAction(model, deps) {
  const requestState = residentRelationshipSubmitRequestState(model, {
    gatewayUrl: deps.getGatewayUrl(),
  });
  if (!requestState.allowed) {
    if (requestState.statusText) {
      deps.setGovernanceStatus(requestState.statusText, requestState.statusIsError);
    }
    return;
  }
  deps.setGovernanceStatus(requestState.statusText);
  try {
    await deps.postGatewayJson(requestState.endpoint, requestState.payload);
    await deps.refreshFromGateway({ requireShell: true });
    deps.setGovernanceStatus(requestState.successText);
  } catch (error) {
    deps.setGovernanceStatus(localizedRuntimeError(error, "好友关系更新失败"), true);
  }
}

function createResidentRelationshipActionButton(resident, deps) {
  const model = residentRelationshipActionModel(resident, {
    currentResidentId: deps.getIdentity(),
  });
  if (!model) return null;
  const button = document.createElement("button");
  button.type = model.type;
  button.className = model.className;
  button.textContent = model.text;
  button.disabled = Boolean(model.disabled);
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    submitResidentRelationshipAction(model, deps).catch((err) => {
      deps.setGovernanceStatus(localizedRuntimeError(err, "好友关系更新失败"), true);
    });
  });
  return button;
}

function createResidentDirectActionButton(resident, deps) {
  const directButton = document.createElement("button");
  directButton.type = "button";
  directButton.className = "secondary";
  directButton.textContent = "发起私聊";
  directButton.addEventListener("click", () => {
    deps.enterResidentRoom(resident).catch((err) => {
      deps.setGovernanceStatus(localizedRuntimeError(err, "打开私聊失败"), true);
    });
  });
  return directButton;
}

function appendResidentDirectoryActions(li, resident, deps) {
  const actions = document.createElement("div");
  actions.className = "city-actions";
  const relationshipButton = createResidentRelationshipActionButton(resident, deps);
  if (relationshipButton) {
    actions.appendChild(relationshipButton);
  }
  actions.appendChild(createResidentDirectActionButton(resident, deps));
  li.appendChild(actions);
}

function createResidentDirectoryCardNode(resident, deps) {
  const model = residentDirectoryCardModel(resident, {
    translateResidentLabelFn: deps.translateResidentLabelFn,
  });
  const li = document.createElement("li");
  li.className = model.className;
  appendResidentDirectoryTitleRow(li, model);
  appendResidentDirectoryMetaRows(li, model);
  if (resident.resident_id !== deps.getIdentity()) {
    appendResidentDirectoryActions(li, resident, deps);
  }
  return li;
}

function renderResidentDirectory({ listEl, residents, deps }) {
  if (!listEl) return;
  clearChildren(listEl);
  if (!residents?.length) {
    listEl.appendChild(createResidentDirectoryEmptyNode({ gatewayUrl: deps.getGatewayUrl() }));
    return;
  }

  for (const resident of residents) {
    listEl.appendChild(createResidentDirectoryCardNode(resident, deps));
  }
}

function syncResidentListSearchVisibility({ listEl, getSearchModeControls, getSearchMode }) {
  if (getSearchModeControls()) {
    listEl.style.display = getSearchMode() === "rooms" ? "none" : "";
  }
}

function createCompactResidentEmptyNode(residents, { gatewayUrl }) {
  const empty = document.createElement("li");
  empty.className = "empty-note";
  empty.textContent = residents
    ? "暂无其他居民"
    : gatewayUrl
      ? "居民目录暂不可用"
      : "请先连接网关以加载居民目录";
  return empty;
}

function createCompactResidentFilteredEmptyNode(query) {
  const empty = document.createElement("li");
  empty.className = "empty-note";
  empty.textContent = query ? `没有匹配「${query}」的居民` : "暂无其他居民";
  return empty;
}

function compactResidentListQuery(getRoomSearch) {
  return getRoomSearch().toLowerCase().trim();
}

function filteredCompactResidents(residents, identity, query) {
  return residents
    .filter((resident) => resident.resident_id !== identity)
    .filter((resident) => !query || resident.resident_id.toLowerCase().includes(query));
}

function sortedCompactResidents(residents) {
  return [...residents].sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    return a.resident_id.localeCompare(b.resident_id);
  });
}

function createCompactResidentAvatar(resident, displayName, applyAvatarStyleFn) {
  const avatar = document.createElement("div");
  avatar.className = "room-avatar";
  avatar.textContent = displayName.charAt(0).toUpperCase();
  applyAvatarStyleFn(avatar, resident.resident_id);
  return avatar;
}

function createCompactResidentTitleStack(resident, displayName) {
  const titleStack = document.createElement("div");
  titleStack.className = "room-title-stack";
  const nameLine = document.createElement("span");
  nameLine.className = "room-name";
  nameLine.textContent = displayName;
  if (resident.nickname) {
    const idLine = document.createElement("span");
    idLine.className = "room-subtitle";
    idLine.textContent = resident.resident_id;
    titleStack.appendChild(idLine);
  }
  const statusDot = document.createElement("span");
  statusDot.className = "resident-status-dot" + (resident.online ? " is-online" : " is-offline");
  statusDot.setAttribute("aria-label", resident.online ? "在线" : "离线");
  nameLine.appendChild(statusDot);
  titleStack.appendChild(nameLine);
  return titleStack;
}

function createCompactResidentButtonContent(resident, displayName) {
  const content = document.createElement("div");
  content.className = "room-content";
  const top = document.createElement("div");
  top.className = "room-topline";
  top.appendChild(createCompactResidentTitleStack(resident, displayName));
  content.appendChild(top);
  return content;
}

function createCompactResidentButton(resident, deps) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "room-button";
  button.addEventListener("click", () => {
    deps.enterResidentRoom(resident).catch((err) => {
      deps.setGovernanceStatus(localizedRuntimeError(err, "打开私聊失败"), true);
    });
  });
  return button;
}

function createCompactResidentListItemNode(resident, deps) {
  const li = document.createElement("li");
  const button = createCompactResidentButton(resident, deps);
  const displayName = resident.nickname || resident.resident_id;
  button.appendChild(createCompactResidentAvatar(resident, displayName, deps.applyAvatarStyleFn));
  button.appendChild(createCompactResidentButtonContent(resident, displayName));
  li.appendChild(button);
  const relationshipButton = createResidentRelationshipActionButton(resident, deps);
  if (relationshipButton) {
    li.appendChild(relationshipButton);
  }
  return li;
}

function renderCompactResidentList({ listEl, residents, deps }) {
  if (!listEl) return;
  syncResidentListSearchVisibility({
    listEl,
    getSearchModeControls: deps.getSearchModeControls,
    getSearchMode: deps.getSearchMode,
  });
  clearChildren(listEl);
  const identity = deps.getIdentity();
  const query = compactResidentListQuery(deps.getRoomSearch);
  if (!Array.isArray(residents) || !residents.length) {
    listEl.appendChild(
      createCompactResidentEmptyNode(residents, { gatewayUrl: deps.getGatewayUrl() }),
    );
    return;
  }
  const filtered = filteredCompactResidents(residents, identity, query);
  if (!filtered.length) {
    listEl.appendChild(createCompactResidentFilteredEmptyNode(query));
    return;
  }
  for (const resident of sortedCompactResidents(filtered)) {
    listEl.appendChild(createCompactResidentListItemNode(resident, deps));
  }
}

export function createResidentSurfaceRenderer({
  residentListEl = null,
  getGatewayUrl = () => "",
  getResidents = () => [],
  getIdentity = () => "",
  getShellPage = () => "",
  getSearchModeControls = () => null,
  getSearchMode = () => "all",
  getRoomSearch = () => "",
  translateResidentLabelFn = (residentId) => residentId || "",
  applyAvatarStyleFn = applyAvatarStyle,
  enterResidentRoom = async () => {},
  setGovernanceStatus = () => {},
  postGatewayJson = async () => {},
  refreshFromGateway = async () => {},
} = {}) {
  const deps = {
    getGatewayUrl,
    getIdentity,
    getSearchModeControls,
    getSearchMode,
    getRoomSearch,
    translateResidentLabelFn,
    applyAvatarStyleFn,
    enterResidentRoom,
    setGovernanceStatus,
    postGatewayJson,
    refreshFromGateway,
  };

  return {
    renderResidents() {
      if (getShellPage() === "user") {
        renderCompactResidentList({ listEl: residentListEl, residents: getResidents(), deps });
        return;
      }
      renderResidentDirectory({ listEl: residentListEl, residents: getResidents(), deps });
    },
    renderResidentList() {
      renderCompactResidentList({ listEl: residentListEl, residents: getResidents(), deps });
    },
  };
}
