# OpenClaw Agent Interface

## Intent

`lobster-chat` is repositioned as real IM + light AI patrol + personal OpenClaw
caretaker (the resident dog). Optional agents should assist residents while the
core chat experience stays human-first and the patrol/assistant layers remain
transparent.

The target is:

- users can invite a bot into their own workflow
- cities can expose public-service bots
- the world can expose limited safety / directory bots
- the core protocol remains usable without OpenClaw

This means OpenClaw is an optional control and execution layer, not a required
dependency for the chat protocol itself.

## Design position

The right mental model is:

- `World`: protocol, directory, safety, interconnect rules
- `City`: public space, local governance, local service surface
- `Room`: private or semi-private interaction surface
- `Agent`: a delegated actor that can help a resident or a city perform tasks

An agent is not the owner of the world, city, or room.
It is a tool-bearing participant with scoped permissions.

## Why this matters

If we do this well, the user gets:

- a chat tool
- a room / personal workspace
- a city / community space
- a bot that can actually do things

That makes the product feel closer to:

- `chat + workspace + automation + delegated execution`

instead of only:

- `a decentralized IM clone`

## What kinds of bots should exist

### 1. Personal bot

Attached to one resident.

Typical use:

- summarize a conversation
- search room history
- export notes
- draft replies
- run external tools
- watch tasks and report back later
- stay in a room and leave caretaker messages for visitors
- help decorate and beautify a personal pixel room
- help run a small personal storefront or listing wall

This is the most important bot type for day-to-day use.

### 2. Room bot

Attached to a room.

Typical use:

- task board assistant
- note-taking assistant
- shared research helper
- moderation helper for a shared room

This bot should obey room policy, not global policy.

### 3. City bot

Attached to a city.

Typical use:

- city guide
- directory search
- public room routing
- event / notice publishing
- city-specific service tools

City bots are public infrastructure, not personal secretaries.

### 4. World bot

World-scoped bots should be very limited.

Typical use:

- directory explanation
- world-square navigation
- safety notice explanation
- appeal workflow guidance

World bots must not become a hidden global ruler.

## Caretaker persona (resident dog)

The resident-facing OpenClaw helper is the caretaker, the dog in the dock who
keeps a light memory, surfaces visitor messages, and only calls tools or patrol
actions after visible notifications. Definitions for caretaker memory, visitor
messages, moderation request/result pairs, owner notifications, and tool
contracts are gathered in [`docs/CARETAKER_PLAYBOOK.md`](./CARETAKER_PLAYBOOK.md).

## The user-facing interface we should expose

Users should not need to understand OpenClaw internals.
They should see a small, clear interface.

### A. Bot dock

Each user-facing shell should have a visible bot dock / assistant slot:

- `我的助手`
- `本房间助手`
- `本城助手`

The shell decides which one is relevant in context.

### B. Mention-style invocation

In chat and TUI, users should be able to trigger a bot naturally:

- `@助手 帮我整理这段讨论`
- `/助手 导出本房间记录`
- `/委托 查一下这座城最近的公共公告`

This keeps the system discoverable.

### C. Action cards instead of silent execution

Bots should not silently perform sensitive actions.

For meaningful actions, the UI should show a Chinese action card:

- action summary
- target scope
- affected objects
- need confirmation or not
- execution progress
- final result

Examples:

- `准备导出当前房间全部聊天记录`
- `准备发布城市公告`
- `准备将该居民加入制裁名单`

### D. Background jobs

Long-running work should become a task card, not a blocking conversation.

The user should see:

- started
- running
- waiting for approval
- finished
- failed

And the result should return to:

- current room
- personal room
- Feishu
- or all of the above

## What permissions an agent may receive

Agents must use scoped grants.

Suggested grant classes:

- `read_history`
- `summarize`
- `search_room`
- `export_history`
- `draft_reply`
- `publish_notice`
- `open_direct_room`
- `join_city`
- `manage_room_scene`
- `manage_city_scene`
- `review_report`
- `apply_sanction`

These grants should be:

- explicit
- revocable
- visible in UI
- logged

## The most important safety rule

An agent must never silently impersonate a resident.

If an action is executed on behalf of a user, the system must preserve:

- who requested it
- which bot executed it
- under which grant
- when it happened

This should be visible in logs and, when appropriate, in the room timeline.

## What should require confirmation

The following should generally require a confirmation card:

- exporting history
- publishing public notices
- changing city trust state
- sanctioning a resident
- changing interconnect policy
- opening external tool actions with side effects

The following may be auto-approved if the user opted in:

- summarization
- local search
- note drafting
- formatting output

## How OpenClaw should integrate technically

The cleanest design is:

- `lobster-chat core` stays protocol-first
- `lobster-waku-gateway` exposes bot-safe action endpoints
- `OpenClaw` connects as an external execution sidecar

This means:

- bots do not live inside the protocol core
- bots talk to gateway APIs
- gateway enforces scope and audit

### Recommended connection model

- local sidecar for single-host deployments
- city-side sidecar for city bots
- resident-side bridge for personal bots

### Minimum bridge contract

The bridge should exchange:

- resident identity
- room or city scope
- task intent
- grant token / grant id
- execution status
- result payload
- artifact references

## Protocol events we should model

We should not overload plain chat messages for everything.

Suggested event families:

- `agent.invocation.requested`
- `agent.invocation.accepted`
- `agent.invocation.requires_confirmation`
- `agent.invocation.rejected`
- `agent.job.started`
- `agent.job.progress`
- `agent.job.completed`
- `agent.job.failed`
- `agent.artifact.ready`

These events can still be rendered as chat-like cards in the UI.

## What users should actually see

### In the user shell

- `我的助手`
- `请助手总结`
- `请助手导出`
- `执行任务`
- `执行记录`

### In the城主 shell

- `治理助手`
- `请助手整理举报`
- `请助手生成公告草稿`
- `请助手比对镜像城市状态`

### In the room shell

- `房间助手`
- `整理待办`
- `整理纪要`
- `拉取相关资料`
- `帮我看家留言`
- `帮我装修这个房间`
- `帮我整理售卖物品`

## High-value product scenarios

These are the first OpenClaw-native directions that fit this product well.

### 1. Caretaker bot

This bot lives in a personal room or home page space.

It should be able to:

- greet visitors
- leave visible messages for the room owner
- collect visitor intent
- answer simple owner-defined questions
- report back later through the room, TUI, or Feishu

This is the closest thing to:

- `养一个看家 bot`

### 2. Decoration bot

This bot helps the resident or city lord customize spatial scenes.

It should be able to:

- propose room layouts
- suggest palette and atmosphere changes
- place or swap furniture presets
- help turn reference images into pixel-style decoration plans
- later call external art / pixel tools through OpenClaw

This is the most natural OpenClaw entry into:

- room beautification
- city beautification
- scene personalization

### 3. Merchant bot

This bot helps run a light commerce surface inside a room or city.

It should be able to:

- display goods
- answer item questions
- leave transaction instructions
- route a resident to payment / confirmation flows
- publish or retract listings

This should start as:

- listing / catalog / intent collection

not as:

- a fully trusted autonomous payment actor

## Relation to spatial scenes

This product is moving toward:

- city as editable public scene
- room as editable personal scene

Bots should fit naturally into that.

That means:

- a personal bot can appear as a pixel character or assistant object in a room
- a city bot can appear as a city service NPC or notice kiosk
- the visual skin can change by theme
- caretaker, decorator, and merchant bots can each occupy different scene slots
- not every bot needs to be humanoid; some can be signposts, kiosks, or service desks

But the underlying bot contract stays stable.

## Theme-safe naming

The protocol layer should keep neutral terms.

Display layer may remap:

- `agent` -> `助手`, `管家`, `灵使`, `执事`
- `city bot` -> `城务使`, `宗门执事`
- `world bot` -> `界务使`

This keeps the world skin expressive without corrupting the stable API.

## What we should implement first

### Phase 1

- personal bot dock
- room-level bot invocation
- Chinese action cards
- background job cards
- export / summarize / search / draft actions
- caretaker message board for personal rooms

### Phase 2

- city bot
- city co-building helper
- scene-edit helpers
- interlinked city service bots
- decoration helpers for room and city scenes
- room-level storefront helpers

### Phase 3

- world bot for directory / safety guidance
- richer multi-agent delegation
- cross-surface continuity between H5, TUI, Feishu, and wearables

## Product rule of thumb

If a user asks:

- `这个 bot 是不是在替我操作？`

the answer should always be easy to explain in one sentence:

- what scope it has
- what it can do
- what it cannot do
- whether it needs confirmation

If we cannot explain that cleanly, the interface is too vague.

## Short version

`lobster-chat` should expose OpenClaw to users as:

- a visible assistant slot
- a scoped delegated executor
- a task card system
- a room / city / world aware helper

not as:

- an invisible global brain
- a hidden overreach shortcut
- a bot that silently acts as the user
