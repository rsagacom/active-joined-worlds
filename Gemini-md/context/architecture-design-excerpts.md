# Architecture and design docs excerpts

## Spatial Scene Model

# Spatial Scene Model

## Decision

The visual reference is accepted as a product direction.

We will treat the interface as a `spatial chat surface`, not just a message list.
That means:

- a `city` is a public, governed scene
- a `room` is a personal or semi-private scene
- chat remains the core interaction
- scene customization is layered on top of messaging and governance rather than replacing them

## Two scene types

### 1. City scene

A city scene is the public-facing space owned and moderated by the city.

Examples:

- city square
- city lord hall
- resident district
- relay gate / transfer gate
- world map entrance
- public channel stage

Characteristics:

- edited by the `city lord` and authorized `stewards`
- visible to residents and visitors according to city policy
- represents public identity and city culture
- must respect world safety and moderation rules

### 2. Room scene

A room scene is a conversational personal space.

Examples:

- direct-message room
- private study
- workshop
- bedroom / personal corner
- shared task room

Characteristics:

- customized by the room owner, or by both sides under room rules
- used for private chat, small-group coordination, and personal atmosphere
- should feel intimate and personal
- must still degrade cleanly in low-resource terminals

## Core product split

We should keep three layers separate.

### Layer A: protocol layer

Canonical objects remain neutral and stable:

- `world`
- `city`
- `resident`
- `conversation`
- `room`
- `lord`
- `steward`

This layer should not care whether the city looks like a fortress, sect, apartment, tavern, or laboratory.

### Layer B: scene metadata layer

This is where we describe space and decoration.

Suggested metadata families:

- scene preset id
- palette id
- floor/wall style
- furniture slots
- portrait frame style
- ambient props
- resident avatar placement
- room title plate style
- optional pixel portrait sheet id
- assistant slots for caretaker / decorator / merchant bots

This layer should be safe to sync across terminals, H5, and later wearable surfaces.

### Layer C: runtime rendering layer

This layer turns metadata into visible output depending on capability.

Examples:

- H5: richer pixel tiles and portrait surfaces
- desktop TUI: SFC-like palette, symbolic layout, portrait cards where possible
- low-end SSH terminal: FC-like symbolic floorplan with compact labels
- wearable: miniature glance card or room badge only

## H5 pixel-scene layer contract

The current H5 direction uses a three-layer scene stack:

- bottom: one composed pixel scene image, not a sprite-sheet pasted as a background
- middle: transparent hotspot layer bound to visible objects in the scene image
- top: IM text layer using WeChat-like message bubbles

Message layout rules:

- current resident / self messages are always on the right
- peer messages are always on the left
- system messages are centered and should not look like a person speaking
- the bottom composer is one long adaptive input field plus a send button

Hotspot rules:

- hotspots must be tied to actual visible pixels, such as a subway entrance, notice board, plaza, or shop
- do not create large invisible click slabs over the artwork
- on mobile, if the composed image is cropped and the object is not reliably visible, hide the hotspot hit area
- mobile may still show non-interactive scene labels, such as `广场`, when that semantic area is visible
- mobile-specific hotspots should wait until there is a mobile-specific scene crop or image

Clear-screen rule:

- clicking empty scene space hides text/chrome layers so the composed pixel scene can be viewed cleanly
- clicking empty scene space again restores text/chrome layers

## Personal avatar decision

The lobster mascot should not be the permanent room occupant.

### New direction

Use a `personalized pixel character` as the primary in-room figure.

That means:

- each resident can choose a personal avatar preset
- later, they may customize hair, clothing, posture, title plate, and room accent
- the lobster can remain:
  - a default placeholder
  - a city/world mascot
  - a theme-specific decorative companion

### Why this matters

If every room shows the same lobster, the product loses:

- identity
- social distinction
- role fantasy
- ownership of space

Pixel people are better for:

- city lord identity
- steward identity
- resident status
- themed professions or cultivation ranks
- future wearable/profile surfaces

## Ownership and editing rules

### City editing rights

The city scene should be controlled by city governance.


## H5 Projection Plan

# H5 Projection Plan

## Why H5 first

The mobile path should begin with an H5 projection so iOS and Android can join the network early without waiting for native App packaging, store review, or a second protocol stack. H5 is a follow-up projection, not the main battlefield.

## What the H5 projection should do

- reuse the same `chat-core` models through a bridge layer
- render compact 聚落 and DM timelines
- keep an active-window cache locally
- prefer IndexedDB for snapshots and archive pointers
- stream incremental updates from transport instead of reloading full histories
- mirror the current world, 城邦, and 居民 state without claiming higher rights than TUI

## What the H5 projection should not do at first

- it should not become the only canonical home of the product
- it should not require the AI sidecar
- it should not attempt full wearable UX
- it should not own the transport protocol directly if a host bridge can proxy it
- it should not turn into a city-order page or hidden high-rights surface

## First browser-facing boundary

1. route entry
2. local session bootstrap
3. timeline hydrate from persisted snapshot
4. subscribe to compact updates
5. render a compact room-like chat projection that still feels close to the TUI interior
6. keep the same-window contract clear: same world view, different rights

## Runtime contract

The H5 projection should consume a compact bootstrap payload that includes:

- host capabilities
- projection configuration
- initial view
- offline cache budget
- background resync policy
- resident/city-lord role tier for the current window

This keeps the browser projection thin and lets the real product logic stay in the shared core and adapter layers. The TUI still owns the main action flow; H5 only shadows it when the resident opens the browser.

## Why this keeps the project light

This path lets us keep:

- one core model
- one transport model
- one archive model
- multiple thin projections
- shared naming across world / 城邦 / 聚落 / 居民 / 城主 / 互联 / 共建

That is the right tradeoff for a product that must work:

- downward in embedded hosts
- sideways in mobile browsers as a follow-up projection
- upward in wearable devices


## Waku Gateway Protocol

# Waku Gateway Protocol

This document describes the adapter shape that sits between `lobster-chat` clients and a future real Waku relay or light gateway.

## Why this layer exists

We want the same chat core to work across:

- embedded Lobster-like hosts
- desktop terminal shells
- mobile H5 shells
- later wearable shells

Those environments should not each reimplement their own transport logic.

So the transport stack is split into:

1. `chat-core`
2. `transport-waku`
3. a `gateway client` implementation
4. a real local sidecar, host bridge, or remote gateway later

## Design goal

The Waku gateway boundary should be:

- compact
- serializable
- easy to embed inside local host processes
- easy to expose over HTTP, WebSocket, or IPC later
- friendly to low-resource clients

## Current contract

The current serializable protocol lives in:

- `WakuGatewayBootstrap`
- `WakuGatewayRequest`
- `WakuGatewayResponse`

### Bootstrap

Bootstrap tells a host shell what session it should establish:

- endpoint config
- topic subscriptions
- history limit

### Requests

Current request types:

- `Connect`
- `Subscribe`
- `Publish`
- `Recover`
- `Poll`

### Responses

Current response types:

- `Connected`
- `Subscribed`
- `Published`
- `Frames`
- `Error`

## Why JSON first

The core message payloads already use compact binary framing via `postcard`.

The gateway request layer uses JSON first because it is:

- easy to inspect in development
- easy to serve from small local processes
- easy to bridge into H5 shells
- easy to move to HTTP or WebSocket later

This keeps the gateway request layer debuggable while the message payload layer stays compact.

## Future implementations

This protocol is meant to support multiple concrete adapters:

- in-memory development gateway
- localhost sidecar process
- embedded host bridge
- remote Waku gateway
- browser bridge for H5
- upstream gateway interconnect between city nodes

## Upstream interconnect step

The current implementation now supports a practical intermediate step before a full native Waku provider is wired in:

- a localhost city gateway can point at an upstream gateway
- local shell and governance state still stay local
- transport publish / recover / poll can route upward through the interconnect

This is useful for:

- city-to-city interconnect experiments
- low-cost hosted city relays
- separating local shell runtime from broader network transport


## Pixel Asset Handoff

# Pixel Asset Handoff

This folder keeps PNG masters for inspection and compressed runtime assets for the web runtime. HTML/CSS should reference the indexed 256-color PNG scene assets for IM backgrounds when visual clarity is more important than minimum transfer size. PNG masters are source files only and should not be shipped directly as page backgrounds.

## Scene Assets

| Scene | Desktop runtime | Mobile runtime | Source/master |
| --- | --- | --- | --- |
| 主城 | `composed/hub-main-city-scene-v1-256.png` | `composed/hub-main-city-scene-v1-mobile-256.png` | `composed/hub-main-city-scene-v1.png` |
| 住宅 | `composed/creative-room-scene-v2-256.png` | `composed/creative-room-scene-v2-mobile-256.png` | `composed/creative-room-scene-v2.png` |
| 世界入口 / 地铁候车站 | `composed/world-metro-station-scene-v1-256.png` | `composed/world-metro-station-scene-v1-mobile-256.png` | `composed/world-metro-station-scene-v1.png` |

## Hotspot Slices

Use these only for on-demand popovers, thumbnails, zoom panels, or later interaction windows. Do not lay all slices on top of the scene at initial load unless the full scene background is removed for that page.

- `composed/hub-main-city-slices/metro-entrance.avif`
- `composed/hub-main-city-slices/notice-board.avif`
- `composed/hub-main-city-slices/plaza-center.avif`
- `composed/hub-main-city-slices/residential-skyline.avif`
- `composed/hub-main-city-slices/shop-cafe.avif`

## Runtime Rules

- Use indexed 256-color PNG for IM page backgrounds when reviewing visual clarity; use WebP/AVIF only after side-by-side visual acceptance.
- Keep PNG files as editable masters only.
- Desktop can use one compressed full-scene indexed PNG to preserve composition.
- Mobile must use a mobile crop indexed PNG so it does not download the full desktop master.
- Hotspot hit areas stay transparent; hover labels are text-sized only.
- Do not use generated UI sheets as button or panel backgrounds unless they are explicitly sliced into that exact component shape.
- If CC works on `unified.html`, use `world-metro-station-scene-v1-256.png` and `world-metro-station-scene-v1-mobile-256.png`, not the old `world-entry-scene-v1` gate or the main-city scene.
