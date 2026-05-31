# web-shell Quick Action Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `lobster-web-shell` 的 `quick action` 具备模板化输入和时间线动作标识，而不是只写一个普通前缀。

**Architecture:** 保持现有 `user shell` 和消息流结构不变，只在 `app.js` 增加动作配置、模板注入、发送时附带 `quick_action` 元数据，并在时间线 header 渲染一个轻量动作 chip。样式只做局部补充，不新开页面、不引入新 schema。

**Tech Stack:** 原生浏览器 DOM、`node:test`、现有 fake DOM harness、`lobster-web-shell` CSS

---

## File Map

- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/app.js`
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/styles.css`
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/test/user-shell-init.test.mjs`

## Task 1: 写失败测试锁定模板化动作行为

**Files:**
- Test: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/test/user-shell-init.test.mjs`

- [ ] **Step 1: 写 `整理` 模板失败测试**

补一条测试，断言：

- 点击 `整理` 后 `#composer-input` 不是单纯 `整理：`
- 输入框里包含 `- 目标：`、`- 待办：`、`- 风险：`
- `composer-tip` 仍显示当前动作

- [ ] **Step 2: 写 `委托` 模板失败测试**

补一条测试，断言：

- 切到 `city` 房间后点击 `委托`
- 输入框包含 `- 需求：`、`- 截止：`、`- 交付：`

- [ ] **Step 3: 写发送后时间线动作 chip 的失败测试**

断言：

- 提交 `整理` 模板后，时间线最后一条自发消息出现动作 chip
- 发送后按钮 active 状态被清掉
- `composer-tip` 不再显示当前动作

- [ ] **Step 4: 运行目标测试确认失败**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell
node --test test/user-shell-init.test.mjs
```

Expected:

- 新增断言失败，因为当前实现只会写入 `动作名：`

## Task 2: 最小实现模板注入和动作元数据

**Files:**
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/app.js`

- [ ] **Step 1: 增加动作配置表**

新增一个集中配置，至少包含：

- `label`
- `template`
- 是否需要多行模板

- [ ] **Step 2: 点击动作按钮时使用模板**

规则：

- `续聊 / 私聊` 保持单行
- `整理 / 留条 / 委托 / 交易` 使用多行模板
- 仍沿用现有 active 状态与 tip 更新逻辑

- [ ] **Step 3: 发送时把动作带进消息对象**

本地消息和 pending echo 都要写入：

```js
quick_action: "整理"
```

- [ ] **Step 4: 运行目标测试确认通过**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell
node --test test/user-shell-init.test.mjs
```

Expected:

- 新增模板测试通过

## Task 3: 补时间线动作 chip 样式并做全量回归

**Files:**
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/app.js`
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/styles.css`

- [ ] **Step 1: 在消息 header 渲染动作 chip**

只在有 `quick_action` 时渲染，系统消息不受影响。

- [ ] **Step 2: 补动作 chip 样式**

要求：

- 在 `user shell` 下清晰可见
- 不抢时间戳和 sender 的视觉主位
- pending/failed 自发消息也能复用

- [ ] **Step 3: 跑全量测试**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell
node --test
cd /Users/rsaga/Documents/Playground/lobster-chat
./scripts/smoke-web-shell.sh
```

Expected:

- `node --test` 全绿
- `smoke-web-shell.sh` 全绿
