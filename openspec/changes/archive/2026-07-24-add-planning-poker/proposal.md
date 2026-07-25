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

It stays inside the product's existing stack. A Durable Object with WebSocket
push was considered and rejected on a concrete constraint (the SvelteKit
Cloudflare adapter exports only its own worker and overwrites `main`, so
shipping a DO fights the build and the single-worker e2e harness). Instead the
live session state lives in D1 — the room's phase, a heartbeat-presence
roster, and per-participant votes — and clients stay current by short-polling
a JSON state endpoint (~1s). PROJECT.md's "DOs are overkill" note holds: this
remains a D1 app, and ~1s updates read as live for a room's pace.

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
- **Modified Fibonacci deck** (`0 1 2 3 5 8 13 20 40 100`) plus three special cards: **?**
  (need more info), **∞** (too big to estimate, split it), and **☕**
  (I need a break). Votes stay hidden during `voting` — participants only
  see _who_ has voted, never _what_ — and flip simultaneously on reveal.
- **Agreement signal on reveal.** The room computes whether the numeric
  votes **agree** (all the same card), are **close** (within one adjacent
  deck step), or are a **spread** (more than one step apart, any ∞, or no
  numeric votes at all). Agreement pre-fills the suggested estimate; a
  spread flags "discuss." The controller is always authoritative — the
  signal advises, the controller records the final number (or splits/skips).
  ☕ surfaces as a "someone needs a break" hint, advisory only.
- **Live for everyone.** Every phase change, join/leave, vote-cast tick, and
  reveal shows up for all present participants within about a second, via a
  JSON state endpoint each client short-polls — no manual refresh.
- **Durable record in D1.** The room, its ordered items, and each item's
  final estimate persist so the controller keeps a running results log and
  can revisit a closed room. The live phase, roster, and in-flight votes also
  live in D1 (their own tables) but are transient — votes clear once an item
  is decided; only the final estimate is a durable artifact.
- **Easy, clear UX.** One deck, one big reveal, one clear "does the room
  agree?" answer. No timers, reactions, or backlog import in this change.

## Capabilities

### New Capabilities

- `planning-poker`: a real-time, controller-run estimation room over a
  Fibonacci deck (with ?/∞/☕ special cards). Free capability-URL creation
  (controller + join links, cookie identity), a per-item waiting → voting →
  revealed state machine with hidden votes and a synchronized reveal, an
  agree/close/spread agreement signal, controller-recorded final estimates
  persisted as a room results log, and live (~1s) propagation to all present
  participants via D1-backed state that clients short-poll.

### Modified Capabilities

- None. The async event/poll capabilities and all their flows are untouched.

## Impact

- **First live layer, still on D1.** No Durable Object, no WebSocket, no new
  binding or secret. Live coordination is D1-backed and clients short-poll a
  state endpoint; ~1s update latency is the deliberate trade for staying in
  the single-worker stack.
- **D1 migration** `0011_planning_poker.sql`: additive new tables
  `poker_rooms` and `poker_rounds` (durable skeleton + final estimates) plus
  the live-state tables `poker_participants` and `poker_votes`, and a phase /
  active-round / rev counter on the room. No change to existing tables;
  nothing to backfill.
- **New routes:** create-a-room, controller console, participant join page,
  and per-role `state` (GET snapshot) + `command` (POST action) endpoints
  under the token path.
- **New security surface:** control actions (open/reveal/finalize/next)
  require the controller token; voting requires only the join token + a named
  identity. Every load and endpoint authorizes the token against D1 and
  reveals nothing on an unknown token; the state endpoint omits hidden vote
  values before reveal. Token pages stay `noindex`, same discipline as the
  existing `/e`, `/r`, `/s` pages.
- **New Paraglide strings** for the deck, phases, agreement signal, special
  cards, join/roster, and results log, in all five locales.
- **New DESIGN.md rules** for the card deck, the face-down/face-up reveal
  flip, the roster, and the agreement signal — landed in this change per the
  design invariant.
- **E2E:** Playwright drives two browser contexts (controller + participant)
  against the real Worker + local D1 on `:8787` (unchanged harness), polling
  the real state endpoint; rooms are seedable directly via
  `openspec/specs/support/db.ts` with an `e2e-poker-*` token family.
- **Non-goals (deferred):** per-vote timers, emoji reactions, multiple/
  custom decks, backlog/ticket import, persistent named teams, and any
  account or login. "Free without limits" positioning is unchanged.
