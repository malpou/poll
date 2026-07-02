## 1. Data layer

- [ ] 1.1 Migration 0008: add `poll_type TEXT NOT NULL DEFAULT 'dates'` to `events`; extend the migrations unit test
- [ ] 1.2 Add `pollType` to the event types/rows and `label` to the option types/rows; thread both through the D1 provider (create, read, option insert/update now carrying `label`)

## 2. Creation flow

- [ ] 2.1 Create form: poll-type choice (dates default); question type swaps the calendar/timezone section for a text-option list (reuse the add/remove list pattern) and posts labels
- [ ] 2.2 Create action: validate question polls (≥2 non-empty trimmed labels, valid type), persist `poll_type` + labels; dates flow unchanged

## 3. Dashboard management

- [ ] 3.1 Options section on question polls: text-only add/edit/remove (empty text rejected, delete warns), reorder up/down; hide time fields, calendar, and sort-by-date
- [ ] 3.2 Settings on question polls: hide timezone picker; never accept `poll_type` in any edit action (immutability)

## 4. Rendering

- [ ] 4.1 Option view models carry `label`; response pages (`/r`, `/s`), results cards, and closed-outcome views render the label on question polls instead of weekday/date/time; timezone note stays suppressed
- [ ] 4.2 New-option flagging/badging and chase-up work for question options (should mostly fall out of shared code — verify and fix)

## 5. Copy

- [ ] 5.1 Add question-poll message keys (choice labels in works-for-me/doesn't-work terms, section headings, response prompt, chosen-outcome headings, new-option notices, delete confirmation, create-form type choice + option fields) to `messages/en.json`, selected by poll type at render
- [ ] 5.2 Translate the new keys in `da`, `de`, `es`, `fr`

## 6. Specs and tests

- [ ] 6.1 Sync delta specs into main specs: new `openspec/specs/question-options/spec.md`, modified event-management requirements
- [ ] 6.2 Colocated Playwright spec `openspec/specs/question-options/question-options.spec.ts` — one test per scenario (creation, immutability, manage, no date affordances, text rendering, wording), seeding via `openspec/specs/support/db.ts` with an `e2e-question-*` token family
- [ ] 6.3 Verify existing capability suites still pass against dates polls (`bun run test:e2e`), plus `bun run check` and `bun run test`
