# Design: Admin-link email

## Context

Creating a poll returns a secret organizer capability URL and nothing else.
There is no email anywhere in the stack today — no sending infra, no address
stored. The app runs on Cloudflare Workers, which since 2025 can send
transactional email natively via Cloudflare Email Service (a `send_email`
binding, no API keys).

The organizer URL is also the only admin credential. Its token (22-char
base62, ~131 bits) is not brute-forceable, but a URL leaks in ways a second
secret doesn't: browser history, proxy/server logs, screen shares, forwarded
messages. For polls created with an email we add an admin code as that
second secret, so the leaked-URL case no longer grants admin access.

## Goals / Non-Goals

**Goals:**

- One optional email field on `/create`; one transactional email with the
  organizer link and admin code, in the poll's language.
- Organizer pages of a code-carrying poll require the code once per browser;
  the creator's browser never sees the prompt.
- Zero impact on creation when the field is empty or delivery fails, and
  zero impact on existing polls and polls created without an email.
- No new PII at rest.

**Non-Goals:**

- Storing the address, link recovery ("resend my link"), or editing an email
  later — there is nothing stored to resend to.
- Emailing participants (distribution stays organizer-copies-links).
- Lead capture for metsa.app — deliberately out; the address is discarded.

## Decisions

1. **Cloudflare Email Service Workers binding** (`send_email` binding named
   `EMAIL`, `env.EMAIL.send({to, from, subject, html, text})`) over the REST
   API or a third-party sender (Resend, Postmark). Rationale: already on
   Workers, no API keys/secrets to manage, no new dependency. Prerequisite:
   `wrangler email sending enable malpou.io` (one-time; Cloudflare provisions
   SPF/DKIM/DMARC since malpou.io is a zone on the account). Sender:
   `poll@malpou.io`.
2. **Send-and-discard.** The address is read from the form, used for one
   send, never written to D1. No address column, no GDPR surface, nothing to
   leak.
3. **Best-effort, non-blocking.** The send runs via
   `platform.context.waitUntil` after the event insert; the redirect to the
   dashboard never waits on it and a failure is logged, not surfaced.
   Rationale: the dashboard the user lands on shows the same link — the email
   is a convenience copy, not the delivery mechanism.
4. **Localized via Paraglide** with an explicit locale override
   (`m.x(..., { locale })` using the poll's `locale`), same message files as
   the UI. Both `html` and `text` bodies (deliverability + spam score). Body
   is minimal: what this is, the organizer link, "keep it secret" line.
5. **Binding-absent guard.** If the `EMAIL` binding is missing (local
   `wrangler dev`, e2e, preview), skip the send silently. Keeps local dev and
   the e2e worker working with no email onboarding.
   `// ponytail: no local email capture; add a dev mailbox if we ever need to e2e-assert email bodies`
6. **Testing split.** E2E (Playwright) covers the observable flow: field is
   optional, invalid address rejected, creation with an address still lands
   on the dashboard, and D1 holds no address anywhere. Email composition
   (localized subject/body contain the organizer link and code) is a vitest
   unit test on the compose step, asserting `m.*()` values. The code gate is
   fully e2e-testable without email: seed an event with `admin_code` set and
   drive the prompt from a fresh browser context.
7. **Admin code only when an email is given.** Generated at creation: 8
   chars from an unambiguous alphabet (A–Z without I/O, digits 2–9), ~40
   bits — 32^8 ≈ 10^12, so online guessing is impractical and we skip
   building a rate limiter. Stored plaintext in a new nullable
   `events.admin_code` column; hashing it is theater while `organizer_token`
   sits plaintext in the same row. `NULL` = ungated, so every existing poll,
   every no-email poll, and every current e2e seed keeps today's behavior.
   `// ponytail: no rate limit on code entry; add one if the code ever drops below ~40 bits`
8. **Gate at the organizer layout, cookie unlock.** The organizer route's
   server layout compares a per-event, HttpOnly, long-lived cookie against
   `admin_code` (constant-time compare); missing/mismatched renders the code
   prompt and loads no organizer data. Correct entry and the create action
   both set the cookie, which is why the creator never sees the prompt.
   Alternatives: per-action checks (scattered, easy to miss one) or a D1
   session table (overkill — the cookie holding the code IS the session).

## Risks / Trade-offs

- [Typoed/foreign address gets the secret organizer link] → single neutral
  transactional email; the link is the same credential the user already
  holds; acceptable for v1 (same posture as PROJECT.md capability-URL
  decision).
- [Email Service limits/beta behavior] → best-effort design means any
  send failure degrades to today's behavior (copy the link yourself).
- [Deliverability] → Cloudflare-managed SPF/DKIM on malpou.io, text+html
  bodies, transactional-only content.
- [No storage means no resend] → accepted; adding storage later is a plain
  additive migration.
- [Code lives in the same email as the link] → the gate defends against URL
  leakage (history, logs, screen shares), not against a compromised inbox —
  whoever holds the email holds both secrets. Accepted: the inbox was
  already the recovery channel.
- [Organizer clears cookies / switches device] → they re-enter the code from
  the email; losing the email means losing the link too, so the code adds no
  new lockout path.
