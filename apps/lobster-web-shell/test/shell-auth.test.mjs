// shell-auth.test.mjs — auth module unit tests, including demo fallback flow
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  initAuth,
  enterDemoVerifyStep,
  verifyEmailOtp,
  requestEmailOtp,
  updateAuthFormState,
  getSessionToken,
  getAuthSession,
  setAuthStatus,
  clearSession,
} from "../shell-auth.js";

class FakeElement {
  constructor(tag = "div") {
    this.tagName = String(tag).toUpperCase();
    this.value = "";
    this.disabled = false;
    this.textContent = "";
    this._className = "";
    this._attributes = new Map();
    this.dataset = {};
    this._listeners = new Map();
    this.classList = {
      tokens: new Set(),
      toggle: function (token, force) {
        const has = this.tokens.has(token);
        if (force === true) { this.tokens.add(token); return true; }
        if (force === false) { this.tokens.delete(token); return false; }
        if (has) { this.tokens.delete(token); return false; }
        this.tokens.add(token); return true;
      },
    };
  }
  setAttribute(name, value) { this._attributes.set(name, String(value)); }
  getAttribute(name) { return this._attributes.get(name) ?? null; }
  addEventListener(type, handler) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(handler);
  }
  querySelector() { return null; }
}

function createFakeStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(String(key), String(value)); },
    removeItem: (key) => { map.delete(key); },
    clear: () => { map.clear(); },
  };
}

function createElMap() {
  return {
    statusEl: new FakeElement("div"),
    requestFormEl: new FakeElement("form"),
    deliverySelectEl: new FakeElement("select"),
    residentInputEl: new FakeElement("input"),
    nicknameInputEl: new FakeElement("input"),
    emailInputEl: new FakeElement("input"),
    mobileInputEl: new FakeElement("input"),
    deviceInputEl: new FakeElement("input"),
    verifyFormEl: new FakeElement("form"),
    challengeInputEl: new FakeElement("input"),
    codeInputEl: new FakeElement("input"),
    loginCardEl: new FakeElement("div"),
    loginOverlayEl: new FakeElement("div"),
    hudLoginToggleEl: new FakeElement("button"),
  };
}

describe("shell-auth demo fallback", () => {
  let storage;
  let refreshCalled;
  let persistedIdentity;
  let originalWindow;

  beforeEach(() => {
    storage = createFakeStorage();
    originalWindow = globalThis.window;
    globalThis.window = { localStorage: storage };
    refreshCalled = 0;
    persistedIdentity = null;
    clearSession();
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  function makeCallbacks() {
    return {
      postJson: async () => { throw new Error("no gateway"); },
      refreshFromGateway: async () => { refreshCalled += 1; },
      persistIdentity: (id) => { persistedIdentity = id; },
      userProjection: () => null,
      gatewayUrl: () => "",
      desiredResidentId: () => "demo-resident",
    };
  }

  test("enterDemoVerifyStep sets demo challenge and enables verify form", () => {
    initAuth(createElMap(), makeCallbacks());
    enterDemoVerifyStep("test@example.com");
    const session = getAuthSession();
    assert.equal(session.challengeId, "demo-challenge");
    assert.equal(session.maskedEmail, "test@example.com");
    assert.equal(session.deliveryMode, "email");
    assert.ok(session.expiresAtMs > Date.now());
    updateAuthFormState();
  });

  test("verifyEmailOtp in demo mode logs in without network call", async () => {
    const els = createElMap();
    initAuth(els, makeCallbacks());
    enterDemoVerifyStep("test@example.com");
    els.nicknameInputEl.value = "Demo User";
    els.codeInputEl.value = "123456";
    await verifyEmailOtp();
    assert.equal(getSessionToken(), "demo-session-token");
    assert.equal(storage.getItem("lobster-session-token"), "demo-session-token");
    assert.equal(els.residentInputEl.value, "demo-resident");
    assert.equal(getAuthSession().challengeId, null);
    assert.equal(els.codeInputEl.value, "");
    assert.equal(refreshCalled, 1);
  });

  test("verifyEmailOtp rejects empty code", async () => {
    const els = createElMap();
    initAuth(els, makeCallbacks());
    enterDemoVerifyStep("test@example.com");
    els.codeInputEl.value = "";
    assert.equal(els.codeInputEl.value, "");
    await verifyEmailOtp();
    assert.equal(getSessionToken(), null);
    assert.equal(refreshCalled, 0);
  });
});

describe("shell-auth setAuthStatus", () => {
  let originalWindow;

  beforeEach(() => {
    originalWindow = globalThis.window;
    globalThis.window = { localStorage: createFakeStorage() };
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  test("setAuthStatus writes message to status element", () => {
    const statusEl = new FakeElement("div");
    initAuth({ statusEl }, {
      postJson: async () => ({}),
      refreshFromGateway: async () => {},
      persistIdentity: () => {},
      userProjection: () => null,
      gatewayUrl: () => "http://localhost:8787",
    });
    setAuthStatus("ready");
    assert.equal(statusEl.textContent, "登录状态：ready");
  });
});

describe("shell-auth optional anti-abuse fields", () => {
  let originalWindow;

  beforeEach(() => {
    originalWindow = globalThis.window;
    globalThis.window = { localStorage: createFakeStorage() };
    clearSession();
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  test("requestEmailOtp tolerates pages without mobile and device inputs", async () => {
    const els = createElMap();
    els.mobileInputEl = null;
    els.deviceInputEl = null;
    els.emailInputEl.value = "tester@example.com";
    const posts = [];

    initAuth(els, {
      postJson: async (path, body) => {
        posts.push({ path, body });
        if (path === "/v1/auth/preflight") {
          return { allowed: true, normalized_email: "tester@example.com", blocked_reasons: [] };
        }
        return {
          challenge_id: "email-otp:tester",
          masked_email: "t***@example.com",
          expires_at_ms: Date.now() + 300000,
          delivery_mode: "email",
        };
      },
      refreshFromGateway: async () => {},
      persistIdentity: () => {},
      userProjection: () => null,
      gatewayUrl: () => "http://127.0.0.1:8787",
    });

    await requestEmailOtp();

    assert.deepEqual(posts.map((entry) => entry.path), [
      "/v1/auth/preflight",
      "/v1/auth/email-otp/request",
    ]);
    assert.equal(posts[0].body.email, "tester@example.com");
    assert.equal(Object.hasOwn(posts[0].body, "mobile"), false);
    assert.equal(Object.hasOwn(posts[0].body, "device_physical_address"), false);
  });
});
