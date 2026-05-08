# Device Strategy

## Embedded-first

The core should run in low-resource hosts such as Lobster-like embedded systems with these assumptions:

- no heavyweight GUI requirement
- no always-on AI dependency
- bounded memory budget
- background sync allowed when possible
- local archive and compact active-window state

## Mobile-web bridge first

Before a native iOS or Android app exists, the same core should be able to sit behind a small H5 shell.

That means we deliberately preserve:

- headless core contracts
- compact binary frames
- low state fan-out
- storage layers that can later map to IndexedDB
- transport boundaries that can be bridged from browser runtime code

This keeps the product reachable on phones early without locking us into an App-first architecture too soon.

## Wearable-next

Wearable clients are a second-layer target, not a separate protocol.

They should reuse the same:

- identity model
- conversation model
- archive policy
- transport model

But expose a smaller surface:

- glance-sized summaries
- voice-first interaction
- optional camera-assisted context
- lower bandwidth and lower memory assumptions

## Why this split matters

If we do not model embedded and wearable constraints early, the system will bloat into a desktop-first client that is difficult to embed and awkward to extend to smart glasses later.

The current workspace avoids that by keeping:

- `chat-core` UI-agnostic
- `host-adapter` explicit about host capabilities
- `ai-sidecar` optional
- transport and security layers separate from the presentation layer
- mobile web treated as a first-class host profile instead of an afterthought
