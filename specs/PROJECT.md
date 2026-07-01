# Project: family-date-poll

## Purpose
Let one organizer collect preferred dates from family members. The organizer
supplies the candidate dates; recipients only choose among them. Distribution is
by the organizer copying each recipient's link and sending it themselves (email,
text, etc.). No participant accounts.

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
- Two token kinds:
  - `organizer_token` — full management of one event
  - `invitee_token` — respond as one invitee on one event
- Tokens are unguessable and never listed publicly. Treat the organizer link as
  a secret. Decision: capability URL only for v1 — no passphrase. Mitigate leak
  risk by keeping tokens out of logs, referrers, and analytics.

## Data model (D1)
- `events(id, title, description, organizer_token, status, created_at)`
    - status ∈ {open, closed}
- `date_options(id, event_id, starts_at, ends_at, label, sort_order)`
    - `starts_at` and `ends_at` are both optional (nullable); `ends_at` requires `starts_at`
- `invitees(id, event_id, label, token, note, created_at)`
- `responses(invitee_id, date_option_id, preference, updated_at)`
    - preference ∈ {preferred, available, unavailable}
    - primary key (invitee_id, date_option_id)
    - a missing row means "no answer yet" for that date — distinct from "unavailable"

## Routes
- `/`                       create a new event
- `/e/{organizer_token}`    organizer dashboard: options, invitees, results
- `/r/{invitee_token}`      recipient response page

## Conventions
- Mutations use SvelteKit form actions; token is validated in every load/action.
- Language: all user-facing text is Danish. Weekdays/months render in Danish,
  lowercase (lørdag, marts). Keep copy in one `da` strings module for consistency.
- Timezone: store `starts_at`/`ends_at` as UTC ISO; render in Europe/Copenhagen.
- Motion: user-facing UI follows the animations.dev principles (ease-out enter/exit,
  ease-in-out for on-screen movement, spring for the state selector, staggered list
  entrance, transform/opacity only) and honors `prefers-reduced-motion`. See the
  Claude Design brief for exact easing and timing values.