import { chromium } from 'playwright';

const GATEWAY = 'http://127.0.0.1:8787';
const BASE = 'http://127.0.0.1:18081';

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    const pageA = await browser.newPage();
    await pageA.goto(`${BASE}/index.html?gateway=${GATEWAY}&identity=qa-a`, { waitUntil: 'domcontentloaded' });
    await pageA.waitForTimeout(3000);

    const pageB = await browser.newPage();
    await pageB.goto(`${BASE}/creative.html?gateway=${GATEWAY}&identity=qa-b`, { waitUntil: 'domcontentloaded' });
    await pageB.waitForTimeout(3000);

    const titleA = await pageA.title();
    const titleB = await pageB.title();
    console.log(`Page A title: "${titleA}"`);
    console.log(`Page B title: "${titleB}"`);

    // Check gateway connection status
    const gwStatusA = await pageA.evaluate(() => {
      const el = document.querySelector('[data-gateway-status]');
      return el ? el.textContent : 'no status element';
    });
    console.log(`Gateway status A: ${gwStatusA}`);

    // DOM elements on page A
    const elementsA = await pageA.evaluate(() => {
      const hasComposer = !!document.querySelector('textarea, input[type="text"], [data-composer], .composer-input, #composer');
      const hasLeftRail = !!document.querySelector('.left-rail, .room-rail, [data-room-rail], nav');
      const hasMessages = !!document.querySelector('.messages, .chat-messages, [data-messages]');
      const roomItems = document.querySelectorAll('.room-item, [data-room-id], .conversation-item').length;
      return { hasComposer, hasLeftRail, hasMessages, roomItems };
    });
    console.log(`Page A elements: ${JSON.stringify(elementsA)}`);

    // Send message on page A
    const sent = await pageA.evaluate(() => {
      const input = document.querySelector('textarea, input[type="text"], [data-composer]');
      if (!input) return { ok: false, reason: 'no input found' };
      input.value = 'Hello from qa-a via Playwright!';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
      return { ok: true, text: 'Hello from qa-a via Playwright!' };
    });
    console.log(`Send result A: ${JSON.stringify(sent)}`);

    await pageB.waitForTimeout(3000);

    const receivedB = await pageB.evaluate(() => {
      const messages = document.querySelectorAll('.message, .chat-bubble, [data-message-id]');
      const texts = [];
      messages.forEach(m => texts.push(m.textContent?.substring(0, 80)));
      return { count: messages.length, texts };
    });
    console.log(`Page B messages (${receivedB.count}): ${JSON.stringify(receivedB.texts)}`);

    await pageA.screenshot({ path: '/tmp/h5-im-qa-a.png', fullPage: true });
    await pageB.screenshot({ path: '/tmp/h5-im-qa-b.png', fullPage: true });
    console.log('Screenshots: /tmp/h5-im-qa-a.png, /tmp/h5-im-qa-b.png');

    console.log('\n=== ACCEPTANCE ===');
    console.log(`index.html loaded: ${titleA ? 'YES' : 'NO'}`);
    console.log(`creative.html loaded: ${titleB ? 'YES' : 'NO'}`);
    console.log(`Composer found: ${elementsA.hasComposer}`);
    console.log(`Left rail found: ${elementsA.hasLeftRail}`);
    console.log(`Message sent: ${sent.ok}`);
    console.log(`Messages visible on peer: ${receivedB.count > 0}`);

  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
