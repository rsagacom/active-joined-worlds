# Round 17 完成总结

**日期**: 2026-05-29
**测试基线**: Gateway 173 passed / 0 failed | Frontend 526 passed / 0 failed | TUI 195 passed / 0 failed

---

## T017-1: app.js 低风险清理 — DOM 工具函数提取

**状态**: 完成

- 新建 `shell-dom-helpers.js`，提取 10 个纯 DOM 工具函数：
  - `setDatasetFlag(node, key, value)` — 安全设置/删除 data-* 属性
  - `setInlineStyle(node, property, value, important)` — 兼容 setProperty 和 camelCase 的样式设置
  - `createLine(className, text)` — 创建带 class 的 div
  - `createPill(text, tone)` — 创建 pill 标签 span
  - `createStageChip(text, tone)` — 创建 stage-chip div
  - `createMetaChip(text, tone)` — 创建 meta-chip span
  - `createOverviewMetric(label, value, copy, tone)` — 创建概览指标卡片
  - `createDetailSection(title, copy)` — 创建详情 section
  - `createDetailRow(label, value)` — 创建详情行（支持 Element 值包裹）
  - `createChatDetailCardMetaRow(label, value)` — 创建卡片元数据行
- `app.js` 中删除对应函数定义，添加 import
- `test/fake-dom.mjs` 添加 `shellDomHelpersUrl` 和 import 替换规则
- 新增 `test/shell-dom-helpers.test.mjs`，19 个测试覆盖全部函数
- app.js 行数继续下降

**文件变更**:
- `apps/lobster-web-shell/shell-dom-helpers.js` — 新增
- `apps/lobster-web-shell/app.js` — 删除 10 个函数定义 + 新增 import
- `apps/lobster-web-shell/test/fake-dom.mjs` — 添加替换规则
- `apps/lobster-web-shell/test/shell-dom-helpers.test.mjs` — 新增

---

## T017-2: Gateway 测试 — presence 端点边界补充

**状态**: 完成

在 `gateway_tests.rs` 中新增 3 个 presence 边界测试：

1. `presence_endpoint_rejects_empty_body` — 验证空 body 返回 400 decode 错误
2. `presence_endpoint_rejects_missing_resident_id` — 验证缺少 resident_id 返回 400
3. `presence_endpoint_rejects_empty_resident_id` — 验证 resident_id 为空字符串返回 400

---

## T017-3: Gateway 测试 — read 端点边界补充

**状态**: 完成

在 `gateway_tests.rs` 中新增 3 个 mark_read 边界测试：

1. `mark_read_endpoint_rejects_empty_body` — 验证空 body 返回 400 decode 错误
2. `mark_read_endpoint_rejects_missing_resident_id` — 验证缺少 resident_id 返回 400
3. `mark_read_endpoint_rejects_missing_conversation_id` — 验证缺少 conversation_id 返回 400

---

## 本轮产出

| 指标 | 数值 |
|------|------|
| 新增纯函数模块 | 1（shell-dom-helpers.js） |
| 新增前端测试 | 19 |
| 新增 Gateway 测试 | 6 |
| Gateway 测试总数 | 173 |
| 前端测试总数 | 526 |
| 回归 | 0 |

---

## 下轮建议

从 `IMPLEMENTATION_PHASES.md` 和 `ACTIVE_WORK_QUEUE.md` 读取下一批任务。可选方向：
- Gateway 更多边界测试（world-square、world-entry、provider 等读操作）
- app.js 继续提取纯函数（scene 渲染、auth 相关）
- CSS 拆分（按 FRONTEND_DEBT_REDUCTION_PLAN.md）
- H5 IM 主路径真实验收（启动服务器 + 浏览器验证）
