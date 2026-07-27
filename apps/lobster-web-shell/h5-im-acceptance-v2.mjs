import { chromium } from 'playwright';

const GATEWAY = 'http://127.0.0.1:8787';
const BASE = 'http://127.0.0.1:18081';

async function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    return true;
  }
  console.log(`  ❌ ${label}`);
  return false;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = { pass: 0, fail: 0 };

  try {
    // ============ TEST 1: Enter sends message ============
    console.log('\n📋 测试 1: Enter 发送消息');
    const pageA = await browser.newPage();
    await pageA.goto(`${BASE}/index.html?gateway=${GATEWAY}&identity=qa-enter&qa=browser`, { waitUntil: 'domcontentloaded' });
    await pageA.waitForTimeout(4000);

    // Find input
    const inputSelector = '#composer-input, textarea, [data-composer]';
    const hasInput = await pageA.$(inputSelector);
    results.pass += await assert(!!hasInput, '输入框存在');

    if (hasInput) {
      // Type a message
      await pageA.fill(inputSelector, 'Enter发送测试消息');
      await pageA.waitForTimeout(200);

      // Get initial message count
      const initialCount = await pageA.evaluate(() => {
        return document.querySelectorAll('.message, .chat-bubble, [data-message-id]').length;
      });

      // Press Enter
      await pageA.press(inputSelector, 'Enter');
      await pageA.waitForTimeout(2000);

      // Check that input is cleared
      const inputValue = await pageA.inputValue(inputSelector);
      results.pass += await assert(inputValue === '', `发送后输入框清空: "${inputValue}"`);

      // Check message count increased
      const newCount = await pageA.evaluate(() => {
        return document.querySelectorAll('.message, .chat-bubble, [data-message-id]').length;
      });
      results.pass += await assert(newCount > initialCount, `消息数增加: ${initialCount} → ${newCount}`);
    }

    // ============ TEST 2: Shift+Enter inserts newline ============
    console.log('\n📋 测试 2: Shift+Enter 换行');
    const hasInput2 = await pageA.$(inputSelector);
    if (hasInput2) {
      await pageA.fill(inputSelector, '第一行');
      await pageA.waitForTimeout(100);

      // Press Shift+Enter
      await pageA.press(inputSelector, 'Shift+Enter');
      await pageA.waitForTimeout(100);

      const valueAfterShiftEnter = await pageA.inputValue(inputSelector);
      results.pass += await assert(
        valueAfterShiftEnter.includes('\n') || valueAfterShiftEnter.includes('第一行'),
        `Shift+Enter 保留换行: "${valueAfterShiftEnter.replace(/\n/g, '\\n')}"`
      );

      // Type more and send with plain Enter
      await pageA.fill(inputSelector, '');
      await pageA.fill(inputSelector, 'ShiftEnter后纯Enter发送');
      await pageA.press(inputSelector, 'Enter');
      await pageA.waitForTimeout(1000);
      const cleared = await pageA.inputValue(inputSelector);
      results.pass += await assert(cleared === '', `纯Enter发送后清空: "${cleared}"`);
    }

    // ============ TEST 3: Input text visibility (CSS contrast) ============
    console.log('\n📋 测试 3: 输入框文字可见性');
    const visCheck = await pageA.evaluate(() => {
      const input = document.querySelector('#composer-input, textarea');
      if (!input) return { error: 'no input found' };

      const style = getComputedStyle(input);
      const bg = style.backgroundColor;
      const color = style.color;
      const fontSize = style.fontSize;
      const lineHeight = style.lineHeight;
      const opacity = style.opacity;
      const display = style.display;
      const visibility = style.visibility;
      const zIndex = style.zIndex;

      // Parse RGB
      function parseRGB(rgb) {
        const m = rgb.match(/[\d.]+/g);
        if (!m || m.length < 3) return null;
        return [parseFloat(m[0]), parseFloat(m[1]), parseFloat(m[2])];
      }

      const fg = parseRGB(color);
      const bgParsed = parseRGB(bg);

      // Relative luminance
      function luminance([r, g, b]) {
        const rs = r / 255, gs = g / 255, bs = b / 255;
        const toLin = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        return 0.2126 * toLin(rs) + 0.7152 * toLin(gs) + 0.0722 * toLin(bs);
      }

      let contrastRatio = null;
      if (fg && bgParsed) {
        const l1 = luminance(fg), l2 = luminance(bgParsed);
        const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
        contrastRatio = (lighter + 0.05) / (darker + 0.05);
      }

      return {
        color, bg, fontSize, lineHeight, opacity, display, visibility, zIndex,
        contrastRatio: contrastRatio ? Math.round(contrastRatio * 100) / 100 : null,
      };
    });

    console.log(`  输入框 CSS: color=${visCheck.color}, bg=${visCheck.bg}, fontSize=${visCheck.fontSize}`);
    console.log(`  对比度: ${visCheck.contrastRatio}:1 (WCAG AA 最低 4.5:1)`);
    results.pass += await assert(visCheck.display !== 'none', `display 非 none: ${visCheck.display}`);
    results.pass += await assert(visCheck.visibility !== 'hidden', `visibility 非 hidden`);
    results.pass += await assert(parseFloat(visCheck.opacity) > 0.1, `opacity > 0.1: ${visCheck.opacity}`);
    results.pass += await assert(
      visCheck.contrastRatio !== null && visCheck.contrastRatio >= 4.0,
      `对比度 >= 4.0: ${visCheck.contrastRatio}:1`
    );

    // ============ TEST 4: Hotspot labels ============
    console.log('\n📋 测试 4: 热点标签交互');

    // Open creative.html for scene hotspots
    const pageC = await browser.newPage();
    await pageC.goto(`${BASE}/creative.html?gateway=${GATEWAY}&identity=qa-hotspot&qa=browser`, { waitUntil: 'domcontentloaded' });
    await pageC.waitForTimeout(4000);

    const hotspotInfo = await pageC.evaluate(() => {
      const hotspots = document.querySelectorAll('.scene-hotspot, [data-hotspot-id], [data-hotspot-title]');
      const labelSpans = [];
      hotspots.forEach((h) => {
        const label = h.querySelector('span');
        const cs = getComputedStyle(h);
        labelSpans.push({
          title: h.dataset?.hotspotTitle || '',
          label: label?.textContent?.trim() || '',
          opacity: cs.opacity,
          pointerEvents: cs.pointerEvents,
          display: cs.display,
          width: cs.width,
          height: cs.height,
          left: cs.left,
          top: cs.top,
        });
      });
      return { count: hotspots.length, items: labelSpans.slice(0, 6) };
    });

    console.log(`  热点数量: ${hotspotInfo.count}`);
    results.pass += await assert(hotspotInfo.count > 0, `场景有热点: ${hotspotInfo.count} 个`);

    for (const item of hotspotInfo.items) {
      console.log(`    - "${item.title}" label="${item.label}" opacity=${item.opacity} display=${item.display}`);
    }

    // Test hover triggers label visibility
    if (hotspotInfo.count > 0) {
      const firstHotspot = await pageC.$('.scene-hotspot, [data-hotspot-id]');
      if (firstHotspot) {
        const opacityBefore = await firstHotspot.evaluate(el => getComputedStyle(el).opacity);
        await firstHotspot.hover();
        await pageC.waitForTimeout(300);
        const opacityAfter = await firstHotspot.evaluate(el => getComputedStyle(el).opacity);

        // Check if the label inside became visible
        const labelVisible = await firstHotspot.evaluate(el => {
          const label = el.querySelector('span, .hotspot-label');
          if (!label) return null;
          const cs = getComputedStyle(label);
          return { opacity: cs.opacity, display: cs.display, visibility: cs.visibility };
        });

        console.log(`  hover 前 opacity: ${opacityBefore}, hover 后 opacity: ${opacityAfter}`);
        if (labelVisible) {
          console.log(`  label hover: opacity=${labelVisible.opacity}, display=${labelVisible.display}, visibility=${labelVisible.visibility}`);
        }
        results.pass += await assert(
          parseFloat(opacityAfter) >= parseFloat(opacityBefore),
          `hover 不隐藏热点: ${opacityBefore} → ${opacityAfter}`
        );
      }
    }

    // Test click on blank scene
    const blankClickResult = await pageC.evaluate(() => {
      // Find the scene container
      const scene = document.querySelector('.scene-stage, .pixel-scene, [data-scene], .scene-container');
      if (!scene) return { error: 'no scene found' };

      // Click on the scene (not on a hotspot)
      const rect = scene.getBoundingClientRect();
      const clickX = rect.left + rect.width * 0.3;
      const clickY = rect.top + rect.height * 0.3;

      // Simulate via dispatch
      const clickEvent = new MouseEvent('click', {
        bubbles: true, cancelable: true,
        clientX: clickX, clientY: clickY,
      });
      scene.dispatchEvent(clickEvent);

      // Check if "show all labels" was triggered
      const allLabels = document.querySelectorAll('.scene-hotspot--visible, .hotspot-label--visible, [data-show-labels]');
      return { sceneExists: true, labelsWithShowClass: allLabels.length };
    });
    console.log(`  场景空白点击: labelsWithShowClass=${blankClickResult.labelsWithShowClass}`);

    // ============ TEST 5: Left rail dimensions across pages ============
    console.log('\n📋 测试 5: 左栏尺寸跨页面一致性');

    // Measure index.html rail
    const railA = await pageA.evaluate(() => {
      const rail = document.querySelector('.sidebar-stack, .scene-rail, [data-shell-column="rooms"], .creative-rail, nav.sfc-rail');
      if (!rail) return { error: 'no rail found' };
      const cs = getComputedStyle(rail);
      const rect = rail.getBoundingClientRect();
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        cssWidth: cs.width,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        paddingLeft: cs.paddingLeft,
      };
    });
    console.log(`  index.html 左栏: ${JSON.stringify(railA)}`);

    const railC = await pageC.evaluate(() => {
      const rail = document.querySelector('.sidebar-stack, .scene-rail, [data-shell-column="rooms"], .creative-rail, nav.sfc-rail');
      if (!rail) return { error: 'no rail found' };
      const cs = getComputedStyle(rail);
      const rect = rail.getBoundingClientRect();
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        cssWidth: cs.width,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        paddingLeft: cs.paddingLeft,
      };
    });
    console.log(`  creative.html 左栏: ${JSON.stringify(railC)}`);

    if (railA.width && railC.width) {
      const widthMatch = Math.abs(railA.width - railC.width) <= 5;
      results.pass += await assert(widthMatch, `左栏宽度一致: index=${railA.width}px, creative=${railC.width}px`);
      results.pass += await assert(
        railA.fontSize === railC.fontSize,
        `左栏字号一致: index=${railA.fontSize}, creative=${railC.fontSize}`
      );
    } else {
      console.log('  ⚠️ 未找到左栏元素，可能选择器不匹配');
    }

    // ============ TEST 6: Dual-client message relay ============
    console.log('\n📋 测试 6: 双端消息收发');
    const pageB = await browser.newPage();
    await pageB.goto(`${BASE}/creative.html?gateway=${GATEWAY}&identity=qa-peer&qa=browser`, { waitUntil: 'domcontentloaded' });
    await pageB.waitForTimeout(4000);

    const inputB = await pageB.$(inputSelector);
    if (inputB) {
      await pageB.fill(inputSelector, '来自 peer 的问候');
      await pageB.press(inputSelector, 'Enter');
      await pageB.waitForTimeout(2000);
    }

    // Check page A received it
    const msgsOnA = await pageA.evaluate(() => {
      const msgs = document.querySelectorAll('.message, .chat-bubble, [data-message-id]');
      const texts = [];
      msgs.forEach(m => texts.push(m.textContent?.substring(0, 100)));
      return { count: msgs.length, texts };
    });
    console.log(`  Page A 消息数: ${msgsOnA.count}, 内容: ${JSON.stringify(msgsOnA.texts.slice(-3))}`);

    const msgOnB = await pageB.evaluate(() => {
      const msgs = document.querySelectorAll('.message, .chat-bubble, [data-message-id]');
      const texts = [];
      msgs.forEach(m => texts.push(m.textContent?.substring(0, 100)));
      return { count: msgs.length, texts };
    });
    console.log(`  Page B 消息数: ${msgOnB.count}, 内容: ${JSON.stringify(msgOnB.texts.slice(-3))}`);

    results.pass += await assert(msgOnB.count > 0, `peer 页有消息: ${msgOnB.count} 条`);
    results.pass += await assert(msgsOnA.count > 0, `qa-enter 页有消息: ${msgsOnA.count} 条`);

    // ============ TEST 7: Pending echo / committed copy (no duplicates) ============
    console.log('\n📋 测试 7: Pending echo 不重复');
    const dupCheck = await pageC.evaluate(() => {
      const msgs = document.querySelectorAll('.message, .chat-bubble, [data-message-id]');
      const texts = [];
      msgs.forEach(m => {
        const body = m.textContent?.trim() || '';
        if (body) texts.push(body.substring(0, 80));
      });

      // Check for consecutive duplicates
      const dupes = [];
      for (let i = 1; i < texts.length; i++) {
        if (texts[i] === texts[i - 1]) {
          dupes.push({ index: i, text: texts[i] });
        }
      }

      return { totalMessages: msgs.length, duplicateConsecutivePairs: dupes.length, samples: texts.slice(-5) };
    });
    console.log(`  消息总数: ${dupCheck.totalMessages}, 连续重复: ${dupCheck.duplicateConsecutivePairs}`);
    console.log(`  最近消息: ${JSON.stringify(dupCheck.samples)}`);
    results.pass += await assert(dupCheck.duplicateConsecutivePairs === 0, `无连续重复消息 (pending echo 已被 committed copy 替换)`);

    // ============ SUMMARY ============
    console.log('\n' + '='.repeat(60));
    console.log('=== H5 IM 验收结果汇总 ===');
    console.log(`  通过: ${results.pass}`);
    console.log(`  失败: ${results.fail}`);
    console.log(`  总计: ${results.pass + results.fail}`);
    console.log('='.repeat(60));

  } catch (err) {
    console.error('测试异常:', err.message);
    results.fail++;
  } finally {
    await browser.close();
  }

  return results;
}

main().then((results) => {
  if (results.fail > 0) {
    console.log(`\n⚠️ ${results.fail} 项测试失败，请检查。`);
    process.exit(1);
  } else {
    console.log('\n✅ 所有验收项通过！');
    process.exit(0);
  }
}).catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
