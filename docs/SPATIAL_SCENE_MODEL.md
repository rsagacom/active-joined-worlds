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

Recommended rights:

- `lord`: full city scene edit rights
- `steward`: delegated edit rights for approved public zones
- `resident`: no direct public scene rewrite unless granted a scoped role

Editable city-scene domains:

- city title and signboard
- district naming
- public decorative preset
- announcement boards
- public room entrances
- city palette / atmosphere

### Room editing rights

Room scenes are more personal.

Recommended rights:

- `direct room`: owner-centric, with optional shared decoration rules
- `shared room`: owner or approved co-editors
- `private personal room`: only the owner

Editable room-scene domains:

- furniture preset
- object placement slots
- wall / floor palette
- desk / bed / shelf / workstation motif
- avatar placement and pose
- displayed status objects
- room helper placement and visibility
- room storefront shelf / listing wall placement

## Safety boundary

Customization must not bypass world safety.

World governance should be able to moderate:

- public city signage
- public city scene assets
- public scene text and image references
- clearly illegal or abusive decorative content

World governance should not automatically read or seize:

- private plaintext chat history
- purely local personal archives

This keeps strong public moderation without collapsing private ownership.

## Terminal-first rendering recommendation

### City in terminal

Use a symbolic `city layout panel` with:

- district blocks
- key structures
- route lines
- city-lord hall highlight
- resident district markers
- relay / transfer marker

This matches the user's reference and keeps city navigation legible.

### Room in terminal

Use a more compact `personal room panel` with:

- workstation area
- seating / rest area
- personal objects
- status board

## H5 pixel-scene layer contract

The current accepted H5 direction is a layered pixel scene, not a dense dashboard.

Layer order:

- bottom: complete scene image, generated or hand-composed as one coherent place
- middle: transparent hotspot layer over meaningful objects
- top: text conversation layer and composer

Interaction rules:

- Text conversation is the highest-priority layer during chat.
- Message flow follows WeChat semantics: peer messages on the left, self messages on the right, and the timeline scrolls upward as a waterfall.
- Clicking empty scene space hides the text conversation layer and HUD chrome for temporary scene viewing.
- Clicking empty scene space again restores the text conversation layer.
- Clear mode must not leave a floating “dialog box” tag; it should genuinely show the scene.
- Hotspots remain under the text layer. They are invisible by default and reveal labels only on hover/focus, such as `相册`, `公告栏`, `地铁口`, or `商铺`.
- Clicking a hotspot opens its own small contextual panel and must not trigger chat-layer clear/restore.

Scene split:

- `住宅`: personal/direct-chat room, currently represented well by the modern indoor workstation scene direction.
- `主城`: public/group-chat place, should use a Chinese modern urban district or plaza scene, not a residential interior and not ancient/xianxia/wuxia assets.
- in-room avatar sprite or symbolic placeholder
- assistant slot / kiosk slot
- timeline panel below

## Bot-aware scene rule

Spatial scenes should assume that some rooms and cities contain helper bots.

At minimum, the scene system should support:

- a caretaker slot
- a decoration slot
- a merchant slot

This matters because the product is not just:

- `message timeline + background automation`

It is becoming:

- `message timeline + personal room + delegated helper presence`

That means scene metadata should be able to describe:

- where a helper stands or appears
- whether it looks like a pixel person, kiosk, terminal, or service desk
- whether it may leave notes for visitors
- whether it may edit decor
- whether it may expose a listing or service board

### Portraits and avatars

Where terminal capability allows:

- show pixel portrait cards for city lord and resident profiles
- show a small in-room avatar using block glyphs or sprite approximation

Where capability is weak:

- degrade to labels and symbolic figure markers

## Architecture recommendation now

We do not need full scene editing UI immediately.
But we should prepare for it now by reserving:

- city scene preset hooks
- room scene preset hooks
- avatar preset hooks
- theme pack metadata hooks

This avoids a later rewrite.

## Suggested implementation order

1. Keep protocol nouns neutral
2. Add scene metadata structs and preset hooks
3. Build TUI/H5 layout regions for city scene and room scene
4. Add avatar preset support
5. Add city-lord scene editing
6. Add resident room editing
7. Add richer pixel/avatar packs later

## Concrete recommendation

Short version:

- the city reference is good for public city surfaces
- the room reference is good for direct-message/personal spaces
- city scenes should be governed by the city lord side
- room scenes should be personalized by users
- the lobster mascot should be replaced by personalized pixel characters as the main in-room identity
- protocol stays neutral; scene style stays in metadata and rendering layers
