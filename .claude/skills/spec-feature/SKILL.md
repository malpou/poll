---
name: spec-feature
description: Spec-first change procedure for this repo. Use whenever adding a feature, changing or removing behavior, fixing a bug that alters observable behavior, or adding a UI flow — BEFORE writing src code. Covers updating specs/<area>/spec.md, writing the colocated Playwright test, and the e2e seeding conventions.
---

# Spec-first change procedure

## Steps

1. **Locate the area.** `ls specs/*/spec.md`; pick the matching directory or
   create a new `specs/<area>/` with a `spec.md` and a `<area>.spec.ts`
   together.
2. **Spec first.** Add or edit the requirement and scenario before any code:

   ```markdown
   ### Requirement: <name>

   The system SHALL <behavior, no implementation detail>.

   #### Scenario: <name>

   - GIVEN <precondition>
   - WHEN <action>
   - THEN <observable outcome>
   ```

   Behavioral only — if the implementation could change without changing
   externally visible behavior, it doesn't belong in the spec. Cover the
   failure/edge case, not just the happy path.

3. **Test second.** Write the colocated `.spec.ts` test; derive the title
   from the scenario name so it's recognizably traceable.
4. **Implement** in `src/` until green.
5. **Design rules.** If the change touches UI, follow `specs/DESIGN.md`
   (palette, type, icons, motion). Introducing or altering a design rule —
   a new color, icon convention, animation, spacing pattern — updates
   DESIGN.md in the same change; conforming to existing rules does not.
6. **Verify:** `bun run check && bun run test && bun run test:e2e`.

## Test conventions

- Assert Paraglide strings, never literals:
  `import { m } from '../../src/lib/paraglide/messages'` →
  `page.getByText(m.bestDate())`.
- Seed via `../support/db` helpers (`seedEvent`, `seedDateOption`,
  `seedInvitee`, `seedResponse`, `wipeEvent`). Call your `seed()` inside each
  test (wipe-then-insert) so `retries: 1` stays deterministic.
- Each file owns a fixed token/id family with a unique prefix
  (`e2e-<area>-...`) — files share one D1 database; never reuse another
  file's ids.
- Assert persistence with `expect.poll(() => dbHelper(...))`, not sleeps.
- Clipboard tests need
  `context.grantPermissions(['clipboard-read', 'clipboard-write'])`.
- Don't add `test.use({ locale })` unless the test is about browser-locale
  behavior — the poll's rendered language comes from the seeded event's
  `locale`, not the browser.
- Pure logic (scoring, date formatting, validation) gets a vitest
  `src/**/*.test.ts` instead of an e2e test.
