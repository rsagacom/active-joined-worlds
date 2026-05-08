import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { stat } from "node:fs/promises";

const PORT = 9885;
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

const outputDir = new URL(
  "../../output/playwright/visual-qa-20260430-daynight/",
  import.meta.url,
).pathname;
await mkdir(outputDir, { recursive: true });

const desktop = { width: 1280, height: 800 };

const browser = await chromium.launch();

async function screenshotDayNight(mode) {
  const context = await browser.newContext({ viewport: desktop });
  const page = await context.newPage();

  // Intercept network requests to log which image asset is loaded
  const loadedImages = [];
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("world-square-concept")) {
      loadedImages.push(url);
    }
  });

  await page.goto(`http://localhost:${PORT}/world-square.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  // Force day or night mode
  await page.evaluate((m) => {
    document.body.dataset.timeOfDay = m;
  }, mode);

  // Wait for CSS background to switch and any new image to load
  await page.waitForTimeout(600);

  const filePath = `${outputDir}world-square-${mode}.png`;
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`saved ${filePath}`);
  console.log(`  loaded assets (${mode}):`, loadedImages.join(", ") || "(none intercepted)");

  await context.close();
}

await screenshotDayNight("day");
await screenshotDayNight("night");

await browser.close();
server.close();
console.log(`done -> ${outputDir}`);
