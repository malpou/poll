## 1. Copy across all five languages

- [ ] 1.1 Delete `createIntro`, `createIntroQuestion`, `createIntroRsvp` from `messages/{da,de,en,es,fr}.json`; the `pollType*Hint` strings stay as the single explainer
- [ ] 1.2 Add the timezone-note strings ("We've picked {timezone} for you" + change affordance label) in all five languages
- [ ] 1.3 Rename Participants → Invitees wording (values of `participantsSection`, `participantsHint`, and any other participant-labelled strings) in all five languages
- [ ] 1.4 Add the disabled-submit reason strings (missing title, no dates, fewer than two options, no RSVP date) in all five languages

## 2. Create form restructure

- [ ] 2.1 Move the poll type fieldset to the top of the form and drop the intro paragraph
- [ ] 2.2 Swap section order: answer choices above who-can-respond; participant list stays attached under who-can-respond
- [ ] 2.3 Default `pollMode` to `'open'` and render the open option first
- [ ] 2.4 Default `allowPreferred` to `false`; move the "always included" hint above the checkboxes

## 3. Timezone disclosure

- [ ] 3.1 Collapse the timezone into a note naming the picked zone with a change affordance, below the calendar in both dates and RSVP branches; keep the hidden `timezone` input posting while collapsed
- [ ] 3.2 Reveal the existing combobox on activation; auto-collapse ~600ms after a zone is picked, updating the note
- [ ] 3.3 Animate reveal/collapse with a short slide/fade honoring `prefers-reduced-motion`

## 4. Submit gating

- [ ] 4.1 Add a `$derived` validity check per poll type (title non-empty; dates ≥1; question ≥2 non-empty options; rsvp exactly 1 date) and disable the submit button while invalid
- [ ] 4.2 Show a caption naming the first missing thing next to the disabled button

## 5. Motion

- [ ] 5.1 Add short fade/slide transitions to the locale re-render and the type/mode hint swaps
- [ ] 5.2 Add the state-swap motion rule (duration, easing, reduced-motion) to `openspec/specs/DESIGN.md`

## 6. Specs and tests

- [ ] 6.1 Sync the delta into `openspec/specs/event-management/spec.md`
- [ ] 6.2 Update/add colocated tests in `openspec/specs/event-management/event-management.spec.ts`: type-first single explainer, open-mode default, bare-pair choices default, timezone collapsed/reveal/auto-collapse, submit gating (incl. type-switch scenario)
- [ ] 6.3 Sweep existing `openspec/specs/**/*.spec.ts` for creations relying on the old defaults (assigned mode, Preferred on) and make them explicit
- [ ] 6.4 `bun run check`, `bun run lint`, `bun run test`, `bun run test:e2e` all green
