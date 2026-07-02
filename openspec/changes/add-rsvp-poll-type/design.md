# Design: Add RSVP Poll Type

## Context

The data model already carries everything an RSVP needs: `date_options` holds
the one date/time, `responses.preference` holds the answer, and since the
configurable-choices change an event restricted to Available/Unavailable is
exactly a yes/no question. The delta is a type discriminator plus
presentation: creation branch, yes/no response page, headcount, and a
decision-free close.

## Goals / Non-Goals

**Goals:**

- RSVP polls with one fixed date/time and yes/no answers, working in both
  assigned and open mode, in all five languages.
- Zero behavior change for existing date polls.
- The `poll_type` discriminator reusable by the future question poll (#16).

**Non-Goals:**

- A "maybe" answer (the `allow_unsure` machinery would give it nearly for
  free, but #17 specifies strict yes/no — possible follow-up).
- Converting an existing poll between types.
- The question poll type itself (#16).

## Decisions

### 1. `poll_type` column, not new tables

`events.poll_type` TEXT NOT NULL DEFAULT `dates`, values `dates` | `rsvp`,
validated at the form boundary like `accent` (no SQL CHECK). An RSVP is a
degenerate date poll: one `date_options` row, answers in `responses`.

- Alternative — dedicated RSVP tables: rejected; duplicates invitee/response
  plumbing and every token/access path for no gain.

### 2. Yes/no stored as `available`/`unavailable`

No new preference values. The response page for an RSVP renders the pair as
Yes/No (new Paraglide strings); storage, aggregation, and the
answered/pending logic are untouched. RSVP events are created with
`allow_preferred = 0` and `allow_unsure = 0`, and the choice toggles are not
offered on them — the existing server-side "disabled choice rejected"
validation then already blocks crafted preferred/unsure submissions.

- Alternative — explicit `yes`/`no` values: rejected; new enum members leak
  into every query and the folding rules for nothing observable.

### 3. Exactly one option, enforced at the form boundary

RSVP creation requires exactly one date (optional start/end time, same
validation as date options today). Option add/remove/reorder actions are
rejected server-side for RSVP polls; editing the single option's date/time
stays allowed while open (events get moved).

### 4. Closing reuses closed/cancelled verbatim

Confirming an RSVP sets status `closed` and flags the lone option
`selected = 1` — the existing outcome machinery (locked responses, reopen
clearing the decision, closed-immutability) applies unchanged. Cancelling is
the existing cancel: called off. The only new UI is the organizer's
confirm/cancel pair replacing the date-selection close flow, and a
headcount-shaped outcome block instead of preference bars.

- Alternative — a separate "frozen" status: rejected; closed/cancelled
  already mean "happening" / "called off" once there is only one date.

### 5. Spec shape: one new capability + scoping deltas

New `openspec/specs/rsvp-poll/` owns the RSVP flow end-to-end with its
colocated Playwright spec (`e2e-rsvp-*` token family). The four existing
capabilities only get their date-grid-specific requirements scoped to date
polls; universal requirements (tokens, language, timezone, notes,
edit-while-open, immutability, reopen) stay as they are and cover RSVP.

## Risks / Trade-offs

- [Crafted request adds a second option to an RSVP] → option mutations check
  `poll_type` server-side, mirroring the closed-poll immutability pattern.
- [Date-poll UI paths assume >1 option (best-option highlight, chase-up)] →
  both are scoped to date polls in specs; RSVP renders the headcount view
  instead of the results matrix.
- [Legacy rows have no `poll_type`] → migration default `dates` backfills;
  no code path reads NULL.

## Migration Plan

Migration `0008_poll_type.sql`: `ALTER TABLE events ADD COLUMN poll_type
TEXT NOT NULL DEFAULT 'dates'`. Purely additive; rollback is dropping the
column (or ignoring it — nothing breaks if unused).
