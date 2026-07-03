# Tasks: lead-magnet-touchpoints

> Ordering: `pro-poll-upgrade` lands first (creates the `pro-tier`
> capability, `pro_at`, and the badge).

## 1. Shareable result

- [ ] 1.1 `/s` load: serve assigned-mode polls when decided (closed with chosen dates) as the outcome view; keep not-found while open or cancelled
- [ ] 1.2 Organizer dashboard (decided state): share-the-result copy action reusing the existing copy-link interaction, copying `{origin}/s/{share_token}?ref=result`; absent while open or cancelled

## 2. Post-answer prompt

- [ ] 2.1 Confirmation view after submit/update on `/r` and `/s`: create-your-own prompt on free polls only, linking to the poll-locale landing URL with `?ref=answered`; nothing on Pro polls

## 3. Messages

- [ ] 3.1 Paraglide strings (prompt text + link label, share-the-result action label/confirmation) in `messages/{da,de,en,es,fr}.json`

## 4. Specs & tests

- [ ] 4.1 Sync the deltas into `openspec/specs/poll-closing/spec.md` and `openspec/specs/pro-tier/spec.md`
- [ ] 4.2 Poll-closing e2e (`openspec/specs/poll-closing/*.spec.ts`): scenarios for decided assigned-mode `/s`, hidden open/cancelled assigned `/s`, copy-the-result action present/absent
- [ ] 4.3 Pro-tier e2e (`openspec/specs/pro-tier/pro-tier.spec.ts`): prompt after answering free `/r`, prompt via `/s`, no prompt on Pro
- [ ] 4.4 Verify DESIGN.md needs no update (no new visual pattern expected)

## 5. Verify

- [ ] 5.1 `bun run check`, `bun run test`, `bun run test:e2e`
