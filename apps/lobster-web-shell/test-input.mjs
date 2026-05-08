import { chromium, devices } from "playwright";

async function testInput(pageName, device) {
  const browser = await chromium.launch();
  const context = await browser.newContext(device ? { ...device } : { viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const urlPath = pageName === "hub" ? "http://localhost:9876/" : `http://localhost:9876/${pageName}.html`;
  await page.goto(urlPath, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  
  const input = page.locator("#composer-input");
  await input.click();
  await input.fill("测试输入功能");
  await page.waitForTimeout(200);
  
  const value = await input.inputValue();
  const isEnabled = await input.isEnabled();
  const box = await input.boundingBox();
  
  console.log(`${pageName} ${device ? 'mobile' : 'desktop'}:`);
  console.log(`  value: "${value}"`);
  console.log(`  enabled: ${isEnabled}`);
  console.log(`  height: ${box ? box.height : 'N/A'}`);
  console.log(`  visible: ${box ? box.height > 0 : false}`);
  
  await browser.close();
}

await testInput("hub", null);
await testInput("hub", devices["iPhone 14"]);
await testInput("user", null);
await testInput("user", devices["iPhone 14"]);
console.log("Done");
// cleanup
import { unlink } from "node:fs/promises";
await unlink("./test-input.mjs");
