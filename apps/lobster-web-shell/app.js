import { computeComposerAvailability } from "./composer-state.js";
import {
  buildRoomVisualModel,
  renderPortraitCanvas,
  renderStageCanvas,
} from "./pretext-stage.js";

const DEFAULT_BOOTSTRAP = {
  host: {
    client_profile: {
      class: "MobileWeb",
      display_name: "移动网页端",
      max_memory_kib: 8192,
      supports_graphics: true,
      supports_voice: true,
      supports_camera: false,
      supports_background_sync: false,
    },
    preferred_surface: "CompactTerminal",
    max_inline_chars: 512,
    supports_push_notifications: true,
    supports_voice_input: true,
    supports_camera_ingest: false,
    supports_background_sync: false,
  },
  shell: {
    route_prefix: "/app",
    supports_offline_shell: true,
    storage_mode: "IndexedDbPreferred",
    stream_incremental_updates: true,
  },
  initial_surface: "RoomList",
  offline_cache_budget_mb: 64,
  supports_background_resync: false,
};

const SAMPLE_STATE = {
  rooms: [
    {
      id: "dm:builder:rsaga",
      title: "私信 · 内测同伴",
      subtitle: "一对一测试聊天",
      meta: "最近 24 小时活跃",
      kind_hint: "私信",
      participant_label: "你与内测同伴",
      member_count: 2,
      scene_banner: "直接协作",
      scene_summary: "适合快速确认方向、补一句进度和直接追问。",
      caretaker: {
        name: "旺财",
        role_label: "房间管家",
        persona: "高冷但可靠，会替主人记住来访者和留言。",
        status: "在线值守",
        memory: "今天记录了 2 位访客、1 条重要留言。",
        auto_reply: "主人正在调试新版本，紧急事项我会先记录再提醒。",
        pending_visitors: 2,
        notifications: [
          "城东的李四问你是否还接移动端布局单。",
        ],
        messages: [
          {
            visitor: "城东的李四",
            note: "下午来过，看了看你的装备架，问你是否接移动端壳层单。",
            urgency: "普通",
          },
          {
            visitor: "南岸的阿梨",
            note: "留了一句“新群入口什么时候开”，没有继续追问。",
            urgency: "低",
          },
        ],
        patrol: {
          mode: "轻巡视",
          last_check: "2 分钟前",
          outcome: "最近一次内容巡视没有发现违规文本。",
        },
      },
      messages: [
        {
          sender: "内测同伴",
          timestamp: "10:14",
          text: "核心已经拆成无头聊天内核、宿主适配层和可选 AI 旁路。",
        },
        {
          sender: "builder",
          timestamp: "10:15",
          text: "住宅页先按这个像素房间方向走，别再加复杂工作台。",
        },
        {
          sender: "内测同伴",
          timestamp: "10:16",
          text: "先把 H5 跑起来，苹果和安卓就能更早接入。",
        },
        {
          sender: "builder",
          timestamp: "10:17",
          text: "对话保持微信那种左人右己，场景点击可以临时清屏。",
        },
        {
          sender: "内测同伴",
          timestamp: "10:18",
          text: "穿戴端先保持轻量，只做一眼卡片和语音回复，摄像头能力后置。",
        },
      ],
    },
    {
      id: "room:world:lobby",
      title: "群聊 · 世界广场",
      subtitle: "公开讨论与公告",
      meta: "公开群聊",
      kind_hint: "公开频道",
      participant_label: "跨城公开讨论",
      member_count: 12,
      scene_banner: "公共频道",
      scene_summary: "适合看公告、接运营通知和围观跨城公开讨论。",
      caretaker: {
        name: "巡逻犬",
        role_label: "频道巡视",
        persona: "只在需要时出来提醒，不抢公共讨论。",
        status: "低打扰巡视",
        memory: "记录最近 30 分钟的公共频道风险提示。",
        auto_reply: "如果内容触发巡视规则，会先投一张提示卡给城主。",
        pending_visitors: 0,
        notifications: [
          "刚完成一轮公共频道合法性巡视，当前没有新的违规告警。",
        ],
        messages: [],
        patrol: {
          mode: "合法性巡视",
          last_check: "6 分钟前",
          outcome: "仅提示 1 条外链待人工复核，没有拦截正常聊天。",
        },
      },
      messages: [
        {
          sender: "系统",
          timestamp: "09:40",
          text: "欢迎来到世界广场，这里像普通群聊一样显示公开讨论。",
        },
        {
          sender: "城民阿岚",
          timestamp: "09:42",
          text: "公告栏那边刚更新了今晚的联调说明，有空可以过去看一眼。",
        },
        {
          sender: "builder",
          timestamp: "09:43",
          text: "收到。主城先保持群聊主轴，热点只做入口提示，不抢画面。",
        },
        {
          sender: "巡逻犬",
          timestamp: "09:44",
          text: "当前频道正常，只有公告栏有一条待确认提醒。",
        },
      ],
    },
    {
      id: "room:world:design",
      title: "群聊 · 壳层讨论",
      subtitle: "移动端布局与视觉",
      meta: "讨论群",
      kind_hint: "工作群",
      participant_label: "产品与设计讨论",
      member_count: 6,
      scene_banner: "设计串场",
      scene_summary: "把布局、会话列表和输入区当成产品功能，而不是演示面板。",
      caretaker: {
        name: "灰狗",
        role_label: "房间小狗",
        persona: "暴躁修仙者，嘴硬但会把留言记清楚。",
        status: "半自动值守",
        memory: "帮主人盯着设计改动和访客留言。",
        auto_reply: "主人在画线框，急事留关键词，我会推送。",
        pending_visitors: 1,
        notifications: [
          "有人提到“治理入口太重”，已记成待处理提醒。",
        ],
        messages: [
          {
            visitor: "设计者",
            note: "提了一嘴：会话列表要更像正常 IM，不要像后台。",
            urgency: "高",
          },
        ],
        patrol: {
          mode: "房间巡逻",
          last_check: "刚刚",
          outcome: "已把高频反馈整理成给主人看的待办提醒。",
        },
      },
      messages: [
        {
          sender: "设计者",
          timestamp: "更早",
          text: "浏览器壳保持轻薄，但会话列表、消息流和输入框要像常见聊天产品。",
        },
      ],
    },
  ],
};

function caretakerProfile(room) {
  if (!room || !room.caretaker || typeof room.caretaker !== "object") return null;
  return room.caretaker;
}

function detailCardProfile(room) {
  if (!room || !room.detail_card || typeof room.detail_card !== "object") return null;
  return room.detail_card;
}

function stageProjection(room) {
  if (!room || !room.stage_projection || typeof room.stage_projection !== "object") return null;
  return room.stage_projection;
}

function portraitProjection(room) {
  if (!room || !room.portrait_projection || typeof room.portrait_projection !== "object") return null;
  return room.portrait_projection;
}

function workflowProfile(room) {
  if (!room || !room.workflow || typeof room.workflow !== "object") return null;
  return room.workflow;
}

function inlineActionProfiles(room) {
  return Array.isArray(room?.inline_actions) ? room.inline_actions.filter(Boolean) : [];
}

function inlineActionProfile(room, role) {
  return inlineActionProfiles(room).find((item) => item?.role === role) || null;
}

function caretakerPendingCount(room) {
  const caretaker = caretakerProfile(room);
  if (!caretaker) return 0;
  return Number(caretaker.pending_visitors || caretaker.messages?.length || 0) || 0;
}

function caretakerNotificationCount(room) {
  const caretaker = caretakerProfile(room);
  if (!caretaker) return 0;
  return Array.isArray(caretaker.notifications) ? caretaker.notifications.length : 0;
}

function caretakerStatusLine(room) {
  const caretaker = caretakerProfile(room);
  if (!caretaker) return "未植入";
  const patrol = caretaker.patrol || {};
  const parts = [caretaker.status, patrol.mode, patrol.last_check].filter(Boolean);
  return joinOrFallback(parts, "在线值守");
}

function roomStageSummary(room) {
  if (!room) return "先选一个会话，房间场景会自动接上。";
  const stage = stageProjection(room);
  if (stage?.summary) return stage.summary;
  const caretaker = caretakerProfile(room);
  const summary = roomContextSummary(room);
  if (caretaker?.auto_reply) {
    return `${summary} · ${caretaker.auto_reply}`;
  }
  return summary;
}

function roomStagePortraitSummary(room) {
  if (!room) return "先从左侧选会话，角色资料会跟着出现。";
  const portrait = portraitProjection(room);
  if (portrait?.summary) return portrait.summary;
  const caretaker = caretakerProfile(room);
  if (caretaker) {
    return joinOrFallback(
      [
        `${caretaker.name} · ${caretaker.role_label || "房间管家"}`,
        caretaker.persona,
        caretaker.memory,
        caretaker.auto_reply,
      ],
      roomContextSummary(room),
    );
  }
  return joinOrFallback(
    [room.participant_label, room.overview_summary, room.preview_text, room.subtitle],
    roomContextSummary(room),
  );
}

function roomStagePortraitChips(room) {
  if (!room) {
    return [{ text: "等待选中会话", tone: "muted" }];
  }
  const portrait = portraitProjection(room);
  const caretaker = caretakerProfile(room);
  const chips = [
    {
      text: portrait?.badge || room.scene_banner || translateRoomKindForShellPage(roomKind(room), "user"),
      tone: "warm",
    },
    {
      text: roomAudienceLabel(room),
      tone: "muted",
    },
    {
      text: `${roomMemberCount(room)} 人`,
      tone: "muted",
    },
  ];
  if (Array.isArray(room.search_terms) && room.search_terms.length) {
    chips.push({ text: room.search_terms.join(" · "), tone: "muted" });
  } else if (room.meta) {
    chips.push({ text: room.meta, tone: "muted" });
  }
  if (caretaker) {
    chips.push({
      text: `${caretaker.name} · ${caretaker.role_label || "房间管家"}`,
      tone: "accent",
    });
    chips.push({
      text: portrait?.status || caretaker.status || "在岗",
      tone: "muted",
    });
    if (caretakerPendingCount(room) > 0) {
      chips.push({
        text: `${caretakerPendingCount(room)} 条访客提醒`,
        tone: "warm",
      });
    }
  }
  return chips;
}

function setDatasetFlag(node, key, value) {
  if (!node?.dataset) return;
  if (value == null || value === "") {
    delete node.dataset[key];
    return;
  }
  node.dataset[key] = String(value);
}

const QUICK_ACTION_BLUEPRINTS = {
  "续聊": {
    template: "续聊：",
  },
  "私聊": {
    template: "私聊：",
  },
  "整理": {
    template: ["整理：", "- 目标：", "- 待办：", "- 风险："].join("\n"),
  },
  "留条": {
    template: ["留条：", "- 留给：", "- 内容：", "- 提醒："].join("\n"),
  },
  "委托": {
    template: ["委托：", "- 需求：", "- 截止：", "- 交付："].join("\n"),
  },
  "交易": {
    template: ["交易：", "- 标的：", "- 数量：", "- 备注："].join("\n"),
  },
};

const QUICK_ACTION_INLINE_FIELD_PRIORITY = {
  "整理": ["目标", "待办"],
  "留条": ["留给", "内容"],
  "委托": ["需求", "截止"],
  "交易": ["标的", "数量"],
};

const QUICK_ACTION_INLINE_STATE_FIELD_PRIORITY = {
  "整理": {
    "已归档": ["回看", "新补充"],
  },
  "留条": {
    "已补充": ["补充", "下一步"],
  },
  "委托": {
    "已回执": ["回执", "待确认"],
    "已完成": ["新需求", "截止"],
  },
  "交易": {
    "已确认": ["结果", "待结清"],
    "已结清": ["新标的", "数量"],
  },
};

function conversationShellActionTemplates() {
  const templates = state?.conversation_shell?.action_templates;
  return Array.isArray(templates) ? templates.filter(Boolean) : [];
}

function quickActionContract(action) {
  if (!action) return null;
  return (
    conversationShellActionTemplates().find(
      (item) => typeof item?.action === "string" && item.action.trim() === action,
    ) || null
  );
}

function quickActionContractStateTemplate(action, state = "") {
  if (!action || !state) return null;
  const contract = quickActionContract(action);
  if (!Array.isArray(contract?.state_templates)) return null;
  return (
    contract.state_templates.find(
      (item) => typeof item?.state === "string" && item.state.trim() === state,
    ) || null
  );
}

function quickActionTemplate(action) {
  if (!action) return "";
  const contractTemplate = quickActionContract(action)?.draft_template;
  if (typeof contractTemplate === "string" && contractTemplate.trim()) {
    return contractTemplate;
  }
  return QUICK_ACTION_BLUEPRINTS[action]?.template || `${action}：`;
}

function quickActionWorkflowTemplate(action, state = "") {
  const stateTemplate = quickActionContractStateTemplate(action, state)?.draft_template;
  if (typeof stateTemplate === "string" && stateTemplate.trim()) {
    return stateTemplate;
  }
  switch (action) {
    case "整理":
      if (state === "已归档") {
        return ["整理：", "- 回看：", "- 新补充：", "- 风险："].join("\n");
      }
      return quickActionTemplate(action);
    case "留条":
      if (state === "已补充") {
        return ["留条：", "- 留给：", "- 补充：", "- 下一步："].join("\n");
      }
      return quickActionTemplate(action);
    case "委托":
      if (state === "已完成") {
        return ["委托：", "- 新需求：", "- 截止：", "- 交付："].join("\n");
      }
      if (state === "已回执") {
        return ["委托：", "- 回执：", "- 待确认：", "- 下一步："].join("\n");
      }
      return quickActionTemplate(action);
    case "交易":
      if (state === "已结清") {
        return ["交易：", "- 新标的：", "- 数量：", "- 备注："].join("\n");
      }
      if (state === "已确认") {
        return ["交易：", "- 结果：", "- 待结清：", "- 备注："].join("\n");
      }
      return quickActionTemplate(action);
    default:
      return quickActionTemplate(action);
  }
}

function roomQuickAction(roomId) {
  if (!roomId) return "";
  const value = roomQuickActions?.[roomId];
  return typeof value === "string" ? value : "";
}

function setRoomQuickAction(roomId, action = "") {
  if (!roomId) return;
  if (!action) {
    delete roomQuickActions[roomId];
    return;
  }
  roomQuickActions[roomId] = action;
}

function appendRoomQuickStateAdvanceButton(actions, room, options = {}) {
  const action = latestRoomQuickAction(room);
  const currentState = latestRoomQuickState(room);
  const secondarySpec = inlineActionProfile(room, "secondary");
  const nextAction = secondarySpec?.action || action;
  const nextState = secondarySpec?.next_state || "";
  const label = secondarySpec?.label || quickActionAdvanceLabel(action, currentState);
  if (!actions || !label || !room?.id) return;
  const button = document.createElement("button");
  button.type = "button";
  if (options.className) {
    button.className = options.className;
  }
  if (options.dataset) {
    Object.assign(button.dataset, options.dataset);
  }
  button.textContent = label;
  button.addEventListener("click", () => {
    if (nextState) {
      setRoomQuickAction(room.id, nextAction);
      setRoomQuickState(room.id, nextAction, nextState);
      renderRooms();
      renderTimeline();
      renderConversationOverview();
      renderChatDetailPanel();
      return;
    }
    advanceRoomQuickState(room.id);
  });
  actions.appendChild(button);
}

function syncUserQuickActionButtons(roomId = activeRoomId) {
  if (!chatDetailCardActionsEl) return;
  const activeAction = roomQuickAction(roomId);
  for (const button of chatDetailCardActionsEl.querySelectorAll("[data-card-action]")) {
    const matches = button.dataset.cardAction === activeAction;
    button.classList.toggle("is-active", matches);
    button.setAttribute("aria-pressed", matches ? "true" : "false");
  }
}

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
  summary:
    "我会守住你的会话、记录访客留言，并把自动回复规则写在聊天区下方，确保你随时知道谁在呼叫。",
  highlight: "自动提醒 · 访客留言 · /assistant 召唤",
};
const CARETAKER_MESSAGES = [
  {
    title: "访客留言",
    detail: "访客「阿初」在世界广场问：今晚还要再跑一次设备配置吗？",
    time: "1 分钟前",
  },
  {
    title: "提醒",
    detail: "你刚才提到 `/assistant`，我会自动回复「小狗在」并准备访客卡片。",
    time: "刚刚",
  },
];
const CARETAKER_RULES = [
  "会话空闲 5 分钟自动回复「小狗在，继续说吧」，并通知你有人等候。",
  "提到 `/owner` 或 `/assistant` 时记录访客留言并同步给待办。",
];
const CARETAKER_AUTOMATION_NOTE = CARETAKER_RULES[0];
const CARETAKER_VISITOR_PREVIEW = CARETAKER_MESSAGES[0].detail;

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

function resolveShellMode() {
  const fixed = (document.body?.dataset?.defaultShellMode || "").trim().toLowerCase();
  if (fixed === "user" || fixed === "admin" || fixed === "unified") {
    return fixed;
  }
  const url = new URL(window.location.href);
  const mode = (url.searchParams.get("mode") || "").trim().toLowerCase();
  if (mode === "user" || mode === "admin") {
    return mode;
  }
  return "unified";
}

function shellModeConfig(mode) {
  switch (mode) {
    case "user":
      return {
        eyebrow: "龙虾聊天 · 房间聊天",
        title: "房间内聊天主界面",
        hero:
          "左边放会话，右边直接进房间聊；把房间外的工具收进边缘，不抢主聊的注意力。",
        guide: [
          "左侧先选会话，再回到中间直接开口。",
          "回车发送，Shift+Enter 换行，ArrowUp 拉回上一句。",
          "没接网关也能先聊，本地预览会保持在当前会话。",
          "房间外的工具都收在边缘，不抢第一屏。",
        ],
      };
    case "admin":
      return {
        eyebrow: "龙虾聊天 · 管理后台",
        title: "左侧选工具，中间处理当前事务",
        hero:
          "后台按会话、居民、房间、安全、公告、世界和系统分组；日常先处理会话，高风险动作默认收起。",
        guide: [
          "先看当前会话，再决定是否要发公告或处理安全动作。",
          "左侧目录负责找工具，右侧只显示当前对象相关动作。",
          "高级世界管理和高风险动作默认收起。",
          "群聊、私聊和后台动作都围绕当前窗口。",
        ],
      };
    default:
      return {
        eyebrow: "龙虾聊天 · 城市外世界页",
        title: "城市外世界页",
        hero:
          "把主聊放在中间，把城市外壳按来源、城市、公告、安全、身份顺序排开。",
        guide: [
          "1. 接入来源，确认消息从哪里来。",
          "2. 城市和房间，按层级把对象放对位置。",
          "3. 公告、安全、审查和身份，各自归类。",
          "4. 每个栏目都先写用途，再放操作项。",
        ],
      };
  }
}

function translateShellMode(mode) {
  switch (mode) {
    case "user":
      return "房间聊天";
    case "admin":
      return "管理后台";
    default:
      return "城市外世界页";
  }
}

function defaultIdentityForShellMode(mode) {
  switch (mode) {
    case "user":
      return "访客";
    case "admin":
      return "rsaga";
    default:
      return "builder";
  }
}

function defaultActiveRoomId(rooms = []) {
  const preferred = document.body?.dataset?.defaultRoomId;
  if (preferred && rooms.some((room) => room.id === preferred)) {
    return preferred;
  }
  const shellVariant = document.body?.dataset?.shellVariant;
  if (shellVariant === "creative-terminal") {
    return rooms.find((room) => roomKind(room) === "direct")?.id ?? rooms[0]?.id ?? null;
  }
  if (shellVariant === "public-square") {
    return rooms.find((room) => room.id === "room:world:lobby")?.id
      ?? rooms.find((room) => roomKind(room) === "public")?.id
      ?? rooms[0]?.id
      ?? null;
  }
  return rooms[0]?.id ?? null;
}

function applyShellMode() {
  shellMode = resolveShellMode();
  const shellPage = currentShellPage();
  const compactShell = shellPage === "user" || shellPage === "admin";
  const config = shellModeConfig(shellMode);
  document.body.dataset.shellMode = shellMode;
  document.body.dataset.chromeDensity = compactShell ? "compact" : "full";
  updateShellEntryCards(shellMode);
  if (shellModeBadgeEl) {
    shellModeBadgeEl.textContent =
      shellPage === "hub"
        ? "入口：聊天入口"
        : `入口：${translateShellMode(shellMode)}`;
    shellModeBadgeEl.classList.toggle("shell-hidden", compactShell);
  }
  if (shellPage !== "hub" && shellPage !== "world-entry") {
    document.title = `龙虾聊天 · ${translateShellMode(shellMode)}`;
  }
  if (mastheadEyebrowEl) {
    mastheadEyebrowEl.textContent = shellPage === "hub" ? "龙虾聊天" : config.eyebrow;
  }
  if (mastheadTitleEl) {
    mastheadTitleEl.textContent = shellPage === "hub" ? "选一个房间开始" : config.title;
  }
  if (heroNoteEl) {
    heroNoteEl.textContent = config.hero;
  }
  if (modeGuideEl) {
    clearChildren(modeGuideEl);
    for (const item of config.guide) {
      const div = document.createElement("div");
      div.className = "guide-item";
      div.textContent = item;
      modeGuideEl.appendChild(div);
    }
  }
  if (entryGridEl) {
    entryGridEl.classList.toggle("shell-hidden", shellPage !== "hub");
  }
  transportStateEl?.classList.toggle("shell-hidden", compactShell);
  storageStateEl?.classList.toggle("shell-hidden", compactShell);
  gatewayStateEl?.classList.toggle("shell-hidden", compactShell);
  providerStateEl?.classList.toggle("shell-hidden", compactShell);
  worldStateEl?.classList.toggle("shell-hidden", compactShell);

  const hideAdmin = shellMode === "user";
  for (const element of document.querySelectorAll("[data-shell-role='admin']")) {
    element.classList.toggle("shell-hidden", hideAdmin);
  }

  updatePanelTitles();
  ensureConversationCallout();
  updateConversationCallout();
}

function updateShellEntryCards(mode) {
  for (const card of shellEntryCards) {
    const isActive = card.dataset.shellEntry === mode;
    card.classList.toggle("active", isActive);
    if (isActive) {
      card.setAttribute("aria-current", "page");
    } else {
      card.removeAttribute("aria-current");
    }
  }
}

function safeLocalStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

function setNodeText(node, text) {
  if (node) {
    node.textContent = text;
  }
}

function loadChatFocusPreference() {
  return safeLocalStorageGet(CHAT_FOCUS_STORAGE_KEY) === "true";
}

function persistChatFocusPreference(value) {
  safeLocalStorageSet(CHAT_FOCUS_STORAGE_KEY, value ? "true" : "false");
}

function applyChatFocusState() {
  if (chatFocusMode) {
    document.body.dataset.chatFocus = "true";
    layoutEl?.classList.add("layout-chat-focus");
  } else {
    delete document.body.dataset.chatFocus;
    layoutEl?.classList.remove("layout-chat-focus");
  }
  updateChatPriorityBadgeText();
}

function setChatFocusMode(value, { persistPreference = false } = {}) {
  chatFocusMode = value;
  if (persistPreference) {
    chatFocusPreference = value;
    persistChatFocusPreference(value);
  }
  applyChatFocusState();
}

function toggleChatFocusMode() {
  setChatFocusMode(!chatFocusMode, { persistPreference: true });
}

function ensureChatFocusToggle() {
  if (!conversationPanelEl) return;
  if (!chatFocusToggleButtonEl) {
    chatFocusToggleButtonEl = document.createElement("button");
    chatFocusToggleButtonEl.type = "button";
    chatFocusToggleButtonEl.className = "chat-focus-toggle";
    chatFocusToggleButtonEl.addEventListener("click", () => {
      toggleChatFocusMode();
      ensureChatFocusToggle();
    });
  }
  if (!chatFocusToggleButtonEl.isConnected) {
    const anchor = roomViewToggleButtonEl || conversationPanelEl.querySelector(".panel-title");
    if (anchor) {
      anchor.insertAdjacentElement("afterend", chatFocusToggleButtonEl);
    } else {
      conversationPanelEl.prepend(chatFocusToggleButtonEl);
    }
  }
  updateChatFocusToggleVisibility();
  updateChatFocusToggleText();
}

function updateChatFocusToggleText() {
  if (!chatFocusToggleButtonEl) return;
  chatFocusToggleButtonEl.textContent = chatFocusMode ? "退出专注" : "专注聊天";
  chatFocusToggleButtonEl.setAttribute("aria-pressed", chatFocusMode ? "true" : "false");
}

function updateChatFocusToggleVisibility() {
  if (!chatFocusToggleButtonEl) return;
  chatFocusToggleButtonEl.style.display = currentWorkspace === "chat" ? "inline-flex" : "none";
}

function syncChatFocusWithWorkspace() {
  if (currentWorkspace !== "chat" && chatFocusMode) {
    setChatFocusMode(false);
  } else if (currentWorkspace === "chat" && !chatFocusMode && chatFocusPreference) {
    setChatFocusMode(true);
  }
}

function workspaceStorageKey() {
  return `lobster-workspace:${currentShellPage()}:${shellMode}`;
}

function chatPaneStorageKey() {
  return `lobster-chat-pane:${currentShellPage()}:${shellMode}`;
}

function roomReadMarkersStorageKey() {
  return `lobster-room-read-markers:${currentShellPage()}:${shellMode}`;
}

function roomDraftsStorageKey() {
  return `lobster-room-drafts:${currentShellPage()}:${shellMode}`;
}

function roomQuickStatesStorageKey() {
  return `lobster-room-quick-states:${currentShellPage()}:${shellMode}`;
}

function roomQuickSnapshotsStorageKey() {
  return `lobster-room-quick-snapshots:${currentShellPage()}:${shellMode}`;
}

function defaultWorkspaceForShellMode(mode) {
  return "chat";
}

function availableWorkspacesForShellMode(mode) {
  return mode === "user"
    ? ["chat"]
    : ["chat", "world", "auth", "governance"];
}

function translateWorkspace(workspace) {
  switch (workspace) {
    case "world":
      return "广场";
    case "auth":
      return "身份";
    case "governance":
      return "后台";
    default:
      return "聊天";
  }
}

function resolveWorkspace() {
  const shellPage = currentShellPage();
  if (shellPage === "user" || shellPage === "admin" || shellPage === "unified") {
    return "chat";
  }
  const allowed = availableWorkspacesForShellMode(shellMode);
  const url = new URL(window.location.href);
  const query = (url.searchParams.get("surface") || "").trim().toLowerCase();
  if (allowed.includes(query)) {
    return query;
  }
  const stored = safeLocalStorageGet(workspaceStorageKey());
  if (allowed.includes(stored)) {
    return stored;
  }
  return defaultWorkspaceForShellMode(shellMode);
}

function defaultChatPaneForViewport() {
  if (window.matchMedia("(max-width: 960px)").matches) {
    return activeRoomId ? "thread" : "list";
  }
  return "split";
}

function resolveChatPaneMode() {
  const stored = safeLocalStorageGet(chatPaneStorageKey());
  if (stored === "list" || stored === "thread" || stored === "split") {
    return stored;
  }
  return defaultChatPaneForViewport();
}

function loadRoomReadMarkers() {
  try {
    const raw = safeLocalStorageGet(roomReadMarkersStorageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function loadRoomDrafts() {
  try {
    const raw = safeLocalStorageGet(roomDraftsStorageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function loadRoomQuickStates() {
  try {
    const raw = safeLocalStorageGet(roomQuickStatesStorageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function loadRoomQuickSnapshots() {
  try {
    const raw = safeLocalStorageGet(roomQuickSnapshotsStorageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistRoomReadMarkers() {
  safeLocalStorageSet(roomReadMarkersStorageKey(), JSON.stringify(roomReadMarkers));
}

function persistRoomDrafts() {
  safeLocalStorageSet(roomDraftsStorageKey(), JSON.stringify(roomDrafts));
}

function persistRoomQuickStates() {
  safeLocalStorageSet(roomQuickStatesStorageKey(), JSON.stringify(roomQuickStates));
}

function persistRoomQuickSnapshots() {
  safeLocalStorageSet(roomQuickSnapshotsStorageKey(), JSON.stringify(roomQuickSnapshots));
}

function draftForRoom(roomId) {
  if (!roomId) return "";
  return typeof roomDrafts?.[roomId] === "string" ? roomDrafts[roomId] : "";
}

function roomHasDraft(roomId) {
  return Boolean(draftForRoom(roomId).trim());
}

function updateRoomDraft(roomId, value) {
  if (!roomId) return;
  const nextValue = typeof value === "string" ? value : "";
  if (nextValue.trim()) {
    roomDrafts[roomId] = nextValue;
  } else {
    delete roomDrafts[roomId];
  }
  persistRoomDrafts();
}

function pendingEchoesForRoom(roomId) {
  return Array.isArray(pendingMessageEchoes?.[roomId]) ? pendingMessageEchoes[roomId] : [];
}

function normalizedMessageText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function messageMatchesPendingEcho(message, pending) {
  if (!message || !pending) return false;
  return (
    normalizedMessageText(message.sender) === normalizedMessageText(pending.sender) &&
    normalizedMessageText(message.text) === normalizedMessageText(pending.text) &&
    normalizedMessageText(message.quick_action) === normalizedMessageText(pending.quick_action)
  );
}

function visiblePendingEchoesForRoom(room) {
  if (!room?.id) return [];
  const committed = Array.isArray(room.messages) ? room.messages : [];
  return pendingEchoesForRoom(room.id).filter(
    (pending) =>
      pending.failed || !committed.some((message) => messageMatchesPendingEcho(message, pending)),
  );
}

function visiblePendingEchoCount(room) {
  return visiblePendingEchoesForRoom(room).length;
}

function enqueuePendingEcho(roomId, text, quickAction = "") {
  const echo = {
    id: `pending:${Date.now()}:${Math.random().toString(16).slice(2, 8)}`,
    sender: currentIdentity(),
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    text,
    quick_action: quickAction,
    pending: true,
    failed: false,
  };
  pendingMessageEchoes[roomId] = [...pendingEchoesForRoom(roomId), echo];
  return echo.id;
}

function markPendingEchoFailed(roomId, echoId, failed) {
  pendingMessageEchoes[roomId] = pendingEchoesForRoom(roomId).map((item) =>
    item.id === echoId ? { ...item, failed } : item,
  );
}

function clearPendingEchoes(roomId) {
  delete pendingMessageEchoes[roomId];
}

function clearAllPendingEchoes() {
  pendingMessageEchoes = {};
}

function latestRoomMessageLike(room) {
  if (!room) return null;
  const committed = Array.isArray(room.messages) ? room.messages : [];
  const pending = visiblePendingEchoesForRoom(room);
  const combined = [...committed, ...pending];
  return combined[combined.length - 1] || null;
}

function latestStructuredQuickActionPreview(room, action = "", state = "", snapshotIndex = null) {
  if (!room || !action) return null;
  const snapshot = roomQuickSnapshot(room.id, action, state, snapshotIndex);
  if (snapshot) return snapshot;
  const committed = Array.isArray(room.messages) ? room.messages : [];
  const pending = visiblePendingEchoesForRoom(room);
  const combined = [...committed, ...pending];
  for (let index = combined.length - 1; index >= 0; index -= 1) {
    const message = combined[index];
    const messageAction = typeof message?.quick_action === "string" ? message.quick_action.trim() : "";
    if (messageAction !== action) continue;
    const structured = parseStructuredQuickActionMessage(message);
    if (structured) return structured;
  }
  return null;
}

function latestRoomQuickAction(room) {
  const action = latestRoomMessageLike(room)?.quick_action;
  if (typeof action === "string" && action.trim()) return action.trim();
  const workflowAction = workflowProfile(room)?.action;
  return typeof workflowAction === "string" ? workflowAction.trim() : "";
}

function quickActionStatusCopy(action) {
  switch (action) {
    case "整理":
      return "当前窗口正在收拢目标、待办和风险。";
    case "留条":
      return "当前窗口保留了一条待补充的留言备注。";
    case "委托":
      return "当前窗口正在跟进需求、截止和交付。";
    case "交易":
      return "当前窗口正在记录标的、数量和备注。";
    case "续聊":
      return "当前窗口正沿着原话题继续往下聊。";
    case "私聊":
      return "当前窗口正按一对一沟通继续推进。";
    default:
      return action ? "当前窗口正按这个动作继续推进。" : "";
  }
}

function quickActionTone(action) {
  switch (action) {
    case "整理":
    case "留条":
      return "accent";
    case "委托":
    case "交易":
      return "warm";
    case "续聊":
    case "私聊":
      return "muted";
    default:
      return "muted";
  }
}

function quickActionIntensity(action) {
  switch (action) {
    case "委托":
    case "交易":
      return "strong";
    case "整理":
    case "留条":
      return "steady";
    case "续聊":
    case "私聊":
      return "soft";
    default:
      return "";
  }
}

function quickActionOverviewSummary(action) {
  switch (action) {
    case "整理":
      return "整理中：先补全目标、待办和风险。";
    case "留条":
      return "留条中：先记下背景、提醒和下一步。";
    case "委托":
      return "委托中：先确认需求、截止和交付。";
    case "交易":
      return "交易中：先核对标的、数量和备注。";
    case "续聊":
      return "续聊中：沿着原话题继续往下推进。";
    case "私聊":
      return "私聊中：保持一对一推进当前话题。";
    default:
      return "";
  }
}

function quickActionOverviewCtaLabel(action, state = "") {
  switch (action) {
    case "整理":
      return state === "已归档" ? "重开整理" : "继续整理";
    case "留条":
      return state === "已补充" ? "追加留条" : "补全留条";
    case "委托":
      if (state === "已完成") return "重开委托";
      return state === "已回执" ? "补充委托" : "跟进委托";
    case "交易":
      if (state === "已结清") return "新建交易";
      return state === "已确认" ? "补充交易" : "继续交易";
    case "续聊":
      return state === "已续上" ? "再续一句" : "继续续聊";
    case "私聊":
      return state === "已回复" ? "继续跟进" : "继续私聊";
    default:
      return "";
  }
}

function quickActionSendLabel(action) {
  const contractSendLabel = quickActionContract(action)?.send_label;
  if (typeof contractSendLabel === "string" && contractSendLabel.trim()) {
    return contractSendLabel;
  }
  switch (action) {
    case "整理":
      return "提交整理";
    case "留条":
      return "留下便条";
    case "委托":
      return "发出委托";
    case "交易":
      return "记录交易";
    case "续聊":
      return "继续发送";
    case "私聊":
      return "发起私聊";
    default:
      return "发送";
  }
}

function quickActionDraftStatusCopy(action, length) {
  switch (action) {
    case "整理":
      return `整理草稿已暂存 · ${length} 字 · 发出后会落成结构化整理卡`;
    case "留条":
      return `留条草稿已暂存 · ${length} 字 · 发出后会落成结构化便条`;
    case "委托":
      return `委托草稿已暂存 · ${length} 字 · 发出后会落成结构化委托单`;
    case "交易":
      return `交易草稿已暂存 · ${length} 字 · 发出后会落成结构化交易卡`;
    case "续聊":
      return `续聊草稿已暂存 · ${length} 字`;
    case "私聊":
      return `私聊草稿已暂存 · ${length} 字`;
    default:
      return "";
  }
}

function quickActionFollowUpLabel(action, state = "") {
  return quickActionStage(action, state)?.label || "";
}

function quickActionFollowUpCopy(action, state = "") {
  return quickActionStage(action, state)?.copy || "";
}

function quickActionStateStages(action) {
  switch (action) {
    case "整理":
      return [
        { label: "待归档", copy: "整理卡已发出，后续需要归档或继续补全。", advanceLabel: "标记已归档" },
        { label: "已归档", copy: "整理卡已经归档，可以继续回看或重开新卡。" },
      ];
    case "留条":
      return [
        { label: "待补充", copy: "便条已留下，后续可以补充背景或提醒。", advanceLabel: "标记已补充" },
        { label: "已补充", copy: "便条内容已经补齐，后续可按此继续处理。" },
      ];
    case "委托":
      return [
        { label: "待回执", copy: "委托单已发出，后续等待回执或补充交付。", advanceLabel: "标记已回执" },
        { label: "已回执", copy: "委托已有回执，后续等待确认完成。", advanceLabel: "标记已完成" },
        { label: "已完成", copy: "委托已经完成，本轮交付已收口。" },
      ];
    case "交易":
      return [
        { label: "待确认", copy: "交易卡已记录，后续需要确认执行结果。", advanceLabel: "标记已确认" },
        { label: "已确认", copy: "交易结果已确认，后续等待结清。", advanceLabel: "标记已结清" },
        { label: "已结清", copy: "交易已经结清，本轮记录可归档。" },
      ];
    case "续聊":
      return [
        { label: "进行中", copy: "当前话题仍在推进中，可继续往下聊。", advanceLabel: "标记已续上" },
        { label: "已续上", copy: "这轮续聊已经接上，后续可自然回到普通聊天。" },
      ];
    case "私聊":
      return [
        { label: "待回复", copy: "一对一话题已经发起，后续等待对方回复。", advanceLabel: "标记已回复" },
        { label: "已回复", copy: "私聊已经收到回复，可以继续推进后续话题。" },
      ];
    default:
      return [];
  }
}

function workflowProgressStageState(index, currentIndex) {
  if (index < currentIndex) return "done";
  if (index === currentIndex) return "current";
  return "upcoming";
}

function createWorkflowProgress(action, state = "", options = {}) {
  const stages =
    Array.isArray(options.stages) && options.stages.length
      ? options.stages
      : quickActionStateStages(action);
  if (!stages.length) return null;

  const currentIndex = Math.max(
    stages.findIndex((stage) => stage.label === state),
    0,
  );
  const progress = document.createElement("div");
  progress.className = "workflow-progress";
  if (options.className) {
    progress.classList.add(...String(options.className).split(/\s+/).filter(Boolean));
  }
  setDatasetFlag(progress, "actionIntensity", quickActionIntensity(action));
  setDatasetFlag(progress, "quickAction", action);

  if (options.title) {
    progress.appendChild(createLine("workflow-progress-title", options.title));
  }

  const steps = document.createElement("div");
  steps.className = "workflow-progress-steps";

  for (let index = 0; index < stages.length; index += 1) {
    const stage = stages[index];
    const step = document.createElement("div");
    step.className = "workflow-progress-step";
    setDatasetFlag(step, "stageState", workflowProgressStageState(index, currentIndex));
    setDatasetFlag(step, "stageLabel", stage.label);
    if (typeof options.onStageClick === "function") {
      step.setAttribute("role", "button");
      step.tabIndex = 0;
      step.addEventListener("click", () => {
        options.onStageClick(stage, index);
      });
    }

    const marker = document.createElement("span");
    marker.className = "workflow-progress-marker";
    marker.textContent = String(index + 1);

    const label = document.createElement("span");
    label.className = "workflow-progress-label";
    label.textContent = stage.label;

    step.append(marker, label);
    steps.appendChild(step);
  }

  progress.appendChild(steps);
  return progress;
}

function roomQuickStateRecord(roomId) {
  if (!roomId) return null;
  const record = roomQuickStates?.[roomId];
  return record && typeof record === "object" ? record : null;
}

function roomQuickPreviewRecord(roomId) {
  if (!roomId) return null;
  const record = roomQuickStatePreviews?.[roomId];
  return record && typeof record === "object" ? record : null;
}

function roomQuickSnapshotHistory(roomId, action = "", state = "") {
  if (!roomId || !action || !state) return [];
  const roomRecord = roomQuickSnapshots?.[roomId];
  if (!roomRecord || typeof roomRecord !== "object") return [];
  const actionRecord = roomRecord?.[action];
  if (!actionRecord || typeof actionRecord !== "object") return [];
  const raw = actionRecord?.[state];
  if (Array.isArray(raw)) {
    return raw.filter((item) => item && typeof item === "object");
  }
  if (raw && typeof raw === "object") {
    return [raw];
  }
  return [];
}

function roomQuickSnapshot(roomId, action = "", state = "", snapshotIndex = null) {
  const history = roomQuickSnapshotHistory(roomId, action, state);
  if (!history.length) return null;
  if (Number.isInteger(snapshotIndex) && snapshotIndex >= 0 && snapshotIndex < history.length) {
    return history[snapshotIndex];
  }
  return history[history.length - 1] || null;
}

function latestRoomQuickSnapshotIndex(roomId, action = "", state = "") {
  const history = roomQuickSnapshotHistory(roomId, action, state);
  return history.length ? history.length - 1 : -1;
}

function normalizeQuickActionStructured(structured, fallbackAction = "") {
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

function quickActionStructuredDraft(structured, fallbackAction = "") {
  const normalized = normalizeQuickActionStructured(structured, fallbackAction);
  const action = normalized?.action || fallbackAction;
  if (!normalized || !action) return quickActionTemplate(fallbackAction);
  const lines = [`${action}：`];
  for (const field of normalized.fields) {
    const label = String(field.label || "")
      .replace(/^[\-\u2022\s]+/u, "")
      .replace(/[：:]\s*$/u, "")
      .trim();
    if (!label) continue;
    lines.push(`- ${label}：${String(field.value || "").trim()}`);
  }
  if (normalized.notes.length) {
    lines.push(...normalized.notes);
  }
  return lines.join("\n");
}

function setRoomQuickSnapshot(roomId, action = "", state = "", structured = null) {
  if (!roomId || !action || !state) return;
  const normalized = normalizeQuickActionStructured(structured, action);
  if (!normalized) return;
  const roomRecord =
    roomQuickSnapshots?.[roomId] && typeof roomQuickSnapshots[roomId] === "object"
      ? { ...roomQuickSnapshots[roomId] }
      : {};
  const actionRecord =
    roomRecord?.[action] && typeof roomRecord[action] === "object"
      ? { ...roomRecord[action] }
      : {};
  const history = roomQuickSnapshotHistory(roomId, action, state);
  actionRecord[state] = [...history, {
    action: normalized.action || action,
    state,
    fields: normalized.fields.map((field) => ({ ...field })),
    notes: [...normalized.notes],
    capturedAtMs: Date.now(),
  }];
  roomRecord[action] = actionRecord;
  roomQuickSnapshots[roomId] = roomRecord;
  persistRoomQuickSnapshots();
}

function captureRoomQuickSnapshotFromText(roomId, action = "", state = "", text = "") {
  if (!roomId || !action || !state || !text) return;
  setRoomQuickSnapshot(
    roomId,
    action,
    state,
    parseStructuredQuickActionMessage({
      text,
      quick_action: action,
    }),
  );
}

function roomQuickState(roomId, action = roomQuickAction(roomId)) {
  if (!roomId || !action) return "";
  const stages = quickActionStateStages(action);
  if (!stages.length) return "";
  const record = roomQuickStateRecord(roomId);
  if (record?.action === action && stages.some((stage) => stage.label === record.state)) {
    return record.state;
  }
  return stages[0].label;
}

function setRoomQuickState(roomId, action = "", state = "") {
  if (!roomId || !action || !state) {
    delete roomQuickStates[roomId];
    persistRoomQuickStates();
    return;
  }
  roomQuickStates[roomId] = { action, state };
  persistRoomQuickStates();
}

function resetRoomQuickState(roomId, action = "") {
  const stages = quickActionStateStages(action);
  if (!roomId || !stages.length) {
    setRoomQuickState(roomId, "", "");
    return "";
  }
  setRoomQuickState(roomId, action, stages[0].label);
  return stages[0].label;
}

function quickActionStage(action, state = "") {
  const stages = quickActionStateStages(action);
  return stages.find((stage) => stage.label === state) || stages[0] || null;
}

function roomQuickStage(roomId, action) {
  return quickActionStage(action, roomQuickState(roomId, action));
}

function roomQuickPreviewState(roomId, action = roomQuickAction(roomId)) {
  if (!roomId || !action) return "";
  const stages = quickActionStateStages(action);
  if (!stages.length) return "";
  const record = roomQuickPreviewRecord(roomId);
  if (record?.action === action && stages.some((stage) => stage.label === record.state)) {
    return record.state;
  }
  return "";
}

function roomQuickPreviewSnapshotIndex(roomId, action = roomQuickAction(roomId), state = roomQuickPreviewState(roomId, action)) {
  if (!roomId || !action || !state) return null;
  const history = roomQuickSnapshotHistory(roomId, action, state);
  if (!history.length) return null;
  const record = roomQuickPreviewRecord(roomId);
  if (
    record?.action === action &&
    record?.state === state &&
    Number.isInteger(record.snapshotIndex) &&
    record.snapshotIndex >= 0 &&
    record.snapshotIndex < history.length
  ) {
    return record.snapshotIndex;
  }
  return history.length - 1;
}

function defaultRoomQuickPreviewFieldView(roomId, action = "", state = "", snapshotIndex = null) {
  const history = roomQuickSnapshotHistory(roomId, action, state);
  if (!history.length) return "stage";
  if (Number.isInteger(snapshotIndex) && snapshotIndex >= 0 && snapshotIndex < history.length) {
    return snapshotIndex === history.length - 1 ? "stage" : "snapshot";
  }
  return "stage";
}

function roomQuickPreviewFieldView(
  roomId,
  action = roomQuickAction(roomId),
  state = roomQuickPreviewState(roomId, action),
  snapshotIndex = roomQuickPreviewSnapshotIndex(roomId, action, state),
) {
  if (!roomId || !action || !state) return "stage";
  const history = roomQuickSnapshotHistory(roomId, action, state);
  const resolvedSnapshotIndex =
    Number.isInteger(snapshotIndex) && snapshotIndex >= 0 && snapshotIndex < history.length
      ? snapshotIndex
      : history.length
      ? history.length - 1
      : null;
  const record = roomQuickPreviewRecord(roomId);
  const recordSnapshotIndex =
    Number.isInteger(record?.snapshotIndex) && record.snapshotIndex >= 0
      ? record.snapshotIndex
      : history.length
      ? history.length - 1
      : null;
  if (
    record?.action === action &&
    record?.state === state &&
    recordSnapshotIndex === resolvedSnapshotIndex &&
    (record?.fieldView === "stage" || record?.fieldView === "snapshot")
  ) {
    return record.fieldView;
  }
  return defaultRoomQuickPreviewFieldView(roomId, action, state, resolvedSnapshotIndex);
}

function setRoomQuickPreview(roomId, action = "", state = "", snapshotIndex = null, fieldView = "") {
  if (!roomId || !action || !state) {
    delete roomQuickStatePreviews[roomId];
    return;
  }
  roomQuickStatePreviews[roomId] = {
    action,
    state,
    ...(Number.isInteger(snapshotIndex) && snapshotIndex >= 0 ? { snapshotIndex } : {}),
    ...((fieldView === "stage" || fieldView === "snapshot") ? { fieldView } : {}),
  };
}

function setRoomQuickPreviewFieldView(roomId, action = "", previewState = "", snapshotIndex = null, fieldView = "") {
  if (!roomId || !action || !previewState || (fieldView !== "stage" && fieldView !== "snapshot")) return;
  setRoomQuickPreview(roomId, action, previewState, snapshotIndex, fieldView);
  renderRooms();
  renderConversationOverview();
  renderChatDetailPanel();
  if (currentShellPage() === "user" && roomId === activeRoomId) {
    const room = state.rooms.find((item) => item.id === roomId);
    syncRoomStageCanvas(room);
  }
}

function roomQuickPreviewCardFieldView(
  roomId,
  action = roomQuickAction(roomId),
  state = roomQuickPreviewState(roomId, action),
  snapshotIndex = roomQuickPreviewSnapshotIndex(roomId, action, state),
) {
  if (!roomId || !action || !state) return "snapshot";
  const history = roomQuickSnapshotHistory(roomId, action, state);
  const resolvedSnapshotIndex =
    Number.isInteger(snapshotIndex) && snapshotIndex >= 0 && snapshotIndex < history.length
      ? snapshotIndex
      : history.length
        ? history.length - 1
        : null;
  const record = roomQuickPreviewRecord(roomId);
  const recordSnapshotIndex =
    Number.isInteger(record?.snapshotIndex) && record.snapshotIndex >= 0
      ? record.snapshotIndex
      : history.length
        ? history.length - 1
        : null;
  if (
    record?.action === action &&
    record?.state === state &&
    recordSnapshotIndex === resolvedSnapshotIndex &&
    (record?.cardFieldView === "stage" || record?.cardFieldView === "snapshot")
  ) {
    return record.cardFieldView;
  }
  return "snapshot";
}

function setRoomQuickPreviewCardFieldView(
  roomId,
  action = "",
  previewState = "",
  snapshotIndex = null,
  fieldView = "",
) {
  if (!roomId || !action || !previewState || (fieldView !== "stage" && fieldView !== "snapshot")) return;
  const record = roomQuickPreviewRecord(roomId) || {};
  roomQuickStatePreviews[roomId] = {
    ...record,
    action,
    state: previewState,
    ...(Number.isInteger(snapshotIndex) && snapshotIndex >= 0 ? { snapshotIndex } : {}),
    cardFieldView: fieldView,
  };
  renderConversationOverview();
  renderChatDetailPanel();
  if (currentShellPage() === "user" && roomId === activeRoomId) {
    const room = state.rooms.find((item) => item.id === roomId);
    syncRoomStageCanvas(room);
  }
}

function previewRoomQuickStage(roomId, action = "", previewState = "", snapshotIndex = null) {
  if (!roomId || !action || !previewState) {
    setRoomQuickPreview(roomId, "", "");
  } else {
    setRoomQuickPreview(roomId, action, previewState, snapshotIndex);
  }
  renderRooms();
  renderConversationOverview();
  renderChatDetailPanel();
  if (currentShellPage() === "user" && roomId === activeRoomId) {
    const room = state.rooms.find((item) => item.id === roomId);
    syncRoomStageCanvas(room);
  }
}

function nextQuickActionState(action, state = "") {
  const stages = quickActionStateStages(action);
  const index = stages.findIndex((stage) => stage.label === state);
  if (index < 0 || index >= stages.length - 1) return "";
  return stages[index + 1].label;
}

function quickActionAdvanceLabel(action, state = "") {
  return quickActionStage(action, state)?.advanceLabel || "";
}

function roomQuickPreviewSummary(room) {
  const preview = resolveRoomQuickPreview(room);
  if (!preview) return "";
  const fieldView = roomQuickPreviewFieldView(room.id, preview.action, preview.state, preview.snapshotIndex);
  return resolveQuickActionPreviewView(preview, fieldView)?.summaryText || "";
}

function roomQuickPreviewHistoryLabel(room, action = latestRoomQuickAction(room), previewState = roomQuickPreviewState(room?.id, action)) {
  if (!room?.id || !action || !previewState) return "";
  const history = roomQuickSnapshotHistory(room.id, action, previewState);
  const snapshotIndex = roomQuickPreviewSnapshotIndex(room.id, action, previewState);
  if (!history.length || snapshotIndex == null || snapshotIndex < 0 || snapshotIndex >= history.length) {
    return "";
  }
  return quickActionPreviewHistoryLabel(history[snapshotIndex], snapshotIndex, history.length);
}

function roomQuickPreviewHistoryToneClass(room, action = latestRoomQuickAction(room), previewState = roomQuickPreviewState(room?.id, action)) {
  if (!room?.id || !action || !previewState) return "";
  const history = roomQuickSnapshotHistory(room.id, action, previewState);
  const snapshotIndex = roomQuickPreviewSnapshotIndex(room.id, action, previewState);
  if (!history.length || history.length <= 1 || snapshotIndex == null || snapshotIndex < 0 || snapshotIndex >= history.length) {
    return "";
  }
  return snapshotIndex === history.length - 1 ? "summary-round" : "summary-history";
}

function resolveRoomQuickPreview(room, action = latestRoomQuickAction(room)) {
  if (!room?.id || !action) return null;
  const state = roomQuickPreviewState(room.id, action);
  if (!state) return null;
  const history = roomQuickSnapshotHistory(room.id, action, state);
  const snapshotIndex = roomQuickPreviewSnapshotIndex(room.id, action, state);
  const structured = latestStructuredQuickActionPreview(room, action, state, snapshotIndex);
  const historyLabel = roomQuickPreviewHistoryLabel(room, action, state);
  const followUpCopy = quickActionFollowUpCopy(action, state);
  const detailParts = [state, historyLabel, followUpCopy].filter(Boolean);
  return {
    action,
    state,
    history,
    snapshotIndex,
    structured,
    historyLabel,
    historyToneClass: roomQuickPreviewHistoryToneClass(room, action, state),
    followUpCopy,
    detailText: detailParts.join(" · "),
    summaryText: `阶段预览：${detailParts.join(" · ")}`,
  };
}

function quickActionPreviewFieldViewLabel(fieldView = "snapshot") {
  return fieldView === "stage" ? "阶段字段" : "原始快照";
}

function resolveQuickActionPreviewView(preview, fieldView = "snapshot") {
  if (!preview?.action || !preview?.state || !preview?.structured) return null;
  const resolvedFieldView = fieldView === "stage" ? "stage" : "snapshot";
  const structuredViews = quickActionPreviewStructuredViews(
    preview.action,
    preview.state,
    preview.structured,
  );
  const activeStructured =
    resolvedFieldView === "stage" ? structuredViews.stageStructured : structuredViews.snapshotStructured;
  const primaryField = quickActionPreviewPrimaryField(activeStructured);
  const primaryFieldText = quickActionPreviewPrimaryFieldText(activeStructured);
  const summaryCopy =
    resolvedFieldView === "stage"
      ? preview.followUpCopy || primaryFieldText
      : primaryFieldText || preview.followUpCopy;
  const detailParts = [preview.state, preview.historyLabel, summaryCopy].filter(Boolean);
  return {
    ...preview,
    fieldView: resolvedFieldView,
    fieldViewLabel: quickActionPreviewFieldViewLabel(resolvedFieldView),
    activeStructured,
    primaryField,
    primaryFieldText,
    summaryCopy,
    detailText: detailParts.join(" · "),
    summaryText: `${quickActionPreviewFieldViewLabel(resolvedFieldView)}：${detailParts.join(" · ")}`,
  };
}

function createQuickActionPreviewSummaryLine(preview, options = {}) {
  if (!preview?.state) return null;
  const resolvedPreview =
    resolveQuickActionPreviewView(preview, options.fieldView) ||
    resolveQuickActionPreviewView(preview, "snapshot");
  if (!resolvedPreview) return null;
  const line = document.createElement(options.tagName || "div");
  line.className = options.className || "quick-action-preview-summary";

  const lead = document.createElement("span");
  lead.className = "quick-action-preview-summary-copy";
  lead.textContent = `${options.includePrefix ? `${resolvedPreview.fieldViewLabel}：` : ""}${resolvedPreview.state}`;
  line.appendChild(lead);

  if (resolvedPreview.historyLabel) {
    const separator = document.createElement("span");
    separator.className = "quick-action-preview-summary-copy";
    separator.textContent = " · ";
    line.appendChild(separator);

    const chip = document.createElement("span");
    chip.className = resolvedPreview.historyToneClass || "summary-round";
    chip.textContent = resolvedPreview.historyLabel;
    line.appendChild(chip);
  }

  if (resolvedPreview.summaryCopy) {
    const copy = document.createElement("span");
    copy.className = "quick-action-preview-summary-copy";
    copy.textContent = ` · ${resolvedPreview.summaryCopy}`;
    line.appendChild(copy);
  }

  return line;
}

function createQuickActionPreviewCard(action, previewState = "", structured = null, options = {}) {
  if (!action || !previewState || !structured) return null;
  const history = Array.isArray(options.history) ? options.history.filter(Boolean) : [];
  const selectedHistoryIndex =
    Number.isInteger(options.selectedHistoryIndex) && options.selectedHistoryIndex >= 0
      ? options.selectedHistoryIndex
      : history.length
        ? history.length - 1
        : -1;
  const structuredViews = quickActionPreviewStructuredViews(action, previewState, structured);
  const selectedFieldView =
    options.fieldView === "stage" || options.fieldView === "snapshot" ? options.fieldView : "snapshot";
  const resolvedPreviewView = resolveQuickActionPreviewView(
    {
      action,
      state: previewState,
      structured,
      historyLabel: options.historyLabel || "",
      historyToneClass: "",
      followUpCopy: quickActionFollowUpCopy(action, previewState),
    },
    selectedFieldView,
  );
  const activeStructured =
    selectedFieldView === "stage" ? structuredViews.stageStructured : structuredViews.snapshotStructured;
  if (!activeStructured) return null;
  const attachPreviewMetaPillAction = (pill, title, onActivate) => {
    if (!pill || typeof onActivate !== "function") return;
    pill.classList.add("is-clickable");
    pill.tabIndex = 0;
    pill.setAttribute("role", "button");
    if (title) {
      pill.title = title;
      pill.setAttribute("aria-label", title);
    }
    pill.addEventListener("click", () => {
      onActivate();
    });
    pill.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onActivate();
      }
    });
  };

  const card = document.createElement("section");
  card.className = "quick-action-preview-card";
  if (options.className) {
    card.classList.add(...String(options.className).split(/\s+/).filter(Boolean));
  }
  setDatasetFlag(card, "actionIntensity", quickActionIntensity(action));
  setDatasetFlag(card, "quickAction", action);
  setDatasetFlag(card, "previewState", previewState);

  const header = document.createElement("div");
  header.className = "quick-action-preview-card-header";

  const heading = document.createElement("div");
  heading.className = "quick-action-preview-card-heading";
  heading.appendChild(
    createLine(
      "quick-action-preview-card-kicker",
      options.title || resolvedPreviewView?.fieldViewLabel || "阶段快照",
    ),
  );
  heading.appendChild(createLine("quick-action-preview-card-title", `${action} · ${previewState}`));
  header.appendChild(heading);

  const pills = document.createElement("div");
  pills.className = "quick-action-preview-card-pills";
  const currentPills = document.createElement("div");
  currentPills.className = "quick-action-preview-card-pills-current";
  const historyOptionPills = document.createElement("div");
  historyOptionPills.className = "quick-action-preview-card-pills-options";
  historyOptionPills.dataset.optionKind = "history";
  const fieldViewOptionPills = document.createElement("div");
  fieldViewOptionPills.className = "quick-action-preview-card-pills-options";
  fieldViewOptionPills.dataset.optionKind = "field-view";
  const createPillGroupLabel = (section, text) => {
    const label = document.createElement("span");
    label.className = "quick-action-preview-card-pills-label";
    label.dataset.pillSection = section;
    label.textContent = text;
    return label;
  };

  const actionPill = createPill(action, quickActionTone(action));
  actionPill.dataset.actionIntensity = quickActionIntensity(action);
  actionPill.dataset.quickAction = action;
  actionPill.dataset.currentMetaRole = "action";
  currentPills.appendChild(actionPill);

  const currentStrip = document.createElement("span");
  currentStrip.className = "quick-action-preview-card-current-strip";
  currentStrip.dataset.currentMetaRole = "summary";
  currentStrip.textContent = [previewState, options.historyLabel, resolvedPreviewView?.fieldViewLabel]
    .filter(Boolean)
    .join(" · ");
  currentPills.appendChild(currentStrip);

  const statePill = createPill(previewState, quickActionTone(action));
  statePill.dataset.actionIntensity = quickActionIntensity(action);
  statePill.dataset.quickAction = action;
  statePill.dataset.currentMetaRole = "state";
  currentPills.appendChild(statePill);

  if (options.historyLabel) {
    const historyPill = createPill(options.historyLabel, selectedHistoryIndex === history.length - 1 ? "warm" : "muted");
    historyPill.dataset.previewMeta = "history";
    historyPill.dataset.snapshotRole = selectedHistoryIndex === history.length - 1 ? "latest" : "history";
    historyPill.dataset.currentMetaRole = "history";
    attachPreviewMetaPillAction(
      historyPill,
      history.length > 1 ? "切到下一轮历史快照" : "",
      history.length > 1 && typeof options.onHistoryClick === "function"
        ? () => {
            const nextIndex = (selectedHistoryIndex + 1 + history.length) % history.length;
            options.onHistoryClick(history[nextIndex], nextIndex);
          }
        : null,
    );
    currentPills.appendChild(historyPill);
  }

  if (history.length > 1) {
    history.forEach((snapshot, index) => {
      const optionPill = createPill(
        quickActionPreviewHistoryLabel(snapshot, index, history.length),
        index === selectedHistoryIndex ? "warm" : "muted",
      );
      optionPill.dataset.previewMetaOption = "history";
      optionPill.dataset.snapshotIndex = String(index);
      optionPill.dataset.snapshotRole = index === history.length - 1 ? "latest" : "history";
      optionPill.dataset.selected = String(index === selectedHistoryIndex);
      attachPreviewMetaPillAction(
        optionPill,
        quickActionPreviewHistoryDescription(snapshot, index, history.length),
        typeof options.onHistoryClick === "function"
          ? () => {
              options.onHistoryClick(snapshot, index);
            }
          : null,
      );
      historyOptionPills.appendChild(optionPill);
    });
  }

  if (resolvedPreviewView?.fieldViewLabel) {
    const fieldViewPill = createPill(resolvedPreviewView.fieldViewLabel, "muted");
    fieldViewPill.dataset.previewMeta = "field-view";
    fieldViewPill.dataset.previewFieldView = selectedFieldView;
    fieldViewPill.dataset.currentMetaRole = "field-view";
    attachPreviewMetaPillAction(
      fieldViewPill,
      selectedFieldView === "stage" ? "切到原始快照字段" : "切到阶段字段",
      typeof options.onFieldViewChange === "function"
        ? () => {
            options.onFieldViewChange(selectedFieldView === "stage" ? "snapshot" : "stage");
          }
        : null,
    );
    currentPills.appendChild(fieldViewPill);
  }

  if (structuredViews.hasViewToggle) {
    [
      ["stage", "阶段字段"],
      ["snapshot", "原始快照"],
    ].forEach(([viewId, label]) => {
      const optionPill = createPill(label, selectedFieldView === viewId ? "warm" : "muted");
      optionPill.dataset.previewMetaOption = "field-view";
      optionPill.dataset.previewFieldView = viewId;
      optionPill.dataset.selected = String(selectedFieldView === viewId);
      attachPreviewMetaPillAction(
        optionPill,
        viewId === "stage" ? `切到${previewState}阶段字段` : `切到${options.historyLabel || "当前轮次"}的原始快照字段`,
        typeof options.onFieldViewChange === "function"
          ? () => {
              options.onFieldViewChange(viewId);
            }
          : null,
      );
      fieldViewOptionPills.appendChild(optionPill);
    });
  }

  if ((currentPills.children?.length || 0) > 0) {
    pills.appendChild(createPillGroupLabel("current", "当前"));
    pills.appendChild(currentPills);
  }
  if ((historyOptionPills.children?.length || 0) > 0) {
    pills.appendChild(createPillGroupLabel("history", "轮次"));
    pills.appendChild(historyOptionPills);
  }
  if ((fieldViewOptionPills.children?.length || 0) > 0) {
    pills.appendChild(createPillGroupLabel("field-view", "视图"));
    pills.appendChild(fieldViewOptionPills);
  }

  setDatasetFlag(card, "previewHistoryControlsCollapsed", history.length > 1 ? "true" : "false");
  setDatasetFlag(card, "previewFieldViewControlsCollapsed", structuredViews.hasViewToggle ? "true" : "false");

  header.appendChild(pills);
  card.appendChild(header);

  const followUpCopy = resolvedPreviewView?.summaryCopy || quickActionFollowUpCopy(action, previewState);
  if (followUpCopy) {
    card.appendChild(createLine("quick-action-preview-card-copy", followUpCopy));
  }

  if (history.length > 1) {
    const historyWrap = document.createElement("div");
    historyWrap.className = "quick-action-preview-history";
    historyWrap.hidden = card.dataset.previewHistoryControlsCollapsed === "true";
    historyWrap.setAttribute("aria-hidden", historyWrap.hidden ? "true" : "false");
    historyWrap.appendChild(
      createLine(
        "quick-action-preview-history-label",
        options.historyTitle || `历史快照 · ${history.length} 轮`,
      ),
    );
    const historyButtons = document.createElement("div");
    historyButtons.className = "quick-action-preview-history-buttons";
    history.forEach((snapshot, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quick-action-preview-history-button";
      setDatasetFlag(button, "selected", index === selectedHistoryIndex ? "true" : "false");
      setDatasetFlag(button, "snapshotIndex", index);
      setDatasetFlag(button, "snapshotRole", index === history.length - 1 ? "latest" : "history");
      button.textContent = quickActionPreviewHistoryLabel(snapshot, index, history.length);
      button.title = quickActionPreviewHistoryDescription(snapshot, index, history.length);
      if (typeof options.onHistoryClick === "function") {
        button.addEventListener("click", () => {
          options.onHistoryClick(snapshot, index);
        });
      }
      historyButtons.appendChild(button);
    });
    historyWrap.appendChild(historyButtons);
    card.appendChild(historyWrap);
  }

  if (structuredViews.hasViewToggle) {
    const viewWrap = document.createElement("div");
    viewWrap.className = "quick-action-preview-card-view";
    viewWrap.hidden = card.dataset.previewFieldViewControlsCollapsed === "true";
    viewWrap.setAttribute("aria-hidden", viewWrap.hidden ? "true" : "false");
    const appendViewButton = (viewId, label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.previewFieldView = viewId;
      button.dataset.selected = String(selectedFieldView === viewId);
      button.textContent = label;
      button.title =
        viewId === "stage"
          ? `切到${previewState}阶段字段`
          : `切到${options.historyLabel || "当前轮次"}的原始快照字段`;
      button.addEventListener("click", () => {
        if (typeof options.onFieldViewChange === "function") {
          options.onFieldViewChange(viewId);
        }
      });
      viewWrap.appendChild(button);
    };
    appendViewButton("stage", "阶段字段");
    appendViewButton("snapshot", "原始快照");
    card.appendChild(viewWrap);
  }

  const sheet = document.createElement("div");
  sheet.className = "message-quick-sheet quick-action-preview-card-sheet";
  const maxFields = Math.max(1, Number(options.maxFields) || activeStructured.fields.length);
  for (const field of activeStructured.fields.slice(0, maxFields)) {
    const row = document.createElement("div");
    row.className = "message-quick-sheet-row quick-action-preview-card-row";

    const label = document.createElement("span");
    label.className = "message-quick-sheet-label quick-action-preview-card-label";
    label.textContent = field.label;

    const value = document.createElement("span");
    value.className = "message-quick-sheet-value quick-action-preview-card-value";
    value.textContent = field.value;

    row.append(label, value);
    sheet.appendChild(row);
  }

  if (activeStructured.notes.length) {
    const notes = document.createElement("div");
    notes.className = "message-quick-sheet-notes quick-action-preview-card-notes";
    notes.textContent = activeStructured.notes.join("\n");
    sheet.appendChild(notes);
  }

  card.appendChild(sheet);
  return card;
}

function quickActionPreviewHistoryLabel(snapshot, index, historyLength) {
  const prefix = quickActionPreviewRoundLabel(index, historyLength);
  const summary = quickActionPreviewHistorySummary(snapshot);
  return summary ? `${prefix} · ${summary}` : prefix;
}

function quickActionPreviewHistoryDescription(snapshot, index, historyLength) {
  const prefix = quickActionPreviewRoundLabel(index, historyLength, { includeLatestIndex: true });
  const summary = quickActionPreviewHistorySummary(snapshot);
  return summary ? `${prefix} · ${summary}` : prefix;
}

function quickActionPreviewRoundLabel(index, historyLength, options = {}) {
  if (!Number.isInteger(index) || index < 0 || !Number.isInteger(historyLength) || historyLength <= 0) {
    return "";
  }
  if (index === historyLength - 1) {
    return options.includeLatestIndex ? `最新轮（第${index + 1}轮）` : "最新轮";
  }
  return `第${index + 1}轮`;
}

function quickActionPreviewHistorySummary(snapshot) {
  const firstField = Array.isArray(snapshot?.fields)
    ? snapshot.fields.find((field) => typeof field?.label === "string" && field.label.trim())
    : null;
  if (!firstField) return "";
  return String(firstField.label)
    .replace(/^[\-\u2022\s]+/u, "")
    .replace(/[：:]\s*$/u, "")
    .trim();
}

function normalizeQuickActionFieldLabel(label = "") {
  return String(label || "")
    .replace(/^[\-\u2022\s]+/u, "")
    .replace(/[：:]\s*$/u, "")
    .trim();
}

function quickActionPreviewPrimaryField(structured) {
  const firstField = Array.isArray(structured?.fields)
    ? structured.fields.find((field) => typeof field?.label === "string" && field.label.trim())
    : null;
  if (!firstField) return null;
  const label = normalizeQuickActionFieldLabel(firstField.label);
  const value = String(firstField.value || "").trim();
  if (!label && !value) return null;
  return { label, value };
}

function quickActionInlinePreviewFields(action, structured, options = {}) {
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

function quickActionPreviewPrimaryFieldText(structured) {
  const field = quickActionPreviewPrimaryField(structured);
  if (!field) return "";
  const { label, value } = field;
  if (!label) return value;
  if (!value) return label;
  return `${label}：${value}`;
}

function quickActionInlinePreviewFieldSets(action, structured, options = {}) {
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

function quickActionWorkflowStructured(action = "", state = "") {
  if (!action) return null;
  return normalizeQuickActionStructured(
    parseStructuredQuickActionMessage({
      text: quickActionWorkflowTemplate(action, state),
      quick_action: action,
    }),
    action,
  );
}

function quickActionPreviewStructuredViews(action = "", state = "", structured = null) {
  const snapshotStructured = normalizeQuickActionStructured(structured, action);
  const stageStructured = quickActionWorkflowStructured(action, state) || snapshotStructured;
  return {
    snapshotStructured,
    stageStructured,
    hasViewToggle:
      JSON.stringify(snapshotStructured?.fields || []) !== JSON.stringify(stageStructured?.fields || []),
  };
}

function quickActionInlinePreviewActionLabels(action = "", state = "") {
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

function quickActionInlinePreviewActionOrder(action = "", state = "", options = {}) {
  const viewingLatest = options.viewingLatest !== false;
  if (!viewingLatest) {
    return ["snapshot", "workflow"];
  }
  return quickActionStage(action, state)?.advanceLabel
    ? ["workflow", "snapshot"]
    : ["snapshot", "workflow"];
}

function quickActionInlinePreviewActionHint(action = "", state = "", actionId = "", options = {}) {
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

function latestRoomQuickState(room) {
  if (!room?.id) return "";
  const action = latestRoomQuickAction(room);
  const localState = roomQuickState(room.id, action);
  if (localState) return localState;
  const workflowState = workflowProfile(room)?.state;
  return typeof workflowState === "string" ? workflowState.trim() : "";
}

function advanceRoomQuickState(roomId) {
  const room = state.rooms.find((item) => item.id === roomId);
  const action = latestRoomQuickAction(room);
  if (!roomId || !action) return;
  const currentState = roomQuickState(roomId, action);
  const nextState = nextQuickActionState(action, currentState);
  if (!nextState) return;
  setRoomQuickState(roomId, action, nextState);
  setRoomQuickSnapshot(roomId, action, nextState, latestStructuredQuickActionPreview(room, action));
  setRoomQuickPreview(roomId, "", "");
  renderRooms();
  renderTimeline();
  renderConversationOverview();
  renderChatDetailPanel();
  if (currentShellPage() === "user" && roomId === activeRoomId) {
    syncRoomStageCanvas(room);
  }
}

function roomQuickActionSummary(room) {
  const action = latestRoomQuickAction(room);
  return action ? `最近动作：${action}` : "";
}

function roomQuickActionContextCopy(room) {
  const action = latestRoomQuickAction(room);
  if (!action) return "";
  return `最近动作：${action} · ${quickActionStatusCopy(action)}`;
}

function roomQuickActionBadgeLabel(room) {
  const action = latestRoomQuickAction(room);
  return action ? `动作 ${action}` : "";
}

function roomQuickActionBadgeTone(room) {
  return quickActionTone(latestRoomQuickAction(room));
}

function roomQuickActionBadgeIntensity(room) {
  return quickActionIntensity(latestRoomQuickAction(room));
}

function createRoomQuickActionPill(room) {
  const label = roomQuickActionBadgeLabel(room);
  if (!label) return null;
  const action = latestRoomQuickAction(room);
  const pill = createPill(label, roomQuickActionBadgeTone(room));
  pill.dataset.actionIntensity = roomQuickActionBadgeIntensity(room);
  pill.dataset.quickAction = action;
  pill.classList.add("pill-room-action", "is-clickable");
  pill.title = "点击继续当前动作";
  pill.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (room.id !== activeRoomId) {
      focusRoom(room.id);
      renderRooms();
      renderTimeline();
    }
    const state = latestRoomQuickState(room);
    seedComposerFromQuickAction(action, quickActionWorkflowTemplate(action, state), { force: true });
  });
  return pill;
}

function createRoomQuickPreviewPill(room) {
  const preview = resolveRoomQuickPreview(room);
  if (!preview?.historyLabel) return null;
  const previewFieldView = roomQuickPreviewFieldView(
    room.id,
    preview.action,
    preview.state,
    preview.snapshotIndex,
  );
  const tone = preview.historyToneClass === "summary-history" ? "muted" : "warm";
  const pill = createPill(
    `预览 ${preview.historyLabel} · ${quickActionPreviewFieldViewLabel(previewFieldView)}`,
    tone,
  );
  pill.classList.add("pill-room-preview", "is-clickable");
  pill.dataset.previewState = preview.state;
  pill.dataset.previewRound = preview.historyLabel;
  pill.dataset.previewFieldView = previewFieldView;
  pill.title = "点击回到当前预览快照";
  pill.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (room.id !== activeRoomId) {
      focusRoom(room.id);
      renderRooms();
      renderTimeline();
    }
    previewRoomQuickStage(room.id, preview.action, preview.state, preview.snapshotIndex);
    const previewDraft =
      quickActionStructuredDraft(preview.structured, preview.action) ||
      quickActionWorkflowTemplate(preview.action, preview.state);
    seedComposerFromQuickAction(preview.action, previewDraft, { force: true });
  });
  return pill;
}

function createRoomInlineActions(room) {
  const action = latestRoomQuickAction(room);
  const state = latestRoomQuickState(room);
  if (!room?.id || room.id !== activeRoomId || !action) return null;

  const primarySpec = inlineActionProfile(room, "primary");
  const secondarySpec = inlineActionProfile(room, "secondary");
  const primaryLabel = primarySpec?.label || quickActionOverviewCtaLabel(action, state);
  const secondaryLabel = secondarySpec?.label || quickActionAdvanceLabel(action, state);
  if (!primaryLabel && !secondaryLabel) return null;

  const rail = document.createElement("div");
  rail.className = "room-inline-actions";
  rail.dataset.quickAction = action;
  rail.dataset.actionIntensity = quickActionIntensity(action);

  const stages = quickActionStateStages(action);
  const stageIndex = Math.max(
    stages.findIndex((stage) => stage.label === state),
    0,
  );
  const progress = document.createElement("div");
  progress.className = "room-inline-progress";
  progress.dataset.actionIntensity = quickActionIntensity(action);
  progress.title = quickActionStage(action, state)?.copy || "";
  progress.tabIndex = 0;
  progress.setAttribute("role", "button");

  const progressCount = document.createElement("span");
  progressCount.className = "room-inline-progress-count";
  progressCount.textContent = `${stageIndex + 1} / ${Math.max(stages.length, 1)}`;

  const progressLabel = document.createElement("span");
  progressLabel.className = "room-inline-progress-label";
  progressLabel.textContent = state;

  progress.append(progressCount, progressLabel);
  progress.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    previewRoomQuickStage(
      room.id,
      action,
      state,
      latestRoomQuickSnapshotIndex(room.id, action, state) >= 0
        ? latestRoomQuickSnapshotIndex(room.id, action, state)
        : null,
    );
  });
  rail.appendChild(progress);
  const preview = resolveRoomQuickPreview(room, action);
  const previewView = preview
    ? resolveQuickActionPreviewView(
        preview,
        roomQuickPreviewFieldView(room.id, preview.action, preview.state, preview.snapshotIndex),
      )
    : null;
  const previewField = previewView?.primaryFieldText;
  if (preview?.state && previewField) {
    const activatePreviewSnapshot = (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      previewRoomQuickStage(room.id, preview.action, preview.state, preview.snapshotIndex);
      const previewDraft =
        quickActionStructuredDraft(preview.structured, preview.action) ||
        quickActionWorkflowTemplate(preview.action, preview.state);
      seedComposerFromQuickAction(preview.action, previewDraft, { force: true });
    };
    const activatePreviewWorkflow = (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      previewRoomQuickStage(room.id, preview.action, preview.state, preview.snapshotIndex);
      seedComposerFromQuickAction(
        preview.action,
        quickActionWorkflowTemplate(preview.action, preview.state),
        { force: true },
      );
    };
    const hint = document.createElement("div");
    hint.className = "room-inline-preview-hint";
    hint.dataset.actionIntensity = quickActionIntensity(action);

    const stage = document.createElement("span");
    stage.className = "room-inline-preview-stage";
    stage.textContent = preview.state;
    stage.classList.add("is-clickable");
    stage.tabIndex = 0;
    stage.setAttribute("role", "button");
    stage.title = "点击继续当前阶段";
    stage.addEventListener("click", activatePreviewWorkflow);
    hint.appendChild(stage);

    const field = document.createElement("span");
    field.className = "room-inline-preview-field";
    field.textContent = previewField;
    field.classList.add("is-clickable");
    field.tabIndex = 0;
    field.setAttribute("role", "button");
    field.title = "点击回到当前预览快照";
    field.addEventListener("click", activatePreviewSnapshot);
    hint.append(" · ", field);

    if (preview.historyLabel) {
      const round = document.createElement("span");
      round.className = `room-inline-preview-round ${preview.historyToneClass || ""}`.trim();
      round.textContent = preview.historyLabel;
      if (Array.isArray(preview.history) && preview.history.length > 1) {
        const nextSnapshotIndex =
          Number.isInteger(preview.snapshotIndex) && preview.snapshotIndex >= 0
            ? (preview.snapshotIndex + 1) % preview.history.length
            : Math.max(preview.history.length - 1, 0);
        round.classList.add("is-clickable");
        round.tabIndex = 0;
        round.setAttribute("role", "button");
        round.title = quickActionPreviewHistoryDescription(
          preview.history[nextSnapshotIndex],
          nextSnapshotIndex,
          preview.history.length,
        );
        const cyclePreviewRound = (event) => {
          event.preventDefault();
          event.stopPropagation();
          previewRoomQuickStage(room.id, preview.action, preview.state, nextSnapshotIndex);
        };
        round.addEventListener("click", cyclePreviewRound);
      }
      hint.append(" · ", round);
    }

    rail.appendChild(hint);

    const preferCurrentStageInlineCard =
      Array.isArray(preview.history) &&
      preview.history.length > 0 &&
      preview.snapshotIndex === preview.history.length - 1;
    const inlineCardFieldSets = quickActionInlinePreviewFieldSets(preview.action, preview.structured, {
      maxFields: 2,
      state: preview.state,
    });
    const previewHistory = Array.isArray(preview.history) ? preview.history : [];
    const inlineCardResolvedFieldView =
      previewView?.fieldView === "stage" || previewView?.fieldView === "snapshot"
        ? previewView.fieldView
        : "";
    const inlineCardFieldView =
      inlineCardResolvedFieldView ||
      (inlineCardFieldSets.hasViewToggle
        ? roomQuickPreviewFieldView(room.id, preview.action, preview.state, preview.snapshotIndex)
        : preferCurrentStageInlineCard
          ? "stage"
          : "snapshot");
    const inlineCardFields =
      inlineCardFieldView === "snapshot"
        ? inlineCardFieldSets.snapshotFields
        : inlineCardFieldSets.stageFields;
    const inlineCardSummary =
      inlineCardFieldView === "stage" && preview.followUpCopy
        ? preview.followUpCopy
        : inlineCardFields[0]?.label && inlineCardFields[0]?.value
        ? `${inlineCardFields[0].label}：${inlineCardFields[0].value}`
        : previewField;
    const inlineCard = document.createElement("div");
    inlineCard.className = "room-inline-preview-card";
    inlineCard.dataset.actionIntensity = quickActionIntensity(action);
    inlineCard.appendChild(createLine("room-inline-preview-card-stage", preview.state));
    const inlineMeta = document.createElement("div");
    inlineMeta.className = "room-inline-preview-card-meta";
    const inlineMetaCurrent = document.createElement("div");
    inlineMetaCurrent.className = "room-inline-preview-card-meta-current";
    const inlineCurrentStrip = document.createElement("span");
    inlineCurrentStrip.className = "room-inline-preview-card-current-strip";
    inlineCurrentStrip.dataset.currentMetaRole = "summary";
    inlineCurrentStrip.textContent = [preview.state, preview.historyLabel, quickActionPreviewFieldViewLabel(inlineCardFieldView)]
      .filter(Boolean)
      .join(" · ");
    inlineMetaCurrent.appendChild(inlineCurrentStrip);
    const inlineHistoryMetaOptions = document.createElement("div");
    inlineHistoryMetaOptions.className = "room-inline-preview-card-meta-options";
    inlineHistoryMetaOptions.dataset.optionKind = "history";
    const inlineFieldViewMetaOptions = document.createElement("div");
    inlineFieldViewMetaOptions.className = "room-inline-preview-card-meta-options";
    inlineFieldViewMetaOptions.dataset.optionKind = "field-view";
    const createInlineMetaLabel = (section, text) => {
      const label = document.createElement("span");
      label.className = "room-inline-preview-card-meta-label";
      label.dataset.metaSection = section;
      label.textContent = text;
      return label;
    };
    const attachInlineMetaPillAction = (pill, title, onActivate) => {
      if (!pill || typeof onActivate !== "function") return;
      pill.classList.add("is-clickable");
      pill.tabIndex = 0;
      pill.setAttribute("role", "button");
      if (title) {
        pill.title = title;
        pill.setAttribute("aria-label", title);
      }
      pill.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onActivate();
      });
      pill.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onActivate();
        }
      });
    };
    const appendInlineMetaPill = (label, kind, selected = "", options = {}) => {
      if (!label) return;
      const pill = document.createElement("span");
      pill.className = "room-inline-preview-card-meta-pill";
      pill.dataset.metaKind = kind;
      if (options.previewMeta) {
        pill.dataset.previewMeta = options.previewMeta;
        pill.dataset.currentMetaRole = options.previewMeta;
      }
      if (options.previewMetaOption) {
        pill.dataset.previewMetaOption = options.previewMetaOption;
      }
      if (options.snapshotIndex !== undefined) {
        pill.dataset.snapshotIndex = String(options.snapshotIndex);
      }
      if (options.snapshotRole) {
        pill.dataset.snapshotRole = options.snapshotRole;
      }
      if (options.previewFieldView) {
        pill.dataset.previewFieldView = options.previewFieldView;
      }
      if (selected === "true" || selected === "false") {
        pill.dataset.selected = selected;
      }
      pill.textContent = label;
      if (kind === "history" && previewHistory.length > 1) {
        const nextSnapshotIndex =
          Number.isInteger(preview.snapshotIndex) && preview.snapshotIndex >= 0
            ? (preview.snapshotIndex + 1) % previewHistory.length
            : Math.max(previewHistory.length - 1, 0);
        attachInlineMetaPillAction(
          pill,
          quickActionPreviewHistoryDescription(
            previewHistory[nextSnapshotIndex],
            nextSnapshotIndex,
            previewHistory.length,
          ),
          () => {
            previewRoomQuickStage(room.id, preview.action, preview.state, nextSnapshotIndex);
          },
        );
      }
      if (kind === "field-view" && inlineCardFieldSets.hasViewToggle) {
        const nextFieldView = inlineCardFieldView === "stage" ? "snapshot" : "stage";
        attachInlineMetaPillAction(
          pill,
          nextFieldView === "stage"
            ? `切到${preview.state}阶段字段`
            : `切到${preview.historyLabel || "当前轮次"}的原始快照字段`,
          () => {
            setRoomQuickPreviewFieldView(
              room.id,
              preview.action,
              preview.state,
              preview.snapshotIndex,
              nextFieldView,
            );
          },
        );
      }
      const target = options.container || inlineMetaCurrent;
      target.appendChild(pill);
      return pill;
    };
    appendInlineMetaPill(preview.state, "state", "", { previewMeta: "state", container: inlineMetaCurrent });
    appendInlineMetaPill(preview.historyLabel, "history", "true", {
      previewMeta: "history",
      snapshotIndex: preview.snapshotIndex,
      snapshotRole:
        Number.isInteger(preview.snapshotIndex) && preview.snapshotIndex === previewHistory.length - 1
          ? "latest"
          : "history",
      container: inlineMetaCurrent,
    });
    if (previewHistory.length > 1) {
      previewHistory.forEach((snapshot, index) => {
        appendInlineMetaPill(
          quickActionPreviewHistoryLabel(snapshot, index, previewHistory.length),
          "history",
          String(index === preview.snapshotIndex),
          {
            previewMetaOption: "history",
            snapshotIndex: index,
            snapshotRole: index === previewHistory.length - 1 ? "latest" : "history",
            container: inlineHistoryMetaOptions,
          },
        );
      });
    }
    appendInlineMetaPill(quickActionPreviewFieldViewLabel(inlineCardFieldView), "field-view", "true", {
      previewMeta: "field-view",
      previewFieldView: inlineCardFieldView,
      container: inlineMetaCurrent,
    });
    if (inlineCardFieldSets.hasViewToggle) {
      [
        ["stage", "阶段字段"],
        ["snapshot", "原始快照"],
      ].forEach(([viewId, label]) => {
        const pill = appendInlineMetaPill(label, "field-view", String(inlineCardFieldView === viewId), {
          previewMetaOption: "field-view",
          previewFieldView: viewId,
          container: inlineFieldViewMetaOptions,
        });
        attachInlineMetaPillAction(
          pill,
          viewId === "stage"
            ? `切到${preview.state}阶段字段`
            : `切到${preview.historyLabel || "当前轮次"}的原始快照字段`,
          () => {
            setRoomQuickPreviewFieldView(room.id, preview.action, preview.state, preview.snapshotIndex, viewId);
          },
        );
      });
    }
    if ((inlineMetaCurrent.children?.length || 0) > 0) {
      inlineMeta.appendChild(createInlineMetaLabel("current", "当前"));
      inlineMeta.appendChild(inlineMetaCurrent);
    }
    if ((inlineHistoryMetaOptions.children?.length || 0) > 0) {
      inlineMeta.appendChild(createInlineMetaLabel("history", "轮次"));
      inlineMeta.appendChild(inlineHistoryMetaOptions);
    }
    if ((inlineFieldViewMetaOptions.children?.length || 0) > 0) {
      inlineMeta.appendChild(createInlineMetaLabel("field-view", "视图"));
      inlineMeta.appendChild(inlineFieldViewMetaOptions);
    }
    setDatasetFlag(
      inlineCard,
      "inlineHistoryControlsCollapsed",
      (inlineHistoryMetaOptions.children?.length || 0) > 0 ? "true" : "false",
    );
    setDatasetFlag(
      inlineCard,
      "inlineFieldViewControlsCollapsed",
      (inlineFieldViewMetaOptions.children?.length || 0) > 0 ? "true" : "false",
    );
    if ((inlineMeta.children?.length || 0) > 0) {
      inlineCard.appendChild(inlineMeta);
    }
    inlineCard.appendChild(createLine("room-inline-preview-card-summary", inlineCardSummary));
    if (previewHistory.length > 1) {
      const historyWrap = document.createElement("div");
      historyWrap.className = "room-inline-preview-card-history";
      historyWrap.hidden = inlineCard.dataset.inlineHistoryControlsCollapsed === "true";
      historyWrap.setAttribute("aria-hidden", historyWrap.hidden ? "true" : "false");
      previewHistory.forEach((snapshot, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.selected = String(index === preview.snapshotIndex);
        button.dataset.snapshotIndex = String(index);
        button.dataset.snapshotRole = index === previewHistory.length - 1 ? "latest" : "history";
        button.textContent = quickActionPreviewHistoryLabel(snapshot, index, previewHistory.length);
        button.title = quickActionPreviewHistoryDescription(snapshot, index, previewHistory.length);
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          previewRoomQuickStage(room.id, preview.action, preview.state, index);
        });
        historyWrap.appendChild(button);
      });
      inlineCard.appendChild(historyWrap);
    }
    if (inlineCardFieldSets.hasViewToggle) {
      const viewSwitcher = document.createElement("div");
      viewSwitcher.className = "room-inline-preview-card-view";
      viewSwitcher.hidden = inlineCard.dataset.inlineFieldViewControlsCollapsed === "true";
      viewSwitcher.setAttribute("aria-hidden", viewSwitcher.hidden ? "true" : "false");
      const appendViewButton = (viewId, label) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.roomInlinePreviewView = viewId;
        button.dataset.selected = String(inlineCardFieldView === viewId);
        button.textContent = label;
        button.title =
          viewId === "stage"
            ? `切到${preview.state}阶段字段`
            : `切到${preview.historyLabel || "当前轮次"}的原始快照字段`;
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          setRoomQuickPreviewFieldView(room.id, preview.action, preview.state, preview.snapshotIndex, viewId);
        });
        viewSwitcher.appendChild(button);
      };
      appendViewButton("stage", "阶段字段");
      appendViewButton("snapshot", "原始快照");
      inlineCard.appendChild(viewSwitcher);
    }
    if (inlineCardFields.length) {
      const fieldList = document.createElement("div");
      fieldList.className = "room-inline-preview-card-fields";
      for (const inlineField of inlineCardFields) {
        const row = document.createElement("div");
        row.className = "room-inline-preview-card-row";
        row.appendChild(createLine("room-inline-preview-card-row-label", inlineField.label));
        row.appendChild(createLine("room-inline-preview-card-row-value", inlineField.value || "待补充"));
        fieldList.appendChild(row);
      }
      inlineCard.appendChild(fieldList);
    }
    const inlineActions = document.createElement("div");
    inlineActions.className = "room-inline-preview-card-actions";
    const inlineActionLabels = quickActionInlinePreviewActionLabels(preview.action, preview.state);
    const inlineActionHandlers = {
      snapshot: {
        label: inlineActionLabels.snapshot,
        onClick: activatePreviewSnapshot,
      },
      workflow: {
        label: inlineActionLabels.workflow,
        onClick: activatePreviewWorkflow,
      },
    };
    const orderedInlineActionIds = quickActionInlinePreviewActionOrder(preview.action, preview.state, {
      viewingLatest: preferCurrentStageInlineCard,
    });
    orderedInlineActionIds.forEach((actionId, index) => {
      const definition = inlineActionHandlers[actionId];
      if (!definition?.label) return;
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.roomInlinePreviewAction = actionId;
      button.dataset.roomInlinePreviewPriority = index === 0 ? "primary" : "secondary";
      button.dataset.roomInlinePreviewDefault = index === 0 ? "true" : "false";
      button.textContent = definition.label;
      const actionHint = quickActionInlinePreviewActionHint(preview.action, preview.state, actionId, {
        viewingLatest: preferCurrentStageInlineCard,
        historyLabel: preview.historyLabel,
      });
      if (actionHint) {
        button.title = actionHint;
        button.setAttribute("aria-label", actionHint);
      }
      button.addEventListener("click", definition.onClick);
      inlineActions.appendChild(button);
    });
    inlineCard.appendChild(inlineActions);
    rail.appendChild(inlineCard);
  }


  const appendAction = (label, role, onClick) => {
    if (!label) return;
    const actionNode = document.createElement("span");
    actionNode.className = `room-inline-action room-inline-action-${role}`;
    actionNode.dataset.roomInlineRole = role;
    actionNode.dataset.actionIntensity = quickActionIntensity(action);
    actionNode.textContent = label;
    actionNode.tabIndex = 0;
    actionNode.setAttribute("role", "button");
    actionNode.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    });
    rail.appendChild(actionNode);
  };

  appendAction(primaryLabel, "primary", () => {
    const nextAction = primarySpec?.action || action;
    seedComposerFromQuickAction(
      nextAction,
      quickActionWorkflowTemplate(nextAction, primarySpec?.next_state || state),
      { force: true },
    );
  });

  appendAction(secondaryLabel, "secondary", () => {
    if (secondarySpec?.next_state) {
      const nextAction = secondarySpec.action || action;
      setRoomQuickAction(room.id, nextAction);
      setRoomQuickState(room.id, nextAction, secondarySpec.next_state);
      renderRooms();
      renderTimeline();
      renderConversationOverview();
      renderChatDetailPanel();
      return;
    }
    advanceRoomQuickState(room.id);
  });

  return rail;
}

function createRoomPreviewNode(room) {
  const preview = resolveRoomQuickPreview(room);
  const previewView = preview
    ? resolveQuickActionPreviewView(
        preview,
        roomQuickPreviewFieldView(room.id, preview.action, preview.state, preview.snapshotIndex),
      )
    : null;
  const field = previewView?.primaryField;
  if (!preview || !previewView || !field) {
    return createLine("room-preview", roomPreview(room));
  }

  const shell = document.createElement("div");
  shell.className = "room-preview-shell is-interactive";
  shell.dataset.previewState = preview.state;
  shell.dataset.previewRound = preview.historyLabel || "";
  shell.title = "点击回到当前预览快照并继续填写";
  const activatePreview = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (room.id !== activeRoomId) {
      focusRoom(room.id);
      renderRooms();
      renderTimeline();
    }
    previewRoomQuickStage(room.id, preview.action, preview.state, preview.snapshotIndex);
    const previewDraft =
      quickActionStructuredDraft(preview.structured, preview.action) ||
      quickActionWorkflowTemplate(preview.action, preview.state);
    seedComposerFromQuickAction(preview.action, previewDraft, { force: true });
  };
  shell.addEventListener("click", activatePreview);

  if (Array.isArray(preview.history) && preview.history.length > 1) {
    const history = document.createElement("div");
    history.className = "room-preview-history";
    preview.history.forEach((snapshot, index) => {
      const chip = document.createElement("span");
      chip.className = "room-preview-history-chip";
      chip.dataset.selected = index === preview.snapshotIndex ? "true" : "false";
      chip.dataset.snapshotIndex = String(index);
      chip.dataset.snapshotRole = index === preview.history.length - 1 ? "latest" : "history";
      chip.textContent = quickActionPreviewHistoryLabel(snapshot, index, preview.history.length);
      chip.title = quickActionPreviewHistoryDescription(snapshot, index, preview.history.length);
      chip.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (room.id !== activeRoomId) {
          focusRoom(room.id);
          renderTimeline();
        }
        previewRoomQuickStage(room.id, preview.action, preview.state, index);
      });
      history.appendChild(chip);
    });
    shell.appendChild(history);
  }

  const stage = document.createElement("div");
  stage.className = "room-preview-stage";
  stage.textContent = field.label || previewView.state || "预览";
  stage.addEventListener("click", activatePreview);
  shell.appendChild(stage);

  const summary = document.createElement("div");
  summary.className = "room-preview";
  summary.textContent = field.value || field.label || roomPreview(room);
  summary.addEventListener("click", activatePreview);
  shell.appendChild(summary);

  return shell;
}

function roomOverviewSummary(room) {
  const action = latestRoomQuickAction(room);
  const actionSummary = quickActionOverviewSummary(action);
  if (actionSummary) return actionSummary;
  if (typeof room?.overview_summary === "string" && room.overview_summary.trim()) {
    return room.overview_summary.trim();
  }
  if (typeof room?.thread_headline === "string" && room.thread_headline.trim()) {
    return room.thread_headline.trim();
  }
  return room.title || room.participant_label || "会话摘要";
}

function appendRoomQuickActionOverviewButton(actions, room, options = {}) {
  const action = latestRoomQuickAction(room);
  const state = latestRoomQuickState(room);
  const primarySpec = inlineActionProfile(room, "primary");
  const nextAction = primarySpec?.action || action;
  const nextState = primarySpec?.next_state || state;
  const label = primarySpec?.label || quickActionOverviewCtaLabel(action, state);
  if (!actions || !label) return;
  const button = document.createElement("button");
  button.type = "button";
  if (options.className) {
    button.className = options.className;
  }
  if (options.dataset) {
    Object.assign(button.dataset, options.dataset);
  }
  button.textContent = label;
  button.addEventListener("click", () => {
    previewRoomQuickStage(room?.id, nextAction, nextState);
    seedComposerFromQuickAction(nextAction, quickActionWorkflowTemplate(nextAction, nextState), { force: true });
  });
  actions.appendChild(button);
}

function syncComposerDraft({ force = false } = {}) {
  if (!composerInputEl) return;
  const nextDraft = draftForRoom(activeRoomId);
  if (force || document.activeElement !== composerInputEl) {
    composerInputEl.value = nextDraft;
  }
  autoSizeComposerInput();
}

function focusComposerInput({ force = false, select = false } = {}) {
  if (!composerInputEl || composerInputEl.disabled) return;
  requestAnimationFrame(() => {
    if (!composerInputEl || composerInputEl.disabled) return;
    if (!force && document.activeElement === composerInputEl) return;
    composerInputEl.focus({ preventScroll: true });
    if (select) {
      composerInputEl.select();
    }
  });
}

function autoSizeComposerInput() {
  if (!composerInputEl) return;
  composerInputEl.style.height = "auto";
  const isWechat = !!composerInputEl.closest(".wechat-composer");
  const isMobile = window.innerWidth <= 720;
  const isCityHub = document.body.dataset.sfcTheme === "city";
  const isSceneComposer = !!composerInputEl.closest(".public-square-composer, .creative-composer");
  const minH = isWechat ? (isMobile ? 40 : 36) : (isMobile ? 48 : (isCityHub ? 36 : 74));
  const maxH = isWechat ? (isMobile ? 80 : 100) : (isSceneComposer ? (isMobile ? 120 : 160) : (isMobile ? 120 : (isCityHub ? 80 : 220)));
  const nextHeight = Math.min(Math.max(composerInputEl.scrollHeight, minH), maxH);
  composerInputEl.style.height = `${nextHeight}px`;
}

function unreadCount(room) {
  const seen = Number(roomReadMarkers?.[room.id] || 0);
  return Math.max((room?.messages?.length || 0) - seen, 0);
}

function markRoomRead(roomId) {
  const room = state.rooms.find((item) => item.id === roomId);
  if (!room) return;
  roomReadMarkers[roomId] = room.messages?.length || 0;
  persistRoomReadMarkers();
}

function syncChatPaneMode(mode, { persist = true } = {}) {
  const allowed = mode === "list" || mode === "thread" || mode === "split";
  chatPaneMode = allowed ? mode : defaultChatPaneForViewport();
  if (persist) {
    safeLocalStorageSet(chatPaneStorageKey(), chatPaneMode);
  }
  if (currentWorkspace === "chat") {
    document.body.dataset.chatPane = chatPaneMode;
  }
}

function createWorkspaceButton(workspace) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "workspace-tab";
  button.dataset.workspace = workspace;
  button.textContent = translateWorkspace(workspace);
  button.addEventListener("click", () => {
    setWorkspace(workspace);
  });
  return button;
}

function createRoomFilterButton(filter, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "segment";
  button.dataset.roomFilter = filter;
  button.textContent = label;
  button.addEventListener("click", () => {
    roomFilter = filter;
    updateRoomToolbarState();
    renderRooms();
    renderTimeline();
  });
  return button;
}

function ensureWorkspaceChrome() {
  const userProjection = currentShellPage() === "user";
  const hubProjection = currentShellPage() === "hub";

  if ((userProjection || hubProjection) && workspaceNavEl) {
    workspaceNavEl.remove();
    workspaceNavEl = null;
    workspaceTabs = [];
  }

  if (!userProjection && !hubProjection && !workspaceNavEl && appShellEl && topbarEl) {
    workspaceNavEl = document.createElement("nav");
    workspaceNavEl.className =
      currentShellPage() === "unified" ? "workspace-switcher panel" : "workspace-switcher";
    workspaceNavEl.setAttribute("aria-label", "工作区切换");
    topbarEl.insertAdjacentElement("afterend", workspaceNavEl);
  }

  if (workspaceNavEl) {
    workspaceNavEl.replaceChildren();
    workspaceTabs = availableWorkspacesForShellMode(shellMode).map((workspace) => {
      const button = createWorkspaceButton(workspace);
      workspaceNavEl.appendChild(button);
      return button;
    });
  }

  if (!userProjection && !roomSearchInputEl && roomsPanelEl && roomListEl) {
    const toolbar = document.createElement("div");
    toolbar.className = "panel-toolbar room-toolbar";

    roomSearchInputEl = document.createElement("input");
    roomSearchInputEl.type = "search";
    roomSearchInputEl.className = "search-input";
    roomSearchInputEl.placeholder = "搜索频道、私信或最近发言";
    roomSearchInputEl.autocomplete = "off";
    roomSearchInputEl.addEventListener("input", (event) => {
      roomSearch = event.target.value.trim().toLowerCase();
      updateRoomToolbarState();
      renderRooms();
      renderTimeline();
    });

    const segments = document.createElement("div");
    segments.className = "segmented-control";
    roomFilterButtons = [
      createRoomFilterButton("all", "全部"),
      createRoomFilterButton("direct", "私信"),
      createRoomFilterButton("public", "频道"),
    ];
    for (const button of roomFilterButtons) {
      segments.appendChild(button);
    }

    roomToolbarNoteEl = document.createElement("div");
    roomToolbarNoteEl.className = "toolbar-note";

    toolbar.appendChild(roomSearchInputEl);
    toolbar.appendChild(segments);
    toolbar.appendChild(roomToolbarNoteEl);
    roomListEl.insertAdjacentElement("beforebegin", toolbar);
  }

  if (!conversationOverviewEl && conversationPanelEl && metaEl) {
    conversationOverviewEl = document.createElement("section");
    conversationOverviewEl.className = "conversation-overview";
    metaEl.insertAdjacentElement("beforebegin", conversationOverviewEl);
  }

  if (!composerStatusEl && composerFormEl) {
    composerStatusEl = document.createElement("div");
    composerStatusEl.className = "composer-status composer-status-muted";
    const composerRow = composerFormEl.querySelector(".composer-row");
    if (composerRow) {
      composerRow.insertAdjacentElement("beforebegin", composerStatusEl);
    } else {
      composerFormEl.appendChild(composerStatusEl);
    }
  }
  if (!userProjection && !composerHeroEl && composerFormEl) {
    composerHeroEl = document.createElement("div");
    composerHeroEl.className = "composer-hero";
    const composerRow = composerFormEl.querySelector(".composer-row");
    const anchor = composerStatusEl || composerRow;
    if (anchor) {
      anchor.insertAdjacentElement("afterend", composerHeroEl);
    } else {
      composerFormEl.appendChild(composerHeroEl);
    }
  }
  if (!userProjection && !composerContextEl && composerFormEl) {
    composerContextEl = document.createElement("div");
    composerContextEl.className = "composer-context";
    const anchor = composerHeroEl || composerStatusEl || composerFormEl.querySelector(".composer-row");
    if (anchor) {
      anchor.insertAdjacentElement("afterend", composerContextEl);
    } else {
      composerFormEl.appendChild(composerContextEl);
    }
  }
  if (!userProjection && !roomDigestEl && roomListEl) {
    roomDigestEl = document.createElement("div");
    roomDigestEl.className = "room-digest";
    roomListEl.insertAdjacentElement("beforebegin", roomDigestEl);
  }
  if (!userProjection && !threadStatusRailEl && timelineEl) {
    threadStatusRailEl = document.createElement("div");
    threadStatusRailEl.className = "thread-status-rail";
    timelineEl.insertAdjacentElement("beforebegin", threadStatusRailEl);
  }
  if (!userProjection && !composerMetaEl && composerFormEl) {
    composerMetaEl = document.createElement("div");
    composerMetaEl.className = "composer-meta";
    composerFormEl.appendChild(composerMetaEl);
  }
  ensureComposerTip();
  ensureComposerKeyBindings();

  if (!userProjection && !roomViewToggleButtonEl && conversationPanelEl) {
    roomViewToggleButtonEl = document.createElement("button");
    roomViewToggleButtonEl.type = "button";
    roomViewToggleButtonEl.className = "secondary conversation-toggle";
    roomViewToggleButtonEl.addEventListener("click", () => {
      syncChatPaneMode("list");
      applyWorkspace();
    });
    conversationPanelEl.insertAdjacentElement("afterbegin", roomViewToggleButtonEl);
  }

  updateRoomToolbarState();
  if (!userProjection) {
    ensureCaretakerPanel();
    ensureCaretakerBadge();
  }
}
function ensureRoomQuickActions() {
  if (currentShellPage() === "user" || !roomsPanelEl) return;
  let actions = roomsPanelEl.querySelector(".room-actions");
  let primary = null;
  let secondary = null;
  if (!actions) {
    actions = document.createElement("div");
    actions.className = "room-actions";
    primary = document.createElement("button");
    primary.type = "button";
    primary.className = "primary";
    primary.dataset.roomAction = "primary";
    primary.addEventListener("click", () => {
      directPeerInputEl?.focus();
      directPeerInputEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    secondary = document.createElement("button");
    secondary.type = "button";
    secondary.className = "secondary";
    secondary.dataset.roomAction = "secondary";
    secondary.addEventListener("click", () => {
      setWorkspace(currentShellPage() === "admin" ? "governance" : "world");
    });
    actions.append(primary, secondary);
    const title = roomsPanelEl.querySelector(".panel-title");
    roomsPanelEl.insertAdjacentElement("beforeend", actions);
  }
  primary = primary || actions.querySelector('[data-room-action="primary"]');
  secondary = secondary || actions.querySelector('[data-room-action="secondary"]');
  const shellPage = currentShellPage();
  if (primary) {
    primary.textContent = shellPage === "admin" ? "打开追问私信" : "发起新私信";
  }
  if (secondary) {
    secondary.textContent = shellPage === "admin" ? "打开更多" : "去看看群聊";
  }
  actions.classList.toggle("is-hidden", currentWorkspace !== "chat");
}

function ensureCaretakerPanel() {
  if (currentShellPage() === "user" || !sidebarStackEl) return;
  if (!caretakerPanelEl) {
    caretakerPanelEl = document.createElement("section");
    caretakerPanelEl.className = "panel caretaker-panel";
    sidebarStackEl.insertBefore(caretakerPanelEl, governancePanelEl || null);
  }
  renderCaretakerPanel();
}

function renderCaretakerPanel() {
  if (!caretakerPanelEl) return;
  clearChildren(caretakerPanelEl);

  const panelTitle = document.createElement("div");
  panelTitle.className = "panel-title";
  panelTitle.textContent = "OpenClaw 管家 · 小狗";
  caretakerPanelEl.appendChild(panelTitle);

  const body = document.createElement("div");
  body.className = "caretaker-body";

  const header = document.createElement("div");
  header.className = "caretaker-header";
  const headerNames = document.createElement("div");
  const name = document.createElement("div");
  name.className = "caretaker-name";
  name.textContent = CARETAKER_PROFILE.displayName;
  const status = document.createElement("div");
  status.className = "caretaker-status";
  status.textContent = CARETAKER_PROFILE.status;
  headerNames.appendChild(name);
  headerNames.appendChild(status);
  const badge = document.createElement("span");
  badge.className = "caretaker-badge";
  badge.textContent = CARETAKER_PROFILE.highlight;
  header.appendChild(headerNames);
  header.appendChild(badge);
  body.appendChild(header);

  const summary = document.createElement("p");
  summary.className = "caretaker-summary";
  summary.textContent = CARETAKER_PROFILE.summary;
  body.appendChild(summary);

  const messages = document.createElement("div");
  messages.className = "caretaker-messages";
  for (const item of CARETAKER_MESSAGES) {
    const msg = document.createElement("div");
    msg.className = "caretaker-message";
    const msgTitle = document.createElement("div");
    msgTitle.className = "caretaker-message-title";
    const titleSpan = document.createElement("span");
    titleSpan.textContent = item.title;
    const timeSpan = document.createElement("span");
    timeSpan.className = "caretaker-message-time";
    timeSpan.textContent = item.time;
    msgTitle.appendChild(titleSpan);
    msgTitle.appendChild(timeSpan);
    const detail = document.createElement("p");
    detail.textContent = item.detail;
    msg.appendChild(msgTitle);
    msg.appendChild(detail);
    messages.appendChild(msg);
  }
  body.appendChild(messages);

  const rules = document.createElement("div");
  rules.className = "caretaker-rules";
  const rulesTitle = document.createElement("div");
  rulesTitle.className = "caretaker-rules-title";
  rulesTitle.textContent = "自动回复 / 留言规则";
  const ruleList = document.createElement("ul");
  for (const rule of CARETAKER_RULES) {
    const li = document.createElement("li");
    li.textContent = rule;
    ruleList.appendChild(li);
  }
  rules.appendChild(rulesTitle);
  rules.appendChild(ruleList);
  body.appendChild(rules);

  caretakerPanelEl.appendChild(body);
}

function ensureCaretakerBadge() {
  if (currentShellPage() === "user" || !composerStatusEl) return;
  if (!caretakerStatusEl) {
    caretakerStatusEl = document.createElement("div");
    caretakerStatusEl.className = "caretaker-status-line";
    composerStatusEl.insertAdjacentElement("afterend", caretakerStatusEl);
  }
  updateCaretakerStatus();
}

function updateCaretakerStatus() {
  if (!caretakerStatusEl) return;
  const room = state.rooms.find((item) => item.id === activeRoomId);
  const roomLabel = room
    ? roomThreadHeadline(room)
    : "等待选中会话";
  clearChildren(caretakerStatusEl);
  const strong = document.createElement("strong");
  strong.textContent = CARETAKER_PROFILE.displayName;
  caretakerStatusEl.appendChild(strong);
  const status = document.createElement("span");
  status.textContent = CARETAKER_PROFILE.status;
  caretakerStatusEl.appendChild(status);
  const roomSpan = document.createElement("span");
  roomSpan.className = "caretaker-status-item";
  roomSpan.textContent = roomLabel;
  caretakerStatusEl.appendChild(roomSpan);
  const ruleSpan = document.createElement("span");
  ruleSpan.className = "caretaker-status-item";
  ruleSpan.textContent = `规则：${CARETAKER_AUTOMATION_NOTE}`;
  caretakerStatusEl.appendChild(ruleSpan);
  const visitorSpan = document.createElement("span");
  visitorSpan.className = "caretaker-status-item";
  visitorSpan.textContent = `留言：${CARETAKER_VISITOR_PREVIEW}`;
  caretakerStatusEl.appendChild(visitorSpan);
}

function ensureChatPriorityBadge() {
  if (currentShellPage() === "user" || !conversationPanelEl) return;
  let badge = conversationPanelEl.querySelector(".chat-priority-badge");
  if (!badge) {
    badge = document.createElement("div");
    badge.className = "chat-priority-badge";
    const title = conversationPanelEl.querySelector(".panel-title");
    if (title) {
      title.insertAdjacentElement("afterend", badge);
    } else {
      conversationPanelEl.prepend(badge);
    }
  }
  updateChatPriorityBadgeText();
}

function updateChatPriorityBadgeText() {
  const badge = conversationPanelEl?.querySelector(".chat-priority-badge");
  if (!badge) return;
  const defaultText = shellMode === "admin"
    ? "管理后台 · 先看会话，再展开工具"
    : shellMode === "user"
      ? "房间聊天 · 私信/群聊像常见 IM"
      : "城市外世界页 · 先看聊天，再看后台栏目";
  badge.textContent = chatFocusMode
    ? "聊天专注 · 按钮可还原"
    : defaultText;
}

function ensureChatQuickLinks() {
  if (currentShellPage() === "user" || !conversationPanelEl) return;
  const existing = conversationPanelEl.querySelector(".chat-quick-links");
  if (existing && existing.dataset.mode === shellMode) return;
  if (existing) {
    existing.remove();
  }
  const quickLinks = document.createElement("div");
  quickLinks.className = "chat-quick-links";
  quickLinks.dataset.mode = shellMode;
  const targets = [
    ...(shellMode === "admin"
      ? [
          ["当前工具", "governance"],
          ["登录与身份", "auth"],
          ["查看登录", "auth"],
        ]
      : shellMode === "user"
        ? [["继续聊天", "chat"]]
        : [
            ["世界", "world"],
            ["治理", "governance"],
            ["身份/登录", "auth"],
          ]),
  ];
  for (const [label, workspace] of targets) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.workspace = workspace;
    button.textContent = label;
    button.addEventListener("click", () => {
      setWorkspace(workspace);
    });
    quickLinks.appendChild(button);
  }
  const reference =
    conversationPanelEl.querySelector(".chat-priority-badge") ||
    conversationPanelEl.querySelector(".panel-title");
  if (reference) {
    reference.insertAdjacentElement("afterend", quickLinks);
  } else {
    conversationPanelEl.prepend(quickLinks);
  }
}

function updateChatQuickLinksVisibility() {
  if (!conversationPanelEl) return;
  const quickLinks = conversationPanelEl.querySelector(".chat-quick-links");
  if (!quickLinks) return;
  quickLinks.style.display = currentWorkspace === "chat" ? "flex" : "none";
}

function ensureModeBanner() {
  if (currentShellPage() === "user" || !roomsPanelEl) return;
  if (!modeBannerEl) {
    modeBannerEl = document.createElement("div");
    modeBannerEl.className = "mode-banner";
    const title = roomsPanelEl.querySelector(".panel-title");
    if (title) {
      title.insertAdjacentElement("beforebegin", modeBannerEl);
    } else {
      roomsPanelEl.prepend(modeBannerEl);
    }
  }
  updateModeBanner();
}

function updateModeBanner() {
  if (!modeBannerEl) return;
  let text;
  if (shellMode === "user") {
    text = "房间内聊天主界面 · 左侧会话，中间消息，底部输入";
  } else if (shellMode === "admin") {
    text = "管理后台 · 左侧选工具，中间处理当前事务";
  } else {
    text = "城市外世界页 · 先看消息，再看后台栏目";
  }
  modeBannerEl.textContent = text;
  modeBannerEl.dataset.variant = shellMode;
}

function ensureConversationCallout() {
  if (currentShellPage() === "user" || !conversationPanelEl) return;
  if (!conversationCalloutEl) {
    conversationCalloutEl = document.createElement("div");
    conversationCalloutEl.className = "conversation-callout";
    if (timelineEl) {
      conversationPanelEl.insertBefore(conversationCalloutEl, timelineEl);
    } else {
      conversationPanelEl.appendChild(conversationCalloutEl);
    }
  }
  updateConversationCallout();
}

function updateConversationCallout() {
  if (currentShellPage() === "user" || !conversationCalloutEl) return;
  conversationCalloutEl.style.display = currentWorkspace === "chat" ? "" : "none";
  const room = state.rooms.find((item) => item.id === activeRoomId);
  const caretaker = caretakerProfile(room);
  if (roomStageTitleEl) {
    roomStageTitleEl.textContent = room
      ? roomThreadHeadline(room)
      : "房间内聊天主界面";
  }
  if (shellMode === "user") {
    conversationCalloutEl.dataset.variant = "user";
    const roomCopy = room
      ? `${roomThreadHeadline(room)} · ${roomAudienceLabel(room)}`
      : "先从左侧点一个会话，房间里的消息流和输入区就会跟上。";
    const caretakerCopy = caretaker
      ? `${caretaker.name} 在线 · ${caretaker.auto_reply}`
      : "OpenClaw 小狗管家会在房间里接住访客留言。";
    const autoReply = caretaker?.auto_reply || "小狗会在房间里自动回复访客。";
    const pendingVisitors = caretaker ? caretakerPendingCount(room) : 0;
    const visitorNote = pendingVisitors > 0
      ? `有 ${pendingVisitors} 条访客提醒在排队，先把当前房间聊顺。`
      : "目前没有排队访客，继续像在房间里聊天即可。";
    clearChildren(conversationCalloutEl);
    const strong1 = document.createElement("strong");
    strong1.textContent = "房间内聊天主界面";
    conversationCalloutEl.appendChild(strong1);
    const p1a = document.createElement("p");
    p1a.textContent = roomCopy;
    conversationCalloutEl.appendChild(p1a);
    const p1b = document.createElement("p");
    p1b.textContent = caretakerCopy;
    conversationCalloutEl.appendChild(p1b);
    const p1c = document.createElement("p");
    p1c.className = "conversation-callout-note";
    p1c.textContent = `${autoReply} · ${visitorNote}`;
    conversationCalloutEl.appendChild(p1c);
  } else if (shellMode === "admin") {
    conversationCalloutEl.dataset.variant = "admin";
    const roomCopy = room
      ? `${roomThreadHeadline(room)} · ${roomAudienceLabel(room)} · ${roomRouteLabel(room)}`
      : "先在左边选一个会话，右边的补充信息会跟着切换。";
    const governanceNote = room
      ? `${roomChatStatusSummary(room)} · ${roomQueueSummary(room)}`
      : "左侧选功能分类，中间处理消息，右侧显示当前对象和工具。";
    clearChildren(conversationCalloutEl);
    const strong2 = document.createElement("strong");
    strong2.textContent = "管理后台";
    conversationCalloutEl.appendChild(strong2);
    const p2a = document.createElement("p");
    p2a.textContent = roomCopy;
    conversationCalloutEl.appendChild(p2a);
    const p2b = document.createElement("p");
    p2b.className = "conversation-callout-note";
    p2b.textContent = `左侧选功能分类，中间处理消息，右侧显示当前对象和工具 · ${governanceNote}`;
    conversationCalloutEl.appendChild(p2b);
  } else {
    conversationCalloutEl.dataset.variant = "unified";
    const roomCopy = room
      ? roomThreadHeadline(room)
      : "中间保留聊天，边上按顺序摆世界、城市、公告、安全和身份。";
    const roomContext = room
      ? roomContextSummary(room)
      : "左侧入口按需展开即可，消息流始终是主位。";
    clearChildren(conversationCalloutEl);
    const strong3 = document.createElement("strong");
    strong3.textContent = "城市外世界页";
    conversationCalloutEl.appendChild(strong3);
    const p3a = document.createElement("p");
    p3a.textContent = roomCopy;
    conversationCalloutEl.appendChild(p3a);
    const p3b = document.createElement("p");
    p3b.className = "conversation-callout-note";
    p3b.textContent = roomContext;
    conversationCalloutEl.appendChild(p3b);
  }
}

function syncRoomStageCanvas(room) {
  if (currentShellPage() === "hub") {
    syncHubStageCanvas(room);
    return;
  }
  if (currentShellPage() !== "user") return;
  ensureUserSceneChrome();
  if (!roomStageCanvasEl) return;

  if (!room) {
    const hudTitleEl = document.querySelector("#room-stage-title");
    const defaultVisual = {
      kind: "stage",
      variant: "home",
      title: "房间聊天",
      summary: "回到住处后继续一对一交谈。",
      theme: {
        kicker: "住宅 / 私聊",
        titleFont: '700 22px "Noto Serif SC", "Microsoft YaHei", serif',
        bodyFont: '500 14px "Noto Sans SC", "Microsoft YaHei", sans-serif',
        lineHeightTitle: 30,
        lineHeightBody: 22,
        background: "#4a3525",
        accent: "#d38d4c",
        panel: "rgba(90, 62, 42, 0.8)",
        border: "rgba(211, 141, 76, 0.38)",
        title: "#f7ead7",
        body: "rgba(246, 231, 210, 0.88)",
      },
      visual: {
        motif: "courtyard",
        badge: "住宅 / 私聊",
        signalCount: 2,
      },
    };
    if (hudTitleEl) {
      hudTitleEl.textContent = "房间聊天";
    }
    renderStageCanvas(roomStageCanvasEl, defaultVisual);
    roomStageCanvasEl.dataset.variant = "home";
    return;
  }

  const visual = buildRoomVisualModel(
    room,
    roomStageSummary(room),
    {
      title: portraitProjection(room)?.title || caretakerProfile(room)?.name || room?.participant_label || "人物",
      summary: roomStagePortraitSummary(room),
    },
  );
  if (roomStageTitleEl) {
    roomStageTitleEl.textContent = visual.stage.title;
  }
  const rendered = renderStageCanvas(roomStageCanvasEl, visual.stage);
  roomStageCanvasEl.dataset.variant = visual.stage.variant;
  syncUserRoomProjection(room, visual);
  if (roomStageNoteEl) {
    roomStageNoteEl.textContent = visual.stage.summary;
    roomStageNoteEl.style.display = rendered ? "none" : "";
  }
  renderRoomStagePortrait(room);
}

function syncHubStageCanvas(room) {
  const canvasEl = document.querySelector("#room-stage-canvas");
  if (!canvasEl) return;
  const hudTitleEl = document.querySelector("#room-stage-title");
  if (room) {
    const visual = buildRoomVisualModel(room, roomStageSummary(room), null);
    if (hudTitleEl) {
      hudTitleEl.textContent = visual.stage.title;
    }
    renderStageCanvas(canvasEl, visual.stage);
    canvasEl.dataset.variant = visual.stage.variant;
  } else {
    const defaultVisual = {
      kind: "stage",
      variant: "city",
      title: "城邦公共频道",
      summary: "公告、闲聊和跨城讨论会先落在这里。",
      theme: {
        kicker: "城市 / 公共频道",
        titleFont: '700 22px "Noto Serif SC", "Microsoft YaHei", serif',
        bodyFont: '500 14px "Noto Sans SC", "Microsoft YaHei", sans-serif',
        lineHeightTitle: 30,
        lineHeightBody: 22,
        background: "#4a3728",
        accent: "#d2b36f",
        panel: "rgba(80, 55, 38, 0.82)",
        border: "rgba(210, 179, 111, 0.35)",
        title: "#f8f1de",
        body: "rgba(247, 238, 217, 0.88)",
      },
      visual: {
        motif: "watchtower",
        badge: "城市 / 公共频道",
        signalCount: 3,
      },
    };
    if (hudTitleEl) {
      hudTitleEl.textContent = "城邦公共频道";
    }
    renderStageCanvas(canvasEl, defaultVisual);
    canvasEl.dataset.variant = "city";
  }
}

function ensureComposerTip() {
  if (!composerFormEl) return;
  if (!composerTipEl) {
    composerTipEl = document.createElement("div");
    composerTipEl.className = "composer-tip";
  }
  const reference = composerStatusEl || composerFormEl.querySelector(".composer-row");
  if (reference && !composerTipEl.isConnected) {
    reference.insertAdjacentElement("afterend", composerTipEl);
  }
  updateComposerTip();
}

function renderComposerHero(room) {
  if (currentShellPage() === "user" || !composerHeroEl) return;
  const shellPage = currentShellPage();
  clearChildren(composerHeroEl);
  composerHeroEl.dataset.variant = shellPage;

  const kicker = document.createElement("div");
  kicker.className = "composer-hero-kicker";
  kicker.textContent = shellPage === "admin"
    ? "管理后台消息区"
    : shellPage === "user"
      ? "房间内聊天主界面"
      : "城市外世界页";
  composerHeroEl.appendChild(kicker);

  const title = document.createElement("div");
  title.className = "composer-hero-title";
  if (!room) {
    title.textContent = shellPage === "user" ? "先选房间" : "先选会话";
  } else if (shellPage === "admin") {
    title.textContent = `发消息到 ${roomThreadHeadline(room)}`;
  } else if (roomKind(room) === "direct") {
    const peerName = room.thread_headline || room.peer_label || room.participant_label || roomDisplayPeer(room);
    title.textContent = `发消息给 ${peerName}`;
  } else {
    title.textContent = `发消息到 ${roomThreadHeadline(room)}`;
  }
  composerHeroEl.appendChild(title);

  const note = document.createElement("div");
  note.className = "composer-hero-note";
  if (!room) {
    note.textContent =
      shellPage === "admin"
        ? "先选会话，再把记录和跟进像聊天一样写下。"
        : shellPage === "user"
          ? "先选会话，房间内聊天主界面才会点亮。"
          : "先选会话，再开始发消息。";
  } else if (shellPage === "admin") {
    note.textContent = "这里优先写记录和跟进，手感仍然像聊天一样顺手。";
  } else {
    note.textContent = shellPage === "user"
      ? "这里就是房间内聊天主界面的输入框，Enter 发送，Shift+Enter 换行。"
      : "这里就是当前会话的输入框，Enter 发送，Shift+Enter 换行。";
  }
  composerHeroEl.appendChild(note);

  const chips = document.createElement("div");
  chips.className = "composer-hero-chips";
  if (!room) {
    chips.appendChild(createPill(gatewayUrl ? "等待会话" : "等待网关", "muted"));
  } else {
    chips.appendChild(
      createPill(
        translateRoomKind(roomKind(room)),
        roomKind(room) === "direct" ? "accent" : "muted",
      ),
    );
    chips.appendChild(createPill(roomSyncLabel(), refreshInProgress ? "warm" : "accent"));
    if (shellPage === "admin") {
      chips.appendChild(
        createPill(
          caretakerPendingCount(room) > 0
            ? `${caretakerPendingCount(room)} 条待跟进`
            : "当前窗口可继续记录",
          caretakerPendingCount(room) > 0 ? "warm" : "muted",
        ),
      );
    } else {
      const unread = unreadCount(room);
      chips.appendChild(createPill(unread > 0 ? `${unread} 条未读` : "当前已读", unread > 0 ? "warm" : "muted"));
    }
  }
  composerHeroEl.appendChild(chips);
}

function updateComposerContext(room) {
  if (currentShellPage() === "user" || !composerContextEl) return;
  const shellPage = currentShellPage();
  clearChildren(composerContextEl);

  const items = room
    ? shellPage === "user"
      ? [
          {
            label: "发送到",
            value: roomThreadHeadline(room) || room.participant_label || room.title,
            tone: "accent",
          },
          {
            label: "状态",
            value: isSendingMessage ? "发送中" : roomSendErrors[room.id] ? "待重发" : "可发送",
            tone: roomSendErrors[room.id] ? "danger" : isSendingMessage ? "warm" : "accent",
          },
        ]
      : [
          {
            label: shellPage === "admin" ? "线程" : "会话标题",
            value: roomThreadHeadline(room),
            tone: "accent",
          },
          {
            label: shellPage === "admin" ? "当前对象" : "聊天对象",
            value: roomAudienceLabel(room),
            tone: "accent",
          },
          {
            label: shellPage === "admin" ? "消息去向" : "投递路线",
            value: roomRouteLabel(room),
            tone: roomSendErrors[room.id] ? "danger" : "muted",
          },
          {
            label: "聊天状态",
            value: roomChatStatusSummary(room),
            tone: roomSendErrors[room.id] ? "danger" : visiblePendingEchoCount(room) ? "warm" : "accent",
          },
          {
            label: "队列",
            value: roomQueueSummary(room),
            tone: caretakerPendingCount(room) > 0 || unreadCount(room) > 0 ? "warm" : "muted",
          },
          {
            label: "输入",
            value: isSendingMessage ? "发送中" : roomSendErrors[room.id] ? "待重发" : "可发送",
            tone: roomSendErrors[room.id] ? "danger" : isSendingMessage ? "warm" : "accent",
          },
        ]
    : [
        {
          label: shellPage === "admin" ? "线程" : "会话标题",
          value: gatewayUrl ? "先打开一个会话" : "等待网关",
          tone: "muted",
        },
      ];

  for (const item of items) {
    const block = document.createElement("div");
    block.className = "composer-context-item";
    block.appendChild(createLine("composer-context-label", item.label));
    const value = document.createElement("div");
    value.className = `composer-context-value composer-context-value-${item.tone}`;
    value.textContent = item.value;
    block.appendChild(value);
    composerContextEl.appendChild(block);
  }
}

function updateComposerTip() {
  if (!composerTipEl) return;
  const room = state.rooms.find((item) => item.id === activeRoomId);
  const roomLabel = room
    ? roomThreadHeadline(room)
    : "未选会话";
  const activeAction = room ? roomQuickAction(room.id) : "";
  const instruction = "Enter 发送 · Shift+Enter 换行 · ↑ 取回上一条";
  const fallback = gatewayUrl
    ? room
      ? "网关回执慢时，会先保留本地草稿和待同步消息。"
      : "先选会话后输入区才会解锁。"
    : room
      ? "离线预览态，消息先留在本地时间线。"
      : "先选会话后输入区才会解锁，草稿会保留在当前窗口。";
  composerTipEl.textContent = activeAction
    ? `${roomLabel} · 当前动作 ${activeAction} · ${instruction} · ${fallback}`
    : `${roomLabel} · ${instruction} · ${fallback}`;
}

function ensureComposerKeyBindings() {
  if (!composerInputEl) return;
  if (composerInputEl.dataset.chatBindings === "true") return;
  composerInputEl.addEventListener("keydown", handleComposerInputKeydown);
  composerFormEl?.addEventListener("pointerdown", handleComposerFormPointerdown);
  composerInputEl.dataset.chatBindings = "true";
}

function triggerComposerKeyboardSubmit() {
  const now = Date.now();
  if (now - lastComposerKeyboardSubmitAt < 120) return;
  if (!composerFormEl || !composerInputEl || composerInputEl.disabled) return;
  lastComposerKeyboardSubmitAt = now;
  if (typeof composerFormEl.requestSubmit === "function") {
    composerFormEl.requestSubmit();
    return;
  }
  submitComposerMessage();
}

function handleComposerInputKeydown(event) {
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
    composerInputEl.value.trim() === "" &&
    lastSentMessage
  ) {
    event.preventDefault();
    composerInputEl.value = lastSentMessage;
    composerInputEl.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function handleComposerFormPointerdown(event) {
  if (!composerInputEl) return;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.closest("textarea, button, input, select, a, summary")) return;
  requestAnimationFrame(() => {
    focusComposerInput({ force: true });
  });
}

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
  if (!governanceStatusEl) return;
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

function createOverviewMetric(label, value, copy, tone = "muted") {
  const card = document.createElement("div");
  card.className = "overview-metric";
  card.dataset.tone = tone;
  card.appendChild(createLine("overview-metric-label", label));
  card.appendChild(createLine("overview-metric-value", value));
  if (copy) {
    card.appendChild(createLine("overview-metric-copy", copy));
  }
  return card;
}

function createDetailSection(title, copy = "") {
  const section = document.createElement("section");
  section.className = "chat-detail-section";

  const heading = document.createElement("div");
  heading.className = "chat-detail-section-title";
  heading.textContent = title;
  section.appendChild(heading);

  if (copy) {
    section.appendChild(createLine("chat-detail-copy", copy));
  }

  return section;
}

function createDetailRow(label, value) {
  const row = document.createElement("div");
  row.className = "chat-detail-row";

  const labelEl = document.createElement("span");
  labelEl.className = "chat-detail-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "chat-detail-value";
  if (value instanceof Element) {
    valueEl.classList.add("chat-detail-value-rich");
    valueEl.appendChild(value);
  } else {
    valueEl.textContent = value;
  }

  row.appendChild(labelEl);
  row.appendChild(valueEl);
  return row;
}

function createMetaChip(text, tone = "muted") {
  const chip = document.createElement("span");
  chip.className = `meta-chip meta-chip-${tone}`;
  chip.textContent = text;
  return chip;
}

function createMessageQuickActionChip(action) {
  if (!action) return null;
  const chip = document.createElement("span");
  chip.className = "message-quick-action";
  chip.textContent = action;
  chip.dataset.actionIntensity = quickActionIntensity(action);
  chip.dataset.quickAction = action;
  chip.classList.add(`message-quick-action-${quickActionTone(action)}`);
  return chip;
}

function createMessageQuickStateChip(action, state = "") {
  const label = quickActionFollowUpLabel(action, state);
  if (!label) return null;
  const chip = document.createElement("span");
  chip.className = "message-quick-state";
  chip.textContent = label;
  chip.dataset.actionIntensity = quickActionIntensity(action);
  chip.dataset.quickAction = action;
  chip.classList.add(`message-quick-state-${quickActionTone(action)}`);
  return chip;
}

function parseStructuredQuickActionMessage(message) {
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
      return `${displayCityTitle(cityProfile)} · ${publicRoom.slug || publicRoom.room_id}`;
    }
    return room.participant_label || "公开频道";
  }
  return room.participant_label || "系统会话";
}

function roomRouteLabel(room) {
  if (!room) return "等待连接";
  if (typeof room.route_label === "string" && room.route_label.trim()) {
    return room.route_label.trim();
  }
  const kind = roomKind(room);
  const shellPage = currentShellPage();
  if (kind === "public") {
    const publicRoom = publicRoomRecordForConversation(room.id);
    if (publicRoom?.frozen) {
      return "房间已冻结";
    }
    const federation = cityStateForConversation(room.id)?.profile?.federation_policy;
    if (federation) {
      return translateFederationPolicy(federation);
    }
    return shellPage === "user" ? "城镇频道可发言" : "房间可发言";
  }
  if (kind === "direct") {
    if (shellPage === "user") {
      return governance.world?.allows_cross_city_private_messages
        ? "居民私信已连通"
        : "居民私信待网关确认";
    }
    return governance.world?.allows_cross_city_private_messages ? "跨城私信已开启" : "私信待网关确认";
  }
  return shellPage === "user" ? "城门消息同步" : "系统状态同步";
}

function roomSummaryLine(room) {
  if (!room) return "未选择聊天";
  if (typeof room.list_summary === "string" && room.list_summary.trim()) {
    return room.list_summary.trim();
  }
  const shellPage = currentShellPage();
  const parts = [room.kind_hint || translateRoomKindForShellPage(roomKind(room), shellPage)];
  if (roomKind(room) !== "system") {
    parts.push(`${roomMemberCount(room)} 人`);
  }
  if ((room.messages || []).length) {
    parts.push(`${room.messages.length} 条消息`);
  }
  if (roomQuickActionSummary(room)) {
    parts.push(roomQuickActionSummary(room));
  }
  return joinOrFallback(
    parts.filter(Boolean),
    room.preview_text || room.overview_summary || room.subtitle || room.meta || "等待新消息",
  );
}

function roomStatusLine(room) {
  if (!room) return "等待新消息";
  if (typeof room.status_line === "string" && room.status_line.trim()) {
    return room.status_line.trim();
  }
  const parts = [roomRouteLabel(room)];
  const quickAction = latestRoomQuickAction(room);
  const followUp = quickActionFollowUpLabel(quickAction, latestRoomQuickState(room));
  const preview = resolveRoomQuickPreview(room, quickAction);
  if (followUp) {
    parts.push(`动作状态 ${followUp}`);
  }
  if (preview?.historyLabel) {
    const previewFieldView = roomQuickPreviewFieldView(
      room.id,
      quickAction,
      preview.state,
      preview.snapshotIndex,
    );
    parts.push(`阶段预览 ${preview.historyLabel} · ${quickActionPreviewFieldViewLabel(previewFieldView)}`);
  }
  if (room.meta) {
    parts.push(room.meta);
  }
  const lastActivity = roomLastActivity(room);
  if (lastActivity && lastActivity !== "暂无消息") {
    parts.push(lastActivity);
  }
  return joinOrFallback(parts.filter(Boolean), "等待新消息");
}

function roomContextSummary(room) {
  if (!room) return "打开一个会话后，这里会显示上下文摘要。";
  const actionCopy = roomQuickActionContextCopy(room);
  if (!actionCopy && typeof room.context_summary === "string" && room.context_summary.trim()) {
    return room.context_summary.trim();
  }
  let base = "";
  if (typeof room.scene_summary === "string" && room.scene_summary.trim()) {
    base = room.scene_summary.trim();
  } else {
    const publicRoom = publicRoomRecordForConversation(room.id);
    if (publicRoom?.description?.trim()) {
      base = publicRoom.description.trim();
    } else if (roomKind(room) === "direct") {
      base = room.overview_summary || room.subtitle || `直接和 ${roomDisplayPeer(room)} 继续一对一沟通。`;
    } else {
      base = room.overview_summary || room.subtitle || roomPreview(room);
    }
  }
  return actionCopy ? `${actionCopy} · ${base}` : base;
}

function roomFollowUpCount(room) {
  if (!room) return 0;
  return (
    Number(unreadCount(room) > 0) +
    Number(roomHasDraft(room.id)) +
    Number(visiblePendingEchoCount(room) > 0) +
    Number(Boolean(roomSendErrors[room.id])) +
    Number(caretakerPendingCount(room) > 0)
  );
}

function roomChatStatusSummary(room) {
  if (!room) return "等待新消息";
  if (roomSendErrors[room.id]) return "这条聊天有消息待重发";
  if (visiblePendingEchoCount(room)) return "这条聊天有消息待同步";
  if (roomHasDraft(room.id)) return "草稿已存在当前会话";
  if (unreadCount(room) > 0) return `有 ${unreadCount(room)} 条新消息待看`;
  if (latestRoomQuickAction(room)) {
    return quickActionFollowUpCopy(latestRoomQuickAction(room), latestRoomQuickState(room)) || "这条聊天正在按动作继续推进";
  }
  if (typeof room?.chat_status_summary === "string" && room.chat_status_summary.trim()) {
    return room.chat_status_summary.trim();
  }
  if (currentShellPage() === "user") {
    return roomKind(room) === "direct" ? "可以直接继续说" : "城镇里还算安静";
  }
  return roomKind(room) === "direct" ? "可直接继续回复" : "群聊当前比较安静";
}

function roomQueueSummary(room) {
  if (!room) return "等待新的后台窗口";
  const items = [];
  if (caretakerPendingCount(room) > 0) {
    items.push(`${caretakerPendingCount(room)} 条访客提醒`);
  }
  if (unreadCount(room) > 0) {
    items.push(`${unreadCount(room)} 条新动态`);
  }
  if (roomHasDraft(room.id)) {
    items.push("有待发记录");
  }
  if (visiblePendingEchoCount(room)) {
    items.push("消息待同步");
  }
  if (roomSendErrors[room.id]) {
    items.push("发送失败待复核");
  }
  if (items.length) {
    return items.join(" · ");
  }
  if (typeof room?.queue_summary === "string" && room.queue_summary.trim()) {
    return room.queue_summary.trim();
  }
  return "窗口清爽，可继续巡视或记录";
}

function roomThreadHeadline(room) {
  if (!room) return "会话未打开";
  if (typeof room?.thread_headline === "string" && room.thread_headline.trim()) {
    return room.thread_headline.trim();
  }
  if (typeof room?.title === "string" && room.title.trim()) {
    return room.title.trim();
  }
  if (currentShellPage() === "user") {
    if (roomKind(room) === "direct") {
      return `正在和 ${roomDisplayPeer(room)} 聊天`;
    }
    if (roomKind(room) === "public") {
      return `${roomAudienceLabel(room)} · 城镇里`;
    }
    return room.participant_label || "系统通知";
  }
  if (roomKind(room) === "direct") {
    return `正在与 ${roomDisplayPeer(room)} 聊天`;
  }
  if (roomKind(room) === "public") {
    return `${roomAudienceLabel(room)} · 群聊`;
  }
  return room.participant_label || room.route_label || "系统会话";
}

function renderConversationMetaChips(room, chips = []) {
  if (!metaEl) return;
  clearChildren(metaEl);
  const title = document.createElement("div");
  title.className = "meta-title";
  title.textContent = room
    ? currentShellPage() === "user"
      ? roomThreadHeadline(room) || room.participant_label || room.title
      : roomThreadHeadline(room)
    : "尚未选择会话";
  metaEl.appendChild(title);
  if (!chips.length) return;
  const row = document.createElement("div");
  row.className = "meta-chip-row";
  for (const { text, tone } of chips) {
    row.appendChild(createMetaChip(text, tone || "muted"));
  }
  metaEl.appendChild(row);
}

function renderRoomDigest(rooms) {
  if (!roomDigestEl) return;
  clearChildren(roomDigestEl);
  const shellPage = currentShellPage();
  const activeRoom = activeRoomId ? state.rooms.find((room) => room.id === activeRoomId) : null;
  const directCount = state.rooms.filter((room) => roomKind(room) === "direct").length;
  const publicCount = state.rooms.filter((room) => roomKind(room) === "public").length;
  const systemCount = state.rooms.filter((room) => roomKind(room) === "system").length;
  const unreadTotal = state.rooms.reduce((sum, room) => sum + unreadCount(room), 0);
  const draftTotal = state.rooms.reduce((sum, room) => sum + Number(roomHasDraft(room.id)), 0);
  const followUpCount = state.rooms.reduce((sum, room) => sum + Number(roomFollowUpCount(room) > 0), 0);
  const caretakerQueue = state.rooms.reduce((sum, room) => sum + caretakerPendingCount(room), 0);
  const notificationTotal = state.rooms.reduce((sum, room) => sum + caretakerNotificationCount(room), 0);
  const title = document.createElement("div");
  title.className = "room-digest-title";
  title.textContent = rooms.length ? `最近会话 · ${rooms.length}` : "最近会话 · 暂无";
  roomDigestEl.appendChild(title);

  const copy = document.createElement("div");
  copy.className = "room-digest-copy";
  copy.textContent =
    activeRoom
      ? shellPage === "admin"
        ? roomThreadHeadline(activeRoom)
        : roomContextSummary(activeRoom)
      : shellPage === "admin"
        ? "先看未读和待跟进，再继续聊天。"
        : "先看最近消息，更多入口按需再打开。";
  roomDigestEl.appendChild(copy);

  const chips = document.createElement("div");
  chips.className = "room-digest-chips";
  if (shellPage === "admin") {
    chips.appendChild(createPill(`${followUpCount} 个待跟进`, followUpCount > 0 ? "warm" : "muted"));
    chips.appendChild(createPill(`${caretakerQueue} 条访客提醒`, caretakerQueue > 0 ? "warm" : "accent"));
    chips.appendChild(createPill(`${notificationTotal} 条提醒`, notificationTotal > 0 ? "accent" : "muted"));
    chips.appendChild(createPill(`${publicCount} 个频道 · ${directCount} 个私信`, "muted"));
    if (systemCount > 0) {
      chips.appendChild(createPill(`${systemCount} 个系统项`, "muted"));
    }
  } else {
    chips.appendChild(createPill(`${unreadTotal} 条未读`, unreadTotal > 0 ? "warm" : "muted"));
    chips.appendChild(createPill(`${draftTotal} 条草稿`, draftTotal > 0 ? "accent" : "muted"));
    chips.appendChild(createPill(`${directCount} 个私信 · ${publicCount} 个群聊`, "muted"));
    if (caretakerQueue > 0) {
      chips.appendChild(createPill(`${caretakerQueue} 条小狗留言`, "accent"));
    }
  }
  if (activeRoom) {
    chips.appendChild(createPill(roomThreadHeadline(activeRoom), "muted"));
    if (shellPage !== "user") {
      chips.appendChild(
        createPill(
          roomChatStatusSummary(activeRoom),
          roomSendErrors[activeRoom.id] ? "danger" : pendingEchoesForRoom(activeRoom.id).length ? "warm" : "accent",
        ),
      );
      chips.appendChild(
        createPill(
          roomQueueSummary(activeRoom),
          caretakerPendingCount(activeRoom) > 0 || unreadCount(activeRoom) > 0 ? "warm" : "muted",
        ),
      );
    }
    chips.appendChild(
      createPill(
        shellPage === "admin"
          ? `当前会话 ${roomThreadHeadline(activeRoom)}`
          : `当前 ${roomThreadHeadline(activeRoom)}`,
        "muted",
      ),
    );
    if (caretakerProfile(activeRoom)) {
      chips.appendChild(
        createPill(
          `${caretakerProfile(activeRoom).name} 在岗 · ${caretakerPendingCount(activeRoom)} 条代办`,
          caretakerPendingCount(activeRoom) > 0 ? "warm" : "accent",
        ),
      );
    }
  }
  roomDigestEl.appendChild(chips);
}

function renderThreadStatusRail(room) {
  if (!threadStatusRailEl) return;
  clearChildren(threadStatusRailEl);
  const shellPage = currentShellPage();
  if (!room) {
    threadStatusRailEl.classList.add("surface-hidden");
    return;
  }
  if (shellPage === "user") {
    threadStatusRailEl.classList.add("surface-hidden");
    return;
  }
  threadStatusRailEl.classList.remove("surface-hidden");

  const items = [
    {
      label: shellPage === "admin" ? "线程" : "会话标题",
      value: roomThreadHeadline(room),
      tone: "muted",
    },
    {
      label: "聊天状态",
      value: roomChatStatusSummary(room),
      tone: roomSendErrors[room.id] ? "danger" : visiblePendingEchoCount(room) ? "warm" : "accent",
    },
    {
      label: "队列",
      value: roomQueueSummary(room),
      tone: caretakerPendingCount(room) > 0 || unreadCount(room) > 0 ? "warm" : "muted",
    },
    { label: shellPage === "admin" ? "后台对象" : "聊天对象", value: roomAudienceLabel(room), tone: "accent" },
    { label: "路由", value: roomRouteLabel(room), tone: roomSendErrors[room.id] ? "danger" : "muted" },
    { label: "同步", value: roomSyncLabel(), tone: refreshInProgress ? "warm" : "muted" },
    {
      label: "输入",
      value: isSendingMessage ? "发送中" : roomSendErrors[room.id] ? "待重发" : "可输入",
      tone: roomSendErrors[room.id] ? "danger" : isSendingMessage ? "warm" : "accent",
    },
  ];
  if (roomHasDraft(room.id)) {
    items.push({
      label: "草稿",
      value: `${draftForRoom(room.id).trim().length} 字`,
      tone: "accent",
    });
  }
  if (caretakerProfile(room)) {
    items.push({
      label: caretakerProfile(room).role_label || "房间管家",
      value: `${caretakerProfile(room).name} · ${caretakerStatusLine(room)}`,
      tone: caretakerPendingCount(room) > 0 ? "warm" : "accent",
    });
    if (caretakerNotificationCount(room) > 0) {
      items.push({
        label: "提醒",
        value: `${caretakerNotificationCount(room)} 条给主人`,
        tone: "muted",
      });
    }
  }

  for (const item of items) {
    const chip = document.createElement("div");
    chip.className = `thread-status-item thread-status-item-${item.tone}`;
    chip.appendChild(createLine("thread-status-label", item.label));
    chip.appendChild(createLine("thread-status-value", item.value));
    threadStatusRailEl.appendChild(chip);
  }
}

function renderComposerMeta(room) {
  if (!composerMetaEl) return;
  clearChildren(composerMetaEl);
  const shellPage = currentShellPage();
  const baseStatus = room
    ? roomSendErrors[room.id]
      ? "待修改后重发"
      : isSendingMessage
        ? "发送中"
        : roomHasDraft(room.id)
          ? "草稿已保存"
          : "可直接发送"
    : "先打开会话";
  const items =
    shellPage === "user"
      ? [
          { label: "当前会话", value: room ? roomThreadHeadline(room) : "未选择会话" },
          { label: "聊天对象", value: room ? roomAudienceLabel(room) : "等待会话" },
          { label: "同步", value: room ? roomSyncLabel() : gatewayUrl ? "等待会话" : "等待网关" },
          { label: "状态", value: baseStatus },
        ]
      : [
          {
            label: shellPage === "admin" ? "线程" : "会话标题",
            value: room ? roomThreadHeadline(room) : "未选择会话",
          },
          {
            label: shellPage === "admin" ? "当前对象" : "聊天对象",
            value: room ? roomAudienceLabel(room) : gatewayUrl ? "等待会话" : "等待网关",
          },
          {
            label: shellPage === "admin" ? "消息去向" : "路由",
            value: room ? roomRouteLabel(room) : gatewayUrl ? "等待会话" : "等待网关",
          },
          {
            label: "聊天状态",
            value: room ? roomChatStatusSummary(room) : baseStatus,
          },
          {
            label: "队列",
            value: room ? roomQueueSummary(room) : "等待会话",
          },
          {
            label: shellPage === "admin" ? "当前身份" : "身份",
            value: currentIdentity() || "访客",
          },
          { label: "输入", value: baseStatus },
        ];
  if (room && caretakerProfile(room)) {
    items.push({
      label: shellPage === "admin" ? "巡检/管家" : "管家",
      value: `${caretakerProfile(room).name} · ${caretakerProfile(room).auto_reply}`,
    });
  }
  const quickHint = shellMode === "admin"
    ? "更多 · 刷新"
    : "广场 · 刷新";
  items.push({ label: "快捷", value: quickHint, tone: "muted" });
  for (const item of items) {
    const block = document.createElement("div");
    block.className = "composer-meta-item";
    block.appendChild(createLine("composer-meta-label", item.label));
    block.appendChild(createLine("composer-meta-value", item.value));
    composerMetaEl.appendChild(block);
  }
}

function roleAllowsCreatePublicRoom(role) {
  return role === "Lord";
}

function roleAllowsApproveJoin(role) {
  return role === "Lord";
}

function roleAllowsFreezeRoom(role) {
  return role === "Lord" || role === "Steward";
}

function roleAllowsManageStewards(role) {
  return role === "Lord";
}

function roleAllowsUpdateFederation(role) {
  return role === "Lord";
}

function translateRole(role) {
  switch (role) {
    case "Lord":
      return "城主";
    case "Steward":
      return "执事";
    case "Resident":
      return "居民";
    default:
      return "未知身份";
  }
}

function translateMembershipState(state) {
  switch (state) {
    case "Active":
      return "已激活";
    case "PendingApproval":
      return "待审批";
    case "Suspended":
      return "已暂停";
    case "Revoked":
      return "已撤销";
    default:
      return "未知状态";
  }
}

function translateFederationPolicy(policy) {
  switch (policy) {
    case "Open":
      return "开放互联";
    case "Selective":
      return "选择互联";
    case "Isolated":
      return "孤城断联";
    default:
      return "未知策略";
  }
}

function translateTrustState(state) {
  switch (state) {
    case "Healthy":
      return "健康";
    case "UnderReview":
      return "审查中";
    case "Quarantined":
      return "隔离观察";
    case "Isolated":
      return "孤城断联";
    default:
      return "未知状态";
  }
}

function translateSourceKind(kind) {
  switch (kind) {
    case "Seed":
      return "种子城";
    case "Mirror":
      return "镜像源";
    case "Primary":
      return "主源";
    default:
      return "未知来源";
  }
}

function translateSeverity(level) {
  switch (level) {
    case "info":
      return "普通";
    case "warning":
      return "警告";
    case "urgent":
      return "紧急";
    default:
      return "普通";
  }
}

function translateSubjectKind(kind) {
  switch (kind) {
    case "City":
      return "城市";
    case "Room":
      return "房间";
    case "MirrorSource":
      return "镜像源";
    case "Resident":
      return "居民";
    default:
      return "对象";
  }
}

function translateRoomKind(kind) {
  switch (kind) {
    case "direct":
      return "私信";
    case "public":
      return "公共频道";
    default:
      return "系统通知";
  }
}

function translateRoomKindForShellPage(kind, shellPage = currentShellPage()) {
  if (shellPage === "user") {
    switch (kind) {
      case "direct":
        return "居民私信";
      case "public":
        return "城镇频道";
      default:
        return "城门消息";
    }
  }
  return translateRoomKind(kind);
}

function translateReportStatus(status) {
  switch (status) {
    case "Pending":
      return "待处理";
    case "Reviewed":
      return "已审查";
    case "Resolved":
      return "已处理";
    case "Dismissed":
      return "已驳回";
    default:
      return "待处理";
  }
}

function translateProviderMode(mode) {
  switch (mode) {
    case "local-memory":
      return "本地草稿";
    case "gateway-bridge":
      return "当前网关";
    case "remote-gateway":
      return "外部网关";
    case "remote-provider":
      return "外部消息源";
    case "unknown":
      return "未知";
    default:
      return "未知";
  }
}

function translateProviderHealth(reachable) {
  return reachable ? "正常" : "降级";
}

function translateProviderConnectionState(state) {
  switch (state) {
    case "Connected":
      return "已连接";
    case "Disconnected":
      return "已断开";
    default:
      return "状态未知";
  }
}

function translateResidentLabel(residentId) {
  return residentId === currentIdentity() ? "你" : "居民";
}

function translateTargetKind(kind) {
  return translateSubjectKind(kind);
}

function translatePortability(revoked) {
  return revoked ? "已撤销" : "可迁移";
}

function localizedRuntimeError(error, fallbackMessage) {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  if (!message) return fallbackMessage;
  if (message === "login required before sending messages") return "请先登录后发送";
  if (message === "message text required") return "请输入内容后发送";
  if (/^room .+ is frozen$/.test(message)) return "房间已冻结，暂不能发送";
  if (/^unknown public room:/.test(message)) return "房间不存在，无法发送";
  if (/^resident .+ is not active in city .+$/.test(message)) return "当前居民不在该城市，无法发送";
  return /[A-Za-z]/.test(message) ? fallbackMessage : message;
}

function translateDeliveryMode(mode) {
  switch (mode) {
    case "dev-inline-code":
      return "开发环境直出验证码";
    case "mailer-adapter-pending":
      return "邮件通道待接入";
    case "email":
      return "邮箱投递";
    default:
      return "未知投递方式";
  }
}

function translateAdvisoryAction(action) {
  switch (action) {
    case "block-link":
      return "封禁链接";
    case "quarantine":
      return "隔离观察";
    case "isolate":
      return "孤城断联";
    case "disconnect":
      return "断开互联";
    case "deny-join":
      return "禁止加入";
    default:
      return "未命名动作";
  }
}

function displayWorldTitle(title) {
  if (title === "Lobster World") return "龙虾世界";
  return title;
}

function displayCityTitle(city) {
  if (city?.title === "Core Harbor" || city?.slug === "core-harbor") return "核心港";
  return city?.title || city?.slug || "未命名城市";
}

function displayCityDescription(city) {
  if (city?.description === "Default city for local-first relay, shell, and governance testing.") {
    return "用于本地优先中继、聊天预览与侧边处理走查的默认测试城市。";
  }
  return city?.description || "暂无城市简介";
}

function roomKind(room) {
  if (room?.id?.startsWith("dm:")) return "direct";
  if (room?.id?.startsWith("room:")) return "public";
  return "system";
}

function roomPreview(room) {
  const preview = resolveRoomQuickPreview(room);
  const previewField = quickActionPreviewPrimaryFieldText(preview?.structured);
  if (previewField) return previewField;
  if (typeof room?.preview_text === "string" && room.preview_text.trim()) {
    return room.preview_text.trim();
  }
  return latestRoomMessageLike(room)?.text || "还没有消息，先发第一句吧。";
}

function roomLastActivity(room) {
  if (typeof room?.last_activity_label === "string" && room.last_activity_label.trim()) {
    return room.last_activity_label.trim();
  }
  const lastMessage = latestRoomMessageLike(room);
  if (!lastMessage) return "暂无消息";
  return `${lastMessage.sender} · ${lastMessage.pending ? "待同步" : lastMessage.timestamp}`;
}

function roomActivityTime(room) {
  if (typeof room?.activity_time_label === "string" && room.activity_time_label.trim()) {
    return room.activity_time_label.trim();
  }
  const lastMessage = latestRoomMessageLike(room);
  return lastMessage?.pending ? "待同步" : lastMessage?.timestamp || "暂无消息";
}

function badgeToken(value, fallback = "聊") {
  const normalized = String(value || "")
    .replace(/^私信\s*·\s*/u, "")
    .replace(/^[#@]/u, "")
    .trim();
  if (!normalized) return fallback;
  return normalized.slice(0, 2).toUpperCase();
}

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
        tagRow.appendChild(createPill("草稿", "accent"));
      }
      if (visiblePendingEchoCount(room)) {
        tagRow.appendChild(createPill("待同步", roomSendErrors[room.id] ? "danger" : "warm"));
      }
      if (roomSendErrors[room.id]) {
        tagRow.appendChild(createPill("待重发", "danger"));
      }
      if (caretakerProfile(room)) {
        tagRow.appendChild(
          createPill(
            `${caretakerProfile(room).name} · ${caretakerPendingCount(room)} 条代办`,
            caretakerPendingCount(room) > 0 ? "warm" : "accent",
          ),
        );
      }
      if (room.scene_banner) {
        tagRow.appendChild(createPill(room.scene_banner, "warm"));
      }
      content.appendChild(tagRow);
      const roomInlineActions = createRoomInlineActions(room);
      if (roomInlineActions) {
        content.appendChild(roomInlineActions);
      }
      content.appendChild(createLine("room-sub", roomSummaryLine(room)));
      content.appendChild(createLine("room-status-line", roomStatusLine(room)));

      button.appendChild(avatar);
      button.appendChild(content);
      item.appendChild(button);
      list.appendChild(item);
    }

    section.appendChild(list);
    roomListEl.appendChild(section);
  }
  ensureRoomQuickActions();
}

function renderConversationOverview() {
  if (!conversationOverviewEl) return;
  clearChildren(conversationOverviewEl);
  const shellPage = currentShellPage();
  const compactChatShell = shellPage === "user" || shellPage === "admin";

  const room = state.rooms.find((item) => item.id === activeRoomId);
  if (!room) {
    conversationOverviewEl.appendChild(createLine("overview-title", "还没有打开聊天"));
    conversationOverviewEl.appendChild(
      createLine(
        "overview-summary",
        gatewayUrl
          ? "先去群聊页打开一个群聊，或者直接发起私信，聊天区就会进入可发送状态。"
          : "当前在离线预览态，只显示样例会话；连接网关后会接入真实消息流。",
      ),
    );
    updateConversationCallout();
    return;
  }

  const header = document.createElement("div");
  header.className = "overview-header";

  const overviewTitle = roomThreadHeadline(room);
  const overviewHeaderSummary =
    shellPage === "user"
      ? room.overview_summary || room.context_summary || room.subtitle || roomSummaryLine(room)
      : shellPage === "admin"
        ? `后台对象 · ${roomSummaryLine(room)}`
        : roomSummaryLine(room);

  const titleWrap = document.createElement("div");
  titleWrap.className = "overview-title-wrap";
  titleWrap.appendChild(createLine("overview-title", overviewTitle));
  titleWrap.appendChild(createLine("overview-summary", overviewHeaderSummary));
  header.appendChild(titleWrap);

  const badgeWrap = document.createElement("div");
  badgeWrap.className = "overview-meta";
  badgeWrap.appendChild(
    createPill(
      translateRoomKind(roomKind(room)),
      roomKind(room) === "direct" ? "accent" : "muted",
    ),
  );
  badgeWrap.appendChild(createPill(roomAudienceLabel(room), "muted"));
  if (!compactChatShell) {
    badgeWrap.appendChild(createPill(`身份 ${currentIdentity()}`, "muted"));
  }
  if (room.scene_banner) {
    badgeWrap.appendChild(createPill(room.scene_banner, "warm"));
  }
  if (caretakerProfile(room)) {
    badgeWrap.appendChild(
      createPill(
        `${caretakerProfile(room).name} · ${caretakerProfile(room).role_label}`,
        "accent",
      ),
    );
  }
  header.appendChild(badgeWrap);
  conversationOverviewEl.appendChild(header);

  if (shellPage === "user") {
    const previewAction = latestRoomQuickAction(room);
    const preview = resolveRoomQuickPreview(room, previewAction);
    conversationOverviewEl.appendChild(createLine("overview-summary", roomOverviewSummary(room)));
    if (preview) {
      const previewFieldView = roomQuickPreviewFieldView(
        room.id,
        preview.action,
        preview.state,
        preview.snapshotIndex,
      );
      const previewSummaryLine = createQuickActionPreviewSummaryLine(preview, {
        className: "overview-summary overview-summary-preview quick-action-preview-summary",
        includePrefix: true,
        fieldView: previewFieldView,
      });
      if (previewSummaryLine) {
        conversationOverviewEl.appendChild(previewSummaryLine);
      }
      const previewCard = createQuickActionPreviewCard(preview.action, preview.state, preview.structured, {
        className: "overview-preview-card",
        maxFields: 3,
        roomId: room.id,
        fieldView: previewFieldView,
        historyLabel: preview.historyLabel || "",
        history: preview.history,
        selectedHistoryIndex: preview.snapshotIndex,
        onHistoryClick: (_snapshot, index) => {
          previewRoomQuickStage(room.id, preview.action, preview.state, index);
        },
        onFieldViewChange: (viewId) => {
          setRoomQuickPreviewFieldView(room.id, preview.action, preview.state, preview.snapshotIndex, viewId);
        },
      });
      if (previewCard) {
        conversationOverviewEl.appendChild(previewCard);
      }
    }

    const userStatus = document.createElement("div");
    userStatus.className = "overview-status";
    userStatus.appendChild(createPill(roomSyncLabel(), refreshInProgress ? "warm" : "accent"));
    const unread = unreadCount(room);
    userStatus.appendChild(createPill(unread > 0 ? `${unread} 条未读` : "已读", unread > 0 ? "warm" : "muted"));
    const roomActionPill = createRoomQuickActionPill(room);
    if (roomActionPill) {
      userStatus.appendChild(roomActionPill);
    }
    if (caretakerProfile(room)) {
      userStatus.appendChild(
        createPill(`${caretakerProfile(room).name} 在线`, caretakerPendingCount(room) > 0 ? "warm" : "accent"),
      );
    }
    if (roomHasDraft(room.id)) {
      userStatus.appendChild(createPill("草稿已保存", "accent"));
    }
    if (roomSendErrors[room.id]) {
      userStatus.appendChild(createPill("发送失败", "danger"));
    }
    if (isSendingMessage) {
      userStatus.appendChild(createPill("发送中", "warm"));
    }
    conversationOverviewEl.appendChild(userStatus);

    const userWorkflow = createWorkflowProgress(latestRoomQuickAction(room), latestRoomQuickState(room), {
      className: "overview-workflow-progress",
      title: "当前阶段",
      stages: workflowProfile(room)?.steps,
      onStageClick: (stage) => {
        const action = latestRoomQuickAction(room);
        if (!action) return;
        previewRoomQuickStage(room.id, action, stage.label);
        seedComposerFromQuickAction(action, quickActionWorkflowTemplate(action, stage.label), { force: true });
      },
    });
    if (userWorkflow) {
      conversationOverviewEl.appendChild(userWorkflow);
    }

    const userActions = document.createElement("div");
    userActions.className = "overview-actions";

    const refreshButton = document.createElement("button");
    refreshButton.type = "button";
    refreshButton.textContent = "刷新聊天";
    refreshButton.disabled = !gatewayUrl;
    refreshButton.addEventListener("click", async () => {
      if (!gatewayUrl) return;
      await refreshFromGateway();
    });
    userActions.appendChild(refreshButton);
    appendRoomQuickActionOverviewButton(userActions, room);
    appendRoomQuickStateAdvanceButton(userActions, room);
    conversationOverviewEl.appendChild(userActions);

    if (roomViewToggleButtonEl) {
      roomViewToggleButtonEl.textContent = chatPaneMode === "list" ? "返回会话" : "会话列表";
    }
    updateConversationCallout();
    return;
  }

  conversationOverviewEl.appendChild(
    createLine(
      "overview-summary",
      shellPage === "admin" ? `当前窗口重点：${roomOverviewSummary(room)}` : roomOverviewSummary(room),
    ),
  );

  const context = document.createElement("div");
  context.className = "overview-context";
  context.appendChild(
    createLine(
      "overview-context-title",
      shellPage === "admin" ? `后台摘要 · ${roomSummaryLine(room)}` : roomSummaryLine(room),
    ),
  );
  context.appendChild(createLine("overview-context-copy", roomContextSummary(room)));
  context.appendChild(createLine("overview-context-copy", roomStatusLine(room)));
  conversationOverviewEl.appendChild(context);

  const status = document.createElement("div");
  status.className = "overview-status";
  status.appendChild(
    createPill(
      roomChatStatusSummary(room),
      roomSendErrors[room.id] ? "danger" : visiblePendingEchoCount(room) ? "warm" : "accent",
    ),
  );
  status.appendChild(
    createPill(
      roomQueueSummary(room),
      caretakerPendingCount(room) > 0 || unreadCount(room) > 0 ? "warm" : "muted",
    ),
  );
  status.appendChild(createPill(roomSyncLabel(), refreshInProgress ? "warm" : "accent"));
  status.appendChild(createPill(roomRouteLabel(room), roomSendErrors[room.id] ? "danger" : "muted"));
  if (!compactChatShell) {
    status.appendChild(createPill(`${room.messages?.length || 0} 条消息`, "muted"));
  }
  const unread = unreadCount(room);
  status.appendChild(createPill(unread > 0 ? `${unread} 条未读` : "已读", unread > 0 ? "warm" : "muted"));
  const roomActionPill = createRoomQuickActionPill(room);
  if (roomActionPill) {
    status.appendChild(roomActionPill);
  }
  if (roomHasDraft(room.id)) {
    status.appendChild(createPill(`${draftForRoom(room.id).trim().length} 字草稿`, "accent"));
  }
  if (caretakerProfile(room)) {
    status.appendChild(
      createPill(
        `${caretakerProfile(room).status} · ${caretakerPendingCount(room)} 条访客提醒`,
        caretakerPendingCount(room) > 0 ? "warm" : "accent",
      ),
    );
  }
  if (isSendingMessage) {
    status.appendChild(createPill("发送中", "warm"));
  }
  if (roomSendErrors[room.id]) {
    status.appendChild(createPill("发送失败", "danger"));
  }
  if (lastRefreshErrorMessage) {
    status.appendChild(createPill("回退快照", "warm"));
  }
  conversationOverviewEl.appendChild(status);

  const actions = document.createElement("div");
  actions.className = "overview-actions";

  const refreshButton = document.createElement("button");
  refreshButton.type = "button";
  refreshButton.textContent = shellPage === "admin" ? "刷新会话" : "刷新聊天";
  refreshButton.disabled = !gatewayUrl;
  refreshButton.addEventListener("click", async () => {
    if (!gatewayUrl) return;
    await refreshFromGateway();
  });
  actions.appendChild(refreshButton);

  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.textContent = shellPage === "admin" ? "导出会话" : "导出聊天";
  exportButton.addEventListener("click", () => exportCurrentButtonEl?.click());
  actions.appendChild(exportButton);
  appendRoomQuickActionOverviewButton(actions, room);
  appendRoomQuickStateAdvanceButton(actions, room);

  if (shellPage !== "user") {
    const worldButton = document.createElement("button");
    worldButton.type = "button";
    worldButton.textContent =
      shellPage === "admin"
        ? roomKind(room) === "direct"
          ? "转到频道"
          : "去找居民"
        : roomKind(room) === "direct"
          ? "去找频道"
          : "去找人";
    worldButton.addEventListener("click", () => setWorkspace("world"));
    actions.appendChild(worldButton);
  }

  if (shellMode !== "user") {
    const governanceButton = document.createElement("button");
    governanceButton.type = "button";
    governanceButton.textContent = "更多";
    governanceButton.addEventListener("click", () => setWorkspace("governance"));
    actions.appendChild(governanceButton);
  }

  conversationOverviewEl.appendChild(actions);

  if (roomViewToggleButtonEl) {
    roomViewToggleButtonEl.textContent = chatPaneMode === "list" ? "返回会话" : "会话列表";
  }
  updateConversationCallout();
}

function renderChatDetailPanel() {
  const shellPage = currentShellPage();
  if (currentShellPage() === "user") {
    ensureUserSceneChrome();
  }
  if (!chatDetailContentEl) return;
  clearChildren(chatDetailContentEl);

  const room = state.rooms.find((item) => item.id === activeRoomId);
  if (!room) {
    const empty = createDetailSection(
      "当前房间卡片",
      gatewayUrl
        ? "先从左侧打开一个会话，底部会显示房间卡片、状态和快捷动作。"
        : "连接网关后，这里会展示房间卡片、状态和快捷操作。",
    );
    chatDetailContentEl.appendChild(empty);
    return;
  }

  const publicRoom = publicRoomRecordForConversation(room.id);
  const cityState = cityStateForConversation(room.id);
  const directoryCity = publicRoom ? worldDirectoryCity(publicRoom.city_id) : null;
  const membership = publicRoom ? membershipForCity(publicRoom.city_id) : null;

  const hero = document.createElement("section");
  hero.className = "chat-detail-hero";
  hero.appendChild(createLine("chat-detail-title", roomThreadHeadline(room)));
  hero.appendChild(createLine("chat-detail-copy", roomContextSummary(room)));

  const pills = document.createElement("div");
  pills.className = "chat-detail-pills";
  pills.appendChild(
    createPill(
      translateRoomKindForShellPage(roomKind(room), currentShellPage()),
      roomKind(room) === "direct" ? "accent" : "warm",
    ),
  );
  pills.appendChild(createPill(roomAudienceLabel(room), "muted"));
  pills.appendChild(createPill(`身份 ${currentIdentity()}`, "muted"));
  if (unreadCount(room) > 0) {
    pills.appendChild(createPill(`${unreadCount(room)} 条未读`, "warm"));
  }
  if (roomHasDraft(room.id)) {
    pills.appendChild(createPill("草稿未发", "accent"));
  }
  if (room.scene_banner) {
    pills.appendChild(createPill(room.scene_banner, "muted"));
  }
  if (caretakerProfile(room)) {
    pills.appendChild(createPill(`${caretakerProfile(room).name} 在岗`, "accent"));
  }
  hero.appendChild(pills);
  chatDetailContentEl.appendChild(hero);

  const runtime = createDetailSection("聊天状态");
  if (shellPage !== "user") {
    runtime.appendChild(
      createDetailRow(shellPage === "admin" ? "线程" : "会话标题", roomThreadHeadline(room)),
    );
    runtime.appendChild(createDetailRow("聊天状态", roomChatStatusSummary(room)));
    runtime.appendChild(createDetailRow("队列", roomQueueSummary(room)));
  }
  runtime.appendChild(createDetailRow("同步", roomSyncLabel()));
  runtime.appendChild(createDetailRow("消息数", `${room.messages?.length || 0} 条`));
  if (latestRoomQuickAction(room)) {
    const latestAction = latestRoomQuickAction(room);
    const preview = resolveRoomQuickPreview(room, latestAction);
    runtime.appendChild(
      createDetailRow("最近动作", `${latestAction} · ${quickActionStatusCopy(latestAction)}`),
    );
    runtime.appendChild(
      createDetailRow("动作状态", `${quickActionFollowUpLabel(latestAction, latestRoomQuickState(room))} · ${quickActionFollowUpCopy(latestAction, latestRoomQuickState(room))}`),
    );
    if (preview) {
      const previewFieldView = roomQuickPreviewFieldView(
        room.id,
        preview.action,
        preview.state,
        preview.snapshotIndex,
      );
      const previewSummaryLine = createQuickActionPreviewSummaryLine(preview, {
        tagName: "span",
        className: "quick-action-preview-summary-line",
        fieldView: previewFieldView,
      });
      runtime.appendChild(createDetailRow("阶段预览", previewSummaryLine || preview.detailText));
      const previewCard = createQuickActionPreviewCard(preview.action, preview.state, preview.structured, {
        className: "chat-detail-preview-card",
        maxFields: 3,
        roomId: room.id,
        fieldView: previewFieldView,
        historyLabel: preview.historyLabel || "",
        history: preview.history,
        selectedHistoryIndex: preview.snapshotIndex,
        onHistoryClick: (_snapshot, index) => {
          previewRoomQuickStage(room.id, preview.action, preview.state, index);
        },
        onFieldViewChange: (viewId) => {
          setRoomQuickPreviewFieldView(room.id, preview.action, preview.state, preview.snapshotIndex, viewId);
        },
      });
      if (previewCard) {
        runtime.appendChild(previewCard);
      }
    }
  }
  runtime.appendChild(
    createDetailRow(
      "消息来源",
      `${translateProviderMode(provider.mode || "unknown")} · ${translateProviderConnectionState(
        provider.connection_state,
      )}`,
    ),
  );
  runtime.appendChild(
    createDetailRow(
      "输入状态",
      gatewayUrl ? (isSendingMessage ? "发送中" : "可发送") : "等待网关",
    ),
  );
  if (caretakerProfile(room)) {
    runtime.appendChild(createDetailRow("管家状态", caretakerStatusLine(room)));
  }
  if (roomSendErrors[room.id]) {
    runtime.appendChild(createDetailRow("最近错误", roomSendErrors[room.id]));
  }
  chatDetailContentEl.appendChild(runtime);

  if (caretakerProfile(room)) {
    const caretaker = caretakerProfile(room);
    const caretakerSection = createDetailSection(
      `${caretaker.role_label || "房间管家"} · ${caretaker.name}`,
      caretaker.persona || "这只小狗会帮主人记住访客、留言和需要提醒的事情。",
    );
    caretakerSection.appendChild(createDetailRow("人设", caretaker.persona || "未设定"));
    caretakerSection.appendChild(createDetailRow("短期记忆", caretaker.memory || "暂无记录"));
    caretakerSection.appendChild(createDetailRow("自动回复", caretaker.auto_reply || "未设定"));
    if (caretaker.patrol?.outcome) {
      caretakerSection.appendChild(createDetailRow("巡视结果", caretaker.patrol.outcome));
    }
    if (Array.isArray(caretaker.messages) && caretaker.messages.length) {
      const visitorList = document.createElement("div");
      visitorList.className = "chat-detail-list";
      for (const message of caretaker.messages.slice(0, 3)) {
        const item = document.createElement("div");
        item.className = "caretaker-note";
        item.appendChild(
          createLine(
            "caretaker-note-title",
            `${message.visitor} · ${message.urgency || "普通"}`,
          ),
        );
        item.appendChild(createLine("caretaker-note-copy", message.note));
        visitorList.appendChild(item);
      }
      caretakerSection.appendChild(visitorList);
    }
    if (Array.isArray(caretaker.notifications) && caretaker.notifications.length) {
      const notificationList = document.createElement("div");
      notificationList.className = "chat-detail-list";
      for (const note of caretaker.notifications.slice(0, 2)) {
        const item = document.createElement("div");
        item.className = "caretaker-note caretaker-note-alert";
        item.appendChild(createLine("caretaker-note-title", "给主人的提醒"));
        item.appendChild(createLine("caretaker-note-copy", note));
        notificationList.appendChild(item);
      }
      caretakerSection.appendChild(notificationList);
    }
    chatDetailContentEl.appendChild(caretakerSection);
  }

  if (publicRoom) {
    const cityProfile = cityState?.profile || directoryCity || {
      title: publicRoom.city_id,
      slug: publicRoom.city_id,
    };
    const citySection = createDetailSection(
      "城市 / 频道资料",
      publicRoom.description || displayCityDescription(cityProfile),
    );
    citySection.appendChild(createDetailRow("城市", displayCityTitle(cityProfile)));
    citySection.appendChild(createDetailRow("频道", publicRoom.slug || publicRoom.room_id));
    citySection.appendChild(
      createDetailRow("治理状态", publicRoom.frozen ? "房间已冻结" : "房间可发言"),
    );
    if (directoryCity?.trust_state) {
      citySection.appendChild(
        createDetailRow("世界信任", translateTrustState(directoryCity.trust_state)),
      );
    }
    if (cityState?.profile?.federation_policy) {
      citySection.appendChild(
        createDetailRow(
          "联邦策略",
          translateFederationPolicy(cityState.profile.federation_policy),
        ),
      );
    }
    if (membership) {
      citySection.appendChild(createDetailRow("你的身份", humanMembership(membership)));
    }
    chatDetailContentEl.appendChild(citySection);

    const siblingRooms = publicRoomsForCity(publicRoom.city_id).filter((item) => item.room_id !== room.id);
    if (siblingRooms.length) {
      const related = createDetailSection("同城其他群聊");
      const list = document.createElement("div");
      list.className = "chat-detail-list";
      for (const sibling of siblingRooms.slice(0, 5)) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "chat-detail-link";
        button.textContent = `${sibling.slug} · ${sibling.frozen ? "已冻结" : "可发言"}`;
        button.addEventListener("click", async () => {
          focusRoom(sibling.room_id);
          await loadGatewayState();
          renderRooms();
          renderTimeline();
        });
        list.appendChild(button);
      }
      related.appendChild(list);
      chatDetailContentEl.appendChild(related);
    }
  } else {
    const direct = createDetailSection(
      "私信窗口",
      governance.world?.allows_cross_city_private_messages
        ? "当前世界允许跨城私信，适合直接协作、追问和一对一沟通。"
        : "当前世界未开启跨城私信，建议优先在同城身份下沟通。",
    );
    direct.appendChild(
      createDetailRow(
        "会话对象",
        room.peer_label || room.participant_label || roomAudienceLabel(room) || roomDisplayPeer(room) || "私信对象",
      ),
    );
    direct.appendChild(
      createDetailRow(
        "跨城私信",
        governance.world?.allows_cross_city_private_messages ? "已开启" : "已关闭",
      ),
    );
    direct.appendChild(createDetailRow("窗口类型", "点对点聊天"));
    chatDetailContentEl.appendChild(direct);
  }

  const actions = createDetailSection("快捷动作");
  const actionRow = document.createElement("div");
  actionRow.className = "chat-detail-actions";

  const refreshButton = document.createElement("button");
  refreshButton.type = "button";
  refreshButton.className = "secondary";
  refreshButton.textContent = "刷新";
  refreshButton.disabled = !gatewayUrl;
  refreshButton.addEventListener("click", async () => {
    if (!gatewayUrl) return;
    await refreshFromGateway();
  });
  actionRow.appendChild(refreshButton);

  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.className = "secondary";
  exportButton.textContent = "导出当前";
  exportButton.disabled = !exportCurrentButtonEl;
  exportButton.addEventListener("click", () => {
    exportCurrentButtonEl?.click();
  });
  actionRow.appendChild(exportButton);

  if (shellPage !== "user") {
    const worldButton = document.createElement("button");
    worldButton.type = "button";
    worldButton.className = "secondary";
    worldButton.textContent = roomKind(room) === "direct" ? "去找人" : "去找房间";
    worldButton.addEventListener("click", () => {
      setWorkspace("world");
    });
    actionRow.appendChild(worldButton);
  }

  actions.appendChild(actionRow);
  chatDetailContentEl.appendChild(actions);
}

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

    const timestamp = document.createElement("span");
    timestamp.className = "message-time";
    timestamp.textContent = message.failed ? "发送失败" : "正在投递";
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

  if (room && (messages.length > 0 || pending.length > 0)) {
    ensureScrollToBottomFab();
  }

  if (pending.some((message) => !message.failed)) {
    const typingEl = document.createElement("div");
    typingEl.className = "timeline-typing";
    const dotsEl = document.createElement("span");
    dotsEl.className = "timeline-typing-dots";
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("span");
      dot.className = "timeline-typing-dot";
      dotsEl.appendChild(dot);
    }
    typingEl.appendChild(dotsEl);
    const label = document.createElement("span");
    label.textContent = "发送中…";
    typingEl.appendChild(label);
    timelineEl.appendChild(typingEl);
  }

  markRoomRead(room.id);
  if (room.id === activeRoomId && (followTimelineToLatest || wasNearBottom || isSendingMessage)) {
    requestAnimationFrame(() => {
      if (timelineEl) {
        timelineEl.scrollTop = timelineEl.scrollHeight;
      }
    });
  }
  followTimelineToLatest = false;
}

function translateClientDisplayName(value) {
  switch ((value || "").toLowerCase()) {
    case "mobile web":
      return "移动网页";
    default:
      return value || "未知终端";
  }
}

function translateRoutePrefix(value) {
  switch (value) {
    case "/app":
      return "主入口";
    default:
      return value || "默认入口";
  }
}

function renderGovernance() {
  if (
    !cityListEl &&
    !worldDirectoryListEl &&
    !worldMirrorSourceListEl &&
    !worldSquareListEl &&
    !worldSafetyListEl
  ) {
    return;
  }

  if (!governance.world) {
    setNodeText(worldStateEl, "世界：离线");
    setNodeText(worldSummaryEl, shellMode === "user"
      ? (gatewayUrl
          ? "边缘抽屉已打开，正在等待世界外壳状态。"
          : "边缘抽屉默认收起，连接网关后可查看世界外壳。")
      : (gatewayUrl
          ? "正在等待世界状态"
          : "请先连接网关以加载世界与城市状态"));
    clearChildren(worldDirectoryListEl);
    clearChildren(worldMirrorSourceListEl);
    clearChildren(worldSquareListEl);
    clearChildren(worldSafetyListEl);
    for (const element of [
      worldDirectoryListEl,
      worldMirrorSourceListEl,
      worldSquareListEl,
      worldSafetyListEl,
    ]) {
      if (!element) continue;
      const empty = document.createElement("li");
      empty.className = "empty-note";
      empty.textContent = "世界层暂不可用";
      element.appendChild(empty);
    }
    clearChildren(cityListEl);
    if (cityListEl) {
      const empty = document.createElement("li");
      empty.className = "empty-note";
      empty.textContent = "世界状态暂不可用";
      cityListEl.appendChild(empty);
    }
    return;
  }

  setNodeText(worldStateEl, `世界：${displayWorldTitle(governance.world.title)}`);
  const directory = governance.world_directory;
  setNodeText(worldSummaryEl, shellMode === "user"
    ? `${displayWorldTitle(governance.world.title)} · 抽屉里放城市 ${directory?.city_count ?? governance.cities.length} 项 · 镜像 ${directory?.mirror_count ?? 0} 项`
    : `${displayWorldTitle(governance.world.title)} · 城市 ${directory?.city_count ?? governance.cities.length} · 镜像 ${directory?.mirror_count ?? 0} · 公告 ${(governance.world_square || []).length} · 跨城私聊 ${governance.world.allows_cross_city_private_messages ? "开启" : "关闭"}`);

  renderWorldDirectory();
  renderMirrorSources();
  renderWorldSquare();
  renderWorldSafety();

  clearChildren(cityListEl);
  if (!governance.cities.length) {
    const empty = document.createElement("li");
    empty.className = "empty-note";
    empty.textContent = "暂时还没有公开城市";
    cityListEl.appendChild(empty);
    return;
  }

  for (const cityState of governance.cities) {
    const city = cityState.profile;
    const membership = membershipForCity(city.city_id);
    const rooms = publicRoomsForCity(city.city_id);
    const pendingMembers = governance.memberships.filter(
      (item) => item.city_id === city.city_id && item.state === "PendingApproval",
    );
    const activeMembers = governance.memberships.filter(
      (item) =>
        item.city_id === city.city_id &&
        item.state === "Active" &&
        item.resident_id !== currentIdentity(),
    );

    const li = document.createElement("li");
    li.className = "city-card";

    const titleRow = document.createElement("div");
    titleRow.className = "city-card-title";
    titleRow.appendChild(createLine("city-name", displayCityTitle(city)));
    titleRow.appendChild(createLine("city-slug", city.slug));
    li.appendChild(titleRow);
    li.appendChild(createLine("city-sub", displayCityDescription(city)));
    li.appendChild(createLine("city-role", `你的状态：${humanMembership(membership)}`));
    li.appendChild(
      createLine(
        "city-sub",
        `公开发现 ${city.public_room_discovery_enabled ? "开启" : "关闭"} · 入城审批 ${city.approval_required ? "需要审批" : "开放加入"}`,
      ),
    );

    if (rooms.length) {
      const roomList = document.createElement("div");
      roomList.className = "city-room-list";
      roomList.textContent = "公共房间";
      li.appendChild(roomList);

      const roomWrap = document.createElement("div");
      roomWrap.className = "city-room-wrap";
      for (const room of rooms) {
        const row = document.createElement("div");
        row.className = "city-room-entry";

        const label = document.createElement("span");
        label.textContent = `${room.slug}${room.frozen ? " · 已冻结" : ""}`;
        row.appendChild(label);

        const controls = document.createElement("div");
        controls.className = "city-room-controls";

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "secondary mini-button";
        openButton.textContent = "打开";
        openButton.addEventListener("click", async () => {
          focusRoom(room.room_id);
          await loadGatewayState();
          renderRooms();
          renderTimeline();
        });
        controls.appendChild(openButton);

        if (membership?.state === "Active" && roleAllowsFreezeRoom(membership.role)) {
          const toggleButton = document.createElement("button");
          toggleButton.type = "button";
          toggleButton.className = "secondary mini-button";
          toggleButton.textContent = room.frozen ? "解冻" : "冻结";
          toggleButton.addEventListener("click", async () => {
            try {
              await submitFreezeRoom(city.slug, room.slug, !room.frozen);
            } catch (error) {
              setGovernanceStatus(localizedRuntimeError(error, "房间冻结状态更新失败"), true);
            }
          });
          controls.appendChild(toggleButton);
        }

        row.appendChild(controls);
        roomWrap.appendChild(row);
      }
      li.appendChild(roomWrap);
    }

    if (pendingMembers.length) {
      const pendingTitle = document.createElement("div");
      pendingTitle.className = "city-room-list";
      pendingTitle.textContent = "待审批居民";
      li.appendChild(pendingTitle);

      const pendingWrap = document.createElement("div");
      pendingWrap.className = "city-room-wrap";
      for (const pending of pendingMembers) {
        const row = document.createElement("div");
        row.className = "city-room-entry";
        const label = document.createElement("span");
        label.textContent = pending.resident_id;
        row.appendChild(label);

        if (membership?.state === "Active" && roleAllowsApproveJoin(membership.role)) {
          const approveButton = document.createElement("button");
          approveButton.type = "button";
          approveButton.className = "secondary mini-button";
          approveButton.textContent = "批准";
          approveButton.addEventListener("click", async () => {
            try {
              await submitApproveResident(city.slug, pending.resident_id);
            } catch (error) {
              setGovernanceStatus(localizedRuntimeError(error, "批准居民失败"), true);
            }
          });
          row.appendChild(approveButton);
        }

        pendingWrap.appendChild(row);
      }
      li.appendChild(pendingWrap);
    }

    if (activeMembers.length) {
      const activeTitle = document.createElement("div");
      activeTitle.className = "city-room-list";
      activeTitle.textContent = "活跃居民";
      li.appendChild(activeTitle);

      const activeWrap = document.createElement("div");
      activeWrap.className = "city-room-wrap";
      for (const resident of activeMembers) {
        const row = document.createElement("div");
        row.className = "city-room-entry";
        const label = document.createElement("span");
        label.textContent = `${resident.resident_id} · ${translateRole(resident.role)}`;
        row.appendChild(label);

        if (membership?.state === "Active" && roleAllowsManageStewards(membership.role)) {
          const stewardButton = document.createElement("button");
          stewardButton.type = "button";
          stewardButton.className = "secondary mini-button";
          const grant = resident.role !== "Steward";
          stewardButton.textContent = grant ? "设为执事" : "撤销执事";
          stewardButton.addEventListener("click", async () => {
            try {
              await submitStewardUpdate(city.slug, resident.resident_id, grant);
            } catch (error) {
              setGovernanceStatus(localizedRuntimeError(error, "执事权限更新失败"), true);
            }
          });
          row.appendChild(stewardButton);
        }

        activeWrap.appendChild(row);
      }
      li.appendChild(activeWrap);
    }

    const actions = document.createElement("div");
    actions.className = "city-actions";

    if (!membership) {
      const joinButton = document.createElement("button");
      joinButton.type = "button";
      joinButton.className = "secondary";
      joinButton.textContent = "加入";
      joinButton.addEventListener("click", async () => {
        cityJoinInputEl.value = city.slug;
        await submitJoinCity(city.slug);
      });
      actions.appendChild(joinButton);
    } else if (membership.state === "PendingApproval") {
      const pending = document.createElement("div");
      pending.className = "city-role notice-pending";
      pending.textContent = "等待审批";
      actions.appendChild(pending);
    }

    const lobby = rooms.find((room) => room.slug === "lobby") || rooms[0];
    if (lobby) {
      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.className = "secondary";
      openButton.textContent = `打开 ${lobby.slug}`;
      openButton.addEventListener("click", async () => {
        focusRoom(lobby.room_id);
        await loadGatewayState();
        renderRooms();
        renderTimeline();
      });
      actions.appendChild(openButton);
    }

    if (membership?.state === "Active" && roleAllowsCreatePublicRoom(membership.role)) {
      const roomButton = document.createElement("button");
      roomButton.type = "button";
      roomButton.textContent = "新建房间";
      roomButton.addEventListener("click", () => {
        roomCityInputEl.value = city.slug;
        roomTitleInputEl.focus();
        setGovernanceStatus(`已准备在 ${city.slug} 中创建房间`);
      });
      actions.appendChild(roomButton);
    }

    if ((actions.children?.length || 0) > 0) {
      li.appendChild(actions);
    }

    if (membership?.state === "Active" && roleAllowsUpdateFederation(membership.role)) {
      const federationLabel = document.createElement("div");
      federationLabel.className = "city-room-list";
      federationLabel.textContent = `联邦策略 · ${translateFederationPolicy(city.federation_policy)}`;
      li.appendChild(federationLabel);

      const federationWrap = document.createElement("div");
      federationWrap.className = "city-room-wrap";
      const policies = [
        ["Open", "开放互联"],
        ["Selective", "选择互联"],
        ["Isolated", "孤城断联"],
      ];
      for (const [policyValue, label] of policies) {
        const row = document.createElement("div");
        row.className = "city-room-entry";
        const text = document.createElement("span");
        text.textContent =
          city.federation_policy === policyValue
            ? `${label} · 当前生效`
            : `${label} · 可切换`;
        row.appendChild(text);

        const applyButton = document.createElement("button");
        applyButton.type = "button";
        applyButton.className = "secondary mini-button";
        applyButton.textContent =
          city.federation_policy === policyValue ? "当前" : "应用";
        applyButton.disabled = city.federation_policy === policyValue;
        applyButton.addEventListener("click", async () => {
          try {
            await submitFederationPolicy(city.slug, policyValue);
          } catch (error) {
            setGovernanceStatus(localizedRuntimeError(error, "联邦策略更新失败"), true);
          }
        });
        row.appendChild(applyButton);
        federationWrap.appendChild(row);
      }
      li.appendChild(federationWrap);
    }

    cityListEl.appendChild(li);
  }
}

function renderWorldDirectory() {
  if (!worldDirectoryListEl) return;
  clearChildren(worldDirectoryListEl);
  const snapshot = governance.world_directory;
  if (!snapshot?.cities?.length) {
    const empty = document.createElement("li");
    empty.className = "empty-note";
    empty.textContent = gatewayUrl
      ? "世界目录暂时还没有公开条目"
      : "请先连接网关以加载世界目录";
    worldDirectoryListEl.appendChild(empty);
    return;
  }

  for (const city of snapshot.cities) {
    const li = document.createElement("li");
    li.className = "city-card micro-card";

    const titleRow = document.createElement("div");
    titleRow.className = "city-card-title";
    titleRow.appendChild(createLine("city-name", displayCityTitle(city)));
    titleRow.appendChild(
      createLine("city-slug", `${city.slug} · ${translateSourceKind(city.source_kind)}`),
    );
    li.appendChild(titleRow);
    li.appendChild(createLine("city-sub", displayCityDescription(city)));
    li.appendChild(
      createLine(
        "city-sub",
        `信任状态 ${translateTrustState(city.trust_state)} · 居民 ${city.resident_count} · 房间 ${city.public_room_count}`,
      ),
    );
    li.appendChild(
      createLine(
        "city-role",
        `镜像 ${city.mirror_enabled ? "已开启" : "未开启"} · 城市标识 ${city.city_id}`,
      ),
    );
    worldDirectoryListEl.appendChild(li);
  }
}

function renderMirrorSources() {
  if (!worldMirrorSourceListEl) return;
  clearChildren(worldMirrorSourceListEl);
  const sources = governance.world_mirror_sources || [];
  if (!sources.length) {
    const empty = document.createElement("li");
    empty.className = "empty-note";
    empty.textContent = gatewayUrl
      ? "暂时还没有配置世界镜像源"
      : "请先连接网关以管理镜像源";
    worldMirrorSourceListEl.appendChild(empty);
    return;
  }

  for (const source of sources) {
    const li = document.createElement("li");
    li.className = "city-card micro-card";
    li.appendChild(createLine("city-name", source.base_url));
    li.appendChild(
      createLine(
        "city-sub",
        `${translateSourceKind(source.source_kind)} · ${source.enabled ? "已启用" : "未启用"} · ${
          source.reachable ? "可达" : "不可达"
        }`,
      ),
    );
    li.appendChild(
      createLine(
        "city-role",
        `城市 ${source.city_count} · 公告 ${source.notice_count} · 通告 ${source.advisory_count}`,
      ),
    );
    if (source.last_snapshot_at_ms) {
      li.appendChild(
        createLine(
          "city-role",
          `最近快照 ${formatDateTime(source.last_snapshot_at_ms)}`,
        ),
      );
    }
    worldMirrorSourceListEl.appendChild(li);
  }
}

function renderWorldSquare() {
  if (!worldSquareListEl) return;
  clearChildren(worldSquareListEl);
  if (!governance.world_square?.length) {
    const empty = document.createElement("li");
    empty.className = "empty-note";
    empty.textContent = gatewayUrl
      ? "世界广场当前还没有新动态"
      : "请先连接网关以加载世界广场公告";
    worldSquareListEl.appendChild(empty);
    return;
  }

  for (const notice of governance.world_square) {
    const li = document.createElement("li");
    li.className = "city-card micro-card";
    const titleRow = document.createElement("div");
    titleRow.className = "city-card-title";
    titleRow.appendChild(createLine("city-name", notice.title));
    titleRow.appendChild(
      createLine("city-slug", `${translateSeverity(notice.severity || "info")} · ${notice.author_id}`),
    );
    li.appendChild(titleRow);
    li.appendChild(createLine("city-sub", notice.body));
    li.appendChild(
      createLine(
        "city-role",
        `标签：${(notice.tags || []).join("、") || "无"} · ${formatDateTime(notice.posted_at_ms)}`,
      ),
    );
    worldSquareListEl.appendChild(li);
  }
}

function renderWorldSafety() {
  if (!worldSafetyListEl) return;
  clearChildren(worldSafetyListEl);
  const safety = governance.world_safety;
  if (!safety) {
    const empty = document.createElement("li");
    empty.className = "empty-note";
    empty.textContent = gatewayUrl
      ? "世界安全动态暂不可用"
      : "请先连接网关以加载世界安全状态";
    worldSafetyListEl.appendChild(empty);
    return;
  }

  const mirrorCard = document.createElement("li");
  mirrorCard.className = "city-card micro-card";
  mirrorCard.appendChild(
    createLine(
      "city-name",
      `镜像城市 ${safety.mirrors?.filter((item) => item.mirror_enabled).length || 0}`,
    ),
  );
  mirrorCard.appendChild(
    createLine(
      "city-sub",
      (safety.mirrors || [])
        .map((mirror) => `${mirror.slug}：${translateTrustState(mirror.trust_state)}`)
        .join(" · ") || "暂无镜像",
    ),
  );
  mirrorCard.appendChild(
    createLine("city-role", `治理员：${(safety.stewards || []).join("、") || "暂无"}`),
  );
  worldSafetyListEl.appendChild(mirrorCard);

  const activeAdvisories = safety.advisories || [];
  if (!activeAdvisories.length) {
    const empty = document.createElement("li");
    empty.className = "empty-note";
    empty.textContent = "当前没有生效中的世界安全通告";
    worldSafetyListEl.appendChild(empty);
  } else {
    for (const advisory of activeAdvisories) {
      const li = document.createElement("li");
      li.className = "city-card micro-card";
      const titleRow = document.createElement("div");
      titleRow.className = "city-card-title";
      titleRow.appendChild(createLine("city-name", advisory.subject_ref));
      titleRow.appendChild(createLine("city-slug", translateAdvisoryAction(advisory.action)));
      li.appendChild(titleRow);
      li.appendChild(createLine("city-sub", advisory.reason));
      li.appendChild(
        createLine(
          "city-role",
          `${translateSubjectKind(advisory.subject_kind)} · ${advisory.issued_by} · ${formatDateTime(
            advisory.issued_at_ms,
          )}`,
        ),
      );
      worldSafetyListEl.appendChild(li);
    }
  }

  const residentSanctions = safety.resident_sanctions || [];
  const blacklistEntries = safety.registration_blacklist || [];
  const reports = safety.reports || [];
  const sanctionCard = document.createElement("li");
  sanctionCard.className = "city-card micro-card";
  sanctionCard.appendChild(
    createLine("city-name", `居民制裁 ${residentSanctions.length}`),
  );
  sanctionCard.appendChild(
    createLine(
      "city-sub",
      residentSanctions.length
        ? residentSanctions
            .slice(0, 4)
            .map((item) => `${item.resident_id}：${translateReportStatus(item.status)}`)
            .join(" · ")
        : "当前没有已发布的居民制裁",
    ),
  );
  sanctionCard.appendChild(
    createLine("city-role", `黑名单哈希条目 ${blacklistEntries.length}`),
  );
  worldSafetyListEl.appendChild(sanctionCard);

  const reportCard = document.createElement("li");
  reportCard.className = "city-card micro-card";
  reportCard.appendChild(createLine("city-name", `举报记录 ${reports.length}`));
  reportCard.appendChild(
    createLine(
      "city-sub",
      reports.length
        ? reports
            .slice(0, 4)
            .map(
              (item) =>
                `${translateTargetKind(item.target_kind)}：${item.target_ref}：${translateReportStatus(item.status)}`,
            )
            .join(" · ")
        : "当前还没有世界安全举报",
    ),
  );
    reportCard.appendChild(
      createLine(
        "city-role",
        reports.length
          ? `最新时间 ${formatDateTime(reports[0].reported_at_ms)}`
        : "居民可以在这里举报群聊和公共空间违规",
      ),
    );
  worldSafetyListEl.appendChild(reportCard);

  for (const sanction of residentSanctions.slice(0, 6)) {
    const li = document.createElement("li");
    li.className = "city-card micro-card";
    const titleRow = document.createElement("div");
    titleRow.className = "city-card-title";
    titleRow.appendChild(createLine("city-name", sanction.resident_id));
      titleRow.appendChild(
        createLine(
          "city-slug",
          `${translateReportStatus(sanction.status)} · 迁移资格 ${translatePortability(
            sanction.portability_revoked,
          )}`,
        ),
      );
    li.appendChild(titleRow);
    li.appendChild(createLine("city-sub", sanction.reason));
    li.appendChild(
      createLine(
        "city-role",
        `${sanction.city_id || "世界层"} · ${formatDateTime(sanction.issued_at_ms)}`,
      ),
    );
    worldSafetyListEl.appendChild(li);
  }

  for (const report of reports.slice(0, 6)) {
    const li = document.createElement("li");
    li.className = "city-card micro-card";
    const titleRow = document.createElement("div");
    titleRow.className = "city-card-title";
    titleRow.appendChild(createLine("city-name", report.target_ref));
    titleRow.appendChild(createLine("city-slug", translateReportStatus(report.status || "Pending")));
    li.appendChild(titleRow);
    li.appendChild(createLine("city-sub", report.summary));
    li.appendChild(
      createLine(
        "city-role",
        `${translateTargetKind(report.target_kind)} · ${report.city || "世界层"} · ${
          report.reporter_id
        } · ${formatDateTime(report.reported_at_ms)}`,
      ),
    );
    worldSafetyListEl.appendChild(li);
  }
}

function renderResidents() {
  if (!residentListEl) return;
  clearChildren(residentListEl);
  if (!governance.residents?.length) {
    const empty = document.createElement("li");
    empty.className = "empty-note";
    empty.textContent = gatewayUrl
      ? "居民目录暂时还没有条目"
      : "请先连接网关以加载居民目录";
    residentListEl.appendChild(empty);
    return;
  }

  for (const resident of governance.residents) {
    const li = document.createElement("li");
    li.className = "city-card";

    const titleRow = document.createElement("div");
    titleRow.className = "city-card-title";
    titleRow.appendChild(createLine("city-name", resident.resident_id));
    titleRow.appendChild(
      createLine(
        "city-slug",
        translateResidentLabel(resident.resident_id),
      ),
    );
    li.appendChild(titleRow);
    li.appendChild(
      createLine(
        "city-sub",
        `已加入城市：${joinOrFallback(resident.active_cities || [], "暂无")}`,
      ),
    );
    if (resident.pending_cities?.length) {
      li.appendChild(createLine("city-sub", `待审批城市：${resident.pending_cities.join("、")}`));
    }
    li.appendChild(
      createLine(
        "city-role",
        `身份：${(resident.roles || []).map(translateRole).join("、") || "居民"}`,
      ),
    );

    if (resident.resident_id !== currentIdentity()) {
      const actions = document.createElement("div");
      actions.className = "city-actions";
      const directButton = document.createElement("button");
      directButton.type = "button";
      directButton.className = "secondary";
      directButton.textContent = "发起私聊";
      directButton.addEventListener("click", async () => {
        directPeerInputEl.value = resident.resident_id;
        try {
          await openDirectSession(resident.resident_id);
        } catch (error) {
          setGovernanceStatus(localizedRuntimeError(error, "打开私聊失败"), true);
        }
      });
      actions.appendChild(directButton);
      li.appendChild(actions);
    }

    residentListEl.appendChild(li);
  }
}

function bootTransportStatus() {
  setNodeText(transportStateEl, `消息通道：${
    gatewayUrl
      ? "网关轮询中"
      : bootstrap.shell.stream_incremental_updates
        ? "支持流式更新"
        : "仅轮询模式"
  }`);
  bootScrollToBottomFab();
}

let scrollToBottomFabEl = null;

function ensureScrollToBottomFab() {
  if (!timelineEl) return;
  if (!scrollToBottomFabEl) {
    scrollToBottomFabEl = document.createElement("button");
    scrollToBottomFabEl.className = "scroll-to-bottom";
    scrollToBottomFabEl.textContent = "↓ 回到最新";
    scrollToBottomFabEl.type = "button";
    scrollToBottomFabEl.addEventListener("click", () => {
      if (timelineEl) {
        timelineEl.scrollTo({ top: timelineEl.scrollHeight, behavior: "smooth" });
      }
    });
  }
  if (typeof timelineEl.contains === "function" && !timelineEl.contains(scrollToBottomFabEl)) {
    timelineEl.appendChild(scrollToBottomFabEl);
  }
  updateScrollToBottomVisibility();
}

function bootScrollToBottomFab() {
  if (!timelineEl) return;
  timelineEl.addEventListener("scroll", updateScrollToBottomVisibility, { passive: true });
}

function updateScrollToBottomVisibility() {
  if (!timelineEl || !scrollToBottomFabEl) return;
  const nearBottom =
    timelineEl.scrollHeight - timelineEl.scrollTop - timelineEl.clientHeight < 120;
  scrollToBottomFabEl.dataset.visible = String(!nearBottom);
}

function ensureChatPaneToggle() {
  if (!conversationPanelEl) return;
  let toggleEl = conversationPanelEl.querySelector(".chat-pane-toggle");
  if (!toggleEl) {
    toggleEl = document.createElement("button");
    toggleEl.className = "chat-pane-toggle";
    toggleEl.type = "button";
    toggleEl.addEventListener("click", () => {
      const current = document.body.getAttribute("data-chat-pane-mode") || "thread";
      const isUserShell = document.body.getAttribute("data-shell-page") === "user";
      let next;
      if (isUserShell) {
        next = current === "thread" ? "rooms" : current === "rooms" ? "detail" : "thread";
      } else {
        next = current === "thread" ? "rooms" : "thread";
      }
      document.body.setAttribute("data-chat-pane-mode", next);
      syncChatPaneMode(next === "thread" ? "thread" : next === "detail" ? "detail" : "rooms");
      updateChatPaneToggleLabel(toggleEl, next);
    });
    conversationPanelEl.insertBefore(toggleEl, conversationPanelEl.firstChild);
  }
  const mode = document.body.getAttribute("data-chat-pane-mode") || "thread";
  updateChatPaneToggleLabel(toggleEl, mode);
}

function updateChatPaneToggleLabel(el, mode) {
  if (mode === "detail") {
    el.textContent = "← 返回消息";
  } else {
    el.textContent = mode === "thread" ? "← 查看会话列表" : "← 返回消息";
  }
}

function refreshGatewayBadge() {
  if (gatewayUrl) {
    try {
      setNodeText(gatewayStateEl, `连接入口：${new URL(gatewayUrl).host}`);
    } catch {
      setNodeText(gatewayStateEl, `连接入口：${gatewayUrl}`);
    }
  } else {
    setNodeText(gatewayStateEl, "连接入口：未连接");
  }
  if (!gatewayUrl) {
    setNodeText(providerStateEl, "消息来源：未连接");
    return;
  }
  const mode = provider.mode || "unknown";
  const health = translateProviderHealth(provider.reachable);
  const upstreamHost = provider.base_url
    ? (() => {
        try {
          return new URL(provider.base_url).host;
        } catch {
          return provider.base_url;
        }
      })()
    : "local";
  const connectionState = translateProviderConnectionState(provider.connection_state);
  setNodeText(
    providerStateEl,
    `消息来源：${translateProviderMode(mode)} · ${health} · ${connectionState} · ${
      upstreamHost === "local" ? "本地" : upstreamHost
    }`,
  );
  if (provider.base_url && providerUrlInputEl && document.activeElement !== providerUrlInputEl) {
    providerUrlInputEl.value = provider.base_url;
  }
}

function updateComposerStatus() {
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
  }
  const cityCreateButton = cityCreateFormEl?.querySelector("button");
  if (cityCreateButton) cityCreateButton.disabled = !enabled;
  const cityJoinButton = cityJoinFormEl?.querySelector("button");
  if (cityJoinButton) cityJoinButton.disabled = !enabled;
  const roomCreateButton = roomCreateFormEl?.querySelector("button");
  if (roomCreateButton) roomCreateButton.disabled = !enabled;
  const directOpenButton = directOpenFormEl?.querySelector("button");
  if (directOpenButton) directOpenButton.disabled = !enabled;
  const providerConnectButton = providerConnectFormEl?.querySelector("button");
  if (providerConnectButton) providerConnectButton.disabled = !enabled;
  if (providerDisconnectButtonEl) {
    providerDisconnectButtonEl.disabled = !enabled || !provider.base_url;
  }
  const worldMirrorButton = worldMirrorFormEl?.querySelector("button");
  if (worldMirrorButton) worldMirrorButton.disabled = !worldStewardEnabled;
  const worldNoticeButton = worldNoticeFormEl?.querySelector("button");
  if (worldNoticeButton) worldNoticeButton.disabled = !worldStewardEnabled;
  const worldTrustButton = worldTrustFormEl?.querySelector("button");
  if (worldTrustButton) worldTrustButton.disabled = !worldStewardEnabled;
  const worldAdvisoryButton = worldAdvisoryFormEl?.querySelector("button");
  if (worldAdvisoryButton) worldAdvisoryButton.disabled = !worldStewardEnabled;
  const worldReportReviewButton = worldReportReviewFormEl?.querySelector("button");
  if (worldReportReviewButton) worldReportReviewButton.disabled = !worldStewardEnabled;
  const worldReportButton = worldReportFormEl?.querySelector("button");
  if (worldReportButton) worldReportButton.disabled = !enabled;
  const worldResidentSanctionButton = worldResidentSanctionFormEl?.querySelector("button");
  if (worldResidentSanctionButton) worldResidentSanctionButton.disabled = !worldStewardEnabled;
}

function updateAuthFormState() {
  const enabled = Boolean(gatewayUrl);
  for (const element of [
    authDeliverySelectEl,
    authEmailInputEl,
    authMobileInputEl,
    authDeviceInputEl,
    authChallengeInputEl,
    authCodeInputEl,
  ]) {
    if (!element) continue;
    element.disabled = !enabled;
  }
  const authRequestButton = authRequestFormEl?.querySelector("button");
  if (authRequestButton) authRequestButton.disabled = !enabled;
  const authVerifyButton = authVerifyFormEl?.querySelector("button");
  if (authVerifyButton) authVerifyButton.disabled = !enabled;
}

function resolveGatewayUrl() {
  if (currentShellPage() === "hub") {
    return queryGatewayUrl() || null;
  }
  const query = queryGatewayUrl();
  if (query) {
    safeLocalStorageSet("lobster-gateway-url", query);
    return query;
  }
  const remembered = safeLocalStorageGet("lobster-gateway-url");
  if (userShellProjection()) {
    return remembered || null;
  }
  if (bootstrap.gateway_base_url) {
    return bootstrap.gateway_base_url;
  }
  if (remembered) {
    return remembered;
  }
  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    return window.location.origin;
  }
  return null;
}

async function postGatewayJson(path, payload) {
  const response = await fetch(`${gatewayUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
    if (shellChanged) {
      renderRooms();
      renderTimeline();
    }
    if (providerChanged) {
      refreshGatewayBadge();
    }
    renderRooms();
    renderTimeline();
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
  renderRooms();
  renderTimeline();
  updateComposerState();
  updateAuthFormState();
  updateResidentLoginSurface();
  renderConversationOverview();
}

function scheduleGatewayRealtimeRestart(afterVersion) {
  if (!gatewayUrl || typeof EventSource !== "function" || !afterVersion) return;
  if (shellRealtimeRestartTimer) {
    clearTimeout(shellRealtimeRestartTimer);
  }
  stopShellEventSource({ clearRestart: false });
  shellRealtimeRestartTimer = setTimeout(() => {
    shellRealtimeRestartTimer = null;
    startGatewayRealtime({ afterVersion });
  }, 0);
}

function startGatewayRealtime({ afterVersion = lastShellStateVersion } = {}) {
  stopShellEventSource();
  if (!gatewayUrl || typeof EventSource !== "function") {
    startGatewayPolling();
    return;
  }
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  let hasReceivedSnapshot = false;
  const eventSource = new EventSource(gatewayShellEventsUrl({ afterVersion }));
  shellEventSource = eventSource;

  eventSource.addEventListener("shell-state", async (event) => {
    try {
      const payload = JSON.parse(event.data || "{}");
      const incomingStateVersion =
        typeof payload?.state_version === "string" && payload.state_version.trim()
          ? payload.state_version.trim()
          : null;
      if (incomingStateVersion && incomingStateVersion === lastShellStateVersion) {
        hasReceivedSnapshot = true;
        lastRefreshAtMs = Date.now();
        lastRefreshErrorMessage = "";
        scheduleGatewayRealtimeRestart(incomingStateVersion);
        return;
      }
      const changed = await applyGatewayShellStatePayload(payload, { persist: true });
      if (!changed) return;
      hasReceivedSnapshot = true;
      if (incomingStateVersion) {
        lastShellStateVersion = incomingStateVersion;
      }
      lastRefreshAtMs = Date.now();
      lastRefreshErrorMessage = "";
      renderShellStateRefresh();
      scheduleGatewayRealtimeRestart(incomingStateVersion);
    } catch (error) {
      lastRefreshErrorMessage = localizedRuntimeError(error, "实时同步失败");
    }
  });

  eventSource.onerror = () => {
    stopShellEventSource();
    if (!hasReceivedSnapshot) {
      void refreshFromGateway();
      startGatewayPolling();
      return;
    }
    if (lastShellStateVersion) {
      scheduleGatewayRealtimeRestart(lastShellStateVersion);
    } else {
      startGatewayPolling();
    }
  };
}

async function refreshOnForeground(reason = "foreground") {
  if (!gatewayUrl || refreshInProgress) return;
  if (document.visibilityState === "hidden") return;
  const now = Date.now();
  if (now - lastForegroundRefreshAtMs < 1200) return;
  lastForegroundRefreshAtMs = now;
  try {
    await refreshFromGateway();
  } catch (error) {
    console.warn(`[lobster-web-shell] foreground refresh failed (${reason})`, error);
  }
}

async function sendMessage(text, { quickAction = "" } = {}) {
  if (!activeRoomId) return;
  if (residentGatewayLoginRequired()) {
    throw new Error("请先登录后发送");
  }
  const roomId = activeRoomId;
  if (!gatewayUrl) {
    const room = state.rooms.find((item) => item.id === roomId);
    if (!room) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    room.messages = room.messages || [];
    room.messages.push({
      sender: currentIdentity(),
      timestamp,
      text,
      quick_action: quickAction,
    });
    if (quickAction) {
      const initialState = resetRoomQuickState(roomId, quickAction);
      captureRoomQuickSnapshotFromText(roomId, quickAction, initialState, text);
    }
    lastRefreshAtMs = Date.now();
    followTimelineToLatest = true;
    delete roomSendErrors[roomId];
    updateRoomDraft(roomId, "");
    setRoomQuickAction(roomId, "");
    composerInputEl.value = "";
    autoSizeComposerInput();
    lastSentMessage = text;
    renderRooms();
    renderTimeline();
    updateComposerState();
    renderConversationOverview();
    requestAnimationFrame(() => {
      composerInputEl?.focus();
    });
    return;
  }
  const payload = {
    room_id: roomId,
    sender: currentIdentity(),
    text,
    quick_action: quickAction || undefined,
    device_id: "browser-shell",
    language_tag: navigator.language || "zh-CN",
  };
  isSendingMessage = true;
  followTimelineToLatest = true;
  const pendingEchoId = enqueuePendingEcho(roomId, text, quickAction);
  if (quickAction) {
    const initialState = resetRoomQuickState(roomId, quickAction);
    captureRoomQuickSnapshotFromText(roomId, quickAction, initialState, text);
  }
  composerInputEl.value = "";
  autoSizeComposerInput();
  updateRoomDraft(roomId, "");
  setRoomQuickAction(roomId, "");
  lastSentMessage = text;
  updateComposerState();
  renderRooms();
  renderTimeline();
  renderConversationOverview();
  let posted = false;
  try {
    await postGatewayJson("/v1/shell/message", payload);
    posted = true;
    clearPendingEchoes(roomId);
    delete roomSendErrors[roomId];
    await refreshFromGateway({ requireShell: true });
    renderRooms();
  } catch (error) {
    markPendingEchoFailed(roomId, pendingEchoId, true);
    const fallback = posted ? "消息可能已发出，但会话同步失败" : "消息发送失败";
    roomSendErrors[roomId] = localizedRuntimeError(error, fallback);
    throw new Error(roomSendErrors[roomId]);
  } finally {
    isSendingMessage = false;
    updateComposerState();
    renderConversationOverview();
    requestAnimationFrame(() => {
      composerInputEl?.focus();
    });
  }
}

async function submitCreateCity() {
  if (!gatewayUrl) return;
  const title = cityTitleInputEl.value.trim();
  const slug = citySlugInputEl.value.trim();
  const description = cityDescriptionInputEl.value.trim();
  if (!title || !description) {
    setGovernanceStatus("请填写城市名称和城市简介", true);
    return;
  }
  setGovernanceStatus(`正在创建城市：${title}`);
  await postGatewayJson("/v1/cities", {
    title,
    slug: slug || undefined,
    description,
    lord_id: currentIdentity(),
  });
  cityCreateFormEl?.reset();
  await refreshFromGateway();
  setGovernanceStatus(`城市已创建：${title}`);
}

async function submitJoinCity(cityToken = null) {
  if (!gatewayUrl) return;
  const city = (cityToken || cityJoinInputEl.value).trim();
  if (!city) {
    setGovernanceStatus("请填写城市别名或城市标识", true);
    return;
  }
  setGovernanceStatus(`正在申请加入：${city}`);
  const result = await postGatewayJson("/v1/cities/join", {
    city,
    resident_id: currentIdentity(),
  });
  cityJoinFormEl?.reset();
  await refreshFromGateway();
  setGovernanceStatus(`入城申请状态：${translateMembershipState(result.state)}`);
}

async function submitCreateRoom() {
  if (!gatewayUrl) return;
  const city = roomCityInputEl.value.trim();
  const title = roomTitleInputEl.value.trim();
  const slug = roomSlugInputEl.value.trim();
  const description = roomDescriptionInputEl.value.trim();
  if (!city || !title || !description) {
    setGovernanceStatus("请填写城市、房间名称和房间简介", true);
    return;
  }
  setGovernanceStatus(`正在创建房间：${title}`);
  const result = await postGatewayJson("/v1/cities/rooms", {
    city,
    creator_id: currentIdentity(),
    title,
    slug: slug || undefined,
    description,
  });
  roomCreateFormEl?.reset();
  focusRoom(result.room_id);
  await refreshFromGateway();
  setGovernanceStatus(`房间已创建：${result.title}`);
}

async function submitApproveResident(city, residentId) {
  setGovernanceStatus(`正在批准 ${residentId} 加入 ${city}`);
  await postGatewayJson("/v1/cities/approve", {
    city,
    actor_id: currentIdentity(),
    resident_id: residentId,
  });
  await refreshFromGateway();
  setGovernanceStatus(`${residentId} 已通过 ${city} 的入城审批`);
}

async function submitFreezeRoom(city, room, frozen) {
  setGovernanceStatus(`${frozen ? "正在冻结" : "正在解冻"}房间：${room}`);
  await postGatewayJson("/v1/cities/rooms/freeze", {
    city,
    actor_id: currentIdentity(),
    room,
    frozen,
  });
  await refreshFromGateway();
  setGovernanceStatus(`房间 ${room} 已${frozen ? "冻结" : "解冻"}`);
}

async function submitStewardUpdate(city, residentId, grant) {
  setGovernanceStatus(`${grant ? "正在授予" : "正在撤销"} ${residentId} 的执事身份`);
  await postGatewayJson("/v1/cities/stewards", {
    city,
    actor_id: currentIdentity(),
    resident_id: residentId,
    grant,
  });
  await refreshFromGateway();
  setGovernanceStatus(`${residentId} 当前身份：${grant ? "执事" : "居民"}`);
}

async function submitFederationPolicy(city, policy) {
  setGovernanceStatus(`正在更新 ${city} 的联邦策略为 ${translateFederationPolicy(policy)}`);
  await postGatewayJson("/v1/cities/federation-policy", {
    city,
    actor_id: currentIdentity(),
    policy,
  });
  await refreshFromGateway();
  setGovernanceStatus(`${city} 的联邦策略已切换为 ${translateFederationPolicy(policy)}`);
}

async function openDirectSession(peerId) {
  if (!gatewayUrl) return;
  const peer = peerId.trim();
  if (!peer) {
    setGovernanceStatus("请填写居民标识", true);
    return;
  }
  if (peer === currentIdentity()) {
    setGovernanceStatus("不能和自己发起私聊", true);
    return;
  }
  setGovernanceStatus(`正在与 ${peer} 打开私聊`);
  const result = await postGatewayJson("/v1/direct/open", {
    requester_id: currentIdentity(),
    requester_device_id: "browser-shell",
    peer_id: peer,
    peer_device_id: "browser-shell",
  });
  directOpenFormEl?.reset();
  focusRoom(result.conversation_id);
  await refreshFromGateway();
  setGovernanceStatus(`私聊已就绪：${peer}`);
}

async function submitProviderConnect() {
  if (!gatewayUrl) return;
  const providerUrl = providerUrlInputEl.value.trim();
  if (!providerUrl) {
    setGovernanceStatus("请填写消息来源地址", true);
    return;
  }
  setGovernanceStatus(`正在连接消息来源：${providerUrl}`);
  provider = await postGatewayJson("/v1/provider/connect", {
    provider_url: providerUrl,
  });
  await refreshFromGateway();
  setGovernanceStatus(`消息来源已连接：${translateProviderMode(provider.mode)}`);
}

async function submitProviderDisconnect() {
  if (!gatewayUrl) return;
  setGovernanceStatus("正在断开消息来源");
  provider = await postGatewayJson("/v1/provider/disconnect", {});
  if (!provider.base_url) {
    providerUrlInputEl.value = "";
  }
  await refreshFromGateway();
  setGovernanceStatus("消息来源已断开，当前改用本地草稿");
}

async function submitAddMirrorSource() {
  const baseUrl = worldMirrorUrlInputEl.value.trim();
  if (!baseUrl) {
    setGovernanceStatus("请填写镜像源地址", true);
    return;
  }
  setGovernanceStatus(`正在添加镜像源：${baseUrl}`);
  await postGatewayJson("/v1/world-mirror-sources", {
    base_url: baseUrl,
  });
  worldMirrorFormEl.reset();
  await refreshFromGateway();
  setGovernanceStatus(`镜像源已添加：${baseUrl}`);
}

async function submitWorldNotice() {
  const title = worldNoticeTitleInputEl.value.trim();
  const body = worldNoticeBodyInputEl.value.trim();
  if (!title || !body) {
    setGovernanceStatus("请填写公告标题和正文", true);
    return;
  }
  const tags = worldNoticeTagsInputEl.value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  setGovernanceStatus(`正在发布世界公告：${title}`);
  await postGatewayJson("/v1/world-square/notices", {
    actor_id: currentIdentity(),
    title,
    body,
    severity: worldNoticeSeveritySelectEl.value || "info",
    tags,
  });
  worldNoticeFormEl.reset();
  worldNoticeSeveritySelectEl.value = "info";
  await refreshFromGateway();
  setGovernanceStatus(`世界公告已发布：${title}`);
}

async function submitCityTrustUpdate() {
  const city = worldTrustCityInputEl.value.trim();
  const reason = worldTrustReasonInputEl.value.trim();
  if (!city) {
    setGovernanceStatus("请填写城市别名或城市标识", true);
    return;
  }
  setGovernanceStatus(`正在更新 ${city} 的信任状态`);
  await postGatewayJson("/v1/world-safety/cities/trust", {
    actor_id: currentIdentity(),
    city,
    state: worldTrustStateSelectEl.value,
    reason: reason || undefined,
  });
  worldTrustFormEl.reset();
  worldTrustStateSelectEl.value = "Healthy";
  await refreshFromGateway();
  setGovernanceStatus(`${city} 的信任状态已更新`);
}

async function submitWorldAdvisory() {
  const subjectRef = worldAdvisorySubjectInputEl.value.trim();
  const action = worldAdvisoryActionInputEl.value.trim();
  const reason = worldAdvisoryReasonInputEl.value.trim();
  if (!subjectRef || !action || !reason) {
    setGovernanceStatus("请填写对象、动作和原因", true);
    return;
  }
  setGovernanceStatus(`正在发布安全通告：${subjectRef}`);
  await postGatewayJson("/v1/world-safety/advisories", {
    actor_id: currentIdentity(),
    subject_kind: worldAdvisorySubjectKindSelectEl.value,
    subject_ref: subjectRef,
    action,
    reason,
  });
  worldAdvisoryFormEl.reset();
  worldAdvisorySubjectKindSelectEl.value = "City";
  await refreshFromGateway();
  setGovernanceStatus(`安全通告已发布：${subjectRef}`);
}

async function submitWorldReport() {
  const city = worldReportCityInputEl.value.trim();
  const targetRef = worldReportTargetInputEl.value.trim();
  const summary = worldReportSummaryInputEl.value.trim();
  if (!targetRef || !summary) {
    setGovernanceStatus("请填写举报对象和违规摘要", true);
    return;
  }
  const evidence = worldReportEvidenceInputEl.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  setGovernanceStatus(`正在提交举报：${targetRef}`);
  await postGatewayJson("/v1/world-safety/reports", {
    reporter_id: currentIdentity(),
    city: city || undefined,
    target_kind: worldReportTargetKindSelectEl.value,
    target_ref: targetRef,
    summary,
    evidence,
  });
  worldReportFormEl.reset();
  worldReportTargetKindSelectEl.value = "City";
  await refreshFromGateway();
  setGovernanceStatus(`举报已提交：${targetRef}`);
}

async function submitWorldReportReview() {
  const reportId = worldReportReviewIdInputEl.value.trim();
  const resolution = worldReportReviewResolutionInputEl.value.trim();
  if (!reportId || !resolution) {
    setGovernanceStatus("请填写举报标识和审查结论", true);
    return;
  }
  const cityState = worldReportReviewCityStateSelectEl.value.trim();
  setGovernanceStatus(`正在审查举报：${reportId}`);
  await postGatewayJson("/v1/world-safety/reports/review", {
    actor_id: currentIdentity(),
    report_id: reportId,
    status: worldReportReviewStatusSelectEl.value,
    resolution,
    city_state: cityState || undefined,
  });
  worldReportReviewFormEl.reset();
  worldReportReviewStatusSelectEl.value = "Reviewed";
  worldReportReviewCityStateSelectEl.value = "";
  await refreshFromGateway();
  setGovernanceStatus(`举报已审查：${reportId}`);
}

async function submitResidentSanction() {
  const residentId = worldResidentIdInputEl.value.trim();
  const reason = worldResidentReasonInputEl.value.trim();
  if (!residentId || !reason) {
    setGovernanceStatus("请填写居民标识和制裁原因", true);
    return;
  }
  const city = worldResidentCityInputEl.value.trim();
  const email = worldResidentEmailInputEl.value.trim();
  const mobile = worldResidentMobileInputEl.value.trim();
  const devicePhysicalAddress = worldResidentDeviceInputEl.value.trim();
  setGovernanceStatus(`正在发布居民制裁：${residentId}`);
  await postGatewayJson("/v1/world-safety/residents/sanction", {
    actor_id: currentIdentity(),
    resident_id: residentId,
    city: city || undefined,
    email: email || undefined,
    mobile: mobile || undefined,
    device_physical_addresses: devicePhysicalAddress
      ? [devicePhysicalAddress]
      : undefined,
    reason,
    portability_revoked: true,
  });
  worldResidentSanctionFormEl.reset();
  await refreshFromGateway();
  setGovernanceStatus(`居民制裁已发布：${residentId}`);
}

async function requestEmailOtp() {
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
}

function exportMimeType(format) {
  if (format === "jsonl") return "application/x-ndjson";
  if (format === "txt") return "text/plain;charset=utf-8";
  return "text/markdown;charset=utf-8";
}

function downloadContent(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function exportHistory({ conversationId = null, includePublic = true } = {}) {
  if (!gatewayUrl) {
    setGovernanceStatus("请先连接网关后再导出会话", true);
    return;
  }
  const format = exportFormatSelectEl?.value || "markdown";
  const params = new URLSearchParams({
    resident_id: currentIdentity(),
    format,
    include_public: includePublic ? "true" : "false",
  });
  if (conversationId) {
    params.set("conversation_id", conversationId);
  }
  setGovernanceStatus(
    conversationId ? `正在导出会话：${conversationId}` : "正在导出全部可见历史",
  );
  const response = await fetch(`${gatewayUrl}/v1/export?${params.toString()}`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || "导出失败");
  }
  const scopeName = conversationId ? conversationId.replace(/[:/]+/g, "_") : "全部历史";
  const filename = `龙虾聊天_${scopeName}.${exportFileExtension(format)}`;
  downloadContent(filename, payload.content || "", exportMimeType(format));
  setGovernanceStatus(`导出文件已准备好：${filename}`);
}

async function main() {
  chatFocusPreference = loadChatFocusPreference();
  setChatFocusMode(chatFocusPreference);
  applyShellMode();
  setWorkspace(resolveWorkspace(), { persist: false });
  roomReadMarkers = loadRoomReadMarkers();
  roomDrafts = loadRoomDrafts();
  roomQuickStates = loadRoomQuickStates();
  roomQuickSnapshots = loadRoomQuickSnapshots();
  syncChatPaneMode(resolveChatPaneMode(), { persist: false });
  await loadBootstrap();
  await loadCachedState();
  await loadShellState();
  loadSenderIdentity();
  loadAuthDraft();
  if (authSession.challengeId && authSession.maskedEmail) {
    setAuthStatus(`待完成验证码登录：${authSession.maskedEmail}`);
  } else {
    setAuthStatus("空闲");
  }
  gatewayUrl = resolveGatewayUrl();
  await loadGatewayBootstrap();
  gatewayUrl = resolveGatewayUrl();
  await refreshFromGateway();
  await loadWorldEntry();
  bootTransportStatus();
  refreshGatewayBadge();
  if (!userShellProjection()) {
    renderGovernance();
    renderResidents();
  }
  renderRooms();
  renderTimeline();
  updateComposerState();
  updateAuthFormState();
  updateResidentLoginSurface();
  if (!userShellProjection()) {
    updateGovernanceFormState();
  }
  applyWorkspace();
  syncComposerDraft({ force: true });
  updateComposerState();
  startGatewayRealtime();
  focusComposerInput({ force: true });
}

composerFormEl?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitComposerMessage();
});

document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible") {
    await refreshOnForeground("visibilitychange");
  }
});

window.addEventListener("focus", async () => {
  await refreshOnForeground("focus");
});

window.addEventListener("pageshow", async () => {
  await refreshOnForeground("pageshow");
});

composerInputEl?.addEventListener("input", (event) => {
  if (activeRoomId) {
    const roomId = activeRoomId;
    const hadDraft = roomHasDraft(roomId);
    const hadError = Boolean(roomSendErrors[roomId]);
    if (!event.target.value.trim()) {
      setRoomQuickAction(roomId, "");
    }
    updateRoomDraft(roomId, event.target.value);
    delete roomSendErrors[roomId];
    if (hadDraft !== roomHasDraft(roomId) || hadError) {
      renderRooms();
    }
  }
  autoSizeComposerInput();
  renderConversationOverview();
  updateComposerState();
});

cityCreateFormEl?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = cityCreateFormEl.querySelector("button");
  button.disabled = true;
  try {
    await submitCreateCity();
  } catch (error) {
    setGovernanceStatus(localizedRuntimeError(error, "创建城市失败"), true);
  } finally {
    updateGovernanceFormState();
  }
});

cityJoinFormEl?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = cityJoinFormEl.querySelector("button");
  button.disabled = true;
  try {
    await submitJoinCity();
  } catch (error) {
    setGovernanceStatus(localizedRuntimeError(error, "加入城市失败"), true);
  } finally {
    updateGovernanceFormState();
  }
});

roomCreateFormEl?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = roomCreateFormEl.querySelector("button");
  button.disabled = true;
  try {
    await submitCreateRoom();
  } catch (error) {
    setGovernanceStatus(localizedRuntimeError(error, "创建房间失败"), true);
  } finally {
    updateGovernanceFormState();
  }
});

directOpenFormEl?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = directOpenFormEl.querySelector("button");
  button.disabled = true;
  try {
    await openDirectSession(directPeerInputEl.value);
  } catch (error) {
    setGovernanceStatus(localizedRuntimeError(error, "打开私聊失败"), true);
  } finally {
    updateGovernanceFormState();
  }
});

providerConnectFormEl?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = providerConnectFormEl.querySelector("button");
  button.disabled = true;
  try {
    await submitProviderConnect();
  } catch (error) {
    setGovernanceStatus(localizedRuntimeError(error, "连接消息来源失败"), true);
  } finally {
    updateGovernanceFormState();
  }
});

providerDisconnectButtonEl?.addEventListener("click", async () => {
  providerDisconnectButtonEl.disabled = true;
  try {
    await submitProviderDisconnect();
  } catch (error) {
    setGovernanceStatus(localizedRuntimeError(error, "断开消息来源失败"), true);
  } finally {
    updateGovernanceFormState();
  }
});

authRequestFormEl?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = authRequestFormEl.querySelector("button");
  button.disabled = true;
  persistAuthDraft();
  try {
    await requestEmailOtp();
  } catch (error) {
    setAuthStatus(localizedRuntimeError(error, "申请验证码失败"), true);
  } finally {
    updateAuthFormState();
  }
});

authVerifyFormEl?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = authVerifyFormEl.querySelector("button");
  button.disabled = true;
  persistAuthDraft();
  try {
    await verifyEmailOtp();
    residentLoginDismissed = false;
  } catch (error) {
    setAuthStatus(localizedRuntimeError(error, "验证码校验失败"), true);
  } finally {
    updateAuthFormState();
  }
});

residentLoginCloseEl?.addEventListener("click", () => {
  residentLoginDismissed = true;
  updateResidentLoginSurface();
});

hudLoginToggleEl?.addEventListener("click", () => {
  residentLoginDismissed = false;
  updateResidentLoginSurface();
});

worldMirrorFormEl?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = worldMirrorFormEl.querySelector("button");
  button.disabled = true;
  try {
    await submitAddMirrorSource();
  } catch (error) {
    setGovernanceStatus(localizedRuntimeError(error, "添加镜像源失败"), true);
  } finally {
    updateGovernanceFormState();
  }
});

worldNoticeFormEl?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = worldNoticeFormEl.querySelector("button");
  button.disabled = true;
  try {
    await submitWorldNotice();
  } catch (error) {
    setGovernanceStatus(localizedRuntimeError(error, "发布世界公告失败"), true);
  } finally {
    updateGovernanceFormState();
  }
});

worldTrustFormEl?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = worldTrustFormEl.querySelector("button");
  button.disabled = true;
  try {
    await submitCityTrustUpdate();
  } catch (error) {
    setGovernanceStatus(localizedRuntimeError(error, "更新城市信任状态失败"), true);
  } finally {
    updateGovernanceFormState();
  }
});

worldAdvisoryFormEl?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = worldAdvisoryFormEl.querySelector("button");
  button.disabled = true;
  try {
    await submitWorldAdvisory();
  } catch (error) {
    setGovernanceStatus(localizedRuntimeError(error, "发布安全通告失败"), true);
  } finally {
    updateGovernanceFormState();
  }
});

worldReportReviewFormEl?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = worldReportReviewFormEl.querySelector("button");
  button.disabled = true;
  try {
    await submitWorldReportReview();
  } catch (error) {
    setGovernanceStatus(localizedRuntimeError(error, "审查举报失败"), true);
  } finally {
    updateGovernanceFormState();
  }
});

worldReportFormEl?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = worldReportFormEl.querySelector("button");
  button.disabled = true;
  try {
    await submitWorldReport();
  } catch (error) {
    setGovernanceStatus(localizedRuntimeError(error, "提交举报失败"), true);
  } finally {
    updateGovernanceFormState();
  }
});

worldResidentSanctionFormEl?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = worldResidentSanctionFormEl.querySelector("button");
  button.disabled = true;
  try {
    await submitResidentSanction();
  } catch (error) {
    setGovernanceStatus(localizedRuntimeError(error, "发布居民制裁失败"), true);
  } finally {
    updateGovernanceFormState();
  }
});

exportCurrentButtonEl?.addEventListener("click", async () => {
  try {
    if (!activeRoomId) {
      setGovernanceStatus("请先打开一个会话", true);
      return;
    }
    await exportHistory({ conversationId: activeRoomId, includePublic: true });
  } catch (error) {
    setGovernanceStatus(localizedRuntimeError(error, "导出当前会话失败"), true);
  }
});

exportAllButtonEl?.addEventListener("click", async () => {
  try {
    await exportHistory({ conversationId: null, includePublic: true });
  } catch (error) {
    setGovernanceStatus(localizedRuntimeError(error, "导出全部历史失败"), true);
  }
});

identityInputEl?.addEventListener("change", async (event) => {
  persistSenderIdentity(event.target.value);
  await refreshIdentityProjection();
});

identityInputEl?.addEventListener("blur", async (event) => {
  persistSenderIdentity(event.target.value);
  await refreshIdentityProjection();
});

// WeChat drawer toggle for user page
const railDrawerEl = document.querySelector("#rail-drawer");
const railToggleEl = document.querySelector("#rail-toggle");
const drawerCloseEl = document.querySelector("#drawer-close");

if (railToggleEl && railDrawerEl) {
  railToggleEl.addEventListener("click", () => {
    railDrawerEl.classList.toggle("open");
  });
}

if (drawerCloseEl && railDrawerEl) {
  drawerCloseEl.addEventListener("click", () => {
    railDrawerEl.classList.remove("open");
  });
}

// Hub page rail toggle for mobile
const hudRailToggleEl = document.querySelector("#hud-rail-toggle");
const sfcRailEl = document.querySelector(".sfc-rail");

if (hudRailToggleEl && sfcRailEl) {
  hudRailToggleEl.addEventListener("click", () => {
    sfcRailEl.classList.toggle("open");
  });
}

// Scene-first pages can temporarily clear UI chrome, similar to macOS showing the desktop.
const sceneStageSelector = ".creative-stage, .public-square-stage, .world-entry-stage, .user-stage";
const sceneClearStageEl = document.querySelector(sceneStageSelector);
const sceneClearRestoreEl = document.querySelector(".creative-chat-frame, .public-square-chat, .user-chat-frame");
const sceneHotspotEls = Array.from(document.querySelectorAll(".scene-hotspot"));
let sceneHotspotPopoverEl = null;
let sceneHotspotCloseTimer = null;

function applySceneIntroState() {
  if (!sceneClearStageEl || !document.body) return;
  const variant = document.body.dataset.shellVariant || document.body.dataset.shellPage || "scene";
  const key = `lobster-scene-intro-seen:${location.pathname}:${variant}`;
  try {
    if (window.localStorage?.getItem(key) === "1") {
      document.body.classList.add("scene-intro-seen");
      return;
    }
    document.body.classList.add("scene-intro-first");
    window.localStorage?.setItem(key, "1");
  } catch {
    document.body.classList.add("scene-intro-first");
  }
}

applySceneIntroState();

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[char]);
}

function initializeComposerSymbolTabs() {
  if (!composerSymbolMenuEl || composerSymbolMenuEl.dataset.symbolTabsReady === "true") return;
  const categories = Array.from(composerSymbolMenuEl.querySelectorAll(".composer-symbol-category"));
  if (categories.length <= 1) return;

  const tabBar = document.createElement("div");
  tabBar.className = "composer-symbol-tabs";
  tabBar.setAttribute("role", "tablist");
  tabBar.setAttribute("aria-label", "颜文字分类");

  const tabButtons = [];
  const selectCategory = (selectedIndex) => {
    categories.forEach((category, index) => {
      const active = index === selectedIndex;
      category.classList.toggle("is-active", active);
      category.hidden = !active;
      tabButtons[index]?.classList.toggle("is-active", active);
      tabButtons[index]?.setAttribute("aria-selected", active ? "true" : "false");
      tabButtons[index]?.setAttribute("tabindex", active ? "0" : "-1");
    });
  };

  categories.forEach((category, index) => {
    const heading = category.querySelector(".composer-symbol-heading")?.textContent?.trim() || `分类 ${index + 1}`;
    const panelId = category.id || `composer-symbol-panel-${index + 1}`;
    const tabId = `composer-symbol-tab-${index + 1}`;

    category.id = panelId;
    category.setAttribute("role", "tabpanel");
    category.setAttribute("aria-labelledby", tabId);

    const button = document.createElement("button");
    button.type = "button";
    button.id = tabId;
    button.className = "composer-symbol-tab";
    button.setAttribute("data-symbol-tab", String(index));
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", panelId);
    button.textContent = heading.replace(/\s*\/\s*/g, "/");
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectCategory(index);
    });
    button.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + direction + categories.length) % categories.length;
      selectCategory(nextIndex);
      tabButtons[nextIndex]?.focus();
    });

    tabButtons.push(button);
    tabBar.appendChild(button);
  });

  composerSymbolMenuEl.insertBefore(tabBar, composerSymbolMenuEl.firstChild);
  composerSymbolMenuEl.classList.add("is-tabbed");
  composerSymbolMenuEl.dataset.symbolTabsReady = "true";
  selectCategory(0);
}

function setComposerSymbolMenuOpen(open) {
  if (!composerSymbolTriggerEl || !composerSymbolMenuEl) return;
  if (open && composerSymbolMenuEl.parentElement !== document.body) {
    document.body.appendChild(composerSymbolMenuEl);
  }
  if (open) {
    initializeComposerSymbolTabs();
  }
  if (open) {
    Object.assign(composerSymbolMenuEl.style, {
      position: "fixed",
      left: "clamp(170px, 16vw, 320px)",
      bottom: "94px",
      display: "block",
    });
  } else {
    composerSymbolMenuEl.removeAttribute("style");
  }
  composerSymbolMenuEl.hidden = !open;
  composerSymbolTriggerEl.setAttribute("aria-expanded", open ? "true" : "false");
}

function insertComposerSymbol(symbol) {
  if (!composerInputEl || composerInputEl.disabled) return;
  const start = composerInputEl.selectionStart ?? composerInputEl.value.length;
  const end = composerInputEl.selectionEnd ?? composerInputEl.value.length;
  const prefix = composerInputEl.value.slice(0, start);
  const suffix = composerInputEl.value.slice(end);
  const spacer = prefix && !/\\s$/.test(prefix) ? " " : "";
  const nextText = `${prefix}${spacer}${symbol}${suffix}`;
  const nextCursor = prefix.length + spacer.length + symbol.length;
  composerInputEl.value = nextText;
  composerInputEl.setSelectionRange(nextCursor, nextCursor);
  composerInputEl.dispatchEvent(new Event("input", { bubbles: true }));
  composerInputEl.focus({ preventScroll: true });
}

function insertComposerMention() {
  if (!composerInputEl || composerInputEl.disabled) return;
  const start = composerInputEl.selectionStart ?? composerInputEl.value.length;
  const end = composerInputEl.selectionEnd ?? composerInputEl.value.length;
  const prefix = composerInputEl.value.slice(0, start);
  const suffix = composerInputEl.value.slice(end);
  const token = "@";
  const spacer = prefix && !/\s$/.test(prefix) ? " " : "";
  const nextText = `${prefix}${spacer}${token}${suffix}`;
  const nextCursor = prefix.length + spacer.length + token.length;
  composerInputEl.value = nextText;
  composerInputEl.setSelectionRange(nextCursor, nextCursor);
  composerInputEl.dispatchEvent(new Event("input", { bubbles: true }));
  composerInputEl.focus({ preventScroll: true });
}

composerMentionTriggerEl?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  insertComposerMention();
});

composerSymbolTriggerEl?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  setComposerSymbolMenuOpen(composerSymbolMenuEl?.hidden ?? true);
});

for (const button of composerSymbolInsertEls) {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    insertComposerSymbol(button.dataset.symbolInsert || button.textContent?.trim() || "");
    setComposerSymbolMenuOpen(false);
  });
}

document.addEventListener("click", (event) => {
  if (!composerSymbolMenuEl || composerSymbolMenuEl.hidden) return;
  if (event.target.closest("[data-symbol-menu], [data-symbol-trigger]")) return;
  setComposerSymbolMenuOpen(false);
});

function setSceneClearMode(enabled) {
  if (enabled) {
    closeSceneHotspotPopover();
  }
  document.body.classList.toggle("scene-clear-mode", enabled);
}

function isSceneClearMode() {
  return document.body.classList.contains("scene-clear-mode");
}

function closeSceneHotspotPopover() {
  if (sceneHotspotCloseTimer) {
    clearTimeout(sceneHotspotCloseTimer);
    sceneHotspotCloseTimer = null;
  }
  sceneHotspotPopoverEl?.remove();
  sceneHotspotPopoverEl = null;
  sceneHotspotEls.forEach((button) => button.removeAttribute("aria-expanded"));
}

function scheduleSceneHotspotClose(delayMs = 1200) {
  if (sceneHotspotCloseTimer) clearTimeout(sceneHotspotCloseTimer);
  sceneHotspotCloseTimer = setTimeout(() => closeSceneHotspotPopover(), delayMs);
}

function openSceneHotspotPopover(button) {
  const stage = button.closest(sceneStageSelector);
  if (!stage) return;
  closeSceneHotspotPopover();
  const title = button.dataset.hotspotTitle || button.textContent?.trim() || "热点";
  const copy = button.dataset.hotspotCopy || "这里会承载后续场景交互。";
  const buttonRect = button.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  const left = Math.min(Math.max(buttonRect.left - stageRect.left + buttonRect.width / 2, 132), stageRect.width - 132);
  const top = Math.min(Math.max(buttonRect.top - stageRect.top + buttonRect.height + 10, 72), stageRect.height - 112);
  const popover = document.createElement("div");
  popover.className = "scene-hotspot-popover";
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
  const popoverTitle = document.createElement("div");
  popoverTitle.className = "scene-hotspot-title";
  popoverTitle.textContent = title;
  const popoverCopy = document.createElement("div");
  popoverCopy.className = "scene-hotspot-copy";
  popoverCopy.textContent = copy;
  popover.appendChild(popoverTitle);
  popover.appendChild(popoverCopy);
  stage.appendChild(popover);
  button.setAttribute("aria-expanded", "true");
  sceneHotspotPopoverEl = popover;
}

for (const button of sceneHotspotEls) {
  const isNavigationHotspot = button.tagName?.toLowerCase() === "a" && button.getAttribute("href");
  if (isNavigationHotspot) {
    button.addEventListener("click", () => closeSceneHotspotPopover());
    continue;
  }
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("mouseenter", () => openSceneHotspotPopover(button));
  button.addEventListener("mouseleave", () => scheduleSceneHotspotClose(220));
  button.addEventListener("focus", () => openSceneHotspotPopover(button));
  button.addEventListener("blur", () => scheduleSceneHotspotClose(220));
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    openSceneHotspotPopover(button);
    scheduleSceneHotspotClose(1600);
  });
}

if (sceneClearStageEl) {
  sceneClearStageEl.addEventListener("click", (event) => {
    if (isSceneClearMode()) {
      setSceneClearMode(false);
      return;
    }
    if (event.target.closest(".message, .message-avatar, .message-quick-action")) return;
    if (event.target.closest("a, button, input, textarea, select, [role='button']")) return;
    if (event.target.closest(".creative-composer, .public-square-composer, .user-composer")) return;
    if (event.target.closest(".creative-rail, .public-square-rail, .world-entry-rail, .user-rail")) return;
    if (event.target.closest(".creative-hud, .public-square-hud, .world-entry-hud, .user-hud")) return;
    if (event.target.closest(".scene-hotspot, .scene-hotspot-popover")) return;
    setSceneClearMode(true);
  });

  timelineEl?.addEventListener("click", (event) => {
    if (isSceneClearMode()) return;
    if (event.target.closest("a, button, input, textarea, select, [role='button'], .message, .message-avatar, .message-quick-action")) {
      return;
    }
    if (event.target === timelineEl || event.target.closest(".message-row, .message-stack")) {
      setSceneClearMode(true);
    }
  });

  sceneClearRestoreEl?.addEventListener("click", () => {
    if (isSceneClearMode()) {
      setSceneClearMode(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setComposerSymbolMenuOpen(false);
    }
    if (event.key === "Escape" && isSceneClearMode()) {
      setSceneClearMode(false);
    }
    if (event.key === "Escape") {
      closeSceneHotspotPopover();
    }
  });
}

// Close drawer when clicking outside
document.addEventListener("click", (event) => {
  if (railDrawerEl?.classList.contains("open") &&
      !railDrawerEl.contains(event.target) &&
      !railToggleEl?.contains(event.target)) {
    railDrawerEl.classList.remove("open");
  }
  if (sfcRailEl?.classList.contains("open") &&
      !sfcRailEl.contains(event.target) &&
      !hudRailToggleEl?.contains(event.target)) {
    sfcRailEl.classList.remove("open");
  }
});

main();
