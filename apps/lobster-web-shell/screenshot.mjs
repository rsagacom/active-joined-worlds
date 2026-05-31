import { chromium, devices } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { stat } from "node:fs/promises";

const PORT = 9876;
const ROOT = new URL(".", import.meta.url).pathname;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = resolve(ROOT, "." + url.pathname);
  if (url.pathname === "/") filePath = resolve(ROOT, "index.html");
  try {
    const s = await stat(filePath);
    if (s.isDirectory()) {
      filePath = resolve(filePath, "index.html");
    }
    const data = await readFile(filePath);
    const type = MIME[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

await new Promise((r) => server.listen(PORT, r));
console.log(`Server running on http://localhost:${PORT}`);

const browser = await chromium.launch();

const desktop = { width: 1280, height: 800 };
const mobile = devices["iPhone 14"];

const outputDir = new URL("../../output/playwright/visual-qa-20260421-sfc-wechat/", import.meta.url).pathname;

async function screenshot(pageName, viewport, device) {
  const context = await browser.newContext(device ? { ...device } : { viewport });
  const page = await context.newPage();
  const urlPath = pageName === "hub" ? "/" : `/${pageName}.html`;
  await page.goto(`http://localhost:${PORT}${urlPath}`, { waitUntil: "networkidle" });
  // Wait for canvas to render
  await page.waitForTimeout(800);

  // Debug: check composer-context and conversation-overview visibility on hub mobile
  if (pageName === "hub" && device) {
    const debug = await page.evaluate(() => {
      const cc = document.querySelector(".composer-context");
      const co = document.querySelector(".conversation-overview");
      return {
        composerContextExists: !!cc,
        composerContextDisplay: cc ? getComputedStyle(cc).display : null,
        composerContextVisible: cc ? cc.getBoundingClientRect().height > 0 : false,
        conversationOverviewExists: !!co,
        conversationOverviewDisplay: co ? getComputedStyle(co).display : null,
        conversationOverviewVisible: co ? co.getBoundingClientRect().height > 0 : false,
        viewportWidth: window.innerWidth,
      };
    });
    console.log("HUB MOBILE DEBUG:", JSON.stringify(debug, null, 2));
  }

  // Debug: check creative page hidden elements
  if (pageName === "creative") {
    const debug = await page.evaluate(() => {
      const tip = document.querySelector(".composer-tip");
      const chip = document.querySelector(".stage-chip");
      const worldSquareEl = Array.from(document.querySelectorAll("*")).find(
        el => el.textContent?.trim() === "世界广场" && el.children.length === 0
      );
      return {
        composerTipExists: !!tip,
        composerTipDisplay: tip ? getComputedStyle(tip).display : null,
        composerTipVisible: tip ? tip.getBoundingClientRect().height > 0 : false,
        stageChipExists: !!chip,
        stageChipDisplay: chip ? getComputedStyle(chip).display : null,
        stageChipVisible: chip ? chip.getBoundingClientRect().height > 0 : false,
        worldSquareTag: worldSquareEl ? worldSquareEl.tagName : null,
        worldSquareClass: worldSquareEl ? worldSquareEl.className : null,
        worldSquareParent: worldSquareEl ? worldSquareEl.parentElement?.className : null,
      };
    });
    console.log("CREATIVE DEBUG:", JSON.stringify(debug, null, 2));
  }

  const suffix = device ? "mobile" : "desktop";
  const path = `${outputDir}/${pageName}-${suffix}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`Screenshot: ${path}`);
  await context.close();
}

await screenshot("hub", desktop, null);
await screenshot("hub", null, mobile);
await screenshot("user", desktop, null);
await screenshot("user", null, mobile);
await screenshot("creative", desktop, null);
await screenshot("creative", null, mobile);

await browser.close();
server.close();
console.log("Done");
