# Planning poker (real-time story-point estimation)

## Why

Every capability the tool ships today is an **asynchronous** poll: the
organizer sets options, participants answer whenever, results aggregate over
time. Agile teams have a different, synchronous need — sitting together
(remote or in a room) to estimate a backlog live, one item at a time, with
everyone revealing at once so nobody anchors on the loudest voice. That is
planning poker, and no async poll type can express it: it is stateful,
multi-party, and only interesting in real time.

This change adds a **planning-poker room** — a shared, controller-run space
where a team estimates a sequence of items on a Fibonacci deck, votes hidden
until a synchronized reveal, with the tool flagging when the room agrees and
when it needs to talk. It keeps the product's core promise (no logins, the
link is the credential, free and instant) and extends the "poll" brand from
"collect answers over time" to "estimate together, now."

It is a deliberate architectural departure. PROJECT.md notes Durable Objects
are overkill for the date-poll write volume — true for that async workload.
Live estimation is the opposite workload: rapid state transitions fanned out
to every connected participant. That is exactly what a Durable Object per
room is for, so this capability introduces the tool's first real-time layer
while leaving the async product untouched.

## What Changes

- **New room, not a new poll type.** Planning poker shares almost nothing
  with the events/date_options/responses model (no dated options, no
  async per-invitee answers), so it lives in its own tables and routes
  rather than being forced into `poll_type`. Creating a room is free and
  instant, landing the creator on a controller console.
- **Two capability links per room**, mirroring the existing token model: a
  private **controller** link (facilitates the room) and a shared **join**
  link anyone can enter through, naming themselves. A cookie remembers a
  participant's identity so a refresh or reconnect resumes their seat.
- **One controller drives a small state machine per item:** `waiting`
  (between items) → `voting` (cards face down, everyone casting) →
  `revealed` (all cards flip up at once, discussion happens here). At most
  one item is active at a time; the controller opens voting, reveals,
  re-votes, or records the final estimate and moves on.
- **Fibonacci deck** (`0 1 2 3 5 8 13 21`) plus three special cards: **?**
  (need more info), **∞** (too big to estimate, split it), and **☕**
  (I need a break). Votes stay hidden during `voting` — participants only
  see *who* has voted, never *what* — and flip simultaneously on reveal.
- **Agreement signal on reveal.** The room computes whether the numeric
  votes **agree** (all the same card), are **close** (within one adjacent
  deck step), or are a **spread** (more than one step apart, any ∞, or no
  numeric votes at all). Agreement pre-fills the suggested estimate; a
  spread flags "discuss." The controller is always authoritative — the
  signal advises, the controller records the final number (or splits/skips).
  ☕ surfaces as a "someone needs a break" hint, advisory only.
- **Live for everyone.** Every phase change, join/leave, vote-cast tick, and
  reveal propagates to all connected participants over a WebSocket to the
  room's Durable Object, using the hibernation API so idle rooms cost
  nothing.
- **Durable record in D1.** The room, its ordered items, and each item's
  final estimate persist so the controller keeps a running results log and
  can revisit a closed room. Live phase and in-flight votes live only in the
  Durable Object — they are ephemeral once an item is decided.
- **Easy, clear UX.** One deck, one big reveal, one clear "does the room
  agree?" answer. No timers, reactions, or backlog import in this change.

## Capabilities

### New Capabilities

- `planning-poker`: a real-time, controller-run estimation room over a
  Fibonacci deck (with ?/∞/☕ special cards). Free capability-URL creation
  (controller + join links, cookie identity), a per-item waiting → voting →
  revealed state machine with hidden votes and a synchronized reveal, an
  agree/close/spread agreement signal, controller-recorded final estimates
  persisted as a room results log, and live propagation to all connected
  participants via a Durable Object per room.

### Modified Capabilities

- None. The async event/poll capabilities and all their flows are untouched.

## Impact

- **First real-time layer.** New Durable Object class (one instance per
  room) using the WebSocket Hibernation API; new `wrangler.toml` DO binding
  and migration tag. This is the intentional break from PROJECT.md's
  "DOs are overkill" note, which described the async write volume only.
- **D1 migration** `0011_planning_poker.sql`: additive new tables
  `poker_rooms` and `poker_rounds` (durable skeleton + final estimates).
  No change to existing tables; nothing to backfill.
- **New routes:** create-a-room, controller console, participant join page,
  and a WebSocket upgrade endpoint that authorizes the token in D1 and
  forwards the connection to the room's Durable Object by room id.
- **New security surface:** control actions (open/reveal/finalize/next)
  require the controller token; voting requires only join + a named
  identity. The Worker authorizes every upgrade against D1 before the
  Durable Object trusts a connection's role. Tokens stay out of logs,
  referrers, and the WebSocket URL where feasible (same discipline as the
  existing token pages, which stay `noindex`).
- **New Paraglide strings** for the deck, phases, agreement signal, special
  cards, join/roster, and results log, in all five locales.
- **New DESIGN.md rules** for the card deck, the face-down/face-up reveal
  flip, the roster, and the agreement signal — landed in this change per the
  design invariant.
- **E2E:** Playwright drives two browser contexts (controller + participant)
  against the real Worker + Durable Object + local D1 on `:8787`; rooms are
  seedable directly via `openspec/specs/support/db.ts` with an
  `e2e-poker-*` token family.
- **Non-goals (deferred):** per-vote timers, emoji reactions, multiple/
  custom decks, backlog/ticket import, persistent named teams, and any
  account or login. "Free without limits" positioning is unchanged.
