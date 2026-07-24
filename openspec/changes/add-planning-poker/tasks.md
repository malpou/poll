# Tasks: add-planning-poker

## 1. Data layer

- [ ] 1.1 Migration `0011_planning_poker.sql`: `poker_rooms(id, title, deck, controller_token, join_token, status, created_at)` (deck default `'fibonacci'`, status default `'open'`) and `poker_rounds(id, room_id, title, sort_order, final_estimate, decided_at)` (`final_estimate`/`decided_at` nullable). Additive only — no existing table touched
- [ ] 1.2 Room/round types + data-provider reads (create room, list rooms by token, list rounds/results, insert round, finalize round → set `final_estimate`/`decided_at`, close room)
- [ ] 1.3 Token generation reuses the existing base62 ≥128-bit helper for both `controller_token` and `join_token`
- [ ] 1.4 Add rooms + rounds to the e2e seed helper (`openspec/specs/support/db.ts`), seedable open/closed with decided items, `e2e-poker-*` token/id family (delete-then-insert, idempotent)

## 2. Real-time layer (Durable Object)

- [ ] 2.1 `POKER_ROOM` Durable Object class using the WebSocket Hibernation API; binding + migration tag in `wrangler.toml`
- [ ] 2.2 In-DO live state: roster (identity, role, hasVoted), current item phase (`waiting`/`voting`/`revealed`), per-seat vote for the active item, agreement signal — mirrored into the DO's transactional storage so an evicted instance rehydrates the in-flight item
- [ ] 2.3 Snapshot on connect: full room state (phase, roster, revealed votes if any, results log) sent to a newly connected client
- [ ] 2.4 Broadcast on every change (join/leave, vote tick, phase change, reveal, finalize); during `voting` send only per-seat `hasVoted`, never card values
- [ ] 2.5 Message handlers with role enforcement: participant → `vote` (rejected unless phase is `voting`); controller-only → `open`/`reveal`/`revote`/`finalize`/`next`/`close` (ignore from participants). On `finalize`, write `final_estimate`/`decided_at` to the round's D1 row — the single DO→D1 hand-off
- [ ] 2.6 Disconnect drops the seat from the live roster after a short grace; durable record untouched

## 3. Agreement signal + deck

- [ ] 3.1 Canonical deck: numeric `0 1 2 3 5 8 13 21` (deck-indexed) plus specials `?`, `∞`, `☕`
- [ ] 3.2 Signal computation over numeric votes by deck index: `agree` (≥1 numeric, all equal, no ∞ → pre-fill the value), `close` (span == 1, no ∞), `spread` (span ≥ 2, any ∞, or zero numeric votes). `?`/`☕` excluded from the span; `∞` forces spread; `☕` raises the advisory break hint. Unit-tested in `src/**/*.test.ts`

## 4. Routes

- [ ] 4.1 Create-a-room page + action: free/instant, generate tokens, insert room, 303 to the controller console
- [ ] 4.2 Controller console (`/poker/c/{controller_token}`): validate token → room; name/open the next item, reveal, re-vote, record final estimate (suggestion pre-filled on `agree`), close; live via WebSocket; server-rendered results log fallback
- [ ] 4.3 Participant join page (`/poker/j/{join_token}`): name yourself (cookie identity, observer toggle), the deck to vote, face-down/reveal view, live roster + agreement signal; closed room shows results only, no voting
- [ ] 4.4 WebSocket upgrade endpoint: validate the token in D1 → `{room_id, role}`, forward the upgrade to `POKER_ROOM.idFromName(room_id)` asserting role + cookie identity; keep the token out of logs (header/subprotocol or short-lived ticket over a query string); token pages stay `noindex`

## 5. Design & messages

- [ ] 5.1 Card deck UI (hand-drawn-radius paper cards, selected card lifts + ink border on `--hl`; specials as Lucide help-circle/infinity/coffee), face-down back + synchronized reveal flip (transform-only ~240ms ease-out, reduced-motion = opacity), roster with "voted" tick + controller marker, agreement-signal strip (agree = `--hl` tone, close = neutral, spread = `ink-hatch`/`bad`), break hint
- [ ] 5.2 Update `openspec/specs/DESIGN.md` with the new rules (card deck, reveal flip, roster, agreement signal) in the same change per the design invariant
- [ ] 5.3 Paraglide strings in `messages/{da,de,en,es,fr}.json` for deck labels/aria, phases, special cards, join/roster, agreement signal + break hint, results log, close — no hardcoded UI strings, no em-dashes

## 6. Specs & tests

- [ ] 6.1 Sync the delta spec into `openspec/specs/planning-poker/spec.md`
- [ ] 6.2 `openspec/specs/planning-poker/planning-poker.spec.ts`: one Playwright test per scenario, titles semantically traceable. Drive two browser contexts (controller + participant) against the real Worker + DO + local D1 on `:8787`. Cover: create → console; join + roster live; refresh resumes seat; closed room = results only; open voting live; re-vote clears votes; participant cannot drive phases; cast/change vote; votes hidden until reveal; late joiner votes; vote-after-reveal rejected; synchronized reveal + distribution; ∞ forces spread; ☕ break hint; agree/close/spread + no-numeric spread; record suggested / override; decided estimate persists; live phase change reaches everyone; connect mid-session shows state; leaver drops from roster; join token cannot control; controller token controls; close ends estimation. `e2e-poker-*` family; DB asserts (final estimates) via `expect.poll`

## 7. Deploy

- [ ] 7.1 Apply migration `0011` (local + remote); confirm the `POKER_ROOM` DO binding + migration tag deploy
- [ ] 7.2 `bun run check`, `bun run lint`, `bun run test`, `bun run test:e2e`
