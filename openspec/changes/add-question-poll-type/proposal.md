## Why

The app only supports polls whose options are candidate dates, but organizers often need the same collect-preferences flow for non-date decisions ("Which restaurant?", "Which gift?"). The token model, response scale, results aggregation, and closing flow are already option-agnostic — only the option input/rendering layer assumes dates (GitHub issue #16).

## What Changes

- At creation, the organizer picks a poll type: **dates** (current behavior, default) or **question**. The type is immutable after creation.
- Question polls reuse title/description as the question and carry 2+ free-form text options instead of calendar-picked dates.
- Participants answer question polls through the existing `/r` and `/s` flows with the same four-step scale, but the choice labels read in question-poll wording (per-type variants; e.g. "Works for me" / "Doesn't work" instead of "Available" / "Unavailable").
- Dashboard shows per-option distribution and closing picks winning option(s) exactly as for dates; headings and copy that say "date" get question-poll variants.
- Question polls hide date-only affordances: timezone picker, time slots, "sort by date".

## Capabilities

### New Capabilities

- `question-options`: everything question-poll-specific — the type choice at creation (2+ text options, type immutability), managing text options on the dashboard (add, edit, remove, reorder), rendering options as text on response pages/results/outcome, absent date affordances, and question-poll wording (choice labels and copy variants).

### Modified Capabilities

- `event-management`: the creation requirement gains the poll-type choice, and its timezone/date-option demands become scoped to dates-type polls; the event-timezone requirement is likewise scoped to dates polls.

`availability-response`, `poll-closing`, and `results` need no requirement changes: their response, closing, and aggregation behavior is already option-agnostic and applies to question polls as-is. Question-specific rendering and wording on those surfaces is specified in `question-options`.

## Impact

- D1: `poll_type` column on `events` (migration); `date_options.label` (already in schema, currently unused) starts being written/read for question polls.
- Option pipeline: app-level option types, creation form, dashboard option editing, response/results rendering gain a label path alongside the date path.
- i18n: ~20–26 date-flavored message keys gain question-poll variants across all 5 locales; new keys for the type choice and text-option editing.
- E2E: new colocated spec for `question-options`; scenario updates in the four modified capabilities' specs and tests.
