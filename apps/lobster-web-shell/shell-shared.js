export function localTimeOfDay(date = new Date()) {
  const hour = date.getHours();
  return hour >= 6 && hour < 18 ? "day" : "night";
}

export function currentShellPage(body = globalThis.document?.body) {
  return body?.dataset?.shellPage || "hub";
}

export function applyLocalTimeOfDayState(body = globalThis.document?.body, date = new Date()) {
  if (!body || body.dataset.timeOfDay) return;
  body.dataset.timeOfDay = localTimeOfDay(date);
}

export function resolveShellMode({
  body = globalThis.document?.body,
  href = globalThis.window?.location?.href || "http://localhost/",
} = {}) {
  const fixed = (body?.dataset?.defaultShellMode || "").trim().toLowerCase();
  if (fixed === "user" || fixed === "admin" || fixed === "unified") {
    return fixed;
  }
  const url = new URL(href);
  const mode = (url.searchParams.get("mode") || "").trim().toLowerCase();
  if (mode === "user" || mode === "admin") {
    return mode;
  }
  return "unified";
}

export function safeLocalStorageGet(key, storage = globalThis.window?.localStorage) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function safeLocalStorageSet(key, value, storage = globalThis.window?.localStorage) {
  try {
    storage?.setItem(key, value);
  } catch {
    // Storage can be unavailable in private mode, denied iframes, or tests.
  }
}

export function scopedShellStorageKey(prefix, page = currentShellPage(), mode = "unified") {
  return `lobster-${prefix}:${page}:${mode}`;
}

export function parseStoredObject(raw) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function setNodeText(node, text) {
  if (node) {
    node.textContent = text;
  }
}

export function shellModeConfig(mode) {
  switch (mode) {
    case "user":
      return {
        eyebrow: "我和狗蛋儿的家 · 房间聊天",
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
        eyebrow: "我和狗蛋儿的家 · 管理后台",
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
        eyebrow: "我和狗蛋儿的家 · 城市外世界页",
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

export function translateShellMode(mode) {
  switch (mode) {
    case "user":
      return "房间聊天";
    case "admin":
      return "管理后台";
    default:
      return "城市外世界页";
  }
}

export function defaultIdentityForShellMode(mode) {
  switch (mode) {
    case "user":
      return "访客";
    case "admin":
      return "rsaga";
    default:
      return "builder";
  }
}

export function defaultWorkspaceForShellMode(_mode) {
  return "chat";
}

export function availableWorkspacesForShellMode(mode) {
  return mode === "user"
    ? ["chat"]
    : ["chat", "world", "auth", "governance"];
}

export function translateWorkspace(workspace) {
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

export function normalizeProviderConnectionState(state) {
  const normalized = String(state || "").trim().toLowerCase();
  if (normalized === "connected" || normalized === "online") return "Connected";
  if (normalized === "disconnected" || normalized === "offline") return "Disconnected";
  if (normalized === "connecting" || normalized === "syncing") return "Connecting";
  return "Unknown";
}

export function providerIndicatesGatewayOffline({
  providerLoaded = false,
  provider = {},
  providerState = normalizeProviderConnectionState(provider?.connection_state),
} = {}) {
  if (!providerLoaded) return false;
  if (provider?.reachable === false) return true;
  const localMemoryGateway = provider?.mode === "local-memory" && !provider?.base_url;
  return providerState === "Disconnected" && !localMemoryGateway;
}

export function translateProviderConnectionState(state) {
  switch (normalizeProviderConnectionState(state)) {
    case "Connected":
      return "已连接";
    case "Disconnected":
      return "已断开";
    case "Connecting":
      return "连线中";
    default:
      return "状态未知";
  }
}

export function translateDeliveryMode(mode) {
  switch (mode) {
    case "dev-inline-code":
      return "开发环境直出验证码";
    case "mailer-adapter-pending":
      return "邮件通道待接入";
    case "email":
      return "邮箱投递";
    case "inline-dev":
      return "开发环境直出验证码(手机)";
    case "sms-provider-pending":
      return "短信通道待接入";
    default:
      return "未知投递方式";
  }
}

export function initThemeToggle() {
  const toggle = document.querySelector(".theme-toggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    const body = document.body;
    const current = body.dataset.timeOfDay === "day" ? "day" : "night";
    const next = current === "day" ? "night" : "day";
    body.dataset.timeOfDay = next;
    safeLocalStorageSet("lobster-theme", next);
  });
  const saved = safeLocalStorageGet("lobster-theme");
  if (saved === "day" || saved === "night") {
    document.body.dataset.timeOfDay = saved;
  }
}
