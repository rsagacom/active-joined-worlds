import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".avif", "image/avif"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
]);

function createStaticServer() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
      const candidate = path.resolve(rootDir, `.${pathname}`);
      if (!candidate.startsWith(rootDir)) {
        res.writeHead(403).end("Forbidden");
        return;
      }
      const body = await readFile(candidate);
      res.writeHead(200, {
        "content-type": MIME_TYPES.get(path.extname(candidate)) || "application/octet-stream",
      });
      res.end(body);
    } catch {
      res.writeHead(404).end("Not found");
    }
  });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve(server.address());
    });
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForApp(page) {
  await page.waitForSelector("#composer-input:not([disabled])", { timeout: 5000 });
  await page.waitForSelector('.scene-hotspot-label-chip[data-hotspot-title="吧台"]', { state: "attached", timeout: 5000 });
}

async function visibleOpacity(page, selector) {
  return Number(await page.locator(selector).evaluate((node) => getComputedStyle(node).opacity));
}

async function elementBox(page, selector) {
  const box = await page.locator(selector).boundingBox();
  assert(box, `missing element box: ${selector}`);
  return box;
}

async function verifyCreativeComposer(page, baseUrl) {
  await page.setViewportSize({ width: 1259, height: 872 });
  await page.goto(`${baseUrl}/creative.html?verify=frontend-realness`, { waitUntil: "networkidle" });
  await waitForApp(page);

  const input = page.locator("#composer-input");
  await input.fill("真实输入测试");
  assert(await input.inputValue() === "真实输入测试", "creative composer should show typed text");

  const textColor = await input.evaluate((node) => getComputedStyle(node).color);
  assert(!/rgba?\(0,\s*0,\s*0,\s*0\)/.test(textColor), "creative composer text must not be transparent");

  await input.press("Shift+Enter");
  assert((await input.inputValue()).includes("\n"), "Shift+Enter should keep a multiline draft");

  await input.fill("回车发送真实验收");
  await input.press("Enter");
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll("#timeline .message-body")).some((node) =>
      node.textContent?.includes("回车发送真实验收"),
    ),
    null,
    { timeout: 5000 },
  );
  assert(await input.inputValue() === "", "Enter send should clear the composer");
}

async function verifyCreativeHotspots(page, baseUrl) {
  await page.goto(`${baseUrl}/creative.html?verify=frontend-realness-hotspots`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    try {
      localStorage.clear();
    } catch {
      // Ignore storage restrictions in browser verification.
    }
  });
  await page.reload({ waitUntil: "networkidle" });
  await waitForApp(page);

  const coffeeLabel = '.scene-hotspot-label-chip[data-hotspot-title="吧台"]';
  assert(await visibleOpacity(page, coffeeLabel) === 0, "hotspot labels should not permanently cover the scene");

  await page.locator(".scene-hotspot--coffee").hover();
  await page.waitForFunction(
    (selector) => Number(getComputedStyle(document.querySelector(selector)).opacity) > 0.9,
    coffeeLabel,
    { timeout: 1000 },
  );
  assert(await visibleOpacity(page, coffeeLabel) > 0.9, "hotspot hover should reveal its label");

  await page.mouse.move(12, 12);
  await page.waitForTimeout(120);
  assert(await visibleOpacity(page, coffeeLabel) === 0, "hotspot label should hide after pointer leaves");

  const stage = await elementBox(page, ".creative-stage");
  await page.mouse.click(stage.x + stage.width * 0.58, stage.y + stage.height * 0.62);
  await page.waitForFunction(() => document.body.classList.contains("scene-hotspot-labels-visible"));
  await page.waitForFunction(() => document.body.classList.contains("scene-clear-mode"));
  await page.waitForFunction(
    (selector) => Number(getComputedStyle(document.querySelector(selector)).opacity) > 0.9,
    coffeeLabel,
    { timeout: 1000 },
  );
  assert(await visibleOpacity(page, coffeeLabel) > 0.9, "blank scene click should reveal all hotspot labels");
  await page.waitForFunction(
    (selector) => Number(getComputedStyle(document.querySelector(selector)).opacity) < 0.05,
    ".creative-chat-frame",
    { timeout: 1000 },
  );
  assert(await visibleOpacity(page, ".creative-chat-frame") < 0.05, "blank scene click should hide chat chrome");
}

async function verifySceneRails(page, baseUrl) {
  const cases = [
    { path: "/creative.html", rail: "#creative-rail", stage: ".creative-stage" },
    { path: "/index.html", rail: ".public-square-rail", stage: ".public-square-stage" },
    { path: "/world-square.html", rail: ".world-square-rail", stage: ".world-square-stage" },
  ];
  for (const item of cases) {
    await page.setViewportSize({ width: 1560, height: 873 });
    await page.goto(`${baseUrl}${item.path}?verify=frontend-realness`, { waitUntil: "networkidle" });
    const rail = await elementBox(page, item.rail);
    const stage = await elementBox(page, item.stage);
    assert(Math.abs(rail.width - 220) <= 1, `${item.path} rail width should stay on the shared 220px token`);
    assert(Math.abs(rail.height - stage.height) <= 1, `${item.path} rail and stage should align vertically`);
  }
}

async function verifyDayNightBackgrounds(page, baseUrl) {
  const cases = [
    { path: "/creative.html", selector: ".creative-stage", expected: "creative-room-scene-v2-day" },
    { path: "/index.html", selector: ".public-square-stage", expected: "hub-main-city-scene-v1-day" },
    { path: "/world-square.html", selector: ".world-square-scene", expected: "world-square-concept-day", pseudo: "::before" },
  ];

  for (const c of cases) {
    await page.setViewportSize({ width: 1560, height: 873 });
    await page.goto(`${baseUrl}${c.path}?verify=frontend-realness`, { waitUntil: "networkidle" });

    const timeOfDay = await page.evaluate(() => document.body?.dataset?.timeOfDay);
    assert(timeOfDay === "day" || timeOfDay === "night", `${c.path} body must have data-time-of-day`);

    let bg;
    if (c.pseudo) {
      bg = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return "not found";
        return getComputedStyle(el, "::before").backgroundImage;
      }, c.selector);
    } else {
      bg = await page.locator(c.selector).evaluate((node) => getComputedStyle(node).backgroundImage);
    }

    const expectedAsset = c.expected.replace("-day", timeOfDay === "day" ? "-day" : "");
    assert(bg.includes(expectedAsset), `${c.path} must load ${timeOfDay} background asset (${expectedAsset}), got: ${bg.slice(0, 120)}`);
  }
}

async function verifyAdminDs(page, baseUrl) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/admin-ds.html?verify=frontend-realness`, { waitUntil: "networkidle" });

  assert(await page.title() === "AJW聊天 · 管理后台", "admin-ds should be the formal admin page");
  await page.locator('[data-module="residents"]').click();
  await page.waitForFunction(() => document.querySelector("#mod-residents")?.classList.contains("active"));

  const search = page.locator("#residentSearch");
  await search.fill("chen");
  await page.waitForFunction(() => {
    const rows = Array.from(document.querySelectorAll("#residentTableBody tr"));
    return rows.length > 0 && rows.every((row) => /chen/i.test(row.textContent || ""));
  });
  assert(!(await page.locator('[data-admin-action="create-resident"]').isDisabled()), "admin-ds create-resident should be enabled now that Gateway write API exists");
  assert(/前端分页/.test(await page.locator("#mod-residents .ds-pagination-info").textContent()), "admin-ds pagination should be labeled as client-side pagination");
  var pageBtnCount = await page.locator("#mod-residents .ds-page-btn:not([disabled])").count();
  assert(pageBtnCount > 0, "admin-ds pagination should have at least one clickable page button");

  await page.locator("#residentTableBody tr").first().click();
  await page.waitForFunction(() => !document.querySelector("#dsDetailPanel")?.classList.contains("hidden"));
  assert(
    /居民:/.test(await page.locator("#dsDetailTitle").textContent()),
    "admin-ds detail panel should open from a resident row",
  );
  await page.locator("#dsDetailActions button", { hasText: "查看会话" }).click();
  await page.waitForFunction(() => document.querySelector("#mod-rooms")?.classList.contains("active"));
  await page.waitForFunction(() => document.querySelector("#dsDetailPanel")?.classList.contains("hidden"));

  await page.locator('[data-module="rooms"]').click();
  await page.waitForFunction(() => document.querySelector("#mod-rooms")?.classList.contains("active"));
  await page.locator("#roomTypeFilter").selectOption("private");
  await page.waitForFunction(() => {
    const rows = Array.from(document.querySelectorAll("#roomTableBody tr"));
    return rows.length > 0 && rows.every((row) => /私聊/.test(row.textContent || ""));
  });

  await page.setViewportSize({ width: 390, height: 820 });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector("#dsSidebar")?.classList.contains("collapsed"));
  await page.locator("#dsSidebarToggle").click();
  await page.waitForFunction(() => document.querySelector("#dsSidebarOverlay")?.classList.contains("show"));
  await page.locator("#dsSidebarOverlay").click();
  await page.waitForFunction(() => document.querySelector("#dsSidebar")?.classList.contains("collapsed"));
}

async function verifySceneHotspotSizes(page, baseUrl) {
  // 守护 ASSET_HANDOFF §5 四层契约：已四层化页面(index/creative/world-square)的透明命中区
  // 必须固定 64×34，禁止回灌 clamp(64px,8vw,108px) 或加大热点尺寸（2026-06-17 world-square
  // 桌面 108px 回归即由此类运行时尺寸断言捕获，静态 CSS 断言会被同选择器多处规则绕过）。
  const cases = [
    { path: "/index.html", label: "index" },
    { path: "/creative.html", label: "creative" },
    { path: "/world-square.html", label: "world-square" },
  ];
  const viewports = [
    { width: 1440, height: 900, name: "desktop" },
    { width: 390, height: 844, name: "mobile" },
  ];
  for (const vp of viewports) {
    for (const c of cases) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${baseUrl}${c.path}?verify=frontend-realness`, { waitUntil: "networkidle" });
      const sizes = await page.evaluate(() =>
        Array.from(document.querySelectorAll(".scene-hotspot")).map((n) => ({ w: n.offsetWidth, h: n.offsetHeight })),
      );
      assert(sizes.length > 0, `${c.label} [${vp.name}] should render scene hotspots`);
      for (const s of sizes) {
        assert(s.w === 64, `${c.label} [${vp.name}] hotspot width must be fixed 64px (ASSET_HANDOFF §5), got ${s.w}`);
        assert(s.h === 34, `${c.label} [${vp.name}] hotspot height must be 34px, got ${s.h}`);
      }
    }
  }
}

async function verifyNoJavascriptErrors(page, baseUrl) {
  // 守护所有 shell 页面桌面+移动加载无未捕获 JS 异常（如 admin ensureConversationCallout
  // insertBefore 无 parentElement 守卫导致的 DOMException 崩溃，2026-06-17 修复）。
  const pages = [
    { path: "/index.html", label: "index" },
    { path: "/creative.html", label: "creative" },
    { path: "/world-square.html", label: "world-square" },
    { path: "/unified.html", label: "unified" },
    { path: "/admin.html", label: "admin" },
    { path: "/admin-ds.html", label: "admin-ds" },
  ];
  const viewports = [
    { width: 1440, height: 900, name: "desktop" },
    { width: 390, height: 844, name: "mobile" },
  ];
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  for (const vp of viewports) {
    for (const p of pages) {
      errors.length = 0;
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${baseUrl}${p.path}?verify=frontend-realness`, { waitUntil: "networkidle" }).catch(() => {});
      await page.waitForTimeout(400);
      assert(
        errors.length === 0,
        `${p.label} [${vp.name}] must load without uncaught JS errors: ${errors.join(" | ").slice(0, 240)}`,
      );
    }
  }
}

const server = createStaticServer();
const address = await listen(server);
const baseUrl = `http://${address.address}:${address.port}`;
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  await verifyCreativeComposer(page, baseUrl);
  await verifyCreativeHotspots(page, baseUrl);
  await verifySceneRails(page, baseUrl);
  await verifyDayNightBackgrounds(page, baseUrl);
  await verifyAdminDs(page, baseUrl);
  await verifySceneHotspotSizes(page, baseUrl);
  await verifyNoJavascriptErrors(page, baseUrl);
  console.log("frontend realness: composer, hotspot labels, shared scene rails, day/night backgrounds, formal admin, fixed hotspot sizes (64x34) and zero uncaught JS errors passed");
} finally {
  await browser.close();
  await close(server);
}
