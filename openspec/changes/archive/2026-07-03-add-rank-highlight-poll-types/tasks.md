## 1. Data model and validation

- [x] 1.1 D1 migration: add `events.highlight_budget` (INTEGER NOT NULL DEFAULT 5) and `responses.value` (INTEGER, nullable)
- [x] 1.2 Widen poll_type validation to `{dates, question, rsvp, rank, highlight}`; force `allow_preferred`/`allow_unsure` off for the new types; validate `highlight_budget` 1–10 at the form boundary
- [x] 1.3 Update PROJECT.md data model and product notes (poll_type set, highlight_budget, responses.value)

## 2. Create form

- [x] 2.1 Add rank and highlight to the poll type choice; both reuse the question type's text-options editor and hide date/timezone affordances
- [x] 2.2 Show the stroke-budget field (default 5) only for highlight; server-side create action stores budget and forces toggles off
- [x] 2.3 Reject rank/highlight creation with fewer than two non-empty options and out-of-range budgets

## 3. Rank answering

- [x] 3.1 Rank response page: options as slips with drag handle + move up/down buttons; lifted-slip visuals and flip motion per DESIGN.md additions
- [x] 3.2 Submit action records the full order in `responses.value`; reject missing/duplicate/stale positions; support edit-and-resubmit while open
- [x] 3.3 Option add appends to existing ballots at last position and flags invitees; option remove compacts positions

## 4. Highlight answering

- [x] 4.1 Highlight response page: tap to add a stroke, tap a stroke to remove; stacked hl-swipe bands with deepening tint; marker-cap budget indicator
- [x] 4.2 Submit action records stroke counts in `responses.value`; require ≥1 stroke; reject over-budget/negative/stale submissions; support edit-and-resubmit
- [x] 4.3 Option add flags invitees at zero strokes and opens editing; option remove deletes its strokes

## 5. Results, closing, dashboard

- [x] 5.1 Rank results: Borda score ordering with first-place tiebreak, average position per option, per-respondent positions for the organizer, best-option highlight
- [x] 5.2 Highlight results: stroke totals, proportional bars, ties all highlighted, per-respondent stroke counts for the organizer
- [x] 5.3 Closing and reopening for both types (pick winning option(s), outcome page, immutability while closed) via the existing poll-closing flow

## 6. Landing page and i18n

- [x] 6.1 Add client-only rank and highlight demos to the landing page examples section
- [x] 6.2 Add all new strings (type names, ordering wording, stroke wording, budget field, demos) to `messages/{da,de,en,es,fr}.json`

## 7. Specs, design system, tests

- [x] 7.1 Update DESIGN.md: lifted-slip drag rule, stacked-stroke rule, rank badge numeral
- [x] 7.2 Sync delta specs into main specs (`rank-poll`, `highlight-poll`, `question-options`, `landing-page`)
- [x] 7.3 Colocated Playwright specs: `openspec/specs/rank-poll/*.spec.ts` and `openspec/specs/highlight-poll/*.spec.ts`, one test per scenario, `e2e-rank-*` / `e2e-highlight-*` seed families
- [x] 7.4 Update `question-options` and `landing-page` colocated specs for the modified scenarios
- [x] 7.5 `bun run check`, `bun run lint`, `bun run test`, `bun run test:e2e` all green
