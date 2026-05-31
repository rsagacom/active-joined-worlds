# DS Next Goal Handoff 2026-05-31

适用对象：DeepSeek v4 pro / Claude Code / CC 框架。

本文是下一轮 `/goal` 长任务的必读文件。它基于 Codex 在 2026-05-31 对当前项目的实际验收结果整理，不是旧计划。

## 0. 当前实际验收结论

项目路径：

- `/Volumes/AJW-Data/Projects/lobster-chat`

当前测试基线已在本机复跑通过：

- `cargo test -p lobster-waku-gateway`：173 passed / 0 failed
- `cargo test -p lobster-tui`：195 passed / 0 failed
- `cd apps/lobster-web-shell && npm test`：528 passed / 0 failed
- `cd apps/lobster-web-shell && npm run smoke:dual-browser`：passed
- JS 语法检查：`app.js`、`admin-ds.js`、所有 `shell-*.js` 通过

当前主要进展：

- `app.js` 已拆到约 9124 行，已有多个 `shell-*.js` 模块。
- Gateway 单城 IM 合同、presence/read/message/admin 边界测试明显增强。
- `admin-ds.html` 已能连接当前源码临时 gateway 显示真实 summary / resident / room / message 数据。
- H5 点击发送按钮可以真实发消息，输入框会清空，自己消息在右侧。

## 1. 必须优先处理的 P0

### P0-1. 建立 git 安全快照

当前外盘项目目录不是 git 仓库，`git status` 会失败。这是最高风险。

要求：

1. 不要删除任何文件。
2. 先做外盘完整备份到 `/Volumes/AJW-Data/Backups/`，目录名建议：
   - `/Volumes/AJW-Data/Backups/lobster-chat-pre-git-20260531-HHMM`
3. 再在 `/Volumes/AJW-Data/Projects/lobster-chat` 初始化 git 仓库或恢复可用 git 仓库。
4. 加好 `.gitignore`，至少排除：
   - `target/`
   - `node_modules/`
   - `apps/lobster-web-shell/node_modules/`
   - `apps/lobster-web-shell/screenshots/`
   - `apps/lobster-web-shell/test-results/`
   - 系统临时文件 `.DS_Store`
5. 做一次首个安全提交，commit message 建议：
   - `chore: snapshot lobster chat current working state`
6. 提交前后都要运行测试或至少记录为什么暂不运行。

验收：

- `git status --short --branch` 能正常运行。
- 有至少一个 commit。
- 备份路径存在。
- 不把 `target/`、`node_modules/`、截图产物、大文件缓存提交进去。

### P0-2. 修正/规整本地预览网关启动

Codex 验收发现：`127.0.0.1:8787` 上常驻的是 2026-05-25 启动的旧进程，`/health` 正常但 `/v1/shell/state` 和 `/v1/admin/summary` 返回 404。当前源码临时启动到 `18787` 时这些端点正常。

要求：

1. 不要盲目 kill 无关进程。
2. 识别 `8787` 旧网关进程，确认它确实是 lobster-chat 的旧 `target/debug/lobster-waku-gateway`。
3. 提供安全的启动/重启脚本或文档，让预览默认使用当前源码构建的 gateway。
4. 不要让前端预览继续指向过期 gateway。

验收：

- 当前源码 gateway 启动后：
  - `GET /health` 返回 ok
  - `GET /v1/shell/state?resident_id=qa-a` 返回 200 JSON
  - `GET /v1/admin/summary` 返回 200 JSON
- 给出稳定预览地址。

### P0-3. 修复或明确 H5 Enter 发送策略

Codex 浏览器验收发现：

- 点击 `#composer-send` 可以发送，输入框清空。
- 在当前窄视口/移动布局下，按 Enter 只是换行，不发送。
- 代码位置：`apps/lobster-web-shell/app.js` 中 `handleComposerInputKeydown`，移动/窄屏 scene composer 会直接 return。

产品要求需要统一：

- 如果 PC / 桌面宽度：Enter 发送，Shift+Enter 换行。
- 如果移动端：可以保留按钮发送，但 UI 文案不能写“Enter 发送”造成误导。
- 如果窄视口但外接键盘场景也要支持 Enter 发送，需要调整判断规则。

要求：

1. 先读现有测试，不要只改代码。
2. 增加真实覆盖：至少覆盖 desktop Enter 发送、mobile/scene composer 策略和提示文案一致性。
3. 修复后用真实浏览器或 Playwright 验证。

验收：

- 点击发送正常。
- Enter 策略与 UI 提示一致。
- `npm test` 和相关 browser smoke 通过。

## 2. P1 后续推进

### P1-1. admin-ds 后台写操作继续真实化

当前仍有 disabled 操作：

- 消息审核：通过 / 屏蔽 / 标记已处理
- 邀请码：作废
- 日志：标记已处理
- 部分权限/成员管理

要求：

1. 不要做假 UI 成功态。
2. 若 Gateway 没有写接口，先补最小后端合同和测试，再接前端。
3. 所有写操作必须有：
   - 权限/禁用原因
   - 加载态
   - 失败反馈
   - 成功后刷新真实 Gateway 数据
4. 优先做“消息审核”或“邀请码作废”中的一个完整闭环，不要一口气铺很多半成品。

验收：

- 至少一个新的后台写操作端到端可用。
- Gateway 黑盒测试通过。
- admin-ds 前端测试通过。

### P1-2. app.js 继续安全拆分，但必须低风险

要求：

1. 严禁批量脚本按行号大删。
2. 每次只提取纯函数或低耦合模块。
3. 每轮都要先备份、后测试。
4. 不要动大段 DOM 事件绑定，除非先补测试。

推荐优先级：

- `renderTimeline` 相关纯数据 helper
- auth 表单状态 helper
- gateway URL / POST helper 收束
- submit handler 重复模板收束

验收：

- `app.js` 行数下降不是唯一目标；稳定性优先。
- `npm test` 必须通过。
- 新模块必须有对应单测。

## 3. 固定验收命令

每轮结束必须运行或说明未运行原因：

```bash
cd /Volumes/AJW-Data/Projects/lobster-chat
cargo test -p lobster-waku-gateway
cargo test -p lobster-tui
cd apps/lobster-web-shell
npm test
npm run smoke:dual-browser
```

必要时补：

```bash
node -c apps/lobster-web-shell/app.js
node -c apps/lobster-web-shell/admin-ds.js
for f in apps/lobster-web-shell/shell-*.js; do node -c "$f" || exit 1; done
```

## 4. 结束记录

每轮结束更新：

- `/Volumes/AJW-Data/Projects/lobster-chat/docs/ACTIVE_WORK_QUEUE.md`
- `/Volumes/AJW-Data/Projects/lobster-chat/checkpoints/task-queue.json`
- `/Users/rsaga/Desktop/lobster-chat-longrun.md`

记录必须包含：

- 做了什么
- 改了哪些文件
- 测试结果
- 还剩什么
- 发现的风险

