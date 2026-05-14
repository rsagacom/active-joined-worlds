import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

async function readShellPage(name) {
  return fs.readFile(new URL(`../${name}`, import.meta.url), "utf8");
}

async function readShellModule(name) {
  return fs.readFile(new URL(`../${name}`, import.meta.url), "utf8");
}

function sliceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing start marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `missing end marker: ${endMarker}`);
  return source.slice(start, end);
}

test("hub page is now main-city group chat page with canvas and timeline", async () => {
  const html = await readShellPage("index.html");

  assert.match(html, /<title>龙虾聊天 · 主城群聊<\/title>/);
  assert.match(html, /data-sfc-theme="city"/);
  assert.match(html, /class="[^"]*sfc-city-shell[^"]*"/);
  assert.match(html, /id="room-stage-canvas"/);
  assert.match(html, /id="timeline"/);
  assert.match(html, /id="composer"/);
  assert.match(html, /styles\.css\?v=20260514-rail-stage-v1/);
  assert.match(html, /styles\.pixel-map\.css\?v=20260514-rail-stage-v1/);
  assert.match(html, /app\.js\?v=20260501-contract-v1/);
  assert.match(html, /data-symbol-trigger/);
  assert.match(html, /composer-symbol-category/);
  assert.match(html, /高兴/);
  assert.match(html, /生气/);
  assert.match(html, /震惊 \/ 尴尬/);
  assert.match(html, /@用户名/);
  assert.match(html, /class="[^"]*sfc-city-stage[^"]*"/);
  // 居民侧主导航只保留住宅、主城与世界入口，城主治理入口不混入普通交流页。
  assert.match(html, /href="\.\/creative\.html"/);
  assert.match(html, /href="\.\/index\.html"/);
  assert.match(html, /href="\.\/unified\.html"/);
  assert.match(html, /class="scene-hotspot scene-hotspot--metro"/);
  assert.match(html, /href="\.\/unified\.html"[\s\S]*地铁口/);
  assert.doesNotMatch(html, /pixel-map--city|map-sprite--city/);
  assert.doesNotMatch(html, /href="\.\/admin\.html"/);
});

test("creative page is the residential pixel room entry", async () => {
  const html = await readShellPage("creative.html");

  assert.match(html, /<title>龙虾聊天 · 住宅<\/title>/);
  assert.match(html, /data-shell-variant="creative-terminal"/);
  assert.match(html, /data-default-room-id="dm:rsaga:builder"/);
  assert.match(html, /href="\.\/creative\.html" class="rail-item is-active" aria-current="page"/);
  assert.match(html, /href="\.\/index\.html"/);
  assert.match(html, /href="\.\/unified\.html"/);
  assert.match(html, /class="scene-hotspot scene-hotspot--stairs"/);
  assert.match(html, /href="\.\/index\.html"[\s\S]*楼梯/);
  assert.match(html, /styles\.pixel-map\.css\?v=20260514-rail-stage-v1/);
  assert.match(html, /app\.js\?v=20260501-contract-v1/);
  assert.match(html, /data-symbol-trigger/);
  assert.match(html, /composer-symbol-category/);
  assert.match(html, /卖萌/);
  assert.match(html, /亲亲 \/ 动物 \/ Orz/);
  assert.doesNotMatch(html, /creative-composer-actions|creative-tool|creative-channel-pill/);
  assert.doesNotMatch(html, />注<|>稿<|>景<|当前频道 · 住宅/);
});

test("admin page has collapsible management navigation and tool groups", async () => {
  const html = await readShellPage("admin.html");

  assert.match(html, /<title>龙虾聊天 · 管理后台<\/title>/);
  assert.match(html, /href="\.\/styles\.css\?v=20260511-admin-std-v1"/);
  assert.match(html, /管理后台/);

  // 左侧是可收起管理目录，仍保留会话队列作为首个日常入口。
  assert.match(html, /<aside class="sidebar-stack sidebar-stack-admin admin-nav-shell" data-admin-nav="expanded">/);
  assert.match(html, /id="admin-nav-toggle"/);
  assert.match(html, /aria-label="收起后台功能目录"/);
  assert.match(html, /<nav class="admin-nav-list" aria-label="管理后台分类">/);
  assert.match(html, /<div class="admin-nav-module" data-admin-module="daily">/);
  assert.match(html, /<div class="admin-nav-module-title">日常处理<\/div>/);
  assert.match(html, /<div class="admin-nav-module" data-admin-module="advanced" data-admin-module-expanded="false">/);
  assert.match(html, /<button type="button" class="admin-nav-module-title admin-nav-module-toggle" aria-expanded="false" aria-controls="admin-nav-advanced-items">/);
  assert.match(html, /<div id="admin-nav-advanced-items" class="admin-nav-module-items">/);
  const dailyModule = sliceBetween(html, 'data-admin-module="daily"', 'data-admin-module="advanced"');
  for (const label of ["会话", "居民", "公告", "安全", "系统"]) {
    assert.match(dailyModule, new RegExp(`<strong>${label}<\/strong>`));
  }
  assert.doesNotMatch(dailyModule, /<strong>房间<\/strong>/);
  assert.doesNotMatch(dailyModule, /<strong>世界<\/strong>/);
  const advancedModule = html.slice(html.indexOf('data-admin-module="advanced"'));
  for (const label of ["房间", "世界"]) {
    assert.match(advancedModule, new RegExp(`<strong>${label}<\/strong>`));
  }
  for (const label of ["会话", "居民", "房间", "安全", "公告", "世界", "系统"]) {
    assert.match(html, new RegExp(`<strong>${label}<\/strong>`));
  }
  assert.match(html, /data-admin-tool-status="可用"/);
  assert.match(html, /data-admin-tool-status="需网关"/);
  assert.match(html, /data-admin-tool-status="待接入"/);
  assert.match(html, /data-admin-tool-status="高级"/);
  assert.match(html, /<section class="panel rooms admin-session-queue">[\s\S]*?<ul id="room-list" class="room-list"><\/ul>/);
  assert.doesNotMatch(html, /<aside class="sidebar-stack sidebar-stack-admin">[\s\S]*?<section class="panel governance">/);

  // 左侧分类导航带有 data-admin-category，每个 nav item 都有 icon wrapper
  for (const cat of ["session", "resident", "room", "safety", "notice", "world", "system"]) {
    assert.match(html, new RegExp(`data-admin-category="${cat}"`));
  }

  // 系统导航项必须和其他 nav item 一样有 icon wrapper，没有残留多余闭合 span
  const systemNavMatch = html.match(/<a class="admin-nav-item"[^>]*data-admin-category="system"[\s\S]*?<\/a>/);
  assert.ok(systemNavMatch, "system nav item should exist");
  const systemNav = systemNavMatch[0];
  assert.match(systemNav, /<span class="admin-nav-icon" aria-hidden="true">/);
  assert.match(systemNav, /<\/span>\s*<span class="admin-nav-copy">/);
  // svg 在 icon wrapper 内
  assert.match(systemNav, /<span class="admin-nav-icon" aria-hidden="true">[\s\S]*?<svg[\s\S]*?<\/svg>[\s\S]*?<\/span>/);

  // 中间只保留会话工作区
  assert.match(html, /<section id="admin-session-workspace" class="panel conversation conversation-shell-admin">[\s\S]*?<div id="admin-workspace-session">/);
  assert.match(html, /<form id="composer"/);
  assert.match(html, /<div id="timeline"/);

  // 右侧是极简工具摘要 + 隐藏表单
  assert.match(html, /<aside class="panel chat-detail admin-context-panel">[\s\S]*?<div id="admin-tools-summary" class="admin-tools-summary">/);
  assert.match(html, /<div id="admin-tool-forms" hidden>/);

  // 默认首屏右侧不展开常驻 details 表单；表单收进隐藏容器
  assert.doesNotMatch(html, /<div class="admin-tools-content">/);

  // 隐藏表单中保留真实操作表单（按分类分组）
  assert.match(html, /<form id="auth-request-form" class="inline-form compact-form">/);
  assert.match(html, /<form id="auth-verify-form" class="inline-form compact-form">/);
  assert.match(html, /<form id="world-notice-form" class="inline-form compact-form" data-shell-role="admin">/);
  assert.match(html, /<form id="world-advisory-form" class="inline-form compact-form" data-shell-role="admin">/);
  assert.match(html, /<form id="world-report-review-form" class="inline-form compact-form" data-shell-role="admin">/);
  assert.match(html, /<form id="world-report-form" class="inline-form compact-form">/);
  assert.match(html, /<div data-admin-tool-category="session">/);
  assert.match(html, /<div data-admin-tool-category="resident">/);
  assert.match(html, /<div data-admin-tool-category="notice">/);
  assert.match(html, /<div data-admin-tool-category="safety">/);
  assert.match(html, /<div data-admin-tool-category="room">/);
  assert.match(html, /<div data-admin-tool-category="world">/);
  assert.match(html, /<div data-admin-tool-category="system">/);

  // 产品 UI 不展示 API 路径；接口合同进入测试和开发文档，不进入后台操作界面
  assert.doesNotMatch(html, /API：/);
  assert.doesNotMatch(html, /POST \/v1\//);
  assert.doesNotMatch(html, /GET \/v1\//);

  // 按钮状态标签
  assert.match(html, /<span class="action-status action-status-gateway">需网关<\/span>/);
  assert.match(html, /<span class="action-status action-status-readonly">只读预览<\/span>/);
  assert.match(html, /<span class="action-status action-status-pending">规划中<\/span>/);

  // 没有真实接口的按钮 disabled
  assert.match(html, /<button[^>]*disabled[^>]*>接入消息来源<\/button>/);
  assert.match(html, /<button[^>]*disabled[^>]*>新建城市<\/button>/);
  assert.match(html, /<button[^>]*disabled[^>]*>执行制裁<\/button>/);

  // 需要网关的表单按钮已 disabled（无真实 gateway 能力不开放点击）
  assert.match(html, /<button[^>]*id="auth-request-button"[^>]*disabled[^>]*>申请验证码<\/button>/);
  assert.match(html, /<button[^>]*id="auth-verify-button"[^>]*disabled[^>]*>完成登录<\/button>/);
  assert.match(html, /<button type="submit" class="action-btn" disabled aria-disabled="true" title="需要已连接的网关">发布公告<\/button>/);
  assert.match(html, /<button type="submit" class="action-btn" disabled aria-disabled="true" title="需要已连接的网关">发布安全通告<\/button>/);
  assert.match(html, /<button type="submit" class="action-btn" disabled aria-disabled="true" title="需要已连接的网关">提交举报<\/button>/);
  assert.match(html, /<button type="submit" class="action-btn" disabled aria-disabled="true" title="需要已连接的网关">审查举报<\/button>/);
  assert.match(html, /localStorage\?\.setItem\("lobster-admin-nav"/);

  // 分类切换脚本
  assert.match(html, /function switchCategory\(category\)/);
  assert.match(html, /function renderSummary\(category\)/);
  assert.match(html, /switchCategory\("session"\)/);
  assert.match(html, /workspaceSession\.hidden/);

  // 右侧摘要使用 dataset 标记（DOM API / textContent，不 innerHTML）
  assert.match(html, /dataset:\s*\{\s*adminAction:\s*primary\.action,\s*actionStatus:\s*"available"/);
  assert.match(html, /dataset:\s*\{\s*summaryCategory:\s*category\s*\}/);

  // 中间分类面板已移除，data-action-status 不再出现在首屏
  assert.doesNotMatch(html, /data-action-status="available"/);
  assert.doesNotMatch(html, /data-action-status="gateway"/);
  assert.doesNotMatch(html, /data-action-status="pending"/);

  // 右侧摘要不再展开整个分类的表单墙；只显示标题 + 说明 + 按钮
  assert.doesNotMatch(html, /admin-summary-more/);
  assert.doesNotMatch(html, /admin-summary-detail/);

  // 每个分类的 ACTION_CATALOG 都有 desc 和 primaryReason
  assert.match(html, /primaryReason:\s*""/);
  assert.match(html, /primaryReason:\s*"需要已连接的网关与已验证的管理员身份。"/);
  assert.match(html, /primaryReason:\s*"Provider、城市、镜像等高级功能尚未接入后端。"/);
});

test("admin page default summary is not empty and updates on category switch", async () => {
  const html = await readShellPage("admin.html");

  // #admin-tools-summary 初始不是空：内联脚本默认调用 switchCategory("session")，renderSummary 会填充内容
  assert.match(html, /switchCategory\("session"\)/);
  assert.match(html, /function renderSummary\(category\)/);
  assert.match(html, /const ACTION_CATALOG = \{/);
  assert.match(html, /session:\s*\{\s*desc:\s*"可导出当前会话或全部历史记录。"/);

  // 切换每个 data-admin-category 后摘要更新：switchCategory 调用 renderSummary(category)
  assert.match(html, /renderSummary\(category\)/);
  for (const cat of ["session", "resident", "room", "safety", "notice", "world", "system"]) {
    assert.match(html, new RegExp(`${cat}:\\s*\\{`));
  }

  // renderSummary 不再展示 API 长串；desc 和 primaryReason 用 textContent
  assert.match(html, /descEl\.textContent\s*=\s*catalog\.desc/);
  assert.match(html, /reasonValue\.textContent\s*=\s*reasonText/);
  assert.doesNotMatch(html, /api:/);
  assert.doesNotMatch(html, /item\.api/);
});

test("admin default session summary does not expose advanced world operations", async () => {
  const html = await readShellPage("admin.html");
  const sessionCatalog = sliceBetween(html, "session: {", "resident: {");

  // session 分类只保留一个可用操作
  assert.match(sessionCatalog, /导出当前会话/);
  assert.doesNotMatch(sessionCatalog, /Provider|新建城市|添加镜像源|加入城市|更新城市状态/);
});

test("admin page disabled buttons have aria-disabled and reason text", async () => {
  const html = await readShellPage("admin.html");

  // 所有 disabled 按钮必须有 aria-disabled="true" 和 title
  const disabledButtons = Array.from(html.matchAll(/<button[^>]*disabled[^>]*>/g));
  assert.ok(disabledButtons.length > 0, "should have disabled buttons");
  for (const match of disabledButtons) {
    const tag = match[0];
    assert.match(tag, /aria-disabled="true"/);
    assert.match(tag, /title="[^"]+"/);
  }

  // 待接入按钮的 title 必须包含"尚未接入"或"需要"
  const pendingTitles = Array.from(html.matchAll(/data-action-status="pending"[^>]*title="([^"]+)"/g));
  for (const match of pendingTitles) {
    const title = match[1];
    assert.ok(
      title.includes("尚未接入") || title.includes("需要") || title.includes("待接"),
      `pending button title should explain reason: ${title}`,
    );
  }

  // 需网关按钮的 title 必须包含"需要"或"网关"
  const gatewayTitles = Array.from(html.matchAll(/data-action-status="gateway"[^>]*title="([^"]+)"/g));
  for (const match of gatewayTitles) {
    const title = match[1];
    assert.ok(
      title.includes("需要") || title.includes("网关"),
      `gateway button title should explain reason: ${title}`,
    );
  }
});

test("admin page default screen shows only composer, no extra forms", async () => {
  const html = await readShellPage("admin.html");

  // 默认首屏：中间只保留会话工作区，无分类面板
  assert.doesNotMatch(html, /<div id="admin-workspace-category"/);
  assert.doesNotMatch(html, /<div id="admin-workspace-session" hidden>/);

  // #admin-tool-forms 默认隐藏
  assert.match(html, /<div id="admin-tool-forms" hidden>/);

  // 中间面板已移除 details，高级样式标记不再残留
  assert.doesNotMatch(html, /tool-group--advanced/);
});

test("admin tool drawer opens and closes per category", async () => {
  const html = await readShellPage("admin.html");

  // 工具抽屉关闭按钮存在
  assert.match(html, /id="admin-tool-drawer-close"/);
  assert.match(html, /aria-label="关闭工具抽屉"/);

  // 打开工具函数存在
  assert.match(html, /function openToolDrawer\(category\)/);
  assert.match(html, /function closeToolDrawer\(\)/);

  // switchCategory 调用 closeToolDrawer（切换分类时关闭旧工具）
  assert.match(html, /closeToolDrawer\(\)/);

  // 打开工具按钮通过 data-admin-open-drawer 标记
  assert.match(html, /dataset:\s*\{\s*adminOpenDrawer:\s*"true"/);

  // 打开工具时只显示对应分类的内容
  assert.match(html, /el\.hidden = el\.dataset\.adminToolCategory !== category/);

  // 抽屉打开时显示表单容器、隐藏摘要
  assert.match(html, /toolForms\.hidden = false/);
  assert.match(html, /toolsSummary\.hidden = true/);

  // 关闭抽屉时恢复摘要
  assert.match(html, /toolForms\.hidden = true/);
  assert.match(html, /toolsSummary\.hidden = false/);
});

test("admin tool drawer does not open disabled tools", async () => {
  const html = await readShellPage("admin.html");

  // disabled 工具按钮没有 data-admin-open-drawer
  const disabledWithOpen = html.matchAll(/<button[^>]*disabled[^>]*data-admin-open-drawer/g);
  assert.strictEqual(Array.from(disabledWithOpen).length, 0, "disabled buttons should not have open-drawer");

  // 打开工具按钮只出现在 renderSummary 中，且只绑定到可用/有表单的工具
  assert.match(html, /openBtn\.addEventListener\("click", \(\) => openToolDrawer\(category\)\)/);
});

test("admin nav is collapsible and keeps keyboard access when collapsed", async () => {
  const html = await readShellPage("admin.html");
  const css = await readShellModule("styles.css");

  // 收起按钮存在
  assert.match(html, /id="admin-nav-toggle"/);
  assert.match(html, /localStorage\?\.setItem\("lobster-admin-nav"/);

  // 收起状态通过 data-admin-nav="collapsed" 控制
  assert.match(css, /\[data-admin-nav="collapsed"\]/);
  assert.match(css, /\.admin-nav-shell\[data-admin-nav="collapsed"\]/);
  assert.match(css, /\.admin-nav-shell\[data-admin-nav="collapsed"\]\s+\.admin-nav-copy\s*,[\s\S]{0,300}display:\s*none/);

  // nav items 是 <a> 标签，收起后仍可键盘访问
  const navItems = Array.from(html.matchAll(/<a class="admin-nav-item[^"]*"[^>]*>/g));
  assert.ok(navItems.length >= 7, "should have at least 7 nav items");
  for (const match of navItems) {
    const tag = match[0];
    assert.match(tag, /href="[^"]+"/);
    assert.match(tag, /data-admin-category="[^"]+"/);
    assert.match(tag, /aria-label="[^"]+"/);
  }

  // 每个 nav item 都有 click 事件监听器调用 switchCategory
  assert.match(html, /item\.addEventListener\("click",/);
  assert.match(html, /switchCategory\(category\)/);
});

test("admin summary has no innerHTML sink", async () => {
  const html = await readShellPage("admin.html");
  const source = await readShellModule("app.js");

  // renderSummary 使用 textContent / DOM API，不 innerHTML
  assert.match(html, /if \(text\) el\.textContent = text;/);
  assert.doesNotMatch(html, /renderSummary[\s\S]{0,800}\.innerHTML\s*=/);

  // app.js 中 admin 相关消息渲染也走 textContent
  assert.match(source, /function createMessageBodyNode\(message, options = \{\}\)/);
  assert.match(source, /body\.textContent = message\.text/);
});

test("admin summary shows one primary action and opens drawer for full tools", async () => {
  const html = await readShellPage("admin.html");

  // renderSummary 只取第一个 available 工具作为主操作按钮
  assert.match(html, /const primary = catalog\.available\[0\]/);
  assert.match(html, /dataset:\s*\{\s*adminAction:\s*primary\.action,\s*actionStatus:\s*"available"/);

  // 打开工具抽屉按钮通过 data-admin-open-drawer 标记
  assert.match(html, /dataset:\s*\{\s*adminOpenDrawer:\s*"true"\s*\}/);

  // 不再有多工具卡截断逻辑
  assert.doesNotMatch(html, /const VISIBLE_LIMIT/);
  assert.doesNotMatch(html, /admin-summary-tool-card/);
  assert.doesNotMatch(html, /admin-summary-section-label/);
});

test("admin summary disabled tools show reason in primaryReason and catalog", async () => {
  const html = await readShellPage("admin.html");

  // ACTION_CATALOG 中 pending 项都带有 reason 和 reasonType
  assert.match(html, /reasonType:\s*"未接网关"/);
  assert.match(html, /reasonType:\s*"后端未实现"/);

  // 每个有 pending 的分类都有 primaryReason 作为默认摘要的状态说明
  assert.match(html, /primaryReason:\s*"需要已连接的网关与已验证的管理员身份。"/);
  assert.match(html, /primaryReason:\s*"Provider、城市、镜像等高级功能尚未接入后端。"/);
  assert.match(html, /primaryReason:\s*"房间管理功能尚未接入后端能力。"/);

  // renderSummary 用 textContent 展示原因
  assert.match(html, /reasonValue\.textContent\s*=\s*reasonText/);

  // 抽屉中 disabled 按钮保留 aria-disabled 和 title
  assert.match(html, /disabled aria-disabled="true" title="需要已连接的网关"/);

  // 标准原因类型在 CSS 中有高对比样式
  const css = await readShellModule("styles.css");
  assert.match(css, /\.admin-summary-reason\s*\{/);
  assert.match(css, /\.admin-summary-reason-type\s*\{/);
  assert.match(css, /\.admin-summary-reason-label\s*\{/);
  assert.match(css, /\.admin-summary-reason-value\s*\{/);
  assert.doesNotMatch(css, /admin-summary-more/);
  assert.doesNotMatch(css, /tool-group--advanced/);
});

test("admin default session summary is minimal with no api or advanced cards", async () => {
  const html = await readShellPage("admin.html");

  // 后台产品界面整体不展示 API 长串
  assert.doesNotMatch(html, /API：/);
  assert.doesNotMatch(html, /POST \/v1\//);
  assert.doesNotMatch(html, /GET \/v1\//);
  assert.doesNotMatch(html, /api\.textContent\s*=\s*"API："/);

  // 默认 session 摘要只有一个主操作按钮
  const summaryFn = html.slice(html.indexOf("function renderSummary"), html.indexOf("function openToolDrawer"));
  assert.doesNotMatch(summaryFn, /admin-summary-tool-card/);
  assert.doesNotMatch(summaryFn, /admin-summary-section-label/);
  assert.match(summaryFn, /className:\s*"admin-summary-action-row"/);
  assert.match(summaryFn, /className:\s*"admin-summary-reason-row"/);

  // world 分类的 primaryReason 明确说明高级功能未接入
  const worldCatalog = sliceBetween(html, "world: {", "system: {");
  assert.match(worldCatalog, /Provider、城市、镜像等高级功能尚未接入后端/);
  assert.doesNotMatch(worldCatalog, /api:/);
});

test("admin tool forms are hidden by default and show on category switch", async () => {
  const html = await readShellPage("admin.html");

  // 表单容器默认 hidden
  assert.match(html, /<div id="admin-tool-forms" hidden>/);

  // switchCategory 关闭抽屉
  assert.match(html, /closeToolDrawer\(\)/);

  // 抽屉关闭时隐藏表单、显示摘要
  assert.match(html, /toolForms\.hidden = true/);
  assert.match(html, /toolsSummary\.hidden = false/);

  // 分类切换后中间始终显示会话
  assert.match(html, /workspaceSession\.hidden = false/);
});

test("admin workspace css keeps auth and detail panels workspace-driven", async () => {
  const css = await readShellModule("styles.css");

  assert.doesNotMatch(
    css,
    /body\[data-shell-page="admin"\]\s+\.governance\s*\{\s*display:\s*block\s*!important;/
  );
  assert.doesNotMatch(
    css,
    /body\[data-shell-page="admin"\]\s+\.auth,\s*[\s\S]*?body\[data-shell-page="admin"\]\s+\.chat-detail\s*\{\s*display:\s*none\s*!important;/
  );
  assert.match(
    css,
    /body\[data-shell-page="admin"\]\s+\.governance\.surface-hidden,\s*body\[data-shell-page="admin"\]\s+\.auth\.surface-hidden,\s*body\[data-shell-page="admin"\]\s+\.chat-detail\.surface-hidden\s*\{\s*display:\s*none\s*!important;/
  );
  assert.match(
    css,
    /body\[data-shell-page="admin"\]\s+\.governance:not\(\.surface-hidden\),\s*body\[data-shell-page="admin"\]\s+\.auth:not\(\.surface-hidden\),\s*body\[data-shell-page="admin"\]\s+\.chat-detail:not\(\.surface-hidden\)\s*\{\s*display:\s*block\s*!important;/
  );
  assert.match(
    css,
    /@media \(max-width: 960px\)[\s\S]*body\[data-shell-page="admin"\]:not\(\[data-workspace="chat"\]\) \.sidebar-stack-admin\s*\{\s*display:\s*grid\s*!important;/
  );
});

test("admin tools panel css has high-contrast action status labels", async () => {
  const css = await readShellModule("styles.css");

  assert.match(css, /\.admin-nav-shell/);
  assert.match(css, /\.admin-nav-panel/);
  assert.match(css, /\.admin-nav-toggle/);
  assert.match(css, /\.admin-nav-item/);
  assert.match(css, /\[data-admin-nav="collapsed"\]/);
  assert.match(css, /body\[data-shell-page="admin"\]\[data-admin-nav="collapsed"\] \.layout-admin-shell/);
  assert.match(css, /\.tool-group\s*\{/);
  assert.match(css, /\.tool-group-title\s*\{/);
  assert.match(css, /\.action-row\s*\{/);
  assert.match(css, /\.action-status\s*\{/);
  assert.match(css, /\.action-status-available\s*\{/);
  assert.match(css, /\.action-status-pending\s*\{/);
  assert.match(css, /\.action-status-readonly\s*\{/);
  assert.match(css, /\.action-status-gateway\s*\{/);
  assert.match(css, /body\[data-shell-page="admin"\]\s+\.tool-group\s*\{/);
  assert.match(css, /body\[data-shell-page="admin"\]\s+\.action-status-gateway\s*\{/);
});

test("unified page is world-entry metro station with pixel scene and hotspots", async () => {
  const html = await readShellPage("unified.html");

  assert.match(html, /<title>龙虾聊天 · 世界入口<\/title>/);
  assert.match(html, /data-shell-page="world-entry"/);
  assert.match(html, /data-shell-variant="metro-station"/);
  assert.match(html, /data-default-shell-mode="unified"/);
  assert.match(html, /data-sfc-theme="city"/);
  assert.match(html, /href="\.\/styles\.world-entry\.css\?v=20260507-bg-png256-v1/);
  assert.match(html, /app\.js\?v=20260501-contract-v1/);
  assert.match(html, /href="\.\/creative\.html"/);
  assert.match(html, /href="\.\/index\.html"/);
  assert.match(html, /href="\.\/world-square\.html"/);
  assert.match(html, /href="\.\/unified\.html"/);
  assert.match(html, /世界入口/);
  assert.match(html, /地铁候车站/);
  assert.match(html, /返回主城/);
  assert.match(html, /候车站台/);
  assert.match(html, /列车通道/);
  assert.match(html, /世界线路图/);
  assert.match(html, /world-routes/);
  assert.match(html, /选择前往的主城/);
  assert.doesNotMatch(html, /world-entry-chat-frame|world-entry-message/);
  assert.doesNotMatch(html, /world-entry-sky|world-entry-horizon|world-entry-gate/);
});

test("world-square page is a readonly public square entry", async () => {
  const html = await readShellPage("world-square.html");
  const css = await fs.readFile(new URL("../styles.world-square.css", import.meta.url), "utf8");

  assert.match(html, /<title>龙虾聊天 · 世界广场<\/title>/);
  assert.match(html, /data-shell-page="world-square"/);
  assert.match(html, /data-shell-variant="world-square-readonly"/);
  assert.match(html, /assets\/pixel\/concepts\/world-square-concept-20260427-256\.png/);
  assert.match(html, /href="\.\/unified\.html"/);
  assert.match(html, /href="\.\/index\.html"/);
  assert.match(css, /world-square-concept-20260427-256\.png/);
  assert.match(css, /世界广场/);
  assert.match(html, /styles\.world-square\.css\?v=20260514-rail-stage-v1/);
  assert.match(html, /dataset\.timeOfDay/);
  assert.match(html, /\/v1\/world-square/);
  assert.match(html, /textContent/);
  assert.doesNotMatch(html, /innerHTML/);
  // Day runtime uses real asset; no overlay/filter/brightness/mix-blend-mode fake.
  assert.match(html, /world-square-concept-20260428-day-draft-256\.png/);
  assert.match(css, /world-square-concept-20260428-day-draft-256\.png/);
  assert.doesNotMatch(css, /body\[data-time-of-day="day"\]\s+\.world-square-scene::after/);
  assert.match(html, /world-square-readonly-grid/);
  assert.match(html, /<details class="world-square-card world-square-card--compact" aria-label="世界广场说明">/);
  assert.match(html, /<summary class="world-square-card-toggle">广场信息<\/summary>/);
  assert.match(html, /class="world-square-rail-title">导航<\/div>/);
  assert.match(html, /<\/section>\s*<\/div>\s*<script>/);
  assert.doesNotMatch(html, /<\/main>\s*<\/div>\s*<script>/);
  assert.doesNotMatch(html, /<section class="world-square-card/);
  assert.match(html, /data-readonly-kind="notice"/);
  assert.match(html, /data-readonly-kind="discussion"/);
  assert.match(html, /data-readonly-kind="discovery"/);
  assert.match(html, /aria-disabled="true"/);
  assert.doesNotMatch(html, /href="#"/);
  assert.doesNotMatch(css, /@import|fonts\.googleapis|fonts\.gstatic/);
  assert.match(css, /world-square-readonly-grid/);
  assert.match(css, /world-square-card--compact/);
  assert.match(css, /\.world-square-card\[open\]/);
  assert.match(css, /\.world-square-card:not\(\[open\]\)/);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*\.world-square-card--compact/);
});

test("user.html redirects to creative.html with query params preserved", async () => {
  const html = await readShellPage("user.html");

  // 不再暴露旧 UI
  assert.doesNotMatch(html, /data-shell-page="user"/);
  assert.doesNotMatch(html, /app-user-shell/);
  assert.doesNotMatch(html, /wechat-shell/);
  assert.doesNotMatch(html, /wechat-rail-drawer/);
  assert.doesNotMatch(html, /room-stage-canvas/);

  // 保留 query 参数的跳转逻辑
  assert.match(html, /window\.location\.replace/);
  assert.match(html, /creative\.html/);
  assert.match(html, /URLSearchParams/);
  assert.match(html, /params\.forEach/);
});

test("creative.html carries resident OTP login from former user.html", async () => {
  const html = await readShellPage("creative.html");

  // 居民登录能力迁移标记
  assert.match(html, /data-resident-login="enabled"/);

  // OTP 登录卡片元素
  assert.match(html, /id="resident-login-card"/);
  assert.match(html, /id="auth-request-form"/);
  assert.match(html, /id="auth-verify-form"/);
  assert.match(html, /id="auth-delivery-select"/);
  assert.match(html, /id="auth-resident-input"/);
  assert.match(html, /id="auth-email-input"/);
  assert.match(html, /id="auth-code-input"/);
  assert.match(html, /id="auth-request-button"/);
  assert.match(html, /id="auth-verify-button"/);
  assert.match(html, /登录 \/ 注册/);

  // 使用通用样式类名
  assert.match(html, /class="[^"]*resident-login-card[^"]*"/);
  assert.match(html, /class="[^"]*resident-login-form[^"]*"/);
});

test("pretext stage module uses a browser-resolvable import path", async () => {
  const source = await readShellModule("pretext-stage.js");

  assert.doesNotMatch(source, /from "@chenglou\/pretext"/);
  assert.match(source, /from "\.\/node_modules\/@chenglou\/pretext\/dist\/layout\.js"/);
});

test("pixel scene backgrounds use web-optimized runtime assets", async () => {
  const css = await readShellModule("styles.pixel-map.css");
  const worldCss = await readShellModule("styles.world-entry.css");
  const squareCss = await readShellModule("styles.world-square.css");

  assert.match(css, /hub-main-city-scene-v1-256\.png/);
  assert.match(css, /hub-main-city-scene-v1-mobile-256\.png/);
  assert.match(css, /creative-room-scene-v2-256\.png/);
  assert.match(css, /creative-room-scene-v2-mobile-256\.png/);
  assert.doesNotMatch(css, /hub-city-map\.avif/);
  assert.doesNotMatch(css, /creative-room-map\.avif/);
  assert.match(css, /--scene-z-hotspot-clear/);
  assert.doesNotMatch(css, /hub-main-city-scene-v1\.png/);
  assert.doesNotMatch(css, /creative-room-scene-v2\.png/);
  assert.match(worldCss, /world-metro-station-scene-v1-256\.png/);
  assert.match(worldCss, /world-metro-station-scene-v1-mobile-256\.png/);
  assert.match(worldCss, /--world-z-hotspot-clear/);
  assert.doesNotMatch(worldCss, /world-entry-scene-v1\.(?:png|avif)/);
  assert.doesNotMatch(worldCss, /world-metro-station-scene-v1\.png/);

  // Brightened day-draft assets washed out the pixel art; keep original composed scenes until real day scenes exist.
  assert.doesNotMatch(css, /hub-main-city-scene-v1-day-draft\.avif/);
  assert.doesNotMatch(css, /creative-room-scene-v2-day-draft\.avif/);
  assert.doesNotMatch(worldCss, /world-metro-station-scene-v1-day-draft\.avif/);
  // world-square uses real day/night assets via body[data-time-of-day], not overlay.
  assert.match(squareCss, /world-square-concept-20260428-day-draft-256\.png/);
});

test("pixel scene hotspot labels stay hidden until hover or focus, including clear mode", async () => {
  const css = await readShellModule("styles.pixel-map.css");

  assert.match(
    css,
    /body\.scene-clear-mode\[data-shell-page="hub"\]\[data-shell-variant="public-square"\] \.scene-hotspot span,\s*body\.scene-clear-mode\[data-shell-variant="creative-terminal"\] \.scene-hotspot span\s*\{\s*opacity:\s*0 !important;/,
  );
  assert.match(
    css,
    /body\.scene-clear-mode\[data-shell-page="hub"\]\[data-shell-variant="public-square"\] \.scene-hotspot:hover span,[\s\S]*body\.scene-clear-mode\[data-shell-variant="creative-terminal"\] \.scene-hotspot\[aria-expanded="true"\] span\s*\{\s*opacity:\s*1 !important;/,
  );
});

test("world-entry hotspot css follows the metro contract", async () => {
  const worldCss = await readShellModule("styles.world-entry.css");

  assert.match(worldCss, /\.world-entry-hotspot--city\s*\{\s*left:\s*2%;\s*top:\s*12%;\s*width:\s*25%;\s*height:\s*52%;/);
  assert.match(worldCss, /\.world-entry-hotspot--map\s*\{\s*left:\s*29%;\s*top:\s*21%;\s*width:\s*15%;\s*height:\s*28%;/);
  assert.match(worldCss, /\.world-entry-hotspot--platform\s*\{\s*left:\s*30%;\s*top:\s*59%;\s*width:\s*27%;\s*height:\s*28%;/);
  assert.match(worldCss, /\.world-entry-hotspot--train\s*\{\s*left:\s*58%;\s*top:\s*18%;\s*width:\s*38%;\s*height:\s*58%;/);
  assert.match(worldCss, /@media \(max-width: 820px\)[\s\S]*\.world-entry-hotspot--city\s*\{\s*left:\s*7% !important;\s*top:\s*31% !important;/);
  assert.match(worldCss, /@media \(max-width: 820px\)[\s\S]*\.world-entry-hotspot--map\s*\{\s*left:\s*42% !important;\s*top:\s*33% !important;/);
  assert.match(worldCss, /@media \(max-width: 820px\)[\s\S]*\.world-entry-hotspot--train\s*\{\s*left:\s*70% !important;\s*top:\s*45% !important;/);
  assert.match(worldCss, /@media \(max-width: 820px\)[\s\S]*\.world-entry-hotspot--platform\s*\{\s*left:\s*48% !important;\s*top:\s*63% !important;/);
});

test("scene hotspot logic supports world-entry stages", async () => {
  const source = await readShellModule("app.js");

  assert.match(source, /world-entry-stage/);
  assert.match(source, /sceneClearRestoreEl\?\.addEventListener/);
  assert.match(source, /function escapeHtml/);
});

test("world-entry runtime preserves the metro entry title", async () => {
  const source = await readShellModule("app.js");

  assert.match(source, /shellPage !== "hub" && shellPage !== "world-entry"/);
  assert.match(
    source,
    /if \(shellPage !== "hub" && shellPage !== "world-entry"\) \{\s*document\.title = `龙虾聊天 · \$\{translateShellMode\(shellMode\)\}`;\s*\}/
  );
});

test("world-entry route hydration uses gateway projection without innerHTML sinks", async () => {
  const source = await readShellModule("app.js");

  assert.match(source, /async function loadWorldEntry\(\)/);
  assert.match(source, /fetch\(`\$\{gatewayUrl\}\/v1\/world-entry`\)/);
  assert.match(source, /routeList\.replaceChildren\(\)/);
  assert.match(source, /document\.createElement\("a"\)/);
  assert.match(source, /option\.setAttribute\("href", route\.href \|\| "#"\)/);
  assert.match(source, /title\.textContent = route\.title \|\| ""/);
  assert.match(source, /desc\.textContent = route\.description/);
  assert.match(source, /status\.textContent = route\.is_current \? `当前主城 · \$\{route\.status_label\}` : route\.status_label/);
  assert.doesNotMatch(source, /world-route[\s\S]{0,500}\.innerHTML\s*=/);
});

test("composer symbol menu switches categories with tabs", async () => {
  const source = await readShellModule("app.js");
  const css = await readShellModule("styles.pixel-map.css");

  assert.match(source, /function initializeComposerSymbolTabs/);
  assert.match(source, /composer-symbol-tabs/);
  assert.match(source, /data-symbol-tab/);
  assert.match(source, /selectCategory\(0\)/);
  assert.match(css, /composer-symbol-tabs/);
  assert.match(css, /composer-symbol-tab\.is-active/);
  assert.match(css, /composer-symbol-menu\.is-tabbed \.composer-symbol-category\[hidden\]/);
});

test("pixel scene pages suppress scroll-to-bottom floating button", async () => {
  const css = await readShellModule("styles.pixel-map.css");

  assert.match(css, /body\[data-shell-page="hub"\]\[data-shell-variant="public-square"\] #timeline\.public-square-log \.scroll-to-bottom/);
  assert.match(css, /body\[data-shell-variant="creative-terminal"\] \.creative-chat-frame \.scroll-to-bottom/);
});

test("timeline message text is rendered through textContent sinks", async () => {
  const source = await readShellModule("app.js");

  assert.match(
    source,
    /function createMessageBodyNode\(message, options = \{\}\) \{[\s\S]*body\.textContent = message\.text/
  );
  assert.match(source, /label\.textContent = field\.label/);
  assert.match(source, /value\.textContent = field\.value/);
  assert.match(source, /notes\.textContent = structured\.notes\.join\("\\n"\)/);
  assert.doesNotMatch(source, /innerHTML\s*=\s*[^;\n]*message\.text/);
  assert.doesNotMatch(source, /message\.text[^;\n]*innerHTML/);
});

test("gateway send clears pending echo only after successful refresh", async () => {
  const source = await readShellModule("app.js");

  assert.match(
    source,
    /await postGatewayJson\("\/v1\/shell\/message", payload\);\s*posted = true;\s*delete roomSendErrors\[roomId\];\s*await refreshFromGateway\(\{ requireShell: true \}\);\s*clearPendingEchoes\(roomId\);/,
  );
});

test("gateway render hides pending echo once committed copy is present", async () => {
  const source = await readShellModule("app.js");

  assert.match(source, /function visiblePendingEchoesForRoom\(room\) \{/);
  assert.match(source, /messageMatchesPendingEcho\(message, pending\)/);
  assert.match(source, /const pending = visiblePendingEchoesForRoom\(room\);/);
  assert.doesNotMatch(source, /const pending = pendingEchoesForRoom\(room\.id\);/);
});

test("gateway send failure keeps composer cleared and stops pending typing", async () => {
  const source = await readShellModule("app.js");

  assert.doesNotMatch(source, /if \(!posted\) \{\s*updateRoomDraft\(roomId, text\);\s*composerInputEl\.value = text;/);
  assert.match(source, /if \(pending\.some\(\(message\) => !message\.failed\)\) \{/);
});

test("composer submit ignores duplicate send while a message is in flight", async () => {
  const source = await readShellModule("app.js");

  assert.match(
    source,
    /async function submitComposerMessage\(\) \{\s*if \(isSendingMessage\) \{\s*updateComposerState\(\);\s*return false;\s*\}/,
  );
});

test("gateway errors read transport Error message and localize common send failures", async () => {
  const source = await readShellModule("app.js");

  assert.match(source, /function gatewayErrorMessage\(parsed, text, status\) \{/);
  assert.match(source, /parsed\?\.Error\?\.message/);
  assert.match(source, /const message = gatewayErrorMessage\(parsed, text, response\.status\);/);
  assert.match(source, /message === "login required before sending messages"[\s\S]*return "请先登录后发送"/);
  assert.match(source, /message === "message text required"[\s\S]*return "请输入内容后发送"/);
});

test("qa identity query can isolate same-origin browser tabs", async () => {
  const source = await readShellModule("app.js");

  assert.match(source, /const queryIdentity = new URLSearchParams\(window\.location\.search\)\.get\("identity"\)\?\.trim\(\);/);
  assert.match(source, /if \(queryIdentity\) \{\s*senderIdentity = queryIdentity;\s*\} else \{/);
});

test("chat-scene pages do not collapse avatars through message grouping", async () => {
  const source = await readShellModule("app.js");

  assert.match(source, /const allowMessageGrouping = shellPage !== "hub" && shellPage !== "user";/);
  assert.match(source, /if \(allowMessageGrouping && isGrouped\) \{\s*row\.setAttribute\("data-grouped", "true"\);/);
});

test("chat-scene pages do not insert unread divider copy into the scene", async () => {
  const source = await readShellModule("app.js");

  assert.match(source, /const allowUnreadDivider = shellPage !== "hub" && shellPage !== "user";/);
  assert.match(source, /const unreadForDivider = allowUnreadDivider \? unreadCount\(room\) : 0;/);
});

test("pixel scene chrome uses shared dark rail and local time of day", async () => {
  const source = await readShellModule("app.js");
  const pixelCss = await readShellModule("styles.pixel-map.css");
  const worldCss = await readShellModule("styles.world-entry.css");
  const squareCss = await readShellModule("styles.world-square.css");
  const baseCss = await readShellModule("styles.css");

  assert.match(source, /function localTimeOfDay\(date = new Date\(\)\)/);
  assert.match(source, /document\.body\.dataset\.timeOfDay = localTimeOfDay\(\)/);
  assert.match(pixelCss, /2026-04-28: shared IM scene chrome baseline/);
  assert.match(pixelCss, /Do not fake day scenes with light screen overlays/);
  assert.match(pixelCss, /data-time-of-day="day"[\s\S]*mix-blend-mode: normal !important/);
  assert.doesNotMatch(pixelCss, /data-time-of-day="day"[\s\S]*mix-blend-mode: screen/);
  assert.match(pixelCss, /creative-stage::before,[\s\S]*content: none !important/);
  assert.match(pixelCss, /creative-chat-frame \{[\s\S]*background: transparent !important/);
  assert.doesNotMatch(pixelCss, /creative-chat-frame \{[\s\S]{0,260}linear-gradient\(180deg, rgba\(13, 8, 5, 0\.10\)/);
  assert.match(pixelCss, /public-square-rail,[\s\S]*creative-rail[\s\S]*linear-gradient\(180deg, rgba\(45, 28, 15, 0\.96\)/);
  assert.match(baseCss, /public-square-rail \{[\s\S]*linear-gradient\(180deg, rgba\(45, 28, 15, 0\.96\)/);
  assert.match(baseCss, /public-square-rail \.rail-item \{[\s\S]*color: #fff2c9/);
  assert.doesNotMatch(pixelCss, /body\[data-time-of-day="day"\]\[data-shell-page="hub"\]\[data-shell-variant="public-square"\] \.public-square-stage \{[\s\S]*hub-main-city-scene-v1-day-draft\.avif/);
  assert.match(worldCss, /world-entry-rail[\s\S]*linear-gradient\(180deg, rgba\(45, 28, 15, 0\.96\)/);
  assert.match(worldCss, /body\[data-time-of-day="day"\] \.world-entry-scene::after/);
  assert.doesNotMatch(worldCss, /body\[data-time-of-day="day"\][\s\S]*mix-blend-mode: screen/);
  assert.match(squareCss, /body\[data-time-of-day="day"\] \.world-square-scene/);
  assert.doesNotMatch(squareCss, /body\[data-time-of-day="day"\] \.world-square-scene::after/);
  assert.doesNotMatch(squareCss, /body\[data-time-of-day="day"\][\s\S]*mix-blend-mode: screen/);
  assert.match(baseCss, /\.hud-title \{[\s\S]*font-family: "Noto Sans SC"/);
  assert.match(baseCss, /\.hud-title \{[\s\S]*align-items: center/);
});

test("scene pages keep one desktop rail width and stretch the stage frame", async () => {
  const pixelCss = await readShellModule("styles.pixel-map.css");
  const publicCss = await readShellModule("styles.css");
  const worldCss = await readShellModule("styles.world-square.css");

  assert.match(
    pixelCss,
    /body\[data-shell-variant="creative-terminal"\]\s+\.creative-layout\s*\{\s*grid-template-columns:\s*220px\s+minmax\(0,\s*1fr\)\s*!important;/,
  );
  assert.match(
    pixelCss,
    /body\[data-shell-variant="creative-terminal"\]\s+\.creative-stage\s*\{[\s\S]*?height:\s*100%;[\s\S]*?justify-self:\s*stretch;[\s\S]*?align-self:\s*stretch;/,
  );
  assert.match(
    publicCss,
    /body\[data-shell-page="hub"\]\[data-shell-variant="public-square"\]\s+\.public-square-layout\s*\{\s*grid-template-columns:\s*220px\s+minmax\(0,\s*1fr\);/,
  );
  assert.match(worldCss, /\.world-square-shell\s*\{[\s\S]*?grid-template-columns:\s*220px\s+minmax\(0,\s*1fr\);/);
});

test("scene clear mode can be exited with Escape", async () => {
  const source = await readShellModule("app.js");

  assert.match(source, /event\.key === "Escape" && isSceneClearMode\(\)/);
  assert.match(source, /setSceneClearMode\(false\)/);
});

test("creative mobile rail drawer exposes state and closes from Escape", async () => {
  const html = await readShellPage("creative.html");
  const source = await readShellModule("app.js");
  const pixelCss = await readShellModule("styles.pixel-map.css");

  assert.match(html, /id="hud-rail-toggle"[^>]*aria-controls="creative-rail"/);
  assert.match(html, /id="hud-rail-toggle"[^>]*aria-expanded="false"/);
  assert.match(html, /<aside[^>]*id="creative-rail"[^>]*aria-hidden="true"/);
  assert.match(source, /function setSfcRailOpen\(open\)/);
  assert.match(source, /hudRailToggleEl\.setAttribute\("aria-expanded", open \? "true" : "false"\)/);
  assert.match(source, /sfcRailEl\.setAttribute\("aria-hidden", open \? "false" : "true"\)/);
  assert.match(source, /document\.body\.classList\.toggle\("rail-drawer-open", open\)/);
  assert.match(source, /event\.key === "Escape" && sfcRailEl\?\.classList\.contains\("open"\)/);
  assert.match(pixelCss, /body\.rail-drawer-open\[data-shell-variant="creative-terminal"\] \.creative-shell::before/);
  assert.match(pixelCss, /body\[data-shell-variant="creative-terminal"\] \.creative-rail\.open/);
});

test("scene intro first-run hint is visible but disappears after first visit", async () => {
  const source = await readShellModule("app.js");
  const pixelCss = await readShellModule("styles.pixel-map.css");

  assert.match(source, /document\.body\.classList\.add\("scene-intro-first"\)/);
  assert.match(pixelCss, /body\.scene-intro-first\[data-shell-variant="creative-terminal"\] \.creative-stage::after/);
  assert.match(pixelCss, /点击空白处收起界面/);
  assert.match(pixelCss, /body\.scene-intro-seen\[data-shell-variant="creative-terminal"\] \.creative-stage::after/);
}
);

test("scene chat empty row space can clear the chrome", async () => {
  const source = await readShellModule("app.js");
  const pixelCss = await readShellModule("styles.pixel-map.css");

  assert.doesNotMatch(source, /closest\("\\.message, \\.message-row, \\.message-quick-action"\)/);
  assert.match(source, /event\.target === timelineEl \|\| event\.target\.closest\("\.message-row, \.message-stack"\)/);
  assert.match(pixelCss, /#timeline\.public-square-log \.message-row,[\s\S]*#timeline\.creative-chat-log \.message-row \{[\s\S]*animation: none !important/);
});

test("world-square info card closes from blank clicks", async () => {
  const html = await readShellPage("world-square.html");

  assert.match(html, /const infoCard = document\.querySelector\("\.world-square-card"\);/);
  assert.match(html, /document\.addEventListener\("click", \(event\) => \{/);
  assert.match(html, /if \(infoCard\.contains\(event\.target\)\) return;\s*infoCard\.open = false;/);
});

test("shell pages declare a favicon to avoid browser 404 noise", async () => {
  for (const page of ["index.html", "user.html", "admin.html", "unified.html"]) {
    const html = await readShellPage(page);
    assert.match(html, /<link rel="icon" href="data:," ?\/>/);
  }
});
