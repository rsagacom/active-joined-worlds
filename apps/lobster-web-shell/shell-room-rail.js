/* ============================================================
   shell-room-rail.js — 从左栏/房间列表/居民列表/rail 渲染提取
   依赖注入模式：通过 initRail() 注入 DOM refs 和回调
   ============================================================ */

// --- module-scoped context ---
let _els = {};
let _callbacks = {};

/**
 * @param {object} elMap - DOM element references
 * @param {object} cbs   - Required callbacks
 */
export function initRail(elMap, cbs) {
  _els = {
    roomListEl: elMap.roomListEl || null,
    residentListEl: elMap.residentListEl || null,
    roomSearchInputEl: elMap.roomSearchInputEl || null,
    roomToolbarNoteEl: elMap.roomToolbarNoteEl || null,
    roomFilterButtons: elMap.roomFilterButtons || [],
    conversationOverviewEl: elMap.conversationOverviewEl || null,
    roomDigestEl: elMap.roomDigestEl || null,
  };
  _callbacks = {
    getRooms: cbs.getRooms || (() => []),
    getActiveRoomId: cbs.getActiveRoomId || (() => null),
    setActiveRoomId: cbs.setActiveRoomId || (() => {}),
    getRoomFilter: cbs.getRoomFilter || (() => "all"),
    setRoomFilter: cbs.setRoomFilter || (() => {}),
    getRoomSearch: cbs.getRoomSearch || (() => ""),
    setRoomSearch: cbs.setRoomSearch || (() => {}),
    getGatewayUrl: cbs.getGatewayUrl || (() => null),
    getShellPage: cbs.getShellPage || (() => "hub"),
    getCurrentIdentity: cbs.getCurrentIdentity || (() => ""),
    getRoomReadMarkers: cbs.getRoomReadMarkers || (() => ({})),
    persistRoomReadMarkers: cbs.persistRoomReadMarkers || (() => {}),
    // Actions
    onRoomFocused: cbs.onRoomFocused || (() => {}),
    onRoomsRendered: cbs.onRoomsRendered || (() => {}),
    // Utilities
    createLine: cbs.createLine || ((label, text) => { const el = document.createElement("div"); el.className = label; el.textContent = text; return el; }),
    createPill: cbs.createPill || ((label, tone) => { const el = document.createElement("span"); el.className = `pill pill-${tone}`; el.textContent = label; return el; }),
    clearChildren: cbs.clearChildren || ((el) => { while (el && el.firstChild) el.removeChild(el.firstChild); }),
    translateRoomKind: cbs.translateRoomKind || ((k) => k),
    translateRoomKindForShellPage: cbs.translateRoomKindForShellPage || ((k) => k),
    roomHasDraft: cbs.roomHasDraft || (() => false),
    visiblePendingEchoCount: cbs.visiblePendingEchoCount || (() => 0),
    visiblePendingEchoesForRoom: cbs.visiblePendingEchoesForRoom || (() => []),
    roomSyncLabel: cbs.roomSyncLabel || (() => ""),
    latestRoomQuickAction: cbs.latestRoomQuickAction || (() => ""),
    roomQuickActionSummary: cbs.roomQuickActionSummary || (() => ""),
    resolveRoomQuickPreview: cbs.resolveRoomQuickPreview || (() => null),
    quickActionPreviewPrimaryFieldText: cbs.quickActionPreviewPrimaryFieldText || (() => ""),
    createRoomQuickActionPill: cbs.createRoomQuickActionPill || (() => null),
    createRoomQuickPreviewPill: cbs.createRoomQuickPreviewPill || (() => null),
    createRoomInlineActions: cbs.createRoomInlineActions || (() => null),
    ensureRoomQuickActions: cbs.ensureRoomQuickActions || (() => {}),
    caretakerProfile: cbs.caretakerProfile || (() => null),
    caretakerPendingCount: cbs.caretakerPendingCount || (() => 0),
    roomSendErrors: cbs.roomSendErrors || (() => ({})),
    joinOrFallback: cbs.joinOrFallback || defaultJoinOrFallback,
    roomRouteLabel: cbs.roomRouteLabel || (() => ""),
    roomLastActivity: cbs.roomLastActivity || (() => ""),
  };
}

// --- Room display helpers ---

export function roomKind(room) {
  if (room?.id?.startsWith("dm:")) return "direct";
  if (room?.id?.startsWith("room:")) return "public";
  return "system";
}

export function badgeToken(value, fallback = DEFAULT_BADGE_TEXT) {
  const normalized = String(value || "")
    .replace(/^私信\s*·\s*/u, "")
    .replace(/^[#@]/u, "")
    .trim();
  if (!normalized) return fallback;
  return normalized.slice(0, BADGE_MAX_CHARS).toUpperCase();
}

export function roomDisplayPeer(room) {
  if (!room) return "私聊对象";
  if (typeof room.peer_label === "string" && room.peer_label.trim()) {
    return room.peer_label.trim();
  }
  if (typeof room.participant_label === "string" && room.participant_label.trim()) {
    const label = room.participant_label.trim();
    const match = label.match(/^(?:你与|与)\s*(.+)$/u);
    return match ? match[1] : label;
  }
  const title = typeof room.title === "string" ? room.title.trim() : "";
  const strippedTitle = title
    .replace(/^私信\s*[·•-]\s*/u, "")
    .replace(/^dm\s*[·•-]\s*/iu, "")
    .trim();
  if (strippedTitle && strippedTitle !== title) {
    return strippedTitle;
  }
  const identity = _callbacks.getCurrentIdentity ? _callbacks.getCurrentIdentity() : "";
  const parts = (room.id || "")
    .split(":")
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts[0] === "dm") {
    return parts.find((item) => item !== "dm" && item !== identity) || "私聊对象";
  }
  return room.subtitle || "私聊对象";
}

export function roomThreadHeadline(room) {
  if (!room) return "会话未打开";
  if (typeof room?.thread_headline === "string" && room.thread_headline.trim()) {
    return room.thread_headline.trim();
  }
  if (typeof room?.title === "string" && room.title.trim()) {
    return room.title.trim();
  }
  const shellPage = _callbacks.getShellPage ? _callbacks.getShellPage() : "hub";
  const kind = roomKind(room);
  if (shellPage === SHELL_PAGE_USER) {
    if (kind === "direct") {
      return `正在和 ${roomDisplayPeer(room)} 聊天`;
    }
    if (kind === "public") {
      return `${roomAudienceLabel(room)} · 城镇里`;
    }
    return room.participant_label || "系统通知";
  }
  if (kind === "direct") {
    return `正在与 ${roomDisplayPeer(room)} 聊天`;
  }
  if (kind === "public") {
    return `${roomAudienceLabel(room)} · 群聊`;
  }
  return room.participant_label || room.route_label || "系统会话";
}

export function roomAudienceLabel(room) {
  if (!room) return "未选会话";
  const kind = roomKind(room);
  if (kind === "direct") {
    return room.participant_label || `你与 ${roomDisplayPeer(room)}`;
  }
  if (kind === "public") {
    // NOTE: publicRoomRecordForConversation requires governance state not readily available here.
    // Falls back to room-level labels.
    if (room.member_count > 0) {
      return `${roomMemberCount(room)} 名成员`;
    }
    return "群聊成员";
  }
  return "系统频道";
}

export function roomMemberCount(room) {
  const explicit = Number(room?.member_count);
  if (Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }
  const participants = new Set((room?.messages || []).map((message) => message.sender).filter(Boolean));
  const identity = _callbacks.getCurrentIdentity ? _callbacks.getCurrentIdentity() : "";
  if (identity) {
    participants.add(identity);
  }
  if (participants.size > 0) {
    return participants.size;
  }
  return roomKind(room) === "direct" ? 2 : 1;
}

export function roomActivityTime(room) {
  if (typeof room?.activity_time_label === "string" && room.activity_time_label.trim()) {
    return room.activity_time_label.trim();
  }
  const lastMessage = latestRoomMessageLike(room);
  return lastMessage?.pending ? "待同步" : lastMessage?.timestamp || FALLBACK_NO_MESSAGES;
}

export function latestRoomMessageLike(room) {
  if (!room) return null;
  const committed = Array.isArray(room.messages) ? room.messages : [];
  const pending = _callbacks.visiblePendingEchoesForRoom
    ? _callbacks.visiblePendingEchoesForRoom(room)
    : [];
  const combined = [...committed, ...pending];
  return combined[combined.length - 1] || null;
}

export function roomPreview(room) {
  const preview = _callbacks.resolveRoomQuickPreview
    ? _callbacks.resolveRoomQuickPreview(room)
    : null;
  if (preview?.structured) {
    const field = _callbacks.quickActionPreviewPrimaryFieldText
      ? _callbacks.quickActionPreviewPrimaryFieldText(preview.structured)
      : null;
    if (field) return field;
  }
  if (typeof room?.preview_text === "string" && room.preview_text.trim()) {
    return room.preview_text.trim();
  }
  return latestRoomMessageLike(room)?.text || "还没有消息，先发第一句吧。";
}

export function roomSummaryLine(room) {
  if (!room) return "未选择聊天";
  if (typeof room.list_summary === "string" && room.list_summary.trim()) {
    return room.list_summary.trim();
  }
  const shellPage = _callbacks.getShellPage ? _callbacks.getShellPage() : "hub";
  const translateKind = _callbacks.translateRoomKindForShellPage || ((k) => k);
  const parts = [room.kind_hint || translateKind(roomKind(room), shellPage)];
  if (roomKind(room) !== "system") {
    parts.push(`${roomMemberCount(room)} 人`);
  }
  if ((room.messages || []).length) {
    parts.push(`${room.messages.length} 条消息`);
  }
  const summary = _callbacks.roomQuickActionSummary
    ? _callbacks.roomQuickActionSummary(room)
    : "";
  if (summary) {
    parts.push(summary);
  }
  const joinOrFallback = _callbacks.joinOrFallback || defaultJoinOrFallback;
  return joinOrFallback(
    parts.filter(Boolean),
    room.preview_text || room.overview_summary || room.subtitle || room.meta || FALLBACK_WAITING,
  );
}

export function roomStatusLine(room) {
  if (!room) return FALLBACK_WAITING;
  if (typeof room.status_line === "string" && room.status_line.trim()) {
    return room.status_line.trim();
  }
  const joinOrFallback = _callbacks.joinOrFallback || defaultJoinOrFallback;
  const parts = [_callbacks.roomRouteLabel ? _callbacks.roomRouteLabel(room) : ""];
  if (room.meta) {
    parts.push(room.meta);
  }
  const lastActivity = _callbacks.roomLastActivity
    ? _callbacks.roomLastActivity(room)
    : "";
  if (lastActivity && lastActivity !== FALLBACK_NO_MESSAGES) {
    parts.push(lastActivity);
  }
  return joinOrFallback(parts.filter(Boolean), FALLBACK_WAITING);
}

export function unreadCount(room) {
  const markers = _callbacks.getRoomReadMarkers ? _callbacks.getRoomReadMarkers() : {};
  const seen = Number(markers?.[room?.id] || 0);
  return Math.max((room?.messages?.length || 0) - seen, 0);
}

export function markRoomRead(roomId) {
  const rooms = _callbacks.getRooms ? _callbacks.getRooms() : [];
  const room = rooms.find((item) => item.id === roomId);
  if (!room) return;
  const markers = _callbacks.getRoomReadMarkers ? _callbacks.getRoomReadMarkers() : {};
  markers[roomId] = room.messages?.length || 0;
  if (_callbacks.persistRoomReadMarkers) _callbacks.persistRoomReadMarkers();
}

export function defaultActiveRoomId(rooms = []) {
  const preferred = typeof document !== "undefined" ? document.body?.dataset?.defaultRoomId : null;
  if (preferred && rooms.some((room) => room.id === preferred)) {
    return preferred;
  }
  const shellVariant = typeof document !== "undefined" ? document.body?.dataset?.shellVariant : null;
  if (shellVariant === SHELL_VARIANT_CREATIVE) {
    return rooms.find((room) => roomKind(room) === "direct")?.id ?? rooms[FIRST_ROOM_INDEX]?.id ?? null;
  }
  if (shellVariant === SHELL_VARIANT_PUBLIC_SQUARE) {
    return rooms.find((room) => room.id === DEFAULT_LOBBY_ROOM_ID)?.id
      ?? rooms.find((room) => roomKind(room) === "public")?.id
      ?? rooms[FIRST_ROOM_INDEX]?.id
      ?? null;
  }
  return rooms[FIRST_ROOM_INDEX]?.id ?? null;
}

// --- Search & Filter ---

export function roomMatchesSearch(room, query) {
  if (!query) return true;
  const detailMeta = Array.isArray(room?.detail_card?.meta)
    ? room.detail_card.meta.flatMap((item) => [item?.label, item?.value])
    : [];
  const workflowSteps = Array.isArray(room?.workflow?.steps)
    ? room.workflow.steps.flatMap((step) => [step?.label, step?.copy])
    : [];
  const inlineActions = Array.isArray(room?.inline_actions)
    ? room.inline_actions.flatMap((action) => [action?.label, action?.action, action?.next_state])
    : [];
  const haystack = [
    room.id,
    room.title,
    room.subtitle,
    room.meta,
    room.kind_hint,
    room.participant_label,
    room.route_label,
    room.list_summary,
    room.status_line,
    room.thread_headline,
    room.chat_status_summary,
    room.queue_summary,
    room.preview_text,
    room.last_activity_label,
    room.activity_time_label,
    room.overview_summary,
    room.context_summary,
    room.scene_banner,
    room.workflow?.summary,
    room.stage_projection?.title,
    room.stage_projection?.summary,
    room.stage_projection?.badge,
    room.portrait_projection?.title,
    room.portrait_projection?.summary,
    room.portrait_projection?.badge,
    room.portrait_projection?.status,
    roomAudienceLabel(room),
    ...detailMeta,
    ...workflowSteps,
    ...inlineActions,
  ];
  const term = String(query).toLowerCase();
  return haystack.some(
    (item) => typeof item === "string" && item.toLowerCase().includes(term),
  );
}

export function filteredRooms(rooms, roomFilter, roomSearch) {
  return rooms.filter((room) => {
    if (roomFilter === "direct" && roomKind(room) !== "direct") {
      return false;
    }
    if (roomFilter === "public" && roomKind(room) !== "public") {
      return false;
    }
    return roomMatchesSearch(room, roomSearch);
  });
}

// --- Room grouping ---

// 房间排序权重：高值排前面，各层不重叠以确保优先级清晰
// 100 — 当前活跃房间（始终置顶，压倒其他所有信号）
//  24 — 发送失败（比草稿重要：用户需要立刻看到失败重试）
//  12 — 有未发草稿（比未读重要：草稿代表主动意图）
//   8 — 未读上限（兜底排序，封顶避免未读淹没有意图的房间）
var RANK_ACTIVE  = 100;
var RANK_ERROR   = 24;
var RANK_DRAFT   = 12;
var RANK_UNREAD_CAP = 8;

// 显示常量
var BADGE_MAX_CHARS = 2;
var UNREAD_DISPLAY_CAP = 99;
var FALLBACK_WAITING = "等待新消息";
var FALLBACK_NO_MESSAGES = "暂无消息";
var DEFAULT_BADGE_TEXT = "聊";
var JOIN_SEPARATOR = "、";
var DEFAULT_LOBBY_ROOM_ID = "room:world:lobby";
var FIRST_ROOM_INDEX = 0;

// Shell 页面/变体键名
var SHELL_VARIANT_CREATIVE = "creative-terminal";
var SHELL_VARIANT_PUBLIC_SQUARE = "public-square";
var SHELL_PAGE_ADMIN = "admin";
var SHELL_PAGE_USER = "user";

// 默认 joinOrFallback（避免三处重复声明）
function defaultJoinOrFallback(items, fb) {
  return items && items.length ? items.join(JOIN_SEPARATOR) : fb;
}

export function roomGroupBlueprints(shellPage, rooms, activeRoomId, roomSendErrors, roomHasDraftFn, unreadCountFn) {
  const rhd = roomHasDraftFn || (() => false);
  const uc = unreadCountFn || unreadCount;
  const sendErrors = roomSendErrors || {};
  const rankRoom = (room) =>
    (room.id === activeRoomId ? RANK_ACTIVE : 0) +
    (sendErrors[room.id] ? RANK_ERROR : 0) +
    (rhd(room.id) ? RANK_DRAFT : 0) +
    Math.min(uc(room), RANK_UNREAD_CAP);
  const sortRooms = (items) => [...items].sort((left, right) => rankRoom(right) - rankRoom(left));
  const directRooms = sortRooms(rooms.filter((room) => roomKind(room) === "direct"));
  const publicRooms = sortRooms(rooms.filter((room) => roomKind(room) === "public"));
  const systemRooms = sortRooms(rooms.filter((room) => roomKind(room) === "system"));

  if (shellPage === SHELL_PAGE_ADMIN) {
    return [
      { kind: "direct", title: "待跟进会话", hint: "优先处理访客提醒、未发草稿和追问", rooms: directRooms },
      { kind: "public", title: "后台频道", hint: "城市群聊、公告窗和巡检频道", rooms: publicRooms },
      { kind: "system", title: "系统提示", hint: "同步状态、导出结果和错误提示", rooms: systemRooms },
    ].filter((group) => group.rooms.length > 0);
  }

  if (shellPage === SHELL_PAGE_USER) {
    return [
      { kind: "direct", title: "居民私信", hint: "一对一聊天和小窗续聊", rooms: directRooms },
      { kind: "public", title: "城镇频道", hint: "公共房间、广场和多人聊天", rooms: publicRooms },
      { kind: "system", title: "城门消息", hint: "同步提醒和系统消息", rooms: systemRooms },
    ].filter((group) => group.rooms.length > 0);
  }

  return [
    { kind: "direct", title: "私信", hint: "一对一聊天", rooms: directRooms },
    { kind: "public", title: "频道", hint: "公共房间和城市广场", rooms: publicRooms },
    { kind: "system", title: "通知", hint: "同步状态和系统提示", rooms: systemRooms },
  ].filter((group) => group.rooms.length > 0);
}

// --- DOM factory ---

export function createRoomUnreadBadgeNode(unread) {
  if (!Number.isFinite(unread) || unread <= 0) return null;
  const badge = document.createElement("span");
  badge.className = "room-unread-badge";
  badge.setAttribute("aria-label", `${unread} 条未读消息`);
  badge.textContent = unread > UNREAD_DISPLAY_CAP ? UNREAD_DISPLAY_CAP + "+" : String(unread);
  return badge;
}

// --- data spec (no DOM) ---

export function roomAvatarSpec({ room, kind, shellPage, headline }) {
  const isResidentRoomEntry = shellPage === SHELL_PAGE_USER && kind === "direct" && Boolean(room?.id);

  let text;
  if (shellPage === SHELL_PAGE_USER) {
    if (kind === "direct") {
      text = badgeToken(room?.participant_label || headline, "居");
    } else if (kind === "public") {
      text = "城";
    } else {
      text = "门";
    }
  } else {
    if (kind === "direct") {
      text = "私";
    } else if (kind === "public") {
      text = "群";
    } else {
      text = "通";
    }
  }

  const title = isResidentRoomEntry ? `进入 ${headline} 的房间私聊` : "";
  const ariaLabel = title;

  return {
    text,
    className: `room-avatar room-avatar-${kind}`,
    title,
    ariaLabel,
    isResidentRoomEntry,
  };
}

export function roomButtonClassSpec({ roomId, activeRoomId, unread, kind }) {
  const isActive = roomId === activeRoomId;
  const hasUnread = !isActive && Number.isFinite(unread) && unread > 0;
  return {
    className: `room-button${isActive ? " active" : ""}${hasUnread ? " room-button-unread" : ""}`,
    datasetKind: kind,
    isActive,
    hasUnread,
  };
}

export function roomTitleStackSpec(room, kicker) {
  return {
    name: roomThreadHeadline(room),
    kicker: kicker !== undefined ? kicker : roomAudienceLabel(room),
  };
}

export function roomTopMetaSpec({ room, kind, kindPillLabel, activeRoomId, unread, shellPage }) {
  const isActive = room?.id === activeRoomId;
  return {
    activityLine: roomActivityTime(room),
    kindPill: {
      label: kindPillLabel,
      tone: kind === "direct" ? "accent" : "muted",
    },
    statusPill: isActive
      ? { label: shellPage === SHELL_PAGE_ADMIN ? "后台中" : shellPage === SHELL_PAGE_USER ? "聊天中" : "当前", tone: "accent" }
      : Number.isFinite(unread) && unread > 0
        ? { label: `${unread} 未读`, tone: "warm" }
        : null,
  };
}

export function roomStatsSpec(rooms, allRooms, roomHasDraftFn, unreadCountFn, visiblePendingEchoCountFn, roomSendErrors) {
  const unreadTotal = allRooms.reduce((sum, room) => sum + unreadCountFn(room), 0);
  const draftTotal = allRooms.reduce((sum, room) => sum + (roomHasDraftFn(room.id) ? 1 : 0), 0);
  const followUpTotal = allRooms.reduce(
    (sum, room) =>
      sum +
      Number(
        Boolean(
          roomSendErrors[room.id] ||
            roomHasDraftFn(room.id) ||
            unreadCountFn(room) ||
            visiblePendingEchoCountFn(room),
        ),
      ),
    0,
  );
  const directCount = rooms.filter((room) => roomKind(room) === "direct").length;
  const publicCount = rooms.filter((room) => roomKind(room) === "public").length;
  return { unreadTotal, draftTotal, followUpTotal, directCount, publicCount };
}

export function roomEmptyStateSpec(gatewayUrl) {
  return gatewayUrl
    ? "没有匹配到频道或私信，可以切换筛选、清空搜索，或先从左侧打开一个会话。"
    : "当前只有离线样例数据，连接网关后会显示真实频道。";
}

export function roomToolbarNoteSpec({
  shellPage,
  visibleCount,
  totalCount,
  roomFilter,
  roomSearch,
  stats,
  activeVisible,
  activeRoomId,
  syncLabel,
  roomKindLabel,
}) {
  const pieces = shellPage === SHELL_PAGE_ADMIN
    ? [
        `${syncLabel} · 后台 ${visibleCount} / ${totalCount} 个窗口`,
        `待跟进 ${stats.followUpTotal} · 私信 ${stats.directCount} · 频道 ${stats.publicCount}`,
      ]
    : [
        `${syncLabel} · 展示 ${visibleCount} / ${totalCount} 个会话`,
        `私信 ${stats.directCount} · 频道 ${stats.publicCount}`,
      ];
  if (roomFilter !== "all") {
    pieces.push(`筛选：${roomKindLabel}`);
  }
  if (roomSearch) {
    pieces.push(`搜索：${roomSearch}`);
  }
  if (stats.unreadTotal > 0) {
    pieces.push(`总未读 ${stats.unreadTotal}`);
  }
  if (stats.draftTotal > 0) {
    pieces.push(`草稿 ${stats.draftTotal}`);
  }
  if (!activeVisible && activeRoomId) {
    pieces.push("当前会话被筛选隐藏");
  }
  return pieces;
}
