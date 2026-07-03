# Admin-link email

## Why

The organizer link is the only credential for managing a poll. Today the
organizer must copy it themselves right after creation; if the tab closes or
the link never gets saved, the poll is unmanageable forever. Emailing the link
gives the organizer a durable copy in the place they already keep links.

## What Changes

- The create form gains an **optional** email field. Creation itself is
  unchanged — no email required, no account, the viral loop stays intact.
- When an email is provided, the system sends one transactional email in the
  poll's language containing the organizer (admin) link, right after the poll
  is created.
- When an email is provided, creation also generates a short **admin code**,
  stored on the event and included in the same email. Opening the organizer
  pages from a browser that doesn't hold the code prompts for it once; the
  creator's own browser is unlocked automatically at creation. For these
  polls the organizer link alone is no longer a sufficient credential — a
  leaked URL (history, logs, forwarded screenshot) doesn't grant admin
  access.
- Polls created **without** an email get no code and behave exactly as today —
  no gate, no lockout risk, no change for existing polls.
- The email address is used for that one send and **not stored** — nothing to
  leak, nothing to manage.
- Email delivery is best-effort: a send failure never blocks or rolls back
  poll creation.

## Capabilities

### New Capabilities

- `admin-link-email`: the optional email field on the create form, the
  transactional email carrying the organizer link and admin code, and the
  code gate on organizer pages for polls that have a code.

### Modified Capabilities

None — event creation's existing requirements are untouched; the email field
is optional and additive.

## Impact

- Create form (`/create`): one optional email input + Paraglide messages in
  `messages/{da,de,en,es,fr}.json`.
- Create action: generate the admin code, compose and dispatch the email
  after the event insert, unlock the creator's browser.
- Organizer pages (`/e/[token]`): code prompt when the poll has a code and
  the browser isn't unlocked.
- Schema: one migration adding a nullable `admin_code` column on `events`
  (NULL = no gate, so existing polls and e2e seeds are untouched).
- Infra: Cloudflare Email Service — `send_email` binding in `wrangler.toml`,
  `malpou.io` onboarded for sending (`wrangler email sending enable`).
- E2E: new `openspec/specs/admin-link-email/` suite.
- No new dependencies, no new routes.
