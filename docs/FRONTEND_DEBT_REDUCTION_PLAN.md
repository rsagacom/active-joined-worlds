# Frontend Debt Reduction Plan

This plan turns the 2026-05-15 DS V4 Pro review into a staged cleanup path. The goal is to reduce frontend risk without changing the IM-first product contract: gateway state remains canonical, H5 stays a renderer, and existing pages must keep passing smoke tests while modules are extracted.

## Current Findings

- `apps/lobster-web-shell/app.js` is too large for safe iteration: about 10k lines and hundreds of functions in one browser script.
- `apps/lobster-web-shell/styles.css` is too broad: page layout, tokens, scene chrome, chat, governance, and legacy compatibility all live in the same file.
- Static web tests exist locally but were not represented as a first-class CI job.
- The web asset folder contains large composed scenes, concept references, source PNGs, and duplicate-size exports. Some are runtime assets; others need archive labeling instead of living beside production files.
- The README and acceptance docs had stale absolute paths from the old project location, which makes handoff and external-disk operation brittle.
- Source-only pixel assets are archived outside the web runtime at `/Volumes/AJW-Data/Projects/lobster-chat-assets-archive/20260516-web-source-assets/`.
- Deprecated `styles.user.css` is archived at `/Volumes/AJW-Data/Projects/lobster-chat-assets-archive/20260516-web-source-assets/deprecated-web-shell/styles.user.css`; `user.html` is now a redirect-only compatibility entry.

## Guardrails Before Splitting

1. Keep `index.html`, `creative.html`, `unified.html`, `world-square.html`, `admin.html`, and `admin-ds.html` browser-loadable without a bundler.
2. Add or preserve Node/static tests before moving code out of `app.js`.
3. Keep gateway fetches and event projection behavior unchanged during extraction.
4. Extract only stable, cohesive blocks per step; do not mix visual redesign with module movement.
5. Run `npm test` in `apps/lobster-web-shell` after every extraction step.

## JavaScript Split Order

1. `js/shell-shared.js`: constants, selectors, formatting helpers, identity helpers, and small pure functions.
2. `js/shell-state.js`: default state shape, session selection, unread calculations, message normalization, and state projection helpers.
3. `js/shell-gateway.js`: gateway URL resolution, central `fetchGatewayJson`, SSE wiring, retry/offline state, and error mapping.
4. `js/shell-render.js`: message list rendering, rail rendering, HUD status rendering, empty/loading states, and DOM diff-safe helpers.
5. `js/shell-composer.js`: textarea auto-resize, send availability, enter/shift-enter behavior, emoji panel, and send result UI.
6. `js/shell-scene.js`: hotspot registration, clear-screen mode, responsive scene sizing, and rail drawer behavior.
7. `js/shell-auth.js`: OTP login state machine and resident identity refresh.
8. `js/shell-governance.js`: admin/governance-only behavior shared by `admin.html` and the selected `admin-ds.html` direction.

Use a single explicit namespace such as `window.lobsterShell` while the project stays no-bundler. Script tags should be ordered from shared/state/gateway to render/composer/page entry.

First extractions landed:

- `apps/lobster-web-shell/shell-errors.js`: owns `gatewayErrorMessage` and `localizedRuntimeError`, with direct unit coverage and fake-DOM loader support.
- `apps/lobster-web-shell/shell-labels.js`: owns localized labels for roles, room kinds, federation status, report states, provider modes, advisory actions, and city/world display fallbacks.
- `apps/lobster-web-shell/shell-message-state.js`: owns pending echo matching and delivered-copy hiding, so send/refresh echo behavior is tested outside `app.js`.
- `apps/lobster-web-shell/shell-shared.js`: owns shell mode copy, default identities, local time-of-day, provider connection labels, and OTP delivery labels.

Continue with similarly pure helpers before moving stateful rendering code.

## CSS Split Order

1. `styles.tokens.css`: variables, font stack, colors, spacing, z-index, and safe-area constants.
2. `styles.base.css`: reset, global shell frame, common buttons, badges, modal primitives, and accessibility states.
3. `styles.scene.css`: composed scene containers, aspect-ratio handling, hotspots, tooltips, and clear-screen mode.
4. `styles.chat.css`: rail, chat bubbles, composer, message states, mobile drawer, and safe-area rules.
5. `styles.world.css`: world entrance and world square specific layout.
6. `styles.admin.css`: legacy admin fallback.
7. `styles.admin-ds.css`: selected DeepSeek admin design, kept separate until it is formally wired as the primary admin route.

Each HTML page should load only the shared CSS plus the page-specific CSS it needs. Keep old selectors temporarily during migration, then remove them only after the static tests cover the new entrypoints.

## Asset Policy

1. Create an asset inventory with file size, dimensions, and page references before deleting anything.
2. Keep runtime assets under `assets/pixel/runtime/` or the current referenced path until HTML/CSS references are migrated.
3. Move source concepts, prompt references, and non-runtime large PNGs to a clearly named archive folder on the external disk, not into production web paths.
4. Prefer AVIF/WebP for runtime scene backgrounds, with PNG only when visual QA shows compression artifacts.
5. Delete duplicate 256px exports only after `rg` confirms no page or test references them.

Start with:

```bash
./scripts/audit-web-assets.sh
```

## Acceptance

- `npm test` passes in `apps/lobster-web-shell`.
- CI has a dedicated frontend job using `apps/lobster-web-shell/package-lock.json`.
- README and acceptance docs use portable relative links and the current external-disk project path only in shell examples.
- Admin DeepSeek design remains an additive page until selected route wiring is implemented deliberately.
- No behavior extraction step changes gateway-owned room visibility, permissions, or message identity.
