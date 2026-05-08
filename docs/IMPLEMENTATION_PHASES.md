# Implementation Phases

## 当前交付顺序（2026-04-15 重置）

当前主线按下面顺序推进：

1. 先补厚 `conversation_shell / scene_render` 这套正式合同
2. 由 `H5` 承接当前主交互入口与 `SFC` 场景主路径
3. 同步推进 `TUI` 对同一合同的并行映射
4. 补齐 `lobster-cli` 这条给本地智能体复用的命令行聊天通道
5. 再进入真实 transport 评估与接入
6. 再进入真实加密落地
7. 眼镜端后置

因此，下面这些内容目前属于“协议与架构预留”，不是当前 `MVP` 的完成标准：

- `World Square`
- `World Safety`
- 多城邦互联产品面
- H5 离线/PWA 完整体验
- 穿戴设备专用交互
- 装扮编辑器、素材系统、自由摆放

当前 `MVP` 的完成标准应收敛到：

- 单城邦范围内的私聊、群聊、房间聊天主路径
- `H5` 主交互可用
- `TUI` 对同一正式合同的映射可用
- `conversation_shell / scene_render` 成为稳定的正式合同
- `lobster-cli` 可供 `OpenClaw / Codex / Claude Code` 等智能体直接复用
- 为真实 transport 与真实加密保留后续接入边界

## Phase 1: Skeleton

- Rust workspace
- domain model
- host adapter contracts
- local archive contracts
- standalone TUI runtime

## Phase 2: Local-first messaging

- local room state
- local message append path
- archive policy
- file-backed persistence snapshot
- room timeline rendering
- embedded / mobile-web / wearable host split baked into interfaces

## Phase 3: Waku light transport

- content topic mapping
- light push send path
- filter-based receive path
- store-based recent history recovery
- low-resource subscription strategy for embedded, mobile-web, and wearable hosts
- gateway-backed adapter boundary first
- in-memory gateway for development and offline tests
- JSON-friendly gateway request / response contract for sidecars and remote adapters
- localhost gateway state persistence for restart-safe resident sessions
- localhost world/city coordination endpoints for membership and public-room state across settlements
- localhost resident directory and direct-message bootstrap endpoints
- upstream gateway interconnect for multi-city discovery experiments
- provider-status endpoint for real Waku provider / remote gateway integration
- provider connect / disconnect endpoints with persisted upstream bridge config
- world snapshot bundle endpoint with checksum metadata for mirror-city sync and cached projections
- real network adapter second

## Phase 4: MLS security

- room bootstrap
- 1v1 conversation bootstrap
- persisted 1v1 session skeleton state via gateway
- encrypted payload boundary
- epoch management

## Phase 5: AI sidecar

- translation hooks
- summarization hooks
- semantic search hooks
- fully optional runtime
- mobile-web friendly streamed responses
- wearable-friendly compact answer shaping
- OpenClaw-powered room and city helper slots
- caretaker message boards for personal rooms
- decoration helpers for room and city scene edits
- merchant/listing helpers for room storefront experiments

## Phase 6: Chain anchoring

- identity anchor
- device root updates
- conversation / room state anchors
- batched message hash anchoring
- optional stake / anti-spam rules

## Cross-cutting world and city rules

- World / City / Resident portability model
- city-lord powers strong enough for public settlement stewardship
- private 1v1 plaintext kept out of city-lord authority
- city creation, resident join, and public-room bootstrap exposed through the localhost gateway
- H5 projection participates in world and city upkeep as a resident-facing follow surface rather than just a passive timeline viewer
- world-directory discovery should be mirrored across multiple cities
- a World Square should exist as a cross-city public commons
- a world safety workflow should be able to quarantine malicious cities, process public safety reports, and publish deny lists without taking ownership of private-message plaintext
- in severe confirmed cases, the world layer can now revoke a resident identity's portability and distribute resident-sanction plus hashed registration blacklist entries
- a low-cost auth skeleton now exists for email OTP registration/login with mobile kept as a hashed anti-abuse handle
- the H5 follow projection can now drive that auth skeleton through an email OTP request + verify flow
- the H5 follow projection now has a resident-facing public-abuse report path into the world safety queue
- server install and release packaging should be scripted rather than relying on developer memory

## Cross-cutting rendering

- desktop TUI follows an SFC-inspired palette philosophy when terminal capability allows it
- low-end or headless terminals degrade to FC-style symbolic rendering
- color, glyph, and portrait capability are runtime-detected rather than hard-coded
- themed nomenclature is planned as a presentation layer over neutral protocol nouns
- city scenes and personal room scenes are planned as metadata-driven spatial surfaces over the same neutral chat/shared-rules core
- user identity in rooms should use personalized pixel avatars rather than a fixed lobster mascot
- room and city scenes should be able to host visible helper-bot slots without forcing OpenClaw into every deployment
