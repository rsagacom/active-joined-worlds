# TUI Rendering Strategy

This document defines the direction for the terminal UI before final visual polish begins.

## Design intent

The terminal client should feel like the living main battlefield of the world, not like a debug shell. H5 follows later as a projection, but the TUI owns the first impression and the main action path. The visual target is:

- `FC-style symbolic clarity` for world maps and dense navigation
- `SFC-style atmosphere` for color philosophy, portraits, and special moments
- graceful degradation for low-end or headless terminals

Reference baseline:

- [docs/VISUAL_REFERENCE_STACK.md](docs/VISUAL_REFERENCE_STACK.md)
- 默认聊天首页遵循“聚落内界面”基线
- 世界/城邦页遵循“城邦外界面”基线
- 同一窗口里可以看到不同权能，但不能让权限差异破坏聊天主位

## Layered visual strategy

### 1. World map

Use a more symbolic, FC-like layer for:

- world overview
- 城邦 topology
- movement and discovery
- low-bandwidth rendering

This keeps navigation readable and efficient.

### 2. Dialogue surface

Keep the core IM timeline text-first:

- message readability first
- stable line wrapping
- clear speaker separation
- minimal redraw pressure
- default mental model is `聚落 interior + timeline + 落字栏`, not `城主独立壳 + 杂乱栏目墙`

### 3. Portrait and event cards

Use richer SFC-inspired rendering only for focused surfaces:

- 城主 profile cards
- resident profile cards
- major system events
- special 聚落 moments
- personalized in-room pixel avatars where capability allows

These should use half-block and Unicode block composition where available, but must degrade cleanly.

### 4. Governance and co-build surfaces

- `城主` actions should read like a small set of steward actions
- `世界共建动作` should not be mixed into the default chat surface
- world co-construction should later follow a `Discuz`-like linear co-build structure rather than a free-form cluttered section wall

## Compatibility policy

The runtime should detect terminal capability and choose a render tier.

### Render tiers

- `TrueColor + Unicode blocks`
  - full SFC-inspired palette
  - soft shading and environmental tone
  - portrait cards allowed
- `256 colors`
  - mapped palette, reduced shading
  - still atmospheric, but less subtle
- `16 colors`
  - high-contrast FC-style symbolic mode
  - clarity first
- `ASCII / monochrome`
  - pure low-resource fallback
  - no portrait cards, no soft shading

## Runtime model

The current Rust model encodes this as:

- `TerminalColorSupport`
- `TerminalGlyphSupport`
- `TerminalArtDirection`
- `TerminalRenderProfile`

The TUI currently resolves a runtime profile by:

1. reading terminal color capability
2. checking UTF-8 / glyph support
3. degrading the preferred desktop profile when necessary

## Performance policy

The terminal UI should prefer:

- partial refresh over full-frame redraw
- double buffering where the terminal can afford it
- ASCII or symbolic fallback in weak environments
- compact 聚落/state summaries on mobile or remote shells

## What happens later

Final visual work comes later. When it does, it should follow this rule:

> imitate SFC in palette philosophy and atmosphere, not by forcing heavy pseudo-graphics everywhere

That keeps the client compatible with:

- Linux headless terminals
- SSH sessions
- iTerm / VS Code / WezTerm / kitty class terminals
- future embedded shells and wearable surfaces
