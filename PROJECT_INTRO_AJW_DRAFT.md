# Active Joined Worlds [A.J.W] / 项目介绍草稿

> 审核用途：这是 GitHub 主页、README 开头和项目简介可复用的中英文介绍草稿。当前代码仓库仍可保留历史代码名 `lobster-chat`，对外项目名建议切换为 **Active Joined Worlds [A.J.W]**。
>
> Review note: This bilingual draft can be reused for the GitHub homepage, README introduction, and repository description. The internal code name may remain `lobster-chat`, while the public project name can move to **Active Joined Worlds [A.J.W]**.

## 中文简介

**Active Joined Worlds [A.J.W]** 是一个以 IM 为入口的开源世界通信原型。它尝试把群聊、私聊、身份、房间、城市、世界入口和多端客户端组织在一套共享的通信合同之上，让 H5、TUI、CLI 和 Rust gateway 不再各自维护一套孤立状态。

A.J.W 的核心思路是：先把“聊天”做成真实入口，再逐步展开跨房间、跨城市、公告、安全、治理和多端访问能力。用户面对的是熟悉的 IM 交互；开发者面对的是清晰的 gateway contract、会话投影和可测试的客户端边界。

### 当前状态

A.J.W 目前是 **experimental prototype / 早期实验原型**，不是生产级 IM 服务，也不是完整的微信替代品。当前重点是验证架构、接口合同和多端交互路径：

- H5 Web Shell：主城群聊、住宅私聊、世界入口、世界广场和管理后台原型；
- Rust Gateway：消息发送、撤回、编辑、SSE 状态推送、居民登录和城市/世界投影；
- TUI / CLI：终端客户端与命令行客户端，消费同一套 gateway 合同；
- 文档：世界模型、gateway 协议、H5 验收、管理后台功能目录和部署烟测。

### 项目目标

- 以 IM 为主入口，而不是把用户推向复杂工具墙；
- 让 H5、TUI、CLI 共享同一套后端合同；
- 保持核心轻量，便于本地运行、远程部署和低资源设备实验；
- 为未来的多城市、多房间、可穿戴入口和去中心化 relay 留出清晰边界；
- 用 MIT License 降低个人开发者和小团队的试用与贡献门槛。

### 未来域名

项目后续可以启用 `ajw.cn` 作为主页、文档站、演示入口或社区入口。当前建议先以 GitHub 仓库和 README 作为主要公开入口，等产品名、视觉和主路径稳定后再接入域名。

## English Introduction

**Active Joined Worlds [A.J.W]** is an open-source IM-first world communication prototype. It explores how group chat, direct messages, identities, rooms, cities, world entry points, and multi-client access can share one coherent communication contract instead of each client inventing its own state model.

The core idea is simple: start with real conversations, then gradually expand into rooms, cities, announcements, safety workflows, governance tools, and multi-device access. Users get familiar IM interactions; developers get a clear gateway contract, testable projections, and explicit client boundaries.

### Current Status

A.J.W is currently an **experimental prototype**, not a production-ready IM service and not a full replacement for mature messaging products. The current focus is architecture validation, contract stability, and multi-client interaction paths:

- H5 Web Shell: main city group chat, private room chat, world entry, world square, and admin prototype;
- Rust Gateway: message send, recall, edit, SSE state updates, resident login, and city/world projections;
- TUI / CLI: terminal and command-line clients consuming the same gateway contract;
- Documentation: world model, gateway protocol, H5 acceptance checks, admin function catalog, and deployment smoke tests.

### Goals

- Make IM the primary entry instead of forcing users into a complex tool wall;
- Keep H5, TUI, and CLI aligned through one backend contract;
- Keep the core lightweight enough for local runs, remote deployments, and low-resource device experiments;
- Leave clean boundaries for future multi-city routing, room federation, wearable surfaces, and decentralized relay work;
- Use the MIT License to lower adoption and contribution friction for individual developers and small teams.

### Future Domain

The project may later use `ajw.cn` as its homepage, documentation site, demo entry, or community entry point. For now, the GitHub repository and README should remain the primary public entry until naming, visuals, and the main interaction path stabilize.

## GitHub Repository Description / GitHub 仓库短描述

English:

> Active Joined Worlds [A.J.W] — an experimental IM-first world communication prototype with H5, TUI, CLI, and a shared Rust gateway contract.

中文：

> Active Joined Worlds [A.J.W]：一个以 IM 为入口的开源世界通信实验原型，覆盖 H5、TUI、CLI 与共享 Rust gateway 合同。

## Suggested Topics / 推荐 Topics

```text
im
chat
rust
h5
tui
cli
gateway
local-first
multi-client
pixel-ui
experimental
open-source
```
