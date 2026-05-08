export function computeComposerAvailability({
  hasActiveRoom = false,
  hasDraftText = false,
  isSendingMessage = false,
  hasGateway = false,
  hasIdentity = false,
  requiresIdentity = false,
} = {}) {
  const identityRequiredButMissing = Boolean(requiresIdentity && hasGateway && !hasIdentity);
  const canDraft = !isSendingMessage && !identityRequiredButMissing;
  const canLiveSend = Boolean(hasGateway && hasActiveRoom && hasIdentity);
  const canSend = Boolean(canDraft && hasActiveRoom && hasDraftText);

  let draftState = "empty";
  if (isSendingMessage) {
    draftState = "sending";
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
