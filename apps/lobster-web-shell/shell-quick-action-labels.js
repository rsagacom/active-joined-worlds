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
