# Lead-magnet touchpoints

GitHub issue: https://github.com/malpou/poll/issues/28

## Why

The poll tool is a free lead magnet for metsa.app, and its distribution is
the product itself: one organizer, many participant links. The made-with
badge ships with `pro-poll-upgrade`; this change adds the two remaining
viral touchpoints from the strategy — catching the participant at the
moment they've just answered (peak product-value clarity), and making the
"we found a date 🎉" outcome a link the group throws into its
Messenger/WhatsApp thread.

## What Changes

- After a participant submits their answer on a **free** poll, the
  confirmation view invites them to create their own poll ("takes 30
  seconds"), linking to the landing page in the poll's language. Pro polls
  show no prompt — same rule as the badge.
- A decided poll's shared link (`/s`) becomes a shareable result page in
  **every** mode: today it only serves open-mode polls, so an assigned-mode
  poll's result can't be linked at all. After closing with chosen dates,
  `/s` shows the celebratory outcome (chosen date + count bars, counts
  only, never names) for assigned polls too. While open or cancelled,
  assigned-mode `/s` keeps returning not-found.
- The organizer dashboard of a decided poll offers a "share the result"
  copy action for that link.
- Viral links carry a source parameter for attribution (design detail, not
  spec'd behavior).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `poll-closing`: "Outcome shown to participants" extends to the shared
  link regardless of mode; new requirement for the organizer's
  share-the-result action.
- `pro-tier`: new requirement — post-answer create-your-own prompt on free
  polls' confirmation views, absent on Pro. **Depends on the in-flight
  `pro-poll-upgrade` change landing first** (it creates the `pro-tier`
  capability and the free/Pro tier itself).

## Impact

- `/s` load: serve decided assigned-mode polls (outcome view only).
- Participant post-submit confirmation view: the create-your-own prompt.
- Organizer dashboard decided view: copy-result-link action.
- New Paraglide messages in `messages/{da,de,en,es,fr}.json`.
- E2E: new scenarios in the poll-closing and pro-tier suites.
- No schema, no new dependencies, no new routes.
