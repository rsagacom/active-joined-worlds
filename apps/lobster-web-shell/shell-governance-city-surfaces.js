/* ============================================================
   shell-governance-city-surfaces.js — 治理城市卡片与动作 DOM
   只持有注入的页面节点/动作，不读取 Gateway 或页面全局状态。
   ============================================================ */

import { createLine } from "./shell-dom-helpers.js";
import { localizedRuntimeError } from "./shell-errors.js";
import { humanMembership } from "./shell-payload.js";
import {
  governanceCityActionsModel,
  governanceCityCardBaseModel,
  governanceCityRoomListModel,
  governanceEmptyCityStateModel,
  governanceFederationPolicyControlsModel,
  governanceOfflineStateModel,
  governanceWorldHeaderModel,
  governancePendingMemberListModel,
  governanceActiveMemberListModel,
} from "./shell-governance-render.js";
import {
  translateFederationPolicy,
  translateRole,
} from "./shell-labels.js";
import {
  roleAllowsApproveJoin,
  roleAllowsCreatePublicRoom,
  roleAllowsFreezeRoom,
  roleAllowsManageStewards,
  roleAllowsUpdateFederation,
} from "./shell-role-permissions.js";

function clearChildren(element) {
  while (element?.firstChild) element.removeChild(element.firstChild);
}

function appendActionError(setGovernanceStatus, error, fallback) {
  setGovernanceStatus(localizedRuntimeError(error, fallback), true);
}

function createGovernanceRoomOpenButton(room, { focusRoom, loadGatewayState, renderRooms, renderTimeline }) {
  const model = room.openButton;
  const openButton = document.createElement("button");
  openButton.type = model.type;
  openButton.className = model.className;
  openButton.textContent = model.text;
  openButton.addEventListener("click", async () => {
    focusRoom(room.roomId);
    await loadGatewayState();
    renderRooms();
    renderTimeline();
  });
  return openButton;
}

function createGovernanceRoomFreezeButton(city, room, { submitFreezeRoom, setGovernanceStatus }) {
  const model = room.freezeButton;
  const toggleButton = document.createElement("button");
  toggleButton.type = model.type;
  toggleButton.className = model.className;
  toggleButton.textContent = model.text;
  toggleButton.addEventListener("click", async () => {
    try {
      await submitFreezeRoom(city.slug, room.slug, !room.frozen);
    } catch (error) {
      appendActionError(setGovernanceStatus, error, "房间冻结状态更新失败");
    }
  });
  return toggleButton;
}

function createGovernanceCityRoomEntryNode(city, room, deps) {
  const row = document.createElement("div");
  row.className = room.rowClassName;
  const label = document.createElement("span");
  label.textContent = room.label;
  row.appendChild(label);

  const controls = document.createElement("div");
  controls.className = room.controlsClassName;
  controls.appendChild(createGovernanceRoomOpenButton(room, deps));
  if (room.freezeButton) {
    controls.appendChild(createGovernanceRoomFreezeButton(city, room, deps));
  }
  row.appendChild(controls);
  return row;
}

function appendGovernanceCityRoomList(li, city, membership, rooms, deps) {
  const model = governanceCityRoomListModel(rooms, membership, {
    canFreezeRoomFn: roleAllowsFreezeRoom,
  });
  const roomList = document.createElement("div");
  roomList.className = model.titleClassName;
  roomList.textContent = model.title;
  li.appendChild(roomList);

  const roomWrap = document.createElement("div");
  roomWrap.className = model.wrapClassName;
  for (const room of model.entries) {
    roomWrap.appendChild(createGovernanceCityRoomEntryNode(city, room, deps));
  }
  li.appendChild(roomWrap);
}

function appendGovernancePendingMemberList(li, city, membership, pendingMembers, deps) {
  const model = governancePendingMemberListModel(pendingMembers, membership, {
    canApproveJoinFn: roleAllowsApproveJoin,
  });
  const pendingTitle = document.createElement("div");
  pendingTitle.className = model.titleClassName;
  pendingTitle.textContent = model.title;
  li.appendChild(pendingTitle);

  const pendingWrap = document.createElement("div");
  pendingWrap.className = model.wrapClassName;
  for (const pending of model.entries) {
    const row = document.createElement("div");
    row.className = pending.rowClassName;
    const label = document.createElement("span");
    label.textContent = pending.label;
    row.appendChild(label);

    if (pending.approveButton) {
      const approveButton = document.createElement("button");
      approveButton.type = pending.approveButton.type;
      approveButton.className = pending.approveButton.className;
      approveButton.textContent = pending.approveButton.text;
      approveButton.addEventListener("click", async () => {
        try {
          await deps.submitApproveResident(city.slug, pending.residentId);
        } catch (error) {
          appendActionError(deps.setGovernanceStatus, error, "批准居民失败");
        }
      });
      row.appendChild(approveButton);
    }

    pendingWrap.appendChild(row);
  }
  li.appendChild(pendingWrap);
}

function appendGovernanceActiveMemberList(li, city, membership, activeMembers, deps) {
  const model = governanceActiveMemberListModel(activeMembers, membership, {
    canManageStewardsFn: roleAllowsManageStewards,
    translateRoleFn: translateRole,
  });
  const activeTitle = document.createElement("div");
  activeTitle.className = model.titleClassName;
  activeTitle.textContent = model.title;
  li.appendChild(activeTitle);

  const activeWrap = document.createElement("div");
  activeWrap.className = model.wrapClassName;
  for (const resident of model.entries) {
    const row = document.createElement("div");
    row.className = resident.rowClassName;
    const label = document.createElement("span");
    label.textContent = resident.label;
    row.appendChild(label);

    if (resident.stewardButton) {
      const stewardButton = document.createElement("button");
      stewardButton.type = resident.stewardButton.type;
      stewardButton.className = resident.stewardButton.className;
      stewardButton.textContent = resident.stewardButton.text;
      stewardButton.addEventListener("click", async () => {
        try {
          await deps.submitStewardUpdate(city.slug, resident.residentId, resident.stewardGrant);
        } catch (error) {
          appendActionError(deps.setGovernanceStatus, error, "执事权限更新失败");
        }
      });
      row.appendChild(stewardButton);
    }

    activeWrap.appendChild(row);
  }
  li.appendChild(activeWrap);
}

function createGovernanceJoinButton(action, deps) {
  const joinButton = document.createElement("button");
  joinButton.type = action.type;
  joinButton.className = action.className;
  joinButton.textContent = action.text;
  joinButton.addEventListener("click", async () => {
    if (deps.cityJoinInputEl) deps.cityJoinInputEl.value = action.citySlug;
    await deps.submitJoinCity(action.citySlug);
  });
  return joinButton;
}

function createGovernancePendingApprovalNotice(notice) {
  const pending = document.createElement("div");
  pending.className = notice.className;
  pending.textContent = notice.text;
  return pending;
}

function createGovernanceLobbyOpenButton(lobby, deps) {
  const openButton = document.createElement("button");
  openButton.type = lobby.type;
  openButton.className = lobby.className;
  openButton.textContent = lobby.text;
  openButton.addEventListener("click", async () => {
    deps.focusRoom(lobby.roomId);
    await deps.loadGatewayState();
    deps.renderRooms();
    deps.renderTimeline();
  });
  return openButton;
}

function createGovernanceCreateRoomButton(action, deps) {
  const roomButton = document.createElement("button");
  roomButton.type = action.type;
  roomButton.textContent = action.text;
  roomButton.addEventListener("click", () => {
    if (deps.roomCityInputEl) deps.roomCityInputEl.value = action.citySlug;
    deps.roomTitleInputEl?.focus();
    deps.setGovernanceStatus(action.statusText);
  });
  return roomButton;
}

function appendGovernanceCityActions(li, city, membership, rooms, deps) {
  const model = governanceCityActionsModel(city, membership, rooms, {
    canCreatePublicRoomFn: roleAllowsCreatePublicRoom,
  });
  if (!model.hasActions) return;
  const actions = document.createElement("div");
  actions.className = model.className;

  if (model.joinButton) actions.appendChild(createGovernanceJoinButton(model.joinButton, deps));
  if (model.pendingNotice) actions.appendChild(createGovernancePendingApprovalNotice(model.pendingNotice));
  if (model.lobbyButton) actions.appendChild(createGovernanceLobbyOpenButton(model.lobbyButton, deps));
  if (model.createRoomButton) actions.appendChild(createGovernanceCreateRoomButton(model.createRoomButton, deps));

  li.appendChild(actions);
}

function appendGovernanceFederationPolicyControls(li, city, membership, deps) {
  const model = governanceFederationPolicyControlsModel(city, membership, {
    canUpdateFederationFn: roleAllowsUpdateFederation,
    translateFederationPolicyFn: translateFederationPolicy,
  });
  if (!model) return;
  const federationLabel = document.createElement("div");
  federationLabel.className = model.titleClassName;
  federationLabel.textContent = model.title;
  li.appendChild(federationLabel);

  const federationWrap = document.createElement("div");
  federationWrap.className = model.wrapClassName;
  for (const policy of model.entries) {
    const row = document.createElement("div");
    row.className = policy.rowClassName;
    const text = document.createElement("span");
    text.textContent = policy.label;
    row.appendChild(text);

    const applyButton = document.createElement("button");
    applyButton.type = policy.applyButton.type;
    applyButton.className = policy.applyButton.className;
    applyButton.textContent = policy.applyButton.text;
    applyButton.disabled = policy.applyButton.disabled;
    applyButton.addEventListener("click", async () => {
      try {
        await deps.submitFederationPolicy(city.slug, policy.policyValue);
      } catch (error) {
        appendActionError(deps.setGovernanceStatus, error, "联邦策略更新失败");
      }
    });
    row.appendChild(applyButton);
    federationWrap.appendChild(row);
  }
  li.appendChild(federationWrap);
}

export function createGovernanceCitySurfaceRenderer({
  cityListEl = null,
  worldStateEl = null,
  worldSummaryEl = null,
  worldDirectoryListEl = null,
  worldMirrorSourceListEl = null,
  worldSquareListEl = null,
  worldSafetyListEl = null,
  cityJoinInputEl = null,
  roomCityInputEl = null,
  roomTitleInputEl = null,
  focusRoom = () => {},
  loadGatewayState = async () => {},
  renderRooms = () => {},
  renderTimeline = () => {},
  submitFreezeRoom = async () => {},
  submitApproveResident = async () => {},
  submitJoinCity = async () => {},
  submitStewardUpdate = async () => {},
  submitFederationPolicy = async () => {},
  setGovernanceStatus = () => {},
} = {}) {
  const deps = {
    cityJoinInputEl,
    roomCityInputEl,
    roomTitleInputEl,
    focusRoom,
    loadGatewayState,
    renderRooms,
    renderTimeline,
    submitFreezeRoom,
    submitApproveResident,
    submitJoinCity,
    submitStewardUpdate,
    submitFederationPolicy,
    setGovernanceStatus,
  };

  return {
    renderOffline({ gatewayUrl = "", shellMode = "" } = {}) {
      const model = governanceOfflineStateModel({ gatewayUrl, shellMode });
      if (worldStateEl) worldStateEl.textContent = model.worldState;
      if (worldSummaryEl) worldSummaryEl.textContent = model.summary;
      const worldLists = [
        worldDirectoryListEl,
        worldMirrorSourceListEl,
        worldSquareListEl,
        worldSafetyListEl,
      ];
      for (const element of worldLists) {
        if (!element) continue;
        clearChildren(element);
        const empty = document.createElement("li");
        empty.className = model.listEmptyClassName;
        empty.textContent = model.listEmptyText;
        element.appendChild(empty);
      }
      if (!cityListEl) return;
      clearChildren(cityListEl);
      const cityEmpty = document.createElement("li");
      cityEmpty.className = model.cityEmptyClassName;
      cityEmpty.textContent = model.cityEmptyText;
      cityListEl.appendChild(cityEmpty);
    },
    renderCities({
      world = {},
      directory = null,
      cityCount = 0,
      worldSquareCount = 0,
      shellMode = "",
      cities = [],
    } = {}) {
      const headerModel = governanceWorldHeaderModel({
        world,
        directory,
        cityCount,
        worldSquareCount,
        shellMode,
      });
      if (worldStateEl) worldStateEl.textContent = headerModel.worldState;
      if (worldSummaryEl) worldSummaryEl.textContent = headerModel.summary;
      if (!cityListEl) return;
      clearChildren(cityListEl);
      if (!cities.length) {
        const model = governanceEmptyCityStateModel();
        const empty = document.createElement("li");
        empty.className = model.className;
        empty.textContent = model.text;
        cityListEl.appendChild(empty);
        return;
      }

      for (const entry of cities) {
        const city = entry.city || {};
        const membership = entry.membership || null;
        const rooms = entry.rooms || [];
        const li = document.createElement("li");
        const model = governanceCityCardBaseModel(city, membership, {
          membershipLabelFn: humanMembership,
        });
        li.className = model.className;
        const titleRow = document.createElement("div");
        titleRow.className = model.titleRowClassName;
        titleRow.appendChild(createLine("city-name", model.title));
        titleRow.appendChild(createLine("city-slug", model.slug));
        li.appendChild(titleRow);
        li.appendChild(createLine("city-sub", model.description));
        li.appendChild(createLine("city-role", model.role));
        li.appendChild(createLine("city-sub", model.access));

        if (rooms.length) appendGovernanceCityRoomList(li, city, membership, rooms, deps);
        if (entry.pendingMembers?.length) {
          appendGovernancePendingMemberList(li, city, membership, entry.pendingMembers, deps);
        }
        if (entry.activeMembers?.length) {
          appendGovernanceActiveMemberList(li, city, membership, entry.activeMembers, deps);
        }
        appendGovernanceCityActions(li, city, membership, rooms, deps);
        appendGovernanceFederationPolicyControls(li, city, membership, deps);
        cityListEl.appendChild(li);
      }
    },
  };
}
