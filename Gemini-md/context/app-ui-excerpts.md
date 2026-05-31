# app.js core UI excerpts for Gemini

Source: /Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell/app.js

This is intentionally compressed. Use it to understand the UI contract, not to patch code directly.

## DOM references and state globals

```js
const roomListEl = document.querySelector("#room-list");
const timelineEl = document.querySelector("#timeline");
const metaEl = document.querySelector("#conversation-meta");
const roomStageTitleEl = document.querySelector("#room-stage-title");
const conversationStageEl = document.querySelector(".conversation-stage");
const conversationStageCopyEl = document.querySelector(".conversation-stage-copy");
let roomStageCanvasEl = document.querySelector("#room-stage-canvas");
let roomStageCanvasWrapEl = roomStageCanvasEl?.closest(".conversation-stage-canvas-wrap") || null;
let roomStageNoteEl =
  document.querySelector("#room-stage-note") || document.querySelector(".conversation-stage-note");
let roomStageSideEl = document.querySelector(".conversation-stage-side");
let roomStagePortraitCanvasEl = document.querySelector("#room-stage-portrait-canvas");
let roomStagePortraitCanvasWrapEl =
  roomStagePortraitCanvasEl?.closest(".conversation-stage-canvas-wrap") || null;
const transportStateEl = document.querySelector("#transport-state");
const storageStateEl = document.querySelector("#storage-state");
const gatewayStateEl = document.querySelector("#gateway-state");
const providerStateEl = document.querySelector("#provider-state");
const worldStateEl = document.querySelector("#world-state");
const shellModeBadgeEl = document.querySelector("#shell-mode-badge");
const shellEntryCards = Array.from(document.querySelectorAll("[data-shell-entry]"));
const mastheadEyebrowEl = document.querySelector("#masthead-eyebrow");
const mastheadTitleEl = document.querySelector("#masthead-title");
const heroNoteEl = document.querySelector("#hero-note");
const entryGridEl = document.querySelector("#entry-grid");
const modeGuideEl = document.querySelector("#mode-guide");
const worldSummaryEl = document.querySelector("#world-summary");
const governanceStatusEl = document.querySelector("#governance-status");
const worldDirectoryListEl = document.querySelector("#world-directory-list");
const worldMirrorSourceListEl = document.querySelector("#world-mirror-source-list");
const worldSquareListEl = document.querySelector("#world-square-list");
const worldSafetyListEl = document.querySelector("#world-safety-list");
const providerConnectFormEl = document.querySelector("#provider-connect-form");
const providerUrlInputEl = document.querySelector("#provider-url-input");
const providerDisconnectButtonEl = document.querySelector("#provider-disconnect-button");
const authStatusEl = document.querySelector("#auth-status");
const authRequestFormEl = document.querySelector("#auth-request-form");
const authDeliverySelectEl = document.querySelector("#auth-delivery-select");
const authResidentInputEl = document.querySelector("#auth-resident-input");
const authEmailInputEl = document.querySelector("#auth-email-input");
const authMobileInputEl = document.querySelector("#auth-mobile-input");
const authDeviceInputEl = document.querySelector("#auth-device-input");
const authVerifyFormEl = document.querySelector("#auth-verify-form");
const authChallengeInputEl = document.querySelector("#auth-challenge-input");
const authCodeInputEl = document.querySelector("#auth-code-input");
const residentLoginCardEl = document.querySelector("#resident-login-card");
const residentLoginOverlayEl = document.querySelector("#resident-login-overlay");
const residentLoginCloseEl = document.querySelector("#resident-login-close");
const hudLoginToggleEl = document.querySelector("#hud-login-toggle");
const cityListEl = document.querySelector("#city-list");
const residentListEl = document.querySelector("#resident-list");
const exportFormatSelectEl = document.querySelector("#export-format-select");
const exportCurrentButtonEl = document.querySelector("#export-current-button");
const exportAllButtonEl = document.querySelector("#export-all-button");
const composerFormEl = document.querySelector("#composer");
const composerInputEl = document.querySelector("#composer-input");
const composerSendEl = document.querySelector("#composer-send");
const composerMentionTriggerEl = document.querySelector("[data-mention-trigger]");
const composerSymbolTriggerEl = document.querySelector("[data-symbol-trigger]");
const composerSymbolMenuEl = document.querySelector("[data-symbol-menu]");
const composerSymbolInsertEls = Array.from(document.querySelectorAll("[data-symbol-insert]"));
const identityInputEl = document.querySelector("#identity-input");
const cityCreateFormEl = document.querySelector("#city-create-form");
const cityJoinFormEl = document.querySelector("#city-join-form");
const roomCreateFormEl = document.querySelector("#room-create-form");
const cityTitleInputEl = document.querySelector("#city-title-input");
const citySlugInputEl = document.querySelector("#city-slug-input");
const cityDescriptionInputEl = document.querySelector("#city-description-input");
const cityJoinInputEl = document.querySelector("#city-join-input");
const roomCityInputEl = document.querySelector("#room-city-input");
const roomTitleInputEl = document.querySelector("#room-title-input");
const roomSlugInputEl = document.querySelector("#room-slug-input");
const roomDescriptionInputEl = document.querySelector("#room-description-input");
const directOpenFormEl = document.querySelector("#direct-open-form");
const directPeerInputEl = document.querySelector("#direct-peer-input");
const worldMirrorFormEl = document.querySelector("#world-mirror-form");
const worldMirrorUrlInputEl = document.querySelector("#world-mirror-url-input");
const worldNoticeFormEl = document.querySelector("#world-notice-form");
const worldNoticeTitleInputEl = document.querySelector("#world-notice-title-input");
const worldNoticeSeveritySelectEl = document.querySelector("#world-notice-severity-select");
const worldNoticeTagsInputEl = document.querySelector("#world-notice-tags-input");
const worldNoticeBodyInputEl = document.querySelector("#world-notice-body-input");
const worldTrustFormEl = document.querySelector("#world-trust-form");
const worldTrustCityInputEl = document.querySelector("#world-trust-city-input");
const worldTrustStateSelectEl = document.querySelector("#world-trust-state-select");
const worldTrustReasonInputEl = document.querySelector("#world-trust-reason-input");
const worldAdvisoryFormEl = document.querySelector("#world-advisory-form");
const worldAdvisorySubjectKindSelectEl = document.querySelector(
  "#world-advisory-subject-kind-select",
);
const worldAdvisorySubjectInputEl = document.querySelector("#world-advisory-subject-input");
const worldAdvisoryActionInputEl = document.querySelector("#world-advisory-action-input");
const worldAdvisoryReasonInputEl = document.querySelector("#world-advisory-reason-input");
const worldReportReviewFormEl = document.querySelector("#world-report-review-form");
const worldReportReviewIdInputEl = document.querySelector("#world-report-review-id-input");
const worldReportReviewStatusSelectEl = document.querySelector(
  "#world-report-review-status-select",
);
const worldReportReviewCityStateSelectEl = document.querySelector(
  "#world-report-review-city-state-select",
);
const worldReportReviewResolutionInputEl = document.querySelector(
  "#world-report-review-resolution-input",
);
const worldReportFormEl = document.querySelector("#world-report-form");
const worldReportCityInputEl = document.querySelector("#world-report-city-input");
const worldReportTargetKindSelectEl = document.querySelector("#world-report-target-kind-select");
const worldReportTargetInputEl = document.querySelector("#world-report-target-input");
const worldReportSummaryInputEl = document.querySelector("#world-report-summary-input");
const worldReportEvidenceInputEl = document.querySelector("#world-report-evidence-input");
const worldResidentSanctionFormEl = document.querySelector("#world-resident-sanction-form");
const worldResidentIdInputEl = document.querySelector("#world-resident-id-input");
const worldResidentCityInputEl = document.querySelector("#world-resident-city-input");
const worldResidentEmailInputEl = document.querySelector("#world-resident-email-input");
const worldResidentMobileInputEl = document.querySelector("#world-resident-mobile-input");
const worldResidentDeviceInputEl = document.querySelector("#world-resident-device-input");
const worldResidentReasonInputEl = document.querySelector("#world-resident-reason-input");
const appShellEl = document.querySelector(".app");
const topbarEl = document.querySelector(".topbar");
const layoutEl = document.querySelector(".layout");
const guidePanelEl = document.querySelector(".guide-panel");
const governancePanelEl = document.querySelector(".governance");
const authPanelEl = document.querySelector(".auth");
const roomsPanelEl = document.querySelector(".rooms");
const conversationPanelEl = document.querySelector(".conversation");
let chatDetailPanelEl = document.querySelector(".chat-detail");
let chatDetailContentEl = document.querySelector("#chat-detail-content");
let chatDetailSummaryTitleEl =
  document.querySelector("#chat-detail-summary-title") || document.querySelector(".chat-detail-summary-title");
let chatDetailSummaryCopyEl =
  document.querySelector("#chat-detail-summary-copy") || document.querySelector(".chat-detail-summary-copy");
let chatDetailCardShellEl = document.querySelector("#chat-detail-card-shell");
let chatDetailCardKickerEl =
  document.querySelector("#chat-detail-card-kicker") || document.querySelector(".chat-detail-card-kicker");
let chatDetailCardTitleEl =
  document.querySelector("#chat-detail-card-title") || document.querySelector(".chat-detail-card-title");
let chatDetailCardAvatarEl =
  document.querySelector("#chat-detail-card-avatar") || document.querySelector(".chat-detail-card-avatar");
let chatDetailCardMetaEl =
  document.querySelector("#chat-detail-card-meta") || document.querySelector(".chat-detail-card-meta");
let chatDetailCardActionsEl =
  document.querySelector("#chat-detail-card-actions") || document.querySelector(".chat-detail-card-actions");
const guidePanelTitleEl = guidePanelEl?.querySelector(".panel-title");
const governancePanelTitleEl = governancePanelEl?.querySelector(".panel-title");
const authPanelTitleEl = authPanelEl?.querySelector(".panel-title");
const roomsPanelTitleEl = roomsPanelEl?.querySelector(".panel-title");
const conversationPanelTitleEl = conversationPanelEl?.querySelector(".panel-title");

const governanceBrowseBlocks = [
  worldDirectoryListEl?.closest(".governance-block"),
  worldMirrorSourceListEl?.closest(".governance-block"),
  worldSquareListEl?.closest(".governance-block"),
  worldSafetyListEl?.closest(".governance-block"),
  cityListEl?.closest(".governance-block"),
  residentListEl?.closest(".governance-block"),
].filter(Boolean);

const worldActionForms = [cityJoinFormEl, directOpenFormEl, worldReportFormEl].filter(Boolean);
const governanceAdminForms = [
  providerConnectFormEl,
  cityCreateFormEl,
  roomCreateFormEl,
  worldMirrorFormEl,
  worldNoticeFormEl,
  worldTrustFormEl,
  worldAdvisoryFormEl,
  worldReportReviewFormEl,
  worldResidentSanctionFormEl,
].filter(Boolean);

let bootstrap = DEFAULT_BOOTSTRAP;
let state = structuredClone(SAMPLE_STATE);
let shellMode = "unified";
let governance = {
  world: null,
  portability: null,
  cities: [],
  memberships: [],
  public_rooms: [],
  residents: [],
  world_directory: null,
  world_mirror_sources: [],
  world_square: [],
  world_safety: null,
};
let activeRoomId = defaultActiveRoomId(state.rooms);
let gatewayUrl = null;
let refreshTimer = null;
let shellEventSource = null;
let shellRealtimeRestartTimer = null;
let lastShellStateVersion = null;
let senderIdentity = "访客";
let currentWorkspace = "chat";
let roomSearch = "";
let roomFilter = "all";
let chatPaneMode = "split";
let roomReadMarkers = {};
let roomDrafts = {};
let roomSendErrors = {};
let pendingMessageEchoes = {};
let roomQuickActions = {};
let roomQuickStates = {};
let roomQuickStatePreviews = {};
let roomQuickSnapshots = {};
let refreshInProgress = false;
let lastRefreshAtMs = null;
let lastRefreshErrorMessage = "";
let lastForegroundRefreshAtMs = 0;
let isSendingMessage = false;
let followTimelineToLatest = false;
let authSession = {
  challengeId: null,
  maskedEmail: null,
  expiresAtMs: null,
  deliveryMode: null,
};
let sessionToken = null;
let residentLoginDismissed = false;
let provider = {
  mode: "unknown",
  base_url: null,
  connection_state: "Disconnected",
  reachable: false,
};
const CHAT_FOCUS_STORAGE_KEY = "lobster-chat-focus";
let chatFocusPreference = false;
let chatFocusMode = false;
let chatFocusToggleButtonEl = null;
let workspaceNavEl = null;
let workspaceTabs = [];
let roomSearchInputEl = null;
let roomToolbarNoteEl = null;
let roomFilterButtons = [];
let conversationOverviewEl = null;
let conversationCalloutEl = null;
let modeBannerEl = null;
let governanceBriefEl = null;
let roomViewToggleButtonEl = null;
let roomDigestEl = null;
let threadStatusRailEl = null;
let composerStatusEl = null;
let composerHeroEl = null;
let composerContextEl = null;
let composerTipEl = null;
let composerMetaEl = null;
let lastSentMessage = "";
let lastComposerKeyboardSubmitAt = 0;

function currentShellPage() {
  return document.body?.dataset?.shellPage || "hub";
}

function localTimeOfDay(date = new Date()) {
  const hour = date.getHours();
  return hour >= 6 && hour < 18 ? "day" : "night";
}

function applyLocalTimeOfDayState() {
  if (!document.body || document.body.dataset.timeOfDay) return;
  document.body.dataset.timeOfDay = localTimeOfDay();
}

applyLocalTimeOfDayState();

function userShellProjection() {
  return currentShellPage() === "user" || document.body?.dataset?.residentLogin === "enabled";
}

```

## Room scene projection and stage chrome

```js
function userRoomProjection(room, visual) {
  const fallback = shellModeConfig("user");
  if (!room || !visual?.stage) {
    return {
      variant: "idle",
      motif: "idle",
      eyebrow: fallback.eyebrow,
      title: fallback.title,
      hero: fallback.hero,
      detailTitle: "当前房间状态",
      detailCopy: "角色资料会随着会话切换更新，消息输入保持清楚可见。",
    };
  }

  const detailCard = detailCardProfile(room);
  const caretaker = caretakerProfile(room);
  if (visual.stage.variant === "home") {
    return {
      variant: "home",
      motif: visual.stage.visual?.motif || "courtyard",
      eyebrow: "龙虾聊天 · 住宅私聊",
      title: "住宅私聊 / 房内聊天",
      hero: "像回到住处一样继续一对一聊天；场景、角色和输入都围着当前房间走。",
      detailTitle: detailCard?.summary_title || "住宅私聊 / 房内状态",
      detailCopy: detailCard?.summary_copy || (caretaker
        ? `${caretaker.name} 会帮你记住留言和提醒，适合续聊、记任务和直接追问。`
        : "适合续聊、记任务和直接追问，右栏保留角色资料与输入。"),
    };
  }

  return {
    variant: "city",
    motif: visual.stage.visual?.motif || "watchtower",
    eyebrow: "龙虾聊天 · 公共频道",
    title: "公共频道 / 群聊现场",
    hero: "像走进公共频道一样继续聊天；公告、巡视和跨城讨论都围着当前窗口展开。",
    detailTitle: detailCard?.summary_title || "公共频道 / 当前状态",
    detailCopy: detailCard?.summary_copy || (caretaker
      ? `${caretaker.name} 会盯住公共提醒和巡视结果，适合看公告、围观和跨城讨论。`
      : "适合看公告、围观和跨城讨论，右栏保留频道状态与快捷动作。"),
  };
}

function syncUserRoomProjection(room, visual) {
  if (currentShellPage() !== "user") return;
  const projection = userRoomProjection(room, visual);

  setDatasetFlag(document.body, "roomVariant", projection.variant);
  setDatasetFlag(document.body, "roomMotif", projection.motif);
  setDatasetFlag(appShellEl, "roomVariant", projection.variant);
  setDatasetFlag(appShellEl, "roomMotif", projection.motif);
  setDatasetFlag(roomsPanelEl, "roomVariant", projection.variant);
  setDatasetFlag(roomsPanelEl, "roomMotif", projection.motif);
  setDatasetFlag(conversationPanelEl, "roomVariant", projection.variant);
  setDatasetFlag(conversationPanelEl, "roomMotif", projection.motif);
  setDatasetFlag(chatDetailPanelEl, "roomVariant", projection.variant);
  setDatasetFlag(chatDetailPanelEl, "roomMotif", projection.motif);
  setDatasetFlag(roomStageSideEl, "roomVariant", projection.variant);
  setDatasetFlag(roomStageSideEl, "roomMotif", projection.motif);

  if (mastheadEyebrowEl) {
    mastheadEyebrowEl.textContent = projection.eyebrow;
  }
  if (mastheadTitleEl) {
    mastheadTitleEl.textContent = projection.title;
  }
  if (heroNoteEl) {
    heroNoteEl.textContent = projection.hero;
  }
  if (chatDetailSummaryTitleEl) {
    chatDetailSummaryTitleEl.textContent = projection.detailTitle;
  }
  if (chatDetailSummaryCopyEl) {
    chatDetailSummaryCopyEl.textContent = projection.detailCopy;
  }
  syncUserDetailCard(room, visual, projection);
}

function userDetailCardProjection(room, visual, projection) {
  if (!room || !visual?.stage) {
    return {
      variant: "idle",
      motif: "idle",
      kicker: "角色卡",
      title: "当前房间角色卡",
      monogram: "房",
      meta: [{ label: "状态", value: "等待打开一个会话" }],
      actions: [],
    };
  }

  const detailCard = detailCardProfile(room);
  const caretaker = caretakerProfile(room);
  const monogram = visual.portrait?.visual?.monogram || (projection?.variant === "city" ? "巡" : "房");
  const status = caretaker?.status || roomChatStatusSummary(room);
  if (detailCard) {
    return {
      variant: projection?.variant || (visual.stage.variant === "home" ? "home" : "city"),
      motif: projection?.motif || (visual.stage.visual?.motif || "watchtower"),
      kicker: detailCard.kicker || (projection?.variant === "city" ? "公共频道 / 角色卡" : "住宅私聊 / 角色卡"),
      title: detailCard.title || "当前房间角色卡",
      monogram: detailCard.monogram || monogram,
      meta: Array.isArray(detailCard.meta) && detailCard.meta.length
        ? detailCard.meta
        : [{ label: "状态", value: status }],
      actions: Array.isArray(detailCard.actions) ? detailCard.actions : [],
    };
  }
  if (projection?.variant === "city") {
    return {
      variant: "city",
      motif: projection.motif,
      kicker: "公共频道 / 角色卡",
      title: caretaker ? `${caretaker.name} / 频道状态` : "公共频道 / 当前状态",
      monogram,
      meta: [
        { label: "角色", value: caretaker?.role_label || "公共频道向导" },
        { label: "称号", value: caretaker?.name || room.thread_headline || room.title || "未知会话" },
        { label: "当前", value: roomAudienceLabel(room) },
        { label: "状态", value: status },
      ],
      actions: ["私聊", "委托", "交易"],
    };
  }

  return {
    variant: "home",
    motif: projection?.motif || "courtyard",
    kicker: "住宅私聊 / 角色卡",
    title: caretaker ? `${caretaker.name} / 房内状态` : "住宅私聊 / 房内状态",
    monogram,
    meta: [
      { label: "住户", value: currentIdentity() || "当前住户" },
      { label: "同住AI", value: caretaker?.name || roomDisplayPeer(room) },
      { label: "当前", value: roomAudienceLabel(room) },
      { label: "状态", value: status },
    ],
    actions: ["续聊", "整理", "留条"],
  };
}

function createChatDetailCardMetaRow(label, value) {
  const row = document.createElement("div");
  row.className = "chat-detail-card-meta-row";
  row.appendChild(createLine("chat-detail-card-meta-label", label));
  row.appendChild(createLine("chat-detail-card-meta-value", value));
  return row;
}

function seedComposerFromQuickAction(action, template = quickActionTemplate(action), options = {}) {
  if (!composerInputEl || composerInputEl.disabled || !activeRoomId) return;
  const previousAction = roomQuickAction(activeRoomId);
  const previousTemplate = quickActionTemplate(previousAction);
  const nextTemplate = template;
  const currentValue = composerInputEl.value.trim();
  const shouldSeed = options.force === true || !currentValue || currentValue === previousTemplate.trim();
  setRoomQuickAction(activeRoomId, action);
  if (shouldSeed) {
    composerInputEl.value = nextTemplate;
    composerInputEl.dispatchEvent(new Event("input", { bubbles: true }));
  } else {
    updateComposerState();
    renderConversationOverview();
  }
  focusComposerInput({ force: true });
}

function syncUserDetailCard(room, visual, projection) {
  if (currentShellPage() !== "user") return;
  const card = userDetailCardProjection(room, visual, projection);
  const quickAction = latestRoomQuickAction(room);
  const quickState = latestRoomQuickState(room);
  const preview = resolveRoomQuickPreview(room, quickAction);
  const previewState = preview?.state || "";
  const previewSnapshotIndex = preview?.snapshotIndex ?? null;
  const previewHistory = preview?.history || [];
  const previewStructured = preview?.structured || null;

  setDatasetFlag(chatDetailCardShellEl, "roomVariant", card.variant);
  setDatasetFlag(chatDetailCardShellEl, "roomMotif", card.motif);
  setDatasetFlag(chatDetailCardActionsEl, "roomVariant", card.variant);
  setDatasetFlag(chatDetailCardActionsEl, "roomMotif", card.motif);
  setDatasetFlag(chatDetailCardAvatarEl, "roomVariant", card.variant);
  setDatasetFlag(chatDetailCardAvatarEl, "monogram", card.monogram);

  if (chatDetailCardKickerEl) {
    chatDetailCardKickerEl.textContent = card.kicker;
  }
  if (chatDetailCardTitleEl) {
    chatDetailCardTitleEl.textContent = card.title;
  }
  if (chatDetailCardAvatarEl) {
    chatDetailCardAvatarEl.textContent = card.monogram;
  }
  if (chatDetailCardMetaEl) {
    clearChildren(chatDetailCardMetaEl);
    for (const item of card.meta) {
      chatDetailCardMetaEl.appendChild(createChatDetailCardMetaRow(item.label, item.value));
    }
  }
  if (chatDetailCardShellEl) {
    for (const node of Array.from(chatDetailCardShellEl.querySelectorAll(".chat-detail-card-workflow"))) {
      node.remove();
    }
    for (const node of Array.from(chatDetailCardShellEl.querySelectorAll(".chat-detail-card-preview"))) {
      node.remove();
    }
    const workflow = createWorkflowProgress(quickAction, quickState, {
      className: "chat-detail-card-workflow",
      title: quickAction ? `${quickAction}阶段` : "",
      stages: workflowProfile(room)?.steps,
      onStageClick: (stage) => {
        previewRoomQuickStage(room?.id || activeRoomId, quickAction, stage.label);
        seedComposerFromQuickAction(quickAction, quickActionWorkflowTemplate(quickAction, stage.label), { force: true });
      },
    });
    if (workflow) {
      if (chatDetailCardActionsEl?.parentNode === chatDetailCardShellEl) {
        chatDetailCardShellEl.insertBefore(workflow, chatDetailCardActionsEl);
      } else {
        chatDetailCardShellEl.appendChild(workflow);
      }
    }
    const previewCard = createQuickActionPreviewCard(quickAction, previewState, previewStructured, {
      className: "chat-detail-card-preview",
      maxFields: 2,
      roomId: room?.id || activeRoomId,
      historyLabel: preview?.historyLabel || "",
      fieldView: roomQuickPreviewCardFieldView(
        room?.id || activeRoomId,
        quickAction,
        previewState,
        previewSnapshotIndex,
      ),
      history: previewHistory,
      selectedHistoryIndex: previewSnapshotIndex,
      onHistoryClick: (_snapshot, index) => {
        previewRoomQuickStage(room?.id || activeRoomId, quickAction, previewState, index);
      },
      onFieldViewChange: (viewId) => {
        setRoomQuickPreviewCardFieldView(
          room?.id || activeRoomId,
          quickAction,
          previewState,
          previewSnapshotIndex,
          viewId,
        );
      },
    });
    if (previewCard) {
      if (chatDetailCardActionsEl?.parentNode === chatDetailCardShellEl) {
        chatDetailCardShellEl.insertBefore(previewCard, chatDetailCardActionsEl);
      } else {
        chatDetailCardShellEl.appendChild(previewCard);
      }
    }
  }
  if (chatDetailCardActionsEl) {
    clearChildren(chatDetailCardActionsEl);
    for (const action of card.actions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chat-detail-card-action";
      button.dataset.cardAction = action;
      button.setAttribute("aria-pressed", "false");
      button.textContent = action;
      button.addEventListener("click", () => {
        seedComposerFromQuickAction(action);
      });
      chatDetailCardActionsEl.appendChild(button);
    }
    appendRoomQuickActionOverviewButton(chatDetailCardActionsEl, room, {
      className: "chat-detail-card-action chat-detail-card-action-workflow",
      dataset: { cardWorkflowAction: "true" },
    });
    appendRoomQuickStateAdvanceButton(chatDetailCardActionsEl, room, {
      className: "chat-detail-card-action chat-detail-card-action-advance",
      dataset: { cardStateAdvance: "true" },
    });
    syncUserQuickActionButtons(room?.id || activeRoomId);
  }
}

function createStageChip(text, tone = "muted") {
  const chip = document.createElement("div");
  chip.className = "stage-chip";
  chip.dataset.tone = tone;
  chip.textContent = text;
  return chip;
}

function setInlineStyle(node, property, value, important = false) {
  if (!node?.style) return;
  if (typeof node.style.setProperty === "function") {
    node.style.setProperty(property, value, important ? "important" : "");
    return;
  }
  const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  node.style[camelProperty] = value;
}

function ensureUserSceneChrome() {
  if (currentShellPage() !== "user") return;

  if (conversationStageEl && (!roomStageSideEl || !roomStageSideEl.isConnected)) {
    roomStageSideEl = document.createElement("div");
    roomStageSideEl.className = "conversation-stage-side";
    setInlineStyle(roomStageSideEl, "display", "flex", true);
    setInlineStyle(roomStageSideEl, "flex-direction", "column");
    setInlineStyle(roomStageSideEl, "align-items", "flex-start");
    setInlineStyle(roomStageSideEl, "gap", "8px");
    roomStageSideEl.setAttribute("aria-label", "房间角色资料");
    const sideAnchor = conversationStageCopyEl || conversationStageEl.firstChild || null;
    if (sideAnchor && sideAnchor.parentNode === conversationStageEl) {
      sideAnchor.insertAdjacentElement("afterend", roomStageSideEl);
    } else {
      conversationStageEl.appendChild(roomStageSideEl);
    }
  }

  if (roomStageSideEl && (!roomStagePortraitCanvasEl || !roomStagePortraitCanvasEl.isConnected)) {
    roomStagePortraitCanvasWrapEl = document.createElement("div");
    roomStagePortraitCanvasWrapEl.className = "conversation-stage-canvas-wrap";
    roomStagePortraitCanvasEl = document.createElement("canvas");
    roomStagePortraitCanvasEl.id = "room-stage-portrait-canvas";
    roomStagePortraitCanvasEl.className = "conversation-stage-canvas";
    roomStagePortraitCanvasEl.setAttribute("aria-label", "房间角色资料画布");
    roomStagePortraitCanvasWrapEl.appendChild(roomStagePortraitCanvasEl);
    roomStageSideEl.appendChild(roomStagePortraitCanvasWrapEl);
  }

  if (conversationStageCopyEl && (!roomStageCanvasEl || !roomStageCanvasEl.isConnected)) {
    roomStageCanvasWrapEl = document.createElement("div");
    roomStageCanvasWrapEl.className = "conversation-stage-canvas-wrap";
    roomStageCanvasEl = document.createElement("canvas");
    roomStageCanvasEl.id = "room-stage-canvas";
    roomStageCanvasEl.className = "conversation-stage-canvas";
    roomStageCanvasEl.setAttribute("aria-label", "房间场景文字画布");
    roomStageCanvasWrapEl.appendChild(roomStageCanvasEl);
    const noteAnchor = roomStageNoteEl?.isConnected ? roomStageNoteEl : null;
    if (noteAnchor) {
      noteAnchor.insertAdjacentElement("beforebegin", roomStageCanvasWrapEl);
    } else {
      conversationStageCopyEl.appendChild(roomStageCanvasWrapEl);
    }
  }

  if (!chatDetailPanelEl || !chatDetailPanelEl.isConnected) {
    chatDetailPanelEl = document.createElement("section");
    chatDetailPanelEl.className = "panel chat-detail";
    setInlineStyle(chatDetailPanelEl, "display", "block", true);
    setInlineStyle(chatDetailPanelEl, "grid-column", "1 / -1", true);
    const title = document.createElement("div");
    title.className = "panel-title";
    title.textContent = "房间资料";
    chatDetailContentEl = document.createElement("div");
    chatDetailContentEl.id = "chat-detail-content";
    chatDetailContentEl.className = "chat-detail-content";
    chatDetailPanelEl.append(title, chatDetailContentEl);
    if (conversationPanelEl?.parentNode === layoutEl) {
      conversationPanelEl.insertAdjacentElement("afterend", chatDetailPanelEl);
    } else {
      layoutEl?.appendChild(chatDetailPanelEl);
    }
  } else {
    setInlineStyle(chatDetailPanelEl, "display", "block", true);
    setInlineStyle(chatDetailPanelEl, "grid-column", "1 / -1", true);
  }
}

function renderRoomStagePortrait(room) {
  if (!roomStageSideEl) return;
  if (roomStagePortraitCanvasWrapEl && roomStagePortraitCanvasWrapEl.parentNode !== roomStageSideEl) {
    roomStageSideEl.prepend(roomStagePortraitCanvasWrapEl);
  }

  const nodes = Array.from(roomStageSideEl.children);
  for (const node of nodes) {
    if (node !== roomStagePortraitCanvasWrapEl) {
      node.remove();
    }
  }

  const visual = buildRoomVisualModel(
    room,
    roomStageSummary(room),
    {
      title: portraitProjection(room)?.title || caretakerProfile(room)?.name || room?.participant_label || "人物",
      summary: roomStagePortraitSummary(room),
    },
  );
  renderPortraitCanvas(roomStagePortraitCanvasEl, visual.portrait);

  roomStageSideEl.appendChild(createStageChip("角色资料", "accent"));

  const lead = document.createElement("div");
  lead.className = "stage-chip";
  lead.textContent = visual.portrait.summary;
  roomStageSideEl.appendChild(lead);

  for (const chip of roomStagePortraitChips(room)) {
    roomStageSideEl.appendChild(createStageChip(chip.text, chip.tone));
  }
}

const sidebarStackEl = document.querySelector(".sidebar-stack");
let caretakerPanelEl = null;
let caretakerStatusEl = null;
const CARETAKER_PROFILE = {
  displayName: "OpenClaw 小狗管家",
  status: "巡检中 · 3/5 例行巡视",

```

## Utility, auth status, and composer binding

```js
function toggleElements(elements, hidden) {
  for (const element of elements) {
    element.classList.toggle("surface-hidden", hidden);
  }
}

function applyWorkspace() {
  ensureWorkspaceChrome();
  document.body.dataset.workspace = currentWorkspace;
  syncChatFocusWithWorkspace();
  document.body.dataset.chatPane = currentWorkspace === "chat" ? chatPaneMode : "split";
  const shellPage = currentShellPage();
  const isUserShell = shellPage === "user";
  const isAdminShell = shellPage === "admin";
  const inlineChatDetail = currentWorkspace === "chat" && isUserShell;
  const showChatGovernanceRail = currentWorkspace === "governance";
  document.body.dataset.chatDetailMode = inlineChatDetail ? "inline" : "sidebar";
  document.body.dataset.workspaceFocus = currentWorkspace === "chat" ? "chat" : currentWorkspace;
  layoutEl?.classList.toggle("layout-single", currentWorkspace !== "chat");
  layoutEl?.classList.toggle("layout-chat", currentWorkspace === "chat");
  layoutEl?.classList.toggle("layout-chat-inline-detail", inlineChatDetail);
  document.body.classList.toggle("chat-primary", currentWorkspace === "chat");

  for (const button of workspaceTabs) {
    const isActive = button.dataset.workspace === currentWorkspace;
    button.classList.toggle("active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  }

  const worldView = currentWorkspace === "world";
  const governanceView = currentWorkspace === "governance";
  const userEdgeDrawerVisible = currentShellPage() === "user";

  guidePanelEl?.classList.toggle("surface-hidden", currentWorkspace === "chat" && !isAdminShell);
  governancePanelEl?.classList.toggle(
    "surface-hidden",
    !(userEdgeDrawerVisible || worldView || governanceView || showChatGovernanceRail),
  );
  caretakerPanelEl?.classList.toggle(
    "surface-hidden",
    currentShellPage() === "user" || currentWorkspace !== "chat",
  );
  authPanelEl?.classList.toggle("surface-hidden", currentWorkspace !== "auth");
  roomsPanelEl?.classList.toggle("surface-hidden", currentWorkspace !== "chat");
  conversationPanelEl?.classList.toggle("surface-hidden", currentWorkspace !== "chat");
  chatDetailPanelEl?.classList.toggle("surface-hidden", currentWorkspace !== "chat" || inlineChatDetail);
  roomViewToggleButtonEl?.classList.toggle("surface-hidden", currentWorkspace !== "chat");

  toggleElements(governanceBrowseBlocks, !(worldView || governanceView || showChatGovernanceRail));
  toggleElements(worldActionForms, !(worldView || showChatGovernanceRail));
  toggleElements(governanceAdminForms, !(governanceView || showChatGovernanceRail));

  ensureChatFocusToggle();
  ensureChatPriorityBadge();
  ensureChatQuickLinks();
  updateChatQuickLinksVisibility();
  ensureRoomQuickActions();
  updatePanelTitles();
  ensureConversationCallout();
  updateConversationCallout();
  ensureModeBanner();
  updateModeBanner();
  ensureChatPaneToggle();
}

function updatePanelTitles() {
  if (guidePanelTitleEl) {
    guidePanelTitleEl.textContent =
      currentWorkspace === "chat" ? "聊天提示" : "如何开始";
  }
  if (governancePanelTitleEl) {
    governancePanelTitleEl.textContent = shellMode === "user" ? "边缘抽屉" : "更多";
  }
  if (authPanelTitleEl) {
    authPanelTitleEl.textContent = shellMode === "admin" ? "身份" : "登录";
  }
  if (roomsPanelTitleEl) {
    roomsPanelTitleEl.textContent = shellMode === "user" ? "房间列表" : "会话";
  }
  if (conversationPanelTitleEl) {
    conversationPanelTitleEl.textContent = shellMode === "user" ? "消息流" : "消息";
  }
}

function setWorkspace(workspace, { persist = true } = {}) {
  const allowed = availableWorkspacesForShellMode(shellMode);
  currentWorkspace = allowed.includes(workspace)
    ? workspace
    : defaultWorkspaceForShellMode(shellMode);
  if (persist) {
    safeLocalStorageSet(workspaceStorageKey(), currentWorkspace);
  }
  applyWorkspace();
}

function queryGatewayUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("gateway");
}

function currentIdentity() {
  return senderIdentity.trim() || "访客";
}

function isVisitorIdentity(value = currentIdentity()) {
  const normalized = String(value || "").trim();
  return !normalized || normalized === "访客";
}

function residentGatewayLoginRequired() {
  return Boolean(userShellProjection() && gatewayUrl && isVisitorIdentity());
}

function residentScopedShellStatePage(shellPage = currentShellPage()) {
  return shellPage === "user" || shellPage === "hub" || shellPage === "admin";
}

function gatewayShellStateUrl() {
  const url = new URL(`${gatewayUrl}/v1/shell/state`);
  if (residentScopedShellStatePage()) {
    url.searchParams.set("resident_id", currentIdentity());
  }
  return url.toString();
}

function gatewayShellEventsUrl({ afterVersion = null } = {}) {
  const url = new URL(`${gatewayUrl}/v1/shell/events`);
  if (residentScopedShellStatePage()) {
    url.searchParams.set("resident_id", currentIdentity());
  }
  if (afterVersion) {
    url.searchParams.set("after", afterVersion);
    url.searchParams.set("wait_ms", "4000");
  }
  return url.toString();
}

function currentDesiredResidentId() {
  const value = authResidentInputEl?.value?.trim() || identityInputEl?.value?.trim();
  return value || undefined;
}

function setGovernanceStatus(message, isError = false) {
  if (!governanceStatusEl) {
    if (worldStateEl) {
      worldStateEl.textContent = `${isError ? "提示异常" : "提示"}：${message}`;
      worldStateEl.classList.toggle("notice-pending", isError);
    }
    return;
  }
  governanceStatusEl.textContent = `${shellMode === "user" ? "边缘抽屉提示" : "侧栏提示"}：${message}`;
  governanceStatusEl.classList.toggle("notice-pending", isError);
}

function setAuthStatus(message, isError = false) {
  if (!authStatusEl) return;
  authStatusEl.textContent = `登录状态：${message}`;
  authStatusEl.classList.toggle("notice-pending", isError);
}

function updateResidentLoginSurface() {
  if (!residentLoginCardEl) return;
  const needsLogin = Boolean(userShellProjection() && gatewayUrl && isVisitorIdentity());
  const showOverlay = needsLogin && !residentLoginDismissed;

  residentLoginCardEl.classList.toggle("shell-hidden", !needsLogin);
  residentLoginCardEl.dataset.loginState = needsLogin ? "visitor" : "signed-in";

  if (residentLoginOverlayEl) {
    residentLoginOverlayEl.classList.toggle("shell-hidden", !showOverlay);
    residentLoginOverlayEl.setAttribute("aria-hidden", !showOverlay ? "true" : "false");
  }

  if (hudLoginToggleEl) {
    hudLoginToggleEl.classList.toggle("shell-hidden", !(needsLogin && residentLoginDismissed));
  }

  if (needsLogin && authStatusEl && !authSession.challengeId) {
    setAuthStatus("访客模式 · 请登录后发送");
  }
}

function clearChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}


```

## Message body and room display helpers

```js
function createMessageBodyNode(message, options = {}) {
  const structured = parseStructuredQuickActionMessage(message);
  const action = typeof message?.quick_action === "string" ? message.quick_action.trim() : "";
  const quickState = typeof options.quickState === "string" ? options.quickState : "";
  const body = document.createElement("div");
  body.className = structured ? "message-body message-body-structured" : "message-body";
  if (action) {
    body.dataset.quickAction = action;
    body.dataset.actionIntensity = quickActionIntensity(action);
  }
  if (message?.is_recalled) {
    body.classList.add("message-body-recalled");
    body.textContent = "消息已撤回";
    return body;
  }
  if (!structured) {
    body.textContent = message.text;
    return body;
  }

  const sheet = document.createElement("div");
  sheet.className = "message-quick-sheet";

  for (const field of structured.fields) {
    const row = document.createElement("div");
    row.className = "message-quick-sheet-row";

    const label = document.createElement("span");
    label.className = "message-quick-sheet-label";
    label.textContent = field.label;

    const value = document.createElement("span");
    value.className = "message-quick-sheet-value";
    value.textContent = field.value;

    row.appendChild(label);
    row.appendChild(value);
    sheet.appendChild(row);
  }

  if (structured.notes.length) {
    const notes = document.createElement("div");
    notes.className = "message-quick-sheet-notes";
    notes.textContent = structured.notes.join("\n");
    sheet.appendChild(notes);
  }

  const followUpLabel = quickActionFollowUpLabel(action, quickState);
  const followUpCopy = quickActionFollowUpCopy(action, quickState);
  if (followUpLabel && followUpCopy) {
    const followUp = document.createElement("div");
    followUp.className = "message-quick-sheet-follow-up";
    const label = document.createElement("span");
    label.className = "message-quick-sheet-follow-up-label";
    label.textContent = followUpLabel;
    const copy = document.createElement("span");
    copy.className = "message-quick-sheet-follow-up-copy";
    copy.textContent = followUpCopy;
    followUp.appendChild(label);
    followUp.appendChild(copy);
    sheet.appendChild(followUp);
  }

  body.appendChild(sheet);
  return body;
}

function roomDisplayPeer(room) {
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
  const parts = (room.id || "")
    .split(":")
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts[0] === "dm") {
    return parts.find((item) => item !== "dm" && item !== currentIdentity()) || "私聊对象";
  }
  return room.subtitle || "私聊对象";
}

function roomMemberCount(room) {
  const explicit = Number(room?.member_count);
  if (Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }
  const publicRoom = publicRoomRecordForConversation(room?.id);
  if (publicRoom) {
    const activeResidents = governance.memberships.filter(
      (item) => item.city_id === publicRoom.city_id && item.state === "Active",
    ).length;
    if (activeResidents > 0) {
      return activeResidents;
    }
  }
  const participants = new Set((room?.messages || []).map((message) => message.sender).filter(Boolean));
  if (currentIdentity()) {
    participants.add(currentIdentity());
  }
  if (participants.size > 0) {
    return participants.size;
  }
  return roomKind(room) === "direct" ? 2 : 1;
}

function roomAudienceLabel(room) {
  if (!room) return "未选会话";
  const kind = roomKind(room);
  if (kind === "direct") {
    return room.participant_label || `你与 ${roomDisplayPeer(room)}`;
  }
  if (kind === "public") {
    const publicRoom = publicRoomRecordForConversation(room.id);
    const cityProfile = cityStateForConversation(room.id)?.profile || worldDirectoryCity(publicRoom?.city_id);
    if (publicRoom) {

```

## Avatar, message role, composer state

```js
function messageAvatarTone(message, room, isSelf) {
  if (isSelf) return "self";
  if (isSystemSender(message?.sender)) return "system";
  if (caretakerProfile(room) && message?.sender === caretakerProfile(room).name) return "caretaker";
  return roomKind(room) === "direct" ? "direct" : "room";
}

function isSystemSender(sender) {
  const normalized = String(sender || "").trim().toLowerCase();
  return normalized === "system" || normalized === "sys" || normalized === "系统" || normalized === "系统消息";
}

function messageThreadKind(message, room, isSelf) {
  if (isSelf) return "self";
  if (isSystemSender(message?.sender)) return "system";
  if (caretakerProfile(room) && message?.sender === caretakerProfile(room).name) {
    return "caretaker";
  }
  return roomKind(room) === "direct" ? "direct" : "room";
}

function messageRoleLabel(message, room, isSelf) {
  const shellPage = currentShellPage();
  if (isSelf) {
    return shellPage === "admin" ? "后台记录" : "你";
  }
  if (isSystemSender(message?.sender)) return "系统";
  if (caretakerProfile(room) && message?.sender === caretakerProfile(room).name) return "管家";
  return roomKind(room) === "direct" ? "对方" : "群聊";
}

function roomGroupBlueprints(shellPage, rooms) {
  const rankRoom = (room) =>
    (room.id === activeRoomId ? 100 : 0) +
    (roomSendErrors[room.id] ? 24 : 0) +
    (roomHasDraft(room.id) ? 12 : 0) +
    Math.min(unreadCount(room), 8);
  const sortRooms = (items) => [...items].sort((left, right) => rankRoom(right) - rankRoom(left));
  const directRooms = sortRooms(rooms.filter((room) => roomKind(room) === "direct"));
  const publicRooms = sortRooms(rooms.filter((room) => roomKind(room) === "public"));
  const systemRooms = sortRooms(rooms.filter((room) => roomKind(room) === "system"));

  if (shellPage === "admin") {
    return [
      {
        kind: "direct",
        title: "待跟进会话",
        hint: "优先处理访客提醒、未发草稿和追问",
        rooms: directRooms,
      },
      {
        kind: "public",
        title: "后台频道",
        hint: "城市群聊、公告窗和巡检频道",
        rooms: publicRooms,
      },
      {
        kind: "system",
        title: "系统提示",
        hint: "同步状态、导出结果和错误提示",
        rooms: systemRooms,
      },
    ].filter((group) => group.rooms.length > 0);
  }

  if (shellPage === "user") {
    return [
      {
        kind: "direct",
        title: "居民私信",
        hint: "一对一聊天和小窗续聊",
        rooms: directRooms,
      },
      {
        kind: "public",
        title: "城镇频道",
        hint: "公共房间、广场和多人聊天",
        rooms: publicRooms,
      },
      {
        kind: "system",
        title: "城门消息",
        hint: "同步提醒和系统消息",
        rooms: systemRooms,
      },
    ].filter((group) => group.rooms.length > 0);
  }

  return [
    {
      kind: "direct",
      title: "私信",
      hint: "一对一聊天",
      rooms: directRooms,
    },
    {
      kind: "public",
      title: "频道",
      hint: "公共房间和城市广场",
      rooms: publicRooms,
    },
    {
      kind: "system",
      title: "通知",
      hint: "同步状态和系统提示",
      rooms: systemRooms,
    },
  ].filter((group) => group.rooms.length > 0);
}

function roomSyncLabel() {
  if (refreshInProgress) return "同步中";
  if (!lastRefreshAtMs) return gatewayUrl ? "尚未同步" : "离线";
  return `最近同步 ${new Date(lastRefreshAtMs).toLocaleTimeString()}`;
}

function composerStatusState() {
  const shellPage = currentShellPage();
  if (residentGatewayLoginRequired()) {
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
      text: gatewayUrl ? baseCopy : `连接网关后可继续${shellPage === "admin" ? "记录" : "聊天"}；${baseCopy}`,
    };
  }
  const draft = draftForRoom(activeRoomId);
  const sendError = roomSendErrors[activeRoomId];
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
  if (draft.trim()) {
    const quickAction = roomQuickAction(activeRoomId);
    return {
      tone: "accent",
      text: quickActionDraftStatusCopy(quickAction, draft.trim().length) || `草稿已暂存 · ${draft.trim().length} 字`,
    };
  }
  return {
    tone: "muted",
    text: gatewayUrl
      ? `${roomSyncLabel()} · 当前输入会直接发到这个会话。`
      : "离线预览态，草稿会保留。",
  };
}

function roomMatchesSearch(room, query) {
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
    room.scene_summary,
    room.detail_card?.summary_title,
    room.detail_card?.summary_copy,
    room.detail_card?.kicker,
    room.detail_card?.title,
    room.workflow?.action,
    room.workflow?.state,
    room.workflow?.title,
    room.workflow?.summary,
    room.stage_projection?.title,
    room.stage_projection?.summary,
    room.stage_projection?.badge,
    room.portrait_projection?.title,
    room.portrait_projection?.summary,
    room.portrait_projection?.badge,
    room.portrait_projection?.status,
    roomAudienceLabel(room),
    roomRouteLabel(room),
    roomSummaryLine(room),
    roomStatusLine(room),
    roomThreadHeadline(room),
    roomChatStatusSummary(room),
    roomQueueSummary(room),
    roomOverviewSummary(room),
    roomContextSummary(room),
    ...detailMeta,
    ...workflowSteps,
    ...inlineActions,
    roomPreview(room),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function filteredRooms() {
  return state.rooms.filter((room) => {
    if (roomFilter === "direct" && roomKind(room) !== "direct") {
      return false;
    }
    if (roomFilter === "public" && roomKind(room) !== "public") {
      return false;
    }
    return roomMatchesSearch(room, roomSearch);
  });
}

function updateRoomToolbarState() {
  const shellPage = currentShellPage();
  for (const button of roomFilterButtons) {
    if (button.dataset.roomFilter === "all") {
      button.textContent = shellPage === "admin" ? "全部会话" : "全部";
    } else if (button.dataset.roomFilter === "direct") {
      button.textContent = "私信";
    } else if (button.dataset.roomFilter === "public") {
      button.textContent = "群聊";
    }
    button.classList.toggle("active", button.dataset.roomFilter === roomFilter);
  }
  if (roomSearchInputEl) {
    roomSearchInputEl.placeholder =
      shellPage === "admin"
        ? "搜索会话、频道、访客提醒或最近消息"
        : "搜索会话、私信、群聊或最近消息";
  }
  if (roomSearchInputEl && roomSearchInputEl.value.toLowerCase() !== roomSearch) {
    roomSearchInputEl.value = roomSearch;
  }
}

function focusRoom(roomId) {

```

## Focus room and room list render

```js
function focusRoom(roomId) {
  if (activeRoomId && activeRoomId !== roomId && timelineEl) {
    timelineEl.setAttribute("data-switching", "true");
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (timelineEl) timelineEl.removeAttribute("data-switching");
      }, 160);
    });
  }
  activeRoomId = roomId;
  roomSearch = "";
  roomFilter = "all";
  followTimelineToLatest = true;
  syncComposerDraft({ force: true });
  syncChatPaneMode(window.matchMedia("(max-width: 960px)").matches ? "thread" : "split");
  markRoomRead(roomId);
  updateRoomToolbarState();
  setWorkspace("chat");
  updateCaretakerStatus();
  renderConversationOverview();
  updateComposerState();
  focusComposerInput({ force: true });
  // Close mobile drawers after selecting a room
  railDrawerEl?.classList.remove("open");
  sfcRailEl?.classList.remove("open");
}

function formatDateTime(timestampMs) {
  return new Date(timestampMs).toLocaleString();
}

function joinOrFallback(items, fallback) {
  return items && items.length ? items.join("、") : fallback;
}

function localPreviewMessagesForEmptyRoom(room) {
  if (!room || gatewayUrl || currentShellPage() !== "hub") return [];
  if (document.body?.dataset?.shellVariant !== "creative-terminal") return [];
  if (roomKind(room) !== "direct") return [];
  return [
    {
      sender: "rsaga",
      timestamp: "10:14",
      text: "这里按住宅私聊显示，对方消息在左边，自己的回复在右边。",
    },
    {
      sender: currentIdentity(),
      timestamp: "10:15",
      text: "收到。住宅页保留房间画面，文字对话层可以点击空白临时清屏。",
    },
    {
      sender: "rsaga",
      timestamp: "10:16",
      text: "楼梯热点通往主城，热点只显示小标签，不再盖住场景。",
    },
  ];
}

function actorIsWorldSteward() {
  const stewards = governance.world_safety?.stewards || [];
  return stewards.includes(currentIdentity());
}

function membershipForCity(cityId) {
  return governance.memberships.find(
    (membership) =>
      membership.city_id === cityId && membership.resident_id === currentIdentity(),
  );
}

function publicRoomsForCity(cityId) {
  return governance.public_rooms.filter((room) => room.city_id === cityId);
}

function publicRoomRecordForConversation(roomId) {
  return governance.public_rooms.find((room) => room.room_id === roomId) || null;
}

function cityStateForConversation(roomId) {
  const room = publicRoomRecordForConversation(roomId);
  if (!room) return null;
  return governance.cities.find((item) => item.profile.city_id === room.city_id) || null;
}

function worldDirectoryCity(cityId) {
  return governance.world_directory?.cities?.find((city) => city.city_id === cityId) || null;
}

function humanMembership(membership) {
  if (!membership) return "尚未入城";
  return `${translateRole(membership.role)} · ${translateMembershipState(membership.state)}`;
}

function hasConversationShellPayload(payload) {
  return Array.isArray(payload?.conversation_shell?.conversations) &&
    payload.conversation_shell.conversations.length > 0;
}

function hasAnyShellPayload(payload) {
  return (Array.isArray(payload?.rooms) && payload.rooms.length > 0) || hasConversationShellPayload(payload);
}

function normalizeShellMessages(messages) {
  return (messages || []).map((message) => ({
    ...message,
    timestamp:
      message.timestamp ||
      message.timestamp_label ||
      (typeof message.timestamp_ms === "number"
        ? new Date(message.timestamp_ms).toLocaleTimeString()
        : "刚刚"),
  }));
}

function contractConversationMap(payload) {
  const scenes = new Map(
    (payload?.scene_render?.scenes || []).map((scene) => [scene.conversation_id, scene]),
  );
  return new Map(
    (payload?.conversation_shell?.conversations || []).map((conversation) => {
      const scene = scenes.get(conversation.conversation_id) || {};
      return [
        conversation.conversation_id,
        {
          id: conversation.conversation_id,
          title: conversation.title || conversation.conversation_id,
          subtitle: conversation.subtitle || "",
          meta: conversation.meta || "",
          kind_hint: conversation.kind_hint || null,
          participant_label: conversation.participant_label || null,
          route_label: conversation.route_label || null,
          list_summary: conversation.list_summary || null,
          status_line: conversation.status_line || null,
          thread_headline: conversation.thread_headline || null,
          chat_status_summary: conversation.chat_status_summary || null,
          queue_summary: conversation.queue_summary || null,
          preview_text: conversation.preview_text || null,
          last_activity_label: conversation.last_activity_label || null,
          activity_time_label: conversation.activity_time_label || null,
          overview_summary: conversation.overview_summary || null,
          context_summary: conversation.context_summary || null,
          member_count: conversation.member_count ?? null,
          caretaker: conversation.caretaker || null,
          detail_card: conversation.detail_card || null,
          workflow: conversation.workflow || null,
          inline_actions: Array.isArray(conversation.inline_actions) ? conversation.inline_actions : [],
          scene_banner: scene.scene_banner || null,
          scene_summary: scene.scene_summary || null,
          room_variant: scene.room_variant || null,
          room_motif: scene.room_motif || null,
          stage_projection: scene.stage || null,
          portrait_projection: scene.portrait || null,
          messages: normalizeShellMessages(conversation.messages),
        },
      ];
    }),
  );
}

function mergeRoomWithContract(room, contract) {
  if (!contract) {
    return {
      ...room,
      messages: normalizeShellMessages(room.messages),
    };
  }
  const normalizedRoom = {
    ...room,
    messages: normalizeShellMessages(room.messages),
  };
  return {
    ...normalizedRoom,
    id: normalizedRoom.id || contract.id,
    title: contract.title || normalizedRoom.title || contract.id,
    subtitle: contract.subtitle || normalizedRoom.subtitle || "",
    meta: contract.meta || normalizedRoom.meta || "",
    kind_hint: contract.kind_hint || normalizedRoom.kind_hint || null,
    participant_label: contract.participant_label || normalizedRoom.participant_label || null,
    route_label: contract.route_label || normalizedRoom.route_label || null,
    list_summary: contract.list_summary || normalizedRoom.list_summary || null,
    status_line: contract.status_line || normalizedRoom.status_line || null,
    thread_headline: contract.thread_headline || normalizedRoom.thread_headline || null,
    chat_status_summary: contract.chat_status_summary || normalizedRoom.chat_status_summary || null,
    queue_summary: contract.queue_summary || normalizedRoom.queue_summary || null,
    preview_text: contract.preview_text || normalizedRoom.preview_text || null,
    last_activity_label: contract.last_activity_label || normalizedRoom.last_activity_label || null,
    activity_time_label: contract.activity_time_label || normalizedRoom.activity_time_label || null,
    overview_summary: contract.overview_summary || normalizedRoom.overview_summary || null,
    context_summary: contract.context_summary || normalizedRoom.context_summary || null,
    member_count: contract.member_count ?? normalizedRoom.member_count ?? null,
    caretaker: contract.caretaker || normalizedRoom.caretaker || null,
    detail_card: contract.detail_card || normalizedRoom.detail_card || null,
    workflow: contract.workflow || normalizedRoom.workflow || null,
    inline_actions:
      (Array.isArray(contract.inline_actions) && contract.inline_actions.length
        ? contract.inline_actions
        : normalizedRoom.inline_actions) || [],
    scene_banner: contract.scene_banner || normalizedRoom.scene_banner || null,
    scene_summary: contract.scene_summary || normalizedRoom.scene_summary || null,
    room_variant: contract.room_variant || normalizedRoom.room_variant || null,
    room_motif: contract.room_motif || normalizedRoom.room_motif || null,
    stage_projection: contract.stage_projection || normalizedRoom.stage_projection || null,
    portrait_projection: contract.portrait_projection || normalizedRoom.portrait_projection || null,
    messages:
      normalizedRoom.messages?.length
        ? normalizedRoom.messages
        : contract.messages,
  };
}

function synthesizeRoomsFromContracts(payload) {
  return Array.from(contractConversationMap(payload).values()).map((conversation) =>
    mergeRoomWithContract({}, conversation),
  );
}

function normalizeShellState(payload) {
  if (!hasAnyShellPayload(payload)) {
    return structuredClone(SAMPLE_STATE);
  }
  const contracts = contractConversationMap(payload);
  const legacyRooms = new Map(
    (Array.isArray(payload.rooms) ? payload.rooms : []).map((room) => [room?.id, room]),
  );
  const normalizedRooms =
    contracts.size > 0
      ? Array.from(contracts.values()).map((contractRoom) =>
          mergeRoomWithContract(legacyRooms.get(contractRoom.id) || {}, contractRoom),
        )
      : Array.from(legacyRooms.values()).map((room) => mergeRoomWithContract(room, contracts.get(room.id)));
  return {
    ...payload,
    rooms: normalizedRooms,
  };
}

async function loadBootstrap() {
  try {
    const candidates = ["./generated/bootstrap.json", "./bootstrap.sample.json"];
    for (const url of candidates) {
      const response = await fetch(url);
      if (!response.ok) continue;
      bootstrap = await response.json();
      return;
    }
  } catch {
    // fall through
  }
  bootstrap = DEFAULT_BOOTSTRAP;
}

async function loadGatewayBootstrap() {
  if (!gatewayUrl) return;
  try {
    const response = await fetch(`${gatewayUrl}/v1/shell/bootstrap`);
    if (!response.ok) return;
    bootstrap = await response.json();
  } catch {
    // keep prior bootstrap
  }
}

async function loadShellState() {
  try {
    const candidates = ["./generated/state.json"];
    for (const url of candidates) {
      const response = await fetch(url);
      if (!response.ok) continue;
      const payload = await response.json();
      if (hasAnyShellPayload(payload)) {
        state = normalizeShellState(payload);
        activeRoomId = defaultActiveRoomId(state.rooms) ?? activeRoomId;
        syncComposerDraft({ force: true });
        return;
      }
    }
  } catch {
    // keep fallback sample
  }
}

async function loadGatewayState() {
  if (!gatewayUrl) return false;
  try {
    const shellStateUrl = gatewayShellStateUrl();
    const response = await fetch(shellStateUrl);
    if (!response.ok) return false;
    const payload = await response.json();
    return applyGatewayShellStatePayload(payload, { persist: true });
  } catch {
    // fallback to local/generated state
  }
  return false;
}

async function applyGatewayShellStatePayload(payload, { persist = false } = {}) {
  if (!hasAnyShellPayload(payload)) return false;
  state = normalizeShellState(payload);
  const nextActiveRoomId = state.rooms.some((room) => room.id === activeRoomId)
    ? activeRoomId
    : defaultActiveRoomId(state.rooms);
  const activeChanged = nextActiveRoomId !== activeRoomId;
  activeRoomId = nextActiveRoomId;
  if (activeChanged) {
    syncComposerDraft({ force: true });
  }
  if (persist) {
    await persistState();
  }
  return true;
}

async function loadWorldState() {
  if (!gatewayUrl) return false;
  try {
    const snapshotResponse = await fetch(`${gatewayUrl}/v1/world-snapshot`);
    if (snapshotResponse.ok) {
      const bundle = await snapshotResponse.json();
      const payload = bundle?.payload;
      if (payload?.governance?.world) {
        governance = {
          world: payload.governance.world,
          portability: payload.governance.portability,
          cities: payload.governance.cities || [],
          memberships: payload.governance.memberships || [],
          public_rooms: payload.governance.public_rooms || [],
          residents: Array.isArray(payload.residents) ? payload.residents : [],
          world_directory: payload.directory || null,
          world_mirror_sources: Array.isArray(payload.mirror_sources)
            ? payload.mirror_sources
            : [],
          world_square: Array.isArray(payload.square) ? payload.square : [],
          world_safety: payload.safety || null,
        };
        return true;
      }
    }

    const [worldResponse, residentsResponse] = await Promise.all([
      fetch(`${gatewayUrl}/v1/world`),
      fetch(`${gatewayUrl}/v1/residents`),
    ]);
    if (!worldResponse.ok) return false;
    const payload = await worldResponse.json();
    const residentsPayload = residentsResponse.ok ? await residentsResponse.json() : [];
    if (payload?.world) {
      governance = {
        world: payload.world,
        portability: payload.portability,
        cities: payload.cities || [],
        memberships: payload.memberships || [],
        public_rooms: payload.public_rooms || [],
        residents: Array.isArray(residentsPayload) ? residentsPayload : [],
        world_directory: null,
        world_mirror_sources: [],
        world_square: [],
        world_safety: null,
      };
      return true;
    }
  } catch {
    // keep last governance snapshot
  }
  return false;
}

async function loadProviderState() {
  if (!gatewayUrl) return false;
  try {
    const response = await fetch(`${gatewayUrl}/v1/provider`);
    if (!response.ok) return false;
    const payload = await response.json();
    if (payload?.mode) {
      provider = payload;
      return true;
    }
  } catch {
    // keep prior provider snapshot
  }
  return false;
}

async function loadWorldEntry() {
  const shellPage = currentShellPage();
  if (shellPage !== "world-entry") return false;
  const routeList = document.querySelector(".world-route-list");
  if (!routeList) return false;
  if (!gatewayUrl) return false;

  try {
    const response = await fetch(`${gatewayUrl}/v1/world-entry`);
    if (!response.ok) return false;
    const payload = await response.json();
    const routes = Array.isArray(payload?.routes) ? payload.routes : [];
    if (routes.length === 0) return false;

    const hudTitle = document.querySelector(".world-entry-hud .hud-title");
    const stationChip = document.querySelector(".world-entry-hud-chip");
    const hudStatus = document.querySelector("#hud-status");
    if (hudTitle && payload.title) {
      hudTitle.textContent = payload.title;
    }
    if (stationChip && payload.station_label) {
      stationChip.textContent = payload.station_label;
    }
    if (hudStatus && payload.source_summary) {
      hudStatus.textContent = payload.source_summary;
    }

    routeList.replaceChildren();
    {
      const option = document.createElement("a");
      option.className = "world-route-option world-route-option-square";
      option.setAttribute("href", "./world-square.html");

      const title = document.createElement("strong");
      title.textContent = "世界广场";
      option.appendChild(title);

      const desc = document.createElement("span");
      desc.textContent = "打开之前绘制的世界广场完整素材，作为公共广场入口。";
      option.appendChild(desc);

      const status = document.createElement("span");
      status.className = "world-route-status";
      status.textContent = "概念图 · 公共广场";
      option.appendChild(status);

      routeList.appendChild(option);
    }
    for (const route of routes) {
      const option = document.createElement("a");
      option.className = "world-route-option";
      if (route.is_current) {
        option.classList.add("is-current");
      }
      option.setAttribute("href", route.href || "#");

      const title = document.createElement("strong");
      title.textContent = route.title || "";
      option.appendChild(title);

      if (route.description) {
        const desc = document.createElement("span");
        desc.textContent = route.description;
        option.appendChild(desc);
      }

      if (route.status_label) {
        const status = document.createElement("span");
        status.className = "world-route-status";
        status.textContent = route.is_current ? `当前主城 · ${route.status_label}` : route.status_label;
        option.appendChild(status);
      } else if (route.is_current) {
        const status = document.createElement("span");
        status.className = "world-route-status";
        status.textContent = "当前主城";
        option.appendChild(status);
      }

      routeList.appendChild(option);
    }
    return true;
  } catch {
    return false;
  }
}

function openIndexedDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("lobster-chat-shell", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("shell")) {
        db.createObjectStore("shell");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadCachedState() {
  if (!("indexedDB" in window)) {
    setNodeText(storageStateEl, "存储：内存回退模式");
    return;
  }

  try {
    const db = await openIndexedDb();
    const tx = db.transaction("shell", "readonly");
    const store = tx.objectStore("shell");
    const cached = await new Promise((resolve, reject) => {
      const req = store.get("timeline-state");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (hasAnyShellPayload(cached)) {
      state = normalizeShellState(cached);
    }
    setNodeText(storageStateEl, "存储：本地数据库已就绪");
  } catch {
    setNodeText(storageStateEl, "存储：回退模式");
  }
}

async function persistState() {
  if (!("indexedDB" in window)) return;

  try {
    const db = await openIndexedDb();
    const tx = db.transaction("shell", "readwrite");
    tx.objectStore("shell").put(state, "timeline-state");
  } catch {
    // keep shell quiet in fallback mode
  }
}

function loadSenderIdentity() {
  const queryIdentity = new URLSearchParams(window.location.search).get("identity")?.trim();
  if (queryIdentity) {
    senderIdentity = queryIdentity;
  } else {
  const stored = safeLocalStorageGet("lobster-identity");
  if (stored?.trim()) {
    senderIdentity = stored.trim();
  } else {
    const preset = defaultIdentityForShellMode(shellMode);
    if (preset) {
      senderIdentity = preset;
    }
  }
  }
  if (identityInputEl) {
    identityInputEl.value = senderIdentity;
  }
}

function persistSenderIdentity(value) {
  const nextIdentity = value.trim() || "访客";
  const identityChanged = nextIdentity !== senderIdentity;
  senderIdentity = nextIdentity;
  safeLocalStorageSet("lobster-identity", senderIdentity);
  if (identityInputEl && identityInputEl.value !== senderIdentity) {
    identityInputEl.value = senderIdentity;
  }
  if (identityChanged) {
    clearAllPendingEchoes();
    roomSendErrors = {};
  }
  updateResidentLoginSurface();
}

async function refreshIdentityProjection() {
  renderGovernance();
  renderResidents();
  renderRooms();
  renderTimeline();
  updateComposerState();
  updateGovernanceFormState();
  if (!gatewayUrl) {
    return;
  }
  await loadGatewayState();
  await loadWorldState();
  renderGovernance();
  renderResidents();
  renderRooms();
  renderTimeline();
  updateComposerState();
  updateGovernanceFormState();
}

function loadAuthDraft() {
  const email = safeLocalStorageGet("lobster-auth-email");
  const mobile = safeLocalStorageGet("lobster-auth-mobile");
  const resident = safeLocalStorageGet("lobster-auth-resident-id");
  const challengeId = safeLocalStorageGet("lobster-auth-challenge-id");
  const maskedEmail = safeLocalStorageGet("lobster-auth-masked-email");
  const deliveryMode = safeLocalStorageGet("lobster-auth-delivery-mode");
  const expiresAtMsRaw = safeLocalStorageGet("lobster-auth-expires-at-ms");
  const expiresAtMs = expiresAtMsRaw ? Number(expiresAtMsRaw) : null;
  const savedSessionToken = safeLocalStorageGet("lobster-session-token");
  sessionToken = savedSessionToken || null;
  if (authEmailInputEl && email) authEmailInputEl.value = email;
  if (authMobileInputEl && mobile) authMobileInputEl.value = mobile;
  if (authResidentInputEl && resident) authResidentInputEl.value = resident;
  if (authChallengeInputEl && challengeId) authChallengeInputEl.value = challengeId;
  authSession = {
    challengeId: challengeId || null,
    maskedEmail: maskedEmail || null,
    expiresAtMs: Number.isFinite(expiresAtMs) ? expiresAtMs : null,
    deliveryMode: deliveryMode || null,
  };
}

function persistAuthDraft() {
  safeLocalStorageSet("lobster-auth-resident-id", authResidentInputEl?.value?.trim() || "");
  safeLocalStorageSet("lobster-auth-email", authEmailInputEl?.value?.trim() || "");
  safeLocalStorageSet("lobster-auth-mobile", authMobileInputEl?.value?.trim() || "");
  safeLocalStorageSet("lobster-auth-challenge-id", authSession.challengeId || "");
  safeLocalStorageSet("lobster-auth-masked-email", authSession.maskedEmail || "");
  safeLocalStorageSet("lobster-auth-delivery-mode", authSession.deliveryMode || "");
  safeLocalStorageSet(
    "lobster-auth-expires-at-ms",
    authSession.expiresAtMs ? String(authSession.expiresAtMs) : "",
  );
}

function renderRooms() {
  if (!roomListEl) return;
  clearChildren(roomListEl);
  const rooms = filteredRooms();
  const shellPage = currentShellPage();
  const activeVisible = rooms.some((room) => room.id === activeRoomId);
  const unreadTotal = state.rooms.reduce((sum, room) => sum + unreadCount(room), 0);
  const draftTotal = state.rooms.reduce((sum, room) => sum + (roomHasDraft(room.id) ? 1 : 0), 0);
  const followUpTotal = state.rooms.reduce(
    (sum, room) =>
      sum +
      Number(
        Boolean(
          roomSendErrors[room.id] ||
            roomHasDraft(room.id) ||
            unreadCount(room) ||
            visiblePendingEchoCount(room),
        ),
      ),
    0,
  );
  renderRoomDigest(rooms);

  if (roomToolbarNoteEl) {
    const directCount = rooms.filter((room) => roomKind(room) === "direct").length;
    const publicCount = rooms.filter((room) => roomKind(room) === "public").length;
    const pieces =
      shellPage === "admin"
        ? [
            `${roomSyncLabel()} · 后台 ${rooms.length} / ${state.rooms.length} 个窗口`,
            `待跟进 ${followUpTotal} · 私信 ${directCount} · 频道 ${publicCount}`,
          ]
        : [
            `${roomSyncLabel()} · 展示 ${rooms.length} / ${state.rooms.length} 个会话`,
            `私信 ${directCount} · 频道 ${publicCount}`,
          ];
    if (roomFilter !== "all") {
      pieces.push(`筛选：${translateRoomKind(roomFilter)}`);
    }
    if (roomSearch) {
      pieces.push(`搜索：${roomSearch}`);
    }
    if (unreadTotal > 0) {
      pieces.push(`总未读 ${unreadTotal}`);
    }
    if (draftTotal > 0) {
      pieces.push(`草稿 ${draftTotal}`);
    }
    if (!activeVisible && activeRoomId) {
      pieces.push("当前会话被筛选隐藏");
    }
    roomToolbarNoteEl.textContent = pieces.join(" · ");
  }

  if (!rooms.length) {
    const empty = document.createElement("li");
    empty.className = "empty-note";
    empty.textContent = gatewayUrl
      ? "没有匹配到频道或私信，可以切换筛选、清空搜索，或先从左侧打开一个会话。"
      : "当前只有离线样例数据，连接网关后会显示真实频道。";
    roomListEl.appendChild(empty);
    return;
  }

  const groups = roomGroupBlueprints(shellPage, rooms);

  for (const group of groups) {
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
      const kind = roomKind(room);
      const preview = roomPreview(room);
      const unread = unreadCount(room);
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.className = `room-button${room.id === activeRoomId ? " active" : ""}${
        unread > 0 && room.id !== activeRoomId ? " room-button-unread" : ""
      }`;
      button.dataset.roomKind = kind;
      button.addEventListener("click", () => {
        focusRoom(room.id);
        renderRooms();
        renderTimeline();
      });

      const avatar = document.createElement("div");
      avatar.className = `room-avatar room-avatar-${kind}`;
      avatar.textContent =
        shellPage === "user"
          ? kind === "direct"
            ? "居"
            : kind === "public"
              ? "城"
              : "门"
          : kind === "direct"
            ? "私"
            : kind === "public"
              ? "群"
              : "通";

      const content = document.createElement("div");
      content.className = "room-content";

      const top = document.createElement("div");
      top.className = "room-topline";
      const titleStack = document.createElement("div");
      titleStack.className = "room-title-stack";
      titleStack.appendChild(
        createLine("room-name", roomThreadHeadline(room)),
      );
      titleStack.appendChild(createLine("room-kicker", roomAudienceLabel(room)));
      top.appendChild(titleStack);

      const metaStack = document.createElement("div");
      metaStack.className = "room-top-meta";
      metaStack.appendChild(createLine("room-activity", roomActivityTime(room)));
      const summaryBadges = document.createElement("div");
      summaryBadges.className = "room-badges";
      summaryBadges.appendChild(
        createPill(
          translateRoomKindForShellPage(kind, shellPage),
          kind === "direct" ? "accent" : "muted",
        ),
      );
      if (room.id === activeRoomId) {
        summaryBadges.appendChild(
          createPill(shellPage === "admin" ? "后台中" : shellPage === "user" ? "聊天中" : "当前", "accent"),
        );
      } else if (unread > 0) {
        summaryBadges.appendChild(createPill(`${unread} 未读`, "warm"));
      }
      metaStack.appendChild(summaryBadges);
      top.appendChild(metaStack);

      content.appendChild(top);
      content.appendChild(createRoomPreviewNode(room));
      const tagRow = document.createElement("div");
      tagRow.className = "room-tag-row";
      const roomActionPill = createRoomQuickActionPill(room);
      if (roomActionPill) {
        tagRow.appendChild(roomActionPill);
      }
      const roomPreviewPill = createRoomQuickPreviewPill(room);
      if (roomPreviewPill) {
        tagRow.appendChild(roomPreviewPill);
      }
      if (roomHasDraft(room.id)) {

```

## Timeline render

```js
function renderTimeline() {
  if (!timelineEl) return;
  const room = state.rooms.find((item) => item.id === activeRoomId);
  const shellPage = currentShellPage();
  const compactChatShell = shellPage === "user" || shellPage === "admin";
  const wasNearBottom =
    timelineEl && timelineEl.scrollHeight - timelineEl.scrollTop - timelineEl.clientHeight < 80;
  clearChildren(timelineEl);
  syncRoomStageCanvas(room);
  renderConversationOverview();
  renderChatDetailPanel();
  renderThreadStatusRail(room);

  if (!room) {
    renderConversationMetaChips(null, [
      {
        text: gatewayUrl
          ? "先选会话，消息会显示在这里。"
          : "离线预览态，先选会话再发消息。",
        tone: "muted",
      },
    ]);
    renderThreadStatusRail(null);
    const empty = document.createElement("div");
    empty.className = "empty-note timeline-empty timeline-empty-card";
    const emptyTitle = document.createElement("div");
    emptyTitle.className = "timeline-empty-title";
    emptyTitle.textContent = "先选会话，再输入第一句";
    const emptyCopy = document.createElement("div");
    emptyCopy.className = "timeline-empty-copy";
    emptyCopy.textContent = gatewayUrl
      ? "消息会按当前线程展开，下面的输入区也会自动切到对应会话。"
      : "离线预览态也能先把第一句写出来，消息会暂存在本地时间线。";
    const emptyAction = document.createElement("div");
    emptyAction.className = "timeline-empty-action";
    emptyAction.textContent = shellPage === "admin"
      ? "后台页先选会话，再像聊天一样记录。"
      : "选中会话后，直接在底部输入即可。";
    empty.appendChild(emptyTitle);
    empty.appendChild(emptyCopy);
    empty.appendChild(emptyAction);
    timelineEl.appendChild(empty);
    return;
  }

  const metaChips = [];
  if (shellPage === "unified") {
    metaChips.push(
      { text: translateClientDisplayName(bootstrap.host.client_profile.display_name), tone: "muted" },
      {
        text: room.id === activeRoomId ? "当前会话" : "旁侧会话",
        tone: room.id === activeRoomId ? "accent" : "muted",
      },
      { text: `入口 ${translateRoutePrefix(bootstrap.shell.route_prefix)}`, tone: "muted" },
    );
  } else {
    const kindLabel = translateRoomKindForShellPage(roomKind(room), shellPage);
    metaChips.push({ text: kindLabel, tone: roomKind(room) === "direct" ? "accent" : "muted" });
    metaChips.push({ text: roomLastActivity(room), tone: "muted" });
  }

  const unread = unreadCount(room);
  if (unread > 0) {
    metaChips.push({ text: `${unread} 条未读`, tone: "warm" });
  }
  if (!compactChatShell) {
    metaChips.push({ text: `身份 ${currentIdentity()}`, tone: "muted" });
  }
  if (shellPage !== "user") {
    metaChips.push({
      text: roomChatStatusSummary(room),
      tone: roomSendErrors[room.id] ? "danger" : visiblePendingEchoCount(room) ? "warm" : "accent",
    });
  }
  if (roomHasDraft(room.id)) {
    metaChips.push({ text: "有草稿未发", tone: "accent" });
  }
  if (visiblePendingEchoCount(room)) {
    metaChips.push({
      text: roomSendErrors[room.id] ? "有待重发消息" : "有待同步消息",
      tone: roomSendErrors[room.id] ? "danger" : "warm",
    });
  }
  if (isSendingMessage) {
    metaChips.push({ text: "发送中", tone: "warm" });
  }
  if (roomSendErrors[room.id]) {
    metaChips.push({ text: "发送失败", tone: "danger" });
  }
  if (lastRefreshErrorMessage) {
    metaChips.push({ text: "回退快照", tone: "warm" });
  }

  metaChips.push({ text: roomSyncLabel(), tone: refreshInProgress ? "warm" : "muted" });
  metaChips.push({
    text: `消息来源${translateProviderConnectionState(provider.connection_state)}`,
    tone: provider.connection_state === "Connected" ? "accent" : "danger",
  });

  renderConversationMetaChips(room, metaChips);

  const localPreviewMessages = localPreviewMessagesForEmptyRoom(room);

  if (!room.messages?.length && !localPreviewMessages.length) {
    const empty = document.createElement("div");
    empty.className = "empty-note timeline-empty";
    empty.textContent = gatewayUrl
      ? "还没有消息，先发一句试试。"
      : "还没有消息，先发一句试试。";
    timelineEl.appendChild(empty);
  }

  const messages = (room.messages?.length ? room.messages : localPreviewMessages).filter(
    (m) => !(typeof m.text === "string" && m.text.includes("探针消息")),
  );
  const pending = visiblePendingEchoesForRoom(room);
  const allowUnreadDivider = shellPage !== "hub" && shellPage !== "user";
  const unreadForDivider = allowUnreadDivider ? unreadCount(room) : 0;
  const unreadStartIndex =
    unreadForDivider > 0 ? Math.max(messages.length - unreadForDivider, 0) : -1;
  const totalRows = messages.length + pending.length;
  const allowMessageStagger = shellPage !== "hub" && shellPage !== "creative";
  const staggerBase = allowMessageStagger && totalRows <= 20 ? 30 : 0;
  const staggerCap = allowMessageStagger && totalRows <= 20 ? 300 : 0;
  const allowMessageGrouping = shellPage !== "hub" && shellPage !== "user";

  for (const [index, message] of messages.entries()) {
    if (index === unreadStartIndex) {
      const unreadDivider = document.createElement("div");
      unreadDivider.className = "timeline-divider";
      unreadDivider.textContent =
        unreadForDivider === 1
          ? "以下是 1 条未读消息"
          : `以下是 ${unreadForDivider} 条未读消息`;
      timelineEl.appendChild(unreadDivider);
    }

    const isSelf = message.sender === currentIdentity();
    const messageKind = messageThreadKind(message, room, isSelf);
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const isGrouped = prevMessage
      && prevMessage.sender === message.sender
      && messageKind === messageThreadKind(prevMessage, room, prevMessage.sender === currentIdentity())
      && index !== unreadStartIndex;
    const row = document.createElement("div");
    row.className = `message-row${isSelf ? " self" : ""}`;
    row.dataset.messageKind = messageKind;
    row.dataset.messageSide = messageKind === "system" ? "system" : isSelf ? "self" : "peer";
    if (allowMessageGrouping && isGrouped) {
      row.setAttribute("data-grouped", "true");
    }
    if (staggerBase > 0 && index >= messages.length - 6) {
      const delay = Math.min((index - (messages.length - 6)) * staggerBase, staggerCap);
      row.setAttribute("style", `--msg-stagger:${delay}ms`);
    }

    const avatar = document.createElement("div");
    avatar.className = `message-avatar message-avatar-${messageAvatarTone(message, room, isSelf)}`;
    avatar.textContent = badgeToken(
      isSelf ? currentIdentity() : message.sender,
      messageKind === "system" ? "系" : messageKind === "caretaker" ? "管" : isSelf ? "我" : "聊",
    );

    const stack = document.createElement("div");
    stack.className = "message-stack";

    const article = document.createElement("article");
    article.className = `message${isSelf ? " self" : ""}`;
    article.dataset.messageKind = messageKind;

    const header = document.createElement("div");
    header.className = "message-header";

    const meta = document.createElement("div");
    meta.className = "message-meta";
    const sender = document.createElement("span");
    sender.className = "message-sender";
    sender.textContent = message.sender;
    meta.appendChild(sender);
    const role = document.createElement("span");
    role.className = `message-role${isSelf ? " message-role-self" : ""}`;
    role.textContent = messageRoleLabel(message, room, isSelf);
    meta.appendChild(role);
    const latestMessage = latestRoomMessageLike(room);
    const isLatestQuickAction = latestMessage === message && typeof message?.quick_action === "string" && message.quick_action.trim();
    const actionChip = createMessageQuickActionChip(message.quick_action);
    if (actionChip) {
      meta.appendChild(actionChip);
    }
    const stateChip = createMessageQuickStateChip(
      message.quick_action,
      isLatestQuickAction ? roomQuickState(room.id, message.quick_action) : "",
    );
    if (stateChip) {
      meta.appendChild(stateChip);
    }
    if (message?.is_edited && !message?.is_recalled) {
      const edited = document.createElement("span");
      edited.className = "message-edited";
      edited.textContent = "已编辑";
      meta.appendChild(edited);
    }

    const timestamp = document.createElement("span");
    timestamp.className = "message-time";
    timestamp.textContent = message.timestamp;
    if (message.timestamp_ms) {
      timestamp.setAttribute("data-full-time", formatDateTime(message.timestamp_ms));
    } else {
      timestamp.setAttribute("data-full-time", message.timestamp);
    }
    header.appendChild(meta);
    header.appendChild(timestamp);

    const body = createMessageBodyNode(message, {
      quickState: isLatestQuickAction ? roomQuickState(room.id, message.quick_action) : "",
    });

    article.appendChild(header);
    article.appendChild(body);
    stack.appendChild(article);
    row.appendChild(avatar);
    row.appendChild(stack);
    timelineEl.appendChild(row);
  }

  for (const message of pending) {
    const row = document.createElement("div");
    row.className = "message-row self";
    row.dataset.messageKind = "pending";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar message-avatar-self";
    avatar.textContent = badgeToken(currentIdentity(), "我");

    const stack = document.createElement("div");
    stack.className = "message-stack";

    const article = document.createElement("article");
    article.className = `message self message-pending${message.failed ? " message-pending-failed" : ""}`;
    article.dataset.messageKind = "pending";

    const header = document.createElement("div");
    header.className = "message-header";

    const meta = document.createElement("div");
    meta.className = "message-meta";
    const sender = document.createElement("span");
    sender.className = "message-sender";
    sender.textContent = currentIdentity();
    meta.appendChild(sender);

    const role = document.createElement("span");
    role.className = "message-role";
    role.textContent = message.failed ? "待重发" : "待同步";
    meta.appendChild(role);
    const latestMessage = latestRoomMessageLike(room);
    const isLatestQuickAction = latestMessage === message && typeof message?.quick_action === "string" && message.quick_action.trim();
    const actionChip = createMessageQuickActionChip(message.quick_action);
    if (actionChip) {
      meta.appendChild(actionChip);
    }
    const stateChip = createMessageQuickStateChip(
      message.quick_action,
      isLatestQuickAction ? roomQuickState(room.id, message.quick_action) : "",
    );
    if (stateChip) {
      meta.appendChild(stateChip);
    }


```

## Composer state and send path

```js
  if (!composerStatusEl) return;
  const status = composerStatusState();
  composerStatusEl.textContent = status.text;
  composerStatusEl.classList.remove(
    "composer-status-muted",
    "composer-status-accent",
    "composer-status-warning",
    "composer-status-danger",
  );
  composerStatusEl.classList.add(`composer-status-${status.tone}`);
  updateCaretakerStatus();
}

function updateComposerState() {
  ensureComposerTip();
  ensureComposerKeyBindings();
  const room = state.rooms.find((item) => item.id === activeRoomId);
  const shellPage = currentShellPage();
  const compactChatShell = shellPage === "user" || shellPage === "admin";
  const draftText = composerInputEl?.value.trim() || "";
  const composerAvailability = computeComposerAvailability({
    hasActiveRoom: Boolean(activeRoomId),
    hasDraftText: Boolean(draftText),
    isSendingMessage,
    hasGateway: Boolean(gatewayUrl),
    hasIdentity: userShellProjection() ? !isVisitorIdentity() : Boolean(currentIdentity()),
    requiresIdentity: userShellProjection(),
  });
  if (composerFormEl) {
    composerFormEl.dataset.shellMode = shellMode;
    composerFormEl.dataset.draftState = composerAvailability.draftState;
    setDatasetFlag(composerFormEl, "quickAction", room ? roomQuickAction(room.id) : "");
  }
  const { canDraft, canLiveSend, canSend } = composerAvailability;
  if (!composerFormEl || !composerInputEl || !composerSendEl) {
    updateComposerStatus();
    return;
  }
  composerInputEl.disabled = !canDraft || isSendingMessage;
  composerSendEl.disabled = !canSend;
  let placeholder;
  if (isSendingMessage) {
    placeholder = "正在发送消息...";
  } else if (residentGatewayLoginRequired()) {
    placeholder = "请先登录后发送";
  } else if (room) {
    const kind = roomKind(room);
    placeholder =
      kind === "direct"
        ? compactChatShell
          ? `发消息给 ${room.thread_headline || room.peer_label || room.participant_label || roomDisplayPeer(room)}`
          : `发给 ${room.thread_headline || room.peer_label || room.participant_label || roomDisplayPeer(room)}`
        : kind === "public"
          ? compactChatShell
            ? `发到 ${roomThreadHeadline(room)}`
            : `在 ${roomThreadHeadline(room)} 里说点什么`
          : `回复 ${room.participant_label || room.route_label || room.title}`;
  } else {
    placeholder = compactChatShell
      ? "先选会话，再输入第一句"
      : "先选会话，再写跟进或公告";
  }
  if (!residentGatewayLoginRequired() && !isSendingMessage && room && !canLiveSend) {
    placeholder += gatewayUrl ? "（会先保存在本地，等待同步）" : "（会先进入本地时间线）";
  }
  if (shellPage === "hub") {
    placeholder = "说点什么…";
  }
  composerInputEl.placeholder = placeholder;
  composerInputEl.enterKeyHint = "send";
  composerInputEl.setAttribute("aria-label", placeholder);
  composerSendEl.textContent = isSendingMessage ? "发送中..." : quickActionSendLabel(room ? roomQuickAction(room.id) : "");
  composerFormEl.classList.toggle("is-sending", isSendingMessage);
  composerFormEl.dataset.composerPage = shellPage;
  syncUserQuickActionButtons(room?.id || activeRoomId);
  updateComposerStatus();
  renderComposerHero(room);
  updateComposerContext(room);
  updateComposerTip();
  renderComposerMeta(room);
}

async function submitComposerMessage() {
  if (isSendingMessage) {
    updateComposerState();
    return false;
  }
  if (residentGatewayLoginRequired()) {
    setAuthStatus("请先登录后发送", true);
    updateResidentLoginSurface();
    updateComposerState();
    return false;
  }
  if (!activeRoomId) {
    updateComposerState();
    return false;
  }
  const text = composerInputEl.value.trim();
  const quickAction = roomQuickAction(activeRoomId);
  if (!text) return false;
  composerSendEl.disabled = true;
  try {
    await sendMessage(text, { quickAction });
  } catch (error) {
    const message = localizedRuntimeError(error, "消息发送失败");
    roomSendErrors[activeRoomId] = message;
    refreshGatewayBadge();
    renderRooms();
    renderTimeline();
    renderConversationOverview();
    return false;
  } finally {
    updateComposerState();
  }
  return true;
}

function updateGovernanceFormState() {
  const enabled = Boolean(gatewayUrl && currentIdentity());
  const worldStewardEnabled = enabled && actorIsWorldSteward();
  const worldStewardInputs = new Set([
    worldMirrorUrlInputEl,
    worldNoticeTitleInputEl,
    worldNoticeSeveritySelectEl,
    worldNoticeTagsInputEl,
    worldNoticeBodyInputEl,
    worldTrustCityInputEl,
    worldTrustStateSelectEl,
    worldTrustReasonInputEl,
    worldAdvisorySubjectKindSelectEl,
    worldAdvisorySubjectInputEl,
    worldAdvisoryActionInputEl,
    worldAdvisoryReasonInputEl,
    worldReportReviewIdInputEl,
    worldReportReviewStatusSelectEl,
    worldReportReviewCityStateSelectEl,
    worldReportReviewResolutionInputEl,
    worldResidentIdInputEl,
    worldResidentCityInputEl,
    worldResidentEmailInputEl,
    worldResidentMobileInputEl,
    worldResidentReasonInputEl,
  ]);
  for (const element of [
    providerUrlInputEl,
    cityTitleInputEl,
    citySlugInputEl,
    cityDescriptionInputEl,
    cityJoinInputEl,
    roomCityInputEl,
    roomTitleInputEl,
    roomSlugInputEl,
    roomDescriptionInputEl,
    directPeerInputEl,
    worldMirrorUrlInputEl,
    worldNoticeTitleInputEl,
    worldNoticeSeveritySelectEl,
    worldNoticeTagsInputEl,
    worldNoticeBodyInputEl,
    worldTrustCityInputEl,
    worldTrustStateSelectEl,
    worldTrustReasonInputEl,
    worldAdvisorySubjectKindSelectEl,
    worldAdvisorySubjectInputEl,
    worldAdvisoryActionInputEl,
    worldAdvisoryReasonInputEl,
    worldReportReviewIdInputEl,
    worldReportReviewStatusSelectEl,
    worldReportReviewCityStateSelectEl,
    worldReportReviewResolutionInputEl,
    worldReportCityInputEl,
    worldReportTargetKindSelectEl,
    worldReportTargetInputEl,
    worldReportSummaryInputEl,
    worldReportEvidenceInputEl,
    worldResidentIdInputEl,
    worldResidentCityInputEl,
    worldResidentEmailInputEl,
    worldResidentMobileInputEl,
    worldResidentReasonInputEl,
  ]) {
    if (!element) continue;
    element.disabled = worldStewardInputs.has(element) ? !worldStewardEnabled : !enabled;

```

## Gateway headers, refresh, and auth flow

```js
function gatewayJsonHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };
  if (sessionToken) {
    headers["Authorization"] = `Bearer ${sessionToken}`;
  }
  return headers;
}

function handleGatewayAuthFailure(status) {
  if (status !== 401 && status !== 403) return;
  sessionToken = null;
  safeLocalStorageSet("lobster-session-token", "");
  setAuthStatus("登录已失效，请重新登录", true);
}

async function postGatewayJson(path, payload) {
  const headers = gatewayJsonHeaders();
  const response = await fetch(`${gatewayUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // ignore parse errors
  }
  if (!response.ok) {
    const message = gatewayErrorMessage(parsed, text, response.status);
    handleGatewayAuthFailure(response.status);
    throw new Error(message);
  }
  return parsed;
}

function gatewayErrorMessage(parsed, text, status) {
  const message =
    parsed?.message ||
    parsed?.error ||
    parsed?.Error?.message ||
    parsed?.error?.message ||
    text ||
    `${status}`;
  return typeof message === "string" ? message : `${status}`;
}

async function refreshFromGateway({ requireShell = false } = {}) {
  refreshInProgress = true;
  lastRefreshErrorMessage = "";
  updateComposerState();
  renderConversationOverview();
  let worldChanged = false;
  let shellChanged = false;
  let providerChanged = false;
  try {
    [worldChanged, shellChanged, providerChanged] = await Promise.all([
      loadWorldState(),
      loadGatewayState(),
      loadProviderState(),
    ]);
    if (!worldChanged && !shellChanged && !providerChanged && gatewayUrl) {
      lastRefreshErrorMessage = "同步未取到新状态";
      if (requireShell) {
        throw new Error(lastRefreshErrorMessage);
      }
    } else if (worldChanged || shellChanged || providerChanged) {
      lastRefreshAtMs = Date.now();
    }
  } catch (error) {
    lastRefreshErrorMessage = localizedRuntimeError(error, "同步失败");
    if (requireShell) {
      throw new Error(lastRefreshErrorMessage);
    }
  } finally {
    refreshInProgress = false;
    if (worldChanged && !userShellProjection()) {
      renderGovernance();
      renderResidents();
    }
    renderRooms();
    renderTimeline();
    if (providerChanged) {
      refreshGatewayBadge();
    }
    updateComposerState();
    updateAuthFormState();
    updateResidentLoginSurface();
    if (!userShellProjection()) {
      updateGovernanceFormState();
    }
  }
}

function startGatewayPolling() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  if (!gatewayUrl) return;
  const interval = bootstrap.refresh_interval_ms || 4000;
  refreshTimer = setInterval(async () => {
    await refreshFromGateway();
  }, interval);
}

function stopShellEventSource({ clearRestart = true } = {}) {
  if (clearRestart && shellRealtimeRestartTimer) {
    clearTimeout(shellRealtimeRestartTimer);
    shellRealtimeRestartTimer = null;
  }
  if (!shellEventSource) return;
  shellEventSource.close();
  shellEventSource = null;
}

function renderShellStateRefresh() {


  const deliveryMode = authDeliverySelectEl?.value || "email";
  if (deliveryMode !== "email") {
    setAuthStatus("当前只开通邮箱验证码，请选择邮箱验证码", true);
    return;
  }
  const email = authEmailInputEl.value.trim();
  const mobile = authMobileInputEl.value.trim();
  const devicePhysicalAddress = authDeviceInputEl.value.trim();
  if (!email) {
    setAuthStatus("请填写邮箱地址", true);
    return;
  }
  setAuthStatus("正在检查注册句柄");
  const preflight = await postGatewayJson("/v1/auth/preflight", {
    email,
    mobile: mobile || undefined,
    device_physical_address: devicePhysicalAddress || undefined,
  });
  if (!preflight.allowed) {
    setAuthStatus(preflight.blocked_reasons.join(" · ") || "认证预检未通过", true);
    return;
  }
  setAuthStatus(`正在为 ${preflight.normalized_email || email} 申请邮箱验证码`);
  const response = await postGatewayJson("/v1/auth/email-otp/request", {
    email,
    mobile: mobile || undefined,
    device_physical_address: devicePhysicalAddress || undefined,
    resident_id: currentDesiredResidentId(),
  });
  authSession = {
    challengeId: response.challenge_id,
    maskedEmail: response.masked_email,
    expiresAtMs: response.expires_at_ms,
    deliveryMode: response.delivery_mode,
  };
  authChallengeInputEl.value = response.challenge_id;
  if (response.dev_code) {
    authCodeInputEl.value = response.dev_code;
  }
  persistAuthDraft();
  const expiresAt = new Date(response.expires_at_ms).toLocaleTimeString();
  const deliveryNote = response.dev_code
    ? `开发验证码已预填 · ${expiresAt} 前有效`
    : `${translateDeliveryMode(response.delivery_mode)} · ${expiresAt} 前有效`;
  setAuthStatus(`邮箱验证码已发往 ${response.masked_email} · ${deliveryNote}`);
}

async function verifyEmailOtp() {
  const challengeId = (authSession.challengeId || authChallengeInputEl.value || "").trim();
  const code = authCodeInputEl.value.trim();
  if (!challengeId) {
    setAuthStatus("请先获取邮箱验证码", true);
    return;
  }
  if (!code) {
    setAuthStatus("请填写邮箱验证码", true);
    return;
  }
  setAuthStatus("正在校验邮箱验证码");
  const response = await postGatewayJson("/v1/auth/email-otp/verify", {
    challenge_id: challengeId,
    code,
    resident_id: currentDesiredResidentId(),
  });
  persistSenderIdentity(response.resident_id);
  if (authResidentInputEl) authResidentInputEl.value = response.resident_id;
  sessionToken = response.session_token || null;
  safeLocalStorageSet("lobster-session-token", sessionToken || "");
  authSession = {
    challengeId: null,
    maskedEmail: response.email_masked,
    expiresAtMs: null,
    deliveryMode: null,
  };
  authChallengeInputEl.value = "";
  authCodeInputEl.value = "";
  persistAuthDraft();
  await refreshFromGateway();
  setAuthStatus(`已登录为 ${response.resident_id} · ${response.email_masked}`);
}

function exportFileExtension(format) {
  if (format === "jsonl") return "jsonl";
  if (format === "txt") return "txt";
  return "md";

```
