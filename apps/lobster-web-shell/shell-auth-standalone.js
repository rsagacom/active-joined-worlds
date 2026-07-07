import {
  initAuth,
  loadAuthDraft,
  persistAuthDraft,
  requestEmailOtp,
  setAuthStatus,
  updateAuthFormState,
  verifyEmailOtp,
} from "./shell-auth.js";
import { gatewayErrorMessage, localizedRuntimeError } from "./shell-errors.js";

function byId(id) {
  return document.getElementById(id);
}

function resolveGatewayUrl(gatewayUrl) {
  if (typeof gatewayUrl === "function") return gatewayUrl;
  const value = gatewayUrl ?? new URLSearchParams(window.location.search).get("gateway") ?? "";
  return () => value;
}

async function postGatewayJson(gatewayUrl, path, body) {
  if (!gatewayUrl) throw new Error("gateway not connected");
  const response = await fetch(gatewayUrl.replace(/\/+$/, "") + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let parsed = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }
  }
  if (!response.ok) {
    throw new Error(gatewayErrorMessage(parsed, text, response.status));
  }
  return parsed;
}

function openLoginOverlay(els) {
  els.loginOverlayEl?.classList.remove("shell-hidden");
  els.loginOverlayEl?.setAttribute("aria-hidden", "false");
}

function closeLoginOverlay(els) {
  els.loginOverlayEl?.classList.add("shell-hidden");
  els.loginOverlayEl?.setAttribute("aria-hidden", "true");
}

export function initStandaloneAuthSurface(options = {}) {
  const gatewayUrl = resolveGatewayUrl(options.gatewayUrl);
  const els = {
    statusEl: byId("auth-status"),
    requestFormEl: byId("auth-request-form"),
    deliverySelectEl: byId("auth-delivery-select"),
    residentInputEl: byId("auth-resident-input"),
    nicknameInputEl: byId("auth-nickname-input"),
    emailInputEl: byId("auth-email-input"),
    mobileInputEl: byId("auth-mobile-input"),
    deviceInputEl: byId("auth-device-input"),
    verifyFormEl: byId("auth-verify-form"),
    challengeInputEl: byId("auth-challenge-input"),
    codeInputEl: byId("auth-code-input"),
    loginCardEl: byId("resident-login-card"),
    loginOverlayEl: byId("resident-login-overlay"),
    hudLoginToggleEl: byId("hud-login-toggle"),
  };

  initAuth(els, {
    gatewayUrl,
    postJson: options.postJson || ((path, body) => postGatewayJson(gatewayUrl(), path, body)),
    refreshFromGateway: options.refreshFromGateway || (async () => {}),
    persistIdentity: (id) => {
      try {
        localStorage.setItem(options.identityStorageKey || "lobster-identity", id);
      } catch {}
      options.onIdentityChanged?.(id);
    },
    userProjection: options.userProjection || (() => null),
    desiredResidentId: options.desiredResidentId || (() => undefined),
  });

  loadAuthDraft();
  updateAuthFormState();

  els.requestFormEl?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = els.requestFormEl.querySelector("button");
    if (button) button.disabled = true;
    persistAuthDraft();
    try {
      await requestEmailOtp();
    } catch (error) {
      setAuthStatus(localizedRuntimeError(error, "申请验证码失败"), true);
    } finally {
      updateAuthFormState();
    }
  });

  els.verifyFormEl?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = els.verifyFormEl.querySelector("button");
    if (button) button.disabled = true;
    persistAuthDraft();
    try {
      await verifyEmailOtp();
      closeLoginOverlay(els);
    } catch (error) {
      setAuthStatus(localizedRuntimeError(error, "验证码校验失败"), true);
    } finally {
      updateAuthFormState();
    }
  });

  els.hudLoginToggleEl?.addEventListener("click", () => {
    openLoginOverlay(els);
  });
  byId("resident-login-close")?.addEventListener("click", () => {
    closeLoginOverlay(els);
  });

  return {
    els,
    gatewayUrl,
    open: () => openLoginOverlay(els),
    close: () => closeLoginOverlay(els),
    refresh: updateAuthFormState,
  };
}
