/* ============================================================
   shell-quick-action-templates.js — Quick Action 模板常量与纯函数
   所有函数零外部依赖，switch 驱动，可从 app.js 安全提取。
   ============================================================ */

export const QUICK_ACTION_BLUEPRINTS = {
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

export const QUICK_ACTION_INLINE_FIELD_PRIORITY = {
  "整理": ["目标", "待办"],
  "留条": ["留给", "内容"],
  "委托": ["需求", "截止"],
  "交易": ["标的", "数量"],
};

export const QUICK_ACTION_INLINE_STATE_FIELD_PRIORITY = {
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

/**
 * @param {string} action
 * @param {string} [state]
 * @param {string} [fallbackTemplate] — 调用方通过 quickActionTemplate(action) 计算传入
 * @returns {string}
 */
export function quickActionWorkflowTemplate(action, state = "", fallbackTemplate = "") {
  switch (action) {
    case "整理":
      if (state === "已归档") {
        return ["整理：", "- 回看：", "- 新补充：", "- 风险："].join("\n");
      }
      return fallbackTemplate;
    case "留条":
      if (state === "已补充") {
        return ["留条：", "- 留给：", "- 补充：", "- 下一步："].join("\n");
      }
      return fallbackTemplate;
    case "委托":
      if (state === "已完成") {
        return ["委托：", "- 新需求：", "- 截止：", "- 交付："].join("\n");
      }
      if (state === "已回执") {
        return ["委托：", "- 回执：", "- 待确认：", "- 下一步："].join("\n");
      }
      return fallbackTemplate;
    case "交易":
      if (state === "已结清") {
        return ["交易：", "- 新标的：", "- 数量：", "- 备注："].join("\n");
      }
      if (state === "已确认") {
        return ["交易：", "- 结果：", "- 待结清：", "- 备注："].join("\n");
      }
      return fallbackTemplate;
    default:
      return fallbackTemplate;
  }
}
