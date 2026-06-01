# Codex DS v4 Pro 最终交付计划 — lobster-chat IM 项目

> 本文件为 Codex 单模执行计划。启动时自动读取全局记忆后执行。四阶段顺序推进。

## 全局记忆入口
/Users/rsaga/.codex/memories/PROFILE.md → ACTIVE.md → CODEX_RETROSPECTIVE_GUIDE_20260527.md

## 当前基线 (2026-06-01)
Gateway: 176 tests / 38 端点 / 0 警告 | Web Shell: 538 tests / 7 页面 / 9020 行 app.js
完成: IM 主路径 / Auth / Admin 审核 / 左边栏 / 热点 / 房间定制读侧 / Presence 持久化

## 执行模式
Codex 单模 DS v4 pro，四阶段顺序。每阶段: 现状审计→P1需求→P2设计→P3编码→P4测试→P5审查→P6交付。
每阶段完成后更新 project-state.md。并行用后台 shell 进程 (`exec_command &`) 处理独立子任务。

## Phase 1: 后端收官 — Gateway 写端点补齐

新增 3 组端点:
1. 邀请码: POST /v1/admin/invites (生成), POST /v1/admin/invites/revoke (作废)
2. 成员管理: POST /v1/admin/rooms/members (添加/移除)
3. 日志处理: POST /v1/admin/logs/handle (标记已处理)

每个端点: gateway_models.rs + http_write_routes.rs + http_router.rs + gateway_tests.rs ≥2 测试

涉及文件: gateway_models.rs, http_write_routes.rs, http_router.rs, gateway_tests.rs, shell_runtime.rs
验收: cargo test -p lobster-waku-gateway → ≥190 tests, cargo build → 0 warnings

## Phase 2: 前端收官 — admin-ds 写按钮接通

消除 admin-ds.js 中所有 markUnavailableButton:
- "管理成员" → 接 Phase 1 端点
- "作废邀请码" → 接 Phase 1 端点
- "标记已处理"(日志) → 接 Phase 1 端点

每个按钮: fetch + loading/success/error 三态 + 成功后刷新真实数据

涉及文件: admin-ds.js, admin-ds.html, test/admin-ds-runtime.test.mjs
验收: admin-ds.js grep markUnavailableButton → 0, npm test 全过

## Phase 3: 质量收官 — 打磨与减债

1. app.js 9020 → <8700: 提取 2 个低耦合纯函数模块, 每个带测试
2. TUI 测试: 确认 cargo test -p lobster-tui 真实跑 181 tests
3. 页面状态: 每个 HTML 有空状态/加载态/错误态
4. Rust 零警告: 保持

涉及文件: app.js, shell-*.js(新), styles.css, test/*.mjs
验收: app.js <8700, TUI 181 tests, 页面无白屏

## Phase 4: 交付收官 — 部署与文档

1. README: 项目介绍+截图+快速开始+API 目录+架构
2. 部署文档: 单机步骤/环境/配置
3. CI: .github/workflows/ci.yml 覆盖三端
4. Release: 打包脚本/CHANGELOG
5. Git: 外盘项目 init + 首次安全 commit + .gitignore

涉及文件: README.md, docs/DEPLOYMENT.md, .github/workflows/ci.yml, scripts/
验收: README 可独立阅读, CI 全绿, git log 有 commit

## 固定验收命令

cd /Volumes/AJW-Data/Projects/lobster-chat
cargo test -p lobster-waku-gateway && cargo test -p lobster-tui
cd apps/lobster-web-shell && npm test
node -c app.js && for f in shell-*.js; do node -c "$f" || exit 1; done

## 禁止事项

不删重要文件 | 不批量大删 app.js | H5 不绕过 Gateway | Cargo.toml 作者保持 "lobster-chat contributors"
不提交构建产物 | 不改 TTS/OpenClaw/ZeroClaw | 不宣称完成除非测试已跑过
