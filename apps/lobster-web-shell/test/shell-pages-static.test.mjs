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

function assertInOrder(source, markers, context) {
  let cursor = -1;
  for (const marker of markers) {
    const index = source.indexOf(marker, cursor + 1);
    assert.notEqual(index, -1, `${context} missing marker: ${marker}`);
    assert.ok(index > cursor, `${context} marker out of order: ${marker}`);
    cursor = index;
  }
}

test("hub page is now main-city group chat page with canvas and timeline", async () => {
  const html = await readShellPage("index.html");

  assert.match(html, /<title>龙虾聊天 · 主城群聊<\/title>/);
  assert.match(html, /data-sfc-theme="city"/);
  assert.match(html, /class="[^"]*sfc-city-shell[^"]*"/);
  assert.match(html, /id="room-stage-canvas"/);
  assert.match(html, /id="timeline"/);
  assert.match(html, /id="composer"/);
  assert.match(html, /styles\.base\.css\?v=20260612-css-split/);
  assert.match(html, /styles\.scene\.css\?v=20260612-css-split/);
  assert.match(html, /styles\.chat\.css\?v=20260612-css-split/);
  assert.match(html, /styles\.css\?v=20260525-h5-shell-fix-v2/);
  assert.match(html, /styles\.user-shell\.css\?v=20260612-user-shell-extract/);
  assert.match(html, /styles\.pixel-map\.css\?v=20260525-h5-shell-fix-v2/);
  assert.match(html, /app\.js\?v=20260616-clear-empty-skeleton/);
  assert.match(html, /data-symbol-trigger/);
  assert.match(html, /composer-symbol-category/);
  assert.match(html, /高兴/);
  assert.match(html, /生气/);
  assert.match(html, /震惊 \/ 尴尬/);
  assert.match(html, /@用户名/);
  assert.match(html, /class="[^"]*sfc-city-stage[^"]*"/);
  // 居民侧主导航统一为住宅、主城、世界（指向 world-square）+ 场景。
  assert.match(html, /href="\.\/creative\.html"/);
  assert.match(html, /href="\.\/index\.html"/);
  assert.match(html, /href="\.\/world-square\.html"/);
  assert.match(html, /class="scene-hotspot scene-hotspot--metro"/);
  assert.match(html, /href="\.\/world-square\.html"[\s\S]*地铁口/);
  assert.doesNotMatch(html, /pixel-map--city|map-sprite--city/);
  assert.doesNotMatch(html, /href="\.\/admin\.html"/);
});

test("creative page is the residential pixel room entry", async () => {
  const html = await readShellPage("creative.html");

  assert.match(html, /<title>龙虾聊天 · 住宅<\/title>/);
  assert.match(html, /data-shell-page="user"/);
  assert.match(html, /data-shell-variant="creative-terminal"/);
  assert.match(html, /data-default-shell-mode="user"/);
  assert.match(html, /data-default-room-id="dm:rsaga:builder"/);
  assert.match(html, /href="\.\/creative\.html" class="rail-item is-active" aria-current="page"/);
  assert.match(html, /href="\.\/index\.html"/);
  assert.match(html, /href="\.\/world-square\.html"/);
  assert.match(html, /class="scene-hotspot scene-hotspot--stairs"/);
  assert.match(html, /href="\.\/index\.html"[\s\S]*楼梯/);
  assert.match(html, /<div class="creative-rail-divider">[\s\S]*?居民[\s\S]*?<\/div>/);
  assert.match(html, /头像是居民房间入口，点击后确认进入对方房间私聊。/);
  assert.match(html, /id="room-search-input"/);
  assert.match(html, /placeholder="搜索居民或房间..."/);
  assert.match(html, /id="personal-room-access-policy"/);
  assert.match(html, /data-rail-visibility="owner-only"/);
  assert.match(html, /data-personal-room-policy="friends_only"/);
  assert.match(html, /data-personal-room-policy="registered_all"/);
  assert.match(html, /styles\.creative\.css\?v=20260525-h5-shell-fix-v2/);
  assert.match(html, /styles\.user-shell\.css\?v=20260612-user-shell-extract/);
  assert.match(html, /styles\.pixel-map\.css\?v=20260525-h5-shell-fix-v2/);
  assert.match(html, /app\.js\?v=20260626-ownership/);
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
  assert.match(html, /href="\.\/styles\.base\.css\?v=20260612-css-split"/);
  assert.match(html, /href="\.\/styles\.scene\.css\?v=20260612-css-split"/);
  assert.match(html, /href="\.\/styles\.chat\.css\?v=20260612-css-split"/);
  assert.match(html, /href="\.\/styles\.css\?v=20260525-h5-shell-fix-v2"/);
  assert.match(html, /href="\.\/styles\.user-shell\.css\?v=20260612-user-shell-extract"/);
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
  // 切换每个 data-admin-category 后摘要更新：switchCategory 调用 renderSummary(category)
  assert.match(html, /renderSummary\(category\)/);
  for (const cat of ["session", "resident", "room", "safety", "notice", "world", "system"]) {
    assert.match(html, new RegExp(`${cat}:\\s*\\{`));
  }

  // renderSummary 不再展示分类描述（desc 已移除）；primaryReason 用 textContent
  assert.doesNotMatch(html, /descEl\.textContent\s*=\s*catalog\.desc/);
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
  const css = await readShellModule("styles.admin.css");

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

  // app.js 中 admin 相关消息渲染也走 textContent（buildNodeFromSpec 用 textContent 落地 spec）
  assert.match(source, /function createMessageBodyNode\(message, options = \{\}\)/);
  assert.match(source, /node\.textContent = spec\.text/);
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
  const css = await readShellModule("styles.admin.css");
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
  const css = await readShellModule("styles.admin.css");

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

test("workspace application state and DOM sync are delegated out of applyWorkspace", async () => {
  const source = await readShellModule("app.js");
  const viewStateResolver = sliceBetween(
    source,
    "function workspaceViewState() {",
    "function applyWorkspaceBodyState(viewState) {",
  );
  const bodyStateApplier = sliceBetween(
    source,
    "function applyWorkspaceBodyState(viewState) {",
    "function syncWorkspaceTabState() {",
  );
  const tabSyncer = sliceBetween(
    source,
    "function syncWorkspaceTabState() {",
    "function applyWorkspacePanelVisibility(viewState) {",
  );
  const panelVisibilityApplier = sliceBetween(
    source,
    "function applyWorkspacePanelVisibility(viewState) {",
    "function applyWorkspaceChromeEnhancements() {",
  );
  const chromeEnhancer = sliceBetween(
    source,
    "function applyWorkspaceChromeEnhancements() {",
    "function applyWorkspace() {",
  );
  const workspaceApplier = sliceBetween(
    source,
    "function applyWorkspace() {",
    "function updatePanelTitles() {",
  );

  assert.match(viewStateResolver, /const shellPage = currentShellPage\(\)/);
  assert.match(viewStateResolver, /inlineChatDetail: currentWorkspace === "chat" && isUserShell/);
  assert.match(viewStateResolver, /showChatGovernanceRail: currentWorkspace === "governance"/);
  assert.match(bodyStateApplier, /document\.body\.dataset\.workspace = currentWorkspace/);
  assert.match(bodyStateApplier, /syncChatFocusWithWorkspace\(\)/);
  assert.match(bodyStateApplier, /document\.body\.dataset\.chatPane = currentWorkspace === "chat" \? chatPaneMode : "split"/);
  assert.match(bodyStateApplier, /layoutEl\?\.classList\.toggle\("layout-chat-inline-detail", viewState\.inlineChatDetail\)/);
  assert.match(tabSyncer, /for \(const button of workspaceTabs\) \{/);
  assert.match(tabSyncer, /button\.setAttribute\("aria-current", "page"\)/);
  assert.match(panelVisibilityApplier, /guidePanelEl\?\.classList\.toggle/);
  assert.match(panelVisibilityApplier, /governancePanelEl\?\.classList\.toggle/);
  assert.match(panelVisibilityApplier, /toggleElements\(governanceBrowseBlocks/);
  assert.match(panelVisibilityApplier, /toggleElements\(worldActionForms/);
  assert.match(panelVisibilityApplier, /toggleElements\(governanceAdminForms/);
  assert.match(chromeEnhancer, /ensureChatFocusToggle\(\)/);
  assert.match(chromeEnhancer, /ensureConversationCallout\(\)/);
  assert.match(chromeEnhancer, /ensureChatPaneToggle\(\)/);
  assert.match(workspaceApplier, /const viewState = workspaceViewState\(\)/);
  assert.match(workspaceApplier, /applyWorkspaceBodyState\(viewState\)/);
  assert.match(workspaceApplier, /syncWorkspaceTabState\(\)/);
  assert.match(workspaceApplier, /applyWorkspacePanelVisibility\(viewState\)/);
  assert.match(workspaceApplier, /applyWorkspaceChromeEnhancements\(\)/);
  assert.doesNotMatch(workspaceApplier, /for \(const button of workspaceTabs\)/);
  assert.doesNotMatch(workspaceApplier, /guidePanelEl\?\.classList\.toggle/);
  assert.doesNotMatch(workspaceApplier, /ensureChatQuickLinks\(\)/);
});

test("shell mode DOM sync is delegated out of applyShellMode", async () => {
  const source = await readShellModule("app.js");
  const viewStateResolver = sliceBetween(
    source,
    "function shellModeViewState() {",
    "function applyShellModeBodyDataset(viewState) {",
  );
  const bodyDatasetSync = sliceBetween(
    source,
    "function applyShellModeBodyDataset(viewState) {",
    "function updateShellModeBadge(viewState) {",
  );
  const badgeSync = sliceBetween(
    source,
    "function updateShellModeBadge(viewState) {",
    "function updateShellModeDocumentTitle(viewState) {",
  );
  const titleSync = sliceBetween(
    source,
    "function updateShellModeDocumentTitle(viewState) {",
    "function updateShellModeMasthead(viewState) {",
  );
  const mastheadSync = sliceBetween(
    source,
    "function updateShellModeMasthead(viewState) {",
    "function renderShellModeGuide(config) {",
  );
  const guideRenderer = sliceBetween(
    source,
    "function renderShellModeGuide(config) {",
    "function toggleShellModeEntryGrid(shellPage) {",
  );
  const entryGridToggle = sliceBetween(
    source,
    "function toggleShellModeEntryGrid(shellPage) {",
    "function toggleShellModeStatusChrome(compactShell) {",
  );
  const statusToggle = sliceBetween(
    source,
    "function toggleShellModeStatusChrome(compactShell) {",
    "function toggleAdminShellRoleVisibility(hideAdmin) {",
  );
  const adminToggle = sliceBetween(
    source,
    "function toggleAdminShellRoleVisibility(hideAdmin) {",
    "function applyShellMode() {",
  );
  const applySource = sliceBetween(
    source,
    "function applyShellMode() {",
    "function updateShellEntryCards(mode) {",
  );

  assert.match(viewStateResolver, /shellMode = resolveShellMode\(\)/);
  assert.match(viewStateResolver, /compactShell = shellPage === "user" \|\| shellPage === "admin"/);
  assert.match(bodyDatasetSync, /document\.body\.dataset\.shellMode = viewState\.shellMode/);
  assert.match(badgeSync, /shellModeBadgeEl\.textContent/);
  assert.match(badgeSync, /shellModeBadgeEl\.classList\.toggle\("shell-hidden", viewState\.compactShell\)/);
  assert.match(titleSync, /document\.title = `龙虾聊天 · \$\{translateShellMode\(viewState\.shellMode\)\}`/);
  assert.match(mastheadSync, /mastheadEyebrowEl\.textContent = viewState\.shellPage === "hub" \? "龙虾聊天" : viewState\.config\.eyebrow/);
  assert.match(guideRenderer, /for \(const item of config\.guide\) \{/);
  assert.match(entryGridToggle, /entryGridEl\.classList\.toggle\("shell-hidden", shellPage !== "hub"\)/);
  assert.match(statusToggle, /transportStateEl\?\.classList\.toggle\("shell-hidden", compactShell\)/);
  assert.match(adminToggle, /document\.querySelectorAll\("\[data-shell-role='admin'\]"\)/);
  assert.match(applySource, /const viewState = shellModeViewState\(\)/);
  assert.match(applySource, /applyShellModeBodyDataset\(viewState\)/);
  assert.match(applySource, /renderShellModeGuide\(viewState\.config\)/);
  assert.match(applySource, /toggleAdminShellRoleVisibility\(viewState\.shellMode === "user"\)/);
  assert.doesNotMatch(applySource, /document\.querySelectorAll\("\[data-shell-role='admin'\]"\)/);
  assert.doesNotMatch(applySource, /modeGuideEl\.appendChild\(div\)/);
});

test("workspace chrome DOM assembly is delegated out of ensureWorkspaceChrome", async () => {
  const source = await readShellModule("app.js");
  const navSync = sliceBetween(
    source,
    "function syncWorkspaceNavigationChrome(userProjection, hubProjection) {",
    "function createWorkspaceNavElement() {",
  );
  const navRenderer = sliceBetween(
    source,
    "function renderWorkspaceNavigationTabs() {",
    "function createRoomSearchInput(config) {",
  );
  const userSearch = sliceBetween(
    source,
    "function ensureUserRoomSearchControls(userProjection) {",
    "function ensureSearchModeControls() {",
  );
  const toolbar = sliceBetween(
    source,
    "function ensureRoomToolbarChrome(userProjection) {",
    "function ensureConversationOverviewChrome() {",
  );
  const composer = sliceBetween(
    source,
    "function ensureComposerStatusChrome() {",
    "function ensureNonUserCaretakerChrome(userProjection) {",
  );
  const chromeEnsurer = sliceBetween(
    source,
    "function ensureWorkspaceChrome() {",
    "function bindRoomSearchInput() {",
  );

  assert.match(navSync, /workspaceNavEl\.remove\(\)/);
  assert.match(navSync, /workspaceNavEl = createWorkspaceNavElement\(\)/);
  assert.match(navRenderer, /availableWorkspacesForShellMode\(shellMode\)\.map/);
  assert.match(userSearch, /createRoomSearchInput\(\{/);
  assert.match(userSearch, /ensureSearchModeControls\(\)/);
  assert.match(toolbar, /roomListEl\.insertAdjacentElement\("beforebegin", createRoomToolbar\(\)\)/);
  assert.match(composer, /composerStatusEl\.className = "composer-status composer-status-muted"/);
  assert.match(composer, /ensureRoomViewToggleChrome\(userProjection\)/);
  assert.match(chromeEnsurer, /syncWorkspaceNavigationChrome\(userProjection, hubProjection\)/);
  assert.match(chromeEnsurer, /ensureUserRoomSearchControls\(userProjection\)/);
  assert.match(chromeEnsurer, /ensureRoomToolbarChrome\(userProjection\)/);
  assert.match(chromeEnsurer, /ensureNonUserCaretakerChrome\(userProjection\)/);
  assert.doesNotMatch(chromeEnsurer, /document\.createElement\("nav"\)/);
  assert.doesNotMatch(chromeEnsurer, /document\.createElement\("input"\)/);
  assert.doesNotMatch(chromeEnsurer, /document\.createElement\("button"\)/);
});

test("admin tools panel css has high-contrast action status labels", async () => {
  const shared = await readShellModule("styles.css");
  const adminCss = await readShellModule("styles.admin.css");

  assert.match(adminCss, /\.admin-nav-shell/);
  assert.match(adminCss, /\.admin-nav-panel/);
  assert.match(adminCss, /\.admin-nav-toggle/);
  assert.match(adminCss, /\.admin-nav-item/);
  assert.match(adminCss, /\[data-admin-nav="collapsed"\]/);
  assert.match(adminCss, /body\[data-shell-page="admin"\]\[data-admin-nav="collapsed"\] \.layout-admin-shell/);
  assert.match(shared, /\.tool-group\s*\{/);
  assert.match(shared, /\.tool-group-title\s*\{/);
  assert.match(shared, /\.action-row\s*\{/);
  assert.match(shared, /\.action-status\s*\{/);
  assert.match(shared, /\.action-status-available\s*\{/);
  assert.match(shared, /\.action-status-pending\s*\{/);
  assert.match(shared, /\.action-status-readonly\s*\{/);
  assert.match(shared, /\.action-status-gateway\s*\{/);
  assert.match(adminCss, /body\[data-shell-page="admin"\]\s+\.tool-group\s*\{/);
  assert.match(adminCss, /body\[data-shell-page="admin"\]\s+\.action-status-gateway\s*\{/);
});

test("unified page is world-entry metro station with pixel scene and hotspots", async () => {
  const html = await readShellPage("unified.html");

  assert.match(html, /<title>龙虾聊天 · 世界入口<\/title>/);
  assert.match(html, /data-shell-page="world-entry"/);
  assert.match(html, /data-shell-variant="metro-station"/);
  assert.match(html, /data-default-shell-mode="unified"/);
  assert.match(html, /data-sfc-theme="city"/);
  assert.match(html, /href="\.\/styles\.world-entry\.css\?v=20260525-h5-shell-fix-v2/);
  assert.match(html, /app\.js\?v=20260616-clear-empty-skeleton/);
  assert.match(html, /href="\.\/creative\.html"/);
  assert.match(html, /href="\.\/index\.html"/);
  assert.match(html, /href="\.\/world-square\.html"/);
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
  assert.match(html, /href="\.\/index\.html"/);
  assert.match(css, /world-square-concept-20260427-256\.png/);
  assert.match(css, /世界广场/);
  assert.match(html, /styles\.world-square\.css\?v=20260525-h5-shell-fix-v2/);
  assert.match(html, /dataset\.timeOfDay/);
  assert.match(html, /\/v1\/world-square/);
  assert.match(html, /textContent/);
  assert.doesNotMatch(html, /innerHTML/);
  // Day asset uses the same geometry as the night scene; do not preload the old pale draft.
  assert.doesNotMatch(html, /preloadAsset.*world-square-concept-20260428-day-draft-256\.png/);
  assert.match(css, /world-square-concept-day-256\.png/);
  assert.doesNotMatch(css, /body\[data-time-of-day="day"\]\s+\.world-square-scene::after/);
  assert.match(html, /world-square-readonly-grid/);
  assert.match(html, /<details class="world-square-card world-square-card--compact" aria-label="世界广场说明">/);
  assert.match(html, /<summary class="world-square-card-toggle">广场信息<\/summary>/);
  assert.match(html, /class="rail-title">导航<\/div>/);
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

test("world-square resident login wires shared standalone OTP auth", async () => {
  const html = await readShellPage("world-square.html");

  assert.match(html, /id="resident-login-overlay"/);
  assert.match(html, /id="auth-request-form"/);
  assert.match(html, /id="auth-verify-form"/);
  assert.match(html, /import \{ initStandaloneAuthSurface \} from "\.\/shell-auth-standalone\.js";/);
  assert.match(html, /initStandaloneAuthSurface\(\{[\s\S]*gatewayUrl[\s\S]*onIdentityChanged:\s*updateHudForIdentity/);
  assert.doesNotMatch(html, /import \{ initAuth \} from "\.\/shell-auth\.js";/);
});

test("world-square reuses the private-room rail chrome", async () => {
  const html = await readShellPage("world-square.html");
  const css = await readShellModule("styles.world-square.css");

  assert.match(html, /<aside class="sfc-rail creative-rail world-square-rail" data-shell-column="rooms" aria-label="站点导航">/);
  assert.match(html, /<div class="creative-rail-stack">[\s\S]*?<div class="rail-title">导航<\/div>[\s\S]*?<div class="rail-actions">/);
  assert.match(html, /<div class="creative-rail-divider">[\s\S]*?<span>广场<\/span>[\s\S]*?class="creative-rail-search world-square-rail-search"/);
  assert.match(html, /<span class="rail-label">住宅<\/span>/);
  assert.match(html, /<span class="rail-label">主城<\/span>/);
  assert.match(html, /<span class="rail-label">世界<\/span>/);
  assert.doesNotMatch(html, /rail-item-label/);
  assert.match(
    css,
    /\.world-square-rail\s*\{[\s\S]*?linear-gradient\(180deg,\s*rgba\(23,\s*18,\s*16,\s*0\.96\),\s*rgba\(16,\s*12,\s*11,\s*0\.98\)\);[\s\S]*?border:\s*1px solid rgba\(220,\s*185,\s*106,\s*0\.22\);/,
  );
  assert.match(css, /\.world-square-rail \.creative-rail-divider\s*\{/);
});

test("creative hub and world-square pages preserve the three-layer scene stack", async () => {
  const creativeHtml = await readShellPage("creative.html");
  const hubHtml = await readShellPage("index.html");
  const worldHtml = await readShellPage("world-square.html");
  const worldCss = await readShellModule("styles.world-square.css");

  assertInOrder(
    creativeHtml,
    [
      '<section class="sfc-stage creative-stage"',
      '<div class="scene-hotspot-label-layer creative-hotspot-label-layer" aria-hidden="true"></div>',
      '<div class="scene-hotspots creative-hotspots"',
      '<div class="creative-chat-frame">',
      '<form id="composer" class="sfc-composer creative-composer">',
    ],
    "creative three-layer stack",
  );
  assertInOrder(
    hubHtml,
    [
      '<section class="sfc-stage sfc-city-stage public-square-stage">',
      'class="stage-canvas public-square-stage-canvas"',
      '<div class="scene-hotspot-label-layer public-square-hotspot-label-layer" aria-hidden="true"></div>',
      '<div class="scene-hotspots public-square-hotspots"',
      '<div class="sfc-chat-bar sfc-city-chat public-square-chat">',
      '<form id="composer" class="sfc-composer sfc-city-composer public-square-composer">',
    ],
    "hub three-layer stack",
  );
  assertInOrder(
    worldHtml,
    [
      '<section class="world-square-stage" aria-label="世界广场概念图">',
      '<div class="world-square-scene" role="img" aria-label="世界广场完整概念图"></div>',
      '<div class="scene-hotspot-label-layer world-square-label-layer" aria-hidden="true">',
      '<div class="scene-hotspots world-square-hotspots" aria-label="世界广场热点">',
      '<details class="world-square-card world-square-card--compact" aria-label="世界广场说明">',
    ],
    "world-square four-layer stack",
  );

  assert.match(worldCss, /\.world-square-scene\s*\{[\s\S]*?z-index:\s*1;[\s\S]*?pointer-events:\s*none;/);
  assert.match(worldCss, /\.world-square-label-layer\s*\{[\s\S]*?z-index:\s*2;[\s\S]*?pointer-events:\s*none;/);
  assert.match(worldCss, /\.world-square-hotspots\s*\{[\s\S]*?z-index:\s*3;[\s\S]*?pointer-events:\s*none;/);
  assert.match(worldCss, /\.world-square-hotspots \.scene-hotspot\s*\{[\s\S]*?pointer-events:\s*auto;[\s\S]*?background:\s*transparent;[\s\S]*?border-color:\s*transparent;/);
  assert.match(worldCss, /\.world-square-hotspots \.scene-hotspot\s*\{[\s\S]*?width:\s*64px;[\s\S]*?height:\s*34px;/);
  assert.match(worldCss, /\.world-square-card\s*\{[\s\S]*?z-index:\s*4;/);

  const dayBlock = sliceBetween(
    worldCss,
    'body[data-time-of-day="day"] .world-square-scene::before {',
    "\n}\n\n.world-square-card",
  );
  assert.doesNotMatch(dayBlock, /linear-gradient/);
  assert.doesNotMatch(dayBlock, /rgba\(255,\s*2\d{2},/);
  assert.match(dayBlock, /world-square-concept-day-256\.png/);
});

test("scene interaction contract keeps labels separate and hotspots transparent", async () => {
  const source = await readShellModule("shell-scene-runtime.js");
  const pixelCss = await readShellModule("styles.pixel-map.css");
  const worldCss = await readShellModule("styles.world-square.css");

  assert.match(source, /labelLayerSelector = "\.scene-hotspot-label-layer"/);
  assert.match(source, /function renderHotspotLabelLayer\(\)/);
  assert.match(source, /scene-hotspot-label-chip/);
  assert.match(source, /setHotspotLabelsVisible\(true, \{ autoHideMs: 0 \}\)/);
  assert.match(source, /setClearMode\(true\); \/\/ show labels and hide chat chrome/);
  assert.doesNotMatch(source, /tapPadding\s*=\s*64/);

  assert.match(pixelCss, /--scene-z-label:\s*2;/);
  assert.match(pixelCss, /\.scene-hotspot-label-layer\s*\{[\s\S]*?z-index:\s*var\(--scene-z-label\);[\s\S]*?pointer-events:\s*none;/);
  assert.match(pixelCss, /\.scene-hotspot-label-chip\s*\{[\s\S]*?opacity:\s*0;/);
  assert.match(pixelCss, /body\.scene-hotspot-labels-visible\[data-shell-page="hub"\]\[data-shell-variant="public-square"\] \.scene-hotspot-label-chip/);
  assert.match(pixelCss, /body\.scene-hotspot-labels-visible\[data-shell-variant="creative-terminal"\] \.scene-hotspot-label-chip/);
  assert.match(pixelCss, /\.scene-hotspots \.scene-hotspot\s*\{[\s\S]*?pointer-events:\s*auto !important;[\s\S]*?background:\s*transparent !important;[\s\S]*?border-color:\s*transparent !important;/);
  assert.match(pixelCss, /\.scene-hotspot\s*>\s*span\s*\{[\s\S]*?display:\s*none !important;/);
  assert.match(pixelCss, /body\[data-shell-variant="creative-terminal"\] \.scene-hotspot--desk\s*\{[\s\S]*?width:\s*64px !important;[\s\S]*?height:\s*34px !important;/);
  assert.match(pixelCss, /body\[data-shell-page="hub"\]\[data-shell-variant="public-square"\] \.scene-hotspot--metro\s*\{[\s\S]*?width:\s*64px !important;[\s\S]*?height:\s*34px !important;/);

  assert.match(worldCss, /\.world-square-label-layer \.scene-hotspot-label-chip\s*\{[\s\S]*?opacity:\s*0;/);
  assert.match(worldCss, /body\.scene-hotspot-labels-visible\[data-shell-page="world-square"\] \.world-square-label-layer \.scene-hotspot-label-chip/);
  assert.doesNotMatch(worldCss, /\.world-square-hotspots \.scene-hotspot:hover[\s\S]*?background:\s*rgba/);
  assert.doesNotMatch(worldCss, /\.world-square-hotspots \.scene-hotspot:hover[\s\S]*?border-color:\s*rgba/);
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
  assert.match(html, /获取验证码/);

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
  assert.match(css, /hub-main-city-scene-v1-day-256\.png/);
  assert.match(css, /hub-main-city-scene-v1-mobile-day-256\.png/);
  assert.match(css, /creative-room-scene-v2-256\.png/);
  assert.match(css, /creative-room-scene-v2-mobile-256\.png/);
  assert.match(css, /creative-room-scene-v2-day-256\.png/);
  assert.match(css, /creative-room-scene-v2-mobile-day-256\.png/);
  assert.doesNotMatch(css, /hub-city-map\.avif/);
  assert.doesNotMatch(css, /creative-room-map\.avif/);
  assert.match(css, /--scene-z-hotspot-clear/);
  assert.doesNotMatch(css, /hub-main-city-scene-v1\.png/);
  assert.doesNotMatch(css, /creative-room-scene-v2\.png/);
  assert.match(worldCss, /world-metro-station-scene-v1-256\.png/);
  assert.match(worldCss, /world-metro-station-scene-v1-mobile-256\.png/);
  assert.match(worldCss, /world-metro-station-scene-v1-day-256\.png/);
  assert.match(worldCss, /world-metro-station-scene-v1-mobile-day-256\.png/);
  assert.match(worldCss, /--world-z-hotspot-clear/);
  assert.doesNotMatch(worldCss, /world-entry-scene-v1\.(?:png|avif)/);
  assert.doesNotMatch(worldCss, /world-metro-station-scene-v1\.png/);

  // Old brightened AVIF drafts washed out the pixel art; runtime uses geometry-matched PNG day assets.
  assert.doesNotMatch(css, /hub-main-city-scene-v1-day-draft\.avif/);
  assert.doesNotMatch(css, /creative-room-scene-v2-day-draft\.avif/);
  assert.doesNotMatch(worldCss, /world-metro-station-scene-v1-day-draft\.avif/);
  // world-square uses real day/night assets via body[data-time-of-day], not overlay.
  assert.match(squareCss, /world-square-concept-day-256\.png/);
  assert.doesNotMatch(squareCss, /world-square-concept-20260428-day-draft-256\.png/);
});

test("pixel scene hotspot labels reveal near pointer and from blank-scene click", async () => {
  const css = await readShellModule("styles.pixel-map.css");
  const source = await readShellModule("shell-scene-runtime.js");

  // Verify hotspot label visibility is controlled via CSS classes (implementation detail may vary)
  assert.match(css, /scene-hotspot-label-layer/);
  assert.match(css, /scene-hotspot-label-chip/);
  assert.match(css, /scene-hotspot-labels-visible/);
  assert.match(css, /scene-clear-mode/);
  assert.match(css, /\.scene-hotspot-label-chip\.is-near-pointer/);
  assert.match(css, /body\.scene-hotspot-labels-visible\[data-shell-variant="creative-terminal"\] \.scene-hotspot-label-chip/);
  assert.match(source, /let hotspotLabelsVisible = false/);
  assert.match(source, /let labelTimer = null/);
  assert.match(source, /function setHotspotLabelsVisible\(visible/);
  assert.match(source, /function renderHotspotLabelLayer\(\)/);
  assert.match(source, /setTimeout\(\(\) => setHotspotLabelsVisible\(false\), autoHideMs\)/);
  assert.match(source, /if \(isClearMode\(\)\)/);
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
  const source = await readShellModule("shell-scene-runtime.js");

  assert.match(source, /world-entry-stage/);
  assert.match(source, /restoreEl\?\.addEventListener/);
  assert.match(source, /export function initSceneRuntime/);
});

test("world-entry runtime preserves the metro entry title", async () => {
  const source = await readShellModule("app.js");

  assert.match(source, /viewState\.shellPage !== "hub" && viewState\.shellPage !== "world-entry"/);
  assert.match(
    source,
    /if \(viewState\.shellPage !== "hub" && viewState\.shellPage !== "world-entry"\) \{\s*document\.title = `龙虾聊天 · \$\{translateShellMode\(viewState\.shellMode\)\}`;\s*\}/
  );
});

test("world-entry route hydration uses gateway projection without innerHTML sinks", async () => {
  const source = await readShellModule("app.js");
  const loader = sliceBetween(
    source,
    "async function loadWorldEntry() {",
    "function openIndexedDb() {",
  );
  const fetcher = sliceBetween(
    source,
    "async function fetchWorldEntryPayload() {",
    "function syncWorldEntryHud(payload) {",
  );
  const hudSync = sliceBetween(
    source,
    "function syncWorldEntryHud(payload) {",
    "function createWorldSquareRouteOptionNode() {",
  );

  assert.match(source, /async function loadWorldEntry\(\)/);
  assert.match(fetcher, /fetch\(`\$\{gatewayUrl\}\/v1\/world-entry`\)/);
  assert.match(fetcher, /const routes = Array\.isArray\(payload\?\.routes\) \? payload\.routes : \[\]/);
  assert.match(fetcher, /if \(routes\.length === 0\) return null/);
  assert.match(hudSync, /document\.querySelector\("\.world-entry-hud \.hud-title"\)/);
  assert.match(hudSync, /hudTitle\.textContent = payload\.title/);
  assert.match(hudSync, /stationChip\.textContent = payload\.station_label/);
  assert.match(hudSync, /hudStatus\.textContent = payload\.source_summary/);
  assert.match(loader, /const routeList = worldEntryRouteListElement\(\)/);
  assert.match(loader, /const payload = await fetchWorldEntryPayload\(\)/);
  assert.match(loader, /syncWorldEntryHud\(payload\)/);
  assert.match(loader, /renderWorldEntryRoutes\(routeList, payload\.routes\)/);
  assert.doesNotMatch(loader, /document\.createElement\("a"\)/);
  assert.doesNotMatch(loader, /routeList\.appendChild/);
  assert.doesNotMatch(source, /world-route[\s\S]{0,500}\.innerHTML\s*=/);
});

test("world-entry route option DOM is delegated out of loadWorldEntry", async () => {
  const source = await readShellModule("app.js");
  const squareRenderer = sliceBetween(
    source,
    "function createWorldSquareRouteOptionNode() {",
    "function createWorldEntryRouteOptionNode(route) {",
  );
  const routeRenderer = sliceBetween(
    source,
    "function createWorldEntryRouteOptionNode(route) {",
    "function renderWorldEntryRoutes(routeList, routes) {",
  );
  const routesRenderer = sliceBetween(
    source,
    "function renderWorldEntryRoutes(routeList, routes) {",
    "async function loadWorldEntry() {",
  );

  assert.match(squareRenderer, /option\.className = "world-route-option world-route-option-square"/);
  assert.match(squareRenderer, /option\.setAttribute\("href", "\.\/world-square\.html"\)/);
  assert.match(squareRenderer, /title\.textContent = "世界广场"/);
  assert.match(routeRenderer, /option\.className = "world-route-option"/);
  assert.match(routeRenderer, /if \(route\.is_current\) \{/);
  assert.match(routeRenderer, /option\.setAttribute\("href", route\.href \|\| "#"\)/);
  assert.match(routeRenderer, /title\.textContent = route\.title \|\| ""/);
  assert.match(routeRenderer, /desc\.textContent = route\.description/);
  assert.match(routeRenderer, /status\.textContent = route\.is_current \? `当前主城 · \$\{route\.status_label\}` : route\.status_label/);
  assert.match(routesRenderer, /routeList\.replaceChildren\(\)/);
  assert.match(routesRenderer, /routeList\.appendChild\(createWorldSquareRouteOptionNode\(\)\)/);
  assert.match(routesRenderer, /for \(const route of routes\) \{/);
  assert.match(routesRenderer, /routeList\.appendChild\(createWorldEntryRouteOptionNode\(route\)\)/);
});

test("composer symbol menu switches categories with tabs", async () => {
  const source = await readShellModule("app.js");
  const css = await readShellModule("styles.pixel-map.css");
  const categoryResolver = sliceBetween(
    source,
    "function composerSymbolCategories() {",
    "function selectComposerSymbolCategory(categories, tabButtons, selectedIndex) {",
  );
  const categorySelector = sliceBetween(
    source,
    "function selectComposerSymbolCategory(categories, tabButtons, selectedIndex) {",
    "function prepareComposerSymbolCategoryPanel(category, index) {",
  );
  const panelPreparer = sliceBetween(
    source,
    "function prepareComposerSymbolCategoryPanel(category, index) {",
    "function handleComposerSymbolTabKeydown(event, index, categories, tabButtons, selectCategory) {",
  );
  const keyHandler = sliceBetween(
    source,
    "function handleComposerSymbolTabKeydown(event, index, categories, tabButtons, selectCategory) {",
    "function createComposerSymbolTabButton(panel, index, categories, tabButtons, selectCategory) {",
  );
  const buttonFactory = sliceBetween(
    source,
    "function createComposerSymbolTabButton(panel, index, categories, tabButtons, selectCategory) {",
    "function createComposerSymbolTabBar(categories) {",
  );
  const tabBarFactory = sliceBetween(
    source,
    "function createComposerSymbolTabBar(categories) {",
    "function installComposerSymbolTabs(tabBar, selectCategory) {",
  );
  const installer = sliceBetween(
    source,
    "function installComposerSymbolTabs(tabBar, selectCategory) {",
    "function initializeComposerSymbolTabs() {",
  );
  const initializer = sliceBetween(
    source,
    "function initializeComposerSymbolTabs() {",
    "function setComposerSymbolMenuOpen(open) {",
  );

  assert.match(categoryResolver, /composerSymbolMenuEl\.querySelectorAll\("\.composer-symbol-category"\)/);
  assert.match(categorySelector, /category\.classList\.toggle\("is-active", active\)/);
  assert.match(categorySelector, /tabButtons\[index\]\?\.setAttribute\("aria-selected", active \? "true" : "false"\)/);
  assert.match(panelPreparer, /category\.querySelector\("\.composer-symbol-heading"\)/);
  assert.match(panelPreparer, /category\.setAttribute\("role", "tabpanel"\)/);
  assert.match(keyHandler, /event\.key !== "ArrowRight" && event\.key !== "ArrowLeft"/);
  assert.match(keyHandler, /tabButtons\[nextIndex\]\?\.focus\(\)/);
  assert.match(buttonFactory, /button\.setAttribute\("data-symbol-tab", String\(index\)\)/);
  assert.match(buttonFactory, /button\.addEventListener\("click"/);
  assert.match(buttonFactory, /handleComposerSymbolTabKeydown\(event, index, categories, tabButtons, selectCategory\)/);
  assert.match(tabBarFactory, /tabBar\.className = "composer-symbol-tabs"/);
  assert.match(tabBarFactory, /const tabButtons = \[\]/);
  assert.match(tabBarFactory, /const selectCategory = \(selectedIndex\) =>/);
  assert.match(tabBarFactory, /createComposerSymbolTabButton\(panel, index, categories, tabButtons, selectCategory\)/);
  assert.match(installer, /composerSymbolMenuEl\.insertBefore\(tabBar, composerSymbolMenuEl\.firstChild\)/);
  assert.match(installer, /composerSymbolMenuEl\.dataset\.symbolTabsReady = "true"/);
  assert.match(installer, /selectCategory\(0\)/);
  assert.match(initializer, /const categories = composerSymbolCategories\(\)/);
  assert.match(initializer, /const \{ tabBar, selectCategory \} = createComposerSymbolTabBar\(categories\)/);
  assert.match(initializer, /installComposerSymbolTabs\(tabBar, selectCategory\)/);
  assert.doesNotMatch(initializer, /document\.createElement\("button"\)/);
  assert.doesNotMatch(initializer, /addEventListener\("keydown"/);
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
  const bodyModule = await readShellModule("shell-message-body.js");

  // app.js 的 buildNodeFromSpec 用 textContent 落地 spec.text（不 innerHTML）
  assert.match(source, /function buildNodeFromSpec\(spec\)/);
  const buildNode = sliceBetween(source, "function buildNodeFromSpec(spec) {", "function createMessageQuickActionChip");
  assert.match(buildNode, /node\.textContent = spec\.text/);
  assert.doesNotMatch(buildNode, /innerHTML/);

  // 消息文本/字段/notes 均以 spec.text 形式构造（shell-message-body.js），无 innerHTML
  assert.match(bodyModule, /message\?\.text/);
  assert.match(bodyModule, /text: field\.label/);
  assert.match(bodyModule, /text: field\.value/);
  assert.match(bodyModule, /structured\.notes\.join\("\\n"\)/);
  assert.doesNotMatch(bodyModule, /innerHTML/);
});

test("message search DOM is rendered from specs without innerHTML sinks", async () => {
  const source = await readShellModule("app.js");
  const searchSource = await readShellModule("shell-message-search.js");
  const searchChrome = sliceBetween(
    source,
    "// === Message Search UI elements ===",
    "// Insert search bar before timeline",
  );
  const resultRenderer = sliceBetween(
    source,
    "function renderSearchResults(messages) {",
    "let searchDebounceTimer = null;",
  );
  const clearRenderer = sliceBetween(
    source,
    "function clearSearchResults() {",
    "async function performMessageSearch(query) {",
  );
  const requestRenderer = sliceBetween(
    source,
    "async function performMessageSearch(query) {",
    "function renderSearchResults(messages) {",
  );
  const targetFinder = sliceBetween(
    source,
    "function findMessageSearchTargetRow(messageId) {",
    "function scrollToMessage(messageId) {",
  );
  const scrollRenderer = sliceBetween(
    source,
    "function scrollToMessage(messageId) {",
    "// Close drawer when clicking outside",
  );

  assert.match(searchSource, /export function messageSearchBarDomSpec/);
  assert.match(searchSource, /export function messageSearchRequestModel/);
  assert.match(searchSource, /export function messageSearchRowMatchesId/);
  assert.match(searchSource, /export function searchResultItemDomSpec/);
  assert.match(searchSource, /export function searchEmptyStateDomSpec/);
  assert.match(searchChrome, /searchToggleBtn\.textContent = "🔍"/);
  assert.match(searchChrome, /const searchBar = createMessageSearchBarNode\(\)/);
  assert.doesNotMatch(searchChrome, /innerHTML/);
  assert.match(clearRenderer, /container\.replaceChildren\(\)/);
  assert.doesNotMatch(clearRenderer, /innerHTML/);
  assert.match(
    requestRenderer,
    /const request = messageSearchRequestModel\(\{\s*gatewayUrl,\s*roomId: activeRoomId,\s*query,\s*\}\)/,
  );
  assert.match(requestRenderer, /fetch\(request\.url\)/);
  assert.doesNotMatch(requestRenderer, /encodeURIComponent\(query\.trim\(\)\)/);
  assert.doesNotMatch(requestRenderer, /encodeURIComponent\(activeRoomId\)/);
  assert.doesNotMatch(requestRenderer, /\/v1\/shell\/messages\/search\?q=\$\{q\}/);
  assert.match(resultRenderer, /container\.replaceChildren\(\)/);
  assert.match(resultRenderer, /searchEmptyStateDomSpec\(\)/);
  assert.match(resultRenderer, /searchResultItemDomSpec\(msg\)/);
  assert.match(resultRenderer, /createSearchDomNode/);
  assert.doesNotMatch(resultRenderer, /innerHTML/);
  assert.doesNotMatch(resultRenderer, /buildSearchResultItemHtml/);
  assert.match(targetFinder, /document\.querySelectorAll\("\[data-message-id\]"\)/);
  assert.match(targetFinder, /messageSearchRowMatchesId\(row, messageId\)/);
  assert.match(scrollRenderer, /const row = findMessageSearchTargetRow\(messageId\)/);
  assert.doesNotMatch(scrollRenderer, /querySelector\(\s*['"`]\[data-message-id/);
});

test("message body terminal plain and structured DOM are delegated out of createMessageBodyNode", async () => {
  const source = await readShellModule("app.js");
  const bodyModule = await readShellModule("shell-message-body.js");

  // app.js 只剩薄委托：buildNodeFromSpec 落地 + createMessageBodyNode 委托 messageBodyDomSpec
  const bodyRenderer = sliceBetween(
    source,
    "function createMessageBodyNode(message, options = {}) {",
    "function roomDisplayPeer(room) {",
  );
  assert.match(source, /function buildNodeFromSpec\(spec\)/);
  assert.match(bodyRenderer, /messageBodyDomSpec\(message, options\)/);
  assert.match(bodyRenderer, /buildNodeFromSpec/);
  // app.js 不再内联终态/结构化/field/notes/followUp 装配逻辑
  assert.doesNotMatch(source, /function createMessageBodyShell\b/);
  assert.doesNotMatch(source, /function applyMessageBodyTerminalState\b/);
  assert.doesNotMatch(source, /function appendPlainMessageBodyText\b/);
  assert.doesNotMatch(source, /function appendMessageQuickSheetFields\b/);
  assert.doesNotMatch(source, /function appendStructuredMessageBodySheet\b/);

  // 逻辑迁入 shell-message-body.js（spec 形式）
  assert.match(bodyModule, /export function messageBodyDomSpec/);
  assert.match(bodyModule, /message-body-recalled/);
  assert.match(bodyModule, /消息已撤回/);
  assert.match(bodyModule, /moderation_status === "blocked"/);
  assert.match(bodyModule, /message-quick-sheet-row/);
  assert.match(bodyModule, /message-quick-sheet-notes/);
  assert.match(bodyModule, /quickActionFollowUpLabel\(action, quickState\)/);
});

test("room inline preview controls and actions consume clickable render specs", async () => {
  const source = await readShellModule("app.js");
  const helperSource = sliceBetween(
    source,
    "function applyInlineClickableDomSpec(node, clickableSpec) {",
    "function createRoomInlineActions(room) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  appendRoomInlineActionNodes(rail, room, inlineActionsModel);",
  );
  const actionsRenderer = sliceBetween(
    source,
    "function appendInlineCardActions(inlineCard, childModel, inlineActionHandlers) {",
    "function appendInlineCardFieldRows(inlineCard, childModel) {",
  );
  const metaRenderer = sliceBetween(
    source,
    "function appendInlineCardMeta(inlineCard, childModel, attachInlineMetaModelAction) {",
    "function appendInlineCardActions(inlineCard, childModel, inlineActionHandlers) {",
  );
  const headerRenderer = sliceBetween(
    source,
    "function appendInlineCardHeader(inlineCard, childModel) {",
    "function appendInlineCardMeta(inlineCard, childModel, attachInlineMetaModelAction) {",
  );
  const hintClickableApplier = sliceBetween(
    source,
    "function createInlineHintClickableApplier(room, preview, inlineHintHandlers) {",
    "function createRoomInlineProgressNode(progressDomSpec) {",
  );
  const controlsRenderer = sliceBetween(
    source,
    "function appendInlineCardControls(inlineCard, childModel, onInlineCardControlAction) {",
    "function createInlineHintNode(inlineHintDomModel, applyInlineHintClickable) {",
  );
  const buttonRenderer = sliceBetween(
    source,
    "function createInlineCardButtonNode(buttonSpec) {",
    "function createRoomInlineActions(room) {",
  );

  assert.match(buttonRenderer, /applyInlineClickableDomSpec\(button, buttonSpec\.clickable\)/);
  assert.match(controlsRenderer, /const button = createInlineCardButtonNode\(buttonSpec\)/);
  assert.match(actionsRenderer, /const button = createInlineCardButtonNode\(buttonSpec\)/);
});

test("room inline progress rendering is delegated out of createRoomInlineActions", async () => {
  const source = await readShellModule("app.js");
  const progressRenderer = sliceBetween(
    source,
    "function createRoomInlineProgressNode(progressDomSpec) {",
    "function createRoomInlineActions(room) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  if (!appendRoomInlinePreviewPanel(rail, room, action)) return rail;",
  );

  assert.match(progressRenderer, /document\.createElement\(progressDomSpec\.type \|\| "div"\)/);
  assert.match(progressRenderer, /\(progressDomSpec\.children \|\| \[\]\)\.forEach\(\(childSpec\) => \{/);
  assert.match(inlineActionsSource, /const progress = appendRoomInlineProgressNode\(rail, room, action, state, progressDomSpec\)/);
  assert.doesNotMatch(inlineActionsSource, /const progress = createRoomInlineProgressNode\(progressDomSpec\)/);
  assert.doesNotMatch(inlineActionsSource, /\(progressDomSpec\.children \|\| \[\]\)\.forEach/);
});

test("room inline progress action append is delegated out of createRoomInlineActions", async () => {
  const source = await readShellModule("app.js");
  const progressAppender = sliceBetween(
    source,
    "function appendRoomInlineProgressNode(rail, room, action, state, progressDomSpec) {",
    "function createRoomInlineActionNode(action, label, role, onActivate) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  if (!appendRoomInlinePreviewPanel(rail, room, action)) return rail;",
  );

  assert.match(progressAppender, /const progress = createRoomInlineProgressNode\(progressDomSpec\)/);
  assert.match(progressAppender, /progress\.addEventListener\("click", \(event\) => \{/);
  assert.match(progressAppender, /latestRoomQuickSnapshotIndex\(room\.id, action, state\) >= 0/);
  assert.match(progressAppender, /previewRoomQuickStage\(/);
  assert.match(progressAppender, /rail\.appendChild\(progress\)/);
  assert.match(progressAppender, /return progress/);
  assert.match(inlineActionsSource, /const progress = appendRoomInlineProgressNode\(rail, room, action, state, progressDomSpec\)/);
  assert.doesNotMatch(inlineActionsSource, /createRoomInlineProgressNode\(progressDomSpec\)/);
  assert.doesNotMatch(inlineActionsSource, /progress\.addEventListener\("click"/);
});

test("room inline card DOM primitives are delegated out of createRoomInlineActions", async () => {
  const source = await readShellModule("app.js");
  const helperSource = sliceBetween(
    source,
    "function applyInlineClickableDomSpec(node, clickableSpec) {",
    "function createRoomInlineActions(room) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  appendRoomInlineActionNodes(rail, room, inlineActionsModel);",
  );
  const actionsRenderer = sliceBetween(
    source,
    "function appendInlineCardActions(inlineCard, childModel, inlineActionHandlers) {",
    "function appendInlineCardFieldRows(inlineCard, childModel) {",
  );
  const metaRenderer = sliceBetween(
    source,
    "function appendInlineCardMeta(inlineCard, childModel, attachInlineMetaModelAction) {",
    "function appendInlineCardActions(inlineCard, childModel, inlineActionHandlers) {",
  );
  const headerRenderer = sliceBetween(
    source,
    "function appendInlineCardHeader(inlineCard, childModel) {",
    "function appendInlineCardMeta(inlineCard, childModel, attachInlineMetaModelAction) {",
  );
  const hintClickableApplier = sliceBetween(
    source,
    "function createInlineHintClickableApplier(room, preview, inlineHintHandlers) {",
    "function createRoomInlineProgressNode(progressDomSpec) {",
  );

  assertInOrder(
    helperSource,
    [
      "function applyInlineClickableDomSpec(node, clickableSpec) {",
      "function createInlineCardContainerNode(containerSpec) {",
      "function createInlineCardSimpleChildNode(childSpec) {",
      "function createInlineCardButtonNode(buttonSpec) {",
    ],
    "room inline card DOM primitives",
  );
  assert.doesNotMatch(inlineActionsSource, /const applyInlineClickableDomSpec =/);
  assert.doesNotMatch(inlineActionsSource, /const createInlineCardContainerNode =/);
  assert.doesNotMatch(inlineActionsSource, /const createInlineCardSimpleChildNode =/);
  assert.doesNotMatch(inlineActionsSource, /const createInlineCardButtonNode =/);
  assert.match(hintClickableApplier, /applyInlineClickableDomSpec\(node, part\.clickable\)/);
  assert.doesNotMatch(inlineActionsSource, /applyInlineClickableDomSpec\(node, part\.clickable\)/);
  assert.match(metaRenderer, /createInlineCardContainerNode\(inlineMetaDomModel\)/);
  assert.doesNotMatch(inlineActionsSource, /createInlineCardContainerNode\(inlineMetaDomModel\)/);
  assert.match(headerRenderer, /createInlineCardSimpleChildNode\(childSpec\)/);
  assert.doesNotMatch(inlineActionsSource, /createInlineCardSimpleChildNode\(childSpec\)/);
  assert.match(actionsRenderer, /createInlineCardButtonNode\(buttonSpec\)/);
  assert.doesNotMatch(inlineActionsSource, /createInlineCardButtonNode\(buttonSpec\)/);
});

test("room list toolbar and empty state are delegated out of renderRooms", async () => {
  const source = await readShellModule("app.js");
  const toolbarRenderer = sliceBetween(
    source,
    "function updateRoomListToolbarNote(rooms, stats, activeVisible, shellPage) {",
    "function createRoomListEmptyNode() {",
  );
  const emptyRenderer = sliceBetween(
    source,
    "function createRoomListEmptyNode() {",
    "function createRoomAvatarNode(room, kind, shellPage, headline) {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderRooms() {",
    "  const groups = roomGroupBlueprints(shellPage, rooms);",
  );

  assert.match(toolbarRenderer, /if \(!roomToolbarNoteEl\) return/);
  assert.match(toolbarRenderer, /roomToolbarNoteSpec\(\{/);
  assert.match(toolbarRenderer, /visibleCount: rooms\.length/);
  assert.match(toolbarRenderer, /roomToolbarNoteEl\.textContent = pieces\.join\(" · "\)/);
  assert.match(emptyRenderer, /const empty = document\.createElement\("li"\)/);
  assert.match(emptyRenderer, /empty\.className = "empty-note"/);
  assert.match(emptyRenderer, /empty\.textContent = roomEmptyStateSpec\(gatewayUrl\)/);
  assert.match(renderSource, /updateRoomListSearchVisibility\(\)/);
  assert.match(renderSource, /updateRoomListToolbarNote\(rooms, stats, activeVisible, shellPage\)/);
  assert.match(renderSource, /roomListEl\.appendChild\(createRoomListEmptyNode\(\)\)/);
  assert.doesNotMatch(renderSource, /roomToolbarNoteEl\.textContent/);
  assert.doesNotMatch(renderSource, /roomEmptyStateSpec\(gatewayUrl\)/);
});

test("room list item avatar, topline and tag row are delegated out of renderRooms", async () => {
  const source = await readShellModule("app.js");
  const avatarRenderer = sliceBetween(
    source,
    "function createRoomAvatarNode(room, kind, shellPage, headline) {",
    "function createRoomTopLineNode(room, kind, shellPage, unread) {",
  );
  const topLineRenderer = sliceBetween(
    source,
    "function createRoomTopLineNode(room, kind, shellPage, unread) {",
    "function createRoomTagRowNode(room) {",
  );
  const tagRowRenderer = sliceBetween(
    source,
    "function createRoomTagRowNode(room) {",
    "function createRoomListItemNode(room, shellPage) {",
  );
  const itemRenderer = sliceBetween(
    source,
    "function createRoomListItemNode(room, shellPage) {",
    "function createRoomSectionNode(group, shellPage) {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderRooms() {",
    "function createConversationOverviewHeaderNode(room, shellPage, compactChatShell) {",
  );

  assert.match(avatarRenderer, /roomAvatarSpec\(\{ room, kind, shellPage, headline \}\)/);
  assert.match(avatarRenderer, /directRoomPeerOnlineStatus\(room\)/);
  assert.match(avatarRenderer, /confirmResidentRoomJump\(room\)/);
  assert.match(topLineRenderer, /roomTitleStackSpec\(room, roomAudienceLabel\(room\)\)/);
  assert.match(topLineRenderer, /createRoomUnreadBadgeNode\(unread\)/);
  assert.match(topLineRenderer, /roomTopMetaSpec\(\{/);
  assert.match(tagRowRenderer, /createRoomQuickActionPill\(room\)/);
  assert.match(tagRowRenderer, /createRoomQuickPreviewPill\(room\)/);
  assert.match(tagRowRenderer, /visiblePendingEchoCount\(room\)/);
  assert.match(tagRowRenderer, /caretakerProfile\(room\)/);
  assert.match(itemRenderer, /const button = document\.createElement\("button"\)/);
  assert.match(itemRenderer, /roomButtonClassSpec\(\{ roomId: room\.id, activeRoomId, unread, kind \}\)/);
  assert.match(itemRenderer, /createRoomAvatarNode\(room, kind, shellPage, headline\)/);
  assert.match(itemRenderer, /createRoomTopLineNode\(room, kind, shellPage, unread\)/);
  assert.match(itemRenderer, /createRoomTagRowNode\(room\)/);
  assert.doesNotMatch(renderSource, /const avatar = document\.createElement\("div"\)/);
  assert.doesNotMatch(renderSource, /const tagRow = document\.createElement\("div"\)/);
  assert.doesNotMatch(renderSource, /roomButtonClassSpec\(\{ roomId: room\.id, activeRoomId, unread, kind \}\)/);
});

test("room preview context and DOM are delegated out of createRoomPreviewNode", async () => {
  const source = await readShellModule("app.js");
  const contextResolver = sliceBetween(
    source,
    "function roomPreviewContext(room) {",
    "function createRoomPreviewFallbackNode(room) {",
  );
  const fallbackRenderer = sliceBetween(
    source,
    "function createRoomPreviewFallbackNode(room) {",
    "function activateRoomPreviewSnapshot(room, preview, event) {",
  );
  const snapshotActivator = sliceBetween(
    source,
    "function activateRoomPreviewSnapshot(room, preview, event) {",
    "function activateRoomPreviewHistorySnapshot(room, preview, index, event) {",
  );
  const historyActivator = sliceBetween(
    source,
    "function activateRoomPreviewHistorySnapshot(room, preview, index, event) {",
    "function createRoomPreviewShellNode(preview, onActivate) {",
  );
  const shellRenderer = sliceBetween(
    source,
    "function createRoomPreviewShellNode(preview, onActivate) {",
    "function createRoomPreviewHistoryChipNode(room, preview, snapshot, index) {",
  );
  const historyChipRenderer = sliceBetween(
    source,
    "function createRoomPreviewHistoryChipNode(room, preview, snapshot, index) {",
    "function appendRoomPreviewHistoryNodes(shell, room, preview) {",
  );
  const historyAppender = sliceBetween(
    source,
    "function appendRoomPreviewHistoryNodes(shell, room, preview) {",
    "function createRoomPreviewStageNode(field, previewView, onActivate) {",
  );
  const stageRenderer = sliceBetween(
    source,
    "function createRoomPreviewStageNode(field, previewView, onActivate) {",
    "function createRoomPreviewSummaryNode(room, field, onActivate) {",
  );
  const summaryRenderer = sliceBetween(
    source,
    "function createRoomPreviewSummaryNode(room, field, onActivate) {",
    "function appendRoomPreviewFieldNodes(shell, room, previewView, field, onActivate) {",
  );
  const fieldAppender = sliceBetween(
    source,
    "function appendRoomPreviewFieldNodes(shell, room, previewView, field, onActivate) {",
    "function createRoomPreviewNode(room) {",
  );
  const previewRenderer = sliceBetween(
    source,
    "function createRoomPreviewNode(room) {",
    "function renderTimelineSkeletonRows(count = 4) {",
  );

  assert.match(contextResolver, /const preview = resolveRoomQuickPreview\(room\)/);
  assert.match(contextResolver, /roomQuickPreviewFieldView\(room\.id, preview\.action, preview\.state, preview\.snapshotIndex\)/);
  assert.match(contextResolver, /field: previewView\?\.primaryField/);
  assert.match(fallbackRenderer, /createLine\("room-preview", roomPreview\(room\)\)/);
  assert.match(snapshotActivator, /focusRoom\(room\.id\)/);
  assert.match(snapshotActivator, /renderRooms\(\)/);
  assert.match(snapshotActivator, /quickActionStructuredDraft\(preview\.structured, preview\.action\)/);
  assert.match(historyActivator, /renderTimeline\(\)/);
  assert.match(historyActivator, /previewRoomQuickStage\(room\.id, preview\.action, preview\.state, index\)/);
  assert.doesNotMatch(historyActivator, /seedComposerFromQuickAction/);
  assert.match(shellRenderer, /shell\.className = "room-preview-shell is-interactive"/);
  assert.match(shellRenderer, /shell\.addEventListener\("click", onActivate\)/);
  assert.match(historyChipRenderer, /quickActionPreviewHistoryLabel\(snapshot, index, preview\.history\.length\)/);
  assert.match(historyChipRenderer, /activateRoomPreviewHistorySnapshot\(room, preview, index, event\)/);
  assert.match(historyAppender, /if \(!Array\.isArray\(preview\.history\) \|\| preview\.history\.length <= 1\) return/);
  assert.match(historyAppender, /history\.appendChild\(createRoomPreviewHistoryChipNode\(room, preview, snapshot, index\)\)/);
  assert.match(stageRenderer, /stage\.textContent = field\.label \|\| previewView\.state \|\| "预览"/);
  assert.match(summaryRenderer, /summary\.textContent = field\.value \|\| field\.label \|\| roomPreview\(room\)/);
  assert.match(fieldAppender, /shell\.appendChild\(createRoomPreviewStageNode\(field, previewView, onActivate\)\)/);
  assert.match(fieldAppender, /shell\.appendChild\(createRoomPreviewSummaryNode\(room, field, onActivate\)\)/);
  assert.match(previewRenderer, /const context = roomPreviewContext\(room\)/);
  assert.match(previewRenderer, /if \(!context\.preview \|\| !context\.previewView \|\| !context\.field\) return createRoomPreviewFallbackNode\(room\)/);
  assert.match(previewRenderer, /appendRoomPreviewHistoryNodes\(shell, room, context\.preview\)/);
  assert.match(previewRenderer, /appendRoomPreviewFieldNodes\(shell, room, context\.previewView, context\.field, activatePreview\)/);
  assert.doesNotMatch(previewRenderer, /quickActionStructuredDraft/);
  assert.doesNotMatch(previewRenderer, /room-preview-history-chip/);
});

test("room group sections are delegated out of renderRooms", async () => {
  const source = await readShellModule("app.js");
  const sectionRenderer = sliceBetween(
    source,
    "function createRoomSectionNode(group, shellPage) {",
    "function renderRooms() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderRooms() {",
    "function createConversationOverviewHeaderNode(room, shellPage, compactChatShell) {",
  );

  assert.match(sectionRenderer, /const section = document\.createElement\("li"\)/);
  assert.match(sectionRenderer, /section\.className = "room-section"/);
  assert.match(sectionRenderer, /header\.className = "room-section-header"/);
  assert.match(sectionRenderer, /createLine\("room-section-title", group\.title\)/);
  assert.match(sectionRenderer, /for \(const room of group\.rooms\) \{/);
  assert.match(sectionRenderer, /list\.appendChild\(createRoomListItemNode\(room, shellPage\)\)/);
  assert.match(sectionRenderer, /return section/);
  assert.match(renderSource, /for \(const group of groups\) \{\s*roomListEl\.appendChild\(createRoomSectionNode\(group, shellPage\)\);\s*\}/);
  assert.doesNotMatch(renderSource, /room-section-header/);
  assert.doesNotMatch(renderSource, /room-section-list/);
});

test("room inline preview header consumes generic child render specs", async () => {
  const source = await readShellModule("app.js");
  const headerRenderer = sliceBetween(
    source,
    "function appendInlineCardHeader(inlineCard, childModel) {",
    "function appendInlineCardMeta(inlineCard, childModel, attachInlineMetaModelAction) {",
  );

  assert.match(headerRenderer, /inlineCard\.appendChild\(createInlineCardSimpleChildNode\(childSpec\)\)/);
  assert.doesNotMatch(headerRenderer, /createLine\(childSpec\.className, childSpec\.text\)/);
});

test("room inline card header DOM is delegated out of createRoomInlineActions", async () => {
  const source = await readShellModule("app.js");
  const headerRenderer = sliceBetween(
    source,
    "function appendInlineCardHeader(inlineCard, childModel) {",
    "function appendInlineCardMeta(inlineCard, childModel, attachInlineMetaModelAction) {",
  );
  const cardAppender = sliceBetween(
    source,
    "function appendRoomInlinePreviewCard(rail, room, preview, inlinePanelRenderDomModel, inlineActionHandlers) {",
    "function createRoomInlineActionNode(action, label, role, onActivate) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  appendRoomInlineActionNodes(rail, room, inlineActionsModel);",
  );

  assert.match(headerRenderer, /\(childModel\.children \|\| \[\]\)\.forEach\(\(childSpec\) => \{/);
  assert.match(headerRenderer, /inlineCard\.appendChild\(createInlineCardSimpleChildNode\(childSpec\)\)/);
  assert.match(cardAppender, /header: \(childModel\) => appendInlineCardHeader\(inlineCard, childModel\)/);
  assert.doesNotMatch(inlineActionsSource, /createInlineCardSimpleChildNode\(childSpec\)/);
});

test("room inline preview simple children share one DOM renderer", async () => {
  const source = await readShellModule("app.js");
  const helperSource = sliceBetween(
    source,
    "function applyInlineClickableDomSpec(node, clickableSpec) {",
    "function createRoomInlineActions(room) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  appendRoomInlineActionNodes(rail, room, inlineActionsModel);",
  );
  const simpleChildRenderer = sliceBetween(
    helperSource,
    "function createInlineCardSimpleChildNode(childSpec) {",
    "function createInlineCardButtonNode(buttonSpec) {",
  );
  const headerRenderer = sliceBetween(
    source,
    "function appendInlineCardHeader(inlineCard, childModel) {",
    "function appendInlineCardMeta(inlineCard, childModel, attachInlineMetaModelAction) {",
  );
  const fieldRowsRenderer = sliceBetween(
    source,
    "function appendInlineCardFieldRows(inlineCard, childModel) {",
    "function appendInlineCardControls(inlineCard, childModel, onInlineCardControlAction) {",
  );

  assert.match(simpleChildRenderer, /document\.createElement\(childSpec\.type \|\| "div"\)/);
  assert.match(simpleChildRenderer, /child\.textContent = childSpec\.text \|\| ""/);
  assert.match(headerRenderer, /inlineCard\.appendChild\(createInlineCardSimpleChildNode\(childSpec\)\)/);
  assert.match(fieldRowsRenderer, /row\.appendChild\(createInlineCardSimpleChildNode\(childSpec\)\)/);
});

test("room inline preview buttons share one DOM renderer", async () => {
  const source = await readShellModule("app.js");
  const helperSource = sliceBetween(
    source,
    "function applyInlineClickableDomSpec(node, clickableSpec) {",
    "function createRoomInlineActions(room) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  appendRoomInlineActionNodes(rail, room, inlineActionsModel);",
  );
  const buttonRenderer = sliceBetween(
    source,
    "function createInlineCardButtonNode(buttonSpec) {",
    "function createRoomInlineActions(room) {",
  );
  const controlsRenderer = sliceBetween(
    source,
    "function appendInlineCardControls(inlineCard, childModel, onInlineCardControlAction) {",
    "function createInlineHintNode(inlineHintDomModel, applyInlineHintClickable) {",
  );
  const actionsRenderer = sliceBetween(
    source,
    "function appendInlineCardActions(inlineCard, childModel, inlineActionHandlers) {",
    "function appendInlineCardFieldRows(inlineCard, childModel) {",
  );

  assert.match(buttonRenderer, /document\.createElement\(buttonSpec\.type \|\| "button"\)/);
  assert.match(buttonRenderer, /button\.type = buttonSpec\.buttonType \|\| "button"/);
  assert.match(buttonRenderer, /applyInlineClickableDomSpec\(button, buttonSpec\.clickable\)/);
  assert.match(controlsRenderer, /const button = createInlineCardButtonNode\(buttonSpec\)/);
  assert.match(actionsRenderer, /const button = createInlineCardButtonNode\(buttonSpec\)/);
});

test("room inline preview containers share one DOM renderer", async () => {
  const source = await readShellModule("app.js");
  const helperSource = sliceBetween(
    source,
    "function applyInlineClickableDomSpec(node, clickableSpec) {",
    "function createRoomInlineActions(room) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  appendRoomInlineActionNodes(rail, room, inlineActionsModel);",
  );
  const containerRenderer = sliceBetween(
    helperSource,
    "function createInlineCardContainerNode(containerSpec) {",
    "function createInlineCardSimpleChildNode(childSpec) {",
  );
  const metaRenderer = sliceBetween(
    source,
    "function appendInlineCardMeta(inlineCard, childModel, attachInlineMetaModelAction) {",
    "function appendInlineCardActions(inlineCard, childModel, inlineActionHandlers) {",
  );
  const controlsRenderer = sliceBetween(
    source,
    "function appendInlineCardControls(inlineCard, childModel, onInlineCardControlAction) {",
    "function createInlineHintNode(inlineHintDomModel, applyInlineHintClickable) {",
  );
  const fieldRowsRenderer = sliceBetween(
    source,
    "function appendInlineCardFieldRows(inlineCard, childModel) {",
    "function appendInlineCardControls(inlineCard, childModel, onInlineCardControlAction) {",
  );
  const actionsRenderer = sliceBetween(
    source,
    "function appendInlineCardActions(inlineCard, childModel, inlineActionHandlers) {",
    "function appendInlineCardFieldRows(inlineCard, childModel) {",
  );

  assert.match(containerRenderer, /document\.createElement\("div"\)/);
  assert.match(containerRenderer, /container\.className = containerSpec\.className/);
  assert.match(containerRenderer, /container\.hidden = containerSpec\.hidden/);
  assert.match(containerRenderer, /container\.setAttribute\("aria-hidden", containerSpec\.ariaHidden\)/);
  assert.match(metaRenderer, /const inlineMeta = createInlineCardContainerNode\(inlineMetaDomModel\)/);
  assert.match(controlsRenderer, /const container = createInlineCardContainerNode\(group\)/);
  assert.match(fieldRowsRenderer, /const fieldList = createInlineCardContainerNode\(inlineFieldRowsDomModel\)/);
  assert.match(fieldRowsRenderer, /const row = createInlineCardContainerNode\(rowSpec\)/);
  assert.match(actionsRenderer, /const inlineActions = createInlineCardContainerNode\(inlineActionDomModel\)/);
});

test("room inline card field rows DOM is delegated out of createRoomInlineActions", async () => {
  const source = await readShellModule("app.js");
  const fieldRowsRenderer = sliceBetween(
    source,
    "function appendInlineCardFieldRows(inlineCard, childModel) {",
    "function appendInlineCardControls(inlineCard, childModel, onInlineCardControlAction) {",
  );
  const cardAppender = sliceBetween(
    source,
    "function appendRoomInlinePreviewCard(rail, room, preview, inlinePanelRenderDomModel, inlineActionHandlers) {",
    "function createRoomInlineActionNode(action, label, role, onActivate) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  appendRoomInlineActionNodes(rail, room, inlineActionsModel);",
  );

  assert.match(fieldRowsRenderer, /const inlineFieldRowsDomModel = childModel\.model/);
  assert.match(fieldRowsRenderer, /const fieldList = createInlineCardContainerNode\(inlineFieldRowsDomModel\)/);
  assert.match(fieldRowsRenderer, /for \(const rowSpec of inlineFieldRowsDomModel\.rows\) \{/);
  assert.match(fieldRowsRenderer, /const row = createInlineCardContainerNode\(rowSpec\)/);
  assert.match(fieldRowsRenderer, /row\.appendChild\(createInlineCardSimpleChildNode\(childSpec\)\)/);
  assert.match(fieldRowsRenderer, /inlineCard\.appendChild\(fieldList\)/);
  assert.match(cardAppender, /fieldRows: \(childModel\) => appendInlineCardFieldRows\(inlineCard, childModel\)/);
  assert.doesNotMatch(inlineActionsSource, /const fieldList = createInlineCardContainerNode\(inlineFieldRowsDomModel\)/);
});

test("room inline card action buttons DOM is delegated out of createRoomInlineActions", async () => {
  const source = await readShellModule("app.js");
  const actionsRenderer = sliceBetween(
    source,
    "function appendInlineCardActions(inlineCard, childModel, inlineActionHandlers) {",
    "function appendInlineCardFieldRows(inlineCard, childModel) {",
  );
  const cardAppender = sliceBetween(
    source,
    "function appendRoomInlinePreviewCard(rail, room, preview, inlinePanelRenderDomModel, inlineActionHandlers) {",
    "function createRoomInlineActionNode(action, label, role, onActivate) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  appendRoomInlineActionNodes(rail, room, inlineActionsModel);",
  );

  assert.match(actionsRenderer, /const inlineActionDomModel = childModel\.model/);
  assert.match(actionsRenderer, /const inlineActions = createInlineCardContainerNode\(inlineActionDomModel\)/);
  assert.match(actionsRenderer, /const handler = inlineActionHandlers\[target\?\.type\]/);
  assert.match(actionsRenderer, /const button = createInlineCardButtonNode\(buttonSpec\)/);
  assert.match(actionsRenderer, /button\.addEventListener\("click", handler\)/);
  assert.match(actionsRenderer, /inlineCard\.appendChild\(inlineActions\)/);
  assert.match(cardAppender, /actions: \(childModel\) => appendInlineCardActions\(inlineCard, childModel, inlineActionHandlers\)/);
  assert.doesNotMatch(inlineActionsSource, /const inlineActions = createInlineCardContainerNode\(inlineActionDomModel\)/);
});

test("room inline preview card assembly is delegated out of createRoomInlineActions", async () => {
  const source = await readShellModule("app.js");
  const cardAppender = sliceBetween(
    source,
    "function appendRoomInlinePreviewCard(rail, room, preview, inlinePanelRenderDomModel, inlineActionHandlers) {",
    "function createRoomInlineActionNode(action, label, role, onActivate) {",
  );
  const previewPanelAppender = sliceBetween(
    source,
    "function appendRoomInlinePreviewPanel(rail, room, action) {",
    "function createRoomInlineActions(room) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  appendRoomInlineActionNodes(rail, room, inlineActionsModel);",
  );

  assert.match(cardAppender, /const inlineCard = document\.createElement\("div"\)/);
  assert.match(cardAppender, /inlineCard\.className = inlineCardDomModel\.className/);
  assert.match(cardAppender, /const attachInlineMetaModelAction = \(pill, target\) => \{/);
  assert.match(cardAppender, /const inlineCardChildRenderers = \{/);
  assert.match(cardAppender, /appendInlineCardHeader\(inlineCard, childModel\)/);
  assert.match(cardAppender, /appendInlineCardMeta\(inlineCard, childModel, attachInlineMetaModelAction\)/);
  assert.match(cardAppender, /appendInlineCardControls\(inlineCard, childModel, handleInlineCardControlAction\)/);
  assert.match(cardAppender, /appendInlineCardActions\(inlineCard, childModel, inlineActionHandlers\)/);
  assert.match(cardAppender, /rail\.appendChild\(inlineCard\)/);
  assert.match(previewPanelAppender, /appendRoomInlinePreviewCard\(rail, room, preview, inlinePanelRenderDomModel, inlineActionHandlers\)/);
  assert.match(inlineActionsSource, /appendRoomInlinePreviewPanel\(rail, room, action\)/);
  assert.doesNotMatch(inlineActionsSource, /const inlineCard = document\.createElement\("div"\)/);
  assert.doesNotMatch(inlineActionsSource, /const inlineCardChildRenderers = \{/);
});

test("room inline rail and preview context are delegated out of createRoomInlineActions", async () => {
  const source = await readShellModule("app.js");
  const railRenderer = sliceBetween(
    source,
    "function createRoomInlineRailNode(railDomSpec) {",
    "function roomInlinePreviewContext(room, action) {",
  );
  const previewContext = sliceBetween(
    source,
    "function roomInlinePreviewContext(room, action) {",
    "function createRoomInlinePreviewHandlers(room, preview) {",
  );
  const previewHandlers = sliceBetween(
    source,
    "function createRoomInlinePreviewHandlers(room, preview) {",
    "function appendRoomInlinePreviewPanel(rail, room, action) {",
  );
  const previewPanelAppender = sliceBetween(
    source,
    "function appendRoomInlinePreviewPanel(rail, room, action) {",
    "function createRoomInlineActions(room) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "function roomPreviewContext(room) {",
  );

  assert.match(railRenderer, /const rail = document\.createElement\("div"\)/);
  assert.match(railRenderer, /rail\.className = railDomSpec\.className/);
  assert.match(railRenderer, /setDatasetFlag\(rail, key, value\)/);
  assert.match(previewContext, /const preview = resolveRoomQuickPreview\(room, action\)/);
  assert.match(previewContext, /const selectedFieldView = preview/);
  assert.match(previewContext, /buildQuickActionInlinePreviewPanelModel\(\{/);
  assert.match(previewHandlers, /const activatePreviewSnapshot = \(event\) => \{/);
  assert.match(previewHandlers, /quickActionStructuredDraft\(preview\.structured, preview\.action\)/);
  assert.match(previewHandlers, /const activatePreviewWorkflow = \(event\) => \{/);
  assert.match(previewHandlers, /return \{\s*snapshot: activatePreviewSnapshot,\s*workflow: activatePreviewWorkflow,\s*\}/);
  assert.match(previewPanelAppender, /const previewContext = roomInlinePreviewContext\(room, action\)/);
  assert.match(previewPanelAppender, /const inlineActionHandlers = createRoomInlinePreviewHandlers\(room, preview\)/);
  assert.match(previewPanelAppender, /buildQuickActionInlinePreviewPanelRenderDomModel\(inlinePanelModel, quickActionIntensity\(action\)\)/);
  assert.match(previewPanelAppender, /createInlineHintClickableApplier\(room, preview, inlineActionHandlers\)/);
  assert.match(previewPanelAppender, /return false/);
  assert.match(previewPanelAppender, /return true/);
  assert.match(inlineActionsSource, /const rail = createRoomInlineRailNode\(railDomSpec\)/);
  assert.match(inlineActionsSource, /if \(!appendRoomInlinePreviewPanel\(rail, room, action\)\) return rail/);
  assert.doesNotMatch(inlineActionsSource, /buildQuickActionInlinePreviewPanelModel/);
  assert.doesNotMatch(inlineActionsSource, /quickActionStructuredDraft/);
});

test("quick action preview card meta pills are delegated out of createQuickActionPreviewCard", async () => {
  const source = await readShellModule("app.js");
  const actionBinder = sliceBetween(
    source,
    "function attachQuickActionPreviewMetaPillAction(pill, title, onActivate) {",
    "function createQuickActionPreviewPillNode(pillSpec, history, options) {",
  );
  const pillRenderer = sliceBetween(
    source,
    "function createQuickActionPreviewPillNode(pillSpec, history, options) {",
    "function createQuickActionPreviewPillGroupLabelNode(labelSpec) {",
  );
  const cardRenderer = sliceBetween(
    source,
    "function createQuickActionPreviewCard(action, previewState = \"\", structured = null, options = {}) {",
    "function latestRoomQuickState(room) {",
  );

  assert.match(actionBinder, /quickActionPreviewClickableDomSpec\(title\)/);
  assert.match(actionBinder, /quickActionPreviewKeyActivates\(event\.key\)/);
  assert.match(actionBinder, /onActivate\(\)/);
  assert.match(pillRenderer, /pillSpec\.className \? document\.createElement\("span"\) : createPill\(pillSpec\.text, pillSpec\.tone\)/);
  assert.match(pillRenderer, /pillActionTarget\?\.kind === "history"/);
  assert.match(pillRenderer, /options\.onHistoryClick\(history\[pillActionTarget\.snapshotIndex\], pillActionTarget\.snapshotIndex\)/);
  assert.match(pillRenderer, /pillActionTarget\?\.kind === "field-view"/);
  assert.match(pillRenderer, /options\.onFieldViewChange\(pillActionTarget\.fieldView\)/);
  assert.doesNotMatch(cardRenderer, /const attachPreviewMetaPillAction =/);
  assert.doesNotMatch(cardRenderer, /const renderPillSpec =/);
});

test("quick action preview card header and pill groups are delegated out of createQuickActionPreviewCard", async () => {
  const source = await readShellModule("app.js");
  const headerAppender = sliceBetween(
    source,
    "function appendQuickActionPreviewHeader(card, previewRenderDomSpec, history, options) {",
    "function createQuickActionPreviewControlButtonNode(buttonDomSpec, history, options) {",
  );
  const cardRenderer = sliceBetween(
    source,
    "function createQuickActionPreviewCard(action, previewState = \"\", structured = null, options = {}) {",
    "function latestRoomQuickState(room) {",
  );

  assert.match(headerAppender, /const header = document\.createElement\("div"\)/);
  assert.match(headerAppender, /header\.className = previewRenderDomSpec\.header\.headerClassName/);
  assert.match(headerAppender, /heading\.appendChild\(createLine\(previewRenderDomSpec\.header\.kickerLine\.className/);
  assert.match(headerAppender, /pills\.className = previewRenderDomSpec\.pillsWrapperClassName/);
  assert.match(headerAppender, /previewRenderDomSpec\.pillSections\.forEach\(\(sectionSpec\) => \{/);
  assert.match(headerAppender, /createQuickActionPreviewPillGroupNode\(sectionSpec\.group, history, options\)/);
  assert.match(headerAppender, /card\.appendChild\(header\)/);
  assert.match(cardRenderer, /appendQuickActionPreviewHeader\(card, previewRenderDomSpec, history, options\)/);
  assert.doesNotMatch(cardRenderer, /previewRenderDomSpec\.pillSections\.forEach/);
  assert.doesNotMatch(cardRenderer, /pills\.className = previewRenderDomSpec\.pillsWrapperClassName/);
});

test("quick action preview card controls and sheet are delegated out of createQuickActionPreviewCard", async () => {
  const source = await readShellModule("app.js");
  const controlsAppender = sliceBetween(
    source,
    "function appendQuickActionPreviewControlPanels(card, previewRenderDomSpec, history, options) {",
    "function createQuickActionPreviewSheetNode(sheetRenderDomSpec) {",
  );
  const sheetRenderer = sliceBetween(
    source,
    "function createQuickActionPreviewSheetNode(sheetRenderDomSpec) {",
    "function createQuickActionPreviewCard(action, previewState = \"\", structured = null, options = {}) {",
  );
  const cardRenderer = sliceBetween(
    source,
    "function createQuickActionPreviewCard(action, previewState = \"\", structured = null, options = {}) {",
    "function latestRoomQuickState(room) {",
  );

  assert.match(controlsAppender, /previewRenderDomSpec\.controlPanels\.forEach\(\(panelSpec\) => \{/);
  assert.match(controlsAppender, /const buttonNodes = panelSpec\.buttons\.map\(\(buttonDomSpec\) =>/);
  assert.match(controlsAppender, /createQuickActionPreviewControlButtonNode\(buttonDomSpec, history, options\)/);
  assert.match(controlsAppender, /card\.appendChild\(panel\)/);
  assert.match(sheetRenderer, /if \(!sheetRenderDomSpec\) return null/);
  assert.match(sheetRenderer, /const sheet = document\.createElement\("div"\)/);
  assert.match(sheetRenderer, /if \(childSpec\.kind === "row"\) \{/);
  assert.match(sheetRenderer, /row\.append\(label, value\)/);
  assert.match(sheetRenderer, /if \(childSpec\.kind === "notes"\) \{/);
  assert.match(sheetRenderer, /return sheet/);
  assert.match(cardRenderer, /appendQuickActionPreviewControlPanels\(card, previewRenderDomSpec, history, options\)/);
  assert.match(cardRenderer, /const sheet = createQuickActionPreviewSheetNode\(previewRenderDomSpec\.sheet\)/);
  assert.doesNotMatch(cardRenderer, /previewRenderDomSpec\.controlPanels\.forEach/);
  assert.doesNotMatch(cardRenderer, /for \(const childSpec of sheetRenderDomSpec\.children\)/);
});

test("user detail card projection branches are delegated out of app.js", async () => {
  const source = await readShellModule("app.js");
  const detailCardModule = await readShellModule("shell-user-detail-card.js");
  // 模块导出纯函数（deps 注入）
  assert.match(detailCardModule, /export function userDetailCardProjectionForState/);
  assert.match(detailCardModule, /export function userDetailCardIdleProjectionForState/);
  assert.match(detailCardModule, /export function userDetailCardMonogramForState/);
  assert.match(detailCardModule, /export function userDetailCardCustomProjectionForState/);
  assert.match(detailCardModule, /export function userDetailCardCityProjectionForState/);
  assert.match(detailCardModule, /export function userDetailCardHomeProjectionForState/);
  // 分支文案/逻辑落在模块里
  assert.match(detailCardModule, /variant: "idle"/);
  assert.match(detailCardModule, /公共频道向导/);
  assert.match(detailCardModule, /currentIdentity\(\) \|\| "当前住户"/);
  assert.match(detailCardModule, /deps\.roomAudienceLabel\(room\)/);
  assert.match(detailCardModule, /deps\.roomChatStatusSummary\(room\)/);
  // app.js 引用模块
  assert.match(source, /from "\.\/shell-user-detail-card\.js"/);
  // app.js 的 userDetailCardProjection 是薄壳委托
  const projectionSource = sliceBetween(
    source,
    "function userDetailCardProjection(room, visual, projection) {",
    "function applyUserDetailCardShellState(card) {",
  );
  assert.match(projectionSource, /return userDetailCardProjectionForState\(room, visual, projection, \{/);
  assert.match(projectionSource, /roomChatStatusSummary,/);
  assert.match(projectionSource, /currentIdentity,/);
  assert.match(projectionSource, /roomDisplayPeer,/);
  assert.match(projectionSource, /roomAudienceLabel,/);
  // app.js 不再内联这些分支函数（已下沉到模块）
  assert.doesNotMatch(source, /function userDetailCardIdleProjection\(/);
  assert.doesNotMatch(source, /function userDetailCardMonogram\(/);
  assert.doesNotMatch(source, /function userDetailCardCustomProjection\(/);
  assert.doesNotMatch(source, /function userDetailCardCityProjection\(/);
  assert.doesNotMatch(source, /function userDetailCardHomeProjection\(/);
  // 分支文案不再留在 app.js 的 projection 薄壳里
  assert.doesNotMatch(projectionSource, /公共频道向导/);
  assert.doesNotMatch(projectionSource, /currentIdentity\(\) \|\| "当前住户"/);
});

test("room stage projection copy is delegated out of app.js", async () => {
  const source = await readShellModule("app.js");
  const stageModule = await readShellModule("shell-room-stage.js");
  const summarySource = sliceBetween(
    source,
    "function roomStageSummary(room) {",
    "function roomStagePortraitSummary(room) {",
  );
  const portraitSummarySource = sliceBetween(
    source,
    "function roomStagePortraitSummary(room) {",
    "function roomStagePortraitTitle(room) {",
  );
  const portraitTitleSource = sliceBetween(
    source,
    "function roomStagePortraitTitle(room) {",
    "function roomStagePortraitChips(room) {",
  );
  const portraitChipsSource = sliceBetween(
    source,
    "function roomStagePortraitChips(room) {",
    "function appendRoomQuickStateAdvanceButton(actions, room, options = {}) {",
  );
  const projectionSource = sliceBetween(
    source,
    "function userRoomProjection(room, visual) {",
    "function sceneImageLayerEnv() {",
  );

  assert.match(source, /from "\.\/shell-room-stage\.js"/);
  assert.match(stageModule, /export function roomStageSummaryForState/);
  assert.match(stageModule, /export function roomStagePortraitSummaryForState/);
  assert.match(stageModule, /export function roomStagePortraitChipsForState/);
  assert.match(stageModule, /export function userRoomProjectionForState/);
  assert.match(summarySource, /roomStageSummaryForState\(\{/);
  assert.match(portraitSummarySource, /roomStagePortraitSummaryForState\(\{/);
  assert.match(portraitTitleSource, /roomStagePortraitTitleForState\(\{/);
  assert.match(portraitChipsSource, /roomStagePortraitChipsForState\(\{/);
  assert.match(projectionSource, /userRoomProjectionForState\(\{/);
  assert.doesNotMatch(summarySource, /先选一个会话|auto_reply/);
  assert.doesNotMatch(portraitSummarySource, /先从左侧选会话|房间管家/);
  assert.doesNotMatch(portraitChipsSource, /等待选中会话|条访客提醒/);
  assert.doesNotMatch(projectionSource, /住宅私聊 \/ 房内聊天|公共频道 \/ 群聊现场/);
});

test("scene image-layer URL resolution is delegated out of app.js", async () => {
  const source = await readShellModule("app.js");
  const imageLayerModule = await readShellModule("shell-scene-image-layer.js");
  // 模块导出纯函数 + env 依赖注入
  assert.match(imageLayerModule, /export function imageLayerUrlForState/);
  assert.match(imageLayerModule, /export function presetImageLayerUrlForState/);
  assert.match(imageLayerModule, /export function timeAdjustedRuntimeSceneUrlForState/);
  assert.match(source, /from "\.\/shell-scene-image-layer\.js"/);
  // app.js 不再持有 preset/runtime URL Map（已移入模块）
  assert.doesNotMatch(source, /const USER_SCENE_IMAGE_LAYER_PRESETS = new Map/);
  assert.doesNotMatch(source, /const DAY_SCENE_RUNTIME_URLS = new Map/);
  assert.doesNotMatch(source, /const MOBILE_SCENE_RUNTIME_URLS = new Map/);
  // app.js 的 imageLayerUrl/presetImageLayerUrl 是薄委托
  const delegator = sliceBetween(source, "function sceneImageLayerEnv() {", "function syncUserRoomProjection(room, visual) {");
  assert.match(delegator, /imageLayerUrlForState/);
  assert.match(delegator, /presetImageLayerUrlForState/);
  assert.match(delegator, /timeAdjustedRuntimeSceneUrlForState/);
});

test("room state summaries are delegated out of app.js", async () => {
  const source = await readShellModule("app.js");
  const summaryModule = await readShellModule("shell-room-summary.js");
  // 模块导出 *ForState 纯函数 + deps 注入
  assert.match(summaryModule, /export function roomFollowUpCountForState/);
  assert.match(summaryModule, /export function roomChatStatusSummaryForState/);
  assert.match(summaryModule, /export function roomQueueSummaryForState/);
  assert.match(source, /from "\.\/shell-room-summary\.js"/);
  // app.js 不再内联摘要分支逻辑，改为薄委托
  assert.match(source, /function roomSummaryDeps\(\)/);
  const queueDelegator = sliceBetween(source, "function roomQueueSummary(room) {", "function roomThreadHeadline(room) {");
  assert.match(queueDelegator, /roomQueueSummaryForState\(room, roomSummaryDeps\(\)\)/);
  assert.doesNotMatch(queueDelegator, /条访客提醒|条新动态/);
});

test("user detail card shell state and meta rows are delegated out of syncUserDetailCard", async () => {
  const source = await readShellModule("app.js");
  const shellRenderer = sliceBetween(
    source,
    "function applyUserDetailCardShellState(card) {",
    "function clearUserDetailCardTransientNodes() {",
  );
  const syncSource = sliceBetween(
    source,
    "function syncUserDetailCard(room, visual, projection) {",
    "function ensureUserSceneChrome() {",
  );

  assert.match(shellRenderer, /setDatasetFlag\(chatDetailCardShellEl, "roomVariant", card\.variant\)/);
  assert.match(shellRenderer, /setDatasetFlag\(chatDetailCardActionsEl, "roomMotif", card\.motif\)/);
  assert.match(shellRenderer, /chatDetailCardKickerEl\.textContent = card\.kicker/);
  assert.match(shellRenderer, /chatDetailCardAvatarEl\.textContent = card\.monogram/);
  assert.match(shellRenderer, /clearChildren\(chatDetailCardMetaEl\)/);
  assert.match(shellRenderer, /createChatDetailCardMetaRow\(item\.label, item\.value\)/);
  assert.match(syncSource, /applyUserDetailCardShellState\(card\)/);
  assert.doesNotMatch(syncSource, /chatDetailCardKickerEl\.textContent = card\.kicker/);
  assert.doesNotMatch(syncSource, /createChatDetailCardMetaRow\(item\.label, item\.value\)/);
});

test("user detail card workflow and preview sections are delegated out of syncUserDetailCard", async () => {
  const source = await readShellModule("app.js");
  const clearRenderer = sliceBetween(
    source,
    "function clearUserDetailCardTransientNodes() {",
    "function insertUserDetailCardTransientNode(node) {",
  );
  const insertRenderer = sliceBetween(
    source,
    "function insertUserDetailCardTransientNode(node) {",
    "function createUserDetailCardWorkflowNode(room, quickAction, quickState) {",
  );
  const workflowRenderer = sliceBetween(
    source,
    "function createUserDetailCardWorkflowNode(room, quickAction, quickState) {",
    "function createUserDetailCardPreviewNode(room, quickAction, preview) {",
  );
  const previewRenderer = sliceBetween(
    source,
    "function createUserDetailCardPreviewNode(room, quickAction, preview) {",
    "function renderUserDetailCardDynamicSections(room, quickAction, quickState, preview) {",
  );
  const dynamicRenderer = sliceBetween(
    source,
    "function renderUserDetailCardDynamicSections(room, quickAction, quickState, preview) {",
    "function createUserDetailCardActionButton(action) {",
  );
  const syncSource = sliceBetween(
    source,
    "function syncUserDetailCard(room, visual, projection) {",
    "function ensureUserSceneChrome() {",
  );

  assert.match(clearRenderer, /querySelectorAll\("\.chat-detail-card-workflow"\)/);
  assert.match(clearRenderer, /querySelectorAll\("\.chat-detail-card-preview"\)/);
  assert.match(insertRenderer, /chatDetailCardShellEl\.insertBefore\(node, chatDetailCardActionsEl\)/);
  assert.match(workflowRenderer, /createWorkflowProgress\(quickAction, quickState/);
  assert.match(workflowRenderer, /previewRoomQuickStage\(room\?\.id \|\| activeRoomId, quickAction, stage\.label\)/);
  assert.match(previewRenderer, /createQuickActionPreviewCard\(quickAction, previewState, previewStructured/);
  assert.match(previewRenderer, /roomQuickPreviewCardFieldView\(/);
  assert.match(previewRenderer, /setRoomQuickPreviewCardFieldView\(/);
  assert.match(dynamicRenderer, /clearUserDetailCardTransientNodes\(\)/);
  assert.match(dynamicRenderer, /insertUserDetailCardTransientNode\(workflow\)/);
  assert.match(dynamicRenderer, /insertUserDetailCardTransientNode\(previewCard\)/);
  assert.match(syncSource, /renderUserDetailCardDynamicSections\(room, quickAction, quickState, preview\)/);
  assert.doesNotMatch(syncSource, /createWorkflowProgress\(quickAction, quickState/);
  assert.doesNotMatch(syncSource, /createQuickActionPreviewCard\(quickAction, previewState, previewStructured/);
});

test("user detail card action buttons are delegated out of syncUserDetailCard", async () => {
  const source = await readShellModule("app.js");
  const buttonRenderer = sliceBetween(
    source,
    "function createUserDetailCardActionButton(action) {",
    "function renderUserDetailCardActions(room, card) {",
  );
  const actionsRenderer = sliceBetween(
    source,
    "function renderUserDetailCardActions(room, card) {",
    "function syncUserDetailCard(room, visual, projection) {",
  );
  const syncSource = sliceBetween(
    source,
    "function syncUserDetailCard(room, visual, projection) {",
    "function ensureUserSceneChrome() {",
  );

  assert.match(buttonRenderer, /button\.className = "chat-detail-card-action"/);
  assert.match(buttonRenderer, /button\.dataset\.cardAction = action/);
  assert.match(buttonRenderer, /seedComposerFromQuickAction\(action\)/);
  assert.match(actionsRenderer, /clearChildren\(chatDetailCardActionsEl\)/);
  assert.match(actionsRenderer, /for \(const action of card\.actions\) \{/);
  assert.match(actionsRenderer, /createUserDetailCardActionButton\(action\)/);
  assert.match(actionsRenderer, /appendRoomQuickActionOverviewButton\(chatDetailCardActionsEl, room/);
  assert.match(actionsRenderer, /appendRoomQuickStateAdvanceButton\(chatDetailCardActionsEl, room/);
  assert.match(actionsRenderer, /syncUserQuickActionButtons\(room\?\.id \|\| activeRoomId\)/);
  assert.match(syncSource, /renderUserDetailCardActions\(room, card\)/);
  assert.doesNotMatch(syncSource, /button\.dataset\.cardAction = action/);
  assert.doesNotMatch(syncSource, /appendRoomQuickActionOverviewButton\(chatDetailCardActionsEl, room/);
});

test("user scene chrome DOM assembly is delegated out of ensureUserSceneChrome", async () => {
  const source = await readShellModule("app.js");
  const sceneEnsurer = sliceBetween(
    source,
    "function ensureUserSceneChrome() {",
    "function ensureRoomStageSideChrome() {",
  );
  const sideEnsurer = sliceBetween(
    source,
    "function ensureRoomStageSideChrome() {",
    "function createRoomStageSideElement() {",
  );
  const canvasFactory = sliceBetween(
    source,
    "function createRoomStageCanvasChrome(id, label) {",
    "function ensureRoomStagePortraitCanvasChrome() {",
  );
  const chatDetailEnsurer = sliceBetween(
    source,
    "function ensureChatDetailPanelChrome() {",
    "function createChatDetailPanelChrome() {",
  );

  assert.match(sceneEnsurer, /ensureRoomStageSideChrome\(\)/);
  assert.match(sceneEnsurer, /ensureRoomStagePortraitCanvasChrome\(\)/);
  assert.match(sceneEnsurer, /ensureRoomStageCanvasChrome\(\)/);
  assert.match(sceneEnsurer, /ensureChatDetailPanelChrome\(\)/);
  assert.match(sideEnsurer, /roomStageSideEl = createRoomStageSideElement\(\)/);
  assert.match(canvasFactory, /canvas\.id = id/);
  assert.match(canvasFactory, /canvas\.setAttribute\("aria-label", label\)/);
  assert.match(chatDetailEnsurer, /chatDetailPanelEl = createChatDetailPanelChrome\(\)/);
  assert.doesNotMatch(sceneEnsurer, /document\.createElement/);
  assert.doesNotMatch(sceneEnsurer, /setInlineStyle/);
});

test("room inline action buttons are delegated out of createRoomInlineActions", async () => {
  const source = await readShellModule("app.js");
  const actionNodeSource = sliceBetween(
    source,
    "function createRoomInlineActionNode(action, label, role, onActivate) {",
    "function appendRoomInlineActionNodes(rail, room, inlineActionsModel) {",
  );
  const actionAppender = sliceBetween(
    source,
    "function appendRoomInlineActionNodes(rail, room, inlineActionsModel) {",
    "function createRoomInlineActions(room) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  return rail;",
  );

  assert.match(actionNodeSource, /buildRoomInlineActionDomSpec\(action, label, role\)/);
  assert.match(actionNodeSource, /document\.createElement\(actionDomSpec\.type \|\| "span"\)/);
  assert.match(actionNodeSource, /setDatasetFlag\(actionNode, key, value\)/);
  assert.match(actionNodeSource, /actionNode\.addEventListener\("click", \(event\) => \{/);
  assert.doesNotMatch(inlineActionsSource, /const appendAction =/);
  assert.match(actionAppender, /const primaryActionNode = createRoomInlineActionNode\(action, primaryLabel, "primary", \(\) => \{/);
  assert.match(actionAppender, /const secondaryActionNode = createRoomInlineActionNode\(action, secondaryLabel, "secondary", \(\) => \{/);
  assert.match(actionAppender, /if \(primaryActionNode\) rail\.appendChild\(primaryActionNode\)/);
  assert.match(actionAppender, /if \(secondaryActionNode\) rail\.appendChild\(secondaryActionNode\)/);
  assert.match(inlineActionsSource, /appendRoomInlineActionNodes\(rail, room, inlineActionsModel\)/);
});

test("room inline primary and secondary action append is delegated out of createRoomInlineActions", async () => {
  const source = await readShellModule("app.js");
  const actionAppender = sliceBetween(
    source,
    "function appendRoomInlineActionNodes(rail, room, inlineActionsModel) {",
    "function createRoomInlineActions(room) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  return rail;",
  );

  assert.match(actionAppender, /primarySpec,\s*secondarySpec,\s*primaryLabel,\s*secondaryLabel/);
  assert.match(actionAppender, /const primaryActionNode = createRoomInlineActionNode\(action, primaryLabel, "primary", \(\) => \{/);
  assert.match(actionAppender, /seedComposerFromQuickAction\(/);
  assert.match(actionAppender, /const secondaryActionNode = createRoomInlineActionNode\(action, secondaryLabel, "secondary", \(\) => \{/);
  assert.match(actionAppender, /setRoomQuickAction\(room\.id, nextAction\)/);
  assert.match(actionAppender, /setRoomQuickState\(room\.id, nextAction, secondarySpec\.next_state\)/);
  assert.match(actionAppender, /advanceRoomQuickState\(room\.id\)/);
  assert.match(actionAppender, /if \(primaryActionNode\) rail\.appendChild\(primaryActionNode\)/);
  assert.match(actionAppender, /if \(secondaryActionNode\) rail\.appendChild\(secondaryActionNode\)/);
  assert.match(inlineActionsSource, /appendRoomInlineActionNodes\(rail, room, inlineActionsModel\)/);
  assert.doesNotMatch(inlineActionsSource, /const primaryActionNode = createRoomInlineActionNode/);
  assert.doesNotMatch(inlineActionsSource, /const secondaryActionNode = createRoomInlineActionNode/);
});

test("room inline hint DOM is delegated out of createRoomInlineActions", async () => {
  const source = await readShellModule("app.js");
  const hintRenderer = sliceBetween(
    source,
    "function createInlineHintNode(inlineHintDomModel, applyInlineHintClickable) {",
    "function createRoomInlineProgressNode(progressDomSpec) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  appendRoomInlineActionNodes(rail, room, inlineActionsModel);",
  );

  assert.match(hintRenderer, /document\.createElement\("div"\)/);
  assert.match(hintRenderer, /hint\.className = inlineHintDomModel\.className/);
  assert.match(hintRenderer, /Object\.entries\(inlineHintDomModel\.dataset\)/);
  assert.match(hintRenderer, /if \(part\.kind === "separator"\) \{/);
  assert.match(hintRenderer, /applyInlineHintClickable\(node, part\)/);
  assert.match(inlineActionsSource, /appendRoomInlinePreviewPanel\(rail, room, action\)/);
  assert.doesNotMatch(inlineActionsSource, /for \(const part of inlineHintDomModel\.parts\)/);
  assert.doesNotMatch(inlineActionsSource, /hint\.appendChild\(node\)/);
});

test("room inline hint action binding is delegated out of createRoomInlineActions", async () => {
  const source = await readShellModule("app.js");
  const hintActionBinder = sliceBetween(
    source,
    "function bindInlineHintAction(node, target, room, preview, inlineHintHandlers) {",
    "function createInlineHintClickableApplier(room, preview, inlineHintHandlers) {",
  );
  const hintClickableApplier = sliceBetween(
    source,
    "function createInlineHintClickableApplier(room, preview, inlineHintHandlers) {",
    "function createRoomInlineProgressNode(progressDomSpec) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  appendRoomInlineActionNodes(rail, room, inlineActionsModel);",
  );

  assert.match(hintActionBinder, /const handler = inlineHintHandlers\[target\?\.type\]/);
  assert.match(hintActionBinder, /if \(typeof handler === "function"\) \{/);
  assert.match(hintActionBinder, /node\.addEventListener\("click", handler\)/);
  assert.match(hintActionBinder, /if \(target\?\.type === "history"\) \{/);
  assert.match(hintActionBinder, /previewRoomQuickStage\(room\.id, preview\.action, preview\.state, target\.snapshotIndex\)/);
  assert.match(hintClickableApplier, /applyInlineClickableDomSpec\(node, part\.clickable\)/);
  assert.match(hintClickableApplier, /bindInlineHintAction\(node, part\.actionTarget, room, preview, inlineHintHandlers\)/);
  assert.match(inlineActionsSource, /appendRoomInlinePreviewPanel\(rail, room, action\)/);
  assert.doesNotMatch(inlineActionsSource, /const bindInlineHintAction =/);
});

test("room inline meta child DOM is delegated out of createRoomInlineActions", async () => {
  const source = await readShellModule("app.js");
  const metaChildRenderer = sliceBetween(
    source,
    "function createInlineMetaChildNode(childSpec, attachInlineMetaModelAction) {",
    "function appendInlineCardMeta(inlineCard, childModel, attachInlineMetaModelAction) {",
  );
  const metaRenderer = sliceBetween(
    source,
    "function appendInlineCardMeta(inlineCard, childModel, attachInlineMetaModelAction) {",
    "function appendInlineCardActions(inlineCard, childModel, inlineActionHandlers) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  appendRoomInlineActionNodes(rail, room, inlineActionsModel);",
  );

  assert.match(metaChildRenderer, /document\.createElement\(childSpec\.type \|\| "span"\)/);
  assert.match(metaChildRenderer, /node\.className = childSpec\.className/);
  assert.match(metaChildRenderer, /node\.textContent = childSpec\.text \|\| ""/);
  assert.match(metaChildRenderer, /attachInlineMetaModelAction\(node, \{/);
  assert.match(metaChildRenderer, /clickable: childSpec\.clickable/);
  assert.match(metaChildRenderer, /node\.appendChild\(createInlineMetaChildNode\(nestedSpec, attachInlineMetaModelAction\)\)/);
  assert.match(metaRenderer, /inlineMeta\.appendChild\(createInlineMetaChildNode\(childSpec, attachInlineMetaModelAction\)\)/);
  assert.doesNotMatch(inlineActionsSource, /const createInlineMetaChildNode =/);
  assert.doesNotMatch(inlineActionsSource, /inlineMeta\.appendChild\(createInlineMetaChildNode/);
});

test("room inline card meta DOM is delegated out of createRoomInlineActions", async () => {
  const source = await readShellModule("app.js");
  const metaRenderer = sliceBetween(
    source,
    "function appendInlineCardMeta(inlineCard, childModel, attachInlineMetaModelAction) {",
    "function appendInlineCardActions(inlineCard, childModel, inlineActionHandlers) {",
  );
  const cardAppender = sliceBetween(
    source,
    "function appendRoomInlinePreviewCard(rail, room, preview, inlinePanelRenderDomModel, inlineActionHandlers) {",
    "function createRoomInlineActionNode(action, label, role, onActivate) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  appendRoomInlineActionNodes(rail, room, inlineActionsModel);",
  );

  assert.match(metaRenderer, /const inlineMetaDomModel = childModel\.model/);
  assert.match(metaRenderer, /const inlineMeta = createInlineCardContainerNode\(inlineMetaDomModel\)/);
  assert.match(metaRenderer, /inlineMetaDomModel\.sections\.forEach\(\(section\) => \{/);
  assert.match(metaRenderer, /inlineMeta\.appendChild\(createInlineMetaChildNode\(childSpec, attachInlineMetaModelAction\)\)/);
  assert.match(metaRenderer, /inlineCard\.appendChild\(inlineMeta\)/);
  assert.match(cardAppender, /appendInlineCardMeta\(inlineCard, childModel, attachInlineMetaModelAction\)/);
  assert.doesNotMatch(inlineActionsSource, /createInlineCardContainerNode\(inlineMetaDomModel\)/);
});

test("room inline meta pill activation is delegated out of createRoomInlineActions", async () => {
  const source = await readShellModule("app.js");
  const metaPillBinder = sliceBetween(
    source,
    "function attachInlineMetaPillAction(pill, clickableSpec, onActivate) {",
    "function createInlineMetaChildNode(childSpec, attachInlineMetaModelAction) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  appendRoomInlineActionNodes(rail, room, inlineActionsModel);",
  );

  assert.match(metaPillBinder, /if \(!pill \|\| typeof onActivate !== "function"\) return/);
  assert.match(metaPillBinder, /applyInlineClickableDomSpec\(pill, clickableSpec\)/);
  assert.match(metaPillBinder, /pill\.addEventListener\("click", \(event\) => \{/);
  assert.match(metaPillBinder, /event\.preventDefault\(\)/);
  assert.match(metaPillBinder, /event\.stopPropagation\(\)/);
  assert.match(metaPillBinder, /quickActionPreviewKeyActivates\(event\.key\)/);
  assert.doesNotMatch(inlineActionsSource, /const attachInlineMetaPillAction =/);
});

test("room inline card controls DOM is delegated out of createRoomInlineActions", async () => {
  const source = await readShellModule("app.js");
  const controlsRenderer = sliceBetween(
    source,
    "function appendInlineCardControls(inlineCard, childModel, onInlineCardControlAction) {",
    "function createInlineHintNode(inlineHintDomModel, applyInlineHintClickable) {",
  );
  const cardAppender = sliceBetween(
    source,
    "function appendRoomInlinePreviewCard(rail, room, preview, inlinePanelRenderDomModel, inlineActionHandlers) {",
    "function createRoomInlineActionNode(action, label, role, onActivate) {",
  );
  const inlineActionsSource = sliceBetween(
    source,
    "function createRoomInlineActions(room) {",
    "  appendRoomInlineActionNodes(rail, room, inlineActionsModel);",
  );

  assert.match(controlsRenderer, /const inlineControlsDomModel = childModel\.model/);
  assert.match(controlsRenderer, /inlineControlsDomModel\.groups\.forEach\(\(group\) => \{/);
  assert.match(controlsRenderer, /const container = createInlineCardContainerNode\(group\)/);
  assert.match(controlsRenderer, /const button = createInlineCardButtonNode\(buttonSpec\)/);
  assert.match(controlsRenderer, /onInlineCardControlAction\(buttonSpec\.actionTarget\)/);
  assert.match(controlsRenderer, /inlineCard\.appendChild\(container\)/);
  assert.match(cardAppender, /appendInlineCardControls\(inlineCard, childModel, handleInlineCardControlAction\)/);
  assert.doesNotMatch(inlineActionsSource, /const renderInlineCardControls =/);
});

test("gateway send clears pending echo only after successful refresh", async () => {
  const source = await readShellModule("app.js");
  const postRenderer = sliceBetween(
    source,
    "async function postGatewayMessageAndRefresh(roomId, payload, onPosted) {",
    "function handleGatewaySendFailure(roomId, pendingEchoId, posted, error) {",
  );

  assert.match(
    postRenderer,
    /await postGatewayJson\("\/v1\/shell\/message", payload\);\s*onPosted\?\.\(\);\s*delete roomSendErrors\[roomId\];\s*await refreshFromGateway\(\{ requireShell: true \}\);\s*clearPendingEchoes\(roomId\);/,
  );
});

test("sendMessage delegates local send side effects and gateway send lifecycle", async () => {
  const source = await readShellModule("app.js");
  const sendRenderer = sliceBetween(
    source,
    "async function sendMessage(text, { quickAction = \"\" } = {}) {",
    "async function editMessage(roomId, messageId, text) {",
  );

  assert.match(source, /function appendLocalRoomMessage\(roomId, text, quickAction\) \{/);
  assert.match(source, /function clearComposerAfterSend\(roomId, text\) \{/);
  assert.match(source, /function renderAfterSend\(\{ composerFirst = false \} = \{\}\) \{/);
  assert.match(source, /function commitLocalSend\(roomId, text, quickAction\) \{/);
  assert.match(source, /function gatewayMessagePayload\(roomId, text, quickAction\) \{/);
  assert.match(source, /function prepareGatewaySend\(roomId, text, quickAction\) \{/);
  assert.match(source, /async function postGatewayMessageAndRefresh\(roomId, payload, onPosted\) \{/);
  assert.match(source, /function handleGatewaySendFailure\(roomId, pendingEchoId, posted, error\) \{/);
  assert.match(source, /function finishGatewaySendAttempt\(\) \{/);

  assert.match(sendRenderer, /commitLocalSend\(roomId, text, quickAction\)/);
  assert.match(sendRenderer, /const payload = gatewayMessagePayload\(roomId, text, quickAction\)/);
  assert.match(sendRenderer, /const pendingEchoId = prepareGatewaySend\(roomId, text, quickAction\)/);
  assert.match(sendRenderer, /await postGatewayMessageAndRefresh\(roomId, payload, \(\) => \{/);
  assert.match(sendRenderer, /handleGatewaySendFailure\(roomId, pendingEchoId, posted, error\)/);
  assert.match(sendRenderer, /finishGatewaySendAttempt\(\)/);
  assert.doesNotMatch(sendRenderer, /room\.messages\.push/);
  assert.doesNotMatch(sendRenderer, /await postGatewayJson\("\/v1\/shell\/message", payload\)/);
});

test("gateway render hides pending echo once committed copy is present", async () => {
  const source = await readShellModule("app.js");
  const messageStateSource = await readShellModule("shell-message-state.js");

  assert.match(source, /function visiblePendingEchoesForRoom\(room\) \{/);
  assert.match(source, /visiblePendingEchoesForRoomData\(room, pendingEchoesForRoom\(room\?\.id\)\)/);
  assert.match(messageStateSource, /messageMatchesPendingEcho\(message, pending\)/);
  assert.match(source, /const pending = visiblePendingEchoesForRoom\(room\);/);
  assert.doesNotMatch(source, /const pending = pendingEchoesForRoom\(room\.id\);/);
});

test("gateway send failure keeps composer cleared and stops pending typing", async () => {
  const source = await readShellModule("app.js");
  const renderSource = await readShellModule("shell-message-render.js");

  assert.doesNotMatch(source, /if \(!posted\) \{\s*updateRoomDraft\(roomId, text\);\s*composerInputEl\.value = text;/);
  assert.match(source, /timelineTypingIndicatorSpec\(flowSpec\.pending\)/);
  assert.match(renderSource, /pending\.some\(\(message\) => !message\?\.failed\)/);
});

test("message owner action specs are delegated out of createMessageOwnerActions", async () => {
  const source = await readShellModule("app.js");
  const renderSource = await readShellModule("shell-message-render.js");
  const ownerActionRenderer = sliceBetween(
    source,
    "function createMessageOwnerActions(room, message, { isSelf, messageKind } = {}) {",
    "async function retryPendingEcho(roomId, echoId) {",
  );

  assert.match(renderSource, /export function messageOwnerActionSpecs\(\{/);
  assert.match(ownerActionRenderer, /messageOwnerActionSpecs\(\{/);
  assert.match(ownerActionRenderer, /createMessageOwnerActionButton\(spec, room, message\)/);
  assert.doesNotMatch(ownerActionRenderer, /message\?\.moderation_status === ['"]blocked['"]/);
  assert.doesNotMatch(ownerActionRenderer, /editButton\.textContent = "编辑"/);
  assert.doesNotMatch(ownerActionRenderer, /recallButton\.textContent = "撤回"/);
});

test("composer submit ignores duplicate send while a message is in flight", async () => {
  const source = await readShellModule("app.js");
  const blockedRenderer = sliceBetween(
    source,
    "function composerSubmitBlocked() {",
    "function composerSubmitDraft() {",
  );

  assert.match(blockedRenderer, /if \(isSendingMessage\) \{\s*updateComposerState\(\);\s*return true;\s*\}/);
  assert.match(source, /async function submitComposerMessage\(\) \{\s*if \(composerSubmitBlocked\(\)\) return false;/);
});

test("composer submit edit and send paths are delegated out of submitComposerMessage", async () => {
  const source = await readShellModule("app.js");
  const submitRenderer = sliceBetween(
    source,
    "async function submitComposerMessage() {",
    "function composerSubmitBlocked() {",
  );
  const editRenderer = sliceBetween(
    source,
    "async function submitComposerEditTarget(text) {",
    "async function submitComposerNewMessage(text, quickAction) {",
  );
  const sendRenderer = sliceBetween(
    source,
    "async function submitComposerNewMessage(text, quickAction) {",
    "function governanceWorldStewardInputElements() {",
  );

  assert.match(submitRenderer, /const draft = composerSubmitDraft\(\)/);
  assert.match(submitRenderer, /if \(editingMessageTarget\) return submitComposerEditTarget\(draft\.text\)/);
  assert.match(submitRenderer, /return submitComposerNewMessage\(draft\.text, draft\.quickAction\)/);
  assert.match(editRenderer, /await editMessage\(target\.roomId, target\.messageId, text\)/);
  assert.match(editRenderer, /clearMessageEditTarget\(\{ clearInput: true \}\)/);
  assert.match(editRenderer, /renderComposerSubmitSurfaces\(\)/);
  assert.match(sendRenderer, /await sendMessage\(text, \{ quickAction \}\)/);
  assert.match(sendRenderer, /localizedRuntimeError\(error, "消息发送失败"\)/);
  assert.match(sendRenderer, /renderComposerSubmitFailure\(activeRoomId, message\)/);
  assert.doesNotMatch(submitRenderer, /await editMessage/);
  assert.doesNotMatch(submitRenderer, /await sendMessage/);
  assert.doesNotMatch(submitRenderer, /localizedRuntimeError/);
});

test("composer state model and form dataset are delegated out of updateComposerState", async () => {
  const source = await readShellModule("app.js");
  const modelRenderer = sliceBetween(
    source,
    "function composerStateModel(room) {",
    "function applyComposerFormState(room, shellPage, composerAvailability) {",
  );
  const formRenderer = sliceBetween(
    source,
    "function applyComposerFormState(room, shellPage, composerAvailability) {",
    "function composerPlaceholderForState(room, shellPage, compactChatShell, composerAvailability) {",
  );
  const stateRenderer = sliceBetween(
    source,
    "function updateComposerState() {",
    "async function submitComposerMessage() {",
  );

  assert.match(modelRenderer, /const shellPage = currentShellPage\(\)/);
  assert.match(modelRenderer, /const draftText = composerInputEl\?\.value\.trim\(\) \|\| ""/);
  assert.match(modelRenderer, /computeComposerAvailability\(\{/);
  assert.match(modelRenderer, /gatewayUnavailable: gatewayUnavailableForComposer\(\)/);
  assert.match(formRenderer, /composerFormEl\.dataset\.shellMode = shellMode/);
  assert.match(formRenderer, /composerFormEl\.dataset\.draftState = composerAvailability\.draftState/);
  assert.match(formRenderer, /setDatasetFlag\(composerFormEl, "quickAction", room \? roomQuickAction\(room\.id\) : ""\)/);
  assert.match(stateRenderer, /const \{ shellPage, compactChatShell, composerAvailability \} = composerStateModel\(room\)/);
  assert.match(stateRenderer, /applyComposerFormState\(room, shellPage, composerAvailability\)/);
  assert.doesNotMatch(stateRenderer, /computeComposerAvailability\(\{/);
  assert.doesNotMatch(stateRenderer, /composerFormEl\.dataset\.draftState/);
});

test("composer input state and downstream renders are delegated out of updateComposerState", async () => {
  const source = await readShellModule("app.js");
  const placeholderRenderer = sliceBetween(
    source,
    "function composerPlaceholderForState(room, shellPage, compactChatShell, composerAvailability) {",
    "function applyComposerInputState(room, shellPage, compactChatShell, composerAvailability) {",
  );
  const inputRenderer = sliceBetween(
    source,
    "function applyComposerInputState(room, shellPage, compactChatShell, composerAvailability) {",
    "function renderComposerDependentSurfaces(room) {",
  );
  const downstreamRenderer = sliceBetween(
    source,
    "function renderComposerDependentSurfaces(room) {",
    "function updateComposerState() {",
  );
  const stateRenderer = sliceBetween(
    source,
    "function updateComposerState() {",
    "async function submitComposerMessage() {",
  );

  assert.match(placeholderRenderer, /return resolveComposerPlaceholderForState\(\{/);
  assert.match(placeholderRenderer, /gatewayUnavailable: gatewayUnavailableForComposer\(\)/);
  assert.match(placeholderRenderer, /loginRequired: residentGatewayLoginRequired\(\)/);
  assert.match(placeholderRenderer, /editingMessage: Boolean\(editingMessageTarget\)/);
  assert.match(placeholderRenderer, /roomThreadHeadline: room \? roomThreadHeadline\(room\) : ""/);
  assert.doesNotMatch(placeholderRenderer, /if \(isSendingMessage\) \{/);
  assert.doesNotMatch(placeholderRenderer, /placeholder \+=/);
  assert.match(inputRenderer, /composerInputEl\.disabled = !composerAvailability\.canDraft \|\| isSendingMessage/);
  assert.match(inputRenderer, /composerSendEl\.disabled = !composerAvailability\.canSend/);
  assert.match(inputRenderer, /composerInputEl\.placeholder = placeholder/);
  assert.match(inputRenderer, /composerSendEl\.textContent = isSendingMessage/);
  assert.match(downstreamRenderer, /syncUserQuickActionButtons\(room\?\.id \|\| activeRoomId\)/);
  assert.match(downstreamRenderer, /renderComposerHero\(room\)/);
  assert.match(downstreamRenderer, /renderComposerMeta\(room\)/);
  assert.match(stateRenderer, /applyComposerInputState\(room, shellPage, compactChatShell, composerAvailability\)/);
  assert.match(stateRenderer, /renderComposerDependentSurfaces\(room\)/);
  assert.doesNotMatch(stateRenderer, /composerInputEl\.placeholder = placeholder/);
  assert.doesNotMatch(stateRenderer, /renderComposerHero\(room\)/);
});

test("composer hero model is delegated out of renderComposerHero", async () => {
  const source = await readShellModule("app.js");
  const roomRenderSource = await readShellModule("shell-room-render.js");
  const composerMod = await readShellModule("shell-composer.js");

  // app.js 不再内联 renderComposerHero，委托 shell-composer.js
  assert.doesNotMatch(source, /function renderComposerHero\b/);
  assert.match(source, /renderComposerHero,/);
  assert.match(source, /initShellComposer\(/);

  // 模型在 shell-room-render.js，渲染在 shell-composer.js
  assert.match(roomRenderSource, /export function composerHeroModelForState/);
  assert.match(composerMod, /export function renderComposerHero\(room\)/);
  assert.match(composerMod, /composerHeroModelForState\(\{/);
  assert.match(composerMod, /composerHeroEl\.dataset\.variant = model\.variant/);
  assert.match(composerMod, /kicker\.textContent = model\.kicker/);
  assert.match(composerMod, /title\.textContent = model\.title/);
  assert.match(composerMod, /note\.textContent = model\.note/);
  assert.match(composerMod, /for \(const chip of model\.chips\)/);
});

test("composer context model and DOM are delegated out of updateComposerContext", async () => {
  const source = await readShellModule("app.js");
  const roomRenderSource = await readShellModule("shell-room-render.js");
  const composerMod = await readShellModule("shell-composer.js");

  // app.js 不再内联 updateComposerContext，委托 shell-composer.js
  assert.doesNotMatch(source, /function updateComposerContext\b/);
  assert.doesNotMatch(source, /function composerContextItems\b/);
  assert.match(source, /updateComposerContext,/);
  assert.match(source, /initShellComposer\(/);

  // 模型在 shell-room-render.js，渲染在 shell-composer.js
  assert.match(roomRenderSource, /export function composerContextItemsForState/);
  assert.match(composerMod, /export function updateComposerContext\(room\)/);
  assert.match(composerMod, /composerContextItemsForState\(\{/);
  assert.match(composerMod, /threadHeadline: room \? _ctx\.roomThreadHeadline\(room\) : ""/);
  assert.match(composerMod, /visiblePendingEchoCount: room \? _ctx\.visiblePendingEchoCount\(room\) : 0/);
  assert.match(composerMod, /sendError: room \? _ctx\.roomSendErrors\[room\.id\] : ""/);
  assert.match(composerMod, /composer-context-item/);
  assert.match(composerMod, /createLine\("composer-context-label", item\.label\)/);
  assert.match(composerMod, /value\.textContent = item\.value/);
});

test("gateway errors read transport Error message and localize common send failures", async () => {
  const source = await readShellModule("app.js");
  const errorSource = await readShellModule("shell-errors.js");

  assert.match(source, /from "\.\/shell-errors\.js"/);
  assert.match(source, /const message = gatewayErrorMessage\(parsed, text, response\.status\);/);
  assert.match(errorSource, /export function gatewayErrorMessage\(parsed, text, status\) \{/);
  assert.match(errorSource, /parsed\?\.Error\?\.message/);
  assert.match(errorSource, /message === "login required before sending messages"[\s\S]*return "请先登录后发送"/);
  assert.match(errorSource, /message === "message text required"[\s\S]*return "请输入内容后发送"/);
});

test("gateway polling and unhandled rejections report runtime failures", async () => {
  const source = await readShellModule("app.js");

  assert.match(source, /setInterval\(async \(\) => \{\s*try \{\s*await refreshFromGateway\(\);/);
  assert.match(source, /function registerUnhandledRuntimeReporter\(\) \{/);
  assert.match(source, /window\.addEventListener\("unhandledrejection"/);
  assert.match(source, /localizedRuntimeError\(event\.reason, "前端运行异常"\)/);
});

test("gateway realtime lifecycle is delegated out of startGatewayRealtime", async () => {
  const source = await readShellModule("app.js");
  const supportHelper = sliceBetween(
    source,
    "function gatewayRealtimeSupported() {",
    "function openGatewayShellEventSource(afterVersion) {",
  );
  const opener = sliceBetween(
    source,
    "function openGatewayShellEventSource(afterVersion) {",
    "function gatewayRealtimeStateVersion(payload) {",
  );
  const versionResolver = sliceBetween(
    source,
    "function gatewayRealtimeStateVersion(payload) {",
    "async function handleGatewayRealtimeShellStateEvent(event) {",
  );
  const shellStateHandler = sliceBetween(
    source,
    "async function handleGatewayRealtimeShellStateEvent(event) {",
    "function handleGatewayRealtimeError(hasReceivedSnapshot) {",
  );
  const errorHandler = sliceBetween(
    source,
    "function handleGatewayRealtimeError(hasReceivedSnapshot) {",
    "function startGatewayRealtime({ afterVersion = lastShellStateVersion } = {}) {",
  );
  const starter = sliceBetween(
    source,
    "function startGatewayRealtime({ afterVersion = lastShellStateVersion } = {}) {",
    "async function refreshOnForeground(reason = \"foreground\") {",
  );

  assert.match(supportHelper, /return Boolean\(gatewayUrl && typeof EventSource === "function"\)/);
  assert.match(opener, /new EventSource\(gatewayShellEventsUrl\(\{ afterVersion \}\)\)/);
  assert.match(opener, /shellEventSource = eventSource/);
  assert.match(versionResolver, /typeof payload\?\.state_version === "string"/);
  assert.match(shellStateHandler, /JSON\.parse\(event\.data \|\| "\{\}"\)/);
  assert.match(shellStateHandler, /const incomingStateVersion = gatewayRealtimeStateVersion\(payload\)/);
  assert.match(shellStateHandler, /applyGatewayShellStatePayload\(payload, \{ persist: true \}\)/);
  assert.match(shellStateHandler, /scheduleGatewayRealtimeRestart\(incomingStateVersion\)/);
  assert.match(errorHandler, /if \(!hasReceivedSnapshot\) \{/);
  assert.match(errorHandler, /void refreshFromGateway\(\)/);
  assert.match(errorHandler, /startGatewayPolling\(\)/);
  assert.match(starter, /if \(!gatewayRealtimeSupported\(\)\) \{/);
  assert.match(starter, /const eventSource = openGatewayShellEventSource\(afterVersion\)/);
  assert.match(starter, /hasReceivedSnapshot = \(await handleGatewayRealtimeShellStateEvent\(event\)\) \|\| hasReceivedSnapshot/);
  assert.match(starter, /eventSource\.onerror = \(\) => handleGatewayRealtimeError\(hasReceivedSnapshot\)/);
  assert.doesNotMatch(starter, /JSON\.parse\(event\.data/);
  assert.doesNotMatch(starter, /applyGatewayShellStatePayload\(payload/);
});

test("qa identity query can isolate same-origin browser tabs", async () => {
  const source = await readShellModule("app.js");

  assert.match(source, /const queryIdentity = new URLSearchParams\(window\.location\.search\)\.get\("identity"\)\?\.trim\(\);/);
  assert.match(source, /if \(queryIdentity\) \{\s*senderIdentity = queryIdentity;\s*\} else \{/);
});

test("app shell reuses identity helper module instead of local duplicates", async () => {
  const source = await readShellModule("app.js");

  assert.match(source, /from "\.\/shell-identity\.js";/);
  assert.doesNotMatch(source, /function isVisitorIdentity\(/);
  assert.doesNotMatch(source, /function residentScopedShellStatePage\(/);
  assert.doesNotMatch(source, /function translateClientDisplayName\(/);
  assert.doesNotMatch(source, /function translateRoutePrefix\(/);
});

test("app shell reuses export utility module instead of local duplicates", async () => {
  const source = await readShellModule("app.js");

  assert.match(source, /from "\.\/shell-export-utils\.js";/);
  assert.doesNotMatch(source, /function exportFileExtension\(/);
  assert.doesNotMatch(source, /function exportMimeType\(/);
  assert.doesNotMatch(source, /function downloadContent\(/);
});

test("chat-scene pages do not collapse avatars through message grouping", async () => {
  const source = await readShellModule("app.js");
  const messageRenderSource = await readShellModule("shell-message-render.js");

  assert.match(source, /timelineMessageFlowSpec\(\{/);
  assert.match(source, /timelineMessageRowSpec\(\{/);
  assert.match(source, /allowMessageGrouping,\s*staggerBase,\s*staggerCap,/);
  assert.match(source, /if \(rowSpec\.grouped\) \{\s*row\.setAttribute\("data-grouped", "true"\);/);
  assert.match(messageRenderSource, /allowMessageGrouping: shellPage !== "hub" && shellPage !== "user",/);
});

test("chat-scene pages do not insert unread divider copy into the scene", async () => {
  const source = await readShellModule("app.js");
  const messageRenderSource = await readShellModule("shell-message-render.js");

  assert.match(source, /timelineMessageFlowSpec\(\{/);
  assert.match(source, /timelineFlowSpecForRoom\(room, localPreviewMessages, shellPage, unread\)/);
  assert.match(source, /unread,\s*shellPage,/);
  assert.match(messageRenderSource, /const allowUnreadDivider = shellPage !== "hub" && shellPage !== "user";/);
  assert.match(messageRenderSource, /const unreadForDivider = allowUnreadDivider \? unread : 0;/);
});

test("timeline no-room empty card DOM is delegated out of renderTimeline", async () => {
  const source = await readShellModule("app.js");
  const emptyRenderer = sliceBetween(
    source,
    "function createTimelineEmptyStateNode(cardSpec) {",
    "function renderTimelineNoRoomState(shellPage) {",
  );
  const noRoomRenderer = sliceBetween(
    source,
    "function renderTimelineNoRoomState(shellPage) {",
    "function renderTimeline() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderTimeline() {",
    "  const unread = unreadCount(room);",
  );

  assert.match(emptyRenderer, /document\.createElement\("div"\)/);
  assert.match(emptyRenderer, /emptyTitle\.textContent = cardSpec\.titleText/);
  assert.match(emptyRenderer, /emptyCopy\.textContent = cardSpec\.copyText/);
  assert.match(emptyRenderer, /emptyAction\.textContent = cardSpec\.actionText/);
  assert.match(noRoomRenderer, /timelineNoRoomEmptyStateSpec\(\{ gatewayUrl, shellPage \}\)/);
  assert.match(noRoomRenderer, /renderConversationMetaChips\(null, emptyStateSpec\.metaChips\)/);
  assert.match(noRoomRenderer, /renderThreadStatusRail\(null\)/);
  assert.match(noRoomRenderer, /const empty = createTimelineEmptyStateNode\(emptyStateSpec\.card\)/);
  assert.match(noRoomRenderer, /timelineEl\.appendChild\(empty\)/);
  assert.match(renderSource, /renderTimelineNoRoomState\(shellPage\)/);
  assert.doesNotMatch(renderSource, /emptyTitle\.className/);
  assert.doesNotMatch(renderSource, /emptyCopy\.className/);
  assert.doesNotMatch(renderSource, /emptyAction\.className/);
  assert.doesNotMatch(renderSource, /createTimelineEmptyStateNode\(emptyStateSpec\.card\)/);
});

test("timeline typing indicator DOM is delegated out of renderTimeline", async () => {
  const source = await readShellModule("app.js");
  const typingRenderer = sliceBetween(
    source,
    "function createTimelineTypingIndicatorNode(typingSpec) {",
    "function appendTimelineTypingIndicator(flowSpec) {",
  );
  const typingAppender = sliceBetween(
    source,
    "function appendTimelineTypingIndicator(flowSpec) {",
    "function finishTimelineRender(room, flowSpec, wasNearBottom) {",
  );
  const finishRenderer = sliceBetween(
    source,
    "function finishTimelineRender(room, flowSpec, wasNearBottom) {",
    "function renderTimeline() {",
  );
  const renderSource = sliceBetween(source, "function renderTimeline() {", "function renderGovernanceOfflineState() {");

  assert.match(typingRenderer, /document\.createElement\("div"\)/);
  assert.match(typingRenderer, /dotsEl\.className = typingSpec\.dotsClassName/);
  assert.match(typingRenderer, /for \(let i = 0; i < typingSpec\.dotCount; i\+\+\) \{/);
  assert.match(typingRenderer, /label\.textContent = typingSpec\.labelText/);
  assert.match(typingAppender, /const typingSpec = timelineTypingIndicatorSpec\(flowSpec\.pending\)/);
  assert.match(typingAppender, /const typingEl = createTimelineTypingIndicatorNode\(typingSpec\)/);
  assert.match(typingAppender, /timelineEl\.appendChild\(typingEl\)/);
  assert.match(finishRenderer, /appendTimelineTypingIndicator\(flowSpec\)/);
  assert.doesNotMatch(renderSource, /createTimelineTypingIndicatorNode\(typingSpec\)/);
  assert.doesNotMatch(renderSource, /dotsEl\.appendChild\(dot\)/);
  assert.doesNotMatch(renderSource, /label\.textContent = typingSpec\.labelText/);
});

test("timeline metadata and flow setup are delegated out of renderTimeline", async () => {
  const source = await readShellModule("app.js");
  const metaRenderer = sliceBetween(
    source,
    "function timelineMetaChipsForRoom(room, shellPage, unread, pendingCount) {",
    "function renderTimelineSkeletonIfNeeded(room, localPreviewMessages, shellPage) {",
  );
  const skeletonRenderer = sliceBetween(
    source,
    "function renderTimelineSkeletonIfNeeded(room, localPreviewMessages, shellPage) {",
    "function timelineFlowSpecForRoom(room, localPreviewMessages, shellPage, unread) {",
  );
  const flowRenderer = sliceBetween(
    source,
    "function timelineFlowSpecForRoom(room, localPreviewMessages, shellPage, unread) {",
    "function appendTimelineTypingIndicator(flowSpec) {",
  );
  const renderSource = sliceBetween(source, "function renderTimeline() {", "function renderGovernanceOfflineState() {");

  assert.match(metaRenderer, /timelineMetaChips\(\{/);
  assert.match(metaRenderer, /pendingCount,/);
  assert.match(skeletonRenderer, /shouldRenderTimelineSkeletonRowsForContext\(\{/);
  assert.match(skeletonRenderer, /renderTimelineSkeletonRows\(4\)/);
  assert.match(flowRenderer, /timelineMessageFlowSpec\(\{/);
  assert.match(flowRenderer, /pendingMessages: visiblePendingEchoesForRoom\(room\)/);
  assert.match(renderSource, /timelineMetaChipsForRoom\(room, shellPage, unread, pendingCount\)/);
  assert.match(renderSource, /renderTimelineSkeletonIfNeeded\(room, localPreviewMessages, shellPage\)/);
  assert.match(renderSource, /timelineFlowSpecForRoom\(room, localPreviewMessages, shellPage, unread\)/);
  assert.match(renderSource, /finishTimelineRender\(room, flowSpec, wasNearBottom\)/);
  assert.doesNotMatch(renderSource, /timelineMetaChips\(\{/);
  assert.doesNotMatch(renderSource, /shouldRenderTimelineSkeletonRowsForContext\(\{/);
});

test("timeline committed message row frame and header are delegated out of createTimelineMessageRowNode", async () => {
  const source = await readShellModule("app.js");
  const frameRenderer = sliceBetween(
    source,
    "function createTimelineMessageRowFrameNode(rowSpec) {",
    "function createTimelineMessageAvatarNode(message, room, rowSpec) {",
  );
  const avatarRenderer = sliceBetween(
    source,
    "function createTimelineMessageAvatarNode(message, room, rowSpec) {",
    "function createTimelineMessageQuickContext(room, message) {",
  );
  const metaRenderer = sliceBetween(
    source,
    "function createTimelineMessageMetaNode(message, room, rowSpec, quickContext) {",
    "function createTimelineMessageTimestampNode(message) {",
  );
  const headerRenderer = sliceBetween(
    source,
    "function createTimelineMessageHeaderNode(message, room, rowSpec, quickContext) {",
    "function createTimelineReplyPreviewNode(message, messages) {",
  );
  const rowRenderer = sliceBetween(
    source,
    "function createTimelineMessageRowNode({",
    "function appendTimelineCommittedMessageRows(room, messages, flowSpec) {",
  );

  assert.match(frameRenderer, /row\.className = rowSpec\.className/);
  assert.match(frameRenderer, /Object\.assign\(row\.dataset, rowSpec\.dataset\)/);
  assert.match(frameRenderer, /row\.setAttribute\("data-grouped", "true"\)/);
  assert.match(frameRenderer, /row\.setAttribute\("style", rowSpec\.style\)/);
  assert.match(avatarRenderer, /messageAvatarTone\(message, room, isSelf\)/);
  assert.match(avatarRenderer, /badgeToken\(/);
  assert.match(avatarRenderer, /applyAvatarStyle\(avatar, message\.sender\)/);
  assert.match(metaRenderer, /messageRoleLabel\(message, room, isSelf\)/);
  assert.match(metaRenderer, /appendTimelineMessageQuickChips\(meta, message, quickContext\)/);
  assert.match(headerRenderer, /createTimelineMessageMetaNode\(message, room, rowSpec, quickContext\)/);
  assert.match(headerRenderer, /createTimelineMessageTimestampNode\(message\)/);
  assert.match(rowRenderer, /createTimelineMessageRowFrameNode\(rowSpec\)/);
  assert.match(rowRenderer, /createTimelineMessageAvatarNode\(message, room, rowSpec\)/);
  assert.doesNotMatch(rowRenderer, /messageAvatarTone\(message, room, isSelf\)/);
  assert.doesNotMatch(rowRenderer, /messageRoleLabel\(message, room, isSelf\)/);
});

test("timeline committed message article body is delegated out of createTimelineMessageRowNode", async () => {
  const source = await readShellModule("app.js");
  const replyRenderer = sliceBetween(
    source,
    "function createTimelineReplyPreviewNode(message, messages) {",
    "function createTimelineMessageArticleNode(message, room, messages, rowSpec, quickContext) {",
  );
  const articleRenderer = sliceBetween(
    source,
    "function createTimelineMessageArticleNode(message, room, messages, rowSpec, quickContext) {",
    "function createTimelineMessageStackNode(article) {",
  );
  const stackRenderer = sliceBetween(
    source,
    "function createTimelineMessageStackNode(article) {",
    "function createTimelineMessageRowNode({",
  );
  const rowRenderer = sliceBetween(
    source,
    "function createTimelineMessageRowNode({",
    "function appendTimelineCommittedMessageRows(room, messages, flowSpec) {",
  );

  assert.match(replyRenderer, /buildReplyPreview\(message, messages\)/);
  assert.match(replyRenderer, /replyEl\.className = "message-reply-preview"/);
  assert.match(articleRenderer, /article\.dataset\.messageKind = messageKind/);
  assert.match(articleRenderer, /createTimelineMessageHeaderNode\(message, room, rowSpec, quickContext\)/);
  assert.match(articleRenderer, /createTimelineReplyPreviewNode\(message, messages\)/);
  assert.match(articleRenderer, /createMessageBodyNode\(message, \{\s*quickState: quickContext\.quickState,/);
  assert.match(articleRenderer, /createMessageOwnerActions\(room, message, \{ isSelf, messageKind \}\)/);
  assert.match(stackRenderer, /stack\.className = "message-stack"/);
  assert.match(stackRenderer, /stack\.appendChild\(article\)/);
  assert.match(rowRenderer, /createTimelineMessageQuickContext\(room, message\)/);
  assert.match(rowRenderer, /createTimelineMessageArticleNode\(message, room, messages, rowSpec, quickContext\)/);
  assert.match(rowRenderer, /createTimelineMessageStackNode\(article\)/);
  assert.doesNotMatch(rowRenderer, /document\.createElement\("article"\)/);
  assert.doesNotMatch(rowRenderer, /createMessageBodyNode\(message/);
  assert.doesNotMatch(rowRenderer, /buildReplyPreview\(message, messages\)/);
});

test("timeline committed message row DOM is delegated out of renderTimeline", async () => {
  const source = await readShellModule("app.js");
  const messageRenderSource = await readShellModule("shell-message-render.js");
  const messageRowRenderer = sliceBetween(
    source,
    "function createTimelineMessageRowNode({",
    "function createTimelineDividerNode(dividerSpec) {",
  );
  const dividerRenderer = sliceBetween(
    source,
    "function createTimelineDividerNode(dividerSpec) {",
    "function renderTimelineNoRoomState(shellPage) {",
  );
  const committedRowsRenderer = sliceBetween(
    source,
    "function appendTimelineCommittedMessageRows(room, messages, flowSpec) {",
    "function appendTimelinePendingMessageRows(room, pending) {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderTimeline() {",
    "function renderGovernanceOfflineState() {",
  );

  assert.match(messageRowRenderer, /timelineMessageRowSpec\(\{/);
  assert.match(messageRowRenderer, /createTimelineMessageRowFrameNode\(rowSpec\)/);
  assert.match(messageRowRenderer, /createTimelineMessageAvatarNode\(message, room, rowSpec\)/);
  assert.match(messageRowRenderer, /createTimelineMessageArticleNode\(message, room, messages, rowSpec, quickContext\)/);
  assert.match(messageRowRenderer, /createTimelineMessageStackNode\(article\)/);
  assert.match(messageRowRenderer, /return row/);
  assert.match(source, /timelineCommittedMessageRenderItems/);
  assert.match(messageRenderSource, /export function timelineCommittedMessageRenderItems/);
  assert.match(dividerRenderer, /divider\.className = dividerSpec\.className/);
  assert.match(dividerRenderer, /divider\.textContent = dividerSpec\.text/);
  assert.match(committedRowsRenderer, /timelineCommittedMessageRenderItems\(\{\s*messages,\s*flowSpec,/);
  assert.match(committedRowsRenderer, /if \(item\.type === "divider"\)/);
  assert.match(committedRowsRenderer, /timelineEl\.appendChild\(createTimelineDividerNode\(item\.divider\)\)/);
  assert.match(committedRowsRenderer, /createTimelineMessageRowNode\(\{\s*room,\s*\.\.\.item\.rowInput,/);
  assert.match(committedRowsRenderer, /timelineEl\.appendChild\(row\)/);
  assert.match(renderSource, /const flowSpec = timelineFlowSpecForRoom\(room, localPreviewMessages, shellPage, unread\)/);
  assert.match(renderSource, /appendTimelineMessageFlowRows\(room, flowSpec\)/);
  assert.doesNotMatch(messageRowRenderer, /createMessageBodyNode\(message/);
  assert.doesNotMatch(messageRowRenderer, /createMessageOwnerActions\(room, message/);
  assert.doesNotMatch(source, /timelineDividerSpecsForMessage/);
  assert.doesNotMatch(committedRowsRenderer, /for \(const \[index, message\] of messages\.entries\(\)\)/);
  assert.doesNotMatch(committedRowsRenderer, /unreadForDivider|allowMessageGrouping|staggerBase|staggerCap/);
  assert.doesNotMatch(renderSource, /for \(const \[index, message\] of messages\.entries\(\)\)/);
  assert.doesNotMatch(renderSource, /timelineMessageFlowSpec\(\{/);
  assert.doesNotMatch(renderSource, /message-avatar-/);
  assert.doesNotMatch(renderSource, /createMessageBodyNode\(message/);
  assert.doesNotMatch(renderSource, /createMessageOwnerActions\(room, message/);
});

test("timeline pending message row frame and header are delegated out of createTimelinePendingMessageRowNode", async () => {
  const source = await readShellModule("app.js");
  const frameRenderer = sliceBetween(
    source,
    "function createTimelinePendingMessageRowFrameNode(rowSpec) {",
    "function createTimelinePendingMessageAvatarNode(rowSpec) {",
  );
  const avatarRenderer = sliceBetween(
    source,
    "function createTimelinePendingMessageAvatarNode(rowSpec) {",
    "function createTimelinePendingMessageMetaNode(rowSpec, message, quickContext) {",
  );
  const metaRenderer = sliceBetween(
    source,
    "function createTimelinePendingMessageMetaNode(rowSpec, message, quickContext) {",
    "function createTimelinePendingMessageHeaderNode(rowSpec, message, quickContext) {",
  );
  const headerRenderer = sliceBetween(
    source,
    "function createTimelinePendingMessageHeaderNode(rowSpec, message, quickContext) {",
    "function createTimelinePendingRetryActionsNode(room, message, rowSpec) {",
  );
  const rowRenderer = sliceBetween(
    source,
    "function createTimelinePendingMessageRowNode(room, message) {",
    "function createTimelineMessageRowFrameNode(rowSpec) {",
  );

  assert.match(frameRenderer, /row\.className = rowSpec\.rowClassName/);
  assert.match(frameRenderer, /Object\.assign\(row\.dataset, rowSpec\.rowDataset\)/);
  assert.match(avatarRenderer, /avatar\.className = rowSpec\.avatarClassName/);
  assert.match(avatarRenderer, /avatar\.textContent = rowSpec\.avatarText/);
  assert.match(avatarRenderer, /applyAvatarStyle\(avatar, currentIdentity\(\)\)/);
  assert.match(metaRenderer, /sender\.textContent = rowSpec\.senderText/);
  assert.match(metaRenderer, /role\.textContent = rowSpec\.roleText/);
  assert.match(metaRenderer, /appendTimelineMessageQuickChips\(meta, message, quickContext\)/);
  assert.match(headerRenderer, /createTimelinePendingMessageMetaNode\(rowSpec, message, quickContext\)/);
  assert.match(headerRenderer, /timestamp\.textContent = rowSpec\.timestampText/);
  assert.match(rowRenderer, /createTimelinePendingMessageRowFrameNode\(rowSpec\)/);
  assert.match(rowRenderer, /createTimelinePendingMessageAvatarNode\(rowSpec\)/);
  assert.doesNotMatch(rowRenderer, /avatar\.className = rowSpec\.avatarClassName/);
  assert.doesNotMatch(rowRenderer, /sender\.textContent = rowSpec\.senderText/);
});

test("timeline pending message article and retry controls are delegated out of createTimelinePendingMessageRowNode", async () => {
  const source = await readShellModule("app.js");
  const retryRenderer = sliceBetween(
    source,
    "function createTimelinePendingRetryActionsNode(room, message, rowSpec) {",
    "function createTimelinePendingMessageArticleNode(room, message, rowSpec, quickContext) {",
  );
  const articleRenderer = sliceBetween(
    source,
    "function createTimelinePendingMessageArticleNode(room, message, rowSpec, quickContext) {",
    "function createTimelinePendingMessageRowNode(room, message) {",
  );
  const rowRenderer = sliceBetween(
    source,
    "function createTimelinePendingMessageRowNode(room, message) {",
    "function createTimelineMessageRowFrameNode(rowSpec) {",
  );

  assert.match(retryRenderer, /if \(!rowSpec\.showRetry\) return null/);
  assert.match(retryRenderer, /retryButton\.dataset\.pendingAction = "retry"/);
  assert.match(retryRenderer, /retryButton\.disabled = true/);
  assert.match(retryRenderer, /retryPendingEcho\(room\.id, message\.id\)/);
  assert.match(articleRenderer, /article\.className = rowSpec\.articleClassName/);
  assert.match(articleRenderer, /Object\.assign\(article\.dataset, rowSpec\.articleDataset\)/);
  assert.match(articleRenderer, /createTimelinePendingMessageHeaderNode\(rowSpec, message, quickContext\)/);
  assert.match(articleRenderer, /createMessageBodyNode\(message, \{\s*quickState: quickContext\.quickState,/);
  assert.match(articleRenderer, /createTimelinePendingRetryActionsNode\(room, message, rowSpec\)/);
  assert.match(rowRenderer, /createTimelineMessageQuickContext\(room, message\)/);
  assert.match(rowRenderer, /createTimelinePendingMessageArticleNode\(room, message, rowSpec, quickContext\)/);
  assert.match(rowRenderer, /createTimelineMessageStackNode\(article\)/);
  assert.doesNotMatch(rowRenderer, /document\.createElement\("article"\)/);
  assert.doesNotMatch(rowRenderer, /createMessageBodyNode\(message/);
  assert.doesNotMatch(rowRenderer, /retryButton\.dataset\.pendingAction/);
});

test("timeline pending message row DOM is delegated out of renderTimeline", async () => {
  const source = await readShellModule("app.js");
  const pendingRenderer = sliceBetween(
    source,
    "function createTimelinePendingMessageRowNode(room, message) {",
    "function createTimelineMessageRowFrameNode(rowSpec) {",
  );
  const pendingRowsRenderer = sliceBetween(
    source,
    "function appendTimelinePendingMessageRows(room, pending) {",
    "function appendTimelineMessageFlowRows(room, flowSpec) {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderTimeline() {",
    "function renderGovernanceOfflineState() {",
  );

  assert.match(pendingRenderer, /timelinePendingMessageRowSpec\(\{/);
  assert.match(pendingRenderer, /createTimelinePendingMessageRowFrameNode\(rowSpec\)/);
  assert.match(pendingRenderer, /createTimelinePendingMessageAvatarNode\(rowSpec\)/);
  assert.match(pendingRenderer, /createTimelinePendingMessageArticleNode\(room, message, rowSpec, quickContext\)/);
  assert.match(pendingRenderer, /createTimelineMessageStackNode\(article\)/);
  assert.match(pendingRowsRenderer, /for \(const message of pending\) \{/);
  assert.match(pendingRowsRenderer, /const pendingRow = createTimelinePendingMessageRowNode\(room, message\)/);
  assert.match(pendingRowsRenderer, /timelineEl\.appendChild\(pendingRow\)/);
  assert.match(renderSource, /const flowSpec = timelineFlowSpecForRoom\(room, localPreviewMessages, shellPage, unread\)/);
  assert.match(renderSource, /appendTimelineMessageFlowRows\(room, flowSpec\)/);
  assert.doesNotMatch(pendingRenderer, /createMessageBodyNode\(message/);
  assert.doesNotMatch(pendingRenderer, /retryButton\.dataset\.pendingAction/);
  assert.doesNotMatch(renderSource, /for \(const message of pending\) \{/);
  assert.doesNotMatch(renderSource, /timelineMessageFlowSpec\(\{/);
  assert.doesNotMatch(renderSource, /retryButton\.dataset\.pendingAction/);
  assert.doesNotMatch(renderSource, /timelinePendingMessageRowSpec\(\{/);
});

test("world safety empty and mirror cards are delegated out of renderWorldSafety", async () => {
  const source = await readShellModule("app.js");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const emptyRenderer = sliceBetween(
    source,
    "function renderWorldSafetyEmptyState() {",
    "function createWorldSafetyMirrorCard(model) {",
  );
  const mirrorRenderer = sliceBetween(
    source,
    "function createWorldSafetyMirrorCard(model) {",
    "function createWorldSafetyAdvisoryCard(model) {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderWorldSafety() {",
    "function renderResidents() {",
  );

  assert.match(source, /worldSafetyEmptyStateText/);
  assert.match(source, /worldSafetyMirrorCardModel/);
  assert.match(governanceRenderSource, /export function worldSafetyEmptyStateText/);
  assert.match(governanceRenderSource, /export function worldSafetyMirrorCardModel/);
  assert.match(emptyRenderer, /empty\.textContent = worldSafetyEmptyStateText\(\{ gatewayUrl \}\)/);
  assert.match(emptyRenderer, /worldSafetyListEl\.appendChild\(empty\)/);
  assert.match(mirrorRenderer, /li\.className = model\.className/);
  assert.match(mirrorRenderer, /createLine\("city-name", model\.title\)/);
  assert.match(mirrorRenderer, /createLine\("city-sub", model\.mirrors\)/);
  assert.match(mirrorRenderer, /createLine\("city-role", model\.stewards\)/);
  assert.match(renderSource, /if \(!safety\) \{\s*renderWorldSafetyEmptyState\(\);\s*return;\s*\}/);
  assert.match(renderSource, /worldSafetyListEl\.appendChild\(createWorldSafetyMirrorCard\(worldSafetyMirrorCardModel\(safety\)\)\)/);
  assert.doesNotMatch(mirrorRenderer, /translateTrustState\(mirror\.trust_state\)/);
  assert.doesNotMatch(mirrorRenderer, /safety\.mirrors/);
  assert.doesNotMatch(renderSource, /镜像城市/);
  assert.doesNotMatch(renderSource, /世界安全动态暂不可用/);
});

test("world safety advisory and summary cards are delegated out of renderWorldSafety", async () => {
  const source = await readShellModule("app.js");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const advisoryRenderer = sliceBetween(
    source,
    "function createWorldSafetyAdvisoryCard(model) {",
    "function appendWorldSafetyAdvisoryCards(safety) {",
  );
  const advisoryAppender = sliceBetween(
    source,
    "function appendWorldSafetyAdvisoryCards(safety) {",
    "function createWorldSafetySanctionSummaryCard(model) {",
  );
  const sanctionSummaryRenderer = sliceBetween(
    source,
    "function createWorldSafetySanctionSummaryCard(model) {",
    "function createWorldSafetyReportSummaryCard(model) {",
  );
  const reportSummaryRenderer = sliceBetween(
    source,
    "function createWorldSafetyReportSummaryCard(model) {",
    "function createWorldSafetySanctionCard(model) {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderWorldSafety() {",
    "function renderResidents() {",
  );

  assert.match(source, /worldSafetyAdvisoryCardModel/);
  assert.match(source, /worldSafetyAdvisoryEmptyStateText/);
  assert.match(source, /worldSafetySanctionSummaryCardModel/);
  assert.match(source, /worldSafetyReportSummaryCardModel/);
  assert.match(governanceRenderSource, /export function worldSafetyAdvisoryCardModel/);
  assert.match(governanceRenderSource, /export function worldSafetyAdvisoryEmptyStateText/);
  assert.match(governanceRenderSource, /export function worldSafetySanctionSummaryCardModel/);
  assert.match(governanceRenderSource, /export function worldSafetyReportSummaryCardModel/);
  assert.match(advisoryRenderer, /li\.className = model\.className/);
  assert.match(advisoryRenderer, /titleRow\.className = model\.titleRowClassName/);
  assert.match(advisoryRenderer, /createLine\("city-name", model\.title\)/);
  assert.match(advisoryRenderer, /createLine\("city-slug", model\.action\)/);
  assert.match(advisoryRenderer, /createLine\("city-sub", model\.reason\)/);
  assert.match(advisoryRenderer, /createLine\("city-role", model\.meta\)/);
  assert.match(advisoryAppender, /const activeAdvisories = safety\.advisories \|\| \[\]/);
  assert.match(advisoryAppender, /empty\.textContent = worldSafetyAdvisoryEmptyStateText\(\)/);
  assert.match(advisoryAppender, /createWorldSafetyAdvisoryCard\(worldSafetyAdvisoryCardModel\(advisory\)\)/);
  assert.match(sanctionSummaryRenderer, /li\.className = model\.className/);
  assert.match(sanctionSummaryRenderer, /createLine\("city-name", model\.title\)/);
  assert.match(sanctionSummaryRenderer, /createLine\("city-sub", model\.summary\)/);
  assert.match(sanctionSummaryRenderer, /createLine\("city-role", model\.meta\)/);
  assert.match(reportSummaryRenderer, /li\.className = model\.className/);
  assert.match(reportSummaryRenderer, /createLine\("city-name", model\.title\)/);
  assert.match(reportSummaryRenderer, /createLine\("city-sub", model\.summary\)/);
  assert.match(reportSummaryRenderer, /createLine\("city-role", model\.meta\)/);
  assert.match(renderSource, /appendWorldSafetyAdvisoryCards\(safety\)/);
  assert.match(renderSource, /worldSafetyListEl\.appendChild\(\s*createWorldSafetySanctionSummaryCard\(\s*worldSafetySanctionSummaryCardModel\(residentSanctions, blacklistEntries\),\s*\),\s*\)/);
  assert.match(renderSource, /worldSafetyListEl\.appendChild\(\s*createWorldSafetyReportSummaryCard\(worldSafetyReportSummaryCardModel\(reports\)\),\s*\)/);
  assert.doesNotMatch(advisoryRenderer, /translateAdvisoryAction\(advisory\.action\)/);
  assert.doesNotMatch(advisoryRenderer, /translateSubjectKind\(advisory\.subject_kind\)/);
  assert.doesNotMatch(advisoryRenderer, /formatDateTime\(advisory\.issued_at_ms\)/);
  assert.doesNotMatch(sanctionSummaryRenderer, /translateReportStatus\(item\.status\)|residentSanctions\.length|blacklistEntries\.length/);
  assert.doesNotMatch(reportSummaryRenderer, /translateTargetKind\(item\.target_kind\)|translateReportStatus\(item\.status\)|formatDateTime\(reports\[0\]\.reported_at_ms\)/);
  assert.doesNotMatch(renderSource, /当前没有生效中的世界安全通告/);
  assert.doesNotMatch(renderSource, /居民制裁 \$\{residentSanctions\.length\}/);
});

test("world safety sanction and report detail cards are delegated out of renderWorldSafety", async () => {
  const source = await readShellModule("app.js");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const sanctionRenderer = sliceBetween(
    source,
    "function createWorldSafetySanctionCard(model) {",
    "function createWorldSafetyReportCard(model) {",
  );
  const reportRenderer = sliceBetween(
    source,
    "function createWorldSafetyReportCard(model) {",
    "function appendWorldSafetySanctionCards(residentSanctions) {",
  );
  const sanctionAppender = sliceBetween(
    source,
    "function appendWorldSafetySanctionCards(residentSanctions) {",
    "function appendWorldSafetyReportCards(reports) {",
  );
  const reportAppender = sliceBetween(
    source,
    "function appendWorldSafetyReportCards(reports) {",
    "function renderWorldSafety() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderWorldSafety() {",
    "function renderResidents() {",
  );

  assert.match(source, /worldSafetySanctionCardModel/);
  assert.match(source, /worldSafetyReportCardModel/);
  assert.match(governanceRenderSource, /export function worldSafetySanctionCardModel/);
  assert.match(governanceRenderSource, /export function worldSafetyReportCardModel/);
  assert.match(sanctionRenderer, /li\.className = model\.className/);
  assert.match(sanctionRenderer, /titleRow\.className = model\.titleRowClassName/);
  assert.match(sanctionRenderer, /createLine\("city-name", model\.title\)/);
  assert.match(sanctionRenderer, /createLine\("city-slug", model\.status\)/);
  assert.match(sanctionRenderer, /createLine\("city-sub", model\.reason\)/);
  assert.match(sanctionRenderer, /createLine\("city-role", model\.meta\)/);
  assert.match(reportRenderer, /li\.className = model\.className/);
  assert.match(reportRenderer, /titleRow\.className = model\.titleRowClassName/);
  assert.match(reportRenderer, /createLine\("city-name", model\.title\)/);
  assert.match(reportRenderer, /createLine\("city-slug", model\.status\)/);
  assert.match(reportRenderer, /createLine\("city-sub", model\.summary\)/);
  assert.match(reportRenderer, /createLine\("city-role", model\.meta\)/);
  assert.match(sanctionAppender, /for \(const sanction of residentSanctions\.slice\(0, 6\)\) \{/);
  assert.match(sanctionAppender, /createWorldSafetySanctionCard\(worldSafetySanctionCardModel\(sanction\)\)/);
  assert.match(reportAppender, /for \(const report of reports\.slice\(0, 6\)\) \{/);
  assert.match(reportAppender, /createWorldSafetyReportCard\(worldSafetyReportCardModel\(report\)\)/);
  assert.match(renderSource, /appendWorldSafetySanctionCards\(residentSanctions\)/);
  assert.match(renderSource, /appendWorldSafetyReportCards\(reports\)/);
  assert.doesNotMatch(sanctionRenderer, /translateReportStatus\(sanction\.status\)|translatePortability\(\s*sanction\.portability_revoked|formatDateTime\(sanction\.issued_at_ms\)/);
  assert.doesNotMatch(reportRenderer, /translateReportStatus\(report\.status|translateTargetKind\(report\.target_kind\)|formatDateTime\(report\.reported_at_ms\)/);
  assert.doesNotMatch(renderSource, /sanction\.resident_id/);
  assert.doesNotMatch(renderSource, /report\.target_ref/);
});

test("resident directory card DOM is delegated out of renderResidents", async () => {
  const source = await readShellModule("app.js");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const emptyRenderer = sliceBetween(
    source,
    "function createResidentDirectoryEmptyNode() {",
    "function appendResidentDirectoryTitleRow(li, model) {",
  );
  const titleRenderer = sliceBetween(
    source,
    "function appendResidentDirectoryTitleRow(li, model) {",
    "function appendResidentDirectoryMetaRows(li, model) {",
  );
  const metaRenderer = sliceBetween(
    source,
    "function appendResidentDirectoryMetaRows(li, model) {",
    "function createResidentDirectActionButton(resident) {",
  );
  const directButtonRenderer = sliceBetween(
    source,
    "function createResidentDirectActionButton(resident) {",
    "function appendResidentDirectoryActions(li, resident) {",
  );
  const actionsRenderer = sliceBetween(
    source,
    "function appendResidentDirectoryActions(li, resident) {",
    "function createResidentDirectoryCardNode(resident) {",
  );
  const cardRenderer = sliceBetween(
    source,
    "function createResidentDirectoryCardNode(resident) {",
    "function renderResidents() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderResidents() {",
    "/** Render compact resident directory in creative.html sidebar */",
  );

  assert.match(source, /residentDirectoryEmptyStateText,\s+residentDirectoryCardModel,/);
  assert.match(governanceRenderSource, /export function residentDirectoryEmptyStateText/);
  assert.match(governanceRenderSource, /export function residentDirectoryCardModel/);
  assert.match(emptyRenderer, /empty\.textContent = residentDirectoryEmptyStateText\(\{ gatewayUrl \}\)/);
  assert.match(titleRenderer, /titleRow\.className = model\.titleRowClassName/);
  assert.match(titleRenderer, /createLine\("city-name", model\.title\)/);
  assert.match(titleRenderer, /createLine\("city-slug", model\.slug\)/);
  assert.match(metaRenderer, /for \(const row of model\.rows\) \{/);
  assert.match(metaRenderer, /createLine\(row\.className, row\.text\)/);
  assert.match(directButtonRenderer, /directButton\.textContent = "发起私聊"/);
  assert.match(directButtonRenderer, /enterResidentRoom\(resident\)/);
  assert.match(actionsRenderer, /actions\.className = "city-actions"/);
  assert.match(actionsRenderer, /createResidentDirectActionButton\(resident\)/);
  assert.match(cardRenderer, /const model = residentDirectoryCardModel\(resident, \{/);
  assert.match(cardRenderer, /translateResidentLabelFn: translateResidentLabel/);
  assert.match(cardRenderer, /li\.className = model\.className/);
  assert.match(cardRenderer, /appendResidentDirectoryTitleRow\(li, model\)/);
  assert.match(cardRenderer, /appendResidentDirectoryMetaRows\(li, model\)/);
  assert.match(cardRenderer, /appendResidentDirectoryActions\(li, resident\)/);
  assert.match(renderSource, /residentListEl\.appendChild\(createResidentDirectoryEmptyNode\(\)\)/);
  assert.match(renderSource, /residentListEl\.appendChild\(createResidentDirectoryCardNode\(resident\)\)/);
  assert.doesNotMatch(source, /function residentDirectoryDisplayName/);
  assert.doesNotMatch(titleRenderer, /resident\.nickname|translateResidentLabel\(resident\.resident_id\)/);
  assert.doesNotMatch(metaRenderer, /joinOrFallback|resident\.active_cities|resident\.pending_cities|translateRole/);
  assert.doesNotMatch(renderSource, /directButton\.textContent = "发起私聊"/);
  assert.doesNotMatch(renderSource, /titleRow\.className = "city-card-title"/);
});

test("compact resident list DOM is delegated out of renderResidentList", async () => {
  const source = await readShellModule("app.js");
  const visibilitySync = sliceBetween(
    source,
    "function syncResidentListSearchVisibility() {",
    "function createCompactResidentEmptyNode(residents) {",
  );
  const emptyRenderer = sliceBetween(
    source,
    "function createCompactResidentEmptyNode(residents) {",
    "function createCompactResidentFilteredEmptyNode(query) {",
  );
  const filteredEmptyRenderer = sliceBetween(
    source,
    "function createCompactResidentFilteredEmptyNode(query) {",
    "function compactResidentListQuery() {",
  );
  const queryResolver = sliceBetween(
    source,
    "function compactResidentListQuery() {",
    "function filteredCompactResidents(residents, identity, query) {",
  );
  const filterResolver = sliceBetween(
    source,
    "function filteredCompactResidents(residents, identity, query) {",
    "function sortedCompactResidents(residents) {",
  );
  const sorter = sliceBetween(
    source,
    "function sortedCompactResidents(residents) {",
    "function createCompactResidentAvatar(resident, displayName) {",
  );
  const avatarRenderer = sliceBetween(
    source,
    "function createCompactResidentAvatar(resident, displayName) {",
    "function createCompactResidentTitleStack(resident, displayName) {",
  );
  const titleStackRenderer = sliceBetween(
    source,
    "function createCompactResidentTitleStack(resident, displayName) {",
    "function createCompactResidentButtonContent(resident, displayName) {",
  );
  const buttonContentRenderer = sliceBetween(
    source,
    "function createCompactResidentButtonContent(resident, displayName) {",
    "function createCompactResidentButton(resident) {",
  );
  const buttonRenderer = sliceBetween(
    source,
    "function createCompactResidentButton(resident) {",
    "function createCompactResidentListItemNode(resident) {",
  );
  const itemRenderer = sliceBetween(
    source,
    "function createCompactResidentListItemNode(resident) {",
    "function renderResidentList() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderResidentList() {",
    "function bootTransportStatus() {",
  );

  assert.match(visibilitySync, /residentListEl\.style\.display = searchMode === "rooms" \? "none" : ""/);
  assert.match(emptyRenderer, /empty\.textContent = residents/);
  assert.match(filteredEmptyRenderer, /query \? `没有匹配「\$\{roomSearch\}」的居民` : "暂无其他居民"/);
  assert.match(queryResolver, /roomSearch\.toLowerCase\(\)\.trim\(\)/);
  assert.match(filterResolver, /r\.resident_id !== identity/);
  assert.match(filterResolver, /r\.resident_id\.toLowerCase\(\)\.includes\(query\)/);
  assert.match(sorter, /if \(a\.online !== b\.online\) return a\.online \? -1 : 1/);
  assert.match(avatarRenderer, /applyAvatarStyle\(avatar, resident\.resident_id\)/);
  assert.match(titleStackRenderer, /resident-status-dot/);
  assert.match(titleStackRenderer, /statusDot\.setAttribute\("aria-label", resident\.online \? "在线" : "离线"\)/);
  assert.match(buttonContentRenderer, /content\.className = "room-content"/);
  assert.match(buttonContentRenderer, /createCompactResidentTitleStack\(resident, displayName\)/);
  assert.match(buttonRenderer, /enterResidentRoom\(resident\)/);
  assert.match(itemRenderer, /button\.appendChild\(createCompactResidentAvatar\(resident, displayName\)\)/);
  assert.match(itemRenderer, /button\.appendChild\(createCompactResidentButtonContent\(resident, displayName\)\)/);
  assert.match(renderSource, /syncResidentListSearchVisibility\(\)/);
  assert.match(renderSource, /createCompactResidentEmptyNode\(residents\)/);
  assert.match(renderSource, /filteredCompactResidents\(residents, identity, query\)/);
  assert.match(renderSource, /sortedCompactResidents\(filtered\)/);
  assert.match(renderSource, /createCompactResidentListItemNode\(resident\)/);
  assert.doesNotMatch(renderSource, /resident-status-dot/);
  assert.doesNotMatch(renderSource, /enterResidentRoom\(resident\)/);
});

test("resident relationship actions are wired to gateway relationship routes", async () => {
  const creativeHtml = await readShellPage("creative.html");
  const source = await readShellModule("app.js");
  const creativeCss = await readShellModule("styles.creative.css");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const statusStateSource = await readShellModule("shell-governance-status.js");
  const statusSource = sliceBetween(
    source,
    "function setGovernanceStatus(message, isError = false",
    "function setAuthStatus(message, isError = false)",
  );
  const submitSource = sliceBetween(
    source,
    "async function submitResidentRelationshipAction(model) {",
    "function createResidentRelationshipActionButton(resident) {",
  );
  const relationshipButtonSource = sliceBetween(
    source,
    "function createResidentRelationshipActionButton(resident) {",
    "function createResidentDirectActionButton(resident) {",
  );
  const directoryActionsSource = sliceBetween(
    source,
    "function appendResidentDirectoryActions(li, resident) {",
    "function createResidentDirectoryCardNode(resident) {",
  );
  const compactItemSource = sliceBetween(
    source,
    "function createCompactResidentListItemNode(resident) {",
    "function renderResidentList() {",
  );
  const entrySource = sliceBetween(
    source,
    "async function enterResidentRoom(resident) {",
    "async function openDirectSession(peerId) {",
  );

  assert.match(creativeHtml, /id="governance-status"/, "住宅页必须提供好友关系/私宅访问反馈状态节点");
  assert.match(source, /residentRelationshipActionModel,\s+residentRelationshipSubmitRequestState,\s+residentPrivateRoomAccessPromptModel,/);
  assert.match(governanceRenderSource, /function residentRelationshipSubmitRequestState\(/);
  assert.match(source, /governanceStatusClassState,\s+governanceStatusText,\s+} from "\.\/shell-governance-status\.js";/);
  assert.doesNotMatch(source, /const GOVERNANCE_STATUS_DYNAMIC_CLASSES = \[/);
  assert.match(statusStateSource, /GOVERNANCE_STATUS_DYNAMIC_CLASSES/);
  assert.match(statusStateSource, /resident-room-access-note/, "治理状态条应清理私宅访问状态 class");
  assert.match(statusStateSource, /function governanceStatusClassState/);
  assert.match(statusStateSource, /function governanceStatusText/);
  assert.match(statusSource, /extraClassName/, "治理状态条应支持未授权私宅 prompt 的视觉 class");
  assert.match(statusSource, /governanceStatusText\(\{/);
  assert.match(statusSource, /governanceStatusClassState\(\{/);
  assert.match(submitSource, /residentRelationshipSubmitRequestState\(model, \{ gatewayUrl \}\)/);
  assert.match(submitSource, /postGatewayJson\(requestState\.endpoint, requestState\.payload\)/);
  assert.match(submitSource, /await refreshFromGateway\(\{ requireShell: true \}\)/);
  assert.doesNotMatch(submitSource, /model\.endpoint|model\.payload/);
  assert.match(relationshipButtonSource, /residentRelationshipActionModel\(resident, \{\s*currentResidentId: currentIdentity\(\),\s*\}\)/);
  assert.match(relationshipButtonSource, /submitResidentRelationshipAction\(model\)/);
  assert.match(directoryActionsSource, /createResidentRelationshipActionButton\(resident\)/);
  assert.match(compactItemSource, /createResidentRelationshipActionButton\(resident\)/);
  assert.match(entrySource, /residentPrivateRoomAccessPromptModel\(resident, \{/);
  assert.match(entrySource, /roomVisible: state\.rooms\.some\(\(room\) => room\.id === resident\.personal_room_id\)/);
  assert.match(entrySource, /setGovernanceStatus\(accessPrompt\.text, accessPrompt\.isError, accessPrompt\.className\)/);
  assert.match(creativeCss, /\.creative-resident-list \.resident-relationship-action/);
  assert.match(creativeCss, /\.creative-resident-list \.resident-relationship-action\.is-pending/);
  assert.match(creativeCss, /\.creative-resident-list \.resident-relationship-action\.is-friends/);
  assert.match(creativeCss, /\.governance-status\.resident-room-access-note/);
  assert.match(creativeCss, /\.governance-status\.resident-room-access-note\.is-locked/);
  assert.match(creativeCss, /\.governance-status\.resident-room-access-note\.is-actionable/);
});

test("direct session open request state is delegated out of openDirectSession", async () => {
  const source = await readShellModule("app.js");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const openSource = sliceBetween(
    source,
    "async function openDirectSession(peerId) {",
    "async function submitProviderConnect() {",
  );

  assert.match(source, /directSessionOpenRequestState,/);
  assert.match(governanceRenderSource, /function directSessionOpenRequestState\(/);
  assert.match(openSource, /directSessionOpenRequestState\(\{/);
  assert.match(openSource, /peerId,/);
  assert.match(openSource, /currentIdentity: currentIdentity\(\)/);
  assert.match(openSource, /gatewayUrl,/);
  assert.match(openSource, /postGatewayJson\(requestState\.endpoint, requestState\.payload\)/);
  assert.match(openSource, /setGovernanceStatus\(requestState\.statusText/);
  assert.match(openSource, /setGovernanceStatus\(requestState\.successText\)/);
  assert.doesNotMatch(openSource, /peerId\.trim\(\)|\/v1\/direct\/open|requester_device_id|peer_device_id/);
});

test("caretaker panel DOM is delegated out of renderCaretakerPanel", async () => {
  const source = await readShellModule("app.js");
  const caretakerPanelSource = await readShellModule("shell-caretaker-panel.js");
  const titleRenderer = sliceBetween(
    source,
    "function createCaretakerPanelTitleNode(model) {",
    "function createCaretakerPanelHeaderNode(model) {",
  );
  const headerRenderer = sliceBetween(
    source,
    "function createCaretakerPanelHeaderNode(model) {",
    "function createCaretakerPanelSummaryNode(model) {",
  );
  const summaryRenderer = sliceBetween(
    source,
    "function createCaretakerPanelSummaryNode(model) {",
    "function createCaretakerMessageNode(item) {",
  );
  const messageRenderer = sliceBetween(
    source,
    "function createCaretakerMessageNode(item) {",
    "function createCaretakerMessagesNode(model) {",
  );
  const messagesRenderer = sliceBetween(
    source,
    "function createCaretakerMessagesNode(model) {",
    "function createCaretakerRulesNode(model) {",
  );
  const rulesRenderer = sliceBetween(
    source,
    "function createCaretakerRulesNode(model) {",
    "function renderCaretakerPanel() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderCaretakerPanel() {",
    "function ensureCaretakerBadge() {",
  );
  const statusRenderer = sliceBetween(
    source,
    "function updateCaretakerStatus() {",
    "function ensureChatPriorityBadge() {",
  );

  assert.match(source, /caretakerPanelModel,\s+caretakerStatusItems,/);
  assert.match(caretakerPanelSource, /export function caretakerPanelModel/);
  assert.match(caretakerPanelSource, /export function caretakerStatusItems/);
  assert.doesNotMatch(source, /const CARETAKER_PROFILE|const CARETAKER_MESSAGES|const CARETAKER_RULES/);
  assert.match(titleRenderer, /panelTitle\.textContent = model\.title/);
  assert.match(headerRenderer, /const profile = model\.profile/);
  assert.match(headerRenderer, /profile\.displayName/);
  assert.match(headerRenderer, /profile\.highlight/);
  assert.match(summaryRenderer, /summary\.textContent = model\.profile\.summary/);
  assert.match(messageRenderer, /titleSpan\.textContent = item\.title/);
  assert.match(messageRenderer, /timeSpan\.textContent = item\.time/);
  assert.match(messagesRenderer, /for \(const item of model\.messages\) \{/);
  assert.match(messagesRenderer, /createCaretakerMessageNode\(item\)/);
  assert.match(rulesRenderer, /rulesTitle\.textContent = model\.rulesTitle/);
  assert.match(rulesRenderer, /for \(const rule of model\.rules\) \{/);
  assert.match(renderSource, /const model = caretakerPanelModel\(\)/);
  assert.match(renderSource, /caretakerPanelEl\.appendChild\(createCaretakerPanelTitleNode\(model\)\)/);
  assert.match(renderSource, /body\.appendChild\(createCaretakerPanelHeaderNode\(model\)\)/);
  assert.match(renderSource, /body\.appendChild\(createCaretakerMessagesNode\(model\)\)/);
  assert.match(renderSource, /body\.appendChild\(createCaretakerRulesNode\(model\)\)/);
  assert.match(statusRenderer, /const items = caretakerStatusItems\(\{ roomLabel \}\)/);
  assert.match(statusRenderer, /document\.createElement\(item\.element\)/);
  assert.match(statusRenderer, /if \(item\.className\) node\.className = item\.className/);
  assert.doesNotMatch(renderSource, /CARETAKER_MESSAGES/);
  assert.doesNotMatch(renderSource, /CARETAKER_RULES/);
});

test("governance offline empty state is delegated out of renderGovernance", async () => {
  const source = await readShellModule("app.js");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const offlineRenderer = sliceBetween(
    source,
    "function renderGovernanceOfflineState() {",
    "function renderGovernance() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderGovernance() {",
    "function renderWorldDirectory() {",
  );

  assert.match(source, /governanceOfflineStateModel,/);
  assert.match(governanceRenderSource, /export function governanceOfflineStateModel/);
  assert.match(offlineRenderer, /const model = governanceOfflineStateModel\(\{ gatewayUrl, shellMode \}\)/);
  assert.match(offlineRenderer, /setNodeText\(worldStateEl, model\.worldState\)/);
  assert.match(offlineRenderer, /setNodeText\(worldSummaryEl, model\.summary\)/);
  assert.match(offlineRenderer, /worldDirectoryListEl,\s*worldMirrorSourceListEl,\s*worldSquareListEl,\s*worldSafetyListEl,/);
  assert.match(offlineRenderer, /empty\.className = model\.listEmptyClassName/);
  assert.match(offlineRenderer, /empty\.textContent = model\.listEmptyText/);
  assert.match(offlineRenderer, /cityEmpty\.className = model\.cityEmptyClassName/);
  assert.match(offlineRenderer, /cityEmpty\.textContent = model\.cityEmptyText/);
  assert.match(renderSource, /if \(!governance\.world\) \{\s*renderGovernanceOfflineState\(\);\s*return;\s*\}/);
  assert.doesNotMatch(offlineRenderer, /"世界：离线"|"世界层暂不可用"|"世界状态暂不可用"/);
  assert.doesNotMatch(renderSource, /世界层暂不可用/);
  assert.doesNotMatch(renderSource, /世界状态暂不可用/);
});

test("world state payload normalization is delegated out of loadWorldState", async () => {
  const source = await readShellModule("app.js");
  const loadSource = sliceBetween(
    source,
    "async function loadWorldState() {",
    "async function loadProviderState() {",
  );

  assert.match(source, /governanceFromWorldSnapshotBundle/);
  assert.match(source, /governanceFromWorldApiPayload/);
  assert.match(loadSource, /const snapshotGovernance = governanceFromWorldSnapshotBundle\(bundle\)/);
  assert.match(loadSource, /const apiGovernance = governanceFromWorldApiPayload\(payload, residentsPayload\)/);
  assert.doesNotMatch(loadSource, /governance = \{/);
  assert.doesNotMatch(loadSource, /world_mirror_sources:/);
  assert.doesNotMatch(loadSource, /world_square:/);
});

test("world state loading scopes resident directory by current identity", async () => {
  const source = await readShellModule("app.js");
  const loadSource = sliceBetween(
    source,
    "async function loadWorldState() {",
    "async function loadProviderState() {",
  );

  assert.match(loadSource, /const residentsUrl = new URL\(`\$\{gatewayUrl\}\/v1\/residents`\)/);
  assert.match(loadSource, /if \(!isVisitorIdentity\(currentIdentity\(\)\)\)/);
  assert.match(loadSource, /residentsUrl\.searchParams\.set\("resident_id", currentIdentity\(\)\)/);
  assert.match(loadSource, /fetch\(residentsUrl\.toString\(\)\)/);
  assert.match(loadSource, /const scopedGovernance = governanceWithResidentsPayload\(snapshotGovernance, scopedResidentsPayload\)/);
  assert.match(loadSource, /governance = scopedGovernance/);
});

test("main startup orchestration is split into named phases", async () => {
  const source = await readShellModule("app.js");
  const mainSource = sliceBetween(
    source,
    "async function main() {",
    "composerFormEl?.addEventListener",
  );

  assert.match(source, /function initializeLocalShellState\(\) \{/);
  assert.match(source, /async function loadInitialRuntimeState\(\) \{/);
  assert.match(source, /function renderInitialShell\(\) \{/);
  assert.match(mainSource, /initializeLocalShellState\(\)/);
  assert.match(mainSource, /await loadInitialRuntimeState\(\)/);
  assert.match(mainSource, /renderInitialShell\(\)/);
  assert.doesNotMatch(mainSource, /roomReadMarkers = loadRoomReadMarkers\(\)/);
  assert.doesNotMatch(mainSource, /await loadGatewayBootstrap\(\)/);
  assert.doesNotMatch(mainSource, /renderResidents\(\)/);
});

test("governance render flow delegates chrome and member filtering", async () => {
  const source = await readShellModule("app.js");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const targetResolver = sliceBetween(
    source,
    "function hasGovernanceRenderTargets() {",
    "function updateGovernanceWorldHeader() {",
  );
  const headerRenderer = sliceBetween(
    source,
    "function updateGovernanceWorldHeader() {",
    "function appendGovernanceEmptyCityState() {",
  );
  const emptyRenderer = sliceBetween(
    source,
    "function appendGovernanceEmptyCityState() {",
    "function governancePendingMembersForCity(city) {",
  );
  const pendingResolver = sliceBetween(
    source,
    "function governancePendingMembersForCity(city) {",
    "function governanceActiveMembersForCity(city) {",
  );
  const activeResolver = sliceBetween(
    source,
    "function governanceActiveMembersForCity(city) {",
    "function renderGovernance() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderGovernance() {",
    "function renderWorldDirectory() {",
  );

  assert.match(targetResolver, /!cityListEl/);
  assert.match(targetResolver, /!worldSafetyListEl/);
  assert.match(source, /governanceWorldHeaderModel,\s+governanceEmptyCityStateModel,/);
  assert.match(governanceRenderSource, /export function governanceWorldHeaderModel/);
  assert.match(governanceRenderSource, /export function governanceEmptyCityStateModel/);
  assert.match(headerRenderer, /const model = governanceWorldHeaderModel\(\{/);
  assert.match(headerRenderer, /world: governance\.world/);
  assert.match(headerRenderer, /directory: governance\.world_directory/);
  assert.match(headerRenderer, /cityCount: governance\.cities\.length/);
  assert.match(headerRenderer, /worldSquareCount: \(governance\.world_square \|\| \[\]\)\.length/);
  assert.match(headerRenderer, /setNodeText\(worldStateEl, model\.worldState\)/);
  assert.match(headerRenderer, /setNodeText\(worldSummaryEl, model\.summary\)/);
  assert.match(emptyRenderer, /const model = governanceEmptyCityStateModel\(\)/);
  assert.match(emptyRenderer, /empty\.className = model\.className/);
  assert.match(emptyRenderer, /empty\.textContent = model\.text/);
  assert.match(pendingResolver, /item\.city_id === city\.city_id && item\.state === "PendingApproval"/);
  assert.match(activeResolver, /item\.state === "Active"/);
  assert.match(activeResolver, /item\.resident_id !== currentIdentity\(\)/);
  assert.match(renderSource, /if \(!hasGovernanceRenderTargets\(\)\) return/);
  assert.match(renderSource, /updateGovernanceWorldHeader\(\)/);
  assert.match(renderSource, /appendGovernanceEmptyCityState\(\)/);
  assert.match(renderSource, /const pendingMembers = governancePendingMembersForCity\(city\)/);
  assert.match(renderSource, /const activeMembers = governanceActiveMembersForCity\(city\)/);
  assert.doesNotMatch(headerRenderer, /displayWorldTitle|跨城私聊|shellMode === "user"/);
  assert.doesNotMatch(emptyRenderer, /"暂时还没有公开城市"/);
  assert.doesNotMatch(renderSource, /worldSummaryEl, shellMode === "user"/);
  assert.doesNotMatch(renderSource, /governance\.memberships\.filter/);
});

test("world directory DOM copy is delegated out of renderWorldDirectory", async () => {
  const source = await readShellModule("app.js");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const cardRenderer = sliceBetween(
    source,
    "function createWorldDirectoryCityCardNode(model) {",
    "function renderWorldDirectory() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderWorldDirectory() {",
    "function renderMirrorSources() {",
  );

  assert.match(source, /worldDirectoryCityCardModel/);
  assert.match(source, /worldDirectoryEmptyStateText/);
  assert.match(governanceRenderSource, /export function worldDirectoryCityCardModel/);
  assert.match(governanceRenderSource, /export function worldDirectoryEmptyStateText/);
  assert.match(cardRenderer, /li\.className = model\.className/);
  assert.match(cardRenderer, /titleRow\.className = model\.titleRowClassName/);
  assert.match(cardRenderer, /createLine\("city-name", model\.title\)/);
  assert.match(cardRenderer, /createLine\("city-slug", model\.slug\)/);
  assert.match(cardRenderer, /createLine\("city-sub", model\.description\)/);
  assert.match(cardRenderer, /createLine\("city-sub", model\.metrics\)/);
  assert.match(cardRenderer, /createLine\("city-role", model\.mirror\)/);
  assert.match(renderSource, /empty\.textContent = worldDirectoryEmptyStateText\(\{ gatewayUrl \}\)/);
  assert.match(renderSource, /createWorldDirectoryCityCardNode\(worldDirectoryCityCardModel\(city\)\)/);
  assert.doesNotMatch(renderSource, /displayCityTitle\(city\)/);
  assert.doesNotMatch(renderSource, /displayCityDescription\(city\)/);
  assert.doesNotMatch(renderSource, /translateSourceKind\(city\.source_kind\)/);
  assert.doesNotMatch(renderSource, /translateTrustState\(city\.trust_state\)/);
  assert.doesNotMatch(renderSource, /世界目录暂时还没有公开条目/);
  assert.doesNotMatch(renderSource, /信任状态/);
});

test("mirror source DOM copy is delegated out of renderMirrorSources", async () => {
  const source = await readShellModule("app.js");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const cardRenderer = sliceBetween(
    source,
    "function createMirrorSourceCardNode(model) {",
    "function renderMirrorSources() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderMirrorSources() {",
    "function renderWorldSquare() {",
  );

  assert.match(source, /mirrorSourceCardModel/);
  assert.match(source, /mirrorSourcesEmptyStateText/);
  assert.match(governanceRenderSource, /export function mirrorSourceCardModel/);
  assert.match(governanceRenderSource, /export function mirrorSourcesEmptyStateText/);
  assert.match(cardRenderer, /li\.className = model\.className/);
  assert.match(cardRenderer, /createLine\("city-name", model\.title\)/);
  assert.match(cardRenderer, /createLine\("city-sub", model\.status\)/);
  assert.match(cardRenderer, /createLine\("city-role", model\.metrics\)/);
  assert.match(cardRenderer, /if \(model\.lastSnapshot\)/);
  assert.match(cardRenderer, /createLine\("city-role", model\.lastSnapshot\)/);
  assert.match(renderSource, /empty\.textContent = mirrorSourcesEmptyStateText\(\{ gatewayUrl \}\)/);
  assert.match(renderSource, /createMirrorSourceCardNode\(mirrorSourceCardModel\(source\)\)/);
  assert.doesNotMatch(renderSource, /translateSourceKind\(source\.source_kind\)/);
  assert.doesNotMatch(renderSource, /source\.enabled \? "已启用" : "未启用"/);
  assert.doesNotMatch(renderSource, /source\.reachable \? "可达" : "不可达"/);
  assert.doesNotMatch(renderSource, /formatDateTime\(source\.last_snapshot_at_ms\)/);
  assert.doesNotMatch(renderSource, /暂时还没有配置世界镜像源/);
  assert.doesNotMatch(renderSource, /城市 \$\{source\.city_count\}/);
});

test("world square notice DOM copy is delegated out of renderWorldSquare", async () => {
  const source = await readShellModule("app.js");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const cardRenderer = sliceBetween(
    source,
    "function createWorldSquareNoticeCardNode(model) {",
    "function renderWorldSquare() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderWorldSquare() {",
    "function renderWorldSafetyEmptyState() {",
  );

  assert.match(source, /worldSquareNoticeCardModel/);
  assert.match(source, /worldSquareEmptyStateText/);
  assert.match(governanceRenderSource, /export function worldSquareNoticeCardModel/);
  assert.match(governanceRenderSource, /export function worldSquareEmptyStateText/);
  assert.match(cardRenderer, /li\.className = model\.className/);
  assert.match(cardRenderer, /titleRow\.className = model\.titleRowClassName/);
  assert.match(cardRenderer, /createLine\("city-name", model\.title\)/);
  assert.match(cardRenderer, /createLine\("city-slug", model\.meta\)/);
  assert.match(cardRenderer, /createLine\("city-sub", model\.body\)/);
  assert.match(cardRenderer, /createLine\("city-role", model\.tags\)/);
  assert.match(renderSource, /empty\.textContent = worldSquareEmptyStateText\(\{ gatewayUrl \}\)/);
  assert.match(renderSource, /createWorldSquareNoticeCardNode\(worldSquareNoticeCardModel\(notice\)\)/);
  assert.doesNotMatch(renderSource, /translateSeverity\(notice\.severity/);
  assert.doesNotMatch(renderSource, /\(notice\.tags \|\| \[\]\)\.join/);
  assert.doesNotMatch(renderSource, /formatDateTime\(notice\.posted_at_ms\)/);
  assert.doesNotMatch(renderSource, /世界广场当前还没有新动态/);
  assert.doesNotMatch(renderSource, /标签：/);
});

test("governance city card summary DOM is delegated out of renderGovernance", async () => {
  const source = await readShellModule("app.js");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const cardBaseRenderer = sliceBetween(
    source,
    "function createGovernanceCityCardBaseNode(city, membership) {",
    "function renderGovernance() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderGovernance() {",
    "    if (rooms.length) {",
  );

  assert.match(source, /governanceCityCardBaseModel/);
  assert.match(governanceRenderSource, /export function governanceCityCardBaseModel/);
  assert.match(cardBaseRenderer, /document\.createElement\("li"\)/);
  assert.match(cardBaseRenderer, /const model = governanceCityCardBaseModel\(city, membership, \{ membershipLabelFn: humanMembership \}\)/);
  assert.match(cardBaseRenderer, /li\.className = model\.className/);
  assert.match(cardBaseRenderer, /titleRow\.className = model\.titleRowClassName/);
  assert.match(cardBaseRenderer, /createLine\("city-name", model\.title\)/);
  assert.match(cardBaseRenderer, /createLine\("city-slug", model\.slug\)/);
  assert.match(cardBaseRenderer, /createLine\("city-sub", model\.description\)/);
  assert.match(cardBaseRenderer, /createLine\("city-role", model\.role\)/);
  assert.match(cardBaseRenderer, /createLine\("city-sub", model\.access\)/);
  assert.match(renderSource, /const li = createGovernanceCityCardBaseNode\(city, membership\)/);
  assert.doesNotMatch(cardBaseRenderer, /displayCityTitle\(city\)/);
  assert.doesNotMatch(cardBaseRenderer, /displayCityDescription\(city\)/);
  assert.doesNotMatch(cardBaseRenderer, /humanMembership\(membership\)/);
  assert.doesNotMatch(cardBaseRenderer, /city\.public_room_discovery_enabled/);
  assert.doesNotMatch(cardBaseRenderer, /city\.approval_required/);
  assert.doesNotMatch(renderSource, /titleRow\.className = "city-card-title"/);
  assert.doesNotMatch(renderSource, /displayCityDescription\(city\)/);
});

test("governance city room list DOM is delegated out of renderGovernance", async () => {
  const source = await readShellModule("app.js");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const openButtonRenderer = sliceBetween(
    source,
    "function createGovernanceRoomOpenButton(room) {",
    "function createGovernanceRoomFreezeButton(city, room) {",
  );
  const freezeButtonRenderer = sliceBetween(
    source,
    "function createGovernanceRoomFreezeButton(city, room) {",
    "function createGovernanceCityRoomEntryNode(city, membership, room) {",
  );
  const roomEntryRenderer = sliceBetween(
    source,
    "function createGovernanceCityRoomEntryNode(city, membership, room) {",
    "function appendGovernanceCityRoomList(li, city, membership, rooms) {",
  );
  const roomListRenderer = sliceBetween(
    source,
    "function appendGovernanceCityRoomList(li, city, membership, rooms) {",
    "function renderGovernance() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderGovernance() {",
    "    if (pendingMembers.length) {",
  );

  assert.match(source, /governanceCityRoomListModel/);
  assert.match(governanceRenderSource, /export function governanceCityRoomListModel/);
  assert.match(roomListRenderer, /const model = governanceCityRoomListModel\(rooms, membership, \{ canFreezeRoomFn: roleAllowsFreezeRoom \}\)/);
  assert.match(roomListRenderer, /roomList\.className = model\.titleClassName/);
  assert.match(roomListRenderer, /roomList\.textContent = model\.title/);
  assert.match(roomListRenderer, /roomWrap\.className = model\.wrapClassName/);
  assert.match(roomListRenderer, /for \(const room of model\.entries\) \{/);
  assert.match(openButtonRenderer, /const model = room\.openButton/);
  assert.match(openButtonRenderer, /openButton\.type = model\.type/);
  assert.match(openButtonRenderer, /openButton\.className = model\.className/);
  assert.match(openButtonRenderer, /openButton\.textContent = model\.text/);
  assert.match(openButtonRenderer, /focusRoom\(room\.roomId\)/);
  assert.match(freezeButtonRenderer, /const model = room\.freezeButton/);
  assert.match(freezeButtonRenderer, /toggleButton\.textContent = model\.text/);
  assert.match(freezeButtonRenderer, /submitFreezeRoom\(city\.slug, room\.slug, !room\.frozen\)/);
  assert.match(roomEntryRenderer, /row\.className = room\.rowClassName/);
  assert.match(roomEntryRenderer, /label\.textContent = room\.label/);
  assert.match(roomEntryRenderer, /controls\.className = room\.controlsClassName/);
  assert.match(roomEntryRenderer, /createGovernanceRoomOpenButton\(room\)/);
  assert.match(roomEntryRenderer, /if \(room\.freezeButton\) \{/);
  assert.match(roomListRenderer, /createGovernanceCityRoomEntryNode\(city, membership, room\)/);
  assert.match(renderSource, /if \(rooms\.length\) \{\s*appendGovernanceCityRoomList\(li, city, membership, rooms\);\s*\}/);
  assert.doesNotMatch(roomListRenderer, /"公共房间"/);
  assert.doesNotMatch(roomListRenderer, /for \(const room of rooms\) \{/);
  assert.doesNotMatch(roomEntryRenderer, /room\.frozen \? " · 已冻结" : ""/);
  assert.doesNotMatch(openButtonRenderer, /openButton\.textContent = "打开"/);
  assert.doesNotMatch(freezeButtonRenderer, /room\.frozen \? "解冻" : "冻结"/);
  assert.doesNotMatch(renderSource, /roomList\.textContent = "公共房间"/);
  assert.doesNotMatch(renderSource, /submitFreezeRoom\(city\.slug, room\.slug, !room\.frozen\)/);
  assert.doesNotMatch(roomListRenderer, /focusRoom\(room\.room_id\)/);
  assert.doesNotMatch(roomListRenderer, /submitFreezeRoom\(city\.slug, room\.slug, !room\.frozen\)/);
});

test("governance pending member list DOM is delegated out of renderGovernance", async () => {
  const source = await readShellModule("app.js");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const pendingListRenderer = sliceBetween(
    source,
    "function appendGovernancePendingMemberList(li, city, membership, pendingMembers) {",
    "function appendGovernanceActiveMemberList(li, city, membership, activeMembers) {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderGovernance() {",
    "    if (activeMembers.length) {",
  );

  assert.match(source, /governancePendingMemberListModel/);
  assert.match(governanceRenderSource, /export function governancePendingMemberListModel/);
  assert.match(pendingListRenderer, /const model = governancePendingMemberListModel\(pendingMembers, membership, \{ canApproveJoinFn: roleAllowsApproveJoin \}\)/);
  assert.match(pendingListRenderer, /pendingTitle\.className = model\.titleClassName/);
  assert.match(pendingListRenderer, /pendingTitle\.textContent = model\.title/);
  assert.match(pendingListRenderer, /pendingWrap\.className = model\.wrapClassName/);
  assert.match(pendingListRenderer, /for \(const pending of model\.entries\) \{/);
  assert.match(pendingListRenderer, /row\.className = pending\.rowClassName/);
  assert.match(pendingListRenderer, /label\.textContent = pending\.label/);
  assert.match(pendingListRenderer, /if \(pending\.approveButton\) \{/);
  assert.match(pendingListRenderer, /approveButton\.type = pending\.approveButton\.type/);
  assert.match(pendingListRenderer, /approveButton\.className = pending\.approveButton\.className/);
  assert.match(pendingListRenderer, /approveButton\.textContent = pending\.approveButton\.text/);
  assert.match(pendingListRenderer, /submitApproveResident\(city\.slug, pending\.residentId\)/);
  assert.match(renderSource, /if \(pendingMembers\.length\) \{\s*appendGovernancePendingMemberList\(li, city, membership, pendingMembers\);\s*\}/);
  assert.doesNotMatch(pendingListRenderer, /"待审批居民"/);
  assert.doesNotMatch(pendingListRenderer, /"批准"/);
  assert.doesNotMatch(pendingListRenderer, /pending\.resident_id/);
  assert.doesNotMatch(pendingListRenderer, /membership\?\.state === "Active"/);
  assert.doesNotMatch(pendingListRenderer, /roleAllowsApproveJoin\(membership\.role\)/);
  assert.doesNotMatch(renderSource, /pendingTitle\.textContent = "待审批居民"/);
  assert.doesNotMatch(renderSource, /submitApproveResident\(city\.slug, pending\.resident_id\)/);
});

test("governance active member list DOM is delegated out of renderGovernance", async () => {
  const source = await readShellModule("app.js");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const activeListRenderer = sliceBetween(
    source,
    "function appendGovernanceActiveMemberList(li, city, membership, activeMembers) {",
    "function createGovernanceJoinButton(action) {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderGovernance() {",
    "    appendGovernanceCityActions(li, city, membership, rooms);",
  );

  assert.match(source, /governanceActiveMemberListModel/);
  assert.match(governanceRenderSource, /export function governanceActiveMemberListModel/);
  assert.match(activeListRenderer, /const model = governanceActiveMemberListModel\(activeMembers, membership, \{\s*canManageStewardsFn: roleAllowsManageStewards,\s*translateRoleFn: translateRole,\s*\}\)/);
  assert.match(activeListRenderer, /activeTitle\.className = model\.titleClassName/);
  assert.match(activeListRenderer, /activeTitle\.textContent = model\.title/);
  assert.match(activeListRenderer, /activeWrap\.className = model\.wrapClassName/);
  assert.match(activeListRenderer, /for \(const resident of model\.entries\) \{/);
  assert.match(activeListRenderer, /row\.className = resident\.rowClassName/);
  assert.match(activeListRenderer, /label\.textContent = resident\.label/);
  assert.match(activeListRenderer, /if \(resident\.stewardButton\) \{/);
  assert.match(activeListRenderer, /stewardButton\.type = resident\.stewardButton\.type/);
  assert.match(activeListRenderer, /stewardButton\.className = resident\.stewardButton\.className/);
  assert.match(activeListRenderer, /stewardButton\.textContent = resident\.stewardButton\.text/);
  assert.match(activeListRenderer, /submitStewardUpdate\(city\.slug, resident\.residentId, resident\.stewardGrant\)/);
  assert.match(renderSource, /if \(activeMembers\.length\) \{\s*appendGovernanceActiveMemberList\(li, city, membership, activeMembers\);\s*\}/);
  assert.doesNotMatch(activeListRenderer, /"活跃居民"/);
  assert.doesNotMatch(activeListRenderer, /translateRole\(resident\.role\)/);
  assert.doesNotMatch(activeListRenderer, /resident\.role !== "Steward"/);
  assert.doesNotMatch(activeListRenderer, /"设为执事"|"撤销执事"/);
  assert.doesNotMatch(activeListRenderer, /membership\?\.state === "Active"/);
  assert.doesNotMatch(activeListRenderer, /roleAllowsManageStewards\(membership\.role\)/);
  assert.doesNotMatch(renderSource, /activeTitle\.textContent = "活跃居民"/);
  assert.doesNotMatch(renderSource, /submitStewardUpdate\(city\.slug, resident\.resident_id, grant\)/);
});

test("governance city action controls DOM is delegated out of renderGovernance", async () => {
  const source = await readShellModule("app.js");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const joinButtonRenderer = sliceBetween(
    source,
    "function createGovernanceJoinButton(action) {",
    "function createGovernancePendingApprovalNotice(notice) {",
  );
  const pendingNoticeRenderer = sliceBetween(
    source,
    "function createGovernancePendingApprovalNotice(notice) {",
    "function createGovernanceLobbyOpenButton(lobby) {",
    "function createGovernanceCreateRoomButton(action) {",
  );
  const lobbyOpenButtonRenderer = sliceBetween(
    source,
    "function createGovernanceLobbyOpenButton(lobby) {",
    "function createGovernanceCreateRoomButton(action) {",
  );
  const createRoomButtonRenderer = sliceBetween(
    source,
    "function createGovernanceCreateRoomButton(action) {",
    "function appendGovernanceCityActions(li, city, membership, rooms) {",
  );
  const actionRenderer = sliceBetween(
    source,
    "function appendGovernanceCityActions(li, city, membership, rooms) {",
    "function appendGovernanceFederationPolicyControls(li, city, membership) {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderGovernance() {",
    "    appendGovernanceFederationPolicyControls(li, city, membership);",
  );

  assert.match(source, /governanceCityActionsModel/);
  assert.match(governanceRenderSource, /export function governanceCityActionsModel/);
  assert.match(actionRenderer, /const model = governanceCityActionsModel\(city, membership, rooms, \{ canCreatePublicRoomFn: roleAllowsCreatePublicRoom \}\)/);
  assert.match(actionRenderer, /if \(!model\.hasActions\) return/);
  assert.match(actionRenderer, /const actions = document\.createElement\("div"\)/);
  assert.match(actionRenderer, /actions\.className = model\.className/);
  assert.match(joinButtonRenderer, /joinButton\.type = action\.type/);
  assert.match(joinButtonRenderer, /joinButton\.className = action\.className/);
  assert.match(joinButtonRenderer, /joinButton\.textContent = action\.text/);
  assert.match(joinButtonRenderer, /cityJoinInputEl\.value = action\.citySlug/);
  assert.match(joinButtonRenderer, /await submitJoinCity\(action\.citySlug\)/);
  assert.match(pendingNoticeRenderer, /pending\.className = notice\.className/);
  assert.match(pendingNoticeRenderer, /pending\.textContent = notice\.text/);
  assert.match(lobbyOpenButtonRenderer, /openButton\.textContent = lobby\.text/);
  assert.match(lobbyOpenButtonRenderer, /focusRoom\(lobby\.roomId\)/);
  assert.match(createRoomButtonRenderer, /roomButton\.textContent = action\.text/);
  assert.match(createRoomButtonRenderer, /roomCityInputEl\.value = action\.citySlug/);
  assert.match(createRoomButtonRenderer, /setGovernanceStatus\(action\.statusText\)/);
  assert.match(actionRenderer, /if \(model\.joinButton\) \{/);
  assert.match(actionRenderer, /actions\.appendChild\(createGovernanceJoinButton\(model\.joinButton\)\)/);
  assert.match(actionRenderer, /if \(model\.pendingNotice\) \{/);
  assert.match(actionRenderer, /actions\.appendChild\(createGovernancePendingApprovalNotice\(model\.pendingNotice\)\)/);
  assert.match(actionRenderer, /if \(model\.lobbyButton\) \{/);
  assert.match(actionRenderer, /actions\.appendChild\(createGovernanceLobbyOpenButton\(model\.lobbyButton\)\)/);
  assert.match(actionRenderer, /if \(model\.createRoomButton\) \{/);
  assert.match(actionRenderer, /actions\.appendChild\(createGovernanceCreateRoomButton\(model\.createRoomButton\)\)/);
  assert.match(actionRenderer, /li\.appendChild\(actions\)/);
  assert.match(renderSource, /appendGovernanceCityActions\(li, city, membership, rooms\)/);
  assert.doesNotMatch(actionRenderer, /"city-actions"|"加入"|"等待审批"|"新建房间"|已准备在/);
  assert.doesNotMatch(actionRenderer, /membership\?\.state === "Active"/);
  assert.doesNotMatch(actionRenderer, /roleAllowsCreatePublicRoom\(membership\.role\)/);
  assert.doesNotMatch(actionRenderer, /rooms\.find\(\(room\) => room\.slug === "lobby"\)/);
  assert.doesNotMatch(renderSource, /const actions = document\.createElement\("div"\)/);
  assert.doesNotMatch(renderSource, /submitJoinCity\(city\.slug\)/);
  assert.doesNotMatch(renderSource, /roomTitleInputEl\.focus\(\)/);
  assert.doesNotMatch(actionRenderer, /await submitJoinCity\(city\.slug\)/);
  assert.doesNotMatch(actionRenderer, /focusRoom\(lobby\.room_id\)/);
  assert.doesNotMatch(actionRenderer, /roomTitleInputEl\.focus\(\)/);
});

test("governance federation policy controls are delegated out of renderGovernance", async () => {
  const source = await readShellModule("app.js");
  const governanceRenderSource = await readShellModule("shell-governance-render.js");
  const federationRenderer = sliceBetween(
    source,
    "function appendGovernanceFederationPolicyControls(li, city, membership) {",
    "function renderGovernance() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderGovernance() {",
    "    cityListEl.appendChild(li);",
  );

  assert.match(source, /governanceFederationPolicyControlsModel/);
  assert.match(governanceRenderSource, /export function governanceFederationPolicyControlsModel/);
  assert.match(federationRenderer, /const model = governanceFederationPolicyControlsModel\(city, membership, \{\s*canUpdateFederationFn: roleAllowsUpdateFederation,\s*translateFederationPolicyFn: translateFederationPolicy,\s*\}\)/);
  assert.match(federationRenderer, /if \(!model\) return/);
  assert.match(federationRenderer, /federationLabel\.className = model\.titleClassName/);
  assert.match(federationRenderer, /federationLabel\.textContent = model\.title/);
  assert.match(federationRenderer, /federationWrap\.className = model\.wrapClassName/);
  assert.match(federationRenderer, /for \(const policy of model\.entries\) \{/);
  assert.match(federationRenderer, /row\.className = policy\.rowClassName/);
  assert.match(federationRenderer, /text\.textContent = policy\.label/);
  assert.match(federationRenderer, /applyButton\.type = policy\.applyButton\.type/);
  assert.match(federationRenderer, /applyButton\.className = policy\.applyButton\.className/);
  assert.match(federationRenderer, /applyButton\.textContent = policy\.applyButton\.text/);
  assert.match(federationRenderer, /applyButton\.disabled = policy\.applyButton\.disabled/);
  assert.match(federationRenderer, /await submitFederationPolicy\(city\.slug, policy\.policyValue\)/);
  assert.match(federationRenderer, /setGovernanceStatus\(localizedRuntimeError\(error, "联邦策略更新失败"\), true\)/);
  assert.match(federationRenderer, /li\.appendChild\(federationWrap\)/);
  assert.match(renderSource, /appendGovernanceFederationPolicyControls\(li, city, membership\)/);
  assert.doesNotMatch(federationRenderer, /membership\?\.state === "Active"/);
  assert.doesNotMatch(federationRenderer, /roleAllowsUpdateFederation\(membership\.role\)/);
  assert.doesNotMatch(federationRenderer, /translateFederationPolicy\(city\.federation_policy\)/);
  assert.doesNotMatch(federationRenderer, /const policies = \[/);
  assert.doesNotMatch(federationRenderer, /\["Open", "开放互联"\]/);
  assert.doesNotMatch(federationRenderer, /\["Selective", "选择互联"\]/);
  assert.doesNotMatch(federationRenderer, /\["Isolated", "孤城断联"\]/);
  assert.doesNotMatch(federationRenderer, /"当前"|"应用"|当前生效|可切换/);
  assert.doesNotMatch(renderSource, /const federationLabel = document\.createElement\("div"\)/);
  assert.doesNotMatch(renderSource, /submitFederationPolicy\(city\.slug, policyValue\)/);
  assert.doesNotMatch(renderSource, /const policies = \[/);
});

test("governance form input enablement is delegated out of updateGovernanceFormState", async () => {
  const source = await readShellModule("app.js");
  const stewardInputs = sliceBetween(
    source,
    "function governanceWorldStewardInputElements() {",
    "function governanceManagedInputElements() {",
  );
  const managedInputs = sliceBetween(
    source,
    "function governanceManagedInputElements() {",
    "function updateGovernanceManagedInputs(enabled, worldStewardEnabled) {",
  );
  const inputUpdater = sliceBetween(
    source,
    "function updateGovernanceManagedInputs(enabled, worldStewardEnabled) {",
    "function governanceButtonStateDescriptors(enabled, worldStewardEnabled) {",
  );
  const formUpdater = sliceBetween(
    source,
    "function updateGovernanceFormState() {",
    "function updateAuthFormState() {",
  );

  assert.match(stewardInputs, /return new Set\(\[/);
  assert.match(stewardInputs, /worldMirrorUrlInputEl/);
  assert.match(stewardInputs, /worldResidentReasonInputEl/);
  assert.match(managedInputs, /return \[/);
  assert.match(managedInputs, /providerUrlInputEl/);
  assert.match(managedInputs, /worldReportEvidenceInputEl/);
  assert.match(inputUpdater, /const worldStewardInputs = governanceWorldStewardInputElements\(\)/);
  assert.match(inputUpdater, /for \(const element of governanceManagedInputElements\(\)\) \{/);
  assert.match(inputUpdater, /element\.disabled = worldStewardInputs\.has\(element\) \? !worldStewardEnabled : !enabled/);
  assert.match(formUpdater, /updateGovernanceManagedInputs\(enabled, worldStewardEnabled\)/);
  assert.doesNotMatch(formUpdater, /new Set\(\[/);
  assert.doesNotMatch(formUpdater, /worldMirrorUrlInputEl,\s*worldNoticeTitleInputEl/);
});

test("governance form button enablement is delegated out of updateGovernanceFormState", async () => {
  const source = await readShellModule("app.js");
  const buttonDescriptors = sliceBetween(
    source,
    "function governanceButtonStateDescriptors(enabled, worldStewardEnabled) {",
    "function updateGovernanceManagedButtons(enabled, worldStewardEnabled) {",
  );
  const buttonUpdater = sliceBetween(
    source,
    "function updateGovernanceManagedButtons(enabled, worldStewardEnabled) {",
    "function updateGovernanceFormState() {",
  );
  const formUpdater = sliceBetween(
    source,
    "function updateGovernanceFormState() {",
    "function updateAuthFormState() {",
  );

  assert.match(buttonDescriptors, /cityCreateFormEl\?\.querySelector\("button"\)/);
  assert.match(buttonDescriptors, /providerDisconnectButtonEl/);
  assert.match(buttonDescriptors, /disabled: !enabled \|\| !provider\.base_url/);
  assert.match(buttonDescriptors, /worldMirrorFormEl\?\.querySelector\("button"\)/);
  assert.match(buttonDescriptors, /worldResidentSanctionFormEl\?\.querySelector\("button"\)/);
  assert.match(buttonDescriptors, /disabled: !worldStewardEnabled/);
  assert.match(buttonUpdater, /for \(const \{ element, disabled \} of governanceButtonStateDescriptors\(enabled, worldStewardEnabled\)\) \{/);
  assert.match(buttonUpdater, /if \(element\) element\.disabled = disabled/);
  assert.match(formUpdater, /updateGovernanceManagedButtons\(enabled, worldStewardEnabled\)/);
  assert.doesNotMatch(formUpdater, /querySelector\("button"\)/);
  assert.doesNotMatch(formUpdater, /providerDisconnectButtonEl\.disabled/);
});

test("room digest metrics title and copy are delegated out of renderRoomDigest", async () => {
  const source = await readShellModule("app.js");
  const metricsRenderer = sliceBetween(
    source,
    "function roomDigestMetrics() {",
    "function createRoomDigestTitleNode(rooms) {",
  );
  const titleRenderer = sliceBetween(
    source,
    "function createRoomDigestTitleNode(rooms) {",
    "function createRoomDigestCopyNode(activeRoom, shellPage) {",
  );
  const copyRenderer = sliceBetween(
    source,
    "function createRoomDigestCopyNode(activeRoom, shellPage) {",
    "function appendRoomDigestBaseChips(chips, shellPage, metrics) {",
  );
  const digestRenderer = sliceBetween(
    source,
    "function renderRoomDigest(rooms) {",
    "function renderThreadStatusRail(room) {",
  );

  assert.match(metricsRenderer, /activeRoom: activeRoomId \? state\.rooms\.find/);
  assert.match(metricsRenderer, /directCount: state\.rooms\.filter\(\(room\) => roomKind\(room\) === "direct"\)\.length/);
  assert.match(metricsRenderer, /unreadTotal: state\.rooms\.reduce\(\(sum, room\) => sum \+ unreadCount\(room\), 0\)/);
  assert.match(titleRenderer, /title\.className = "room-digest-title"/);
  assert.match(titleRenderer, /rooms\.length \? `最近会话 · \$\{rooms\.length\}` : "最近会话 · 暂无"/);
  assert.match(copyRenderer, /copy\.className = "room-digest-copy"/);
  assert.match(copyRenderer, /shellPage === "admin"\s*\?\s*roomThreadHeadline\(activeRoom\)/);
  assert.match(copyRenderer, /roomContextSummary\(activeRoom\)/);
  assert.match(digestRenderer, /const metrics = roomDigestMetrics\(\)/);
  assert.match(digestRenderer, /roomDigestEl\.appendChild\(createRoomDigestTitleNode\(rooms\)\)/);
  assert.match(digestRenderer, /roomDigestEl\.appendChild\(createRoomDigestCopyNode\(metrics\.activeRoom, shellPage\)\)/);
  assert.doesNotMatch(digestRenderer, /const directCount = state\.rooms\.filter/);
  assert.doesNotMatch(digestRenderer, /copy\.className = "room-digest-copy"/);
});

test("room digest chip groups are delegated out of renderRoomDigest", async () => {
  const source = await readShellModule("app.js");
  const baseChipAppender = sliceBetween(
    source,
    "function appendRoomDigestBaseChips(chips, shellPage, metrics) {",
    "function appendRoomDigestActiveRoomChips(chips, activeRoom, shellPage) {",
  );
  const activeChipAppender = sliceBetween(
    source,
    "function appendRoomDigestActiveRoomChips(chips, activeRoom, shellPage) {",
    "function createRoomDigestChipsNode(shellPage, metrics) {",
  );
  const chipsRenderer = sliceBetween(
    source,
    "function createRoomDigestChipsNode(shellPage, metrics) {",
    "function renderRoomDigest(rooms) {",
  );
  const digestRenderer = sliceBetween(
    source,
    "function renderRoomDigest(rooms) {",
    "function renderThreadStatusRail(room) {",
  );

  assert.match(baseChipAppender, /if \(shellPage === "admin"\) \{/);
  assert.match(baseChipAppender, /`\$\{metrics\.followUpCount\} 个待跟进`/);
  assert.match(baseChipAppender, /`\$\{metrics\.unreadTotal\} 条未读`/);
  assert.match(baseChipAppender, /metrics\.systemCount > 0/);
  assert.match(activeChipAppender, /if \(!activeRoom\) return/);
  assert.match(activeChipAppender, /createPill\(roomThreadHeadline\(activeRoom\), "muted"\)/);
  assert.match(activeChipAppender, /roomChatStatusSummary\(activeRoom\)/);
  assert.match(activeChipAppender, /roomQueueSummary\(activeRoom\)/);
  assert.match(activeChipAppender, /const caretaker = caretakerProfile\(activeRoom\)/);
  assert.match(chipsRenderer, /chips\.className = "room-digest-chips"/);
  assert.match(chipsRenderer, /appendRoomDigestBaseChips\(chips, shellPage, metrics\)/);
  assert.match(chipsRenderer, /appendRoomDigestActiveRoomChips\(chips, metrics\.activeRoom, shellPage\)/);
  assert.match(digestRenderer, /roomDigestEl\.appendChild\(createRoomDigestChipsNode\(shellPage, metrics\)\)/);
  assert.doesNotMatch(digestRenderer, /followUpCount > 0 \? "warm" : "muted"/);
  assert.doesNotMatch(digestRenderer, /roomChatStatusSummary\(activeRoom\)/);
});

test("thread status rail visibility and items are delegated out of renderThreadStatusRail", async () => {
  const source = await readShellModule("app.js");
  const roomRenderSource = await readShellModule("shell-room-render.js");
  const modelAdapter = sliceBetween(
    source,
    "function threadStatusRailModel(room, shellPage) {",
    "function createThreadStatusItemNode(item) {",
  );
  const railRenderer = sliceBetween(
    source,
    "function renderThreadStatusRail(room) {",
    "function gatewayConnectionStatus() {",
  );

  assert.match(roomRenderSource, /export function threadStatusRailModelForState/);
  assert.match(source, /threadStatusRailModelForState,/);
  assert.match(modelAdapter, /const sendError = room \? roomSendErrors\[room\.id\] : ""/);
  assert.match(modelAdapter, /const caretaker = caretakerProfile\(room\)/);
  assert.match(modelAdapter, /threadStatusRailModelForState\(\{/);
  assert.match(modelAdapter, /threadHeadline: room \? roomThreadHeadline\(room\) : ""/);
  assert.match(modelAdapter, /draftLength: room && roomHasDraft\(room\.id\) \? draftForRoom\(room\.id\)\.trim\(\)\.length : 0/);
  assert.match(modelAdapter, /caretakerNotificationCount: caretakerNotificationCount\(room\)/);
  assert.match(railRenderer, /const model = threadStatusRailModel\(room, shellPage\)/);
  assert.match(railRenderer, /if \(!model\.visible\) \{/);
  assert.match(railRenderer, /for \(const item of model\.items\) \{/);
  assert.doesNotMatch(source, /function shouldHideThreadStatusRail/);
  assert.doesNotMatch(source, /function threadStatusBaseItems/);
  assert.doesNotMatch(source, /function appendThreadStatusDraftItem/);
  assert.doesNotMatch(source, /function appendThreadStatusCaretakerItems/);
  assert.doesNotMatch(source, /function threadStatusRailItems/);
  assert.doesNotMatch(railRenderer, /const items = \[/);
  assert.doesNotMatch(railRenderer, /roomChatStatusSummary\(room\)/);
});

test("thread status item DOM is delegated out of renderThreadStatusRail", async () => {
  const source = await readShellModule("app.js");
  const itemRenderer = sliceBetween(
    source,
    "function createThreadStatusItemNode(item) {",
    "function renderThreadStatusRail(room) {",
  );
  const railRenderer = sliceBetween(
    source,
    "function renderThreadStatusRail(room) {",
    "function gatewayConnectionStatus() {",
  );

  assert.match(itemRenderer, /document\.createElement\("div"\)/);
  assert.match(itemRenderer, /chip\.className = `thread-status-item thread-status-item-\$\{item\.tone\}`/);
  assert.match(itemRenderer, /createLine\("thread-status-label", item\.label\)/);
  assert.match(itemRenderer, /createLine\("thread-status-value", item\.value\)/);
  assert.match(itemRenderer, /return chip/);
  assert.match(railRenderer, /threadStatusRailEl\.appendChild\(createThreadStatusItemNode\(item\)\)/);
  assert.doesNotMatch(railRenderer, /document\.createElement\("div"\)/);
});

test("composer meta model and DOM are delegated out of renderComposerMeta", async () => {
  const source = await readShellModule("app.js");
  const composerMod = await readShellModule("shell-composer.js");

  // app.js 不再内联 composer meta 逻辑，全部委托 shell-composer.js
  assert.doesNotMatch(source, /function composerMetaItems\b/);
  assert.doesNotMatch(source, /function composerMetaStatusForRoom\b/);
  assert.doesNotMatch(source, /function renderComposerMeta\b/);
  assert.match(source, /renderComposerMeta,/);
  assert.match(source, /initShellComposer\(/);

  // 逻辑在 shell-composer.js（renderComposerMeta 导出 + 内联 items 构造）
  assert.match(composerMod, /export function renderComposerMeta\(room\)/);
  assert.match(composerMod, /label: "当前会话"/);
  assert.match(composerMod, /label: shellPage === "admin" \? "线程" : "会话标题"/);
  assert.match(composerMod, /roomRouteLabel\(room\)/);
  assert.match(composerMod, /currentIdentity\(\) \|\| "访客"/);
  assert.match(composerMod, /caretakerProfile\(room\)/);
  assert.match(composerMod, /_ctx\.shellMode === "admin"/);
  assert.match(composerMod, /更多 · 刷新/);
  assert.match(composerMod, /广场 · 刷新/);
  assert.match(composerMod, /composer-meta-item/);
  assert.match(composerMod, /createLine\("composer-meta-label"/);
});

test("chat detail hero DOM is delegated out of renderChatDetailPanel", async () => {
  const source = await readShellModule("app.js");
  const heroRenderer = sliceBetween(
    source,
    "function createChatDetailHeroNode(room, shellPage) {",
    "function renderChatDetailPanel() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderChatDetailPanel() {",
    "  const runtime = createChatRuntimeDetailSection(room, shellPage);",
  );

  assert.match(heroRenderer, /document\.createElement\("section"\)/);
  assert.match(heroRenderer, /hero\.className = "chat-detail-hero"/);
  assert.match(heroRenderer, /createLine\("chat-detail-title", roomThreadHeadline\(room\)\)/);
  assert.match(heroRenderer, /createLine\("chat-detail-copy", roomContextSummary\(room\)\)/);
  assert.match(heroRenderer, /translateRoomKindForShellPage\(roomKind\(room\), shellPage\)/);
  assert.match(heroRenderer, /pills\.className = "chat-detail-pills"/);
  assert.match(heroRenderer, /pills\.appendChild\(createPill\(`身份 \$\{currentIdentity\(\)\}`, "muted"\)\)/);
  assert.match(renderSource, /const hero = createChatDetailHeroNode\(room, shellPage\)/);
  assert.match(renderSource, /chatDetailContentEl\.appendChild\(hero\)/);
  assert.doesNotMatch(renderSource, /document\.createElement\("section"\)/);
  assert.doesNotMatch(renderSource, /chat-detail-pills/);
});

test("chat detail runtime status DOM is delegated out of renderChatDetailPanel", async () => {
  const source = await readShellModule("app.js");
  const roomRenderSource = await readShellModule("shell-room-render.js");
  const runtimeRenderer = sliceBetween(
    source,
    "function createChatRuntimeDetailSection(room, shellPage) {",
    "function chatDetailRoomContextModel(room) {",
  );
  const previewCardRenderer = sliceBetween(
    source,
    "function createChatRuntimePreviewCardNode(room, preview, previewFieldView) {",
    "function appendChatRuntimePreviewRows(runtime, room, preview) {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderChatDetailPanel() {",
    "  const caretakerSection = createCaretakerDetailSection(room);",
  );

  assert.match(source, /chatRuntimeDetailModelForState/);
  assert.match(roomRenderSource, /export function chatRuntimeDetailModelForState/);
  assert.match(runtimeRenderer, /const runtime = createDetailSection\("聊天状态"\)/);
  assert.match(runtimeRenderer, /const model = chatRuntimeDetailModel\(room, shellPage\)/);
  assert.match(runtimeRenderer, /appendChatRuntimeRows\(runtime, model\.rowsBeforePreview\)/);
  assert.match(runtimeRenderer, /appendChatRuntimePreviewRows\(runtime, room, model\.preview\)/);
  assert.match(runtimeRenderer, /appendChatRuntimeRows\(runtime, model\.rowsAfterPreview\)/);
  assert.match(previewCardRenderer, /createQuickActionPreviewCard\(preview\.action, preview\.state, preview\.structured/);
  assert.match(previewCardRenderer, /previewRoomQuickStage\(room\.id, preview\.action, preview\.state, index\)/);
  assert.match(previewCardRenderer, /setRoomQuickPreviewFieldView\(room\.id, preview\.action, preview\.state, preview\.snapshotIndex, viewId\)/);
  assert.match(renderSource, /const runtime = createChatRuntimeDetailSection\(room, shellPage\)/);
  assert.match(renderSource, /chatDetailContentEl\.appendChild\(runtime\)/);
  assert.doesNotMatch(runtimeRenderer, /roomThreadHeadline\(room\)|roomQueueSummary\(room\)|translateProviderMode\(provider\.mode/);
  assert.doesNotMatch(source, /function appendChatRuntimeShellRows|function appendChatRuntimeProviderRows/);
  assert.doesNotMatch(runtimeRenderer, /createQuickActionPreviewCard\(preview\.action, preview\.state, preview\.structured/);
  assert.doesNotMatch(runtimeRenderer, /translateProviderMode\(provider\.mode/);
  assert.doesNotMatch(renderSource, /createDetailSection\("聊天状态"\)/);
  assert.doesNotMatch(renderSource, /chat-detail-preview-card/);
});

test("chat detail quick actions DOM is delegated out of renderChatDetailPanel", async () => {
  const source = await readShellModule("app.js");
  const actionsRenderer = sliceBetween(
    source,
    "function createChatDetailActionsSection(room, shellPage) {",
    "function renderChatDetailPanel() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderChatDetailPanel() {",
    "function createTimelineEmptyStateNode(cardSpec) {",
  );

  assert.match(actionsRenderer, /const actions = createDetailSection\("快捷动作"\)/);
  assert.match(actionsRenderer, /actionRow\.className = "chat-detail-actions"/);
  assert.match(actionsRenderer, /refreshButton\.textContent = "刷新"/);
  assert.match(actionsRenderer, /await refreshFromGateway\(\)/);
  assert.match(actionsRenderer, /exportButton\.textContent = "导出当前"/);
  assert.match(actionsRenderer, /exportCurrentConversation\("导出当前会话失败"\)/);
  assert.match(actionsRenderer, /if \(shellPage !== "user"\) \{/);
  assert.match(actionsRenderer, /worldButton\.textContent = roomKind\(room\) === "direct" \? "去找人" : "去找房间"/);
  assert.match(actionsRenderer, /return actions/);
  assert.match(renderSource, /const actions = createChatDetailActionsSection\(room, shellPage\)/);
  assert.match(renderSource, /chatDetailContentEl\.appendChild\(actions\)/);
  assert.doesNotMatch(renderSource, /createDetailSection\("快捷动作"\)/);
  assert.doesNotMatch(renderSource, /refreshButton\.textContent = "刷新"/);
  assert.doesNotMatch(renderSource, /exportButton\.textContent = "导出当前"/);
});

test("chat detail caretaker section DOM is delegated out of renderChatDetailPanel", async () => {
  const source = await readShellModule("app.js");
  const caretakerRenderer = sliceBetween(
    source,
    "function createCaretakerDetailSection(room) {",
    "function createChatDetailActionsSection(room, shellPage) {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderChatDetailPanel() {",
    "function createTimelineEmptyStateNode(cardSpec) {",
  );

  assert.match(caretakerRenderer, /const caretaker = caretakerProfile\(room\)/);
  assert.match(caretakerRenderer, /if \(!caretaker\) return null/);
  assert.match(caretakerRenderer, /const caretakerSection = createDetailSection\(/);
  assert.match(caretakerRenderer, /createDetailRow\("人设", caretaker\.persona \|\| "未设定"\)/);
  assert.match(caretakerRenderer, /createDetailRow\("短期记忆", caretaker\.memory \|\| "暂无记录"\)/);
  assert.match(caretakerRenderer, /createDetailRow\("自动回复", caretaker\.auto_reply \|\| "未设定"\)/);
  assert.match(caretakerRenderer, /for \(const message of caretaker\.messages\.slice\(0, 3\)\) \{/);
  assert.match(caretakerRenderer, /item\.className = "caretaker-note"/);
  assert.match(caretakerRenderer, /for \(const note of caretaker\.notifications\.slice\(0, 2\)\) \{/);
  assert.match(caretakerRenderer, /item\.className = "caretaker-note caretaker-note-alert"/);
  assert.match(caretakerRenderer, /return caretakerSection/);
  assert.match(renderSource, /const caretakerSection = createCaretakerDetailSection\(room\)/);
  assert.match(renderSource, /if \(caretakerSection\) \{\s*chatDetailContentEl\.appendChild\(caretakerSection\);\s*\}/);
  assert.doesNotMatch(renderSource, /for \(const message of caretaker\.messages\.slice\(0, 3\)\)/);
  assert.doesNotMatch(renderSource, /for \(const note of caretaker\.notifications\.slice\(0, 2\)\)/);
});

test("chat detail room context sections are delegated out of renderChatDetailPanel", async () => {
  const source = await readShellModule("app.js");
  const contextMod = await readShellModule("shell-room-context.js");
  const contextResolver = sliceBetween(
    source,
    "function chatDetailRoomContextModel(room) {",
    "function createChatDetailCityContextSection(context) {",
  );
  const cityRenderer = sliceBetween(
    source,
    "function createChatDetailCityContextSection(context) {",
    "function createChatDetailSiblingRoomsSection(context) {",
  );
  const siblingRenderer = sliceBetween(
    source,
    "function createChatDetailSiblingRoomsSection(context) {",
    "function createChatDetailDirectContextSection(room) {",
  );
  const directRenderer = sliceBetween(
    source,
    "function createChatDetailDirectContextSection(room) {",
    "function appendChatDetailRoomContextSections(container, room) {",
  );
  const contextRenderer = sliceBetween(
    source,
    "function appendChatDetailRoomContextSections(container, room) {",
    "function createCaretakerDetailSection(room) {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderChatDetailPanel() {",
    "function createTimelineEmptyStateNode(cardSpec) {",
  );

  // app.js chatDetailRoomContextModel 改为薄委托，governance 聚合逻辑移入 shell-room-context.js
  assert.match(contextResolver, /chatDetailRoomContextModelForState\(room, governanceContextDeps\(\)\)/);
  assert.match(contextMod, /export function chatDetailRoomContextModelForState/);
  assert.match(contextMod, /deps\.publicRoomRecordForConversation\(room\.id\)/);
  assert.match(contextMod, /deps\.cityStateForConversation\(room\.id\)/);
  assert.match(contextMod, /deps\.worldDirectoryCity\(publicRoom\.city_id\)/);
  assert.match(contextMod, /deps\.membershipForCity\(publicRoom\.city_id\)/);
  assert.match(contextMod, /deps\.publicRoomsForCity\(publicRoom\.city_id\)\.filter/);
  assert.match(cityRenderer, /const citySection = createDetailSection\(\s*"城市 \/ 频道资料"/);
  assert.match(cityRenderer, /createDetailRow\("城市", displayCityTitle\(cityProfile\)\)/);
  assert.match(cityRenderer, /translateTrustState\(directoryCity\.trust_state\)/);
  assert.match(cityRenderer, /translateFederationPolicy\(cityState\.profile\.federation_policy\)/);
  assert.match(cityRenderer, /return citySection/);
  assert.match(siblingRenderer, /if \(!context\.siblingRooms\.length\) return null/);
  assert.match(siblingRenderer, /for \(const sibling of context\.siblingRooms\.slice\(0, 5\)\) \{/);
  assert.match(siblingRenderer, /focusRoom\(sibling\.room_id\)/);
  assert.match(siblingRenderer, /return related/);
  assert.match(directRenderer, /const direct = createDetailSection\(\s*"私信窗口"/);
  assert.match(directRenderer, /room\.peer_label \|\| room\.participant_label \|\| roomAudienceLabel\(room\)/);
  assert.match(directRenderer, /return direct/);
  assert.match(contextRenderer, /const context = chatDetailRoomContextModel\(room\)/);
  assert.match(contextRenderer, /container\.appendChild\(createChatDetailCityContextSection\(context\)\)/);
  assert.match(contextRenderer, /const siblingSection = createChatDetailSiblingRoomsSection\(context\)/);
  assert.match(contextRenderer, /container\.appendChild\(createChatDetailDirectContextSection\(room\)\)/);
  assert.match(renderSource, /appendChatDetailRoomContextSections\(chatDetailContentEl, room\)/);
  assert.doesNotMatch(contextRenderer, /publicRoomRecordForConversation\(room\.id\)/);
  assert.doesNotMatch(contextRenderer, /createDetailSection\(\s*"城市 \/ 频道资料"/);
  assert.doesNotMatch(contextRenderer, /createDetailSection\(\s*"私信窗口"/);
  assert.doesNotMatch(renderSource, /publicRoomRecordForConversation\(room\.id\)/);
  assert.doesNotMatch(renderSource, /createDetailSection\(\s*"城市 \/ 频道资料"/);
  assert.doesNotMatch(renderSource, /createDetailSection\(\s*"私信窗口"/);
});

test("conversation callout model and DOM are delegated out of updateConversationCallout", async () => {
  const source = await readShellModule("app.js");
  const calloutModule = await readShellModule("shell-conversation-callout.js");
  // 模型已下沉到 shell-conversation-callout.js
  assert.match(calloutModule, /export function conversationCalloutModelForState/);
  assert.match(calloutModule, /variant: "user"/);
  assert.match(calloutModule, /caretakerPendingCount\(room\)/);
  assert.match(calloutModule, /variant: "admin"/);
  assert.match(calloutModule, /roomChatStatusSummary\(room\)/);
  assert.match(source, /from "\.\/shell-conversation-callout\.js"/);
  // app.js 的 conversationCalloutModel 是薄壳委托
  const projectionShell = sliceBetween(
    source,
    "function conversationCalloutModel(room, caretaker) {",
    "function createConversationCalloutParagraphNode(paragraph) {",
  );
  assert.match(projectionShell, /return conversationCalloutModelForState\(room, caretaker, shellMode, \{/);
  // app.js 不再内联 user/admin/unified 模型函数（已下沉到模块）
  assert.doesNotMatch(source, /function conversationCalloutUserModel\(/);
  assert.doesNotMatch(source, /function conversationCalloutAdminModel\(/);
  assert.doesNotMatch(source, /function conversationCalloutUnifiedModel\(/);
  const renderer = sliceBetween(
    source,
    "function renderConversationCalloutContent(model) {",
    "function updateConversationCallout() {",
  );
  const updateRenderer = sliceBetween(
    source,
    "function updateConversationCallout() {",
    "function syncRoomStageCanvas(room) {",
  );
  assert.match(renderer, /conversationCalloutEl\.dataset\.variant = model\.variant/);
  assert.match(renderer, /clearChildren\(conversationCalloutEl\)/);
  assert.match(renderer, /document\.createElement\("strong"\)/);
  assert.match(renderer, /createConversationCalloutParagraphNode\(paragraph\)/);
  assert.match(updateRenderer, /updateConversationCalloutStageTitle\(room\)/);
  assert.match(updateRenderer, /const model = conversationCalloutModel\(room, caretaker\)/);
  assert.match(updateRenderer, /renderConversationCalloutContent\(model\)/);
  assert.doesNotMatch(updateRenderer, /document\.createElement\("p"\)/);
  assert.doesNotMatch(updateRenderer, /clearChildren\(conversationCalloutEl\)/);
  assert.doesNotMatch(updateRenderer, /conversationCalloutEl\.dataset\.variant =/);
});

test("room stage canvas user branch is delegated out of syncRoomStageCanvas", async () => {
  const source = await readShellModule("app.js");
  const stageSyncer = sliceBetween(
    source,
    "function syncRoomStageCanvas(room) {",
    "function renderDefaultUserRoomStageCanvas() {",
  );
  const defaultRenderer = sliceBetween(
    source,
    "function renderDefaultUserRoomStageCanvas() {",
    "function defaultUserRoomStageVisual() {",
  );
  const activeRenderer = sliceBetween(
    source,
    "function renderUserRoomStageCanvas(room) {",
    "function updateRoomStageNote(rendered, summary) {",
  );

  assert.match(stageSyncer, /if \(shellPage === "hub"\)/);
  assert.match(stageSyncer, /renderDefaultUserRoomStageCanvas\(\)/);
  assert.match(stageSyncer, /renderUserRoomStageCanvas\(room\)/);
  assert.doesNotMatch(stageSyncer, /buildRoomVisualModel\(/);
  assert.doesNotMatch(stageSyncer, /renderStageCanvas\(/);
  assert.match(defaultRenderer, /defaultUserRoomStageVisual\(\)/);
  assert.match(defaultRenderer, /roomStageCanvasEl\.dataset\.variant = "home"/);
  assert.match(activeRenderer, /buildUserRoomVisual\(room\)/);
  assert.match(activeRenderer, /syncUserRoomProjection\(room, visual\)/);
  assert.match(activeRenderer, /updateRoomStageNote\(rendered, visual\.stage\.summary\)/);
});

test("conversation overview header DOM is delegated out of renderConversationOverview", async () => {
  const source = await readShellModule("app.js");
  const headerRenderer = sliceBetween(
    source,
    "function createConversationOverviewHeaderNode(room, shellPage, compactChatShell) {",
    "function renderConversationOverviewEmptyState() {",
  );
  const emptyStateRenderer = sliceBetween(
    source,
    "function renderConversationOverviewEmptyState() {",
    "function appendNonUserConversationOverview(room, shellPage, compactChatShell) {",
  );
  const nonUserRenderer = sliceBetween(
    source,
    "function appendNonUserConversationOverview(room, shellPage, compactChatShell) {",
    "function renderConversationOverview() {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderConversationOverview() {",
    "function createChatDetailHeroNode(room, shellPage) {",
  );

  assert.match(headerRenderer, /document\.createElement\("div"\)/);
  assert.match(headerRenderer, /header\.className = "overview-header"/);
  assert.match(headerRenderer, /titleWrap\.className = "overview-title-wrap"/);
  assert.match(headerRenderer, /createLine\("overview-title", overviewTitle\)/);
  assert.match(headerRenderer, /badgeWrap\.className = "overview-meta"/);
  assert.match(headerRenderer, /translateRoomKind\(roomKind\(room\)\)/);
  assert.match(headerRenderer, /if \(!compactChatShell\) \{/);
  assert.match(headerRenderer, /createPill\(`身份 \$\{currentIdentity\(\)\}`, "muted"\)/);
  assert.match(emptyStateRenderer, /createLine\("overview-title", "还没有打开聊天"\)/);
  assert.match(emptyStateRenderer, /gatewayUrl/);
  assert.match(emptyStateRenderer, /updateConversationCallout\(\)/);
  assert.doesNotMatch(nonUserRenderer, /createConversationOverviewHeaderNode\(room, shellPage, compactChatShell\)/);
  assert.match(renderSource, /const header = createConversationOverviewHeaderNode\(room, shellPage, compactChatShell\)/);
  assert.match(renderSource, /conversationOverviewEl\.appendChild\(header\)/);
  assert.match(renderSource, /if \(!room\) \{\s*renderConversationOverviewEmptyState\(\);\s*return;\s*\}/);
  assert.match(renderSource, /appendNonUserConversationOverview\(room, shellPage, compactChatShell\)/);
  assert.doesNotMatch(renderSource, /overview-title-wrap/);
  assert.doesNotMatch(renderSource, /overview-meta/);
  assert.doesNotMatch(renderSource, /createLine\("overview-title", "还没有打开聊天"\)/);
});

test("conversation overview user branch is delegated out of renderConversationOverview", async () => {
  const source = await readShellModule("app.js");
  const userRenderer = sliceBetween(
    source,
    "function appendUserConversationOverview(room) {",
    "function createConversationOverviewContextNode(room, shellPage) {",
  );
  const renderSource = sliceBetween(
    source,
    "function renderConversationOverview() {",
    "  appendNonUserConversationOverview(room, shellPage, compactChatShell);",
  );

  assert.match(userRenderer, /conversationOverviewEl\.appendChild\(createLine\("overview-summary", roomOverviewSummary\(room\)\)\)/);
  assert.match(userRenderer, /appendUserConversationQuickPreview\(room, preview\)/);
  assert.match(userRenderer, /conversationOverviewEl\.appendChild\(createUserConversationStatusNode\(room\)\)/);
  assert.match(userRenderer, /const userWorkflow = createUserConversationWorkflowNode\(room\)/);
  assert.match(userRenderer, /conversationOverviewEl\.appendChild\(createUserConversationActionsNode\(room\)\)/);
  assert.match(userRenderer, /syncRoomViewToggleButton\(\)/);
  assert.match(userRenderer, /updateConversationCallout\(\)/);
  assert.match(renderSource, /if \(shellPage === "user"\) \{\s*appendUserConversationOverview\(room\);\s*return;\s*\}/);
  assert.doesNotMatch(userRenderer, /createQuickActionPreviewCard\(preview\.action/);
  assert.doesNotMatch(userRenderer, /userStatus\.className = "overview-status"/);
  assert.doesNotMatch(userRenderer, /refreshButton\.textContent = "刷新聊天"/);
  assert.doesNotMatch(renderSource, /overview-preview-card/);
  assert.doesNotMatch(renderSource, /userStatus\.className = "overview-status"/);
});

test("conversation overview user preview and status are delegated out of appendUserConversationOverview", async () => {
  const source = await readShellModule("app.js");
  const previewRenderer = sliceBetween(
    source,
    "function appendUserConversationQuickPreview(room, preview) {",
    "function createUserConversationStatusNode(room) {",
  );
  const statusRenderer = sliceBetween(
    source,
    "function createUserConversationStatusNode(room) {",
    "function createUserConversationWorkflowNode(room) {",
  );

  assert.match(previewRenderer, /roomQuickPreviewFieldView\(/);
  assert.match(previewRenderer, /className: "overview-summary overview-summary-preview quick-action-preview-summary"/);
  assert.match(previewRenderer, /createQuickActionPreviewCard\(preview\.action, preview\.state, preview\.structured/);
  assert.match(previewRenderer, /previewRoomQuickStage\(room\.id, preview\.action, preview\.state, index\)/);
  assert.match(previewRenderer, /setRoomQuickPreviewFieldView\(room\.id, preview\.action, preview\.state, preview\.snapshotIndex, viewId\)/);
  assert.match(statusRenderer, /userStatus\.className = "overview-status"/);
  assert.match(statusRenderer, /createPill\(roomSyncLabel\(\), refreshInProgress \? "warm" : "accent"\)/);
  assert.match(statusRenderer, /const unread = unreadCount\(room\)/);
  assert.match(statusRenderer, /createRoomQuickActionPill\(room\)/);
  assert.match(statusRenderer, /caretakerPendingCount\(room\) > 0 \? "warm" : "accent"/);
  assert.match(statusRenderer, /roomHasDraft\(room\.id\)/);
  assert.match(statusRenderer, /roomSendErrors\[room\.id\]/);
  assert.match(statusRenderer, /return userStatus/);
});

test("conversation overview user workflow and actions are delegated out of appendUserConversationOverview", async () => {
  const source = await readShellModule("app.js");
  const workflowRenderer = sliceBetween(
    source,
    "function createUserConversationWorkflowNode(room) {",
    "function createUserConversationActionsNode(room) {",
  );
  const actionsRenderer = sliceBetween(
    source,
    "function createUserConversationActionsNode(room) {",
    "function syncRoomViewToggleButton() {",
  );
  const toggleRenderer = sliceBetween(
    source,
    "function syncRoomViewToggleButton() {",
    "function appendUserConversationOverview(room) {",
  );

  assert.match(workflowRenderer, /createWorkflowProgress\(latestRoomQuickAction\(room\), latestRoomQuickState\(room\)/);
  assert.match(workflowRenderer, /className: "overview-workflow-progress"/);
  assert.match(workflowRenderer, /previewRoomQuickStage\(room\.id, action, stage\.label\)/);
  assert.match(workflowRenderer, /seedComposerFromQuickAction\(action, quickActionWorkflowTemplate\(action, stage\.label\), \{ force: true \}\)/);
  assert.match(actionsRenderer, /userActions\.className = "overview-actions"/);
  assert.match(actionsRenderer, /refreshButton\.textContent = "刷新聊天"/);
  assert.match(actionsRenderer, /await refreshFromGateway\(\)/);
  assert.match(actionsRenderer, /appendRoomQuickActionOverviewButton\(userActions, room\)/);
  assert.match(actionsRenderer, /appendRoomQuickStateAdvanceButton\(userActions, room\)/);
  assert.match(actionsRenderer, /return userActions/);
  assert.match(toggleRenderer, /if \(roomViewToggleButtonEl\) \{/);
  assert.match(toggleRenderer, /roomViewToggleButtonEl\.textContent = chatPaneMode === "list" \? "返回会话" : "会话列表"/);
});

test("conversation overview non-user context DOM is delegated out of renderConversationOverview", async () => {
  const source = await readShellModule("app.js");
  const contextRenderer = sliceBetween(
    source,
    "function createConversationOverviewContextNode(room, shellPage) {",
    "function createConversationOverviewStatusNode(room, shellPage, compactChatShell) {",
  );
  const nonUserRenderer = sliceBetween(
    source,
    "function appendNonUserConversationOverview(room, shellPage, compactChatShell) {",
    "  const status = createConversationOverviewStatusNode(room, shellPage, compactChatShell);",
  );

  assert.match(contextRenderer, /document\.createElement\("div"\)/);
  assert.match(contextRenderer, /context\.className = "overview-context"/);
  assert.match(contextRenderer, /shellPage === "admin" \? `后台摘要 · \$\{roomSummaryLine\(room\)\}` : roomSummaryLine\(room\)/);
  assert.match(contextRenderer, /createLine\("overview-context-copy", roomContextSummary\(room\)\)/);
  assert.match(contextRenderer, /createLine\("overview-context-copy", roomStatusLine\(room\)\)/);
  assert.match(contextRenderer, /return context/);
  assert.match(nonUserRenderer, /const context = createConversationOverviewContextNode\(room, shellPage\)/);
  assert.match(nonUserRenderer, /conversationOverviewEl\.appendChild\(context\)/);
  assert.doesNotMatch(nonUserRenderer, /context\.className = "overview-context"/);
  assert.doesNotMatch(nonUserRenderer, /roomStatusLine\(room\)/);
});

test("conversation overview non-user status and actions are delegated out of renderConversationOverview", async () => {
  const source = await readShellModule("app.js");
  const statusRenderer = sliceBetween(
    source,
    "function createConversationOverviewStatusNode(room, shellPage, compactChatShell) {",
    "function appendConversationOverviewBaseStatusPills(status, room, compactChatShell) {",
  );
  const baseStatusAppender = sliceBetween(
    source,
    "function appendConversationOverviewBaseStatusPills(status, room, compactChatShell) {",
    "function appendConversationOverviewRoomStatePills(status, room) {",
  );
  const roomStateAppender = sliceBetween(
    source,
    "function appendConversationOverviewRoomStatePills(status, room) {",
    "function appendConversationOverviewCaretakerStatusPill(status, room) {",
  );
  const caretakerStatusAppender = sliceBetween(
    source,
    "function appendConversationOverviewCaretakerStatusPill(status, room) {",
    "function appendConversationOverviewRuntimeStatusPills(status, room) {",
  );
  const runtimeStatusAppender = sliceBetween(
    source,
    "function appendConversationOverviewRuntimeStatusPills(status, room) {",
    "function createConversationOverviewRefreshButton(shellPage) {",
  );
  const refreshButtonRenderer = sliceBetween(
    source,
    "function createConversationOverviewRefreshButton(shellPage) {",
    "function createConversationOverviewExportButton(shellPage) {",
  );
  const exportButtonRenderer = sliceBetween(
    source,
    "function createConversationOverviewExportButton(shellPage) {",
    "function createConversationOverviewWorldButton(room, shellPage) {",
  );
  const worldButtonRenderer = sliceBetween(
    source,
    "function createConversationOverviewWorldButton(room, shellPage) {",
    "function appendConversationOverviewNavigationButtons(actions, room, shellPage) {",
  );
  const navigationAppender = sliceBetween(
    source,
    "function appendConversationOverviewNavigationButtons(actions, room, shellPage) {",
    "function createConversationOverviewActionsNode(room, shellPage) {",
  );
  const actionsRenderer = sliceBetween(
    source,
    "function createConversationOverviewActionsNode(room, shellPage) {",
    "function renderConversationOverviewEmptyState() {",
  );
  const nonUserRenderer = sliceBetween(
    source,
    "function appendNonUserConversationOverview(room, shellPage, compactChatShell) {",
    "  if (roomViewToggleButtonEl) {",
  );

  assert.match(statusRenderer, /status\.className = "overview-status"/);
  assert.match(statusRenderer, /appendConversationOverviewBaseStatusPills\(status, room, compactChatShell\)/);
  assert.match(statusRenderer, /appendConversationOverviewRoomStatePills\(status, room\)/);
  assert.match(statusRenderer, /appendConversationOverviewCaretakerStatusPill\(status, room\)/);
  assert.match(statusRenderer, /appendConversationOverviewRuntimeStatusPills\(status, room\)/);
  assert.match(statusRenderer, /return status/);
  assert.doesNotMatch(statusRenderer, /roomChatStatusSummary\(room\)/);
  assert.match(baseStatusAppender, /roomChatStatusSummary\(room\)/);
  assert.match(baseStatusAppender, /roomQueueSummary\(room\)/);
  assert.match(baseStatusAppender, /roomRouteLabel\(room\)/);
  assert.match(baseStatusAppender, /if \(!compactChatShell\) \{/);
  assert.match(roomStateAppender, /const roomActionPill = createRoomQuickActionPill\(room\)/);
  assert.match(roomStateAppender, /if \(roomHasDraft\(room\.id\)\) \{/);
  assert.match(caretakerStatusAppender, /const caretaker = caretakerProfile\(room\)/);
  assert.match(caretakerStatusAppender, /caretakerPendingCount\(room\) > 0 \? "warm" : "accent"/);
  assert.match(runtimeStatusAppender, /if \(isSendingMessage\) \{/);
  assert.match(runtimeStatusAppender, /if \(roomSendErrors\[room\.id\]\) \{/);
  assert.match(runtimeStatusAppender, /if \(lastRefreshErrorMessage\) \{/);
  assert.match(refreshButtonRenderer, /refreshButton\.textContent = shellPage === "admin" \? "刷新会话" : "刷新聊天"/);
  assert.match(refreshButtonRenderer, /await refreshFromGateway\(\)/);
  assert.match(exportButtonRenderer, /exportButton\.textContent = shellPage === "admin" \? "导出会话" : "导出聊天"/);
  assert.match(exportButtonRenderer, /exportCurrentConversation\(shellPage === "admin" \? "导出会话失败" : "导出聊天失败"\)/);
  assert.match(worldButtonRenderer, /worldButton\.textContent =/);
  assert.match(worldButtonRenderer, /setWorkspace\("world"\)/);
  assert.match(navigationAppender, /if \(shellPage !== "user"\) \{/);
  assert.match(navigationAppender, /actions\.appendChild\(createConversationOverviewWorldButton\(room, shellPage\)\)/);
  assert.match(navigationAppender, /governanceButton\.textContent = "更多"/);
  assert.match(actionsRenderer, /actions\.className = "overview-actions"/);
  assert.match(actionsRenderer, /actions\.appendChild\(createConversationOverviewRefreshButton\(shellPage\)\)/);
  assert.match(actionsRenderer, /actions\.appendChild\(createConversationOverviewExportButton\(shellPage\)\)/);
  assert.match(actionsRenderer, /appendConversationOverviewNavigationButtons\(actions, room, shellPage\)/);
  assert.match(actionsRenderer, /return actions/);
  assert.doesNotMatch(actionsRenderer, /document\.createElement\("button"\)/);
  assert.match(nonUserRenderer, /const status = createConversationOverviewStatusNode\(room, shellPage, compactChatShell\)/);
  assert.match(nonUserRenderer, /const actions = createConversationOverviewActionsNode\(room, shellPage\)/);
  assert.doesNotMatch(nonUserRenderer, /status\.className = "overview-status"/);
  assert.doesNotMatch(nonUserRenderer, /refreshButton\.textContent/);
  assert.doesNotMatch(nonUserRenderer, /exportButton\.textContent/);
});

test("pixel scene chrome uses shared dark rail and local time of day", async () => {
  const source = await readShellModule("app.js");
  const sharedSource = await readShellModule("shell-shared.js");
  const pixelCss = await readShellModule("styles.pixel-map.css");
  const worldCss = await readShellModule("styles.world-entry.css");
  const squareCss = await readShellModule("styles.world-square.css");
  const baseCss = await readShellModule("styles.css");
  const sceneCss = await readShellModule("styles.scene.css");
  const creativeCss = await readShellModule("styles.creative.css");

  assert.ok(baseCss.split("\n").length < 7000, "styles.css must stay reduced after split extraction");
  assert.doesNotMatch(baseCss, /2026-04-24 scene-first pixel city revision/);
  assert.doesNotMatch(creativeCss, /radial-gradient\(circle at 52% 44%, rgba\(255, 214, 139/);
  assert.match(source, /applyLocalTimeOfDayState,[\s\S]*from "\.\/shell-shared\.js";/);
  assert.match(sharedSource, /function localTimeOfDay\(date = new Date\(\)\)/);
  assert.match(sharedSource, /body\.dataset\.timeOfDay = localTimeOfDay\(date\)/);
  assert.match(pixelCss, /2026-04-28: shared IM scene chrome baseline/);
  assert.match(pixelCss, /Do not fake day scenes with light screen overlays/);
  assert.match(pixelCss, /data-time-of-day="day"[\s\S]*mix-blend-mode: normal !important/);
  assert.doesNotMatch(pixelCss, /data-time-of-day="day"[\s\S]*mix-blend-mode: screen/);
  assert.match(pixelCss, /creative-stage::before,[\s\S]*content: none !important/);
  assert.match(pixelCss, /creative-chat-frame \{[\s\S]*background: transparent !important/);
  assert.doesNotMatch(pixelCss, /creative-chat-frame \{[\s\S]{0,260}linear-gradient\(180deg, rgba\(13, 8, 5, 0\.10\)/);
  assert.match(pixelCss, /public-square-rail,[\s\S]*creative-rail[\s\S]*linear-gradient\(180deg, rgba\(22, 16, 12, 0\.96\)/);
  assert.match(sceneCss, /public-square-rail \{[\s\S]*linear-gradient\(180deg, rgba\(45, 28, 15, 0\.96\)/);
  assert.match(sceneCss, /public-square-rail \.rail-item \{[\s\S]*color: #fff2c9/);
  assert.doesNotMatch(pixelCss, /body\[data-time-of-day="day"\]\[data-shell-page="hub"\]\[data-shell-variant="public-square"\] \.public-square-stage \{[\s\S]*hub-main-city-scene-v1-day-draft\.avif/);
  assert.match(pixelCss, /body\[data-time-of-day="day"\]\[data-shell-page="hub"\]\[data-shell-variant="public-square"\] \.public-square-stage \{[\s\S]*hub-main-city-scene-v1-day-256\.png/);
  assert.match(pixelCss, /body\[data-time-of-day="day"\]\[data-shell-variant="creative-terminal"\] \.creative-stage \{[\s\S]*creative-room-scene-v2-day-256\.png/);
  assert.match(worldCss, /world-entry-rail[\s\S]*linear-gradient\(180deg, rgba\(45, 28, 15, 0\.96\)/);
  assert.match(worldCss, /body\[data-time-of-day="day"\] \.world-entry-scene::after/);
  assert.match(worldCss, /body\[data-time-of-day="day"\] \.world-entry-scene \{[\s\S]*world-metro-station-scene-v1-day-256\.png/);
  assert.doesNotMatch(worldCss, /body\[data-time-of-day="day"\][\s\S]*mix-blend-mode: screen/);
  assert.match(squareCss, /body\[data-time-of-day="day"\] \.world-square-scene/);
  assert.doesNotMatch(squareCss, /body\[data-time-of-day="day"\] \.world-square-scene::after/);
  assert.doesNotMatch(squareCss, /body\[data-time-of-day="day"\][\s\S]*mix-blend-mode: screen/);
  assert.match(sceneCss, /\.hud-title \{[\s\S]*font-family: "Noto Sans SC"/);
  assert.match(sceneCss, /\.hud-title \{[\s\S]*align-items: center/);
});

test("scene pages keep one desktop rail width and stretch the stage frame", async () => {
  const pixelCss = await readShellModule("styles.pixel-map.css");
  const publicCss = await readShellModule("styles.scene.css");
  const worldCss = await readShellModule("styles.world-square.css");

  assert.match(
    pixelCss,
    /body\[data-shell-variant="creative-terminal"\]\s+\.creative-layout\s*\{\s*grid-template-columns:\s*var\(--im-scene-rail-width,\s*220px\)\s+minmax\(0,\s*1fr\)\s*!important;/,
  );
  assert.match(
    pixelCss,
    /body\[data-shell-variant="creative-terminal"\]\s+\.creative-stage\s*\{[\s\S]*?height:\s*100%;[\s\S]*?justify-self:\s*stretch;[\s\S]*?align-self:\s*stretch;/,
  );
  assert.match(
    pixelCss,
    /body\[data-shell-variant="creative-terminal"\]\s+\.creative-stage\s*\{[\s\S]*?aspect-ratio:\s*auto !important;/,
  );
  assert.match(
    publicCss,
    /body\[data-shell-page="hub"\]\[data-shell-variant="public-square"\]\s+\.public-square-layout\s*\{[\s\S]*?grid-template-columns:\s*var\(--im-scene-rail-width,\s*220px\)\s+minmax\(0,\s*1fr\);/,
  );
  assert.match(worldCss, /\.world-square-shell\s*\{[\s\S]*?grid-template-columns:\s*var\(--im-scene-rail-width,\s*220px\)\s+minmax\(0,\s*1fr\);/);
  // 2026-06-18 用户反馈"素材没显示全"：改为完整显示 concept art（contain 零裁切），
  // 不再左偏移裁掉画里画好的侧导航。固化新设计：crop 归零、::before 不偏移、contain。
  assert.match(worldCss, /--world-square-art-left-crop:\s*0;/);
  assert.match(worldCss, /\.world-square-scene::before\s*\{[\s\S]*?left:\s*0;\s*width:\s*100%;/);
  assert.match(worldCss, /world-square-concept-20260427-256\.png"\) center \/ contain no-repeat/);
});

test("scene clear mode can be exited with Escape", async () => {
  const source = await readShellModule("shell-scene-runtime.js");

  assert.match(source, /if \(event\.key !== "Escape"\) return/);
  assert.match(source, /if \(isClearMode\(\)\) \{\s*setClearMode\(false\);/);
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
  assert.match(source, /isRailOpen: \(\) => Boolean\(sfcRailEl\?\.classList\.contains\("open"\)\)/);
  assert.match(source, /closeRail: \(\) => setSfcRailOpen\(false\)/);
  assert.match(pixelCss, /body\.rail-drawer-open\[data-shell-variant="creative-terminal"\] \.creative-shell::before/);
  assert.match(pixelCss, /body\[data-shell-variant="creative-terminal"\] \.creative-rail\.open/);
});

test("scene intro first-run hint is visible but disappears after first visit", async () => {
  const source = await readShellModule("shell-scene-runtime.js");
  const pixelCss = await readShellModule("styles.pixel-map.css");

  assert.match(source, /body\.classList\.add\("scene-intro-first"\)/);
  assert.match(pixelCss, /body\.scene-intro-first\[data-shell-variant="creative-terminal"\] \.creative-stage::after/);
  assert.match(pixelCss, /点击空白处收起界面/);
  assert.match(pixelCss, /body\.scene-intro-seen\[data-shell-variant="creative-terminal"\] \.creative-stage::after/);
}
);

test("scene chat empty row space can clear the chrome", async () => {
  const source = await readShellModule("shell-scene-runtime.js");
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

test("scene-editor link resolves active room and token at click time (no stale dm prefix)", async () => {
  const source = await readShellModule("app.js");
  const mainSource = sliceBetween(
    source,
    "async function main() {",
    "composerFormEl?.addEventListener",
  );

  // 旧残缺 "dm:" + id + ":"（缺对方 id）构造已移除：它让 scene-editor 查 /v1/shell/state
  // 永远匹配不到房间，owner 加载必空（P1 房间编辑器加载阻断）。
  assert.doesNotMatch(source, /encodeURIComponent\("dm:" \+ id \+":/);
  // 左键点击实时取当前 activeRoomId，覆盖 owner 切换房间后链接跟随当前房间。
  assert.match(source, /sceneEditorLink\.addEventListener\("click"/);
  assert.match(source, /&room=" \+ encodeURIComponent\(activeRoomId\)/);
  // session token 透传给 scene-editor（旧逻辑只传 gateway，保存会 401）。
  assert.match(source, /safeLocalStorageGet\("lobster-session-token"\)/);
  // hub 页消息网关仍是 query-only，但 scene-editor 入口可用 remembered gateway 进入编辑器。
  assert.match(source, /function sceneEditorGatewayUrl\(\) \{\s*return gatewayUrl \|\| safeLocalStorageGet\("lobster-gateway-url"\) \|\| "";/);
  assert.match(source, /const editorGatewayUrl = sceneEditorGatewayUrl\(\)/);
  assert.match(source, /const clickGatewayUrl = sceneEditorGatewayUrl\(\)/);
  assert.match(source, /function sceneEditorUrlForCurrentState\(\) \{/);
  assert.match(source, /function bindSceneEditorLink\(\) \{/);
  assert.match(mainSource, /bindSceneEditorLink\(\)/);
  assert.doesNotMatch(mainSource, /sceneEditorLink\.addEventListener/);
  assert.doesNotMatch(mainSource, /scene-editor\.html\?gateway=/);
});

test("owner-only rail visibility is enforced for logged-in residents", async () => {
  const source = await readShellModule("app.js");

  // 实现 [data-rail-visibility="owner-only"] 消费（此前为声明无消费者的 dead attribute，
  // 访客可见 scene-editor 入口）。
  assert.match(source, /function applyRailVisibility\(\)/);
  assert.match(source, /\[data-rail-visibility="owner-only"\]/);
  assert.match(source, /currentIdentity\(\) !== "访客"/);
  // 登录入口 persistSenderIdentity 与 init 加载 loadSenderIdentity 后都应用可见性。
  const persistBlock = sliceBetween(
    source,
    "function persistSenderIdentity(value) {",
    "async function refreshIdentityProjection() {",
  );
  assert.match(persistBlock, /applyRailVisibility\(\)/);
  const loadBlock = sliceBetween(
    source,
    "function loadSenderIdentity() {",
    "function persistSenderIdentity(value) {",
  );
  assert.match(loadBlock, /applyRailVisibility\(\)/);
});

test("personal room access policy control posts owner scoped session request", async () => {
  const source = await readShellModule("app.js");
  const policyModule = await readShellModule("shell-personal-room-policy.js");

  assert.match(source, /const personalRoomPolicyControlEl/);
  assert.match(source, /const personalRoomPolicyButtons/);
  assert.match(source, /from "\.\/shell-personal-room-policy\.js"/);
  assert.match(source, /personalRoomAccessPolicyControlState/);
  assert.match(source, /personalRoomAccessPolicySubmitRequestState/);
  assert.match(source, /appliedPersonalRoomAccessPolicy/);
  assert.match(policyModule, /function personalRoomAccessPolicyForRoom\(room\)/);
  assert.match(policyModule, /function personalRoomAccessPolicyControlState\(/);
  assert.match(policyModule, /function personalRoomAccessPolicySubmitRequestState\(/);
  assert.match(policyModule, /function appliedPersonalRoomAccessPolicy\(/);
  assert.doesNotMatch(source, /function personalRoomAccessPolicyForRoom\(room\)/);
  assert.match(source, /function syncPersonalRoomAccessPolicyControl\(\)/);
  assert.match(source, /async function submitPersonalRoomAccessPolicy\(policy\)/);

  const stageSyncer = sliceBetween(
    source,
    "function syncRoomStageCanvas(room) {",
    "function renderDefaultUserRoomStageCanvas() {",
  );
  assert.match(stageSyncer, /syncPersonalRoomAccessPolicyControl\(\)/);
  const policySyncer = sliceBetween(
    source,
    "function syncPersonalRoomAccessPolicyControl() {",
    "function applyRailVisibility() {",
  );
  assert.match(policySyncer, /personalRoomAccessPolicyControlState\(\{/);
  assert.match(policySyncer, /roomOwnershipForState,/);

  const refreshFinalizer = sliceBetween(
    source,
    "async function refreshFromGateway({ requireShell = false } = {}) {",
    "function startGatewayPolling() {",
  );
  assert.match(refreshFinalizer, /syncPersonalRoomAccessPolicyControl\(\)/);

  const submitSource = sliceBetween(
    source,
    "async function submitPersonalRoomAccessPolicy(policy) {",
    "async function refreshFromGateway({ requireShell = false } = {}) {",
  );
  assert.match(submitSource, /personalRoomAccessPolicySubmitRequestState\(\{/);
  assert.match(submitSource, /postGatewayJson\(requestState\.endpoint, requestState\.payload\)/);
  assert.match(submitSource, /appliedPersonalRoomAccessPolicy\(response, policy\)/);
  assert.doesNotMatch(submitSource, /PERSONAL_ROOM_ACCESS_POLICIES\.has/);
});
