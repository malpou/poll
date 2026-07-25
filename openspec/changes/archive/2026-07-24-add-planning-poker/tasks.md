# Tasks: add-planning-poker

Transport note: shipped D1-backed (short-polled state endpoint), not a Durable
Object, after the adapter-cloudflare DO-export constraint (see design.md).

## 1. Data layer

- [x] 1.1 Migration `0011_planning_poker.sql`: durable `poker_rooms` +
      `poker_rounds`, plus the live-state tables `poker_participants` +
      `poker_votes` and the room's `phase` / `active_round_id` / `rev`. Additive
      only, nothing to backfill
- [x] 1.2 Row types (`PokerRoomRow`, `PokerRoundRow`, `PokerParticipantRow`,
      `PokerVoteRow`, `RoomPhase`, `ParticipantRole`) and a self-contained
      `pokerProvider` (create room, resolve by token, roster/votes/results reads,
      vote + controller commands, each bumping `rev`)
- [x] 1.3 Token generation reuses the existing base62 ≥128-bit helper for both
      `controller_token` and `join_token`
- [x] 1.4 Rooms + rounds in the e2e seed helper
      (`openspec/specs/support/db.ts`), seedable open/closed, `e2e-poker-*`
      token/id family (delete-then-insert, idempotent, FK-safe)

## 2. Real-time layer (D1-backed)

- [x] 2.1 `GET /poker/api/[token]/state`: viewer snapshot; each poll doubles as
      a heartbeat. `POST /poker/api/[token]/command`: one action
      (join/vote/heartbeat/leave + controller open/reveal/revote/finalize/close)
- [x] 2.2 Live state in D1: room phase + active round, `poker_participants`
      (heartbeat presence), `poker_votes` (active item, cleared on
      finalize/re-vote)
- [x] 2.3 Snapshot on load: full room state (phase, roster, revealed votes if
      any, results log); client short-polls ~1s (`RoomClient`)
- [x] 2.4 Vote privacy in `buildSnapshot`: during `voting` only per-seat
      `hasVoted` (+ the caller's own card echoed), never other cards, until
      `revealed`. Unit-tested
- [x] 2.5 Role enforcement: control commands controller-token-only (403
      otherwise); `castVote` guarded in SQL (voting phase + registered estimator);
      `finalize` writes `final_estimate`/`decided_at` to the round
- [x] 2.6 Presence-windowed roster: a lapsed heartbeat drops the seat from the
      live roster; durable record untouched

## 3. Agreement signal + deck

- [x] 3.1 Canonical deck: numeric `0 1 2 3 5 8 13 20 40 100` (modified
      Fibonacci) plus specials `?`, `∞`, `☕`
- [x] 3.2 Signal computation (`agree`/`close`/`spread`) by deck-index span; `∞`
      forces spread; `☕` raises the break hint; only `agree` pre-fills a
      suggestion. Unit-tested

## 4. Routes

- [x] 4.1 Create-a-room page + action: free/instant, generate tokens, 303 to
      the controller console
- [x] 4.2 Controller console (`/poker/c/{token}`): validate token → room;
      open item, reveal, re-vote, record estimate (suggestion pre-filled on
      `agree`), close; live via the poll; server-rendered shell
- [x] 4.3 Participant join page (`/poker/j/{token}`): name yourself (cookie
      identity, observer toggle), deck to vote, face-down/reveal view, live roster
  - signal; closed room shows results only, no voting
- [x] 4.4 Token is the path credential; every load/endpoint authorizes it in
      D1 and 404s on unknown; token pages `noindex`

## 5. Design & messages

- [x] 5.1 Card deck UI (paper cards, selected lifts + ink border on `--hl`;
      specials as Lucide icons), face-down back + synchronized reveal flip
      (transform-only ~240ms, reduced-motion = opacity), roster with presence +
      voted state, agreement-signal strip, break hint
- [x] 5.2 `openspec/specs/DESIGN.md` updated with the new rules (fixed blue
      poker accent, card deck, reveal flip, roster, agreement signal)
- [x] 5.3 Paraglide strings for deck/aria, phases, special cards, join/roster,
      signal + break hint, results, close in all five locales (no em-dashes)

## 6. Specs & tests

- [x] 6.1 Sync the delta spec into `openspec/specs/planning-poker/spec.md`
      (new capability; main spec + colocated Playwright test)
- [x] 6.2 `openspec/specs/planning-poker/planning-poker.spec.ts`: Playwright
      tests, two/three browser contexts against the real Worker + local D1 on
      `:8787`, polling the real state endpoint. Covers create → console; join +
      roster live; refresh resumes seat; closed room = results only; open voting
      live; participant cannot drive phases; votes hidden until reveal + flip;
      agree + record + persist; spread; ∞ forces spread; close ends estimation.
      `e2e-poker-*` family; DB asserts via `expect.poll`

## 7. Deploy

- [x] 7.1 Migration `0011` applies locally (`bun run d1:migrate`); no new
      binding or secret. Remote migration + deploy is the release step
- [x] 7.2 `bun run check` (0/0), `bun run lint` (clean), `bun run test` (128),
      `bun run test:e2e` planning-poker (11 pass)
