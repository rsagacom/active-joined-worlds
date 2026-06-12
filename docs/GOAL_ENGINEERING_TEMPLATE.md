# Engineering Goal Template — lobster-chat

> 本文件定义工程化 goal prompt 的模板结构和设计理念。
> 每次填写一个具体实例（如 `GOAL_admin-ds-write-ops.md`）来驱动一轮开发。
>
> 核心理念：**入口条件 → 范围栅栏 → 风险预判 → 阶段门控 → 固定输出**

---

## 模板结构

```markdown
# Goal: <单轮任务名>

## 1. 入口条件（Gate-in）

开始前逐一检查，任一不满足则先自行解决：

- [ ] `git status` — 工作区干净，或当前改动已确认不影响本轮目标
- [ ] `npm test` — web-shell 全绿（当前基线: <N> passed / 0 failed）
- [ ] `cargo test -p lobster-waku-gateway` — Gateway 全绿（当前基线: <N> passed）
- [ ] `cargo test -p lobster-tui` — TUI 全绿（当前基线: <N> passed）
- [ ] 目标文件 <file.js/css> 语法有效：`node --check <file>` / `cargo check`
- [ ] 相关 smoke 脚本语法有效：`bash -n scripts/<script>.sh`

## 2. 范围栅栏（Scope Fence）

```yaml
# 刻意收窄，避免 scope creep
专注: <一句话描述本轮唯一目标>
涉及文件:
  必须改:
    - apps/lobster-web-shell/<file.js>       # 改什么
    - test/<test-file>.mjs                    # 新测试
  可能改:
    - apps/lobster-web-shell/<file.css>       # 仅测试依赖
绝对不改:
  - 任何 Rust 代码 (crates/ / apps/*-rs/)
  - 用户端 HTML 页面 (index/creative/unified/world-square)
  - 与本轮目标无关的 JS 模块
  - 视觉/布局/layout 改动（除非测试断言要求）
```

## 3. 风险预判（Risk Pre-assessment）

```yaml
已知风险:
  - <风险1>: <触发条件> → <影响> → <应对>
  - <风险2>: <触发条件> → <影响> → <应对>
止损线:
  - 语法检查失败 → 回退最后一步，不推进
  - npm test 全红/新增失败 → 回退最后改动，报告原因
  - 发现后端 bug → 只记录不改，写入 bugs_found
  - 发现测试框架限制 → 改用其它验证方式并记录
```

## 4. 六阶段 SDLC（逐步执行）

### P1 需求分析

- [ ] 确认本轮任务的业务需求和验收标准
- [ ] 梳理涉及的后端/前端合同（API 端点/数据结构）
- [ ] 明确前端当前状态的测试覆盖
- [ ] 输出需求理解 ≤ 10 行

### P2 设计

- [ ] 确定改动路径（增/删/改哪些函数）
- [ ] 确定测试策略（已有测试/新增测试/手动验证）
- [ ] 输出：改动文件清单 + 每文件改动说明 ≤ 5 行

### P3 编码（TDD 先红后绿循环）

每个独立单元的固定节奏：
```
① 写测试（或增强已有测试）→ 红灯确认
② 写最小实现 → 绿灯确认
③ node --check / cargo check 语法通过
④ npm test / cargo test 全绿
```

```yaml
编码约束:
  - 不批量删除/不批量重构
  - 不改无关模块
  - 发现后端阻塞只记录不走 hack
```

### P4 测试

```bash
# 固定验证命令
cd /Volumes/AJW-Data/Projects/lobster-chat

# 前端测试
cd apps/lobster-web-shell && npm test

# 语法检查
node --check app.js && for f in shell-*.js; do node --check "$f" || exit 1; done

# 相关 smoke 语法
bash -n scripts/<related>-*.sh

# Rust（只读，不改时不强制，但用于确认基线未坏）
cd /Volumes/AJW-Data/Projects/lobster-chat
cargo test -p lobster-waku-gateway 2>&1 | tail -5
```

### P5 审查

- [ ] 检查所有改动文件：改动是否必要、是否与范围栅栏一致
- [ ] 检查新测试：是否覆盖正常路径 + 边界 + 异常
- [ ] 检查未改动文件：确认无意外修改
- [ ] 检查产物：没有 `dist/`、`generated/*.json` 等不应跟踪的内容

### P6 交付

填写输出模板（见下节）。

## 5. 输出模板（Exit Report）

```yaml
session: <goal-name>
entry_conditions_met: true | false + reason

files_changed:
  - <file>: <改动概述 1 行>

tests_before:
  web_shell: <N> passed
  gateway: <N> passed
  tui: <N> passed

tests_after:
  web_shell: <N> passed
  gateway: <N> passed
  tui: <N> passed

new_tests_added:
  - <test-file>: <N> 条

bugs_found: []        # 审计发现的后端/合同层问题，不改
blockers: []          # 无法继续的原因，没有则空
risks_realized: []    # 命中了的预判风险 + 处理方式

next_goal_suggestion:  # 1-2 句，基于本轮结果推荐下一轮做什么
```

## 6. 工程化设计理念

每项设计对应一个工程痛点：

| 痛点 | 设计 | 说明 |
|------|------|------|
| 不知道能不能开始 | 入口条件检查表 | 不满足条件就不开工，避免半路发现基线已坏 |
| 做着做着就跑偏 | 范围栅栏 YAML | 明确什么改什么不改，`绝对不改` 段防止 scope creep |
| 出问题了才想怎么办 | 风险预判 | 接手前就列出已知风险 + 止损线，不临时决策 |
| 改了不知道有没有坏 | TDD 先红后绿 | 先有测试断言，再改代码，每一步都可逆 |
| 测试通过但不知道改了啥 | 固定输出模板 | 结构化的 YAML 输出，下一轮可直接接上 |
| 接手方换了上下文全丢 | Session 隔离 | 每轮只有一个专注目标，输出模板就是下一轮的入口上下文一半 |

## 7. 模板使用方式

### 写法（填写具体实例）

```bash
# 复制模板到具体文件
cp docs/GOAL_ENGINEERING_TEMPLATE.md docs/GOAL_admin-ds-write-ops.md
# 编辑填写：入口条件数值、范围、文件清单、风险预判
```

### 执行流程

```
1. 检查入口条件 → 不满足则自行修复
2. 确认范围栅栏 → 本轮的 "不能再碰"
3. 过一遍风险预判 → 心中有数
4. P1 → P2 → P3→P4→P5→P6 走完
   - P3 内部是 ①写测试→②改代码→③验证 的微循环
5. 填写输出模板 → 完成
```

### 适用场景

- 任务有**稳定测试基线**（可 TDD）
- 任务**边界清晰**（只改 1-3 个文件）
- 后端已就绪 / 合同已定（只需前端消费）
- 接手方可变（DS v4 Pro / Flash / Kimi / Codex 都能用同一份 goal）

不适合：探索式设计、需求未定的原型阶段（这时用更松散的目标描述+频繁确认更高效）。
