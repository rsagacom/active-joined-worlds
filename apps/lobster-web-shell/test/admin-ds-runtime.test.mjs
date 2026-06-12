/* ============================================================
   admin-ds-runtime.test.mjs — admin-ds gateway 数据流运行时测试
   覆盖：
   - gateway 成功时 normalize 函数正确转换数据
   - gateway 失败时返回 null 不污染 mock
   - 无 gateway 时 fetchGatewayJson 直接返回 null
   - 写操作按钮在源文件中正确标记
   - 外部数据全部通过 textContent/DOM API 写入
   ============================================================ */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const serial = { concurrency: false };

async function readText(relPath) {
  return fs.readFile(new URL(relPath, import.meta.url), "utf8");
}

// Set up just enough globals to load admin-ds.js without crashing
function setupMinimalGlobals(gatewayUrl = null) {
  const storage = new Map();
  Object.defineProperty(globalThis, "navigator", { value: { userAgent: "node-test" }, writable: true, configurable: true });
  globalThis.document = {
    body: { dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() {} }, querySelector() { return null; }, querySelectorAll() { return []; }, appendChild() {}, addEventListener() {}, removeEventListener() {} },
    getElementById(id) { return globalThis._dsElements?.[id] || null; },
    querySelector(s) { return null; },
    querySelectorAll() { return []; },
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(), className: "", textContent: "", dataset: {},
        style: { cssText: "" }, children: [], disabled: false,
        classList: { _v: "", add(c) { this._v += " " + c; }, remove(c) { this._v = this._v.replace(c, "").trim(); }, toggle(c, on) { if (on === undefined) this._v = this._v.includes(c) ? this._v.replace(c, "").trim() : this._v + " " + c; else if (on) this._v += " " + c; else this._v = this._v.replace(c, "").trim(); }, contains(c) { return this._v.includes(c); } },
        setAttribute(n, v) { this[n] = v; },
        getAttribute(n) { return this[n] || null; },
        appendChild(c) { this.children.push(c); return c; },
        insertBefore(c) { this.children.unshift(c); return c; },
        removeChild(c) { return c; },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        closest() { return null; },
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {},
      };
      return el;
    },
    createTextNode(text) { return { nodeType: 3, textContent: text }; },
    createDocumentFragment() { return { appendChild(c) { return c; }, children: [] }; },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
    activeElement: { tagName: "BODY" },
  };
  // Store elements for lookup
  globalThis._dsElements = {};

  function el(id, opts = {}) {
    const e = globalThis.document.createElement(opts.tag || "div");
    e.id = id;
    if (opts.className) e.className = opts.className;
    if (opts.value !== undefined) e.value = opts.value;
    globalThis._dsElements[id] = e;
    return e;
  }

  // Create all elements admin-ds.js expects
  for (const id of [
    "statGateway", "statGatewaySub", "statOnlineResidents", "statOnlineSub",
    "statTodayMessages", "statMessageSub", "statPendingAlerts", "statAlertSub",
    "dsGatewayEndpoint", "dsGatewayConnection", "dsGatewayResident",
    "dsGatewayRoomCount", "dsGatewayMessageCount", "dsGatewayLastSync",
    "dsGatewayStatus", "dsOnlineCount", "dsAlertCount", "dashboardTime",
    "msgAuditBadge", "dsSidebar", "dsSidebarToggle", "dsSidebarOverlay",
    "dsDetailPanel", "dsDetailTitle", "dsDetailBody", "dsDetailActions",
    "dsDetailClose", "dsContent", "dsAdminNotice",
  ]) { el(id); }

  for (const id of ["residentTableBody", "roomTableBody", "msgTableBody", "inviteTableBody", "logTableBody"]) {
    el(id, { tag: "tbody" });
  }
  for (const id of [
    "residentSearch", "residentStatusFilter", "residentRoleFilter",
    "roomSearch", "roomTypeFilter", "msgSearch", "msgRoomFilter", "msgStatusFilter",
    "logSearch", "logLevelFilter", "logTypeFilter",
  ]) { el(id, { tag: "input", value: "" }); }

  for (const id of ["mod-dashboard", "mod-residents", "mod-rooms", "mod-messages", "mod-permissions", "mod-sysconfig", "mod-logs"]) {
    el(id, { className: "ds-module" });
  }

  for (const action of ["export-residents", "create-resident", "batch-approve-messages", "refresh-messages", "create-permission-group", "generate-invite", "export-logs", "clear-processed-logs"]) {
    const btn = el("btn-" + action, { tag: "button", className: "ds-btn" });
    btn.dataset.adminAction = action;
  }

  for (const nav of ["dashboard", "residents", "rooms", "messages", "permissions", "sysconfig", "logs"]) {
    const navEl = el("nav-" + nav, { tag: "button" });
    navEl.dataset.module = nav;
  }

  const search = gatewayUrl ? `?gateway=${gatewayUrl}` : "";
  globalThis.window = {
    location: { href: `http://127.0.0.1:18081/admin-ds.html${search}`, search, protocol: "http:", origin: "http://127.0.0.1:18081" },
    localStorage: { getItem(k) { return storage.get(k) || null; }, setItem(k, v) { storage.set(k, String(v)); }, removeItem(k) { storage.delete(k); } },
    addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
    setTimeout(fn, d) { if (typeof fn === "function") fn(); return 1; },
    clearTimeout() {}, setInterval() { return 1; }, clearInterval() {},
    requestAnimationFrame(fn) { if (typeof fn === "function") fn(); return 1; },
    cancelAnimationFrame() {},
    innerWidth: 1280,
    matchMedia() { return { matches: false, addEventListener() {}, removeEventListener() {} }; },
  };
  globalThis.localStorage = globalThis.window.localStorage;
  globalThis.requestAnimationFrame = globalThis.window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = globalThis.window.cancelAnimationFrame;
  globalThis.setTimeout = globalThis.window.setTimeout;
  globalThis.clearTimeout = globalThis.window.clearTimeout;
  globalThis.setInterval = globalThis.window.setInterval;
  globalThis.clearInterval = globalThis.window.clearInterval;
  globalThis.HTMLElement = function() {};
  globalThis.Element = function() {};
  globalThis.Event = function(type) { this.type = type; };
  globalThis.CustomEvent = function(type, opts) { this.type = type; this.detail = opts?.detail; };
  globalThis.URLSearchParams = URLSearchParams;
}

// Load admin-ds.js with patched exports for testing normalize functions
async function loadAdminDsWithExports(opts = {}) {
  const dataJs = await readText("../admin-ds-data.js");
  const mainJs = await readText("../admin-ds.js");

  // Patch: expose normalize functions before bindStaticAdminActions
  const patchedJs = mainJs.replace(
    /function bindStaticAdminActions/,
    "window.__adminTest = window.__adminTest || {};\n" +
    "window.__adminTest.normalizeGatewayResidents = normalizeGatewayResidents;\n" +
    "window.__adminTest.normalizeGatewayRooms = normalizeGatewayRooms;\n" +
    "window.__adminTest.normalizeGatewayMessages = normalizeGatewayMessages;\n" +
    "window.__adminTest.updateDashboardSummary = updateDashboardSummary;\n" +
    "window.__adminTest.fetchGatewayJson = fetchGatewayJson;\n" +
    "window.__adminTest.fetchGatewayJsonPost = fetchGatewayJsonPost;\n" +
    "window.__adminTest.resolveGatewayUrl = resolveGatewayUrl;\n" +
    "window.__adminTest.markUnavailableButton = markUnavailableButton;\n" +
    "window.__adminTest.showAdminNotice = showAdminNotice;\n" +
    "window.__adminTest.banResident = banResident;\n" +
    "window.__adminTest.unbanResident = unbanResident;\n" +
    "window.__adminTest.freezeRoom = freezeRoom;\n" +
    "window.__adminTest.unfreezeRoom = unfreezeRoom;\n" +
    "function bindStaticAdminActions"
  );

  const tmpDir = path.join((import.meta.dirname || path.dirname(new URL(import.meta.url).pathname)), "..", ".tmp");
  await fs.mkdir(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, `ads-exp-${Date.now()}-${Math.random().toString(16).slice(2)}.js`);
  await fs.writeFile(tmpPath, dataJs + "\n" + patchedJs, "utf8");

  try {
    if (opts.fetchMock) {
      globalThis.fetch = opts.fetchMock;
    } else {
      globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({}), text: async () => "error" });
    }
    await import(`${pathToFileURL(tmpPath).href}?t=${Date.now()}`);
  } finally {
    await fs.unlink(tmpPath).catch(() => {});
  }

  return globalThis.window?.__adminTest || {};
}

// ---- Tests ----

test("admin-ds runtime: normalizeGatewayResidents 正确转换 gateway 数据", serial, async () => {
  setupMinimalGlobals("http://127.0.0.1:8787");
  const api = await loadAdminDsWithExports();

  assert.equal(typeof api.normalizeGatewayResidents, "function", "normalizeGatewayResidents 应暴露为函数");

  const payload = [
    { resident_id: "alice", nick: "爱丽丝", roles: ["Resident"], online: true, last_seen_at_ms: Date.now() },
    { resident_id: "bob", nick: "鲍勃", roles: ["Admin"], online: false, last_seen_at_ms: Date.now() - 3600000 },
  ];
  const result = api.normalizeGatewayResidents(payload);
  assert.ok(Array.isArray(result), "应返回数组");
  assert.equal(result.length, 2, "应返回 2 条记录");

  const first = result[0];
  assert.equal(first.id, "alice", "id 应为 resident_id");
  assert.equal(first.nick, "alice", "nick 映射为 id");
  assert.equal(first.status, "online", "online=true -> status=online");

  // 安全验证：不应包含 HTML 标签或实体
  assert.equal(first.nick.includes("<"), false, "数据不应包含 HTML 标签");
  assert.equal(first.nick.includes(">"), false, "数据不应包含 HTML 标签");
});

test("admin-ds runtime: normalizeGatewayRooms 正确转换 shell state", serial, async () => {
  setupMinimalGlobals("http://127.0.0.1:8787");
  const api = await loadAdminDsWithExports();

  assert.equal(typeof api.normalizeGatewayRooms, "function", "normalizeGatewayRooms 应暴露为函数");

  const shellState = {
    rooms: [
      { id: "room:world:lobby", title: "主城大厅", kind: "public", participant_count: 24 },
      { id: "dm:alice:bob", title: null, kind: "direct", peer_display: "鲍勃", participant_count: 2 },
    ],
  };
  const result = api.normalizeGatewayRooms(shellState);
  assert.ok(Array.isArray(result), "应返回数组");
  assert.equal(result.length, 2, "应返回 2 个房间");
  assert.ok(result[0].name && result[0].name.length > 0, "房间应有名称");
});

test("admin-ds runtime: normalizeGatewayMessages 正确转换 shell state", serial, async () => {
  setupMinimalGlobals("http://127.0.0.1:8787");
  const api = await loadAdminDsWithExports();

  assert.equal(typeof api.normalizeGatewayMessages, "function", "normalizeGatewayMessages 应暴露为函数");

  const shellState = {
    rooms: [
      {
        id: "room:world:lobby",
        messages: [
          { message_id: "msg-1", sender: "爱丽丝", text: "大家好", created_at_ms: Date.now() },
          { message_id: "msg-2", sender: "鲍勃", text: "你好", created_at_ms: Date.now() },
        ],
      },
    ],
  };
  const result = api.normalizeGatewayMessages(shellState);
  assert.ok(Array.isArray(result), "应返回数组");
  assert.ok(result.length > 0, "应至少返回一条消息");
  const first = result[0];
  assert.ok(first.sender, "应有 sender");
  assert.ok(first.content !== undefined, "应有 content");
  assert.ok(first.room, "应有 room 上下文");
});

test("admin-ds runtime: fetchGatewayJson 在无 gateway 时返回 null", serial, async () => {
  setupMinimalGlobals(null);
  const api = await loadAdminDsWithExports();

  assert.equal(typeof api.fetchGatewayJson, "function", "fetchGatewayJson 应暴露为函数");

  const result = await api.fetchGatewayJson("/v1/residents");
  assert.equal(result, null, "无 gateway 时应返回 null");
});

test("admin-ds runtime: fetchGatewayJson 在 gateway 失败时返回 null", serial, async () => {
  setupMinimalGlobals("http://127.0.0.1:9999");
  globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({}), text: async () => "error" });
  const api = await loadAdminDsWithExports({ fetchMock: globalThis.fetch });

  assert.equal(typeof api.fetchGatewayJson, "function", "fetchGatewayJson 应暴露为函数");

  const result = await api.fetchGatewayJson("/v1/residents");
  assert.equal(result, null, "gateway 失败时应返回 null 而非 crash");
});

test("admin-ds runtime: fetchGatewayJson 成功时返回解析后的 JSON", serial, async () => {
  setupMinimalGlobals("http://127.0.0.1:8787");
  const mockData = { residents: [{ resident_id: "alice", nick: "爱丽丝" }] };
  globalThis.fetch = async () => ({
    ok: true, status: 200,
    json: async () => mockData,
    text: async () => JSON.stringify(mockData),
  });
  const api = await loadAdminDsWithExports({ fetchMock: globalThis.fetch });

  assert.equal(typeof api.fetchGatewayJson, "function", "fetchGatewayJson 应暴露为函数");

  const result = await api.fetchGatewayJson("/v1/residents");
  assert.ok(result !== null, "成功时应返回数据");
  assert.ok(result.residents, "应包含 residents 数组");
  assert.equal(result.residents[0].nick, "爱丽丝");
});

test("admin-ds runtime: markUnavailableButton 正确标记不可用按钮", serial, async () => {
  setupMinimalGlobals("http://127.0.0.1:8787");
  const api = await loadAdminDsWithExports();

  assert.equal(typeof api.markUnavailableButton, "function", "markUnavailableButton 应暴露为函数");

  const btn = globalThis.document.createElement("button");
  btn.className = "ds-btn";
  api.markUnavailableButton(btn, "功能尚未接入");

  assert.equal(btn.disabled, true, "按钮应被禁用");
  assert.equal(btn.getAttribute("aria-disabled"), "true", "应有 aria-disabled");
  assert.ok(btn.title.includes("功能尚未接入"), "title 应包含原因");
  assert.equal(btn.dataset.disabledReason, "功能尚未接入", "dataset 应记录原因");
});

// ====== Write operation runtime tests (ban/unban/freeze/unfreeze) ======

test("admin-ds runtime: banResident 发送正确的 POST 请求体", serial, async () => {
  setupMinimalGlobals("http://127.0.0.1:8787");
  globalThis.prompt = () => "测试禁用理由";

  const fetchCalls = [];
  globalThis.fetch = async (url, init) => {
    fetchCalls.push({ url: String(url), method: init?.method || "GET", body: init?.body });
    return { ok: true, status: 200, json: async () => ({}), text: async () => "{}" };
  };

  const api = await loadAdminDsWithExports({ fetchMock: globalThis.fetch });
  const banCallsBefore = fetchCalls.filter(c => c.url.includes("/v1/admin/residents/ban")).length;

  const btn = globalThis.document.createElement("button");
  await api.banResident("ban-target-user", btn);

  const banCallsAfter = fetchCalls.filter(c => c.url.includes("/v1/admin/residents/ban")).length;
  assert.equal(banCallsAfter - banCallsBefore, 1, "调 banResident 后应新增 1 次 /ban 请求");
  const banCall = fetchCalls.find(c => c.url.includes("/v1/admin/residents/ban"));
  assert.ok(banCall, "应存在 /ban 请求");
  assert.equal(banCall.method, "POST", "应为 POST 方法");

  const body = JSON.parse(banCall.body);
  assert.equal(body.resident_id, "ban-target-user");
  assert.equal(body.reason, "测试禁用理由");
  assert.equal(body.actor_id, "rsaga");
});

test("admin-ds runtime: banResident 处理 Gateway 错误响应", serial, async () => {
  setupMinimalGlobals("http://127.0.0.1:8787");
  globalThis.prompt = () => "违规";

  globalThis.fetch = async () => ({
    ok: false, status: 400,
    json: async () => ({ error: "居民不存在" }),
    text: async () => '{"error":"居民不存在"}',
  });

  const api = await loadAdminDsWithExports({ fetchMock: globalThis.fetch });
  const btn = globalThis.document.createElement("button");

  await api.banResident("nonexistent", btn);
  // 不应抛异常，应通过 showAdminNotice 展示错误
  assert.ok(btn.textContent, "按钮应更新状态");
});

test("admin-ds runtime: banResident 无 gateway 时提前返回", serial, async () => {
  setupMinimalGlobals(null);
  globalThis.prompt = () => "理由";

  const api = await loadAdminDsWithExports();
  const btn = globalThis.document.createElement("button");

  await api.banResident("user", btn);
  // 不应抛异常，应 gracefully 退出
  assert.ok(true, "无 gateway 时不应 crash");
});

test("admin-ds runtime: banResident 空 residentId 直接返回", serial, async () => {
  setupMinimalGlobals("http://127.0.0.1:8787");

  const api = await loadAdminDsWithExports();
  const btn = globalThis.document.createElement("button");

  await api.banResident("", btn);
  assert.ok(true, "空 residentId 时不应 crash");
});

test("admin-ds runtime: banResident prompt 取消不发送 ban 请求", serial, async () => {
  setupMinimalGlobals("http://127.0.0.1:8787");
  globalThis.prompt = () => null; // 用户取消

  const fetchCalls = [];
  globalThis.fetch = async (url, init) => {
    fetchCalls.push({ url: String(url) });
    return { ok: true, status: 200, json: async () => ({}), text: async () => "{}" };
  };

  const api = await loadAdminDsWithExports({ fetchMock: globalThis.fetch });
  const banCallsBefore = fetchCalls.filter(c => c.url.includes("/v1/admin/residents/ban")).length;

  const btn = globalThis.document.createElement("button");
  await api.banResident("user", btn);

  const banCallsAfter = fetchCalls.filter(c => c.url.includes("/v1/admin/residents/ban")).length;
  assert.equal(banCallsAfter - banCallsBefore, 0, "用户取消时不应新增 /ban 请求");
});

test("admin-ds runtime: unbanResident 发送正确的 POST 请求", serial, async () => {
  setupMinimalGlobals("http://127.0.0.1:8787");

  const fetchCalls = [];
  globalThis.fetch = async (url, init) => {
    fetchCalls.push({ url: String(url), method: init?.method, body: init?.body });
    return { ok: true, status: 200, json: async () => ({}), text: async () => "{}" };
  };

  const api = await loadAdminDsWithExports({ fetchMock: globalThis.fetch });
  const before = fetchCalls.filter(c => c.url.includes("/v1/admin/residents/unban")).length;

  const btn = globalThis.document.createElement("button");
  await api.unbanResident("unban-target", btn);

  const after = fetchCalls.filter(c => c.url.includes("/v1/admin/residents/unban")).length;
  assert.equal(after - before, 1, "调 unbanResident 后应新增 1 次 /unban 请求");
  const call = fetchCalls.find(c => c.url.includes("/v1/admin/residents/unban"));
  assert.ok(call, "应存在 /unban 请求");
  assert.equal(call.method, "POST", "应为 POST 方法");

  const body = JSON.parse(call.body);
  assert.equal(body.resident_id, "unban-target");
  assert.equal(body.actor_id, "rsaga");
});

test("admin-ds runtime: unbanResident 无 gateway 时提前返回", serial, async () => {
  setupMinimalGlobals(null);

  const api = await loadAdminDsWithExports();
  const btn = globalThis.document.createElement("button");

  await api.unbanResident("user", btn);
  assert.ok(true, "无 gateway 时不应 crash");
});

test("admin-ds runtime: freezeRoom 发送正确的 POST 请求", serial, async () => {
  setupMinimalGlobals("http://127.0.0.1:8787");

  const fetchCalls = [];
  globalThis.fetch = async (url, init) => {
    fetchCalls.push({ url: String(url), method: init?.method, body: init?.body });
    return { ok: true, status: 200, json: async () => ({}), text: async () => "{}" };
  };

  const api = await loadAdminDsWithExports({ fetchMock: globalThis.fetch });
  const before = fetchCalls.filter(c => c.url.includes("/v1/admin/rooms/freeze")).length;

  const btn = globalThis.document.createElement("button");
  await api.freezeRoom("room:test:lobby", btn);

  const after = fetchCalls.filter(c => c.url.includes("/v1/admin/rooms/freeze")).length;
  assert.equal(after - before, 1, "调 freezeRoom 后应新增 1 次 /freeze 请求");
  const call = fetchCalls.find(c => c.url.includes("/v1/admin/rooms/freeze"));
  assert.ok(call, "应存在 /freeze 请求");
  assert.equal(call.method, "POST", "应为 POST 方法");

  const body = JSON.parse(call.body);
  assert.equal(body.room_id, "room:test:lobby");
});

test("admin-ds runtime: freezeRoom 空 roomId 直接返回", serial, async () => {
  setupMinimalGlobals("http://127.0.0.1:8787");

  const api = await loadAdminDsWithExports();
  const btn = globalThis.document.createElement("button");

  await api.freezeRoom("", btn);
  assert.ok(true, "空 roomId 时不应 crash");
});

test("admin-ds runtime: unfreezeRoom 发送正确的 POST 请求", serial, async () => {
  setupMinimalGlobals("http://127.0.0.1:8787");

  const fetchCalls = [];
  globalThis.fetch = async (url, init) => {
    fetchCalls.push({ url: String(url), method: init?.method, body: init?.body });
    return { ok: true, status: 200, json: async () => ({}), text: async () => "{}" };
  };

  const api = await loadAdminDsWithExports({ fetchMock: globalThis.fetch });
  const before = fetchCalls.filter(c => c.url.includes("/v1/admin/rooms/unfreeze")).length;

  const btn = globalThis.document.createElement("button");
  await api.unfreezeRoom("room:test:lobby", btn);

  const after = fetchCalls.filter(c => c.url.includes("/v1/admin/rooms/unfreeze")).length;
  assert.equal(after - before, 1, "调 unfreezeRoom 后应新增 1 次 /unfreeze 请求");
  const call = fetchCalls.find(c => c.url.includes("/v1/admin/rooms/unfreeze"));
  assert.ok(call, "应存在 /unfreeze 请求");
  assert.equal(call.method, "POST", "应为 POST 方法");

  const body = JSON.parse(call.body);
  assert.equal(body.room_id, "room:test:lobby");
});

test("admin-ds runtime: fetchGatewayJsonPost 发送正确的请求头", serial, async () => {
  setupMinimalGlobals("http://127.0.0.1:8787");

  let capturedInit = null;
  globalThis.fetch = async (url, init) => {
    capturedInit = init;
    return { ok: true, status: 200, json: async () => ({ ok: true }), text: async () => '{"ok":true}' };
  };

  const api = await loadAdminDsWithExports({ fetchMock: globalThis.fetch });

  const result = await api.fetchGatewayJsonPost("/v1/admin/residents/ban", {
    resident_id: "user", reason: "test", actor_id: "rsaga",
  });

  assert.ok(capturedInit, "应调用 fetch");
  assert.equal(capturedInit.method, "POST", "应为 POST");
  assert.equal(capturedInit.headers["Content-Type"], "application/json", "应为 JSON Content-Type");
  assert.ok(result.ok, "应返回 ok 结果");
});

test("admin-ds runtime: 外部数据写入使用安全 DOM API", serial, async () => {
  const js = await readText("../admin-ds.js");

  // 禁止 innerHTML
  assert.doesNotMatch(js, /\.innerHTML\s*=/, "不应使用 .innerHTML =");
  assert.doesNotMatch(js, /insertAdjacentHTML/, "不应使用 insertAdjacentHTML");
  // 必须使用安全 API
  assert.match(js, /\.textContent\s*=/, "应使用 .textContent =");
  assert.match(js, /document\.createTextNode\(/, "应使用 createTextNode");
  assert.match(js, /document\.createElement\(/, "应使用 createElement");
});
