# Conversation Shell Action Templates Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `conversation_shell` 合同显式承载 quick-action 输入模板，使 `lobster-web-shell` 先读合同、再回退本地默认。

**Architecture:** 保持现有 quick-action 行为和 UI 不变，只给 gateway 的 `conversation_shell` 增加一个轻量 `action_templates` 注册表，并让 `lobster-web-shell` 用它驱动模板注入与状态模板切换。H5 现有的私有模板逻辑保留为兼容回退，不在这一轮重做整套动作语义系统。

**Tech Stack:** Rust gateway structs/tests, 原生浏览器 DOM, `node:test`, JSON contract fixture

---

## File Map

- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/gateway_models.rs`
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/shell_runtime.rs`
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/gateway_tests.rs`
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/app.js`
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/generated/state.contract.json`
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/test/user-shell-init.test.mjs`

## Task 1: 写失败测试锁定合同模板优先级

**Files:**
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/gateway_tests.rs`
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/test/user-shell-init.test.mjs`
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/generated/state.contract.json`

- [ ] **Step 1: 给合同 fixture 增加自定义 action template 数据**

把 `generated/state.contract.json` 里的 `conversation_shell` 扩成带有自定义模板内容的合同，用明显不同于 H5 私有默认值的文案，例如：

- `委托` 默认模板不再是 `委托：`
- `已回执` 状态模板也使用不同字段名

- [ ] **Step 2: 写 gateway 失败测试锁定 action_templates 输出**

新增 Rust 测试，断言：

- `conversation_shell.action_templates` 存在
- 至少包含 `委托`
- `委托` 的默认模板和状态模板被序列化

- [ ] **Step 3: 写 H5 失败测试锁定“合同优先于私有默认”**

新增 JS 测试，断言在只加载 `generated/state.contract.json` 时：

- 点击 `委托` 按钮，composer 注入的是合同模板而不是私有默认模板
- 点击 workflow 里的 `已回执` 阶段，composer 注入的是合同里的状态模板

- [ ] **Step 4: 跑目标测试并确认失败**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-waku-gateway shell_state_contract_exposes_action_templates -- --exact
cd /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell
node --test test/user-shell-init.test.mjs --test-name-pattern "contract action templates"
```

Expected:

- Rust 测试因字段不存在或值缺失失败
- JS 测试因仍使用私有默认模板失败

## Task 2: 最小实现 gateway 合同注册表

**Files:**
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/gateway_models.rs`
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/shell_runtime.rs`

- [ ] **Step 1: 定义 action template 合同结构**

新增轻量结构，至少包含：

- `action`
- `draft_template`
- 可选 `state_templates`

- [ ] **Step 2: 把 action_templates 挂进 conversation_shell**

`ConversationShellState` 序列化时输出统一注册表，而不是散落在 H5 私有逻辑里。

- [ ] **Step 3: 生成当前已支持动作的默认模板与状态模板**

至少覆盖：

- `续聊`
- `私聊`
- `整理`
- `留条`
- `委托`
- `交易`

- [ ] **Step 4: 跑 Rust 目标测试确认通过**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-waku-gateway shell_state_contract_exposes_action_templates -- --exact
```

Expected:

- 新增 gateway 合同测试通过

## Task 3: 让 H5 先读合同模板再回退私有默认

**Files:**
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/app.js`
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/test/user-shell-init.test.mjs`

- [ ] **Step 1: 在 app.js 建合同模板 lookup**

从 `state.conversation_shell.action_templates` 建索引，提供：

- 默认模板读取
- 状态模板读取
- 缺字段时回退到现有 `QUICK_ACTION_BLUEPRINTS`

- [ ] **Step 2: 替换模板注入入口**

至少让以下路径先读合同：

- `quickActionTemplate`
- `quickActionWorkflowTemplate`
- card action 点击
- inline action / workflow stage 点击

- [ ] **Step 3: 跑 H5 目标测试确认通过**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell
node --test test/user-shell-init.test.mjs --test-name-pattern "contract action templates"
```

Expected:

- 合同模板优先测试通过

## Task 4: 做小范围回归

**Files:**
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/generated/state.contract.json`

- [ ] **Step 1: 跑 gateway 相关测试**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-waku-gateway shell_state_contract_exposes
```

- [ ] **Step 2: 跑 web shell 测试**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell
node --test test/user-shell-init.test.mjs
```

- [ ] **Step 3: 记录实际通过范围与剩余缺口**

如果还有未合同化但仍留在 H5 私有逻辑里的 quick-action 语义，只记录为下一步，不在本轮继续扩张。
