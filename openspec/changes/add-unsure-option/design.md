# Design: add-unsure-option

## Context

Responses store one row per (invitee, date) with
`preference ∈ {preferred, available, unavailable}` (SQLite CHECK, D1).
A missing row means "no answer yet". The submit gate requires every date
answered; results rank options by `Preferred×1.2 + Available − Unavailable`.
Today every poll offers all three choices; there is no per-event choice
configuration.

## Goals / Non-Goals

**Goals:**

- Per-event choice set: Available/Unavailable always; "Preferred" and
  "I don't know" (`unsure`) individually toggleable at creation and while
  the poll is open.
- Unsure is a real answer: persisted, editable, counts as "answered"
  everywhere answers are counted (submit gate, badges, chase-up, "X of Y").
- Existing polls behave exactly as before (preferred on, unsure off).

**Non-Goals:**

- No custom/free-form choices — exactly these four, two of them fixed.
- No change to the best-option formula — unsure has weight 0.
- No reminder flow targeted at unsure answers.
- No dark mode or new palette tokens.

## Decisions

- **Two boolean event flags, not a choice table.** `allow_preferred`
  (default on) and `allow_unsure` (default off) as columns on `events` —
  plain `ALTER TABLE ADD COLUMN` with defaults, so existing events keep
  today's behavior with no data backfill. A normalized choice list is dead
  flexibility for a fixed set of two toggles.
- **Stored value `unsure`, displayed as "I don't know"** (per locale via
  Paraglide, like every UI string). Fourth enum value, not a nullable/absent
  row: a missing row already means "no answer yet" and unsure is a
  deliberate answer that must survive the partial-submission rule.
- **Migration: rebuild `responses` to widen the CHECK** — SQLite can't alter
  an inline CHECK; copy the 0004 table-rebuild pattern. Existing rows copy
  unchanged.
- **Disabling a choice never rewrites data.** Recorded answers with a
  since-disabled choice stay stored, keep counting as answered, and keep
  showing in results while their count is nonzero. The choice simply stops
  being offered for new or changed answers, and the server rejects it on
  write (validate the submitted value against the event's enabled set —
  trust-boundary check, not just hidden UI).
- **Toggles editable while open** alongside title/mode/language — same
  editing surface and rules as poll mode, no special casing.
- **Scoring weight 0 for unsure.** Stated ignorance; counting it either way
  would bias the highlight. Formula and spec text stay as-is with an
  explicit exclusion note.
- **Visual tone: neutral** — muted ink + `card-alt` tint next to the
  amber/good/bad trio; Lucide question-mark-family stroke icon. New design
  rule → DESIGN.md gains the fourth state color in this change.

## Risks / Trade-offs

- [Organizer disables preferred mid-poll; mixed old preferred + new plain
  answers] → Accepted: results show the recorded truth; the score formula
  still handles it.
- [Everyone picks unsure, no option wins] → Acceptable; all-zero scores
  already yield no highlight, ties are the organizer's call.
- [Table rebuild migration on live D1] → Same pattern already shipped in
  0004; one transaction, small tables.

## Migration Plan

1. One migration: add the two `events` columns (defaults preserve current
   behavior) and rebuild `responses` with the widened CHECK.
2. Deploy code after the migration applies (wrangler applies migrations
   before the new Worker serves). Rollback: old code never writes `unsure`
   and ignores the flags; already-saved unsure rows would strand, so roll
   forward instead.
