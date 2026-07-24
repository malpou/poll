# Design: Planning poker

## Context

The product is an async, capability-URL date poll on SvelteKit + Cloudflare
Workers + D1, no accounts, no real-time. Planning poker is synchronous:
many participants in one room, votes cast and revealed together, state
changing many times per minute and reflected live for everyone.

A Durable Object per room (WebSocket push) was the first design. It was
rejected on a concrete constraint: `@sveltejs/adapter-cloudflare` exports
only the SvelteKit worker's `default` and overwrites `main` on every build,
so exporting a DO class needs a custom worker-entry/wrangler workaround that
fights the adapter and changes how the single-worker e2e harness boots. That
fragility is not worth it for a solo feature. Instead the **live session
state lives in D1** (the room's phase, a per-room roster with heartbeat
presence, and per-participant votes for the active item) and clients stay
current by **short-polling a JSON state endpoint (~1s)**. This keeps
planning poker entirely inside the existing stack — one worker, D1, the same
Playwright harness — at ~1s update latency, which reads as live (votes
appear, the reveal flips together). PROJECT.md's "DOs are overkill" note
holds: this stays a D1 app.

## Goals / Non-Goals

**Goals:**

- Free, instant room creation on the existing capability-URL model:
  a private controller link and a shared join link, cookie-remembered
  participant identity — no accounts.
- A clear per-item state machine (waiting → voting → revealed) driven only
  by the controller, with votes hidden until a synchronized reveal.
- Fibonacci deck plus ? / ∞ / ☕ specials; an agree / close / spread
  agreement signal that advises without deciding.
- Live-feeling propagation to every present participant (~1s), with reconnect
  and refresh resuming the same seat.
- A durable results log (items + final estimates) that survives the live
  session, seedable and assertable in D1 for e2e.
- Vote privacy enforced by the server: card values are never sent to other
  seats before the reveal.

**Non-Goals:**

- Vote timers, emoji reactions, multiple or custom decks, backlog/ticket
  import, persistent named teams — separate future changes.
- Any login or account. Metsa/OIDC unlock is out of scope here.
- Keeping per-participant votes after an item is decided. Votes are transient
  coordination state (cleared on finalize/re-vote); only the controller's
  final estimate is a durable artifact.
- WebSocket push / true real-time. ~1s polling is the deliberate transport
  (see Context); a DO/WS upgrade can come later if scale ever demands it.
- Reworking any async event capability. Zero shared tables or routes.

## Decisions

- **Own tables, not a `poll_type`.** Planning poker shares nothing with
  `events`/`date_options`/`invitees`/`responses` (no dated options, no async
  per-invitee answers, a live phase instead of an open/closed status). A new
  `poll_type` variant would inherit a data model it cannot use. New tables in
  migration `0011_planning_poker.sql`:
  - `poker_rooms(id, title, deck, controller_token, join_token, status,
created_at)` — `deck` is `'fibonacci'` for now (column reserved for
    future decks); `status` ∈ {open, closed}; two unguessable base62 tokens
    (≥128 bits) generated the existing way, mirroring
    organizer_token/share_token.
  - `poker_rounds(id, room_id, title, sort_order, final_estimate,
decided_at)` — one row per estimation item. `title` is the story/ticket
    label or id the controller typed. `final_estimate` (text, the recorded
    deck value or a free split/skip marker) and `decided_at` are NULL until
    the controller records the estimate. The live phase and votes live in the
    live-state tables below, not on the round.
- **Live state lives in D1; clients short-poll.** Three more tables carry the
  transient session:
  - `poker_rooms` also holds `phase` ∈ {waiting, voting, revealed}, an
    `active_round_id` (the item being voted/revealed, NULL when waiting), and
    a `rev` counter bumped on every mutation so a poll can cheaply detect
    change.
  - `poker_participants(id, room_id, name, role, is_controller, last_seen_at)`
    — one seat per named participant. `role` ∈ {estimator, observer};
    `is_controller` marks the facilitator's own seat. Presence is derived: a
    seat is "present" when `last_seen_at` is within a short window, refreshed
    by each poll (heartbeat). `id` is the cookie-carried per-browser id.
  - `poker_votes(round_id, participant_id, card, updated_at)` — the active
    item's votes, `card` as text (`'0'`..`'100'` / `'?'` / `'infinity'` /
    `'coffee'`). Cleared on finalize and re-vote (transient, not durable).
    A `GET …/state` endpoint returns a snapshot; a `POST …/command` endpoint
    applies one action. Clients re-fetch state every ~1s.
- **The token is the path credential; the server authorizes every call.** The
  state and command endpoints sit under the token route (`/poker/c/{token}`
  for the controller, `/poker/j/{token}` for participants), exactly like the
  `/e`, `/r`, `/s` pages. Each load/endpoint resolves the token to a room and
  a role in D1 and reveals nothing on an unknown token. Control commands are
  refused unless the caller holds the controller token; the join token grants
  only join + vote + heartbeat.
- **State machine (per item), controller-only transitions:**
  - `waiting` — no active item, or the next item queued. Participants see
    "waiting for the next item."
  - `voting` — the controller opened the current item. Participants pick or
    change a card; the state snapshot exposes only _who_ has voted (a
    face-down card / check), never the value. Late joiners can vote until
    reveal.
  - `revealed` — the controller revealed; every vote flips face-up at once.
    The snapshot now carries the votes, the distribution, and the agreement
    signal. Discussion happens in this phase; the controller then either
    re-opens voting (a re-vote clears votes back to `voting`) or records the
    final estimate (→ item decided, room returns to `waiting` for the next
    item). Only the controller token may drive `open` / `reveal` / `revote` /
    `finalize` / `next`; a participant's command is refused.
    The controller **facilitates by default but may opt in as an estimator** —
    when they do their vote is hidden, revealed, and counted like any other
    seat; facilitation powers are independent of whether they vote.
- **Vote privacy is enforced server-side.** While `phase = voting` the state
  snapshot carries only a `hasVoted` boolean per seat (plus, to the caller,
  their own card echoed back); no other seat's card value is included until
  `phase = revealed`. A crafted client cannot read hidden votes because the
  endpoint never sends them. A vote command arriving when the phase is not
  `voting` is rejected.
- **Agreement signal (advisory, computed on reveal).** Over the _numeric_
  votes only, by deck index (`0 1 2 3 5 8 13 20 40 100` → indices 0..9):
  - **agree** — at least one numeric vote, all numeric votes equal, and no ∞.
    The equal value pre-fills the suggested estimate.
  - **close** — numeric index span == 1 (votes on two adjacent deck cards),
    no ∞. Suggests the room is nearly there; controller picks one.
  - **spread** — numeric index span ≥ 2 ("more than one step of difference"),
    OR any ∞ present, OR no numeric votes at all. Flags "discuss / re-vote /
    split." ∞ always forces spread (someone thinks it is too big to size).
    `?` and `☕` never count toward the numeric span. `☕` additionally raises a
    separate, advisory "someone needs a break" hint. **The controller always
    records the final estimate** — any deck value, or a split/skip — the signal
    only advises and pre-fills; it never auto-decides.
- **Reconnect & identity.** Participants name themselves on the join page; a
  cookie (same pattern as the `/s` → `/r` cookie) carries a stable per-browser
  participant id so a refresh or a resumed poll rejoins the same seat rather
  than spawning a duplicate. Every state poll refreshes `last_seen_at`
  (heartbeat); a seat whose heartbeat lapses beyond the presence window drops
  from the live roster without affecting the durable record. The first
  snapshot after a (re)load carries the full room (phase, roster, votes if
  revealed, results log) so a late or returning client renders immediately.
- **Deck values are canonical, labels are localized.** The deck is fixed
  numeric values plus ?/∞/☕; only the _labels/aria_ around them are Paraglide
  strings. `∞`, `☕`, `?` render with Lucide-consistent iconography (per
  DESIGN.md additions), the numerals in the typewriter face.
- **Results log.** The controller console and a room results view render the
  decided items with their final estimates from D1 (server-rendered on first
  load, then kept current by the same poll). Closing the room sets
  `poker_rooms.status = 'closed'`; a closed room refuses new votes and
  commands and shows the final log.

## New DESIGN.md rules (landed in this change)

- **Card deck:** a row/grid of hand-drawn-radius paper cards (the control
  radius family), the numeral centered in the mono face; the selected card
  lifts and takes an ink border on the `--hl` tint (reusing the selector's
  active-face convention). Special cards ?, ∞, ☕ use Lucide icons
  (help-circle / infinity / coffee) sized to sit in the type.
- **Face-down / reveal:** during `voting` a cast vote shows as a face-down
  card (paper back, no value) with a small check; **reveal flips all cards
  face-up together** with a short transform-only flip (~240ms ease-out,
  honoring reduced motion — opacity fade only). This is the signature
  interaction for this capability, analogous to the three-state selector.
- **Roster:** a compact list of named seats with a "has voted" tick during
  voting; the controller seat is marked. Reuses pill/badge conventions,
  no new token.
- **Agreement signal:** a `NoticeBanner`-style strip — highlighter tint +
  `--hl` dot for **agree**, neutral for **close**, and the diagonal
  `ink-hatch` / `bad` tone for **spread** (borrowing the existing "no"
  semantics), plus a quiet coffee hint. No new color tokens; the strip reuses
  the documented tones.

## Risks / Trade-offs

- **[~1s latency, not instant push]** → accepted; at a room's pace (a reveal
  every minute or two) 1s reads as live. The poll interval is a single
  constant to tune, and the transport can move to a DO/WS later without any
  data-model change (the live-state tables already model everything push
  would).
- **[Extra D1 writes: a vote change + a heartbeat per poll]** → room volume is
  tiny (one small team per room) and writes are single-row upserts; nothing
  like the aggregation load the async product handles. The `rev` counter lets
  the state read stay a couple of indexed lookups.
- **[Stale seats linger in the roster]** → presence is heartbeat-windowed, so
  a closed tab drops out after the window lapses; the durable record is
  untouched either way.
- **[Someone games the reveal]** → hidden votes are never sent before
  `revealed`, so there is nothing on the client to peek at; privacy is a
  server property (the state endpoint omits values), not a UI one.
- **[Controller closes their tab mid-session]** → control is tied to the
  controller _token_, not a live connection; reopening the controller link
  resumes control. The room never becomes unfacilitatable.
- **[Real-time is hard to e2e]** → nothing new to boot: Playwright drives two
  browser contexts (controller + participant) against the same single-worker
  `wrangler dev` + local D1, polling the real state endpoint, so the live
  path is exercised end to end.

## Migration Plan

1. Land migration `0011_planning_poker.sql` (additive new tables) — safe
   before code deploys; no existing table touched, nothing to backfill.
2. Deploy the Worker. No new bindings, no new secrets, no `wrangler.toml`
   change.
3. Rollback: revert the deploy; the new tables are inert and referenced by
   nothing in the async product.
