# poll

Capability-URL date poll (no logins — the link is the credential). SvelteKit 2 /
Svelte 5 + Tailwind 4 on Cloudflare Workers + D1. Package manager: bun.

## Commands

- `bun run check` — svelte-check (also recompiles Paraglide messages)
- `bun run lint` / `bun run format`
- `bun run test` — vitest unit tests
- `bun run test:e2e` — Playwright; boots the real Worker on :8787
  (`vite build && wrangler dev`) against local D1

## Spec invariant

- `openspec/specs/<capability>/spec.md` is the source of truth for behavior.
  Format is OpenSpec: `### Requirement:` (SHALL prose) + `#### Scenario:`
  (GIVEN/WHEN/THEN bullets); every requirement has at least one scenario.
- ANY behavior change updates the matching `spec.md` AND its colocated
  `openspec/specs/<capability>/*.spec.ts` in the SAME change. New behavior
  area = new directory with both files.
- Larger changes go through the OpenSpec workflow (`/opsx:propose` →
  `/opsx:apply` → `/opsx:archive`); in-flight changes live under
  `openspec/changes/`. Archiving/syncing MUST land the delta in the main
  spec AND its colocated test - the invariant above survives the workflow.
- Playwright test titles must be recognizably traceable to a scenario name
  (semantic match, not string-equal). One test per scenario; extra regression
  tests are fine.
- Specs are behavioral only — no function, file, or component names in them.
- `openspec/specs/DESIGN.md` is the source of truth for look and feel (palette, type,
  icons, motion). A UI change that adds or alters a design rule — new color,
  icon convention, animation, spacing pattern — updates DESIGN.md in the
  SAME change; a UI fix that merely conforms to it does not.
- Procedure: use the `spec-feature` skill. Drift check: `/spec-audit`.

## Facts

- UI strings are NEVER hardcoded — `messages/{da,de,en,es,fr}.json` via Paraglide;
  tests assert `m.*()` values, not literals.
- E2E runs single-worker against one shared local-D1 SQLite file. Seed
  in-process via `openspec/specs/support/db.ts` (delete-then-insert, idempotent);
  each test file owns a fixed `e2e-<area>-*` token/id family. Assert DB
  state with `expect.poll`.
- Unit tests are `src/**/*.test.ts` (vitest). Never name them `.spec.ts` —
  Playwright globs `openspec/specs/**/*.spec.ts`; helpers under
  `openspec/specs/support/` stay plain `.ts`.
- Design tokens and motion rules: `openspec/specs/DESIGN.md`. Product, data
  model, routes, conventions: `openspec/specs/PROJECT.md`.
