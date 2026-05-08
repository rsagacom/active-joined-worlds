# Novel TTS Playbook

This document mirrors the stabilized audiobook workflow learned from the recent CosyVoice/Fun-CosyVoice3 repair cycle so `lobster-chat` / caretaker / future automation surfaces can reuse the same operating rules.

## What this is for

Use this when an agent needs to turn a novel into long-form audio without silently breaking:

- narration vs dialogue separation
- character identity
- story completeness
- later patch repair and redelivery

## Core operating rules

1. Never go straight from raw layout to full render for a novel.
2. Audit first, then review roles, then render.
3. Treat clone samples as production assets, not casual references.
4. Do not judge quality by segment count alone.
5. For small corrections, rerender a reviewed subset and overlay the patch instead of rerunning the whole book.

## Failure patterns already seen

- quoted emphasis inside narration became fake dialogue
- short dialogue lines drifted to the wrong speaker
- weak male-lead sample drifted toward a female timbre once the heroine appeared
- overlong narration segments truncated during synthesis
- patch overlays produced duplicate wavs when the role label changed
- a render looked "cleaner" only because it lost content and became much shorter

## Required workflow

### 1. Freeze baseline metrics

Record:

- segment count
- total text count
- per-role segment count
- final merged duration

These numbers are the acceptance baseline for later repairs.

### 2. Audit layout before render

Block render if the audit still shows:

- false dialogue
- narration misclassification
- obvious role drift
- suspicious short quoted fragments

### 3. Export the role script

Before full render, generate a role-script view for manual review:

- narration
- male lead
- female lead
- supporting roles

This is the fastest way to see where role drift begins.

### 4. Validate prompt samples

Check each clone sample for:

- duration
- loudness
- conditioning strength

If a character drifts, prefer a stronger same-source prompt over changing the character voice identity.

### 5. Render only from reviewed manifest

Full render is allowed only after:

- audit passes
- role review passes
- prompt samples are normalized or strengthened
- reviewed repairs are frozen

### 6. Patch bad segments surgically

When only a few sections are wrong:

- build a subset manifest
- rerender the bad segment ids
- overlay repaired wavs over the full render
- finalize again

### 7. Overlay patches without stale files

If a segment changes role, its filename changes.

Before copying a repaired wav, delete all existing:

- `seg_XXXX_*.wav`

for the patched segment id, then copy in the repaired file.

### 8. Accept at story level

Do not accept delivery merely because the render completed.

Acceptance requires:

- duration still matches the story scale
- text coverage has not dropped
- key scenes sound correct
- no obvious gender flips or nonsense phonation

## Minimum QA scenes

Always listen to:

- first protagonist appearance
- first protagonist dialogue
- first heroine appearance
- one mid-story monologue
- one late-story dialogue

## Delivery outputs

Produce:

- full wav
- full mp3
- Feishu-safe mp3

When reporting back, state:

- whether it is a full rerender or patch rebuild
- whether prompts were strengthened
- whether mandatory clone samples were preserved
