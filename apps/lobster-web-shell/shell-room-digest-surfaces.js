import { createPill } from "./shell-dom-helpers.js";
import { roomDigestMetricsSpec } from "./shell-room-rail.js";

function defaultClearChildren(element) {
  if (!element) return;
  while (element.firstChild) element.removeChild(element.firstChild);
}

export function createRoomDigestSurfaceRenderer({
  doc = globalThis.document,
  getRoomDigestEl,
  getRooms,
  getActiveRoomId,
  getShellPage,
  roomKindFn,
  unreadCountFn,
  roomHasDraftFn,
  roomFollowUpCountFn,
  caretakerPendingCountFn,
  caretakerNotificationCountFn,
  roomThreadHeadlineFn,
  roomContextSummaryFn,
  roomChatStatusSummaryFn,
  roomQueueSummaryFn,
  getRoomSendErrors,
  pendingEchoesForRoomFn,
  caretakerProfileFn,
  createPillFn = createPill,
  roomDigestMetricsSpecFn = roomDigestMetricsSpec,
  clearChildrenFn = defaultClearChildren,
} = {}) {
  const documentRef = doc || globalThis.document;

  function roomsValue() {
    return Array.isArray(getRooms?.()) ? getRooms() : [];
  }

  function shellPageValue() {
    return getShellPage?.() || "unified";
  }

  function roomDigestMetrics() {
    const rooms = roomsValue();
    const activeRoomId = getActiveRoomId?.() || "";
    return {
      ...roomDigestMetricsSpecFn(rooms, {
        roomKind: roomKindFn,
        unreadCount: unreadCountFn,
        roomHasDraft: roomHasDraftFn,
        roomFollowUpCount: roomFollowUpCountFn,
        caretakerPendingCount: caretakerPendingCountFn,
        caretakerNotificationCount: caretakerNotificationCountFn,
      }),
      activeRoom: activeRoomId ? rooms.find((room) => room.id === activeRoomId) || null : null,
    };
  }

  function createRoomDigestTitleNode(rooms) {
    const title = documentRef.createElement("div");
    title.className = "room-digest-title";
    title.textContent = rooms.length ? `最近会话 · ${rooms.length}` : "最近会话 · 暂无";
    return title;
  }

  function createRoomDigestCopyNode(activeRoom, shellPage) {
    const copy = documentRef.createElement("div");
    copy.className = "room-digest-copy";
    copy.textContent = activeRoom
      ? shellPage === "admin"
        ? roomThreadHeadlineFn(activeRoom)
        : roomContextSummaryFn(activeRoom)
      : shellPage === "admin"
        ? "先看未读和待跟进，再继续聊天。"
        : "先看最近消息，更多入口按需再打开。";
    return copy;
  }

  function appendRoomDigestBaseChips(chips, shellPage, metrics) {
    if (shellPage === "admin") {
      chips.appendChild(createPillFn(`${metrics.followUpCount} 个待跟进`, metrics.followUpCount > 0 ? "warm" : "muted"));
      chips.appendChild(createPillFn(`${metrics.caretakerQueue} 条访客提醒`, metrics.caretakerQueue > 0 ? "warm" : "accent"));
      chips.appendChild(createPillFn(`${metrics.notificationTotal} 条提醒`, metrics.notificationTotal > 0 ? "accent" : "muted"));
      chips.appendChild(createPillFn(`${metrics.publicCount} 个频道 · ${metrics.directCount} 个私信`, "muted"));
      if (metrics.systemCount > 0) {
        chips.appendChild(createPillFn(`${metrics.systemCount} 个系统项`, "muted"));
      }
      return;
    }
    chips.appendChild(createPillFn(`${metrics.unreadTotal} 条未读`, metrics.unreadTotal > 0 ? "warm" : "muted"));
    chips.appendChild(createPillFn(`${metrics.draftTotal} 条草稿`, metrics.draftTotal > 0 ? "accent" : "muted"));
    chips.appendChild(createPillFn(`${metrics.directCount} 个私信 · ${metrics.publicCount} 个群聊`, "muted"));
    if (metrics.caretakerQueue > 0) {
      chips.appendChild(createPillFn(`${metrics.caretakerQueue} 条小狗留言`, "accent"));
    }
  }

  function appendRoomDigestActiveRoomChips(chips, activeRoom, shellPage) {
    if (!activeRoom) return;
    chips.appendChild(createPillFn(roomThreadHeadlineFn(activeRoom), "muted"));
    if (shellPage !== "user") {
      const sendErrors = getRoomSendErrors?.() || {};
      const pendingEchoes = pendingEchoesForRoomFn?.(activeRoom.id) || [];
      chips.appendChild(
        createPillFn(
          roomChatStatusSummaryFn(activeRoom),
          sendErrors[activeRoom.id] ? "danger" : pendingEchoes.length ? "warm" : "accent",
        ),
      );
      const pendingCount = caretakerPendingCountFn(activeRoom) || 0;
      const unreadCount = unreadCountFn(activeRoom) || 0;
      chips.appendChild(
        createPillFn(
          roomQueueSummaryFn(activeRoom),
          pendingCount > 0 || unreadCount > 0 ? "warm" : "muted",
        ),
      );
    }
    chips.appendChild(
      createPillFn(
        shellPage === "admin"
          ? `当前会话 ${roomThreadHeadlineFn(activeRoom)}`
          : `当前 ${roomThreadHeadlineFn(activeRoom)}`,
        "muted",
      ),
    );
    const caretaker = caretakerProfileFn?.(activeRoom);
    if (caretaker) {
      const pendingCount = caretakerPendingCountFn(activeRoom) || 0;
      chips.appendChild(
        createPillFn(
          `${caretaker.name} 在岗 · ${pendingCount} 条代办`,
          pendingCount > 0 ? "warm" : "accent",
        ),
      );
    }
  }

  function createRoomDigestChipsNode(shellPage, metrics) {
    const chips = documentRef.createElement("div");
    chips.className = "room-digest-chips";
    appendRoomDigestBaseChips(chips, shellPage, metrics);
    appendRoomDigestActiveRoomChips(chips, metrics.activeRoom, shellPage);
    return chips;
  }

  function renderRoomDigest(rooms = roomsValue()) {
    const roomDigestEl = getRoomDigestEl?.();
    if (!roomDigestEl) return;
    clearChildrenFn(roomDigestEl);
    const shellPage = shellPageValue();
    const metrics = roomDigestMetrics();
    roomDigestEl.appendChild(createRoomDigestTitleNode(Array.isArray(rooms) ? rooms : []));
    roomDigestEl.appendChild(createRoomDigestCopyNode(metrics.activeRoom, shellPage));
    roomDigestEl.appendChild(createRoomDigestChipsNode(shellPage, metrics));
  }

  return {
    roomDigestMetrics,
    createRoomDigestTitleNode,
    createRoomDigestCopyNode,
    appendRoomDigestBaseChips,
    appendRoomDigestActiveRoomChips,
    createRoomDigestChipsNode,
    renderRoomDigest,
  };
}
