# Round 14 — 进行中

时间: 2026-05-29
模型: kimi-for-coding (主 Agent)

## 已完成

### T014-1: app.js 彻底解耦 — 提取 normalizeQuickActionStructured / parseStructuredQuickActionMessage ✅
- 移动 `normalizeQuickActionStructured`、`parseStructuredQuickActionMessage`、`quickActionWorkflowStructured`、`quickActionPreviewStructuredViews` 到 `shell-quick-action-preview.js`
- 更新 app.js import 和 fake-dom.mjs
- 新增 10 个测试（parseStructuredQuickActionMessage 4 个 + normalizeQuickActionStructured 3 个 + quickActionWorkflowStructured 1 个 + quickActionPreviewStructuredViews 2 个）
- 前端测试：450 → 460 passed

### T014-2: Gateway 管理后台写操作边界测试 ✅
- 新增 6 个黑盒测试：
  - `admin_ban_endpoint_rejects_missing_resident_id`
  - `admin_unban_endpoint_returns_zero_lifted_for_nonexistent_resident`
  - `admin_unban_endpoint_rejects_missing_resident_id`
  - `admin_freeze_endpoint_rejects_missing_room_id`
  - `admin_config_endpoint_rejects_empty_body`
  - `admin_config_endpoint_rejects_missing_config_field`
- Gateway 测试：153 → 159 passed

## 当前测试基线

```bash
cargo test -p lobster-waku-gateway        # 159 passed / 0 failed
cd apps/lobster-web-shell
npm test                                    # 460 passed / 0 failed
npm run test:realness                       # passed
npm run test:layout                         # all OK
```

## 累计 app.js 缩减

| 阶段 | 行数 | 减少 |
|------|------|------|
| 初始 | 9847 | — |
| Phase 13 (preview) | 9847→9423 | -424 |
| Phase 14 (彻底解耦) | 9423→9345 | -78 |
| **累计** | **9847→9345** | **-502** |

## 进行中

### T014-3: 居民栏与个人房间模型 — Gateway 合同扩展
- 目标：在 ShellRoomState 中扩展 image_layer 和 hotspot_layer
- 文件：core_runtime.rs, http_read_routes.rs, gateway_tests.rs
- 预估：75 分钟
