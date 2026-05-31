# web-shell Quick Action Templates Design

## Goal

把 `lobster-web-shell` 右栏的 `quick action` 从“只写一个前缀到输入框”推进成“带模板的聊天动作入口”，让 `整理 / 留条 / 委托 / 交易` 这类按钮在真实聊天流里具备更明确的工作流手感。

第一版不做新的页面、不做复杂表单、不把动作变成独立任务系统。它仍然是聊天输入的一层薄引导，但会把动作语义带进消息对象和时间线展示里。

## Scope

这次只改 `user shell` 已有的房间聊天链路：

- 点击动作按钮时，根据动作名注入不同模板
- 发送时把当前动作写入消息对象
- 时间线里把动作作为轻量标签展示出来
- 发送后清除当前动作，恢复普通聊天状态

这次不做：

- 新的消息类型协议
- 独立任务卡片 / 表单提交
- 后端持久化 schema 变更
- H5 之外的 `TUI` / `CLI` 改造

## Current Problem

当前右栏动作按钮虽然已经有 `续聊 / 整理 / 留条 / 私聊 / 委托 / 交易`，但它们本质上还是同一种行为：

- 把 `动作名：` 填进输入框
- 更新 tip 文案
- 高亮当前按钮

这样能证明交互挂上了，但还没有真正把“动作”做成可区分的聊天工作流。尤其是 `整理 / 留条 / 委托 / 交易` 这些动作，本来应该天然提示不同的输入结构和结果预期。

## Option Comparison

### Option A: 保持当前前缀方案，只补文案

优点：

- 改动最小

缺点：

- 用户手感几乎没有提升
- 动作和普通聊天仍然难区分
- 时间线看不出“这条消息是整理、委托还是留条”

### Option B: 引入模板化 quick action，并在消息对象上保留动作标识

做法：

- 建一张动作配置表
- 简单动作继续用单行前缀
- 结构化动作写入多行模板
- 发送时在消息对象里带 `quick_action`
- 时间线 header 展示轻量动作 chip

优点：

- 手感明显更像真实工作流
- 改动仍局限在现有 `web-shell`
- 为后续更重的 workflow 留出自然升级点

缺点：

- 需要轻微扩展消息渲染逻辑

### Option C: 直接把每个动作做成独立卡片表单

优点：

- 更像最终产品

缺点：

- 范围过大
- 会把 `web-shell` 从聊天壳层直接推成表单系统
- 不符合这轮“小步逼近原型”的节奏

## Decision

采用 Option B。

也就是：

- `续聊 / 私聊` 继续使用单行前缀
- `整理 / 留条 / 委托 / 交易` 改成多行模板
- 消息对象带上 `quick_action`
- 时间线显示动作标识，但消息主体仍然是普通聊天正文

## Behavior Design

### 1. 动作模板

第一版模板保持短小、能直接改写，不做强校验：

- `续聊` -> `续聊：`
- `私聊` -> `私聊：`
- `整理` -> 
  ```text
  整理：
  - 目标：
  - 待办：
  - 风险：
  ```
- `留条` ->
  ```text
  留条：
  - 留给：
  - 内容：
  - 提醒：
  ```
- `委托` ->
  ```text
  委托：
  - 需求：
  - 截止：
  - 交付：
  ```
- `交易` ->
  ```text
  交易：
  - 标的：
  - 数量：
  - 备注：
  ```

### 2. 发送行为

发送时：

- 正文仍然走现有 `text`
- 额外把当前动作写进消息对象的 `quick_action`
- 本地预览与 pending echo 也保留同样字段
- 发送成功或失败后的恢复逻辑沿用现有草稿和动作清理规则

### 3. 时间线展示

时间线里的消息 header 增加一个轻量动作 chip：

- `整理`
- `留条`
- `委托`
- `交易`
- `续聊`
- `私聊`

这个 chip 只承担“识别这条消息的工作流类型”，不改变消息主排版。

## Files

- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/app.js`
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/styles.css`
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/test/user-shell-init.test.mjs`

## Testing

至少覆盖：

1. `home` 房间点击 `整理` 后写入多行模板
2. 发送 `整理` 模板后，时间线出现动作 chip
3. `city` 房间点击 `委托` 后写入多行模板
4. 发送后当前动作清空，按钮 active 状态恢复

## Notes

这次设计故意不引入新的协议边界。`quick_action` 只是 `web-shell` 里的轻量消息元数据，用来让聊天动作更像原型里的工作流入口，而不是新的任务系统。
