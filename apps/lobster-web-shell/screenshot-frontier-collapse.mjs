import { chromium, devices } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { stat } from "node:fs/promises";

const PORT = 9883;
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
  "../../output/playwright/visual-qa-20260427-frontier-collapse/",
  import.meta.url,
).pathname;
await mkdir(outputDir, { recursive: true });

const desktop = { width: 1280, height: 800 };
const mobile = devices["iPhone 14"];

const browser = await chromium.launch();

async function screenshot(pageName, label, ctxOptions) {
  const context = await browser.newContext(ctxOptions);
  const page = await context.newPage();
  const urlPath = pageName === "hub" ? "/index.html" : `/${pageName}.html`;
  await page.goto(`http://localhost:${PORT}${urlPath}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const filePath = `${outputDir}${pageName}-${label}.png`;
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`saved ${filePath}`);
  await context.close();
}

const targets = [
  ["hub", "desktop", { viewport: desktop }],
  ["hub", "mobile", { ...mobile }],
  ["creative", "desktop", { viewport: desktop }],
  ["creative", "mobile", { ...mobile }],
  ["unified", "desktop", { viewport: desktop }],
  ["unified", "mobile", { ...mobile }],
];

for (const [name, label, opts] of targets) {
  await screenshot(name, label, opts);
}

await browser.close();
server.close();
console.log(`done -> ${outputDir}`);
