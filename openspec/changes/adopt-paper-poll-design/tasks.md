# Tasks — adopt-paper-poll-design

## 1. Foundation

- [ ] 1.1 Rewrite `openspec/specs/DESIGN.md` to the Paper Poll system
      (paper/ink palette, four accent colors, Courier Prime, hand-drawn
      radius tiers, Lucide sizing, grain, hatch/strikethrough conventions,
      motion values)
- [ ] 1.2 Replace `@theme` tokens in `src/routes/layout.css`: palette,
      radius tiers, `--hl` accent mapping via `data-accent`, paper-grain
      body pseudo-element; swap Inter → Courier Prime

## 2. Accent color (behavior)

- [ ] 2.1 D1 migration: `events.accent` TEXT NOT NULL DEFAULT 'yellow';
      validate `yellow|pink|green|blue` in create/edit actions
- [ ] 2.2 Accent swatch picker on the create page and dashboard edit form
      (new Paraglide strings in all five locales)
- [ ] 2.3 Set `data-accent` from event data on all event pages
      (`/e`, `/r`, `/s`)
- [ ] 2.4 Playwright tests for the four accent scenarios in
      `openspec/specs/event-management/`

## 3. Calendar date picking (behavior)

- [ ] 3.1 Month-calendar component: prev/next month, locale weekday header,
      toggleable day buttons
- [ ] 3.2 Per-selected-day time slots (`<input type="time">`, add/remove
      slot); serialize (day, slot) pairs to `date_options` on create
- [ ] 3.3 Use the same calendar + slots in the dashboard add-date flow
- [ ] 3.4 Update/add Playwright tests: calendar toggle + multi-slot
      scenarios; adjust existing date-row tests to the new flow

## 4. Restyle atoms

- [ ] 4.1 `Button` variants → ink CTA (hover lift), dashed add-row, ghost
      invert-on-hover; icon-only square keeps accessible label
- [ ] 4.2 `SectionHeading`, pills/badges, toast (ink, bottom-center),
      underline inputs, bordered textarea, dashed dividers
- [ ] 4.3 Three-state selector: gliding indicator with highlighter /
      gray / ink-hatch states, strikethrough on unavailable, filled star
      on preferred
- [ ] 4.4 Update `src/lib/motion.ts` params (fadeUp ~240ms, 35ms stagger,
      glide `cubic-bezier(.3,1.25,.5,1)`, bar grow ~450ms)

## 5. Restyle routes

- [ ] 5.1 Create page (`/`) incl. language row and who-can-answer radios
- [ ] 5.2 Respond pages (`/r`, `/s`) incl. answered/edit notice card
- [ ] 5.3 Organizer dashboard (`/e`): links, save-link notice, chase-up
      list, results bars + best-date badge, participants
- [ ] 5.4 Error/not-found and any remaining pages

## 6. Verify

- [ ] 6.1 `bun run check`, `bun run lint`, `bun run test`,
      `bun run test:e2e` all green
- [ ] 6.2 Run `/spec-audit` for spec/DESIGN drift; fix findings
