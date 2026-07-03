# Tasks: stripe-payment-gate

## 1. Data layer

- [ ] 1.1 Migration `0008_add_paid_at.sql`: `ALTER TABLE events ADD COLUMN paid_at TEXT;` + backfill `UPDATE events SET paid_at = created_at;`
- [ ] 1.2 Add `paid_at` to the event type / data-provider reads and the e2e seed helper (`openspec/specs/support/db.ts`), seedable as paid or unpaid

## 2. Stripe plumbing

- [ ] 2.1 Add `stripe` dependency; shared helper building the client from `platform.env.STRIPE_SECRET_KEY` with `createFetchHttpClient()`
- [ ] 2.2 Checkout-session helper: 10 DKK (`unit_amount: 1000`, `currency: 'dkk'`), `metadata: { event_id }`, `success_url {origin}/paid?session_id={CHECKOUT_SESSION_ID}`, `cancel_url {origin}/?canceled=1`; `STRIPE_STUB` branch returns `/paid?session_id=stub-{event_id}`

## 3. Routes

- [ ] 3.1 Create action: insert event unpaid, create checkout session, 303 to it (replaces redirect to `/e/…`); show canceled-checkout hint on `/?canceled=1`
- [ ] 3.2 `/paid` GET: resolve session (stub: mark paid) → event → organizer token → 303 `/e/{token}`; 404 on unknown/incomplete session
- [ ] 3.3 Webhook `POST /webhooks/stripe`: `constructEventAsync` + `createSubtleCryptoProvider()`, 400 on bad signature; on `checkout.session.completed` idempotent `UPDATE … WHERE paid_at IS NULL`, purge the event's cache entries; 200 otherwise
- [ ] 3.4 Organizer load/page: `paid_at IS NULL` → awaiting-payment notice + retry-payment form action (new checkout session), no dashboard controls; ensure unpaid pages aren't served stale from the edge cache
- [ ] 3.5 `/r` and `/s` loads: unpaid event → 404

## 4. Messages

- [ ] 4.1 Paraglide strings (awaiting-payment notice, retry button, canceled hint) in `messages/{da,de,en,es,fr}.json`

## 5. Specs & tests

- [ ] 5.1 Sync delta specs into `openspec/specs/payment-gating/spec.md` and `openspec/specs/event-management/spec.md`
- [ ] 5.2 `openspec/specs/payment-gating/payment-gating.spec.ts`: one Playwright test per scenario (stub-mode create→pay→dashboard, unsigned webhook rejected, duplicate confirmation no-op, unpaid `/e` notice + retry, unpaid `/r`+`/s` 404, paid backfill/old-event behavior), `e2e-pay-*` token family, DB asserts via `expect.poll`
- [ ] 5.3 Update the event-creation e2e (creation now lands on checkout/stub, not the dashboard)

## 6. Deploy

- [ ] 6.1 `wrangler secret put STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`; set `STRIPE_STUB` only in the e2e wrangler config
- [ ] 6.2 Register `https://poll.malpou.io/webhooks/stripe` for `checkout.session.completed` in the Stripe dashboard
- [ ] 6.3 `bun run check`, `bun run test`, `bun run test:e2e`
