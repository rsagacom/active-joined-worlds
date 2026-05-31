export function normalizedMessageText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function messageMatchesPendingEcho(message, pending) {
  if (!message || !pending) return false;
  return (
    normalizedMessageText(message.sender) === normalizedMessageText(pending.sender) &&
    normalizedMessageText(message.text) === normalizedMessageText(pending.text) &&
    normalizedMessageText(message.quick_action) === normalizedMessageText(pending.quick_action)
  );
}

export function messageIsDeliveredCopyOfPending(message, pending) {
  if (!message || !pending) return false;
  return (
    message.delivery_status === "delivered" &&
    normalizedMessageText(message.sender) === normalizedMessageText(pending.sender) &&
    normalizedMessageText(message.text) === normalizedMessageText(pending.text)
  );
}

export function visiblePendingEchoesForRoomData(room, pendingEchoes) {
  if (!room?.id) return [];
  const committed = Array.isArray(room.messages) ? room.messages : [];
  const pendingList = Array.isArray(pendingEchoes) ? pendingEchoes : [];
  return pendingList.filter(
    (pending) =>
      pending.failed ||
      !committed.some(
        (message) =>
          messageMatchesPendingEcho(message, pending) ||
          messageIsDeliveredCopyOfPending(message, pending),
      ),
  );
}
