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

    assert.ok(fetchCalls.includes("http://127.0.0.1:50651/v1/shell/state?resident_id=rsaga"));
    assert.ok(eventSourceCalls.includes("http://127.0.0.1:50651/v1/shell/events?resident_id=rsaga"));
    assert.equal(composerInput?.disabled, false);
    assert.equal(document.querySelector("#resident-login-card")?.classList.contains("shell-hidden"), true);
  } finally {
    app.cleanup();
  }
});

test("gateway creative resident SSE reopens with state version wait cursor", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651",
    gatewayBaseUrl: "http://127.0.0.1:50651",
    localStorageEntries: { "lobster-identity": "rsaga" },
  });
  try {
    const { eventSourceCalls, emitEventSource } = app;
    assert.equal(eventSourceCalls.at(-1), "http://127.0.0.1:50651/v1/shell/events?resident_id=rsaga");

    const payload = JSON.parse(
      await fs.readFile(new URL("../generated/state.contract.json", import.meta.url), "utf8"),
    );
    payload.state_version = "shell:v1:test";
    emitEventSource("shell-state", payload);
    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(
      eventSourceCalls.at(-1),
      "http://127.0.0.1:50651/v1/shell/events?resident_id=rsaga&after=shell%3Av1%3Atest&wait_ms=4000",
    );
  } finally {
    app.cleanup();
  }
});

test("gateway creative resident send clears composer and posts once", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651",
    gatewayBaseUrl: "http://127.0.0.1:50651",
    localStorageEntries: {
      "lobster-identity": "qa2",
    },
  });
  try {
    const { document, fetchCalls } = app;
    const composerForm = document.querySelector("#composer");
    const composerInput = document.querySelector("#composer-input");
    assert.ok(composerForm);
    assert.ok(composerInput);
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

test("gateway creative resident shell keeps visitor scoped and blocks sending before login", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651",
    gatewayBaseUrl: "http://127.0.0.1:50651",
  });
  try {
    const { document, fetchCalls, eventSourceCalls } = app;
    const composerInput = document.querySelector("#composer-input");
    const composerSend = document.querySelector("#composer-send");
    const loginCard = document.querySelector("#resident-login-card");

    assert.ok(fetchCalls.includes("http://127.0.0.1:50651/v1/shell/state?resident_id=%E8%AE%BF%E5%AE%A2"));
    assert.ok(eventSourceCalls.includes("http://127.0.0.1:50651/v1/shell/events?resident_id=%E8%AE%BF%E5%AE%A2"));
    assert.equal(composerInput?.disabled, true);
    assert.equal(composerSend?.disabled, true);
    assert.match(composerInput?.placeholder || "", /请先登录后发送/);
    assert.equal(loginCard?.classList.contains("shell-hidden"), false);
  } finally {
    app.cleanup();
  }
});

test("gateway creative resident login makes email OTP the explicit default path", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
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

test("creative resident shell can hydrate from conversation_shell and scene_render without legacy rooms", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
  });
  try {
    const { document } = app;
    const activeRoom = document.querySelector(".room-button.active");
    const roomStageTitle = document.querySelector("#room-stage-title");
    const roomStageNote = document.querySelector(".conversation-stage-note");
    const portraitCanvas = document.querySelector("#room-stage-portrait-canvas");
    const summaryTitle = document.querySelector("#chat-detail-summary-title");
    const summaryCopy = document.querySelector("#chat-detail-summary-copy");
    const mastheadTitle = document.querySelector("#masthead-title");
    const roomStageSide = document.querySelector(".conversation-stage-side");
    const cardTitle = document.querySelector("#chat-detail-card-title");
    const cardMeta = document.querySelector("#chat-detail-card-meta");
    const cardActions = document.querySelector("#chat-detail-card-actions");
    const chatDetailContent = document.querySelector("#chat-detail-content");
    const cardWorkflowButton = Array.from(cardActions?.querySelectorAll("button") || []).find(
      (node) => /合同跟进委托|跟进委托/.test(node.textContent || ""),
    );
    const cardAdvanceButton = Array.from(cardActions?.querySelectorAll("button") || []).find(
      (node) => /合同标记已回执|标记已回执|已回执/.test(node.textContent || ""),
    );
    const activeRoomInlineActions = activeRoom?.querySelector(".room-inline-actions");
    const activeRoomInlinePrimary = activeRoomInlineActions?.querySelector(
      '.room-inline-action[data-room-inline-role="primary"]',
    );
    const activeRoomInlineSecondary = activeRoomInlineActions?.querySelector(
      '.room-inline-action[data-room-inline-role="secondary"]',
    );
    const conversationOverview = document.querySelector(".conversation-overview");
    const overviewProgress = conversationOverview?.querySelector(".workflow-progress");
    const overviewActions = conversationOverview?.querySelector(".overview-actions");
    const overviewActionButton = Array.from(overviewActions?.querySelectorAll("button") || []).find(
      (node) => /合同跟进委托|跟进委托/.test(node.textContent || ""),
    );

    assert.ok(activeRoom);
    assert.match(activeRoom.textContent || "", /合同线程标题 · 广场群聊/);
    assert.match(activeRoom.textContent || "", /合同广场/);
    assert.match(activeRoom.querySelector(".room-kicker")?.textContent || "", /跨城共响回廊/);
    assert.match(activeRoom.querySelector(".room-sub")?.textContent || "", /合同列表摘要 · 3 人 · 2 条消息/);
    assert.match(activeRoom.querySelector(".room-status-line")?.textContent || "", /合同状态行 · 回廊直连/);
    assert.match(summaryTitle?.textContent || "", /合同广场/);
    assert.match(summaryCopy?.textContent || "", /合同字段已经可以直接驱动/);
    assert.match(mastheadTitle?.textContent || "", /公共频道|群聊现场/);
    assert.match(roomStageTitle?.textContent || "", /合同回廊主舞台/);
    assert.match(roomStageNote?.textContent || "", /直接来自 scene_render 合同/);
    assert.equal(portraitCanvas?.dataset?.monogram, "合");
    assert.match(roomStageSide?.textContent || "", /合同巡视犬/);
    assert.match(roomStageSide?.textContent || "", /合同角色卡/);
    assert.match(roomStageSide?.textContent || "", /在线巡视 · 回廊值守/);
    assert.match(cardTitle?.textContent || "", /合同巡视犬/);
    assert.match(cardMeta?.textContent || "", /频道巡视|在线巡视/);
    assert.match(cardActions?.textContent || "", /私聊/);
    assert.match(cardActions?.textContent || "", /委托/);
    assert.match(cardActions?.textContent || "", /交易/);
    assert.match(chatDetailContent?.textContent || "", /自动回复|短期记忆|回廊/);
    assert.ok(activeRoomInlineActions);
    assert.match(activeRoomInlinePrimary?.textContent || "", /合同跟进委托/);
    assert.match(activeRoomInlineSecondary?.textContent || "", /合同标记已回执/);
    assert.ok(cardWorkflowButton);
    assert.equal(cardWorkflowButton?.textContent, "合同跟进委托");
    assert.ok(cardAdvanceButton);
    assert.equal(cardAdvanceButton?.textContent, "合同标记已回执");
    assert.ok(overviewActionButton);
    assert.equal(overviewActionButton?.textContent, "合同跟进委托");
    assert.match(overviewProgress?.textContent || "", /待回执/);
    assert.match(overviewProgress?.textContent || "", /已回执/);
  } finally {
    app.cleanup();
  }
});

test("contract action templates override local defaults for card and workflow actions", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
  });
  try {
    const { document } = app;
    const composerInput = document.querySelector("#composer-input");
    const composerSend = document.querySelector("#composer-send");
    const entrustButton = document.querySelector('[data-card-action="委托"]');

    assert.ok(composerInput);
    assert.ok(composerSend);
    assert.ok(entrustButton);

    entrustButton.click();
    await flushAsyncWork();

    assert.equal(
      composerInput?.value,
      ["合同委托：", "- 合同需求：", "- 合同截止：", "- 合同交付："].join("\n"),
    );
    assert.equal(composerSend?.textContent, "合同发单");
    assert.notEqual(composerSend?.textContent, "发出委托");
    assert.doesNotMatch(composerInput?.value || "", /- 需求：/);

    const repliedStage = Array.from(
      document.querySelectorAll(".workflow-progress-step"),
    ).find((node) => node?.dataset?.stageLabel === "已回执" || /已回执/.test(node?.textContent || ""));
    assert.ok(repliedStage);

    repliedStage.dispatchEvent(new Event("click", { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    assert.equal(
      composerInput?.value,
      ["合同委托回执：", "- 合同回执：", "- 合同待确认：", "- 合同下一步："].join("\n"),
    );
    assert.doesNotMatch(composerInput?.value || "", /- 回执：/);
  } finally {
    app.cleanup();
  }
});

test("contract hydration ignores legacy-only rooms when conversation_shell exists", serial, async () => {
  const app = await loadUserShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract-legacy-shadow.json",
  });
  try {
    const { document } = app;
    const roomButtons = Array.from(document.querySelectorAll(".room-button"));

    assert.equal(roomButtons.length, 1);
    assert.match(roomButtons[0]?.textContent || "", /合同入口广场/);
    assert.match(document.querySelector(".room-button.active")?.textContent || "", /合同入口广场/);
    assert.equal(document.body.textContent.includes("旧影子会话"), false);
  } finally {
    app.cleanup();
  }
});

test("creative resident shell public detail-card fallback prefers thread headline over raw room title", serial, async () => {
  const baseFixtureUrl = new URL("../generated/state.contract.json", import.meta.url);
  const tempFixtureName = `state.contract.public-fallback-${process.pid}-${Date.now()}.json`;
  const tempFixtureUrl = new URL(`../generated/${tempFixtureName}`, import.meta.url);
  const payload = JSON.parse(await fs.readFile(baseFixtureUrl, "utf8"));
  const publicConversation = payload?.conversation_shell?.conversations?.find((item) =>
    /广场群聊/.test(item?.thread_headline || ""),
  );

  assert.ok(publicConversation);
  publicConversation.detail_card = null;
  publicConversation.caretaker = null;
  await fs.writeFile(tempFixtureUrl, JSON.stringify(payload, null, 2), "utf8");

  try {
    const app = await loadUserShellApp({
      useGeneratedFixtures: true,
      generatedShellFixture: `generated/${tempFixtureName}`,
    });
    try {
      const { document } = app;
      const cardTitle = document.querySelector("#chat-detail-card-title");
      const cardMeta = document.querySelector("#chat-detail-card-meta");

      assert.match(cardTitle?.textContent || "", /公共频道 \/ 当前状态/);
      assert.match(cardMeta?.textContent || "", /合同线程标题 · 广场群聊/);
      assert.doesNotMatch(cardMeta?.textContent || "", /合同入口广场/);
    } finally {
      app.cleanup();
    }
  } finally {
    await fs.unlink(tempFixtureUrl).catch(() => {});
  }
});

test("contract thread headline can drive overview when overview summary is absent", serial, async () => {
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
    builderRoom.click();
    await flushAsyncWork();

    const overviewSummaries = Array.from(
      document.querySelectorAll(".overview-summary"),
    ).map((node) => node.textContent || "");

    assert.ok(
      overviewSummaries.some((text) => /合同线程标题 · 居所直聊/.test(text)),
    );
  } finally {
    app.cleanup();
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
