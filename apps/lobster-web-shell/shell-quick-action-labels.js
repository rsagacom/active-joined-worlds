// shell-quick-action-labels.js — quickAction 纯标签与阶段函数
// 零 DOM / fetch / 状态依赖，仅根据 action 字符串返回标签/文案/阶段数组。

export function quickActionStatusCopy(action) {
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

export function quickActionTone(action) {
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

export function quickActionIntensity(action) {
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

export function quickActionOverviewSummary(action) {
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

export function quickActionOverviewCtaLabel(action, state) {
  state = state || "";
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

export function quickActionDraftStatusCopy(action, length) {
  switch (action) {
    case "整理":
      return "整理草稿已暂存 · " + length + " 字 · 发出后会落成结构化整理卡";
    case "留条":
      return "留条草稿已暂存 · " + length + " 字 · 发出后会落成结构化便条";
    case "委托":
      return "委托草稿已暂存 · " + length + " 字 · 发出后会落成结构化委托单";
    case "交易":
      return "交易草稿已暂存 · " + length + " 字 · 发出后会落成结构化交易卡";
    case "续聊":
      return "续聊草稿已暂存 · " + length + " 字";
    case "私聊":
      return "私聊草稿已暂存 · " + length + " 字";
    default:
      return "";
  }
}

export function quickActionStateStages(action) {
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

export function quickActionStage(action, state) {
  state = state || "";
  var stages = quickActionStateStages(action);
  for (var i = 0; i < stages.length; i++) {
    if (stages[i].label === state) return stages[i];
  }
  return stages[0] || null;
}

export function quickActionFollowUpLabel(action, state = "") {
  return quickActionStage(action, state)?.label || "";
}

export function quickActionFollowUpCopy(action, state = "") {
  return quickActionStage(action, state)?.copy || "";
}

export function quickActionBadgeLabel(action) {
  return action ? `动作 ${action}` : "";
}

export function quickActionBadgeTone(action) {
  return quickActionTone(action);
}

export function quickActionBadgeIntensity(action) {
  return quickActionIntensity(action);
}

export function buildRoomQuickActionPillDomSpec(action = "") {
  const label = quickActionBadgeLabel(action);
  if (!label) return null;
  const dataset = {};
  const intensity = quickActionBadgeIntensity(action);
  if (intensity) dataset.actionIntensity = intensity;
  if (action) dataset.quickAction = action;
  return {
    text: label,
    tone: quickActionBadgeTone(action),
    classNames: ["pill-room-action", "is-clickable"],
    dataset,
    title: "点击继续当前动作",
  };
}

export function buildRoomInlineActionsRailDomSpec(action = "") {
  if (!action) return null;
  const dataset = { quickAction: action };
  const actionIntensity = quickActionIntensity(action);
  if (actionIntensity) dataset.actionIntensity = actionIntensity;
  return {
    className: "room-inline-actions",
    dataset,
  };
}

export function buildRoomInlineActionDomSpec(action = "", label = "", role = "") {
  const cleanLabel = typeof label === "string" ? label.trim() : "";
  const cleanRole = typeof role === "string" ? role.trim() : "";
  if (!cleanLabel || !cleanRole) return null;
  const dataset = { roomInlineRole: cleanRole };
  const actionIntensity = quickActionIntensity(action);
  if (actionIntensity) dataset.actionIntensity = actionIntensity;
  return {
    type: "span",
    className: `room-inline-action room-inline-action-${cleanRole}`,
    text: cleanLabel,
    dataset,
    tabIndex: 0,
    attributes: {
      role: "button",
    },
  };
}

export function buildRoomInlineProgressDomSpec(action = "", state = "") {
  const stages = quickActionStateStages(action);
  if (!stages.length) return null;
  const stageIndex = Math.max(
    stages.findIndex((stage) => stage.label === state),
    0,
  );
  const dataset = {};
  const actionIntensity = quickActionIntensity(action);
  if (actionIntensity) dataset.actionIntensity = actionIntensity;
  return {
    className: "room-inline-progress",
    dataset,
    title: quickActionStage(action, state)?.copy || "",
    tabIndex: 0,
    attributes: {
      role: "button",
    },
    count: {
      className: "room-inline-progress-count",
      text: `${stageIndex + 1} / ${Math.max(stages.length, 1)}`,
    },
    label: {
      className: "room-inline-progress-label",
      text: state,
    },
    stageIndex,
    stageCount: stages.length,
  };
}

export function buildRoomInlineProgressRenderDomSpec(action = "", state = "") {
  const progress = buildRoomInlineProgressDomSpec(action, state);
  if (!progress) return null;
  return {
    type: "div",
    className: progress.className,
    dataset: progress.dataset,
    title: progress.title,
    tabIndex: progress.tabIndex,
    attributes: progress.attributes,
    children: [
      {
        type: "span",
        className: progress.count.className,
        text: progress.count.text,
      },
      {
        type: "span",
        className: progress.label.className,
        text: progress.label.text,
      },
    ],
    stageIndex: progress.stageIndex,
    stageCount: progress.stageCount,
  };
}

export function quickActionSummary(action) {
  return action ? `最近动作：${action}` : "";
}

export function quickActionContextCopy(action) {
  if (!action) return "";
  return `最近动作：${action} · ${quickActionStatusCopy(action)}`;
}

export function nextQuickActionState(action, state = "") {
  const stages = quickActionStateStages(action);
  const index = stages.findIndex((stage) => stage.label === state);
  if (index < 0 || index >= stages.length - 1) return "";
  return stages[index + 1].label;
}

export function quickActionDefaultSendLabel(action) {
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

export function workflowProgressStageState(index, currentIndex) {
  if (index < currentIndex) return "done";
  if (index === currentIndex) return "current";
  return "upcoming";
}

export function buildWorkflowProgressDomSpec(action, state = "", options = {}) {
  const stages =
    Array.isArray(options.stages) && options.stages.length
      ? options.stages
      : quickActionStateStages(action);
  if (!stages.length) return null;

  const currentIndex = Math.max(
    stages.findIndex((stage) => stage?.label === state),
    0,
  );
  const classNames = ["workflow-progress"];
  if (typeof options.className === "string") {
    classNames.push(...options.className.split(/\s+/).map((item) => item.trim()).filter(Boolean));
  }
  const dataset = {};
  const actionIntensity = quickActionIntensity(action);
  if (actionIntensity) dataset.actionIntensity = actionIntensity;
  if (action) dataset.quickAction = action;
  const title = typeof options.title === "string" ? options.title.trim() : "";

  return {
    classNames,
    dataset,
    titleLine: title ? { className: "workflow-progress-title", text: title } : null,
    stepsClassName: "workflow-progress-steps",
    steps: stages.map((stage, index) => ({
      className: "workflow-progress-step",
      dataset: {
        stageState: workflowProgressStageState(index, currentIndex),
        stageLabel: stage?.label || "",
      },
      clickable: Boolean(options.onStageClick),
      markerClassName: "workflow-progress-marker",
      markerText: String(index + 1),
      labelClassName: "workflow-progress-label",
      labelText: stage?.label || "",
      stage,
      index,
    })),
  };
}
