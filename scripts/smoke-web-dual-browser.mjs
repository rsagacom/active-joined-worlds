#!/usr/bin/env node
import { spawn } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import { access, mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB_ROOT = path.join(ROOT_DIR, "apps", "lobster-web-shell");
const HOST = process.env.HOST || "127.0.0.1";
const KEEP_STATE = process.env.KEEP_STATE === "1";
const SKIP_BUILD = process.env.SKIP_BUILD === "1";
const GATEWAY_BIN =
  process.env.GATEWAY_BIN || path.join(ROOT_DIR, "target", "debug", "lobster-waku-gateway");

function spawnChecked(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: ROOT_DIR,
    stdio: options.stdio || ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...(options.env || {}) },
  });
  child.stdout?.on("data", (chunk) => {
    if (options.prefix) process.stdout.write(`${options.prefix}${chunk}`);
  });
  child.stderr?.on("data", (chunk) => {
    if (options.prefix) process.stderr.write(`${options.prefix}${chunk}`);
  });
  return child;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT_DIR, stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, HOST, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

async function waitForHttp(url, attempts = 80) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Keep waiting until the process opens its listener.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`timed out waiting for ${url}`);
}

async function assertExecutable(filePath, label) {
  try {
    await access(filePath, fsConstants.X_OK);
  } catch (error) {
    throw new Error(`${label} binary not found or not executable: ${filePath}`, { cause: error });
  }
}

async function terminate(child) {
  if (!child || child.killed) return;
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      resolve();
    }, 2000);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function selectPublicRoom(page) {
  const buttons = page.locator(".room-button");
  const count = await buttons.count();
  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    const text = await button.textContent();
    if (!/世界广场|主城|公共|群聊|WORLD_RUNNING_SESSION/.test(text || "")) continue;
    if (!(await button.isVisible())) continue;
    if ((await button.getAttribute("aria-pressed")) === "true" || (await button.evaluate((node) => node.classList.contains("active")))) {
      return;
    }
    await button.click();
    return;
  }
}

async function submitComposer(page, text) {
  const input = page.locator("#composer-input");
  await input.waitFor({ state: "visible", timeout: 8000 });
  try {
    await input.waitFor({ state: "attached", timeout: 1000 });
    await page.waitForFunction(() => !document.querySelector("#composer-input")?.disabled, null, {
      timeout: 8000,
    });
  } catch (error) {
    const debug = await page.evaluate(() => ({
      href: window.location.href,
      bodyDataset: { ...document.body.dataset },
      gatewayState: document.querySelector("#gateway-state")?.textContent || "",
      hudStatus: document.querySelector("#hud-status")?.textContent || "",
      composerLabel: document.querySelector("#composer-input")?.getAttribute("aria-label") || "",
      composerPlaceholder: document.querySelector("#composer-input")?.getAttribute("placeholder") || "",
      room: document.querySelector(".room-button.active")?.textContent || "",
    }));
    throw new Error(`composer did not become editable: ${JSON.stringify(debug)}`, { cause: error });
  }
  await input.fill(text);
  await page.locator("#composer").evaluate((form) => {
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
      return;
    }
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await page.waitForFunction(() => document.querySelector("#composer-input")?.value === "", null, {
    timeout: 8000,
  });
}

async function failNextMessagePost(page) {
  let failed = false;
  await page.route("**/v1/shell/message", async (route, request) => {
    if (!failed && request.method() === "POST") {
      failed = true;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify({ Error: { message: "smoke forced message failure" } }),
      });
      return;
    }
    await route.fallback();
  });
}

async function expectMessageSide(page, text, side) {
  await page.waitForFunction(
    ({ expectedText, expectedSide }) => {
      const rows = Array.from(document.querySelectorAll(".message-row"));
      return rows.some((row) => {
        if (!(row.textContent || "").includes(expectedText)) return false;
        if (row.getAttribute("data-message-side") !== expectedSide) return false;
        return !row.querySelector(".message-pending, .message-pending-failed");
      });
    },
    { expectedText: text, expectedSide: side },
    { timeout: 10000 },
  );
}

async function expectFailedPendingMessage(page, text) {
  await page.waitForFunction(
    ({ expectedText }) => {
      const rows = Array.from(document.querySelectorAll(".message-row"));
      return rows.some((row) => {
        if (row.getAttribute("data-message-side") !== "self") return false;
        if (!(row.textContent || "").includes(expectedText)) return false;
        return Boolean(row.querySelector(".message-pending-failed [data-pending-action='retry'], .message-pending-failed + [data-pending-action='retry'], .message-pending-failed"));
      });
    },
    { expectedText: text },
    { timeout: 10000 },
  );
}

async function clickPendingRetry(page, text) {
  await page.waitForFunction(
    ({ expectedText }) => {
      const rows = Array.from(document.querySelectorAll(".message-row"));
      const row = rows.find((candidate) => {
        if (candidate.getAttribute("data-message-side") !== "self") return false;
        if (!(candidate.textContent || "").includes(expectedText)) return false;
        return Boolean(candidate.querySelector('[data-pending-action="retry"]'));
      });
      row?.querySelector('[data-pending-action="retry"]')?.click();
      return Boolean(row);
    },
    { expectedText: text },
    { timeout: 10000 },
  );
}

async function expectEditedMessage(page, editedText, side) {
  await page.waitForFunction(
    ({ expectedText, expectedSide }) => {
      const rows = Array.from(document.querySelectorAll(".message-row"));
      return rows.some((row) => {
        if (row.getAttribute("data-message-side") !== expectedSide) return false;
        if (!(row.textContent || "").includes(expectedText)) return false;
        return Boolean(row.querySelector(".message-edited"));
      });
    },
    { expectedText: editedText, expectedSide: side },
    { timeout: 10000 },
  );
}

async function clickMessageAction(page, text, side, action) {
  await page.waitForFunction(
    ({ expectedText, expectedSide, expectedAction }) => {
      const rows = Array.from(document.querySelectorAll(".message-row"));
      const row = rows.find((candidate) => {
        if (candidate.getAttribute("data-message-side") !== expectedSide) return false;
        if (!(candidate.textContent || "").includes(expectedText)) return false;
        return Boolean(candidate.querySelector(`[data-message-action="${expectedAction}"]`));
      });
      row?.querySelector(`[data-message-action="${expectedAction}"]`)?.click();
      return Boolean(row);
    },
    { expectedText: text, expectedSide: side, expectedAction: action },
    { timeout: 10000 },
  );
}

async function expectRecalledMessage(page, { previousText, side }) {
  await page.waitForFunction(
    ({ hiddenText, expectedSide }) => {
      const rows = Array.from(document.querySelectorAll(".message-row"));
      const sideRows = rows.filter((row) => row.getAttribute("data-message-side") === expectedSide);
      const previousStillVisible = sideRows.some((row) => (row.textContent || "").includes(hiddenText));
      if (previousStillVisible) return false;
      return sideRows.some((row) => {
        const body = row.querySelector(".message-body");
        return body?.classList.contains("message-body-recalled") && body.textContent === "消息已撤回";
      });
    },
    { hiddenText: previousText, expectedSide: side },
    { timeout: 10000 },
  );
}

async function main() {
  if (!SKIP_BUILD) {
    await run("cargo", ["build", "--manifest-path", path.join(ROOT_DIR, "Cargo.toml"), "-p", "lobster-waku-gateway"]);
  }

  await assertExecutable(GATEWAY_BIN, "gateway");
  const { chromium } = await import("playwright");

  const stateRoot = await mkdtemp(path.join(os.tmpdir(), "lobster-web-dual-browser."));
  const gatewayPort = await freePort();
  const webPort = await freePort();
  const gatewayUrl = `http://${HOST}:${gatewayPort}`;
  const webUrl = `http://${HOST}:${webPort}`;
  let gateway = null;
  let web = null;
  let browser = null;

  try {
    gateway = spawnChecked(GATEWAY_BIN, [
      "--host",
      HOST,
      "--port",
      String(gatewayPort),
      "--state-dir",
      path.join(stateRoot, "gateway"),
    ], { env: { LOBSTER_DEV_AUTH_BYPASS: "1" } });
    await waitForHttp(`${gatewayUrl}/health`);

    web = spawnChecked("python3", [
      "-m",
      "http.server",
      String(webPort),
      "--bind",
      HOST,
      "--directory",
      WEB_ROOT,
    ]);
    await waitForHttp(`${webUrl}/`);

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const indexPage = await context.newPage();
    const creativePage = await context.newPage();
    const browserDiagnostics = [];
    let expectedBrowser503s = 0;
    for (const [label, page] of [["index", indexPage], ["creative", creativePage]]) {
      page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") {
          if (message.type() === "error" && message.text().includes("503") && expectedBrowser503s > 0) {
            expectedBrowser503s -= 1;
            console.error(`[${label} expected error] ${message.text()}`);
            return;
          }
          const diagnostic = `[${label} ${message.type()}] ${message.text()}`;
          browserDiagnostics.push(diagnostic);
          console.error(diagnostic);
        }
      });
      page.on("pageerror", (error) => {
        const diagnostic = `[${label} pageerror] ${error.message}`;
        browserDiagnostics.push(diagnostic);
        console.error(diagnostic);
      });
      page.on("requestfailed", (request) => {
        const diagnostic = `[${label} requestfailed] ${request.url()} ${request.failure()?.errorText || ""}`;
        browserDiagnostics.push(diagnostic);
        console.error(diagnostic);
      });
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
    }
    const stamp = Date.now();
    const textA = `BROWSER_DUAL_A_${stamp}`;
    const editedTextA = `BROWSER_DUAL_A_EDITED_${stamp}`;
    const textB = `BROWSER_DUAL_B_${stamp}`;
    const retryText = `BROWSER_DUAL_RETRY_${stamp}`;

    await indexPage.goto(`${webUrl}/index.html?gateway=${encodeURIComponent(gatewayUrl)}&identity=qa-a&qa=browser`);
    await creativePage.goto(`${webUrl}/creative.html?gateway=${encodeURIComponent(gatewayUrl)}&identity=qa-b&qa=browser`);
    await selectPublicRoom(indexPage);
    await selectPublicRoom(creativePage);

    await submitComposer(indexPage, textA);
    await expectMessageSide(indexPage, textA, "self");
    await expectMessageSide(creativePage, textA, "peer");
    await clickMessageAction(indexPage, textA, "self", "edit");
    await submitComposer(indexPage, editedTextA);
    await expectEditedMessage(indexPage, editedTextA, "self");
    await expectEditedMessage(creativePage, editedTextA, "peer");
    await clickMessageAction(indexPage, editedTextA, "self", "recall");
    await expectRecalledMessage(indexPage, { previousText: editedTextA, side: "self" });
    await expectRecalledMessage(creativePage, { previousText: editedTextA, side: "peer" });

    await submitComposer(creativePage, textB);
    await expectMessageSide(creativePage, textB, "self");
    await expectMessageSide(indexPage, textB, "peer");

    expectedBrowser503s = 1;
    await failNextMessagePost(indexPage);
    await submitComposer(indexPage, retryText);
    await expectFailedPendingMessage(indexPage, retryText);
    await clickPendingRetry(indexPage, retryText);
    await expectMessageSide(indexPage, retryText, "self");
    await expectMessageSide(creativePage, retryText, "peer");

    if (browserDiagnostics.length > 0) {
      throw new Error(`browser diagnostics: ${browserDiagnostics.join(" | ")}`);
    }

    console.log("== web dual browser smoke passed ==");
    console.log(`gateway: ${gatewayUrl}`);
    console.log(`web: ${webUrl}`);
    console.log(`messages: ${textA}, ${editedTextA}, ${textB}, ${retryText}`);
  } finally {
    await browser?.close().catch(() => {});
    await terminate(web);
    await terminate(gateway);
    if (!KEEP_STATE) {
      await rm(stateRoot, { recursive: true, force: true });
    } else {
      console.log(`state retained: ${stateRoot}`);
    }
  }
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
