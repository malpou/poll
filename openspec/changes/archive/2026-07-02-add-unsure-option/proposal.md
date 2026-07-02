# Proposal: add-unsure-option

## Why

Invitees who genuinely don't know their availability yet are forced to guess
(or skip answering, blocking submit). And not every poll wants the extra
choices: some organizers want a plain yes/no. Make the choice set fit the
poll: Yes/No always, "Preferred" and "I don't know" as per-event options.

## What Changes

- Available and Unavailable (yes/no) are ALWAYS offered — not configurable.
- "Preferred" becomes a per-event toggle (default on, matching today).
- New per-event toggle "I don't know" (`unsure`, default off): an explicit
  neutral answer that counts as answering that date.
- Organizer sets both toggles at creation and can change them while the poll
  is open. Disabling a choice folds already-recorded answers into the fixed
  pair — Preferred becomes Available, "I don't know" becomes Unavailable —
  and it stops being offered.
- Results count and break down the event's enabled choices; best-option
  scoring is unchanged (`Preferred×1.2 + Available − Unavailable`), with
  unsure carrying no weight.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `event-management`: new requirement — configurable response choices
  (Preferred and "I don't know" toggles; yes/no fixed).
- `availability-response`: the offered choices follow the event's
  configuration; "I don't know" counts as an answer for the submit gate;
  disabled choices are rejected server-side.
- `results`: summary and breakdown include the unsure choice and handle
  since-disabled choices with recorded answers; best-option highlight
  explicitly ignores unsure.

## Impact

- DB: two boolean columns on `events` (preferred on / unsure off for
  existing rows); widen the `responses.preference` CHECK to include
  `unsure` (SQLite table rebuild, as in migration 0004). Update the
  data-model note in `openspec/specs/PROJECT.md`.
- Code: preference type/enum, create + edit event forms, response page UI,
  server-side choice validation, results aggregation and view.
- i18n: new strings (unsure label, toggle labels) in all five
  `messages/*.json` locales.
- Design: a neutral fourth state color joins amber/good/bad — DESIGN.md
  update in this change.
- Tests: colocated Playwright specs for the three capabilities; unit tests
  for scoring/aggregation.
