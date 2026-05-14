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

const CASES = [
  {
    name: "creative narrow desktop",
    path: "/creative.html",
    viewport: { width: 1259, height: 872 },
    rail: "#creative-rail",
    stage: ".creative-stage",
    expectedRailWidth: 220,
    matchStageHeightToRail: true,
  },
  {
    name: "creative wide desktop",
    path: "/creative.html",
    viewport: { width: 1560, height: 873 },
    rail: "#creative-rail",
    stage: ".creative-stage",
    expectedRailWidth: 220,
    matchStageHeightToRail: true,
  },
  {
    name: "public square desktop",
    path: "/index.html",
    viewport: { width: 1560, height: 873 },
    rail: ".public-square-rail",
    stage: ".public-square-stage",
    expectedRailWidth: 220,
    matchStageHeightToRail: true,
  },
  {
    name: "world square desktop",
    path: "/world-square.html",
    viewport: { width: 1920, height: 755 },
    rail: ".world-square-rail",
    stage: ".world-square-stage",
    expectedRailWidth: 220,
    matchStageHeightToRail: true,
  },
];

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

function assertNear(actual, expected, tolerance, label) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

async function measureCase(page, baseUrl, item) {
  await page.setViewportSize(item.viewport);
  await page.goto(`${baseUrl}${item.path}?verify=scene-layout`, { waitUntil: "networkidle" });
  return page.evaluate(({ rail, stage }) => {
    const box = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return {
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
      };
    };
    return {
      rail: box(rail),
      stage: box(stage),
    };
  }, item);
}

const server = createStaticServer();
const address = await listen(server);
const baseUrl = `http://${address.address}:${address.port}`;
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  for (const item of CASES) {
    const result = await measureCase(page, baseUrl, item);
    if (!result.rail || !result.stage) {
      throw new Error(`${item.name}: missing rail or stage element`);
    }
    assertNear(result.rail.width, item.expectedRailWidth, 1, `${item.name} rail width`);
    if (item.matchStageHeightToRail) {
      assertNear(result.stage.height, result.rail.height, 1, `${item.name} stage height`);
    }
    console.log(`${item.name}: rail ${result.rail.width}x${result.rail.height}, stage ${result.stage.width}x${result.stage.height}`);
  }
} finally {
  await browser.close();
  await close(server);
}
