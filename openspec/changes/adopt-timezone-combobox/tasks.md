## 1. Combo box

- [ ] 1.1 Build a minimal ARIA combo box atom (input + filtered listbox):
      case-insensitive substring match on the localized zone label, arrow-key + Enter + click selection, Esc closes, blur reverts text to the current
      selection; hidden input carries the IANA id under the existing field
      name
- [ ] 1.2 Replace the timezone select on the create page with it (keeps the
      visitor-zone default and live language preview)
- [ ] 1.3 Replace the timezone select in the dashboard edit form with it

## 2. Specs, design, tests

- [ ] 2.1 Sync the event-management delta spec into the main spec
- [ ] 2.2 e2e: cover the four new scenarios (choose by typing + invalid-text
      revert, on create and on edit) in `event-management/create-event.spec.ts`
      and `event-management/timezone.spec.ts`
- [ ] 2.3 DESIGN.md: document the combo box pattern (list styling, motion)
- [ ] 2.4 `bun run check`, `bun run test`, `bun run test:e2e`
