# lobster-cli 使用手册

`lobster-cli` 是 lobster-chat 单城中心化 IM 的命令行客户端。覆盖完整 IM 闭环（消息收发/编辑/撤回/搜索/导出）、居民身份、邮箱 OTP 认证、世界治理查询与 admin 管理。

## 构建

```bash
cargo build -p lobster-cli              # 调试构建 → target/debug/lobster-cli
cargo install --path apps/lobster-cli   # 安装到 ~/.cargo/bin
```

## 通用标志与环境变量

| 标志 / 环境变量 | 说明 |
|----------------|------|
| `--gateway <url>` | 网关地址，默认 `http://127.0.0.1:8787` |
| `--json` | 机器可读 JSON 输出（脚本集成用） |
| `LOBSTER_WAKU_GATEWAY_URL` | 默认网关环境变量 |
| `LOBSTER_SESSION_TOKEN` | session token 环境变量（见认证章节） |

身份标识格式：`user:<id>` / `agent:<id>` / `room:<id>`。

---

## 快速开始：4 个真实工作流

### 工作流 1 — 登录与设置昵称

```bash
# 邮箱 OTP 登录：dev 环境内联 OTP 自动完成；生产环境输入邮箱收到的验证码
lobster-cli login --email alice@example.com

# 设置昵称（自动用缓存的 session token，无需 --token）
lobster-cli set-nickname 小龙虾

# 查看自己的名片（昵称已更新）
lobster-cli who --for user:alice
```

### 工作流 2 — 日常收发消息

```bash
# 上报在线（who 中显示 ●在线）
lobster-cli presence --for user:alice

# 发公共房间消息
lobster-cli send --from user:alice --to room:world:lobby --text "大家好"

# 发私聊（DM）—— 网关自动建立私聊会话，无需预先 open
lobster-cli send --from user:alice --to user:bob --text "在吗"

# 查看未读会话摘要
lobster-cli inbox --for user:alice

# 拉取新消息（conversation-id 从 inbox 获取）
lobster-cli tail --for user:alice --conversation-id <conv-id>

# 标记会话已读
lobster-cli read --for user:alice --conversation-id <conv-id>
```

### 工作流 3 — 搜索与导出

```bash
lobster-cli search 你好                              # 全局搜索
lobster-cli search 你好 --room room:world:lobby --limit 20   # 限定房间 + 条数
lobster-cli export --for user:alice --format md      # 导出全部（Markdown）
lobster-cli export --for user:alice --conversation-id <conv-id> --format jsonl
```

### 工作流 4 — 世界治理查询（只读，无需身份）

```bash
lobster-cli world       # 世界总览（城市/信任/公告/安全/管理员）
lobster-cli square      # 公共广场公告
lobster-cli cities      # 城市列表
lobster-cli directory   # 世界黄页（每城居民数/公共房/信任/镜像）
lobster-cli snapshot    # 治理快照（可移植性隐私治理 + checksum）
lobster-cli safety      # 安全快照（信任/公告/报告/制裁/黑名单）
```

---

## 命令参考

### 消息
| 命令 | 参数 |
|------|------|
| `send` | `--from <id> --to <id> --text <msg>` |
| `edit` | `--actor <id> --conversation-id <id> --message-id <id> --text <msg>` |
| `recall` | `--actor <id> --conversation-id <id> --message-id <id>` |

### 会话
| 命令 | 参数 |
|------|------|
| `search` | `<keyword> [--room <id>] [--limit N]` |
| `inbox` | `--for <resident>` |
| `rooms` | `--for <resident>` |
| `tail` | `--for <resident> [--conversation-id <id>] [--follow]` |
| `export` | `--for <resident> [--conversation-id <id>] [--format md\|jsonl\|txt]` |

### 身份与状态
| 命令 | 参数 |
|------|------|
| `who` | `--for <resident>` |
| `read` | `--for <resident> --conversation-id <id>` |
| `presence` | `--for <resident>` |

### 身份与认证
| 命令 | 参数 |
|------|------|
| `login` | `--email <addr>` → 缓存 session |
| `set-nickname` | `--name <昵称>` 或 位置昵称，或 `--clear` |
| `logout` | 清本地缓存；`--token <t>` 同时登出服务端 |

### 世界（只读）
`world` · `square` · `cities` · `safety` · `directory` · `snapshot`（均无需身份参数）

### 管理（需 admin 身份 + Bearer token）
admin 命令需要 Bearer token（`--token` 或登录缓存）与 admin 身份（`--actor`，缺省取登录缓存的 resident_id）。先 `login` 即可直接调用；token 失效返回 401 时按提示重新登录。

| 命令 | 参数 |
|------|------|
| `ban` / `unban` | `--target <resident> [--actor <admin>]` |
| `freeze` / `unfreeze` | `--target <room> [--actor <admin>]` |
| `invite-create` | `[--actor <admin>] [--max-uses N]` |
| `invite-revoke` | `--code <code> [--actor <admin>]` |
| `residents` / `rooms-admin` | admin 视角目录（无参数） |

### 元
`help` — 显示命令总览；`help <cmd>` 引导查询具体用法。

---

## 认证与安全

### Session token 三级回退

`set-nickname` 与所有 admin 命令（`ban`/`unban`/`freeze`/`unfreeze`/`invite-create`/`invite-revoke`）等需鉴权的命令按以下顺序解析 token：

1. `--token <t>` 显式参数（CI / 单次调用）
2. `LOBSTER_SESSION_TOKEN` 环境变量
3. 缓存文件 `~/.lobster/cli-session.json`（`login` 写入）

三者皆无 → 报错引导 `login`。

### 缓存文件

- 路径：`~/.lobster/cli-session.json`（手写 HOME / USERPROFILE 解析，无额外依赖）
- 权限：Unix 下文件 `0600`（仅属主可读）+ 目录 `0700`；**Windows 无等价权限保护**（已知限制，建议文件系统 ACL 或受限用户帐户隔离）
- 写入：原子写（`.tmp` → rename），schema 版本控制（升级后旧缓存自动失效，重新 login 即可）
- 清除：`logout` 删除缓存文件

### ⚠️ 安全注意事项

- **人类可读输出绝不包含 token**（login 成功消息、错误信息均脱敏）。
- **`--json` 输出会包含完整 session_token**（供脚本机读）。**切勿将 `login --json` 的输出贴入日志、issue、聊天或截图**——等价于泄露登录凭证。
- token 失效（401）时不会自动清缓存（避免误删仍有效的缓存 token）；按提示重新 `login` 即可覆盖。

### Dev 环境便捷项

`LOBSTER_DEV_EMAIL_OTP_INLINE=1`（作用于**网关进程**，需网关启动时设置）使 OTP 内联返回，CLI 自动完成验证，无需 stdin 输入。生产环境 OTP 发至邮箱，CLI 会提示输入。
