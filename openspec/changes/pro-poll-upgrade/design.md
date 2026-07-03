# Design: Stripe payment gate

## Context

Creation is a form action on `/` (`src/routes/+page.server.ts`) that inserts
the event and 303-redirects to `/e/{organizer_token}`. Token pages are served
through the edge cache in `src/lib/server/cache.ts` and purged by every
mutating action. `wrangler.toml` already has `nodejs_compat`. Issue #25
specifies the flow; the `/create` split (#19) it mentions has not landed, so
the gate attaches to the root create action.

## Goals / Non-Goals

**Goals:**

- 10 DKK Stripe Checkout before a poll activates; webhook is the source of
  truth.
- Unpaid events invisible to respondents; organizer sees awaiting-payment +
  retry.
- Organizer token never sent to Stripe (PROJECT.md: tokens out of logs).
- E2E-testable without Stripe network access.

**Non-Goals:**

- Credit bundles / amortizing Stripe's fixed fee (noted in #25, later).
- Refunds, receipts, VAT handling.
- Cleanup of abandoned unpaid events (leave them; revisit if D1 bloats).

## Decisions

- **`paid_at TEXT` nullable on `events`** (`migrations/0008_add_paid_at.sql`),
  NULL = awaiting payment; backfill `paid_at = created_at` in the same
  migration. Payment state is orthogonal to `status` (open/closed/cancelled),
  so no enum change. Matches the schema's UTC-ISO-text timestamp convention.
- **Stripe SDK with fetch client + async webhook verification.** One shared
  helper builds the client from `platform.env.STRIPE_SECRET_KEY` using
  `Stripe.createFetchHttpClient()`; the webhook uses `constructEventAsync` +
  `createSubtleCryptoProvider()` — Workers has no sync Node crypto.
- **Create action:** keep all validation, insert unpaid, create a Checkout
  session (`mode: 'payment'`, `currency: 'dkk'`, `unit_amount: 1000`,
  `metadata: { event_id }`), redirect 303 to `session.url`. Origin comes from
  the request URL — no config var.
- **Token privacy:** `success_url` is
  `{origin}/paid?session_id={CHECKOUT_SESSION_ID}`; that GET endpoint
  retrieves the session, reads `metadata.event_id`, looks up the organizer
  token in D1, and redirects to `/e/{token}`. `cancel_url` is
  `{origin}/?canceled=1`. Stripe never sees a token. The `/paid` endpoint
  does NOT mark anything paid — display only; unknown/incomplete sessions get
  a 404.
- **Webhook** `src/routes/webhooks/stripe/+server.ts` (POST): verify
  signature, on `checkout.session.completed` run
  `UPDATE events SET paid_at = ? WHERE id = ? AND paid_at IS NULL`
  (idempotent under Stripe's at-least-once delivery), then purge the event's
  organizer/respondent/share cache entries like every other write path.
  Signature failure → 400; unhandled event types → 200 ok.
- **Gating in loads:** organizer load renders an awaiting-payment page (with
  a retry form action that mints a fresh Checkout session) when
  `paid_at IS NULL`; `/r` and `/s` loads treat unpaid as not-found. Unpaid
  organizer/respondent pages bypass the edge cache (or the /r //s 404s are
  already never cached — unknown-token rule) so activation is visible
  immediately after purge.
- **Retry sessions:** just create a new Checkout session each time; Stripe
  sessions expire on their own, and the idempotent UPDATE makes a stale
  double-payment mark nothing twice. ponytail: no session bookkeeping; add a
  `checkout_session_id` column only if support/refunds ever need it.
- **E2E stub:** a `STRIPE_STUB` var (set in the e2e wrangler config only)
  makes the create/retry actions skip Stripe and redirect to
  `/paid?session_id=stub-{event_id}`, and makes `/paid` (stub mode only)
  mark that event paid before redirecting. This exercises the full
  unpaid→paid flow through real routes; webhook signature verification is
  covered by asserting an unsigned POST changes nothing. Seeding paid/unpaid
  events directly stays available via `openspec/specs/support/db.ts`
  (paid_at column added to the seed helper).
- **New Paraglide messages** for the awaiting-payment notice, retry button,
  and canceled-checkout hint in all five locales.

## Risks / Trade-offs

- [Webhook delayed → payer lands on organizer page still "awaiting payment"]
  → `/paid` shows the awaiting state with retry; webhooks arrive in seconds,
  a reload resolves it. No polling machinery.
- [Stub mode accidentally enabled in prod] → stub branch requires
  `STRIPE_STUB` var which only the e2e wrangler config sets; prod config
  never defines it.
- [Stripe fee ≈ 20% of 10 DKK] → accepted in #25; bundles later.
- [Abandoned unpaid rows accumulate] → ignored for now; a scheduled delete
  of `paid_at IS NULL AND created_at < -30d` is a 5-line follow-up.

## Migration Plan

1. Land migration 0008 (adds column, backfills existing rows) — safe before
   code deploys since NULL never occurs for old rows.
2. `wrangler secret put STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`.
3. Deploy; register `https://poll.malpou.io/webhooks/stripe` in the Stripe
   dashboard for `checkout.session.completed`.
4. Rollback: revert the deploy; the column is additive and inert.
