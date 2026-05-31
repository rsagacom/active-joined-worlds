# SDLC 项目状态（活文档 — 持续更新）

> **COMPACTION 保护区域。** 唯一状态存储，通过 CLAUDE.md @import 加载。升级时不被覆盖。

```yaml
# 项目级（跨任务持久化）
project_roadmap: "IM 后端收尾：presence/unread 持久化 + SSE 在线广播 + 速率限制骨架"
completed_tasks:
  - "Phase 1-4: Shell/Waku/CLI/World 端点 + Admin 读端点"
  - "P2: 9 个 admin 写端点 + scene/validate 全部实现编译通过"
  - "P3: 11 个新集成测试，134 tests / 0 failures"
  - "管理后台后端闭环 P1-P5: 9 admin 端点 + 134 tests, 2026-05-25"
  - "IM 后端收尾 P1-P5: presence/unread 持久化 + SSE 广播 + 速率限制 + 5 缺口补齐, 144 tests"
global_architecture:
  - "Gateway 是唯一合同真源，H5/TUI/CLI 只消费不制造 canonical state"
  - "presence/unread 当前纯内存，需补齐文件持久化"

# 当前任务
current_phase: P5  # P0-P5
task_description: "补齐 presence/unread 文件持久化、SSE 在线状态广播、消息发送速率限制骨架"
started_at: "2026-05-25T23:40:00"
last_updated: "2026-05-25T23:50:00"
prd_file: ".claude/prd.md"
architecture_decisions:
  - "presence/unread 持久化复用 governance-state.json 的 JSON 文件模式，不引入新依赖"
  - "速率限制用 HashMap<String, RateLimitState> 纯内存实现，不持久化，重启清零"
  - "SSE 广播仅在线状态翻转时触发（离线↔在线），心跳刷新不广播"
modified_files:
  - "apps/lobster-waku-gateway/src/gateway_models.rs"
  - "apps/lobster-waku-gateway/src/core_runtime.rs"
  - "apps/lobster-waku-gateway/src/http_write_routes.rs"
  - "apps/lobster-waku-gateway/src/gateway_tests.rs"
  - ".claude/prd.md"
  - ".claude/project-state.md"
todo_items:
  - "P1.1: 需求澄清 — presence/unread 持久化策略"
  - "P1.2: 需求澄清 — SSE 在线广播范围"
  - "P1.3: 需求澄清 — 速率限制粒度"
review_retry_count: 0
phase_history: []
key_context: "presence/unread 纯内存 HashMap，重启丢失；presence 变更不触发 SSE notify_all"
```

**更新时机**：新任务→归档+重置 | PRD确认→写 prd.md | 阶段推进→更新 phase | 文件修改→记路径 | 架构→记决策 | 压缩前→更新全部

**Compact 保留**：current_phase、task_description、prd_file、modified_files、key_context、project_roadmap、completed_tasks（最近3个）、global_architecture、prd.md文件

**Compact 删除**：phase_history详细、todo_items、多余completed_tasks、requirements_clarification

详见 `.claude/rules/09-memory-management.md`
