## Why

All three existing poll types (dates, question, rsvp) share one answering verb: pick a state per row. Two new types add answering verbs the product lacks — expressing _order_ (rank) and _intensity_ (highlight) — and give the landing page two more interactive demos that show off the paper-and-ink identity (dragging paper slips, swiping a real highlighter).

## What Changes

- New poll type `rank`: the organizer supplies 2+ text options; each invitee puts them in a strict full order by dragging slips (or tapping move buttons); results rank options by average position (Borda-style), best option highlighted.
- New poll type `highlight`: the organizer supplies 2+ text options and a marker budget (default 5); each invitee spends strokes across options by tapping (cumulative voting); results total strokes per option.
- Both types are text-option polls: they reuse the question type's option management, carry no date affordances, and force the preferred/unsure choice toggles off (rsvp precedent).
- Landing page gains one interactive, client-only example per new type.
- Data model: `events.poll_type` set grows to `{dates, question, rsvp, rank, highlight}`; `events` gains `highlight_budget`; `responses` gains a nullable integer `value` column (rank position or stroke count) alongside `preference`.
- DESIGN.md gains motion/visual rules for the lifted-slip drag and the live marker stroke.

## Capabilities

### New Capabilities

- `rank-poll`: creating a rank poll, answering by ordering options, editing an order, rank results and best-option highlight, closing behavior.
- `highlight-poll`: creating a highlight poll with a stroke budget, answering by spending/removing strokes, stroke results, closing behavior.

### Modified Capabilities

- `question-options`: the poll-type-at-creation and immutability requirements grow to five types; text-option management requirements widen from question-only to all text-option poll types (question, rank, highlight).
- `landing-page`: the interactive poll type examples requirement covers the two new types.

## Impact

- D1 migration: add `events.highlight_budget` and `responses.value`.
- Create form: two new poll type choices; budget field shown only for highlight.
- Response page: two new answering interactions (reorder list, stroke tapping) replacing the state selector for these types.
- Results and organizer dashboard: rank-average and stroke-total presentations reusing the existing result-bar language.
- Landing page: two new demos; `messages/{da,de,en,es,fr}.json` gains strings for all of the above.
- Specs: PROJECT.md data-model/product notes, DESIGN.md motion rules, new capability dirs with colocated Playwright specs, deltas for `question-options` and `landing-page`.
- No new dependencies: drag via pointer events + existing flip transition; strokes via the existing `hl-swipe` visual on transform/opacity.
