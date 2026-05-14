# lobster-web-shell

Thin H5 shell for `lobster-chat`.

## Purpose

这个壳层用于让手机浏览器或类 PWA 包装先行接入，方便移动端在原生应用完成前尽早加入。
当前收口目标是把 `creative`、`admin` 和 `unified` 都尽量表现成正常聊天窗口，尤其 `creative.html` 要贴近“房间内聊天主界面”；`user.html` 只保留 query-preserving 兼容跳转，不再承载独立住宅 UI。`admin` / `unified` 要像线性的城主治理页和世界外壳；治理与扩展能力保留，但不抢首屏。
其中 `creative.html` 侧优先走 [02.jpg](/Users/rsaga/Desktop/02.jpg) 那种房间内聊天视角，`admin` / `unified` 侧优先走 [01.jpg](/Users/rsaga/Desktop/01.jpg) 那种城市外 / 治理线性壳视角。

It is intentionally:

- static
- framework-light
- bootstrap-driven
- cache-aware

## What it currently demonstrates

- a main-city group chat page, a creative resident room page, and a query-preserving `user.html` compatibility route
- a separate `联调页` for checking chat-first user/admin/world flows in one place
- consumes a compact bootstrap payload
- prefers generated bootstrap and state exported from the Rust core
- renders a room list + timeline view
- gives the conversation list, empty states, message pane, and composer a more room-like IM presentation while keeping the shell logic unchanged
- wires the `creative.html` resident room stage, role portrait chips, and chat-detail metadata panel from room `scene_*` fields plus caretaker metadata, with sample-state fallback when gateway data is absent
- creates the user-stage canvas and detail panel on demand when the host DOM does not pre-render them, so the shell still boots in the current fake DOM / test harness
- shows unread counts, current room, and recent activity state in the room list
- shows sending, syncing, and empty-state feedback in the message pane
- supports chat list and thread switching on narrow screens / mobile layouts
- can poll a localhost shell gateway for fresh state
- can send text messages through the shell gateway
- can export the current room or full visible history from the shell
- can inspect world and city state through the governance endpoints
- can inspect a resident directory and open direct sessions from the shell
- can request and verify email OTP login, with mobile retained only as an anti-abuse handle
- can found a city, join a city, and open a public room from the shell
- can approve pending residents and freeze public rooms when the current resident has city-lord authority
- can export current or full resident-visible history as `markdown`, `txt`, or `jsonl`
- can switch city interconnect policy between `Open`, `Selective`, and `Isolated` when the current resident is the city lord
- can read provider status from the gateway to distinguish local-memory mode from remote-provider mode
- can render world-directory snapshots and mirror sources
- can render World Square notices and world-safety advisories
- can submit public-abuse reports into the world safety review queue
- can connect or disconnect a remote provider bridge from the shell itself
- stores a local snapshot through IndexedDB when available
- remembers a local resident handle for outgoing messages
- falls back to in-memory state if browser storage is unavailable
- keeps the UI compact while staying chat-first and avoiding shell-like first impressions
- treats the room/interior view as the default mental model, with world/exterior views split out instead of mixed into the chat home
- keeps `creative.html` close to the room-in chat screen from `02.jpg`, with the header reduced to a short caption and the room scene becoming the first visual focus, while `admin` and `unified` stay as linear world / city governance shells instead of a dense module wall
- makes `creative.html` a room-first chat surface and keeps `admin` / `unified` as exterior-first linear shells with the governance tools pushed to the edge

## Quick acceptance checklist

Use this checklist when you want to verify the current web shell without reading code:

1. open `index.html`, `creative.html`, `admin.html`, and `unified.html`
2. confirm `creative.html` and `admin.html` read like normal chat surfaces, while `unified.html` keeps the combined 联调入口
3. connect a gateway and confirm the provider bridge state is visible
4. send a message from the creative resident shell and confirm the message passes through the shell gateway
5. export the current room and a full visible-history bundle
6. switch to a narrow browser width and confirm the room list / thread view can be switched cleanly on mobile
7. verify unread badges, active-room highlighting, and sending/loading/empty states are visible in the timeline UI
8. confirm the conversation list, empty states, message pane, and composer feel like a real IM surface rather than a console
9. confirm the topbar does not over-explain itself and the status chips stay secondary to the chat surface
10. confirm the room stage canvas, portrait chips, and chat-detail panel continue to render even when the host HTML omits those hooks

See also:

- [/Users/rsaga/Documents/Playground/lobster-chat/docs/WEB_SHELL_ACCEPTANCE.md](/Users/rsaga/Documents/Playground/lobster-chat/docs/WEB_SHELL_ACCEPTANCE.md)
- [/Users/rsaga/Documents/Playground/lobster-chat/docs/VISUAL_REFERENCE_STACK.md](/Users/rsaga/Documents/Playground/lobster-chat/docs/VISUAL_REFERENCE_STACK.md)
- [01.jpg](/Users/rsaga/Desktop/01.jpg) / [02.jpg](/Users/rsaga/Desktop/02.jpg)

## How to preview

From the `apps/lobster-web-shell` directory, serve the files with any static server, for example:

```bash
python3 -m http.server 8080
```

Then open:

- `http://127.0.0.1:8080/`
- `http://127.0.0.1:8080/creative.html`
- `http://127.0.0.1:8080/admin.html`
- `http://127.0.0.1:8080/unified.html`

If you are using the current local operator server, the same pages are also reachable at:

- `http://127.0.0.1:18080/`
- `http://127.0.0.1:18080/creative.html`
- `http://127.0.0.1:18080/admin.html`
- `http://127.0.0.1:18080/unified.html`

For the shared local preview launcher, use:

```bash
/Users/rsaga/Documents/Playground/lobster-chat/scripts/start-web-preview.sh
```

It defaults to `18080`, reuses an already-running preview when it matches the same root directory, and will refuse to kill an unrelated process that happens to occupy the port. Optional overrides:

- `PREVIEW_PORT`
- `PREVIEW_HOST`
- `PREVIEW_ROOT`
- `PREVIEW_PIDFILE`
- `PREVIEW_LOGFILE`

## Next step

Gateway mode:

1. run `cargo run -p lobster-waku-gateway -- --host 127.0.0.1 --port 8787`
2. serve this directory
3. open:
   - `http://127.0.0.1:8080/creative.html?gateway=http://127.0.0.1:8787`
   - `http://127.0.0.1:8080/admin.html?gateway=http://127.0.0.1:8787`
4. set your resident handle in the shell once; it is remembered locally for later sends
5. the gateway keeps timeline and governance state on disk, so shell-posted messages and city state survive a gateway restart when the same state directory is reused
6. use the world panel to:
   - inspect cities
   - inspect residents and open a direct message
   - join an existing city
   - found a new city with your current resident handle as `City Lord`
   - create public rooms if your role allows it
   - point the local gateway at another provider / city gateway when you want interconnect or hosted relay behavior

TUI note:

- `apps/lobster-tui` is a terminal client, not a browser surface.
- Expose it over the web only through a separate browser wrapper if we later add one; that is not part of the current shell.

## Verify

For the current web shell regression suite, run:

```bash
npm test
```

This runs the Node shell tests and a Playwright layout check for the main IM scene pages.

1. open the root URL and confirm the two primary entry cards are visible on the home screen
2. open `/creative.html` and confirm admin-only controls are hidden
3. open `/admin.html` and confirm the governance controls remain visible
4. confirm both dedicated pages show Chinese-only onboarding guidance
5. check that the obvious English UI strings in the shell header and sample room content have been replaced with Chinese copy

Fallback bridge path:

1. run `cargo run -p lobster-tui`
2. Rust exports:
   - `generated/bootstrap.json`
   - `generated/state.json`
3. the H5 shell reads those first if no gateway is configured
