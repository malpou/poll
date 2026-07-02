# Tasks: Add RSVP Poll Type

## 1. Data model

- [x] 1.1 Migration `0008_poll_type.sql`: `events.poll_type` TEXT NOT NULL
      DEFAULT 'dates'; apply to local D1
- [x] 1.2 Thread `poll_type` through the event queries/types; validate
      `dates | rsvp` at the form boundary (accent pattern)

## 2. Paraglide strings

- [x] 2.1 Add RSVP strings to `messages/{da,de,en,es,fr}.json`: type picker
      labels, yes/no answers, headcount labels (coming / not coming /
      pending), confirm-event action, confirmed/called-off outcome copy

## 3. Creation

- [x] 3.1 Create form: poll type picker (date poll default); RSVP branch
      collapses the calendar to a single date with optional start/end,
      hides the Preferred / "I don't know" toggles
- [x] 3.2 Create action: RSVP events saved with exactly one option,
      `allow_preferred = 0`, `allow_unsure = 0`; reject ≠1 option
      server-side

## 4. Response pages

- [x] 4.1 `/r`: RSVP rendering — single date/time, yes/no buttons (stored as
      available/unavailable), note field kept; reject other choices
- [x] 4.2 `/s`: same yes/no flow with the name field and `/r` edit-link
      handoff

## 5. Organizer dashboard

- [x] 5.1 Headcount view replacing the results matrix for RSVP: coming / not
      coming / pending with names; "X of Y" in assigned mode, counts only
      in open mode
- [x] 5.2 Single-date editing for RSVP (change date/start/end while open);
      reject option add/remove/reorder server-side for RSVP polls
- [x] 5.3 Close flow for RSVP: confirm (close + select the lone option) and
      cancel (existing flow); no date-selection step
- [x] 5.4 Outcome blocks: confirmed RSVP shows date + final headcount
      (counts only on `/r` and `/s`); cancelled shows called-off message

## 6. Specs and tests (spec-first — write failing tests with each area)

- [x] 6.1 New `openspec/specs/rsvp-poll/rsvp-poll.spec.ts` — one Playwright
      test per scenario in the delta spec, seeded via
      `openspec/specs/support/db.ts` with an `e2e-rsvp-*` token family
- [x] 6.2 Update colocated tests of the four modified capabilities where
      scoping changed behavior (e.g. type picker default on create)
- [x] 6.3 Sync delta specs into `openspec/specs/*/spec.md` and update
      `PROJECT.md` data model (poll_type column) — via `/opsx:sync` or
      archive

## 7. Verify

- [x] 7.1 `bun run check`, `bun run lint`, `bun run test`,
      `bun run test:e2e` all green
