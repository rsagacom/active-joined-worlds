import { currentShellPage, normalizeProviderConnectionState, providerIndicatesGatewayOffline } from "./shell-shared.js";
import { caretakerPendingCount, caretakerProfile } from "./shell-room-profiles.js";
import { gatewayQueryParam } from "./shell-gateway.js";
import {
  composerContextItemsForState,
  composerHeroModelForState,
} from "./shell-room-render.js";

let _ctx = null;

export function initShellComposer(deps) {
  _ctx = deps;
}

// Internal helpers (redefined here to avoid _ctx bloat)
function clearChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function createLine(className, text) {
  const div = document.createElement("div");
  div.className = className;
  div.textContent = text;
  return div;
}

function createPill(text, tone = "muted") {
  const span = document.createElement("span");
  span.className = `pill pill-${tone}`;
  span.textContent = text;
  return span;
}

function setDatasetFlag(node, key, value) {
  if (!node?.dataset) return;
  if (value == null || value === "") {
    delete node.dataset[key];
    return;
  }
  node.dataset[key] = String(value);
}

function roomKind(room) {
  if (room?.id?.startsWith("dm:")) return "direct";
  if (room?.id?.startsWith("room:")) return "public";
  return "system";
}

function unreadCount(room) {
  const seen = Number(_ctx.roomReadMarkers?.[room.id] || 0);
  return Math.max((room?.messages?.length || 0) - seen, 0);
}

function queryGatewayUrl() {
  return gatewayQueryParam(window.location.href);
}

export function seedComposerFromQuickAction(action, template, options = {}) {
  if (template === undefined) template = _ctx.quickActionTemplate(action);
  if (!_ctx.composerInputEl || _ctx.composerInputEl.disabled || !_ctx.activeRoomId) return;
  const previousAction = _ctx.roomQuickAction(_ctx.activeRoomId);
  const previousTemplate = _ctx.quickActionTemplate(previousAction);
  const nextTemplate = template;
  const currentValue = _ctx.composerInputEl.value.trim();
  const shouldSeed = options.force === true || !currentValue || currentValue === previousTemplate.trim();
  _ctx.setRoomQuickAction(_ctx.activeRoomId, action);
  if (shouldSeed) {
    _ctx.composerInputEl.value = nextTemplate;
    _ctx.composerInputEl.dispatchEvent(new Event("input", { bubbles: true }));
  } else {
    _ctx.updateComposerState();
    _ctx.renderConversationOverview();
  }
  focusComposerInput({ force: true });
}



export function syncComposerDraft({ force = false } = {}) {
  if (!_ctx.composerInputEl) return;
  const nextDraft = _ctx.draftForRoom(_ctx.activeRoomId);
  if (force || document.activeElement !== _ctx.composerInputEl) {
    _ctx.composerInputEl.value = nextDraft;
  }
  autoSizeComposerInput();
}



export function focusComposerInput({ force = false, select = false } = {}) {
  if (!_ctx.composerInputEl || _ctx.composerInputEl.disabled) return;
  requestAnimationFrame(() => {
    if (!_ctx.composerInputEl || _ctx.composerInputEl.disabled) return;
    if (!force && document.activeElement === _ctx.composerInputEl) return;
    _ctx.composerInputEl.focus({ preventScroll: true });
    if (select) {
      _ctx.composerInputEl.select();
    }
  });
}



export function autoSizeComposerInput() {
  if (!_ctx.composerInputEl) return;
  _ctx.composerInputEl.style.height = "auto";
  const isWechat = !!_ctx.composerInputEl.closest(".wechat-composer");
  const isMobile = window.innerWidth <= 720;
  const isCityHub = document.body.dataset.sfcTheme === "city";
  const isSceneComposer = !!_ctx.composerInputEl.closest(".public-square-composer, .creative-composer");
  const isResidentShell = currentShellPage() === "user";
  const minH = isWechat || isResidentShell ? (isMobile ? 40 : 36) : (isMobile ? 48 : (isCityHub ? 36 : 74));
  const maxH = isWechat || isResidentShell || isSceneComposer ? 120 : (isMobile ? 120 : (isCityHub ? 80 : 220));
  const nextHeight = Math.min(Math.max(_ctx.composerInputEl.scrollHeight, minH), maxH);
  _ctx.composerInputEl.style.height = `${nextHeight}px`;
  _ctx.composerInputEl.style.overflowY = _ctx.composerInputEl.scrollHeight > maxH ? "auto" : "hidden";
}



export function ensureComposerTip() {
  if (!_ctx.composerFormEl) return;
  if (!_ctx.composerTipEl) {
    _ctx.composerTipEl = document.createElement("div");
    _ctx.composerTipEl.className = "composer-tip";
  }
  const reference = _ctx.composerStatusEl || _ctx.composerFormEl.querySelector(".composer-row");
  if (reference && !_ctx.composerTipEl.isConnected) {
    reference.insertAdjacentElement("afterend", _ctx.composerTipEl);
  }
  updateComposerTip();
}



export function renderComposerHero(room) {
  if (currentShellPage() === "user" || !_ctx.composerHeroEl) return;
  const shellPage = currentShellPage();
  const model = composerHeroModelForState({
    room,
    shellPage,
    roomKind: room ? roomKind(room) : "",
    roomThreadHeadline: room ? _ctx.roomThreadHeadline(room) : "",
    roomDisplayPeer: room ? _ctx.roomDisplayPeer(room) : "",
    roomSyncLabel: room ? _ctx.roomSyncLabel() : "",
    caretakerPendingCount: room ? caretakerPendingCount(room) : 0,
    unreadCount: room ? unreadCount(room) : 0,
    refreshInProgress: _ctx.refreshInProgress,
    gatewayUrl: _ctx.gatewayUrl,
  });
  clearChildren(_ctx.composerHeroEl);
  _ctx.composerHeroEl.dataset.variant = model.variant;

  const kicker = document.createElement("div");
  kicker.className = "composer-hero-kicker";
  kicker.textContent = model.kicker;
  _ctx.composerHeroEl.appendChild(kicker);

  const title = document.createElement("div");
  title.className = "composer-hero-title";
  title.textContent = model.title;
  _ctx.composerHeroEl.appendChild(title);

  const note = document.createElement("div");
  note.className = "composer-hero-note";
  note.textContent = model.note;
  _ctx.composerHeroEl.appendChild(note);

  const chips = document.createElement("div");
  chips.className = "composer-hero-chips";
  for (const chip of model.chips) {
    chips.appendChild(createPill(chip.text, chip.tone));
  }
  _ctx.composerHeroEl.appendChild(chips);
}



export function updateComposerContext(room) {
  if (currentShellPage() === "user" || !_ctx.composerContextEl) return;
  const shellPage = currentShellPage();
  clearChildren(_ctx.composerContextEl);

  const items = composerContextItemsForState({
    room,
    shellPage,
    gatewayUrl: _ctx.gatewayUrl,
    threadHeadline: room ? _ctx.roomThreadHeadline(room) : "",
    audienceLabel: room ? _ctx.roomAudienceLabel(room) : "",
    routeLabel: room ? _ctx.roomRouteLabel(room) : "",
    chatStatusSummary: room ? _ctx.roomChatStatusSummary(room) : "",
    queueSummary: room ? _ctx.roomQueueSummary(room) : "",
    caretakerPendingCount: room ? caretakerPendingCount(room) : 0,
    unreadCount: room ? unreadCount(room) : 0,
    visiblePendingEchoCount: room ? _ctx.visiblePendingEchoCount(room) : 0,
    sendError: room ? _ctx.roomSendErrors[room.id] : "",
    isSendingMessage: _ctx.isSendingMessage,
  });

  for (const item of items) {
    const block = document.createElement("div");
    block.className = "composer-context-item";
    block.appendChild(createLine("composer-context-label", item.label));
    const value = document.createElement("div");
    value.className = `composer-context-value composer-context-value-${item.tone}`;
    value.textContent = item.value;
    block.appendChild(value);
    _ctx.composerContextEl.appendChild(block);
  }
}



export function updateComposerTip() {
  if (!_ctx.composerTipEl) return;
  const room = _ctx.state.rooms.find((item) => item.id === _ctx.activeRoomId);
  const roomLabel = room
    ? _ctx.roomThreadHeadline(room)
    : "未选会话";
  const activeAction = room ? _ctx.roomQuickAction(room.id) : "";
  const instruction = "Enter 发送 · Shift+Enter 换行 · ↑ 取回上一条";
  const fallback = _ctx.gatewayUrl
    ? room
      ? "网关回执慢时，会先保留本地草稿和待同步消息。"
      : "先选会话后输入区才会解锁。"
    : room
      ? "离线预览态，消息先留在本地时间线。"
      : "先选会话后输入区才会解锁，草稿会保留在当前窗口。";
  _ctx.composerTipEl.textContent = activeAction
    ? `${roomLabel} · 当前动作 ${activeAction} · ${instruction} · ${fallback}`
    : `${roomLabel} · ${instruction} · ${fallback}`;
}



export function ensureComposerKeyBindings() {
  if (!_ctx.composerInputEl) return;
  if (_ctx.composerInputEl.dataset.chatBindings === "true") return;
  _ctx.composerInputEl.addEventListener("keydown", handleComposerInputKeydown);
  _ctx.composerFormEl?.addEventListener("pointerdown", handleComposerFormPointerdown);
  _ctx.composerInputEl.dataset.chatBindings = "true";
}



export function triggerComposerKeyboardSubmit() {
  const now = Date.now();
  if (now - _ctx.lastComposerKeyboardSubmitAt < 120) return;
  if (!_ctx.composerFormEl || !_ctx.composerInputEl || _ctx.composerInputEl.disabled) return;
  _ctx.lastComposerKeyboardSubmitAt = now;
  void _ctx.submitComposerMessage();
}



export function handleComposerInputKeydown(event) {
  if (
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.altKey &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.isComposing &&
    !event.repeat
  ) {
    event.preventDefault();
    event.stopPropagation();
    triggerComposerKeyboardSubmit();
    return;
  }
  if (
    event.key === "ArrowUp" &&
    !event.shiftKey &&
    !event.altKey &&
    !event.metaKey &&
    !event.ctrlKey &&
    _ctx.composerInputEl.value.trim() === "" &&
    _ctx.lastSentMessage
  ) {
    event.preventDefault();
    _ctx.composerInputEl.value = _ctx.lastSentMessage;
    _ctx.composerInputEl.dispatchEvent(new Event("input", { bubbles: true }));
  }
}



export function handleComposerFormPointerdown(event) {
  if (!_ctx.composerInputEl) return;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.closest("textarea, button, input, select, a, summary")) return;
  requestAnimationFrame(() => {
    focusComposerInput({ force: true });
  });
}



export function renderComposerMeta(room) {
  if (!_ctx.composerMetaEl) return;
  clearChildren(_ctx.composerMetaEl);
  const shellPage = currentShellPage();
  const baseStatus = room
    ? _ctx.roomSendErrors[room.id]
      ? "待修改后重发"
      : _ctx.isSendingMessage
        ? "发送中"
        : _ctx.roomHasDraft(room.id)
          ? "草稿已保存"
          : "可直接发送"
    : "先打开会话";
  const items =
    shellPage === "user"
      ? [
          { label: "当前会话", value: room ? _ctx.roomThreadHeadline(room) : "未选择会话" },
          { label: "聊天对象", value: room ? _ctx.roomAudienceLabel(room) : "等待会话" },
          { label: "同步", value: room ? _ctx.roomSyncLabel() : _ctx.gatewayUrl ? "等待会话" : "等待网关" },
          { label: "状态", value: baseStatus },
        ]
      : [
          {
            label: shellPage === "admin" ? "线程" : "会话标题",
            value: room ? _ctx.roomThreadHeadline(room) : "未选择会话",
          },
          {
            label: shellPage === "admin" ? "当前对象" : "聊天对象",
            value: room ? _ctx.roomAudienceLabel(room) : _ctx.gatewayUrl ? "等待会话" : "等待网关",
          },
          {
            label: shellPage === "admin" ? "消息去向" : "路由",
            value: room ? _ctx.roomRouteLabel(room) : _ctx.gatewayUrl ? "等待会话" : "等待网关",
          },
          {
            label: "聊天状态",
            value: room ? _ctx.roomChatStatusSummary(room) : baseStatus,
          },
          {
            label: "队列",
            value: room ? _ctx.roomQueueSummary(room) : "等待会话",
          },
          {
            label: shellPage === "admin" ? "当前身份" : "身份",
            value: _ctx.currentIdentity() || "访客",
          },
          { label: "输入", value: baseStatus },
        ];
  if (room && caretakerProfile(room)) {
    items.push({
      label: shellPage === "admin" ? "巡检/管家" : "管家",
      value: `${caretakerProfile(room).name} · ${caretakerProfile(room).auto_reply}`,
    });
  }
  const quickHint = _ctx.shellMode === "admin"
    ? "更多 · 刷新"
    : "广场 · 刷新";
  items.push({ label: "快捷", value: quickHint, tone: "muted" });
  for (const item of items) {
    const block = document.createElement("div");
    block.className = "composer-meta-item";
    block.appendChild(createLine("composer-meta-label", item.label));
    block.appendChild(createLine("composer-meta-value", item.value));
    _ctx.composerMetaEl.appendChild(block);
  }
}



export function gatewayUnavailableForComposer() {
  if (!_ctx.gatewayUrl) return false;
  const explicitGatewayUrl = Boolean(queryGatewayUrl());
  if (_ctx.lastRefreshErrorMessage && (explicitGatewayUrl || _ctx.providerLoaded)) return true;
  const providerState = normalizeProviderConnectionState(_ctx.provider.connection_state);
  return providerIndicatesGatewayOffline({ providerLoaded: _ctx.providerLoaded, provider: _ctx.provider, providerState });
}



export function composerStatusState({
  shellPage,
  gatewayUrl,
  activeRoomId,
  roomSendErrors,
  lastRefreshErrorMessage,
  isSendingMessage,
  draftText,
  quickAction,
  syncLabel,
  gatewayUnavailable,
  loginRequired,
  quickActionDraftStatusCopyFn,
}) {
  if (gatewayUnavailable) {
    return {
      tone: "danger",
      text: "连接离线，等待同步恢复后发送。",
    };
  }
  if (loginRequired) {
    return {
      tone: "warning",
      text: "请先登录后发送。登录后只加载该居民可见的私聊和公共会话。",
    };
  }
  if (!activeRoomId) {
    const baseCopy =
      shellPage === "admin"
        ? "先选会话后才能记录。现在可以先写草稿，选中会话后再发送。"
        : "先选会话后才能发送。现在可以先写草稿，选中会话后再发送。";
    return {
      tone: "muted",
      text: gatewayUrl
        ? baseCopy
        : `连接网关后可继续${shellPage === "admin" ? "记录" : "聊天"}；${baseCopy}`,
    };
  }
  const sendError = roomSendErrors?.[activeRoomId];
  if (sendError) {
    return {
      tone: "danger",
      text: `${sendError}，草稿已保留，可修改后重发。`,
    };
  }
  if (lastRefreshErrorMessage) {
    return {
      tone: "warning",
      text: `${lastRefreshErrorMessage}，当前仍显示上次快照。`,
    };
  }
  if (isSendingMessage) {
    return {
      tone: "accent",
      text: "消息发送中，成功后会自动刷新会话。",
    };
  }
  if (draftText?.trim()) {
    const trimmed = draftText.trim();
    return {
      tone: "accent",
      text:
        quickActionDraftStatusCopyFn?.(quickAction, trimmed.length) ||
        `草稿已暂存 · ${trimmed.length} 字`,
    };
  }
  return {
    tone: "muted",
    text: gatewayUrl
      ? `${syncLabel} · 当前输入会直接发到这个会话。`
      : "离线预览态，草稿会保留。",
  };
}
