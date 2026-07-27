import test from "node:test";
import assert from "node:assert/strict";

import { computeComposerAvailability } from "../composer-state.js";

test("no active room keeps composer editable but not sendable", () => {
  const state = computeComposerAvailability({
    hasActiveRoom: false,
    hasDraftText: true,
    isSendingMessage: false,
    hasGateway: false,
    hasIdentity: true,
  });

  assert.equal(state.canDraft, true);
  assert.equal(state.canSend, false);
  assert.equal(state.draftState, "select-room");
});

test("active room with draft can send", () => {
  const state = computeComposerAvailability({
    hasActiveRoom: true,
    hasDraftText: true,
    isSendingMessage: false,
    hasGateway: true,
    hasIdentity: true,
  });

  assert.equal(state.canDraft, true);
  assert.equal(state.canLiveSend, true);
  assert.equal(state.canSend, true);
  assert.equal(state.draftState, "ready");
});

test("sending locks the composer", () => {
  const state = computeComposerAvailability({
    hasActiveRoom: true,
    hasDraftText: true,
    isSendingMessage: true,
    hasGateway: true,
    hasIdentity: true,
  });

  assert.equal(state.canDraft, false);
  assert.equal(state.canSend, false);
  assert.equal(state.draftState, "sending");
});

test("gateway resident mode requires a non-visitor identity before drafting", () => {
  const state = computeComposerAvailability({
    hasActiveRoom: true,
    hasDraftText: true,
    isSendingMessage: false,
    hasGateway: true,
    hasIdentity: false,
    requiresIdentity: true,
  });

  assert.equal(state.canDraft, false);
  assert.equal(state.canLiveSend, false);
  assert.equal(state.canSend, false);
  assert.equal(state.draftState, "login-required");
});

test("gateway resident mode requires a live session even when a query identity is present", () => {
  const state = computeComposerAvailability({
    hasActiveRoom: true,
    hasDraftText: true,
    isSendingMessage: false,
    hasGateway: true,
    hasGatewaySession: false,
    hasIdentity: true,
    requiresIdentity: true,
  });

  assert.equal(state.canDraft, false);
  assert.equal(state.canLiveSend, false);
  assert.equal(state.canSend, false);
  assert.equal(state.draftState, "login-required");
});

test("local QA synthetic identity can send without a real session", () => {
  const state = computeComposerAvailability({
    hasActiveRoom: true,
    hasDraftText: true,
    isSendingMessage: false,
    hasGateway: true,
    hasGatewaySession: false,
    hasIdentity: true,
    requiresIdentity: true,
    allowSyntheticIdentity: true,
  });

  assert.equal(state.canDraft, true);
  assert.equal(state.canLiveSend, true);
  assert.equal(state.canSend, true);
  assert.equal(state.draftState, "ready");
});

test("gateway offline state locks drafting and sending", () => {
  const state = computeComposerAvailability({
    hasActiveRoom: true,
    hasDraftText: true,
    isSendingMessage: false,
    hasGateway: true,
    hasIdentity: true,
    gatewayUnavailable: true,
  });

  assert.equal(state.canDraft, false);
  assert.equal(state.canLiveSend, false);
  assert.equal(state.canSend, false);
  assert.equal(state.draftState, "offline");
});
