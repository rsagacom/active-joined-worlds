# Lobster Chat H5 IM UI Brief

## Project

Project root:

`/Volumes/AJW-Data/Projects/lobster-chat`

Current target surface:

`apps/lobster-web-shell/creative.html`

Primary design task:

Improve the current H5 resident IM shell into a coherent, production-feeling chat UI that preserves the pixel room scene.

## Current product shape

The H5 shell is a browser-based IM projection for a single-city resident/chat system. The user enters as a resident, logs in by email OTP when connected to the gateway, chooses a conversation, reads and sends messages, and interacts with a pixel room scene through hotspots.

The current creative shell has:

- top HUD: room title, connection status, login entry
- left rail: navigation and conversation list
- center stage: composed pixel room background
- hotspot layer: window, desk, coffee/bar, shelf, stairs
- chat layer: message timeline over the scene
- bottom composer: text area, symbol menu, send button
- resident login overlay: OTP request and verification

## Non-negotiable architecture rules

- Gateway contract is the source of truth.
- H5 is the primary interaction entry for now, but it must stay a projection, not a private canonical state owner.
- TUI remains a parallel mapped client.
- UI changes must not invent new backend data requirements unless explicitly marked as optional future metadata.
- Current main scope is single-city IM flow.
- Defer world governance expansion, public editor systems, complex map tooling, and unrelated side panels.

## Current visual direction

The accepted H5 direction is a three-layer pixel-scene IM:

1. Bottom: full composed pixel scene.
2. Middle: transparent hotspots tied to visible scene objects.
3. Top: WeChat-like left/right chat bubbles.

Rules:

- Self messages appear on the right.
- Peer messages appear on the left.
- System messages are centered or visually neutral and must not look like a speaker.
- The composer is a long adaptive input plus send action.
- Empty scene click can hide/restore text chrome.
- Do not cover the artwork with large translucent panels.
- Do not use a marketing-style hero or landing page.

## Design problem

The project has the right primitives, but the UI needs a stronger product design pass:

- make chat feel like the main task, not a demo overlay
- reduce visual competition between HUD, rail, scene, message layer, composer, and hotspots
- make desktop and mobile behavior explicit
- clarify login/session/error states
- define what should hide in clear-screen mode
- make the conversation list more scannable
- make message rhythm, avatar placement, pending delivery, and system rows consistent
- preserve the scene while keeping messages readable

## Implementation constraints

The current app is mostly vanilla HTML/CSS/JS:

- `creative.html` defines the shell DOM.
- `styles.creative.css` and `styles.pixel-map.css` define most layout and pixel-scene presentation.
- `app.js` binds state, renders rooms/timeline, handles gateway auth, sends messages, and syncs scene metadata.
- Tests under `apps/lobster-web-shell/test/*.mjs` assert UI behavior.

Gemini should output design specifications, not direct code patches.

The output should be useful for Codex to implement incrementally with tests.

## Useful file map

- `source/creative.html`: current H5 resident shell structure.
- `source/styles.creative.css`: current creative shell CSS.
- `source/styles.pixel-map.css`: pixel scene, hotspot, mobile and layered UI CSS.
- `context/app-ui-excerpts.md`: relevant JavaScript excerpts from `app.js`.
- `context/ui-contract-tests-excerpts.md`: behavior that redesign must preserve.
- `context/architecture-design-excerpts.md`: product and protocol constraints.
- `assets/creative-room-scene-v2-256.png`: desktop scene reference.
- `assets/creative-room-scene-v2-mobile-256.png`: mobile scene reference.

## Desired Gemini output

Produce a design document with:

- current UI diagnosis
- target information architecture
- desktop layout
- mobile layout
- component specs
- interaction states
- visual rules
- Phase 1 / Phase 2 / Phase 3 plan
- acceptance checklist

Phase 1 should be small enough to implement without changing backend APIs.
