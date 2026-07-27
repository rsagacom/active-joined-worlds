/* ============================================================
   shell-room-list-surfaces.js — 房间列表与分组 DOM
   只持有注入的页面节点/投影/动作，不读取 Gateway 或页面全局状态。
   ============================================================ */

import { applyAvatarStyle } from "./shell-avatar.js";
import {
  createLine,
  createPill,
} from "./shell-dom-helpers.js";
import {
  createRoomUnreadBadgeNode,
  roomAvatarSpec,
  roomButtonClassSpec,
  roomEmptyStateSpec,
  roomStatsSpec,
  roomToolbarNoteSpec,
  roomTitleStackSpec,
  roomTopMetaSpec,
} from "./shell-room-rail.js";

function clearChildren(element) {
  while (element?.firstChild) element.removeChild(element.firstChild);
}

function updateRoomListSearchVisibility({ listEl, getSearchModeControls, getSearchMode }) {
  if (getSearchModeControls() && listEl) {
    listEl.style.display = getSearchMode() === "residents" ? "none" : "";
  }
}

function updateRoomListToolbarNote({ rooms, stats, activeVisible, shellPage, listNoteEl, deps }) {
  if (!listNoteEl) return;
  const pieces = roomToolbarNoteSpec({
    shellPage,
    visibleCount: rooms.length,
    totalCount: deps.getAllRooms().length,
    roomFilter: deps.getRoomFilter(),
    roomSearch: deps.getRoomSearch(),
    stats,
    activeVisible,
    activeRoomId: deps.getActiveRoomId(),
    syncLabel: deps.getRoomSyncLabel(),
    roomKindLabel: deps.translateRoomKindFn(deps.getRoomFilter()),
  });
  listNoteEl.textContent = pieces.join(" · ");
}

function createRoomListEmptyNode({ gatewayUrl }) {
  const empty = document.createElement("li");
  empty.className = "empty-note";
  empty.textContent = roomEmptyStateSpec(gatewayUrl);
  return empty;
}

function createRoomAvatarNode(room, kind, shellPage, headline, deps) {
  const spec = roomAvatarSpec({ room, kind, shellPage, headline });
  const avatar = document.createElement("div");
  avatar.className = spec.className;
  const peerStatus = deps.directRoomPeerOnlineStatusFn(room);
  if (peerStatus) {
    avatar.classList.add("peer-" + peerStatus);
    const statusLabel = peerStatus === "online" ? " (在线)" : " (离线)";
    avatar.setAttribute("aria-label", (spec.ariaLabel || spec.title || "") + statusLabel);
  }
  avatar.textContent = spec.text;
  deps.applyAvatarStyleFn(avatar, room.id);
  if (spec.isResidentRoomEntry) {
    avatar.dataset.residentRoomEntry = room.id;
    avatar.title = spec.title;
    avatar.setAttribute("aria-label", spec.ariaLabel);
    avatar.addEventListener("click", (event) => {
      event.preventDefault?.();
      event.stopPropagation?.();
      deps.confirmResidentRoomJumpFn(room);
    });
  }
  return avatar;
}

function createRoomTopLineNode(room, kind, shellPage, unread, deps) {
  const top = document.createElement("div");
  top.className = "room-topline";
  const titleStack = document.createElement("div");
  titleStack.className = "room-title-stack";
  const titleSpec = roomTitleStackSpec(room, deps.roomAudienceLabelFn(room));
  titleStack.appendChild(createLine("room-name", titleSpec.name));
  titleStack.appendChild(createLine("room-kicker", titleSpec.kicker));
  top.appendChild(titleStack);
  if (room.id !== deps.getActiveRoomId()) {
    const unreadBadge = createRoomUnreadBadgeNode(unread);
    if (unreadBadge) top.appendChild(unreadBadge);
  }

  const metaSpec = roomTopMetaSpec({
    room,
    kind,
    kindPillLabel: deps.translateRoomKindForShellPageFn(kind, shellPage),
    activeRoomId: deps.getActiveRoomId(),
    unread,
    shellPage,
  });
  const metaStack = document.createElement("div");
  metaStack.className = "room-top-meta";
  metaStack.appendChild(createLine("room-activity", metaSpec.activityLine));
  const summaryBadges = document.createElement("div");
  summaryBadges.className = "room-badges";
  summaryBadges.appendChild(createPill(metaSpec.kindPill.label, metaSpec.kindPill.tone));
  if (metaSpec.statusPill) {
    summaryBadges.appendChild(createPill(metaSpec.statusPill.label, metaSpec.statusPill.tone));
  }
  metaStack.appendChild(summaryBadges);
  top.appendChild(metaStack);
  return top;
}

function createRoomTagRowNode(room, deps) {
  const tagRow = document.createElement("div");
  tagRow.className = "room-tag-row";
  const roomActionPill = deps.createRoomQuickActionPillFn(room);
  if (roomActionPill) tagRow.appendChild(roomActionPill);
  const roomPreviewPill = deps.createRoomQuickPreviewPillFn(room);
  if (roomPreviewPill) tagRow.appendChild(roomPreviewPill);
  if (deps.roomHasDraftFn(room.id)) tagRow.appendChild(createPill("草稿", "accent"));
  if (deps.visiblePendingEchoCountFn(room)) {
    tagRow.appendChild(
      createPill("待同步", deps.getRoomSendErrors()[room.id] ? "danger" : "warm"),
    );
  }
  if (deps.getRoomSendErrors()[room.id]) tagRow.appendChild(createPill("待重发", "danger"));
  if (deps.caretakerProfileFn(room)) {
    const profile = deps.caretakerProfileFn(room);
    const pendingCount = deps.caretakerPendingCountFn(room);
    tagRow.appendChild(
      createPill(
        `${profile.name} · ${pendingCount} 条代办`,
        pendingCount > 0 ? "warm" : "accent",
      ),
    );
  }
  if (room.scene_banner) tagRow.appendChild(createPill(room.scene_banner, "warm"));
  return tagRow;
}

function createRoomListItemNode(room, shellPage, deps) {
  const kind = deps.roomKindFn(room);
  const unread = deps.unreadCountFn(room);
  const item = document.createElement("li");
  const button = document.createElement("button");
  const btnSpec = roomButtonClassSpec({
    roomId: room.id,
    activeRoomId: deps.getActiveRoomId(),
    unread,
    kind,
  });
  button.className = btnSpec.className;
  button.dataset.roomKind = btnSpec.datasetKind;
  button.addEventListener("click", () => {
    deps.focusRoomFn(room.id);
    deps.renderRoomsFn();
    deps.renderTimelineFn();
  });

  const headline = deps.roomThreadHeadlineFn(room);
  const avatar = createRoomAvatarNode(room, kind, shellPage, headline, deps);
  const content = document.createElement("div");
  content.className = "room-content";
  content.appendChild(createRoomTopLineNode(room, kind, shellPage, unread, deps));
  content.appendChild(deps.createRoomPreviewNodeFn(room));
  content.appendChild(createRoomTagRowNode(room, deps));
  const roomInlineActions = deps.createRoomInlineActionsFn(room);
  if (roomInlineActions) content.appendChild(roomInlineActions);
  content.appendChild(createLine("room-sub", deps.roomSummaryLineFn(room)));
  content.appendChild(createLine("room-status-line", deps.roomStatusLineFn(room)));

  button.appendChild(avatar);
  button.appendChild(content);
  item.appendChild(button);
  return item;
}

function createRoomSectionNode(group, shellPage, deps) {
  const section = document.createElement("li");
  section.className = "room-section";

  const header = document.createElement("div");
  header.className = "room-section-header";
  header.appendChild(createLine("room-section-title", group.title));
  header.appendChild(createLine("room-section-hint", `${group.hint} · ${group.rooms.length} 条`));
  section.appendChild(header);

  const list = document.createElement("ul");
  list.className = "room-section-list";
  for (const room of group.rooms) {
    list.appendChild(createRoomListItemNode(room, shellPage, deps));
  }
  section.appendChild(list);
  return section;
}

export function createRoomListSurfaceRenderer({
  roomListEl = null,
  getRoomToolbarNoteEl = () => null,
  getSearchModeControls = () => null,
  getSearchMode = () => "all",
  getAllRooms = () => [],
  getActiveRoomId = () => null,
  getRoomFilter = () => "all",
  getRoomSearch = () => "",
  getGatewayUrl = () => "",
  getRoomSendErrors = () => ({}),
  getShellPage = () => "hub",
  getFilteredRooms = (rooms) => rooms,
  getRoomGroups = () => [],
  getRoomSyncLabel = () => "",
  translateRoomKindFn = (kind) => kind,
  translateRoomKindForShellPageFn = (kind) => kind,
  roomKindFn = () => "system",
  roomAudienceLabelFn = () => "群聊成员",
  roomThreadHeadlineFn = () => "会话未打开",
  directRoomPeerOnlineStatusFn = () => "",
  confirmResidentRoomJumpFn = () => {},
  applyAvatarStyleFn = applyAvatarStyle,
  roomHasDraftFn = () => false,
  unreadCountFn = () => 0,
  visiblePendingEchoCountFn = () => 0,
  caretakerProfileFn = () => null,
  caretakerPendingCountFn = () => 0,
  createRoomQuickActionPillFn = () => null,
  createRoomQuickPreviewPillFn = () => null,
  createRoomPreviewNodeFn = () => document.createElement("div"),
  createRoomInlineActionsFn = () => null,
  roomSummaryLineFn = () => "",
  roomStatusLineFn = () => "",
  focusRoomFn = () => {},
  renderRoomsFn = () => {},
  renderTimelineFn = () => {},
  renderRoomDigestFn = () => {},
  ensureRoomQuickActionsFn = () => {},
} = {}) {
  const deps = {
    getAllRooms,
    getActiveRoomId,
    getRoomFilter,
    getRoomSearch,
    getRoomSendErrors,
    getRoomSyncLabel,
    translateRoomKindFn,
    translateRoomKindForShellPageFn,
    roomKindFn,
    roomAudienceLabelFn,
    roomThreadHeadlineFn,
    directRoomPeerOnlineStatusFn,
    confirmResidentRoomJumpFn,
    applyAvatarStyleFn,
    roomHasDraftFn,
    unreadCountFn,
    visiblePendingEchoCountFn,
    caretakerProfileFn,
    caretakerPendingCountFn,
    createRoomQuickActionPillFn,
    createRoomQuickPreviewPillFn,
    createRoomPreviewNodeFn,
    createRoomInlineActionsFn,
    roomSummaryLineFn,
    roomStatusLineFn,
    focusRoomFn,
    renderRoomsFn,
    renderTimelineFn,
  };

  function renderRooms() {
    if (!roomListEl) return;
    updateRoomListSearchVisibility({ listEl: roomListEl, getSearchModeControls, getSearchMode });
    clearChildren(roomListEl);
    const allRooms = getAllRooms();
    const rooms = getFilteredRooms(allRooms, getRoomFilter(), getRoomSearch());
    const shellPage = getShellPage();
    const activeVisible = rooms.some((room) => room.id === getActiveRoomId());
    const stats = roomStatsSpec(
      rooms,
      allRooms,
      roomHasDraftFn,
      unreadCountFn,
      visiblePendingEchoCountFn,
      getRoomSendErrors(),
    );
    renderRoomDigestFn(rooms);
    updateRoomListToolbarNote({
      rooms,
      stats,
      activeVisible,
      shellPage,
      listNoteEl: getRoomToolbarNoteEl(),
      deps,
    });

    if (!rooms.length) {
      roomListEl.appendChild(createRoomListEmptyNode({ gatewayUrl: getGatewayUrl() }));
      return;
    }

    const groups = getRoomGroups(shellPage, rooms);
    for (const group of groups) {
      roomListEl.appendChild(createRoomSectionNode(group, shellPage, deps));
    }
    ensureRoomQuickActionsFn();
  }

  return { renderRooms };
}
