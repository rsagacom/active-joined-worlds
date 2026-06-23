// shell-caretaker-panel.js — 非居民页管家面板纯规格

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

export function caretakerPanelModel() {
  return {
    title: "OpenClaw 管家 · 小狗",
    profile: CARETAKER_PROFILE,
    messages: CARETAKER_MESSAGES,
    rulesTitle: "自动回复 / 留言规则",
    rules: CARETAKER_RULES,
  };
}

export function caretakerStatusItems({ roomLabel = "等待选中会话" } = {}) {
  return [
    { element: "strong", text: CARETAKER_PROFILE.displayName },
    { element: "span", text: CARETAKER_PROFILE.status },
    { element: "span", className: "caretaker-status-item", text: roomLabel },
    {
      element: "span",
      className: "caretaker-status-item",
      text: `规则：${CARETAKER_RULES[0]}`,
    },
    {
      element: "span",
      className: "caretaker-status-item",
      text: `留言：${CARETAKER_MESSAGES[0].detail}`,
    },
  ];
}
