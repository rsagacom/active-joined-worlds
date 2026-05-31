export function caretakerProfile(room) {
  if (!room || !room.caretaker || typeof room.caretaker !== "object") return null;
  return room.caretaker;
}

export function detailCardProfile(room) {
  if (!room || !room.detail_card || typeof room.detail_card !== "object") return null;
  return room.detail_card;
}

export function stageProjection(room) {
  if (!room || !room.stage_projection || typeof room.stage_projection !== "object") return null;
  return room.stage_projection;
}

export function portraitProjection(room) {
  if (!room || !room.portrait_projection || typeof room.portrait_projection !== "object") return null;
  return room.portrait_projection;
}

export function workflowProfile(room) {
  if (!room || !room.workflow || typeof room.workflow !== "object") return null;
  return room.workflow;
}

export function inlineActionProfiles(room) {
  return Array.isArray(room?.inline_actions) ? room.inline_actions.filter(Boolean) : [];
}

export function inlineActionProfile(room, role) {
  return inlineActionProfiles(room).find((item) => item?.role === role) || null;
}

export function caretakerPendingCount(room) {
  const caretaker = caretakerProfile(room);
  if (!caretaker) return 0;
  return Number(caretaker.pending_visitors || caretaker.messages?.length || 0) || 0;
}

export function caretakerNotificationCount(room) {
  const caretaker = caretakerProfile(room);
  if (!caretaker) return 0;
  return Array.isArray(caretaker.notifications) ? caretaker.notifications.length : 0;
}

export function caretakerStatusLine(room) {
  const caretaker = caretakerProfile(room);
  if (!caretaker) return "未植入";
  const patrol = caretaker.patrol || {};
  const parts = [caretaker.status, patrol.mode, patrol.last_check].filter(Boolean);
  return parts.length ? parts.join(" · ") : "在线值守";
}
