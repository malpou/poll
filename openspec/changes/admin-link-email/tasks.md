# Tasks: admin-link-email

## 1. Infra

- [ ] 1.1 Onboard the sending domain: `bunx wrangler email sending enable malpou.io` (one-time, verify with `email sending list`)
- [ ] 1.2 Add the `send_email` binding named `EMAIL` to `wrangler.toml` and to the platform types

## 2. Admin code + schema

- [ ] 2.1 Migration `0009_admin_code.sql`: nullable `admin_code TEXT` on `events`; reflect it in the D1 row types and migration test
- [ ] 2.2 Code generator: 8 chars from the unambiguous alphabet (A–Z minus I/O, 2–9), crypto-random; vitest unit test for alphabet/length

## 3. Email composition + send

- [ ] 3.1 Add Paraglide messages (subject, body lines incl. the admin code, keep-it-secret warning, form label/hint, invalid-email error, code-prompt title/label/submit/error) to `messages/{da,de,en,es,fr}.json`
- [ ] 3.2 Write the compose-and-send helper: builds subject/text/html in the poll's locale (`m.*({}, { locale })`) with the organizer URL and admin code; no-op when the `EMAIL` binding is absent
- [ ] 3.3 Vitest unit test: composed subject/body use `m.*()` values in the poll's locale and contain the organizer link and the code

## 4. Create form + action

- [ ] 4.1 Add the optional email input to `/create` (localized label/hint, follows live language switch)
- [ ] 4.2 Create action: validate the email when present (reject invalid with localized message, don't create); generate and store `admin_code`, set the unlock cookie on the redirect, then dispatch the send via `waitUntil` after the insert — never store the address, never block the redirect

## 5. Code gate on organizer pages

- [ ] 5.1 Organizer route server layout: when the event has `admin_code` and the per-event cookie doesn't match (constant-time), render the code prompt and load no organizer data
- [ ] 5.2 Code prompt page: localized form; correct code sets the HttpOnly long-lived cookie and shows the dashboard; wrong code shows the localized error

## 6. Spec + e2e (spec invariant)

- [ ] 6.1 Sync the delta into `openspec/specs/admin-link-email/spec.md` (new capability dir)
- [ ] 6.2 Write `openspec/specs/admin-link-email/admin-link-email.spec.ts` — one test per scenario: create without email (ungated), invalid email rejected, create with email lands on dashboard without prompt, address absent from every D1 table, creation works with delivery unavailable (local = binding absent), fresh browser context gets the prompt, correct code unlocks and persists, wrong code rejected, seeded no-code poll ungated
- [ ] 6.3 `bun run check`, `bun run lint`, `bun run test`, `bun run test:e2e`
