# lobster-chat H5 Frontend Visual QA Follow-ups for CC

日期：2026-04-18  
适用对象：`CC / GLM5` 前端线程  
范围：只做 `H5` 视觉、响应式、页面表现和前端消费层修订  
不要碰：Rust 后端合同定义、产品边界、前端私有 canonical state

---

## 1. 当前验收结论

本轮前端已经通过：

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat && node --test apps/lobster-web-shell/test/*.mjs
```

结果：
- `35 / 35 pass`

本轮浏览器验收也已经补跑过，且当前真实浏览器首屏不再出现：
- bare module import 崩溃
- `hub` 页标题被 runtime 改写
- `hub` 页偷偷拿本地 remembered / bootstrap gateway 去轮询

我这边已经先修掉的前端验收回归：
- [app.js](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/app.js)
- [pretext-stage.js](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/pretext-stage.js)
- [test/fake-dom.mjs](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/test/fake-dom.mjs)
- [test/hub-shell-init.test.mjs](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/test/hub-shell-init.test.mjs)
- [test/shell-pages-static.test.mjs](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/test/shell-pages-static.test.mjs)
- [test/user-shell-init.test.mjs](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/test/user-shell-init.test.mjs)
- [index.html](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/index.html)
- [user.html](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/user.html)
- [admin.html](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/admin.html)
- [unified.html](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/unified.html)

补充说明：
- `user.html` 在真实浏览器里曾有一条 node 测试看不见的回归：带 gateway 参数启动时，会因为缺少 `provider-url-input` 而在 `refreshGatewayBadge()` 崩溃。
- 这条现在已经修掉，并且加了回归测试。
- 四个壳页也都补了 favicon，真实浏览器控制台现已是 `0 error / 0 warning`。

所以你下一轮不用再处理这些启动级 bug，直接做视觉和响应式收口。

---

## 2. 浏览器截图证据

这轮视觉 QA 截图在：
- [/Users/rsaga/Documents/Playground/lobster-chat/output/playwright/visual-qa-20260418](/Users/rsaga/Documents/Playground/lobster-chat/output/playwright/visual-qa-20260418)

重点看这几张：
- hub：
  - [/Users/rsaga/Documents/Playground/lobster-chat/output/playwright/visual-qa-20260418/hub-desktop.png](/Users/rsaga/Documents/Playground/lobster-chat/output/playwright/visual-qa-20260418/hub-desktop.png)
- user：
  - [/Users/rsaga/Documents/Playground/lobster-chat/output/playwright/visual-qa-20260418/user-desktop.png](/Users/rsaga/Documents/Playground/lobster-chat/output/playwright/visual-qa-20260418/user-desktop.png)
  - [/Users/rsaga/Documents/Playground/lobster-chat/output/playwright/visual-qa-20260418/user-mobile.png](/Users/rsaga/Documents/Playground/lobster-chat/output/playwright/visual-qa-20260418/user-mobile.png)
- admin：
  - [/Users/rsaga/Documents/Playground/lobster-chat/output/playwright/visual-qa-20260418/admin-desktop.png](/Users/rsaga/Documents/Playground/lobster-chat/output/playwright/visual-qa-20260418/admin-desktop.png)
- unified：
  - [/Users/rsaga/Documents/Playground/lobster-chat/output/playwright/visual-qa-20260418/unified-desktop.png](/Users/rsaga/Documents/Playground/lobster-chat/output/playwright/visual-qa-20260418/unified-desktop.png)
  - [/Users/rsaga/Documents/Playground/lobster-chat/output/playwright/visual-qa-20260418/unified-mobile.png](/Users/rsaga/Documents/Playground/lobster-chat/output/playwright/visual-qa-20260418/unified-mobile.png)

---

## 3. CC 下一批任务

### A. Hub 页视觉重做

目标：
- 仍保留当前 3 个入口卡片结构
- 但修掉当前 `hub` 页的两个明显问题：
  - 亮底 + 过浅文字，首屏可读性不足
  - 顶部内容量太少，下面留白过大，页面像没做完

要求：
- 不改入口文案结构和页面用途
- 不引入新状态逻辑
- 只改 HTML/CSS 表现层

优先文件：
- [index.html](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/index.html)
- [styles.css](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/styles.css)

### B. `user / admin / unified` 响应式收口

目标：
- 重点看移动端和窄屏
- 确保首屏先看到主要聊天内容，而不是碎裂的边栏残片
- 列与列之间的折叠顺序要明确，不要只是硬挤

要求：
- user 页：优先保证 `房间列表 -> scene / 消息 -> detail / composer` 的可理解切换
- admin / unified 页：优先保证“会话在前，治理在后”的线性关系
- 不允许为了移动端再长一套前端私有状态

优先文件：
- [user.html](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/user.html)
- [admin.html](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/admin.html)
- [unified.html](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/unified.html)
- [styles.css](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/styles.css)
- [app.js](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/app.js)

### C. 页面层视觉一致性整理

目标：
- `user / admin / unified / hub` 四页要看起来属于同一个产品，而不是 4 个独立 demo
- 保持当前“聊天在前”的结构，不要重新做大而杂的控制台感

重点：
- topbar 层级
- panel 间距
- badge / pill 对比度
- 亮底卡片和暗底外壳的关系
- composer 和 detail-card 的视觉层级

---

## 4. 明确不要做的事

1. 不改 `gateway` 合同字段定义  
2. 不新增前端私有 canonical state  
3. 不继续扩张治理产品面  
4. 不重写整体架构  
5. 不把视觉问题通过 sample 私货状态硬糊过去  

---

## 5. 交付要求

CC 下一轮提交时，请同时给出：

1. 改动文件列表  
2. 哪些页面完成了视觉修订  
3. 哪些问题是移动端修的，哪些是桌面端修的  
4. 实际跑过的测试命令  
5. 新的浏览器截图路径

至少重跑：

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat && node --test apps/lobster-web-shell/test/*.mjs
```

如果你做了响应式/视觉大改，建议再补一轮真实浏览器截图。
