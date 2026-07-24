# Design: Planning poker

## Context

The product is an async, capability-URL date poll on SvelteKit + Cloudflare
Workers + D1, no accounts, no real-time. Planning poker is synchronous:
many participants in one room, votes cast and revealed together, state
changing many times per minute and fanned out live. D1 + SvelteKit form
actions (the existing mutation path) cannot express a live shared session;
this needs a stateful coordinator with push. On Cloudflare that coordinator
is a **Durable Object** — one instance per room — with WebSocket
Hibernation so idle rooms are free. PROJECT.md's "DOs are overkill" note
described the async write volume; this workload is why the exception exists.

## Goals / Non-Goals

**Goals:**

- Free, instant room creation on the existing capability-URL model:
  a private controller link and a shared join link, cookie-remembered
  participant identity — no accounts.
- A clear per-item state machine (waiting → voting → revealed) driven only
  by the controller, with votes hidden until a synchronized reveal.
- Fibonacci deck plus ? / ∞ / ☕ specials; an agree / close / spread
  agreement signal that advises without deciding.
- Live propagation to every connected participant; graceful reconnect.
- A durable results log (items + final estimates) that survives the live
  session, seedable and assertable in D1 for e2e.

**Non-Goals:**

- Vote timers, emoji reactions, multiple or custom decks, backlog/ticket
  import, persistent named teams — separate future changes.
- Any login or account. Metsa/OIDC unlock is out of scope here.
- Persisting individual per-participant votes for a decided item. Votes are
  ephemeral coordination state; only the controller's final estimate is a
  durable artifact.
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
    the controller records the estimate. The **live phase and votes are not
    stored here** — see below.
- **Durable Object per room owns the live session.** `POKER_ROOM` DO, keyed
  `idFromName(room_id)`. It holds, in memory (and its own transactional
  storage for crash-resilience across hibernation): the connected roster
  (identity, role, hasVoted), the current item's phase and each connection's
  current vote, and the agreement signal. It never writes mid-round state to
  D1. On **finalize** it writes `final_estimate`/`decided_at` to the item's
  D1 row (the single hand-off point), so D1 stays the durable record and the
  DO stays the live authority — one writer per fact, no phase kept in two
  places.
- **The Worker authorizes; the DO trusts.** A client only knows its token.
  The WebSocket upgrade endpoint validates the token against D1, resolves
  `{room_id, role}` (`controller` for the controller token, `participant`
  for the join token), then forwards the upgrade to the room's DO with the
  role and the cookie identity asserted by the Worker. The DO does not
  re-check tokens; it accepts the Worker's assertion, so a token never has to
  travel inside DO logic or logs.
- **State machine (per item), controller-only transitions:**
  - `waiting` — no active item, or the next item queued. Participants see
    "waiting for the next item."
  - `voting` — the controller opened the current item. Participants pick or
    change a card; the DO broadcasts only *who* has voted (a face-down card /
    check), never the value. Late joiners can vote until reveal.
  - `revealed` — the controller revealed; every vote flips face-up at once.
    The DO computes and broadcasts the distribution + agreement signal.
    Discussion happens in this phase; the controller then either re-opens
    voting (a re-vote clears votes back to `voting`) or records the final
    estimate (→ item decided, room returns to `waiting` for the next item).
  Only the controller connection may drive `open` / `reveal` / `revote` /
  `finalize` / `next`; a participant attempting a control action is ignored.
  The controller **facilitates by default but may opt in as an estimator** —
  when they do their vote is hidden, revealed, and counted like any other
  seat; facilitation powers are independent of whether they vote.
- **Vote privacy is enforced server-side.** During `voting` the DO sends
  each non-controller only the boolean "voted" per seat; card values are
  withheld from the broadcast until the phase is `revealed`. A crafted client
  cannot read hidden votes because the DO never sends them. A vote message
  arriving when the phase is not `voting` is rejected.
- **Agreement signal (advisory, computed on reveal).** Over the *numeric*
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
- **Reconnect & identity.** Participants name themselves on the join page;
  a cookie (same pattern as the `/s` → `/r` cookie) carries a stable
  per-browser participant id so a refresh or dropped socket rejoins the same
  seat rather than spawning a duplicate. On connect the DO sends a full
  snapshot (phase, roster, votes if revealed, results log) so a late or
  returning client renders the current room immediately. A disconnected
  socket drops that seat from the live roster after a short grace; it does
  not affect the durable record.
- **Deck values are canonical, labels are localized.** The deck is fixed
  numeric values plus ?/∞/☕; only the *labels/aria* around them are Paraglide
  strings. `∞`, `☕`, `?` render with Lucide-consistent iconography (per
  DESIGN.md additions), the numerals in the typewriter face.
- **Results log.** The controller console and a room results view render the
  decided items with their final estimates from D1 (server-rendered, no DO
  needed for the read-only history). Closing the room sets
  `poker_rooms.status = 'closed'`; a closed room refuses new votes and shows
  the final log.

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

- **[DO memory lost on eviction mid-vote]** → the DO mirrors live phase and
  votes into its own transactional storage, so a hibernated/evicted instance
  rehydrates the in-flight item; only a decided estimate ever reaches D1, so
  no durable data is at risk regardless.
- **[Two representations of a room: D1 skeleton + DO live state]** →
  bounded by a strict split: D1 owns identity/tokens/items/final estimates,
  the DO owns phase/roster/votes, and the only cross-write is finalize
  (DO → D1). No fact lives in both places, so they cannot disagree.
- **[Token in a WebSocket URL could leak via logs]** → the upgrade is
  authorized once and the endpoint stays `noindex`; prefer carrying the token
  in a header/subprotocol or a short-lived connect ticket over a query string
  where the client allows, matching the existing "tokens out of logs" rule.
- **[Real-time is hard to e2e]** → workerd runs the DO locally under
  `wrangler dev`, and Playwright drives two browser contexts (controller +
  participant) against the real socket, so the live path is exercised end to
  end, not mocked.
- **[Controller disconnects mid-session]** → control is tied to the
  controller *token*, not a live socket; reopening the controller link
  reconnects and resumes control. The room never becomes unfacilitatable.
- **[Someone games the reveal]** → hidden votes are never sent before
  `revealed`, so there is nothing on the client to peek at; privacy is a
  server property, not a UI one.

## Migration Plan

1. Land migration `0011_planning_poker.sql` (additive new tables) — safe
   before code deploys; no existing table touched, nothing to backfill.
2. Add the `POKER_ROOM` Durable Object binding + migration tag to
   `wrangler.toml`; deploy the Worker exporting the DO class.
3. No new secrets. Rollback: revert the deploy; the new tables and DO are
   inert and referenced by nothing in the async product.
