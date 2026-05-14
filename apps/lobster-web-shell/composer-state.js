export function computeComposerAvailability({
  hasActiveRoom = false,
  hasDraftText = false,
  isSendingMessage = false,
  hasGateway = false,
  hasIdentity = false,
  requiresIdentity = false,
  gatewayUnavailable = false,
} = {}) {
  const gatewayOffline = Boolean(hasGateway && gatewayUnavailable);
  const identityRequiredButMissing = Boolean(requiresIdentity && hasGateway && !hasIdentity);
  const canDraft = !isSendingMessage && !identityRequiredButMissing && !gatewayOffline;
  const canLiveSend = Boolean(hasGateway && !gatewayOffline && hasActiveRoom && hasIdentity);
  const canSend = Boolean(canDraft && hasActiveRoom && hasDraftText);

  let draftState = "empty";
  if (isSendingMessage) {
    draftState = "sending";
  } else if (gatewayOffline) {
    draftState = "offline";
  } else if (identityRequiredButMissing) {
    draftState = "login-required";
  } else if (!hasActiveRoom) {
    draftState = "select-room";
  } else if (hasDraftText) {
    draftState = "ready";
  }

  return {
    canDraft,
    canLiveSend,
    canSend,
    draftState,
  };
}
