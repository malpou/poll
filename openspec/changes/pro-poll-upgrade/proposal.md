# Stripe payment gate for poll creation

GitHub issue: https://github.com/malpou/poll/issues/25

## Why

Poll creation is free and anonymous, so the service carries hosting cost and
abuse risk with no counterweight. Charging a small one-time fee (10 DKK) per
poll funds the service and deters junk events. The issue was filed as FUTURE
pending a landing/`/create` split (#19); that split has not landed, but the
gate does not depend on it — it attaches to the existing create form action
wherever it lives.

## What Changes

- **BREAKING** Creating a poll no longer lands directly on the organizer
  dashboard: after a valid submission the event is stored as _unpaid_ and the
  organizer is redirected to a Stripe Checkout page (10 DKK, one-time).
- Payment confirmation comes from the Stripe webhook (source of truth), not
  the browser redirect — the event is activated only when
  `checkout.session.completed` arrives (idempotent on duplicate delivery).
- After paying, the organizer returns to the app and is forwarded to their
  dashboard. The organizer token is never placed in Stripe URLs or metadata
  (PROJECT.md: tokens stay out of logs) — the return trip resolves it
  server-side from the checkout session.
- Unpaid events: the organizer page shows an "awaiting payment" state with a
  retry-payment action; respondent (`/r/…`) and shared (`/s/…`) pages return
  not-found until payment completes.
- Existing events are backfilled as paid so nothing already shared breaks.
- E2E: Stripe is stubbed locally (flag-controlled fake checkout) and
  paid/unpaid events are seedable directly.

## Capabilities

### New Capabilities

- `payment-gating`: unpaid-until-paid event lifecycle — redirect to checkout
  on creation, webhook-driven activation, awaiting-payment organizer state
  with retry, respondent/share pages hidden while unpaid, backfill of
  pre-existing events as paid.

### Modified Capabilities

- `event-management`: the "Event creation" requirement changes — a valid
  creation submission now redirects to payment instead of the organizer
  dashboard.

## Impact

- New dependency: `stripe` SDK (fetch HTTP client + async webhook
  verification for Workers).
- New secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; Stripe dashboard
  webhook endpoint registration.
- D1 migration: nullable `events.paid_at` (UTC ISO text; NULL = awaiting
  payment), backfilled to `created_at` for existing rows.
- New routes: Stripe webhook endpoint; a payment-return endpoint that
  resolves the organizer token server-side.
- Touches the create action, organizer/respondent/share loads, edge-cache
  purge on activation, and the e2e seeding helpers.
- Pricing caveat (accepted): Stripe's fixed fee eats ~20% of a 10 DKK charge;
  credit bundles are a possible later optimization, not in scope.
