# Design: Pro poll upgrade

## Context

The poll tool is positioned as a free lead magnet for metsa.app; the viral
loop (participants seeing "create your own, free") must survive, so nothing
gates creation or participant access. Monetization is an optional per-poll
Pro tier. Token pages are served through the edge cache in
`src/lib/server/cache.ts` and purged by every mutating action.
`wrangler.toml` already has `nodejs_compat`.

## Goals / Non-Goals

**Goals:**

- Creation and all participant flows unchanged — free, instant, never hidden.
- One-time 10 DKK Stripe Checkout upgrades a single poll to Pro; webhook is
  the source of truth.
- Made-with badge on free polls' participant pages (the viral footer);
  Pro removes it.
- Organizer token never sent to Stripe (PROJECT.md: tokens out of logs).
- E2E-testable without Stripe network access.

**Non-Goals:**

- Metsa-membership unlock of Pro — **deferred design decision**; anticipated
  mechanism is OIDC login against the existing Zitadel instance, landing as
  its own change. Nothing here should preclude it; when it lands, an unlock
  source (stripe vs metsa) may be added for funnel measurement.
- The other Pro features (email notify on all-answered, deadline/auto-close
  - reminders, ICS invite on close) — separate changes flipping on `pro_at`.
- Free-tier limits — deliberately never (anti-Doodle positioning).
- Refunds, receipts, VAT handling; credit bundles.

## Decisions

- **`pro_at TEXT` nullable on `events`** (`migrations/0008_add_pro_at.sql`),
  NULL = free. No backfill — existing events are correctly free. Matches the
  schema's UTC-ISO-text timestamp convention. ponytail: no `tier` enum, no
  unlock-source column; add the source column when the metsa unlock lands.
- **Stripe SDK with fetch client + async webhook verification.** One shared
  helper builds the client from `platform.env.STRIPE_SECRET_KEY` using
  `Stripe.createFetchHttpClient()`; the webhook uses `constructEventAsync` +
  `createSubtleCryptoProvider()` — Workers has no sync Node crypto.
- **Upgrade action on the organizer page** (not the create flow): validates
  the token, refuses if already Pro, creates a Checkout session
  (`mode: 'payment'`, `currency: 'dkk'`, `unit_amount: 1000`,
  `metadata: { event_id }`), 303 to `session.url`. Origin comes from the
  request URL — no config var.
- **Token privacy:** `success_url` is
  `{origin}/paid?session_id={CHECKOUT_SESSION_ID}` and `cancel_url` is
  `{origin}/paid?session_id={CHECKOUT_SESSION_ID}&canceled=1`; that GET
  endpoint retrieves the session, reads `metadata.event_id`, looks up the
  organizer token in D1, and 303s to `/e/{token}` (canceled adds a hint
  param). Stripe never sees a token. The `/paid` endpoint does NOT mark
  anything Pro — display/redirect only; unknown sessions get a 404.
- **Webhook** `src/routes/webhooks/stripe/+server.ts` (POST): verify
  signature, on `checkout.session.completed` run
  `UPDATE events SET pro_at = ? WHERE id = ? AND pro_at IS NULL`
  (idempotent under Stripe's at-least-once delivery), then purge the event's
  organizer/respondent/share cache entries — badge visibility flips on
  cached `/r`/`/s` pages. Signature failure → 400; unhandled event types →
  200 ok.
- **Badge:** a small footer on `/r` and `/s` pages of free polls —
  "Made with poll — create your own, free" in the poll's locale (Paraglide),
  linking to the locale's landing URL (`/`, `/da`, …). Rendered wherever
  those pages render (answer form, thanks, outcome). Pro (`pro_at` set) →
  not rendered. Organizer pages never show it (organizers aren't the
  audience for their own badge). If the badge introduces a new visual
  pattern, DESIGN.md is updated in the same change.
- **Dashboard upgrade UI:** a quiet card/section on `/e/…` for free polls:
  what Pro gives (badge removal now; more later), price, upgrade button.
  Pro polls show a small "Pro" marker instead. Copy mentions metsa.app as
  the coming free-unlock path only when that change lands — not before.
- **Retry/repeat checkout:** just create a new Checkout session each time;
  Stripe sessions expire on their own, and the idempotent UPDATE makes a
  stale double-payment mark nothing twice. ponytail: no session
  bookkeeping; add a `checkout_session_id` column only if support/refunds
  ever need it.
- **E2E stub:** a `STRIPE_STUB` var (set in the e2e wrangler config only)
  makes the upgrade action skip Stripe and redirect to
  `/paid?session_id=stub-{event_id}`, and makes `/paid` (stub mode only)
  mark that event Pro before redirecting. This exercises the full free→Pro
  flow through real routes; webhook signature verification is covered by
  asserting an unsigned POST changes nothing. Seeding free/Pro events
  directly stays available via `openspec/specs/support/db.ts` (`pro_at`
  added to the seed helper).
- **New Paraglide messages** for the badge, the upgrade card, the Pro
  marker, and the canceled-checkout hint in all five locales.

## Risks / Trade-offs

- [Webhook delayed → payer lands on a dashboard still showing free] →
  webhooks arrive in seconds, a reload resolves it. No polling machinery.
- [Stub mode accidentally enabled in prod] → stub branch requires
  `STRIPE_STUB` var which only the e2e wrangler config sets; prod config
  never defines it.
- [Stripe fee ≈ 20% of 10 DKK] → accepted; the microtransaction is a funnel
  signal (and a metsa pitch surface), not the revenue model.
- [Badge appears on pre-existing events' participant pages] → intended; it
  is the lead-magnet footer, and old organizers were never promised its
  absence.

## Migration Plan

1. Land migration 0008 (additive nullable column) — safe before code
   deploys; NULL means free, which is the status quo.
2. `wrangler secret put STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`.
3. Deploy; register `https://poll.malpou.io/webhooks/stripe` for
   `checkout.session.completed` in the Stripe dashboard.
4. Rollback: revert the deploy; the column is additive and inert.
