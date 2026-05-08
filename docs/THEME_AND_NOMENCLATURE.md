# Theme And Nomenclature Plan

## Decision

The reference style is feasible, but the default product skin should be world/city themed, not generic tool-themed.

We should split it into two layers:

1. `Core protocol layer`
   - Keep canonical, neutral terms in code and storage.
   - Examples: `world`, `city`, `resident`, `lord`, `steward`.
   - These remain stable for APIs, storage, interconnect, and future clients.

2. `Theme presentation layer`
   - Map canonical roles and places into the current city-bonded product labels.
   - Preferred product-facing labels:
     - `world` -> `世界`
     - `city` -> `城邦`
     - `lord` -> `城主`
     - `steward` -> `守城人` or `城邦维护者`
     - `resident` -> `居民`
   - Rank ladders and honorifics live here too, but they should not introduce center-led language into the visible interface.

This means we do **not** hardcode world/city skin labels into protocol objects now.
Instead, we reserve the product direction and keep the transport/interconnect model stable.

## Why this split matters

If themed names are baked directly into the protocol too early:
- interconnect becomes harder
- neutral clients become harder
- future themes become expensive to add
- OpenClaw and external tools have to learn one cultural skin instead of a stable model

If we leave all theme work until the very end:
- too many UI strings become hardcoded
- role and rank semantics leak into business logic
- later retrofitting becomes messy

So the right move is:
- **theme-aware architecture now**
- **full art/UI treatment later**

## Visual direction

The reference image suggests a practical terminal direction:

### High capability terminals
- SFC-inspired palette philosophy
- richer ANSI color shading
- half-block and Unicode glyph rendering
- portrait popups for key roles
- symbolic world/city map with stronger atmosphere

### Low capability terminals / headless Linux
- FC-style symbolic fallback
- 16-color and ASCII-safe downgrade
- no heavy redraws
- local region updates only

This matches the current TUI render strategy.

## What should be considered early

### 1. Canonical-to-themed label mapping
Need a theme pack that maps:
- place nouns
- role nouns
- action labels
- room labels
- system announcements

### 2. Rank ladder model
Residents may have:
- canonical system role: resident / steward / lord
- optional thematic progression label: 炼气 / 筑基 / 金丹 / 元婴 / 化神 ...

These are different things.

System city-order role should stay canonical.
Theme progression should be layered on top.

### 3. Per-city theme identity
Each city should later be able to declare:
- theme id
- palette id
- title style
- resident naming style
- room naming style

### 4. Per-resident honorifics
Later we should support:
- display title
- custom honorific
- theme rank label
- faction-specific alias

These are presentation fields, not transport-critical fields.

## What can wait until later

These do not need to block current networking work:
- final map layout
- portrait rendering system
- animated ANSI scenes
- city skin packs
- detailed typography tuning
- H5 art treatment

## Suggested implementation order

1. Keep protocol/interconnect nouns neutral
2. Add theme metadata hooks after core messaging is stable
3. Add theme pack loader for TUI and H5
4. Add first theme preset for the world/city skin
5. Add portrait and city-scene rendering after main workflows are usable

## Concrete recommendation

Short version:
- The visual direction is feasible.
- Layout can wait a bit.
- The naming/theme system should be considered **now at the architecture level**, but not fully implemented as the first UI milestone.
- City-order roles and themed ranks must stay separate.

That gives us the best of both worlds:
- stable protocol
- flexible future worldbuilding
- easier interconnect
- easier device compatibility
