# Pro poll upgrade (free creation, paid tier)

GitHub issue: https://github.com/malpou/poll/issues/25 (rescoped from
pay-to-create to this model; the issue text matches).

## Why

The poll tool is a free lead magnet for metsa.app: the person who creates a
date poll for a group is very often the volunteer organizer/treasurer metsa
sells to, and the participant links are the tool's distribution channel. A
payment gate on creation (the original #25 plan) kills that viral loop —
every "create your own, free" moment dies behind a checkout. So creation
stays free and instant; monetization moves to an optional per-poll **Pro**
upgrade (10 DKK microtransaction), which doubles as a metsa pitch surface
("or free for metsa.app members" — the member unlock itself is deferred).

## What Changes

- Creating a poll is unchanged: free, instant, lands on the organizer
  dashboard. No unpaid limbo state, no hidden respondent pages.
- New per-event tier: `free` (default) or `pro`. The organizer dashboard
  offers a one-time 10 DKK upgrade via Stripe Checkout.
- Payment confirmation comes from the Stripe webhook (source of truth), not
  the browser redirect — the event turns Pro only when
  `checkout.session.completed` arrives (idempotent on duplicate delivery).
- The organizer token is never placed in Stripe URLs or metadata; the
  return trip (success and cancel) resolves the dashboard server-side from
  the checkout session.
- Participant pages (`/r`, `/s`) of **free** polls show a discreet
  "made with" badge, in the poll's language, linking to the landing page —
  the viral footer. **Pro removes the badge.** Pre-existing events are free
  and gain the badge.
- Launch Pro value is badge removal; further Pro features ship as separate
  changes flipping on the same tier: email notification when everyone has
  answered, deadline/auto-close + reminder nudges, ICS calendar invite on
  close. Free-tier limits (invitee/option caps) are deliberately **not**
  planned — "free without limits" is the positioning against Doodle.
- Deferred: unlocking Pro via metsa.app membership (anticipated mechanism:
  OIDC against the existing Zitadel instance) — a later change.
- E2E: Stripe is stubbed locally (flag-controlled fake checkout) and
  free/pro events are seedable directly.

## Capabilities

### New Capabilities

- `pro-tier`: free-by-default event tier with a per-poll paid upgrade —
  dashboard upgrade action to checkout, webhook-driven activation,
  token-free return trip, made-with badge on free polls' participant pages
  removed on Pro.

### Modified Capabilities

- None. Event creation and all participant flows are untouched.

## Impact

- New dependency: `stripe` SDK (fetch HTTP client + async webhook
  verification for Workers).
- New secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; Stripe dashboard
  webhook endpoint registration.
- D1 migration: nullable `events.pro_at` (UTC ISO text; NULL = free). No
  backfill — existing events are correctly free.
- New routes: Stripe webhook endpoint; a checkout-return endpoint that
  resolves the organizer token server-side.
- Touches the organizer page (upgrade action), `/r` and `/s` rendering
  (badge), edge-cache purge on upgrade, and the e2e seeding helpers.
- Pricing caveat (accepted): Stripe's fixed fee eats ~20% of a 10 DKK
  charge; acceptable — the microtransaction is a funnel signal, not the
  revenue model.
