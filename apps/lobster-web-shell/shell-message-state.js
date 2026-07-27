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

export function createPendingMessageEchoStore({
  getIdentity = () => "",
  now = Date.now,
  random = Math.random,
  formatTimestamp = (date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
} = {}) {
  const readIdentity = typeof getIdentity === "function" ? getIdentity : () => "";
  const readNow = typeof now === "function" ? now : Date.now;
  const readRandom = typeof random === "function" ? random : Math.random;
  const renderTimestamp = typeof formatTimestamp === "function"
    ? formatTimestamp
    : (date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  let echoesByRoom = {};

  function forRoom(roomId) {
    return Array.isArray(echoesByRoom?.[roomId]) ? [...echoesByRoom[roomId]] : [];
  }

  function snapshot() {
    return Object.fromEntries(
      Object.entries(echoesByRoom).map(([roomId, echoes]) => [roomId, [...echoes]]),
    );
  }

  function enqueue(roomId, text, quickAction = "") {
    const timestampMs = readNow();
    const echo = {
      id: `pending:${timestampMs}:${readRandom().toString(16).slice(2, 8)}`,
      sender: readIdentity(),
      timestamp: renderTimestamp(new Date(timestampMs)),
      text,
      quick_action: quickAction,
      pending: true,
      failed: false,
    };
    echoesByRoom[roomId] = [...forRoom(roomId), echo];
    return echo.id;
  }

  function markFailed(roomId, echoId, failed) {
    const current = forRoom(roomId);
    if (!current.length) return;
    echoesByRoom[roomId] = current.map((item) => (
      item.id === echoId ? { ...item, failed } : item
    ));
  }

  function remove(roomId, echoId) {
    const remaining = forRoom(roomId).filter((item) => item.id !== echoId);
    if (remaining.length) {
      echoesByRoom[roomId] = remaining;
    } else {
      delete echoesByRoom[roomId];
    }
  }

  function clearRoom(roomId) {
    delete echoesByRoom[roomId];
  }

  function clearAll() {
    echoesByRoom = {};
  }

  return {
    forRoom,
    snapshot,
    enqueue,
    markFailed,
    remove,
    clearRoom,
    clearAll,
  };
}
