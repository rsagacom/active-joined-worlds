# Longrun 2026-07-13 — TUI Gateway 合同收口

## 本轮进度

- 按用户要求冻结 `apps/lobster-web-shell/app.js`，本轮未编辑该文件。
- TUI `/dm` 已在 Gateway 配置路径下对空白 `conversation_id` fail-closed；无 Gateway 的离线 canonical fallback 保持不变。
- provider federation smoke 直接运行时也会绕过本地 HTTP 代理；在无 `NO_PROXY/no_proxy`、代理指向无效本地端口的环境下实际通过。
- auth、CLI、resident、shell dual/direct、start-terminal、restart-gateway、start-web-preview 也已统一本地代理隔离。
- provider connect/disconnect 与 world mirror source 写路由已统一补上管理 Bearer 门禁；开发/测试 fixture bypass 保持不变。
- export 路由已将 `resident_id` 绑定到 Bearer 会话，CLI export 现在复用 session token；`app.js` 既有 export Bearer 调用保持不变。
- CLI `inbox/rooms/tail` scoped GET 已补齐 user session / agent sidecar Bearer 透传；`app.js` 仍未编辑。
- CLI `read/presence` 已补齐 user session Bearer POST；agent sidecar 对 resident state 明确拒绝；`app.js` 仍未编辑。
- CLI admin `config --get`、`residents`、`rooms-admin` 已补齐 user session Bearer GET；agent sidecar 对管理只读明确拒绝；`app.js` 仍未编辑。
- CLI `search` 已切换到受保护的 `/v1/cli/search`，按身份过滤可见会话并覆盖不可见私聊拒绝；旧 H5 全局搜索端点与 `app.js` 均保持冻结。
- TUI 新增 `/search <关键词>`，按当前 active conversation 的 `room_id` 调用 `/v1/cli/search`，沿用 user session / agent sidecar Bearer，并将命中结果投影为终端通知；旧 H5 全局搜索端点与 `app.js` 继续冻结。
- resident mainline smoke 现在真实执行 TUI `/search`，TUI smoke script 支持脚本结束后的 plain/json 投影；脚本断言当前私聊搜索命中，`app.js` 继续冻结。
- web-shell smoke 移除 Node `--test-force-exit`，修复返回 0 但只跑 1280 tests 的静默漏测；当前 smoke 与 npm unit 均报告 1310。
- Gateway 全新生产 state 不再自动写入 demo 聊天记录；只有测试构建或显式 `LOBSTER_DEV_AUTH_BYPASS=1` fixture 才会 seed，避免正式 H5/导出看到伪造消息。
- 队列与检查点已同步为 T019-6 / T019-7 / T019-8 / T019-9 / T019-10 / T019-11 / T019-12 / T019-13 / T019-14 / T019-15 / T019-16 / T019-17 / T019-18。

## 改动文件

- `apps/lobster-tui/src/terminal_submission.rs`
- `apps/lobster-tui/src/tests.rs`
- `scripts/smoke-provider-federation.sh`
- `scripts/test_smoke_provider_federation_unit.py`
- `scripts/smoke-auth-registration.sh`
- `scripts/smoke-cli-channel.sh`
- `scripts/smoke-resident-mainline.sh`
- `scripts/smoke-shell-dual-http.sh`
- `scripts/smoke-shell-direct-http.sh`
- `scripts/start-terminal.sh`
- `scripts/restart-gateway.sh`
- `scripts/start-web-preview.sh`
- `apps/lobster-waku-gateway/src/http_router.rs`
- `apps/lobster-waku-gateway/src/gateway_tests.rs`
- `apps/lobster-waku-gateway/src/http_read_routes.rs`
- `apps/lobster-cli/src/auth.rs`
- `apps/lobster-cli/src/main.rs`
- `apps/lobster-cli/tests/gateway_integration.rs`
- `apps/lobster-cli/USAGE.md`
- `scripts/test_smoke_cli_channel_unit.py`
- `apps/lobster-waku-gateway/src/cli_runtime.rs`
- `apps/lobster-waku-gateway/src/http_read_routes.rs`
- `checkpoints/task-queue.json`
- `scripts/test_smoke_resident_mainline_unit.py`
- `apps/lobster-tui/src/terminal_smoke_script.rs`
- `apps/lobster-tui/src/terminal_snapshot.rs`
- `scripts/smoke-web-shell.sh`
- `scripts/test_smoke_web_shell_unit.py`
- `apps/lobster-waku-gateway/src/core_runtime.rs`
- `apps/lobster-waku-gateway/src/gateway_tests.rs`
- `scripts/test_start_terminal.py`
- `scripts/test_start_terminal_unit.py`
- 对应脚本单测
- resident mainline 与 terminal smoke 的 scoped GET 也已补 session token；terminal OTP 使用无代理 opener。
- `docs/ACTIVE_WORK_QUEUE.md`
- `checkpoints/task-queue.json`

## 验证

- TDD 红灯：空白 `conversation_id` 原先被当作成功返回。
- TDD 绿灯：`cargo test -p lobster-tui dm_gateway_ --quiet`。
- `cargo test -p lobster-tui`：230 passed / 0 failed（含 TUI scoped search parity）。
- resident mainline smoke：真实执行 TUI `/search` 并断言当前私聊命中。
- `scripts/smoke-web-shell.sh`：1310 passed / 0 failed。
- `cargo test -p lobster-waku-gateway --quiet`：294 passed / 0 failed。
- `cargo test -p lobster-cli --quiet`：119 unit + 24 integration passed / 0 failed。
- `cargo test --workspace --quiet`：通过，Gateway 294、CLI 119 unit + 24 integration、TUI 230。
- `apps/lobster-web-shell/npm test`：1310 passed / 0 failed，layout 与 realness 通过。
- `cargo fmt --all -- --check`、`cargo clippy --workspace -- -D warnings`：通过。
- CLI channel、resident mainline、terminal smoke：在无效本地代理环境下通过。
- `RUN_PREFLIGHT=0 INCLUDE_PROVIDER_FEDERATION=1 SKIP_BUILD=1 ... scripts/smoke-release-gate.sh`：通过，provider federation included。
- `SKIP_BUILD=1 scripts/smoke-cli-channel.sh`：通过，文本/JSON scoped search 与既有 send/edit/recall/follow 覆盖通过。
- Gateway 生产 binary `LOBSTER_DEV_AUTH_BYPASS=0` 新 state：shell state 返回 0 条消息；显式 `LOBSTER_DEV_AUTH_BYPASS=1` fixture：demo lobby 消息可见。
- `cargo test -p lobster-waku-gateway --quiet`：294 passed / 0 failed；`cargo clippy -p lobster-waku-gateway -- -D warnings` 与 `cargo fmt --all -- --check`：通过。

## 2026-07-14 继续推进

- 保持 `apps/lobster-web-shell/app.js` 冻结，本轮只加固 Gateway 合同。
- 新增 `core_admin_write_routes_require_bearer_auth_without_dev_bypass`，覆盖核心 `/v1/admin/*` 写路由的缺失 Bearer 回归矩阵，避免后续路由漏鉴权。
- 新增 `city_and_governance_write_routes_require_bearer_session_without_dev_bypass`，覆盖城市与世界治理写路由的缺失 Bearer 回归矩阵。
- 验证：Gateway 297 passed / 0 failed；`cargo fmt --all -- --check`、Gateway clippy、`git diff --check` 通过；workspace 与 web-shell 基线在本轮开始时已分别通过。
- 新增 T019-21：web 双浏览器 smoke 记录真实 console/pageerror/requestfailed 并在出现时失败；消息重试故意返回的 503 明确标记为 expected。补齐 fake-dom 的 `shell-quick-action-reader.js` 导入映射，恢复 Node 测试中的临时模块解析。
- 验证：fake-dom import rewrite 3 passed；双浏览器 smoke 连续 2 次通过；`npm test` 通过（unit/layout/realness）。
- 新增 T019-22：补齐 `/v1/personal-room`、`/v1/personal-room/access-policy`、居民关系 request/accept，以及 `/v1/shell/nickname` 的缺失 Bearer 回归矩阵。
- 验证：Gateway 298 passed / 0 failed；`cargo fmt --all -- --check`、Gateway clippy、`git diff --check` 通过。
- 当前态全量复验：`cargo test --workspace --quiet` 通过（Gateway 298、CLI 119 unit + 24 integration、TUI 230）；`apps/lobster-web-shell/npm test` 1310 passed；带 provider federation 的 `RUN_PREFLIGHT=0 SKIP_BUILD=1 scripts/smoke-release-gate.sh` 通过。
- 新增 T019-23：release gate 非 `SKIP_BUILD` 路径新增 workspace Rust tests，顺序为 fmt → workspace tests → clippy → build；完整构建门禁（含 provider federation）通过。

## 下一轮目标

继续从 `app.js` 之外审查 Gateway/TUI/CLI 合同与发布鲁棒性；不扩大到前端 DS 拆分。
