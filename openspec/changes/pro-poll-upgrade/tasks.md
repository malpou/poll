# Tasks: pro-poll-upgrade

## 1. Data layer

- [ ] 1.1 Migration `0008_add_pro_at.sql`: `ALTER TABLE events ADD COLUMN pro_at TEXT;` (no backfill — NULL = free is correct for existing rows)
- [ ] 1.2 Add `pro_at` to the event type / data-provider reads and the e2e seed helper (`openspec/specs/support/db.ts`), seedable as free or Pro

## 2. Stripe plumbing

- [ ] 2.1 Add `stripe` dependency; shared helper building the client from `platform.env.STRIPE_SECRET_KEY` with `createFetchHttpClient()`
- [ ] 2.2 Checkout-session helper: 10 DKK (`unit_amount: 1000`, `currency: 'dkk'`), `metadata: { event_id }`, `success_url {origin}/paid?session_id={CHECKOUT_SESSION_ID}`, `cancel_url` same + `&canceled=1`; `STRIPE_STUB` branch returns `/paid?session_id=stub-{event_id}`

## 3. Routes

- [ ] 3.1 Organizer page: upgrade form action (free polls only — refuse if `pro_at` set) creating a checkout session and 303ing to it; upgrade card for free polls, Pro marker for Pro polls; canceled-checkout hint
- [ ] 3.2 `/paid` GET: resolve session (stub: mark Pro) → event → organizer token → 303 `/e/{token}` (carry canceled hint); 404 on unknown session
- [ ] 3.3 Webhook `POST /webhooks/stripe`: `constructEventAsync` + `createSubtleCryptoProvider()`, 400 on bad signature; on `checkout.session.completed` idempotent `UPDATE … SET pro_at … WHERE pro_at IS NULL`, purge the event's cache entries; 200 otherwise

## 4. Badge

- [ ] 4.1 Made-with badge component on `/r` and `/s` pages (all states: answer form, thanks, outcome), rendered only when the event is free; poll-locale text linking to the locale's landing URL
- [ ] 4.2 Check DESIGN.md: if the badge introduces a new visual pattern, document it in the same change

## 5. Messages

- [ ] 5.1 Paraglide strings (badge, upgrade card, Pro marker, canceled hint) in `messages/{da,de,en,es,fr}.json`

## 6. Specs & tests

- [ ] 6.1 Sync the delta spec into `openspec/specs/pro-tier/spec.md`
- [ ] 6.2 `openspec/specs/pro-tier/pro-tier.spec.ts`: one Playwright test per scenario (free create → dashboard, stub upgrade → Pro, no re-offer on Pro, unsigned webhook rejected, duplicate confirmation no-op, return URL without payment stays free, cancel returns to dashboard, badge on free `/r` + `/s`, no badge on Pro, old event = free), `e2e-pro-*` token family, DB asserts via `expect.poll`

## 7. Deploy

- [ ] 7.1 `wrangler secret put STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`; set `STRIPE_STUB` only in the e2e wrangler config
- [ ] 7.2 Register `https://poll.malpou.io/webhooks/stripe` for `checkout.session.completed` in the Stripe dashboard
- [ ] 7.3 `bun run check`, `bun run test`, `bun run test:e2e`
