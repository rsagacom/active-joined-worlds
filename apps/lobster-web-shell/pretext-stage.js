import { layoutWithLines, prepareWithSegments } from "./node_modules/@chenglou/pretext/dist/layout.js";

const REFERENCE_WIDTH = 800;
const REFERENCE_TITLE_SIZE = 22;
const REFERENCE_BODY_SIZE = 14;
const REFERENCE_BADGE_SIZE = 12;
const REFERENCE_LINE_HEIGHT_TITLE = 30;
const REFERENCE_LINE_HEIGHT_BODY = 22;
const REFERENCE_PORTRAIT_LINE_HEIGHT_TITLE = 28;
const REFERENCE_PORTRAIT_LINE_HEIGHT_BODY = 20;
const REFERENCE_MIN_STAGE_HEIGHT = 180;
const REFERENCE_MIN_PORTRAIT_HEIGHT = 252;

function scaleForWidth(width) {
  return Math.max(0.65, width / REFERENCE_WIDTH);
}

function scaledPx(base, width) {
  return Math.max(Math.round(base * 0.65), Math.round(base * scaleForWidth(width)));
}

function makeFonts(width) {
  const titleSize = scaledPx(REFERENCE_TITLE_SIZE, width);
  const bodySize = scaledPx(REFERENCE_BODY_SIZE, width);
  const badgeSize = scaledPx(REFERENCE_BADGE_SIZE, width);
  return {
    titleFont: `700 ${titleSize}px "Noto Serif SC", "Microsoft YaHei", serif`,
    bodyFont: `500 ${bodySize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`,
    badgeFont: `700 ${badgeSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`,
    lineHeightTitle: scaledPx(REFERENCE_LINE_HEIGHT_TITLE, width),
    lineHeightBody: scaledPx(REFERENCE_LINE_HEIGHT_BODY, width),
    portraitLineHeightTitle: scaledPx(REFERENCE_PORTRAIT_LINE_HEIGHT_TITLE, width),
    portraitLineHeightBody: scaledPx(REFERENCE_PORTRAIT_LINE_HEIGHT_BODY, width),
    titleSize,
    bodySize,
    badgeSize,
  };
}

const PANEL_THEMES = {
  stage: {
    city: {
      kicker: "城市 / 公共频道",
      background: "#1b212f",
      accent: "#d2b36f",
      panel: "rgba(22, 28, 41, 0.94)",
      border: "rgba(210, 179, 111, 0.28)",
      title: "#f8f1de",
      body: "rgba(247, 238, 217, 0.84)",
    },
    home: {
      kicker: "住宅 / 私聊",
      background: "#2a1e17",
      accent: "#d38d4c",
      panel: "rgba(43, 28, 20, 0.95)",
      border: "rgba(211, 141, 76, 0.32)",
      title: "#f7ead7",
      body: "rgba(246, 231, 210, 0.82)",
    },
  },
  portrait: {
    city: {
      kicker: "人物 / 头像",
      background: "#18202c",
      accent: "#8fb7da",
      panel: "rgba(18, 25, 38, 0.96)",
      border: "rgba(143, 183, 218, 0.3)",
      title: "#eef6ff",
      body: "rgba(225, 234, 244, 0.84)",
    },
    home: {
      kicker: "人物 / 头像",
      background: "#271b18",
      accent: "#d6a57f",
      panel: "rgba(35, 24, 22, 0.96)",
      border: "rgba(214, 165, 127, 0.32)",
      title: "#fff0e5",
      body: "rgba(246, 227, 213, 0.84)",
    },
  },
};

function normalizeText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function firstText(...values) {
  for (const value of values) {
    const text = normalizeText(value);
    if (text) return text;
  }
  return "";
}

function normalizePortraitInput(portrait) {
  if (!portrait) return null;
  if (typeof portrait === "string") {
    return { summary: portrait };
  }
  if (typeof portrait === "object") {
    return portrait;
  }
  return null;
}

function firstGlyph(value) {
  const text = normalizeText(value);
  if (!text) return "·";
  const latin = text.match(/[A-Za-z0-9]/);
  if (latin) return latin[0].toUpperCase();
  return Array.from(text)[0];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roomSignalCount(room, portrait) {
  const caretaker = room?.caretaker;
  const explicit = Number(
    portrait?.signalCount
      || caretaker?.pending_visitors
      || caretaker?.notifications?.length
      || caretaker?.messages?.length
      || room?.member_count
      || 1,
  );
  return clamp(Number.isFinite(explicit) ? explicit : 1, 1, 4);
}

function stageThemeForVariant(variant) {
  return PANEL_THEMES.stage[variant] || PANEL_THEMES.stage.city;
}

function portraitThemeForVariant(variant) {
  return PANEL_THEMES.portrait[variant] || PANEL_THEMES.portrait.city;
}

export function stageVariantForRoom(room) {
  if (!room || typeof room.id !== "string") return "city";
  return room.id.startsWith("dm:") ? "home" : "city";
}

function buildStageSummary(room, summary, variant) {
  const text = firstText(
    room?.stage_projection?.summary,
    summary,
    room?.scene_summary,
    room?.stage_summary,
    room?.summary,
    room?.description,
  );
  if (text) return text;
  return variant === "home"
    ? "回到住处后继续一对一交谈。"
    : "公告、闲聊和跨城讨论会先落在这里。";
}

function buildStageTitle(room) {
  return firstText(room?.stage_projection?.title, room?.title, room?.name, "当前会话");
}

function buildPortraitTitle(room, portrait) {
  return firstText(
    room?.portrait_projection?.title,
    portrait?.title,
    portrait?.name,
    portrait?.label,
    room?.portrait_name,
    room?.portrait_label,
    room?.speaker_name,
    room?.character_name,
    room?.title,
    "人物",
  );
}

function buildPortraitSummary(room, portrait, variant) {
  const text = firstText(
    room?.portrait_projection?.summary,
    portrait?.summary,
    portrait?.bio,
    portrait?.description,
    room?.portrait_summary,
    room?.portrait_bio,
    room?.scene_summary,
    room?.summary,
  );
  if (text) return text;
  return variant === "home"
    ? "头像和人设会先并排保留，方便 user 壳继续补全。"
    : "头像和人设会先并排保留，方便 user 壳继续补全。";
}

function buildStageVisual(room, variant) {
  return {
    motif: variant === "home" ? "courtyard" : "watchtower",
    badge: firstText(
      room?.stage_projection?.badge,
      room?.scene_banner,
      room?.meta,
      variant === "home" ? "住宅 / 私聊" : "城市 / 公共频道",
    ),
    signalCount: roomSignalCount(room),
  };
}

function buildPortraitVisual(room, portrait, variant) {
  const subject = buildPortraitTitle(room, portrait);
  return {
    motif: variant === "home" ? "caretaker" : "sentinel",
    monogram: firstText(room?.portrait_projection?.monogram, portrait?.monogram) || firstGlyph(subject),
    badge: firstText(
      room?.portrait_projection?.badge,
      portrait?.badge,
      portrait?.role,
      room?.caretaker?.role_label,
      room?.scene_banner,
      variant === "home" ? "房间管家" : "频道巡视",
    ),
    status: firstText(
      room?.portrait_projection?.status,
      portrait?.status,
      room?.caretaker?.status,
      room?.meta,
      variant === "home" ? "房内连线" : "频道巡视",
    ),
    signalCount: roomSignalCount(room, portrait),
  };
}

function buildPanelTextModel(kind, room, body) {
  const variant = stageVariantForRoom(room);
  const theme = kind === "portrait"
    ? portraitThemeForVariant(variant)
    : stageThemeForVariant(variant);
  const portrait = kind === "portrait" ? normalizePortraitInput(body) : null;
  const title = kind === "portrait"
    ? buildPortraitTitle(room, portrait)
    : buildStageTitle(room);
  const summary = kind === "portrait"
    ? buildPortraitSummary(room, portrait, variant)
    : buildStageSummary(room, body, variant);
  const visual = kind === "portrait"
    ? buildPortraitVisual(room, portrait, variant)
    : buildStageVisual(room, variant);

  return {
    kind,
    variant,
    kicker: theme.kicker,
    title,
    summary,
    theme,
    visual,
  };
}

export function buildStageTextModel(room, summary) {
  return buildPanelTextModel("stage", room, summary);
}

export function buildPortraitTextModel(room, portrait) {
  return buildPanelTextModel("portrait", room, portrait);
}

export function buildRoomVisualModel(room, summary, portrait) {
  return {
    roomId: typeof room?.id === "string" ? room.id : null,
    stage: buildStageTextModel(room, summary),
    portrait: buildPortraitTextModel(room, portrait),
  };
}

function measureTextWidth(context, font, text) {
  if (!text) return 0;
  const previousFont = context.font;
  if (font) context.font = font;
  let width = 0;
  if (typeof context.measureText === "function") {
    width = context.measureText(text).width;
  } else {
    width = text.length * 8;
  }
  if (previousFont) {
    context.font = previousFont;
  }
  return width;
}

function drawSignalDots(context, {
  count,
  x,
  y,
  spacing = 12,
  radius = 3,
  fillStyle,
}) {
  if (!count || typeof context.beginPath !== "function") return;
  context.fillStyle = fillStyle;
  for (let index = 0; index < count; index += 1) {
    context.beginPath();
    context.arc?.(x + index * spacing, y, radius, 0, Math.PI * 2);
    context.fill?.();
  }
}

function drawStageBackdrop(context, width, height, theme, model) {
  const visual = model.visual || {};
  const textPanelWidth = Math.max(180, Math.min(width * 0.56, width - 124));
  const horizonY = Math.round(height * 0.66);

  context.fillStyle = theme.background;
  context.fillRect?.(0, 0, width, height);

  context.fillStyle = theme.panel;
  context.fillRect?.(14, 12, textPanelWidth, height - 24);

  context.fillStyle = theme.accent;
  context.fillRect?.(14, 12, 6, height - 24);

  context.fillStyle = theme.border;
  context.fillRect?.(textPanelWidth + 18, horizonY - 2, width - textPanelWidth - 32, 2);

  context.fillStyle = theme.panel;
  if (visual.motif === "courtyard") {
    context.fillRect?.(width - 130, horizonY - 34, 84, 52);
    context.fillRect?.(width - 98, horizonY - 56, 28, 22);
    context.fillStyle = theme.accent;
    context.fillRect?.(width - 116, horizonY - 18, 12, 12);
    context.fillRect?.(width - 92, horizonY - 18, 12, 12);
    context.fillRect?.(width - 68, horizonY - 18, 12, 12);
    if (typeof context.beginPath === "function") {
      context.fillStyle = theme.accent;
      context.beginPath();
      context.arc?.(width - 38, horizonY - 42, 10, 0, Math.PI * 2);
      context.fill?.();
    }
  } else {
    context.fillRect?.(width - 144, horizonY - 66, 30, 82);
    context.fillRect?.(width - 104, horizonY - 50, 38, 66);
    context.fillRect?.(width - 56, horizonY - 40, 28, 56);
    context.fillStyle = theme.accent;
    context.fillRect?.(width - 136, horizonY - 56, 10, 10);
    context.fillRect?.(width - 96, horizonY - 40, 10, 10);
    context.fillRect?.(width - 84, horizonY - 40, 10, 10);
    context.fillRect?.(width - 48, horizonY - 28, 10, 10);
    if (typeof context.beginPath === "function") {
      context.fillStyle = theme.accent;
      context.beginPath();
      context.arc?.(width - 34, 30, 12, 0, Math.PI * 2);
      context.fill?.();
    }
  }

  if (visual.badge) {
    const badgeWidth = Math.max(72, Math.ceil(measureTextWidth(context, theme.badgeFont, visual.badge) + 18));
    const badgeX = Math.max(textPanelWidth + 26, width - badgeWidth - 18);
    context.fillStyle = theme.accent;
    context.fillRect?.(badgeX, 18, badgeWidth, 22);
    context.fillStyle = theme.background;
    context.font = theme.badgeFont;
    context.fillText?.(visual.badge, badgeX + 9, 33);
  }

  drawSignalDots(context, {
    count: visual.signalCount,
    x: textPanelWidth + 32,
    y: height - 24,
    fillStyle: theme.accent,
  });

  return {
    contentX: 32,
    contentY: 30,
    contentWidth: Math.max(120, textPanelWidth - 36),
  };
}

function drawPortraitBackdrop(context, width, height, theme, model) {
  const visual = model.visual || {};
  const haloRadius = Math.min(56, Math.round(width * 0.22));
  const haloX = Math.round(width / 2);
  const haloY = 78;

  context.fillStyle = theme.background;
  context.fillRect?.(0, 0, width, height);
  context.fillStyle = theme.panel;
  context.fillRect?.(14, 12, width - 28, height - 24);
  context.fillStyle = theme.accent;
  context.fillRect?.(14, 12, width - 28, 8);

  if (typeof context.beginPath === "function") {
    context.fillStyle = theme.border;
    context.beginPath();
    context.arc?.(haloX, haloY, haloRadius + 18, 0, Math.PI * 2);
    context.fill?.();

    context.fillStyle = theme.accent;
    context.beginPath();
    context.arc?.(haloX, haloY, haloRadius, 0, Math.PI * 2);
    context.fill?.();

    context.fillStyle = theme.panel;
    context.beginPath();
    context.arc?.(haloX, haloY + 52, haloRadius + 22, Math.PI, 0);
    context.fill?.();
  }

  const monogramSize = Math.max(24, Math.round(width * 0.12));
  context.fillStyle = theme.background;
  context.font = `700 ${monogramSize}px "Noto Serif SC", "Microsoft YaHei", serif`;
  context.fillText?.(visual.monogram || "·", haloX - 14, haloY + 14);

  if (visual.badge) {
    const badgeWidth = Math.max(76, Math.ceil(measureTextWidth(context, theme.badgeFont, visual.badge) + 20));
    const badgeX = Math.round((width - badgeWidth) / 2);
    context.fillStyle = theme.accent;
    context.fillRect?.(badgeX, 150, badgeWidth, 22);
    context.fillStyle = theme.background;
    context.font = theme.badgeFont;
    context.fillText?.(visual.badge, badgeX + 10, 165);
  }

  if (visual.status) {
    context.fillStyle = theme.body;
    context.font = theme.badgeFont;
    context.fillText?.(visual.status, 20, 192);
  }

  drawSignalDots(context, {
    count: visual.signalCount,
    x: width - 22 - (Math.max(0, visual.signalCount - 1) * 12),
    y: 34,
    fillStyle: theme.accent,
  });

  return {
    contentX: 20,
    contentY: 206,
    contentWidth: Math.max(120, width - 40),
  };
}

function renderPanelCanvas(canvas, model, deps = {}) {
  if (!canvas || !model) return false;
  const context = canvas.getContext?.("2d");
  if (!context) return false;

  const prepare = deps.prepareWithSegments || prepareWithSegments;
  const layout = deps.layoutWithLines || layoutWithLines;
  const devicePixelRatio = Number(deps.devicePixelRatio || globalThis.devicePixelRatio || 1);
  const width = Math.max(
    240,
    Number(canvas.clientWidth) || Number(canvas.width) || 360,
  );
  const fonts = makeFonts(width);
  const baseTheme = model.theme || (model.kind === "portrait"
    ? portraitThemeForVariant(model.variant)
    : stageThemeForVariant(model.variant));
  const theme = {
    ...baseTheme,
    titleFont: fonts.titleFont,
    bodyFont: fonts.bodyFont,
    badgeFont: fonts.badgeFont,
    lineHeightTitle: model.kind === "portrait" ? fonts.portraitLineHeightTitle : fonts.lineHeightTitle,
    lineHeightBody: model.kind === "portrait" ? fonts.portraitLineHeightBody : fonts.lineHeightBody,
  };
  const bodyGap = 12;
  const layoutBox = model.kind === "portrait"
    ? { contentX: 20, contentY: 206, contentWidth: Math.max(120, width - 40) }
    : { contentX: 32, contentY: 30, contentWidth: Math.max(120, Math.min(width * 0.56, width - 124) - 36) };
  const titleLayout = layout(
    prepare(model.title, theme.titleFont),
    layoutBox.contentWidth,
    theme.lineHeightTitle,
  );
  const bodyLayout = layout(
    prepare(model.summary, theme.bodyFont),
    layoutBox.contentWidth,
    theme.lineHeightBody,
  );

  const minHeight = model.kind === "portrait"
    ? scaledPx(REFERENCE_MIN_PORTRAIT_HEIGHT, width)
    : scaledPx(REFERENCE_MIN_STAGE_HEIGHT, width);
  const height = Math.max(
    minHeight,
    Math.ceil(layoutBox.contentY + titleLayout.height + bodyGap + bodyLayout.height + 24),
  );
  canvas.width = Math.round(width * devicePixelRatio);
  canvas.height = Math.round(height * devicePixelRatio);
  if (canvas.style) {
    canvas.style.height = `${height}px`;
  }

  if (typeof context.setTransform === "function") {
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  } else if (typeof context.scale === "function") {
    context.scale(devicePixelRatio, devicePixelRatio);
  }

  context.clearRect?.(0, 0, width, height);

  const drawnLayout = model.kind === "portrait"
    ? drawPortraitBackdrop(context, width, height, theme, model)
    : drawStageBackdrop(context, width, height, theme, model);

  let y = drawnLayout.contentY;
  context.fillStyle = theme.title;
  context.font = theme.titleFont;
  for (const line of titleLayout.lines) {
    context.fillText?.(line.text, drawnLayout.contentX, y);
    y += theme.lineHeightTitle;
  }

  y += bodyGap;
  context.fillStyle = theme.body;
  context.font = theme.bodyFont;
  for (const line of bodyLayout.lines) {
    context.fillText?.(line.text, drawnLayout.contentX, y);
    y += theme.lineHeightBody;
  }

  if (canvas.dataset) {
    canvas.dataset.variant = model.variant;
    canvas.dataset.kind = model.kind || "stage";
    if (model.visual?.motif) canvas.dataset.motif = model.visual.motif;
    if (model.visual?.monogram) canvas.dataset.monogram = model.visual.monogram;
  }
  return true;
}

export function renderStageCanvas(canvas, model, deps = {}) {
  return renderPanelCanvas(canvas, model, deps);
}

export function renderPortraitCanvas(canvas, model, deps = {}) {
  return renderPanelCanvas(canvas, model, deps);
}
