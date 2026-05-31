import { chromium, devices } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { stat } from "node:fs/promises";

const PORT = 9882;
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
  ".avif": "image/avif",
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

const browser = await chromium.launch();
const desktop = { width: 1280, height: 800 };
const mobile = devices["iPhone 14"];
const outputDir = new URL("../../output/playwright/pixel-im-polish/", import.meta.url).pathname;

async function screenshot(pageName, viewport, device, suffix) {
  const context = await browser.newContext(device ? { ...device } : { viewport });
  const page = await context.newPage();
  const urlPath = pageName === "hub" ? "/" : `/${pageName}.html`;
  await page.goto(`http://localhost:${PORT}${urlPath}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const path = `${outputDir}/${pageName}-${suffix}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`Screenshot: ${path}`);
  await context.close();
}

await screenshot("creative", desktop, null, "desktop");
await screenshot("index", desktop, null, "desktop");
await screenshot("unified", desktop, null, "desktop");
await screenshot("unified", null, mobile, "mobile");
await screenshot("user", desktop, null, "desktop");
await screenshot("user", null, mobile, "mobile");
await screenshot("admin", desktop, null, "desktop");
await screenshot("admin", null, mobile, "mobile");

await browser.close();
server.close();
console.log("Done");
