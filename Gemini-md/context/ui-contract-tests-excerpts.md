# UI contract test excerpts for Gemini

These tests show behavior that UI redesign must preserve. They are not a full test suite.

## creative-resident-shell-init.test.mjs key ranges

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { loadUserShellApp } from "./fake-dom.mjs";

const serial = { concurrency: false };

async function flushAsyncWork() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test("creative resident shell boots into the chat workspace with room scene and portrait chrome", serial, async () => {
  const app = await loadUserShellApp();
  try {
    const { document } = app;
    const activeRoom = document.querySelector(".room-button.active");
    const roomStageCanvas = document.querySelector("#room-stage-canvas");
    const portraitCanvas = document.querySelector("#room-stage-portrait-canvas");
    const roomStageSide = document.querySelector(".conversation-stage-side");
    const chatDetailPanel = document.querySelector(".chat-detail");
    const chatDetailContent = document.querySelector("#chat-detail-content");
    const summaryTitle = document.querySelector("#chat-detail-summary-title");
    const summaryCopy = document.querySelector("#chat-detail-summary-copy");
    const cardShell = document.querySelector("#chat-detail-card-shell");
    const cardTitle = document.querySelector("#chat-detail-card-title");
    const cardAvatar = document.querySelector("#chat-detail-card-avatar");
    const cardMeta = document.querySelector("#chat-detail-card-meta");
    const cardActions = document.querySelector("#chat-detail-card-actions");
    const composerInput = document.querySelector("#composer-input");
    const composerTip = document.querySelector(".composer-tip");

    assert.equal(document.body.dataset.shellMode, "user");
    assert.equal(document.body.dataset.workspace, "chat");
    assert.equal(document.body.dataset.chatDetailMode, "inline");
    assert.equal(document.body.dataset.roomVariant, "home");
    assert.equal(document.body.dataset.roomMotif, "courtyard");
    assert.equal(document.title, "龙虾聊天 · 房间聊天");
    assert.equal(document.querySelector(".workspace-switcher"), null);
    assert.ok(activeRoom);
    assert.equal(roomStageCanvas?.dataset?.variant, "home");
    assert.equal(roomStageCanvas?.dataset?.kind, "stage");
    assert.equal(roomStageCanvas?.dataset?.motif, "courtyard");
    assert.equal(portraitCanvas?.dataset?.variant, "home");
    assert.equal(portraitCanvas?.dataset?.kind, "portrait");
    assert.equal(portraitCanvas?.dataset?.motif, "caretaker");
    assert.equal(portraitCanvas?.dataset?.monogram, "旺");
    assert.ok(roomStageSide);
    assert.ok(chatDetailPanel);
    assert.ok(chatDetailContent);
    assert.equal(chatDetailPanel?.dataset?.roomVariant, "home");
    assert.equal(chatDetailPanel?.dataset?.roomMotif, "courtyard");
    assert.equal(cardShell?.dataset?.roomVariant, "home");
    assert.equal(cardShell?.dataset?.roomMotif, "courtyard");
    assert.match(document.querySelector("#masthead-title")?.textContent || "", /住宅私聊|房内聊天/);
    assert.match(document.querySelector("#hero-note")?.textContent || "", /住处|一对一|房间里继续聊/);
    assert.match(summaryTitle?.textContent || "", /住宅私聊|房内状态/);
    assert.match(summaryCopy?.textContent || "", /续聊|记任务|追问|一对一/);
    assert.match(cardTitle?.textContent || "", /房内状态|住宅私聊|角色卡/);
    assert.match(cardAvatar?.textContent || "", /旺|房|住/);
    assert.match(cardMeta?.textContent || "", /住户|同住AI|状态|自动回复/);
    assert.match(cardActions?.textContent || "", /续聊/);
    assert.match(cardActions?.textContent || "", /整理/);
    assert.match(cardActions?.textContent || "", /留条/);
    assert.match(document.querySelector(".conversation-stage-note")?.textContent || "", /适合快速确认方向/);
    assert.match(roomStageSide.textContent || "", /旺财|房间管家|直接协作/);
    assert.match(chatDetailContent.textContent || "", /旺财|自动回复|内测同伴/);

    const continueButton = document.querySelector('[data-card-action="续聊"]');
    assert.ok(continueButton);
    continueButton.click();

    assert.equal(composerInput?.value, "续聊：");
    assert.equal(continueButton.classList.contains("is-active"), true);
    assert.match(composerTip?.textContent || "", /当前动作 续聊/);
  } finally {
    app.cleanup();
  }
});

test("creative resident shell opens with the first room selected and composer enabled", serial, async () => {
  const app = await loadUserShellApp();
  try {
    const { document } = app;
    const composerInput = document.querySelector("#composer-input");
    const roomButtons = document.querySelectorAll(".room-button");
    const activeRoom = document.querySelector(".room-button.active");

    assert.ok(activeRoom);
    assert.equal(activeRoom, roomButtons[0]);
    assert.equal(composerInput?.disabled, false);
    assert.ok((composerInput?.placeholder || "").length > 0);
  } finally {
    app.cleanup();
  }
});

test("creative resident shell can refresh gateway badges without provider controls on the chat page", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651",
    gatewayBaseUrl: "http://127.0.0.1:50651",
  });
  try {
    const { document } = app;
    assert.match(document.querySelector("#gateway-state")?.textContent || "", /127\.0\.0\.1:50651/);
    assert.match(document.querySelector("#provider-state")?.textContent || "", /cloudflare\.com|消息来源/);
    assert.ok(document.querySelector(".room-button.active"));
  } finally {
    app.cleanup();
  }
});

test("gateway creative resident shell scopes state and opens SSE stream by stored resident identity", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651",
    gatewayBaseUrl: "http://127.0.0.1:50651",
    localStorageEntries: { "lobster-identity": "rsaga" },
  });
  try {
    const { document, fetchCalls, eventSourceCalls } = app;
    const composerInput = document.querySelector("#composer-input");


// ... message rendering and auth excerpts ...

    assert.equal(composerInput.disabled, false);

    composerInput.value = "你好";
    composerInput.dispatchEvent(new Event("input", { bubbles: true }));
    composerForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushAsyncWork();
    await flushAsyncWork();

    assert.equal(composerInput.value, "");
    assert.equal(
      fetchCalls.filter((url) => url === "http://127.0.0.1:50651/v1/shell/message").length,
      1,
    );
  } finally {
    app.cleanup();
  }
});

test("gateway creative resident send commits one stable self bubble with avatar", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651&identity=qa-a",
    gatewayBaseUrl: "http://127.0.0.1:50651",
    localStorageEntries: { "lobster-identity": "qa-a" },
  });
  try {
    const { document, fetchCalls } = app;
    const composerForm = document.querySelector("#composer");
    const composerInput = document.querySelector("#composer-input");
    const text = `双端回归-${Date.now()}`;

    assert.ok(composerForm);
    assert.ok(composerInput);
    assert.equal(composerInput.disabled, false);

    composerInput.value = text;
    composerInput.dispatchEvent(new Event("input", { bubbles: true }));
    composerForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    for (let index = 0; index < 6; index += 1) {
      await flushAsyncWork();
    }

    const matchingRows = Array.from(document.querySelectorAll(".message-row")).filter((row) =>
      (row.textContent || "").includes(text),
    );

    assert.equal(composerInput.value, "");
    assert.equal(
      fetchCalls.filter((url) => url === "http://127.0.0.1:50651/v1/shell/message").length,
      1,
    );
    assert.equal(matchingRows.length, 1);
    assert.equal(matchingRows[0]?.classList.contains("self"), true);
    assert.equal(matchingRows[0]?.dataset?.messageKind, "self");
    assert.ok(matchingRows[0]?.querySelector(".message-avatar"));
    assert.equal(matchingRows[0]?.querySelector(".message-pending"), null);
    assert.doesNotMatch(matchingRows[0]?.textContent || "", /待同步|正在投递|发送失败|待重发/);
  } finally {
    app.cleanup();
  }
});

test("gateway creative resident export surfaces gateway Error message", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651&identity=rsaga",
    gatewayBaseUrl: "http://127.0.0.1:50651",
    localStorageEntries: { "lobster-identity": "rsaga" },
    exportResponse: {
      status: 403,
      body: {
        Error: {
          message: "导出权限不足",
        },
      },
    },
  });
  try {
    const { document, fetchCalls } = app;
    const exportButton = Array.from(document.querySelectorAll("button")).find((node) =>
      /导出当前|导出聊天|导出会话/.test(node.textContent || ""),
    );
    assert.ok(exportButton);
    assert.equal(exportButton.disabled, false);

    exportButton.click();
    await flushAsyncWork();
    await flushAsyncWork();

    assert.ok(fetchCalls.some((url) => url.startsWith("http://127.0.0.1:50651/v1/export?")));
    assert.match(document.querySelector("#world-state")?.textContent || "", /导出权限不足/);
  } finally {
    app.cleanup();
  }
});

test("gateway creative resident peer message renders on the left with its own avatar", serial, async () => {
  const baseFixtureUrl = new URL("../generated/state.contract.json", import.meta.url);
  const tempFixtureName = `state.contract.peer-message-${process.pid}-${Date.now()}.json`;
  const tempFixtureUrl = new URL(`../generated/${tempFixtureName}`, import.meta.url);
  const payload = JSON.parse(await fs.readFile(baseFixtureUrl, "utf8"));
  const conversation = payload?.conversation_shell?.conversations?.find(
    (item) => item?.conversation_id === "room:world:lobby",
  );
  const text = `对端消息-${Date.now()}`;

  assert.ok(conversation);
  conversation.messages = [
    ...(Array.isArray(conversation.messages) ? conversation.messages : []),
    {
      message_id: "msg:test-peer-visible",
      sender: "qa-a",
      timestamp_ms: Date.now(),
      timestamp_label: "刚刚",
      timestamp: "刚刚",
      text,
      delivery_status: "delivered",
    },
  ];
  await fs.writeFile(tempFixtureUrl, JSON.stringify(payload, null, 2), "utf8");

  try {
    const app = await loadUserShellApp({
      useGeneratedFixtures: true,
      generatedShellFixture: `generated/${tempFixtureName}`,
      locationSearch: "?gateway=http://127.0.0.1:50651&identity=qa-b",
      gatewayBaseUrl: "http://127.0.0.1:50651",
      localStorageEntries: { "lobster-identity": "qa-b" },
    });
    try {
      const { document, fetchCalls, eventSourceCalls } = app;
      const matchingRows = Array.from(document.querySelectorAll(".message-row")).filter((row) =>
        (row.textContent || "").includes(text),
      );

      assert.ok(fetchCalls.includes("http://127.0.0.1:50651/v1/shell/state?resident_id=qa-b"));
      assert.ok(eventSourceCalls.includes("http://127.0.0.1:50651/v1/shell/events?resident_id=qa-b"));
      assert.equal(matchingRows.length, 1);
      assert.equal(matchingRows[0]?.classList.contains("self"), false);
      assert.equal(matchingRows[0]?.dataset?.messageSide, "peer");
      assert.ok(matchingRows[0]?.querySelector(".message-avatar"));
      assert.match(matchingRows[0]?.querySelector(".message-avatar")?.textContent || "", /QA|聊/);
    } finally {
      app.cleanup();
    }
  } finally {
    await fs.unlink(tempFixtureUrl).catch(() => {});
  }
});

test("gateway creative resident shell keeps visitor scoped and blocks sending before login", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",


// ... resident auth and bearer excerpts ...

    locationSearch: "?gateway=http://127.0.0.1:50651",
    gatewayBaseUrl: "http://127.0.0.1:50651",
  });
  try {
    const { document } = app;
    const deliverySelect = document.querySelector("#auth-delivery-select");
    const residentInput = document.querySelector("#auth-resident-input");
    const emailInput = document.querySelector("#auth-email-input");
    const mobileInput = document.querySelector("#auth-mobile-input");
    const deviceInput = document.querySelector("#auth-device-input");
    const challengeInput = document.querySelector("#auth-challenge-input");
    const requestButton = document.querySelector("#auth-request-button");
    const verifyForm = document.querySelector("#auth-verify-form");

    assert.equal(deliverySelect?.value, "email");
    assert.match(residentInput?.placeholder || "", /居民名/);
    assert.match(deliverySelect?.textContent || "", /邮箱验证码/);
    assert.match(emailInput?.placeholder || "", /接收验证码/);
    assert.match(mobileInput?.placeholder || "", /反滥用/);
    assert.match(deviceInput?.placeholder || "", /反滥用/);
    assert.match(requestButton?.textContent || "", /登录 \/ 注册/);
    assert.equal(challengeInput?.getAttribute("type"), "hidden");
    assert.doesNotMatch(verifyForm?.textContent || "", /challenge id|挑战标识/i);
    assert.match(verifyForm?.textContent || "", /验证码来自上一步邮件/);
  } finally {
    app.cleanup();
  }
});

test("gateway creative resident shell refreshes resident conversations after OTP login", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651",
    gatewayBaseUrl: "http://127.0.0.1:50651",
  });
  try {
    const { document, window, fetchCalls } = app;
    const challengeInput = document.querySelector("#auth-challenge-input");
    const residentInput = document.querySelector("#auth-resident-input");
    const codeInput = document.querySelector("#auth-code-input");
    const verifyForm = document.querySelector("#auth-verify-form");

    challengeInput.value = "otp:test";
    residentInput.value = "rsaga";
    codeInput.value = "123456";
    verifyForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushAsyncWork();
    await flushAsyncWork();

    assert.equal(window.localStorage.getItem("lobster-identity"), "rsaga");
    assert.ok(fetchCalls.includes("http://127.0.0.1:50651/v1/auth/email-otp/verify"));
    assert.ok(fetchCalls.includes("http://127.0.0.1:50651/v1/shell/state?resident_id=rsaga"));
    assert.equal(document.querySelector("#resident-login-card")?.classList.contains("shell-hidden"), true);
    assert.equal(document.querySelector("#composer-input")?.disabled, false);
  } finally {
    app.cleanup();
  }
});

test("gateway creative resident sends bearer session token after OTP login", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651",
    gatewayBaseUrl: "http://127.0.0.1:50651",
  });
  try {
    const { document, window, fetchRequests } = app;
    const challengeInput = document.querySelector("#auth-challenge-input");
    const residentInput = document.querySelector("#auth-resident-input");
    const codeInput = document.querySelector("#auth-code-input");
    const verifyForm = document.querySelector("#auth-verify-form");
    const composerForm = document.querySelector("#composer");
    const composerInput = document.querySelector("#composer-input");

    challengeInput.value = "otp:test";
    residentInput.value = "rsaga";
    codeInput.value = "123456";
    verifyForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushAsyncWork();
    await flushAsyncWork();

    assert.equal(window.localStorage.getItem("lobster-session-token"), "lbst_test_session_token");

    composerInput.value = "带 token 发送";
    composerInput.dispatchEvent(new Event("input", { bubbles: true }));
    composerForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushAsyncWork();
    await flushAsyncWork();

    const messageRequest = fetchRequests.find(
      (request) => request.url === "http://127.0.0.1:50651/v1/shell/message",
    );
    assert.equal(messageRequest?.init?.headers?.Authorization, "Bearer lbst_test_session_token");
  } finally {
    app.cleanup();
  }
});

test("gateway creative resident export sends bearer session token after OTP login", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651",
    gatewayBaseUrl: "http://127.0.0.1:50651",
  });
  try {
    const { document, fetchRequests } = app;
    const challengeInput = document.querySelector("#auth-challenge-input");
    const residentInput = document.querySelector("#auth-resident-input");
    const codeInput = document.querySelector("#auth-code-input");
    const verifyForm = document.querySelector("#auth-verify-form");

    challengeInput.value = "otp:test";
    residentInput.value = "rsaga";
    codeInput.value = "123456";
    verifyForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushAsyncWork();
    await flushAsyncWork();

    const exportButton = Array.from(document.querySelectorAll("button")).find((node) =>
      /导出当前|导出聊天|导出会话/.test(node.textContent || ""),
    );
    assert.ok(exportButton);
    exportButton.click();
    await flushAsyncWork();
    await flushAsyncWork();

    const exportRequest = fetchRequests.find((request) =>
      request.url.startsWith("http://127.0.0.1:50651/v1/export?"),
    );
    assert.equal(exportRequest?.init?.headers?.Authorization, "Bearer lbst_test_session_token");
  } finally {
    app.cleanup();
  }
});

test("gateway creative resident export clears session when bearer token is rejected", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651",
    gatewayBaseUrl: "http://127.0.0.1:50651",
    exportResponse: {
      status: 401,
      body: {
        Error: {
          message: "authorization bearer token required",
        },
      },
    },
  });
  try {
    const { document, window } = app;
    const challengeInput = document.querySelector("#auth-challenge-input");
    const residentInput = document.querySelector("#auth-resident-input");
    const codeInput = document.querySelector("#auth-code-input");
    const verifyForm = document.querySelector("#auth-verify-form");

    challengeInput.value = "otp:test";
    residentInput.value = "rsaga";
    codeInput.value = "123456";
    verifyForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushAsyncWork();
    await flushAsyncWork();
    assert.equal(window.localStorage.getItem("lobster-session-token"), "lbst_test_session_token");

    const exportButton = Array.from(document.querySelectorAll("button")).find((node) =>
      /导出当前|导出聊天|导出会话/.test(node.textContent || ""),
    );
    assert.ok(exportButton);
    exportButton.click();
    await flushAsyncWork();
    await flushAsyncWork();

    assert.equal(window.localStorage.getItem("lobster-session-token"), "");
    assert.match(document.querySelector("#auth-status")?.textContent || "", /登录已失效，请重新登录/);
  } finally {
    app.cleanup();
  }


// ... room switch and bubble CSS contract excerpts ...

  }
});

test("contract preview and activity labels can drive room button copy without legacy messages", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
  });
  try {
    const { document } = app;
    const builderRoom = Array.from(document.querySelectorAll(".room-button")).find((node) =>
      /builder/.test(node.textContent || ""),
    );

    assert.ok(builderRoom);
    assert.match(builderRoom.textContent || "", /合同预览摘要 · 适合直接继续一对一沟通/);
    assert.match(builderRoom.textContent || "", /暂无消息/);
  } finally {
    app.cleanup();
  }
});

test("selecting another room keeps the composer editable and moves the active marker", serial, async () => {
  const app = await loadUserShellApp();
  try {
    const { document } = app;
    const composerInput = document.querySelector("#composer-input");
    const roomButtons = document.querySelectorAll(".room-button");
    const secondRoom = roomButtons[1];
    const initialPlaceholder = composerInput?.placeholder;
    const secondRoomId = secondRoom?.dataset?.roomId;
    const roomStageCanvas = document.querySelector("#room-stage-canvas");
    const portraitCanvas = document.querySelector("#room-stage-portrait-canvas");
    const roomStageSide = document.querySelector(".conversation-stage-side");
    const chatDetailContent = document.querySelector("#chat-detail-content");
    const chatDetailPanel = document.querySelector(".chat-detail");
    const summaryTitle = document.querySelector("#chat-detail-summary-title");
    const summaryCopy = document.querySelector("#chat-detail-summary-copy");
    const cardShell = document.querySelector("#chat-detail-card-shell");
    const cardTitle = document.querySelector("#chat-detail-card-title");
    const cardAvatar = document.querySelector("#chat-detail-card-avatar");
    const cardMeta = document.querySelector("#chat-detail-card-meta");
    const cardActions = document.querySelector("#chat-detail-card-actions");
    const composerTip = document.querySelector(".composer-tip");

    assert.ok(secondRoom);
    secondRoom.click();

    assert.equal(composerInput?.disabled, false);
    assert.equal(document.querySelector(".room-button.active")?.dataset?.roomId, secondRoomId);
    assert.notEqual(composerInput?.placeholder, initialPlaceholder);
    assert.equal(document.body.dataset.workspace, "chat");
    assert.equal(document.body.dataset.roomVariant, "city");
    assert.equal(document.body.dataset.roomMotif, "watchtower");
    assert.equal(roomStageCanvas?.dataset?.variant, "city");
    assert.equal(roomStageCanvas?.dataset?.motif, "watchtower");
    assert.equal(portraitCanvas?.dataset?.variant, "city");
    assert.equal(portraitCanvas?.dataset?.kind, "portrait");
    assert.equal(portraitCanvas?.dataset?.motif, "sentinel");
    assert.equal(portraitCanvas?.dataset?.monogram, "巡");
    assert.equal(chatDetailPanel?.dataset?.roomVariant, "city");
    assert.equal(chatDetailPanel?.dataset?.roomMotif, "watchtower");
    assert.equal(cardShell?.dataset?.roomVariant, "city");
    assert.equal(cardShell?.dataset?.roomMotif, "watchtower");
    assert.match(document.querySelector("#masthead-title")?.textContent || "", /公共频道|群聊现场/);
    assert.match(document.querySelector("#hero-note")?.textContent || "", /公共频道|公告|跨城讨论/);
    assert.match(summaryTitle?.textContent || "", /公共频道|频道状态/);
    assert.match(summaryCopy?.textContent || "", /公告|围观|跨城讨论|公共/);
    assert.match(cardTitle?.textContent || "", /公共频道|频道状态|角色卡/);
    assert.match(cardAvatar?.textContent || "", /巡|城|公/);
    assert.match(cardMeta?.textContent || "", /角色|当前|状态|公共频道/);
    assert.match(cardActions?.textContent || "", /私聊/);
    assert.match(cardActions?.textContent || "", /委托/);
    assert.match(cardActions?.textContent || "", /交易/);
    assert.match(document.querySelector("#room-stage-title")?.textContent || "", /世界广场/);
    assert.match(roomStageSide?.textContent || "", /巡逻犬|公共频道|世界广场/);
    assert.match(chatDetailContent?.textContent || "", /巡逻犬|公开频道|世界广场/);
    const whisperButton = document.querySelector('[data-card-action="私聊"]');
    assert.ok(whisperButton);
    whisperButton.click();

    assert.equal(composerInput?.value, "私聊：");
    assert.equal(whisperButton.classList.contains("is-active"), true);
    assert.match(composerTip?.textContent || "", /当前动作 私聊/);
  } finally {
    app.cleanup();
  }
});

test("user compatibility route redirects to creative.html without old UI", serial, async () => {
  const html = await fs.readFile(new URL("../user.html", import.meta.url), "utf8");

  // 不再暴露旧住宅 UI
  assert.equal(html.includes('class="panel governance"'), false);
  assert.equal(html.includes('class="panel auth"'), false);
  assert.equal(html.includes('class="identity-row"'), false);
  assert.equal(html.includes('app-user-shell'), false);
  assert.equal(html.includes('wechat-shell'), false);
  assert.equal(html.includes('id="room-stage-canvas"'), false);

  // 保留 query 参数的跳转逻辑
  assert.equal(html.includes('window.location.replace'), true);
  assert.equal(html.includes('creative.html'), true);
  assert.equal(html.includes('URLSearchParams'), true);
});

test("resident message bubbles keep system/avatar rhythm readable", serial, async () => {
  const userCss = await fs.readFile(new URL("../styles.user.css", import.meta.url), "utf8");
  const systemAvatarBlock = userCss.match(
    /body\[data-shell-page="user"\] \.wechat-messages \.message-row\[data-message-kind="system"\] \.message-avatar\s*\{[^}]*\}/,
  )?.[0] || "";

  assert.match(userCss, /message-row\[data-message-kind="system"\][\s\S]*justify-content:\s*flex-start/);
  assert.match(systemAvatarBlock, /display:\s*grid\s*!important/);
  assert.doesNotMatch(systemAvatarBlock, /display:\s*none/);
  assert.match(userCss, /message-row\[data-grouped="true"\][\s\S]*\.message-avatar[\s\S]*visibility:\s*visible/);
  assert.match(userCss, /message-row\s*\{[^}]*margin:\s*0 0 clamp/);
});

```

## nonuser-shell-init.test.mjs direct open excerpt

```js
  }
});

test("admin direct open sends bearer token and switches to peer thread", serial, async () => {
  const app = await loadAdminShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651",
    gatewayBaseUrl: "http://127.0.0.1:50651",
    localStorageEntries: {
      "lobster-identity": "rsaga",
      "lobster-session-token": "lbst_test_session_token",
    },
  });
  try {
    const { document, fetchRequests } = app;
    const directPeerInput = document.querySelector("#direct-peer-input");
    const directForm = document.querySelector("#direct-open-form");

    assert.ok(directPeerInput);
    assert.ok(directForm);

    directPeerInput.value = "qa-peer";
    directForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    for (let i = 0; i < 8; i += 1) {
      await flushAsyncWork();
    }

    const directRequest = fetchRequests.find((request) =>
      request.url === "http://127.0.0.1:50651/v1/direct/open",
    );
    assert.equal(directRequest?.init?.headers?.Authorization, "Bearer lbst_test_session_token");

    const activeRoom = document.querySelector(".room-button.active");
    assert.match(activeRoom?.textContent || "", /qa-peer|正在与 qa-peer 聊天/);
    assert.match(document.querySelector("#governance-status")?.textContent || "", /私聊已就绪：qa-peer/);
  } finally {
    app.cleanup();
  }
});

```
