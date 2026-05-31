# Round 13 — 长任务模式第一轮

时间: 2026-05-29
模型: kimi-for-coding (主 Agent)

## 本轮完成

### T013-1: app.js 低风险清理 — quickAction preview data 提取

**目标**: 将 app.js 中 quickAction preview 相关纯函数提取到独立模块。

**提取的函数** (13 个):

| 函数 | 说明 |
|------|------|
| `normalizeQuickActionFieldLabel` | 规范化字段标签（去除前导符号和尾部冒号） |
| `quickActionPreviewFieldViewLabel` | 预览视图标签（snapshot/stage） |
| `quickActionPreviewRoundLabel` | 历史轮次标签（第N轮/最新轮） |
| `quickActionPreviewHistorySummary` | 从历史快照提取摘要 |
| `quickActionPreviewHistoryLabel` | 历史条目标签（轮次 + 摘要） |
| `quickActionPreviewHistoryDescription` | 历史条目描述（含最新轮索引） |
| `quickActionPreviewPrimaryField` | 提取结构化消息的主字段 |
| `quickActionPreviewPrimaryFieldText` | 主字段文本表示 |
| `quickActionInlinePreviewFields` | 内联预览字段选择（支持优先级和 stage 偏好） |
| `quickActionInlinePreviewFieldSets` | 同时返回 stage 和 snapshot 两组预览字段 |
| `quickActionInlinePreviewActionLabels` | 预览动作按钮标签 |
| `quickActionInlinePreviewActionOrder` | 预览动作按钮顺序 |
| `quickActionInlinePreviewActionHint` | 预览动作按钮提示文案 |

**保留在 app.js 的函数** (2 个，依赖 normalizeQuickActionStructured/parseStructuredQuickActionMessage):

| 函数 | 原因 |
|------|------|
| `quickActionWorkflowStructured` | 依赖 parseStructuredQuickActionMessage（在 app.js 中多处使用） |
| `quickActionPreviewStructuredViews` | 依赖 normalizeQuickActionStructured（在 app.js 中多处使用） |

**改动文件**:

| 文件 | 操作 | 说明 |
|------|------|------|
| `shell-quick-action-preview.js` | **新增** | 13 个导出函数，~175 行 |
| `app.js` | 删除 + 导入 | 删除 13 个函数定义 (~175 行)，新增 import |
| `test/fake-dom.mjs` | URL + import 替换 | 新增 shell-quick-action-preview.js 的 file:// URL 和 import 替换 |
| `test/shell-quick-action-preview.test.mjs` | **新增** | 31 个测试 |

### 测试基线

```bash
cargo test -p lobster-waku-gateway        # 147 passed / 0 failed
cd apps/lobster-web-shell
npm test                                    # 448 passed / 0 failed (+31)
npm run test:realness                       # passed
```

### 累计 app.js 缩减

| 阶段 | 行数 | 减少 |
|------|------|------|
| Phase 4 (quick-action labels) | 9847→9703 | -144 |
| Phase 7 (storage keys) | 9703→9694 | -9 |
| Phase 8 (quick-action templates) | 9694→9625 | -69 |
| Phase 10 (roomStatsSpec + roomEmptyStateSpec) | 9625→9605 | -20 |
| Phase 12 (roomToolbarNoteSpec) | 9605→9598 | -7 |
| Phase 13 (quickAction preview) | 9598→9423 | -175 |
| **累计** | **9847→9423** | **-424** |

### 新增/更新独立模块

| 模块 | 行数 | 函数 | 测试 |
|------|------|------|------|
| shell-quick-action-labels.js | 161 | 8 | 36 |
| shell-quick-action-templates.js | 88 | 2 | - |
| shell-quick-action-preview.js | 175 | 13 | 31 |
| shell-storage-keys.js | 31 | 6 | 9 |
| shell-room-rail.js (新增部分) | +48 | 4 | 18 |

## 风险

- `quickActionWorkflowStructured` 和 `quickActionPreviewStructuredViews` 仍依赖 app.js 中的 `normalizeQuickActionStructured` 和 `parseStructuredQuickActionMessage`。后续若要完全解耦，需要将这两个函数也提取出去，但会影响更多调用点。

## 下一轮计划

继续执行剩余 3 个任务（按优先级）：
1. **T013-2** Gateway events wait 边界加固
2. **T013-4** admin-ds ban 写操作
3. **T013-3** Admin Phase 2 重建
