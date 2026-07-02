# Tasks: add-unsure-option

## 1. Data layer

- [x] 1.1 Migration: add `allow_preferred` (default 1) and `allow_unsure`
      (default 0) to `events`; rebuild `responses` with `unsure` in the
      preference CHECK (0004 pattern)
- [x] 1.2 Extend the preference type/enum and event type with the two flags;
      thread them through the D1 data layer (read + write)
- [x] 1.3 Update the data-model note in `openspec/specs/PROJECT.md`

## 2. Event management (create + edit)

- [x] 2.1 Create form: toggles for Preferred (on) and "I don't know" (off);
      persist on create
- [x] 2.2 Dashboard edit surface: same toggles alongside mode/language,
      editable while open
- [x] 2.3 Paraglide strings for toggle labels + unsure label in all five
      locales

## 3. Response page

- [x] 3.1 Render only the event's enabled choices per date; unsure counts
      toward the answer-every-date submit gate
- [x] 3.2 Server-side validation: reject a submitted choice the event does
      not offer
- [x] 3.3 Neutral visual state for unsure (muted ink + card-alt tint, Lucide
      question-mark icon)

## 4. Results

- [x] 4.1 Aggregation: count unsure per option; results show the enabled
      choices (disabling folds recorded answers into available/unavailable)
- [x] 4.2 Expanded breakdown lists names behind the unsure count
- [x] 4.3 Scoring: unsure weight 0 (unit tests for ranking with unsure mixed
      in); answered/partial badges and chase-up treat unsure as answered

## 5. Specs, tests, design

- [x] 5.1 Sync delta specs into the three main capability specs
- [x] 5.2 Playwright tests: one per new/changed scenario in
      event-management, availability-response, results (e2e-* token
      families, seeded via openspec/specs/support/db.ts)
- [x] 5.3 DESIGN.md: document the neutral fourth preference state color
- [x] 5.4 `bun run check`, `bun run test`, `bun run test:e2e` green
