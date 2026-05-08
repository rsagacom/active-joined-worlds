import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = new URL('apps/lobster-web-shell/', import.meta.url).pathname;
const port = 9878;

const mime = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.mjs': 'application/javascript', '.avif': 'image/avif', '.png': 'image/png',
};

const server = createServer(async (req, res) => {
  let path = req.url.split('?')[0];
  const file = join(root, path);
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    res.writeHead(404); res.end('Not found');
  }
});

await new Promise(r => server.listen(port, r));
const browser = await chromium.launch();

for (const { name, vw, vh } of [
  { name: 'user-desktop-v2', vw: 1440, vh: 900 },
  { name: 'user-mobile-v2', vw: 390, vh: 844 },
]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh } });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${port}/user.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(root, 'screenshots', `${name}.png`), fullPage: false });
  await ctx.close();
  console.log(`Screenshot: ${name}.png`);
}

await browser.close();
server.close();
