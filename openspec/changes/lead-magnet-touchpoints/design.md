# Design: Lead-magnet touchpoints

## Context

Every event already mints a `share_token` regardless of mode (PROJECT.md:
"so a poll can switch to open later without a migration"), so the shareable
result page needs no schema work — only the `/s` load currently refuses
assigned-mode polls. The post-answer confirmation view exists (the thanks
state after submitting on `/r`/`/s`). Token pages go through the edge cache
and every mutating action purges, so closing a poll already refreshes what
`/s` serves. The made-with badge and the free/Pro tier arrive with the
in-flight `pro-poll-upgrade` change.

## Goals / Non-Goals

**Goals:**

- Catch the just-answered participant with a create-your-own prompt
  (free polls only — same promotion rule as the badge).
- Make a decided poll's result linkable in any mode via the existing
  `/s/{share_token}` page, and surface a copy action on the organizer
  dashboard.
- Attribute viral traffic with a lightweight source param.

**Non-Goals:**

- Any promotion on Pro polls' participant pages.
- Social/OG preview images for the result link (plain link is enough; add
  if group-chat sharing proves out).
- Analytics infrastructure — the source param is readable in Cloudflare's
  existing request analytics; nothing new is built to consume it.
- Links to metsa.app itself (no metsa surface exists in-product yet).

## Decisions

- **`/s` load for assigned mode:** allow only when the poll is decided
  (status closed with chosen dates); open or cancelled assigned polls keep
  the existing not-found. Open-mode behavior is unchanged. This reuses the
  minted-for-every-event share token — no new token kind, no migration.
- **Post-answer prompt** renders in the existing confirmation view after
  submit/update, on free polls only (`pro_at IS NULL`), linking to the
  poll-locale landing URL with `?ref=answered`. ponytail: a message + link
  in the existing thanks block, not a new component tree.
- **Share-the-result action** on the decided dashboard reuses the existing
  copy-link interaction from the invitee-links UI, copying
  `{origin}/s/{share_token}?ref=result`. Not offered while open (assigned
  `/s` would 404) or cancelled (nothing to celebrate).
- **Celebratory framing:** the decided `/s` page leads with the existing
  outcome heading conventions per poll type; no new visual pattern is
  expected, so DESIGN.md should be untouched — verify during
  implementation.
- **Source params (`ref=answered|result`)** are attribution only: ignored
  by the app, never persisted, stripped from nothing. Kept out of specs on
  purpose (not behavior).

## Risks / Trade-offs

- [Assigned-mode organizers may not want results public-by-link] → counts
  only, never names (existing rule); the link is unguessable and shared by
  the organizer's own choice; reopening the poll makes `/s` not-found
  again.
- [Prompt could feel like an ad on the answer flow] → one quiet block in
  the confirmation view only, poll-locale, free polls only — participants
  of Pro polls never see promotion.
- [Ordering: this change touches the `pro-tier` capability and the
  free/Pro flag] → land `pro-poll-upgrade` first; its delta creates the
  capability spec and `pro_at`.

## Migration Plan

None — no schema, no secrets, no new routes. Deploy is a plain code deploy;
rollback is a revert.

## Open Questions

- None blocking. Whether the result page later gets an OG preview image is
  a follow-up decision once sharing behavior is observable.
