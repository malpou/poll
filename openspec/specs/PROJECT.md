# Project: poll

## Purpose

Two tools sharing one site, one design language, and one create page.

**Polls** (the original): let one organizer collect preferred dates from participants. The organizer
supplies the candidate dates; recipients only choose among them. Distribution is
by the organizer copying each recipient's link and sending it themselves (email,
text, etc.). No participant accounts.

**Planning poker**: a real-time, controller-run estimation room. A team sizes
items on a Fibonacci deck one at a time - everyone casts a hidden vote, the
controller reveals them together, the room sees whether it agrees. One person
controls the room over a private link; everyone else joins through a shared
link and names themselves. Asynchronous where polls are, live where polls are
not - but the same capability-URL model, the same paper look, the same five
languages, the same organizer-picked highlighter.

## Stack

- SvelteKit with `@sveltejs/adapter-cloudflare`
- Cloudflare Workers/Pages for hosting, served at `poll.malpou.io`
- Cloudflare D1 (SQLite) for storage, bound as `platform.env.DB`
- Tokens generated with `crypto.getRandomValues` (≥128 bits entropy, base62)

D1 over KV: results aggregation ("how many prefer each date") is a natural SQL
GROUP BY. KV would push that logic into app code. Durable Objects are overkill
for this write volume.

## Security model

- No logins. Access is via **capability URLs**: whoever holds a token can act.
- Three token kinds:
  - `organizer_token` - full management of one event (private, never shared)
  - `invitee_token` - respond as one invitee on one event (`/r/…`)
  - `share_token` - open-mode shared link anyone can respond through (`/s/…`)
  - `controller_token` - full control of one planning-poker room (private)
  - `join_token` - the room's shared link; join + vote only, never control
- Tokens are unguessable and never listed publicly. Treat the organizer link as
  a secret. Decision: capability URL only for v1 - no passphrase. Mitigate leak
  risk by keeping tokens out of logs, referrers, and analytics.

## Data model (D1)

- `events(id, title, description, locale, timezone, poll_mode, allow_preferred, allow_unsure, accent, poll_type, highlight_budget, organizer_token, share_token, status, created_at)`
  - status ∈ {open, closed, cancelled}. `closed` means the organizer picked the
    final date(s); `cancelled` means they closed without picking (abandoned).
    Reopening returns to `open` and clears any chosen dates
  - locale ∈ {da, de, en, es, fr} - the language the whole poll renders in
  - timezone - IANA id (e.g. Europe/Copenhagen, the default) every date
    option's times render in; picked by the organizer, changeable later
  - poll_mode ∈ {assigned, open}, default assigned. `assigned`: organizer adds
    named invitees, each with a personal `/r` link. `open`: one shared `/s` link
    anyone can submit through, naming themselves
  - share_token - unique; the open-mode shared link. Minted for every event so a
    poll can switch to open later without a migration
  - allow_preferred ∈ {0, 1}, default 1; allow_unsure ∈ {0, 1}, default 0 - the
    per-event choice toggles. Available/unavailable are always offered.
    Disabling a choice folds its recorded answers into the fixed pair
    (preferred → available, unsure → unavailable); re-enabling never restores
  - accent ∈ {yellow, pink, green, blue}, default yellow - the poll's
    highlighter color, validated at the form boundary (no SQL CHECK)
  - poll_type ∈ {dates, question, rsvp, rank, highlight}, default dates,
    validated at the form boundary (no SQL CHECK). Immutable after creation.
    `question`: the poll asks a free-form question (title/description) over
    2+ text options; no timezone surfaced, no calendar, no sort-by-date.
    `rsvp`: one fixed date/time (exactly one date_options row), strict yes/no
    answers stored as available/unavailable with both choice toggles forced
    off. `rank` and `highlight`: text-option polls like question (same option
    management, no date affordances) answered by value, not preference -
    rank stores each invitee's full 1..N order, highlight stores stroke
    counts against the event's budget; both force the choice toggles off
  - highlight_budget - the highlight type's marker-stroke budget (1-10,
    default 5), validated at the form boundary; immutable after creation.
    Present but unused on other types
- `date_options(id, event_id, starts_at, ends_at, label, sort_order, selected)`
  - one row per option regardless of poll type. Dates and RSVP polls:
    `starts_at`/`ends_at` set, `label` null. Question polls: `label` holds
    the option's text, `starts_at`/`ends_at` null
  - `starts_at` and `ends_at` are both optional (nullable); `ends_at` requires `starts_at`
  - `selected` ∈ {0, 1} - flagged on the option(s) the organizer picked when
    closing; always 0 while the poll is open or cancelled
- `invitees(id, event_id, label, token, note, created_at)`
  - in open mode, an invitee row is created on submit (label = the name the
    submitter typed), so open submitters are ordinary invitees - results and
    aggregation are identical to assigned mode
- `responses(invitee_id, date_option_id, preference, value, updated_at)`
  - preference ∈ {preferred, available, unavailable, unsure}
  - primary key (invitee_id, date_option_id)
  - a missing row means "no answer yet" for that date - distinct from
    "unavailable"; `unsure` ("I don't know") is a deliberate recorded answer
  - value - rank position 1..N or highlight stroke count 0..budget; NULL on
    the preference-based types. On value rows preference is only the NOT NULL
    filler: 'available' for invitee-submitted answers, 'unsure' for rank rows
    the system appended when the organizer added an option (the
    needs-confirmation marker the response page flags until resubmit)

### Planning poker (D1)

- `poker_rooms(id, title, deck, controller_token, join_token, status, phase,
active_round_id, rev, locale, accent, email, created_at)`
  - self-contained: shares no table with the events model, so it has its own
    provider rather than extending the poll one
  - status ∈ {open, closed}; phase ∈ {waiting, voting, revealed} - the live
    phase of the current item, `waiting` between items
  - `rev` bumps on every mutation so a state poll cheaply detects change
  - locale / accent - the language and highlighter picked at creation, worn by
    every one of the room's pages for everyone. Not URL segments: one join link
    serves the whole team, so both travel with the room
  - email - the controller's optional address. Stored, unlike the poll
    organizer's, because the results summary is sent when the room closes
- `poker_rounds(id, room_id, title, sort_order, final_estimate, decided_at)` -
  the items and each one's recorded estimate; the only durable artifact of a
  decided item
- `poker_participants(id, room_id, name, role, is_controller, last_seen_at)` -
  the roster. Presence is derived from `last_seen_at` against a 15s window, not
  stored; the client's ~1s state poll doubles as the heartbeat (the write is
  throttled to once per 5s per seat)
- `poker_votes(round_id, participant_id, card, updated_at)` - the active item's
  votes, cleared on finalize and re-vote. Never leaves the server before the
  reveal

Real-time is D1-backed rather than a Durable Object: clients short-poll a state
endpoint. At this volume the polling fits inside the Workers plan's included
requests and D1 writes, so the reason to move to a DO would be write throughput
and push latency, not cost.

## Routes

- `/` landing page: explains the product, interactive per-poll-type examples
  (client-only, nothing persisted), create call-to-action. Per-language URLs:
  `/` is English, `/da`, `/de`, `/es`, `/fr` the others (same scheme for
  `/create`); language switcher + hreflang alternates; no browser-language
  redirect, only a dismissible hint. Marketing pages are indexable; token
  pages (`/e`, `/r`, `/s`) declare noindex
- `/create` create a new event or a planning-poker room. Opens by asking which:
  a poll (title, description, language, highlighter, poll type, mode; dates and
  timezone or 2+ text options per type; participants in assigned mode) or a
  room (name, language, highlighter, optional email - nothing else). Same
  per-language URLs as the landing page; `?make=poker` opens on the room branch
- `/e/{organizer_token}` organizer dashboard: options, people/results, mode +
  language, shared link (open mode)
- `/r/{invitee_token}` recipient response page (assigned invitee, or an open
  submitter's personal edit link)
- `/s/{share_token}` open-mode shared page: name yourself, answer, submit. A
  cookie remembers the browser so a revisit edits its own answer via `/r`
- `/poker/c/{controller_token}` controller console: drive the phases, record
  estimates, hand out the join link, close the room
- `/poker/j/{join_token}` participant page: name yourself, vote, watch the
  reveal
- `/poker/api/{token}/state` and `/poker/api/{token}/command` - the live loop's
  read and write endpoints; the token in the path is the only credential

## Conventions

- Mutations use SvelteKit form actions; token is validated in every load/action.
- Language: polls render in Danish, German, English, Spanish, or French,
  chosen per poll (the `locale` column) at creation and changeable on the
  dashboard. A planning-poker room's language works the same way but is fixed
  at creation - one join link serves everyone, so it cannot follow a URL. Base locale is English. User-facing strings live in
  `messages/{da,de,en,es,fr}.json`, compiled to typed `m.*()` via
  Paraglide. Weekdays/months render in the poll's language with that
  language's conventional casing (Danish lowercase; others keep Intl's
  default).
- Timezone: store `starts_at`/`ends_at` as UTC ISO; render in the event's
  timezone (IANA id, organizer-picked, default Europe/Copenhagen).
- Motion: user-facing UI follows the animations.dev principles (ease-out enter/exit,
  ease-in-out for on-screen movement, a soft-overshoot glide for the state
  selector, staggered list entrance, transform/opacity only) and honors
  `prefers-reduced-motion`. See specs/DESIGN.md for exact easing and timing values.
