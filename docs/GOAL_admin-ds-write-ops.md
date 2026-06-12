# Goal: admin-ds 写操作全线接入

## 1. 入口条件（Gate-in）

- [ ] `git status` — 当前分支 `codex/creative-pixel-scene-v2`，59 文件未提交，确认本轮不改这些文件
- [ ] `npm test` — 基线 736+ passed / 0 failed（2026-06-09 实测）
- [ ] `cargo test -p lobster-waku-gateway` — 244 passed / 0 failed
- [ ] `cargo test -p lobster-tui` — 225 passed / 0 failed
- [ ] `node --check apps/lobster-web-shell/admin-ds.js` — 语法通过
- [ ] `bash -n scripts/smoke-release-gate.sh` — 语法通过

## 2. 范围栅栏（Scope Fence）

```yaml
专注: admin-ds.js 中 disabled 按钮逐个接通后端真实端点
涉及文件:
  必须改:
    - apps/lobster-web-shell/admin-ds.js       # 替换 markUnavailableButton → 真实 fetch
    - apps/lobster-web-shell/admin-ds-data.js  # 如需补充端点地址
    - test/admin-ds-runtime.test.mjs            # 新测试
    - test/admin-ds-static.test.mjs             # 静态断言更新
  可能改:
    - apps/lobster-web-shell/admin-ds.html      # 仅测试依赖的数据属性
绝对不改:
  - 任何 Rust 代码 (crates/ / apps/lobster-*-rs/)
  - 用户端页面 (index/creative/unified/world-square/admin.html)
  - app.js / 其他 shell-*.js
  - 任何 CSS 文件 (styles*.css)
  - 不改任何已有行为——只把 disabled 按钮恢复为可用
```

## 3. 风险预判（Risk Pre-assessment）

```yaml
已知风险:
  - 端点返回的 JSON 结构与预期不匹配: admin-ds 使用 mock 数据格式 → 写入 bugs_found 不改
  - 后端鉴权 header 不一致: admin-ds 已有的 fetch 模式可能不同 → 对齐现有实现
  - 有些端点本体不存在/未实现: 按钮保持 disabled + tooltip 写清楚原因
  - 现有 admin-ds 测试没有覆盖写操作: 需要新增测试 → 在每个按钮接通前写
止损线:
  - npm test 新增失败 → 回退最后一步改动，记录原因
  - grep markUnavailableButton 计数不降反升 → 停止检查方向
  - 发现后端 bug 只记不改，写在 bugs_found 里
  - 单按钮耗时超过 15 分钟无进展 → 跳过该按钮并记录 blocker
```

## 4. 六阶段 SDLC

### P1 需求分析

- [x] 确认：admin-ds 当前有 ~5 个 `markUnavailableButton`（居民封禁/解除封禁、房间冻结/解冻、批量处理）
- [x] 后端端点清单（读 `http_write_routes.rs` / `gateway_tests.rs`）：
  - `POST /v1/admin/residents/ban` — body: `{actor_id, resident_id, reason}` → `{}`
  - `POST /v1/admin/residents/unsanction` — body: `{actor_id, resident_id, sanction_id}` → `{}`
  - `POST /v1/admin/rooms/freeze` — body: `{actor_id, room_id, reason}` → `{}`
  - `POST /v1/admin/rooms/thaw` — body: `{actor_id, room_id}` → `{}`
- [x] admin-ds 当前测试：`admin-ds-runtime.test.mjs` 没有写操作测试
- [ ] admin-ds 当前数据层确认（admin-ds-data.js 是否已有端点定义）

### P2 设计

```yaml
改动路径:
  - 每个按钮一个独立 commit·风格的改动:
    ① 在 test/admin-ds-runtime.test.mjs 中写测试 → 红灯
    ② 修 admin-ds.js 内的按钮 handler → 绿灯
    ③ npm test 全绿
  测试策略:
    - markUnavailableButton 数从 N 降为 N-1 的静态断言
    - 模拟 fetch 验证发送了正确的 URL/method/body
    - 验证 loading/success/error 三态 DOM 切换
```

### P3 编码（TDD 先红后绿循环）

#### 按钮 1: 居民封禁（ban）

```bash
# ① 写测试 → 红灯
# 🎯 task: 在 test/admin-ds-runtime.test.mjs 新增
#   "ban resident button sends POST /v1/admin/residents/ban"
#   "ban resident button shows loading then success"
# run: npm test → 预期这两个失败（功能未实现）

# ② 改 admin-ds.js
# 🎯 task: admin-ds-data.js 确认 endpoint definition
#         admin-ds.js 替换 markUnavailableButton → handleBan()
#         handleBan(): fetch POST /v1/admin/residents/ban + 三态

# ③ 验证
npm test  # → 两个新测试变绿，全部通行
```

#### 按钮 2: 居民解除封禁（unsanction）

`...与按钮 1 相同节奏...`

#### 按钮 3: 房间冻结（freeze）

`...与按钮 1 相同节奏...`

#### 按钮 4: 房间解冻（thaw）

`...与按钮 1 相同节奏...`

### P4 测试

```bash
cd /Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell
npm test

# 语法检查
node --check admin-ds.js && node --check admin-ds-data.js

# 返回基线
cd /Volumes/AJW-Data/Projects/lobster-chat
cargo test -p lobster-waku-gateway 2>&1 | tail -3
```

### P5 审查

- [ ] 所有 `markUnavailableButton` 已消除？还剩几个？有无仍然合理的 disabled（无后端端点）？
- [ ] 新测试覆盖：正常路径（200）+ 错误路径（4xx）+ 边界（空响应）
- [ ] 改动的文件是否都在范围栅栏内？
- [ ] `git diff --stat` 只显示预期文件
- [ ] 没有引入新的 API 密钥/路径等敏感信息

### P6 交付

填写下节输出模板。

## 5. 输出模板

```yaml
session: admin-ds-write-ops
entry_conditions_met: true

files_changed:
  - admin-ds.js: <说明>
  - admin-ds-data.js: <说明或"未改">
  - test/admin-ds-runtime.test.mjs: <新增 N 条测试>

tests_before:
  web_shell: 736 passed
  gateway: 244 passed

tests_after:
  web_shell: <N> passed
  gateway: 244 passed

new_tests_added:
  - admin-ds-runtime.test.mjs: <N>
  - admin-ds-static.test.mjs: <N>

bugs_found:
  - <端点>: <问题描述>

blockers:
  - <需后续解决的问题>

risks_realized:
  - <命中风险>: <处理结果>

next_goal_suggestion: >
  admin-ds 写操作已全线接通后，建议进入 app.js 安全拆分下一轮：
  提取 roomMatchesSearch (72 行) 至独立模块 + 配套测试。
```
