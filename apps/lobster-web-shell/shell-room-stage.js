import { joinOrFallback } from "./shell-payload.js";

export function roomStageSummaryForState({
  room = null,
  stage = null,
  caretaker = null,
  contextSummary = "",
} = {}) {
  if (!room) return "先选一个会话，房间场景会自动接上。";
  if (stage?.summary) return stage.summary;
  if (caretaker?.auto_reply) {
    return `${contextSummary} · ${caretaker.auto_reply}`;
  }
  return contextSummary;
}

export function roomStagePortraitSummaryForState({
  room = null,
  portrait = null,
  caretaker = null,
  contextSummary = "",
} = {}) {
  if (!room) return "先从左侧选会话，角色资料会跟着出现。";
  if (portrait?.summary) return portrait.summary;
  if (caretaker) {
    return joinOrFallback(
      [
        `${caretaker.name} · ${caretaker.role_label || "房间管家"}`,
        caretaker.persona,
        caretaker.memory,
        caretaker.auto_reply,
      ],
      contextSummary,
    );
  }
  return joinOrFallback(
    [room.participant_label, room.overview_summary, room.preview_text, room.subtitle],
    contextSummary,
  );
}

export function roomStagePortraitTitleForState({
  room = null,
  portrait = null,
  caretaker = null,
  fallbackTitle = "人物",
} = {}) {
  return portrait?.title || caretaker?.name || room?.participant_label || fallbackTitle;
}

export function roomStagePortraitChipsForState({
  room = null,
  portrait = null,
  caretaker = null,
  badgeText = "",
  audienceLabel = "",
  memberCount = 0,
  pendingCount = 0,
} = {}) {
  if (!room) {
    return [{ text: "等待选中会话", tone: "muted" }];
  }
  const primaryBadge = badgeText || portrait?.badge || room.scene_banner || "";
  const chips = [
    {
      text: primaryBadge,
      tone: "warm",
    },
    {
      text: audienceLabel,
      tone: "muted",
    },
    {
      text: `${memberCount} 人`,
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
    if (pendingCount > 0) {
      chips.push({
        text: `${pendingCount} 条访客提醒`,
        tone: "warm",
      });
    }
  }
  return chips;
}

export function userRoomProjectionForState({
  room = null,
  visual = null,
  fallback = {},
  detailCard = null,
  caretaker = null,
} = {}) {
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
