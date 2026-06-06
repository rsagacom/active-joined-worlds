# lobster-chat 部署指南

## 环境
Rust 1.80+ / Node.js 22+ / macOS, Linux, WSL

## 本地启动
```
## 终端1
cargo run -p lobster-waku-gateway -- --host 127.0.0.1 --port 8787

## 终端2
cd apps/lobster-web-shell && python3 -m http.server 8080

## 浏览器
open http://127.0.0.1:8080/creative.html?gateway=http://127.0.0.1:8787
```

## 页面
creative.html(住宅私聊) | index.html(主城) | admin-ds.html(城主后台)
unified.html(世界入口) | world-square.html(世界广场) | user.html(兼容跳转)

## API 端点 (80+)
| 模块 | 端点示例 |
|------|------|
| Shell/IM | /v1/shell/state, /v1/shell/events, /v1/shell/message, /v1/shell/message/recall, /v1/shell/message/edit, /v1/shell/nickname |
| Admin | /v1/admin/summary, /v1/admin/config, /v1/admin/residents, /v1/admin/residents/ban, /v1/admin/residents/nickname, /v1/admin/messages/moderate, /v1/admin/invites, /v1/admin/rooms/members, /v1/admin/permission-groups, /v1/admin/scene, /v1/admin/audit-log |
| Auth | /v1/auth/preflight, /v1/auth/email-otp/request, /v1/auth/email-otp/verify, /v1/shell/session |
| World | /v1/world, /v1/cities, /v1/world-square, /v1/world-square/notices, /v1/world-safety, /v1/world-safety/advisories, /v1/world-safety/reports, /v1/world-directory |

## 测试
cargo test -p lobster-waku-gateway  ## Gateway 227 tests
cargo test -p lobster-tui           ## TUI 212 tests
cargo test -p lobster-cli           ## CLI 28 tests
cd apps/lobster-web-shell && npm test  ## Web Shell 659 tests

## 烟测
scripts/smoke-release-gate.sh       ## 全量发布烟测
scripts/smoke-web-shell.sh          ## H5 静态入口
scripts/smoke-shell-dual-http.sh    ## 双端真实 IM

## 打包部署
scripts/package-release.sh          ## 打包
scripts/install-server.sh           ## 安装到目标机

## 生产建议
Gateway: --host 0.0.0.0 + nginx 反代 + HTTPS
数据: JSON 文件持久化 (presence/unread/auth/invites)
