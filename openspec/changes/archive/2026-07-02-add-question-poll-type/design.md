## Context

Options are date-typed end to end today: modeled as date + optional times on
input, persisted as `starts_at`/`ends_at` UTC ISO, rendered as
weekday/date/time strings in the event's timezone. But the surrounding
machinery is already option-agnostic:

- `date_options.label` exists in the schema (0001) and is never written or
  read by application code — a column waiting for its first consumer.
- `starts_at`/`ends_at` are nullable, and the date formatter already returns
  empty strings for a null start (a label-only option renders as a blank card
  today, it doesn't crash).
- All option ordering is by `sort_order`; chronological sort is an explicit
  organizer action, not an invariant.
- Results aggregation, best-option scoring, closing/reopen, and the token
  model never look at dates.

So the change is confined to: a type column, the option input UI, a label
path through the option view models, and copy.

## Goals / Non-Goals

**Goals:**

- A second poll type, chosen at creation: **question** — free-form question
  (reuses title/description) with 2+ text options.
- Participants answer via the existing `/r` and `/s` flows with the same
  choice scale; results, closing, and reopening work unchanged.
- Question polls read naturally: per-type choice labels and copy variants
  where date wording would be wrong.

**Non-Goals:**

- Mixed polls (date options and text options in one poll).
- Converting a poll between types after creation.
- Any change to tokens, response semantics, aggregation, or scoring.
- Times, timezones, or chronological sorting on question options.

## Decisions

1. **Reuse `date_options` + its dormant `label` column; add
   `events.poll_type`.** A question option is a row with `label` set and
   `starts_at`/`ends_at` null. `poll_type` ∈ {dates, question}, default
   `dates`. Alternative — a separate `text_options` table — rejected:
   `responses`, the aggregation SQL, closing's `selected` flag, and reorder
   all reference option rows; a second table would fork every one of them for
   zero benefit.
2. **Poll type is immutable** (user decision). Set at creation, never
   accepted by any edit action. Converting date options ↔ text options has no
   sensible semantics; mode and language stay switchable as today.
3. **Per-type choice labels** (user decision). Question polls get their own
   wording for the scale (e.g. Available → "Works for me", Unavailable →
   "Doesn't work"); dates polls keep today's labels. Implemented as parallel
   message keys selected by poll type — the stored `preference` values are
   untouched, so folding, aggregation, and scoring are unaffected.
4. **Copy variants only where date wording is wrong.** Of the ~20–26
   date-flavored keys, only those a question poll actually renders get a
   question variant (section headings, response prompt, chosen-outcome
   headings, new-option banner/badge, delete confirmation, scale labels).
   Keys a question poll never shows (calendar hints, sort-by-date, timezone)
   need no variant.
5. **Question polls hide date affordances rather than generalize them.**
   No calendar/time slots (a text-option list instead — same add/remove list
   pattern as participants on the create page), no timezone picker or
   timezone note, no sort-by-date button. Manual reorder (up/down) works
   unchanged via `sort_order`. The `timezone` column keeps its default; it is
   simply never surfaced.
6. **Rendering branches on the view model, not the formatter.** Option views
   gain a `label`; question polls render the label where dates polls render
   weekday/date/time. The date formatter and the UTC↔wall-clock bridge are
   untouched.
7. **Validation at the form boundary, matching existing style (no SQL
   CHECK).** Question creation requires ≥2 non-empty trimmed option texts;
   option edits reject empty text; `poll_type` validated against the two
   known values.

## Risks / Trade-offs

- [Copy sprawl: every variant key × 5 locales] → Decision 4 caps the set to
  keys a question poll renders; translations land in the same change so no
  locale lags.
- [Vestigial `label` column gains meaning; old rows all have it null] →
  Dates polls never read `label`, question polls always write it; no backfill
  needed. Migration is a single additive `poll_type` column with a default,
  so existing events are valid dates polls.
- [Dates-poll regressions from touching shared option components] → The
  existing e2e suites for all five capabilities run against dates polls
  unchanged; question-poll scenarios get their own colocated spec.
- [Blank card if a question option ever loses its label] → Form-boundary
  validation rejects empty labels on create and edit; the only writer of
  label-only rows is the question flow.

## Migration Plan

One additive D1 migration (`poll_type TEXT NOT NULL DEFAULT 'dates'` on
`events`). Deploy is backward-compatible: existing rows read as dates polls;
rollback is dropping nothing (the column is inert for dates polls).

## Open Questions

None — scale wording (per-type variants) and type mutability (immutable)
were settled with the organizer of this change.
