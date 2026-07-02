# Add RSVP Poll Type

## Why

Organizers often already know the date and only need a headcount — "are you
coming to this event at this time?" Today the only tool is a date poll, which
forces a fake choice between candidate dates. An RSVP type (issue #17) answers
that with a single fixed date/time and a yes/no per participant.

## What Changes

- New poll type **RSVP**, chosen at creation: title, description, and exactly
  one date/time (start required, end optional).
- Participants answer **yes** or **no** (single tap) plus the existing
  optional note, via the same `/r` (assigned) and `/s` (open) links.
- Organizer dashboard shows a headcount: who's coming, who's not, who hasn't
  answered.
- Closing an RSVP needs no date decision: the organizer either **confirms**
  the event (freezes answers, shows the final headcount on all links) or
  **cancels** it (called off), reusing the existing closed/cancelled states.
- Data model: a `poll_type` column on `events` (`dates` | `rsvp`, default
  `dates` — also the hook for the future question poll, issue #16). RSVP
  reuses `date_options` (one row) and `responses` (yes/no stored as
  `available`/`unavailable`); no new tables, no new preference values.
- RSVP polls do not offer the Preferred / "I don't know" toggles — strictly
  yes/no in v1.
- Existing date polls are untouched; everything defaults to `poll_type =
dates`.

## Capabilities

### New Capabilities

- `rsvp-poll`: the RSVP flow end-to-end — creating an RSVP event with its
  single date/time, the yes/no response page (assigned and open mode), the
  organizer headcount view, and confirm/cancel closing with the outcome shown
  on all links.

### Modified Capabilities

- `event-management`: event creation gains a poll type choice; the
  date-poll-only requirements (manage/reorder multiple date options,
  configurable response choices) are scoped to date polls.
- `availability-response`: the per-date preference grid requirements are
  scoped to date polls (generic requirements — links, language, timezone,
  notes, edit-while-open — stay universal and cover RSVP too).
- `results`: the per-option summary and best-option highlight are scoped to
  date polls; RSVP results are the headcount (in `rsvp-poll`).
- `poll-closing`: "closing requires a decision" is scoped to date polls; RSVP
  closing is confirm-or-cancel (in `rsvp-poll`). Outcome display, reopen, and
  closed-immutability stay universal.

## Impact

- D1 migration `0008`: add `events.poll_type` (TEXT, default `dates`,
  validated at the form boundary like `accent`).
- Create form (`/`): type picker; RSVP branch collapses the calendar to a
  single date/time.
- Response pages (`/r`, `/s`): yes/no rendering for RSVP events.
- Organizer dashboard (`/e`): headcount view and confirm/cancel close flow
  for RSVP events.
- New Paraglide strings in all five locales (yes/no buttons, headcount labels,
  confirmed/called-off outcome copy).
- `openspec/specs/PROJECT.md` data model section; new
  `openspec/specs/rsvp-poll/` with colocated Playwright spec
  (`e2e-rsvp-*` token family); delta updates to the four modified specs and
  their colocated tests.
