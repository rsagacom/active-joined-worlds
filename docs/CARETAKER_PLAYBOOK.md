# Caretaker Playbook

This note describes how lobster-chat keeps the experience chat-first while letting a light AI patrol and a personal OpenClaw caretaker (the resident dog) stay useful without taking over.

## Experience pillars

- **Resident IM zone** stays simplest: conversation list, input, timeline, and quick `/assistant` commands.
- **Light patrol** watches safety signals, moderation cues, and visitor notes; it surfaces action cards with status updates instead of blocking the user.
- **Caretaker / Owner dog** is the trusted OpenClaw persona that records memories, moderates rooms, notifies residents, and hands off tool contracts.

## Caretaker persona & memory

1. Every caretaker persona has an identity, display name, archetype description, guardrail level, and preferred greeting tone.
2. Memory entries record what the caretaker remembers for the owner and visitor flow: note text, timestamp, reference identity, and trust level.
3. The caretaker may synthesize `visitor_message`s whenever someone leaves a broadcast note for the owner, ensuring the owner sees the context before they return.

## Visitor message & owner notification flow

1. When a visitor engages caretaker logic (e.g., `/owner`), the caretaker emits a visitor message bundle that contains a short summary, visitor handle, urgency flag, and preferred follow-up channel.
2. If the caretaker needs to alert the owner outright, it sends a notification card with owner recipient, priority, and linked moderation or patrol details.
3. Notifications may carry a `tool_contract` outline so the owner can approve or veto downstream actions without leaving the chat window.

## Moderation requests & results

1. Light patrol components generate `moderation_request`s tagged with scope (`room`, `visitor`, `city`), reason, and requested by identity.
2. After review, the system materializes a `moderation_result` containing the decision, resolved timestamp, summary note, and optional references to caretaker memory or visitor messages.
3. Both requests and results are surfaced in the caretaker dock and recorded for traceability.

## Tool contracts & keep-it-light promise

1. Tool contracts describe which helper tool the caretaker plans to call, inputs, estimated time, and owner-confirmation level.
2. Caretaker notifications always mention the contract so residents can accept, modify, or reject calls to external assistants (search, translation, scheduler).
3. The caretaker dog never executes a high-impact tool without leaving a visible action card, a notification, and a follow-up `moderation_result` if safety was involved.
