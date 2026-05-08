import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { stat } from "node:fs/promises";

const PORT = 9878;
const ROOT = new URL(".", import.meta.url).pathname;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = resolve(ROOT, "." + url.pathname);
  if (url.pathname === "/") filePath = resolve(ROOT, "creative.html");
  try {
    const s = await stat(filePath);
    if (s.isDirectory()) filePath = resolve(filePath, "index.html");
    const data = await readFile(filePath);
    const type = MIME[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

await new Promise((r) => server.listen(PORT, r));
console.log(`Server running on http://localhost:${PORT}`);

const browser = await chromium.launch();
const outputDir = "output/playwright/visual-qa-20260421-sfc-wechat/";

async function screenshot(name, viewport) {
  const context = await browser.newContext(viewport ? { viewport } : {});
  const page = await context.newPage();
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const path = `${outputDir}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`Screenshot: ${path}`);
  await context.close();
}

await screenshot("creative-desktop", { width: 1280, height: 800 });
await screenshot("creative-mobile", { width: 390, height: 844 });

await browser.close();
server.close();
console.log("Done");
