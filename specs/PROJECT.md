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
- Three token kinds:
  - `organizer_token` - full management of one event (private, never shared)
  - `invitee_token` - respond as one invitee on one event (`/r/…`)
  - `share_token` - open-mode shared link anyone can respond through (`/s/…`)
- Tokens are unguessable and never listed publicly. Treat the organizer link as
  a secret. Decision: capability URL only for v1 - no passphrase. Mitigate leak
  risk by keeping tokens out of logs, referrers, and analytics.

## Data model (D1)

- `events(id, title, description, locale, poll_mode, organizer_token, share_token, status, created_at)`
  - status ∈ {open, closed}
  - locale ∈ {da, en, fr} - the language the whole poll renders in
  - poll_mode ∈ {assigned, open}, default assigned. `assigned`: organizer adds
    named invitees, each with a personal `/r` link. `open`: one shared `/s` link
    anyone can submit through, naming themselves
  - share_token - unique; the open-mode shared link. Minted for every event so a
    poll can switch to open later without a migration
- `date_options(id, event_id, starts_at, ends_at, label, sort_order)`
  - `starts_at` and `ends_at` are both optional (nullable); `ends_at` requires `starts_at`
- `invitees(id, event_id, label, token, note, created_at)`
  - in open mode, an invitee row is created on submit (label = the name the
    submitter typed), so open submitters are ordinary invitees - results and
    aggregation are identical to assigned mode
- `responses(invitee_id, date_option_id, preference, updated_at)`
  - preference ∈ {preferred, available, unavailable}
  - primary key (invitee_id, date_option_id)
  - a missing row means "no answer yet" for that date - distinct from "unavailable"

## Routes

- `/` create a new event (title, description, language, mode, dates; participants
  in assigned mode)
- `/e/{organizer_token}` organizer dashboard: options, people/results, mode +
  language, shared link (open mode)
- `/r/{invitee_token}` recipient response page (assigned invitee, or an open
  submitter's personal edit link)
- `/s/{share_token}` open-mode shared page: name yourself, answer, submit. A
  cookie remembers the browser so a revisit edits its own answer via `/r`

## Conventions

- Mutations use SvelteKit form actions; token is validated in every load/action.
- Language: polls render in Danish, English, or French, chosen per poll (the
  `locale` column) at creation and changeable on the dashboard. User-facing
  strings live in `messages/{da,en,fr}.json`, compiled to typed `m.*()` via
  Paraglide. Weekdays/months render in the poll's language, lowercase.
- Timezone: store `starts_at`/`ends_at` as UTC ISO; render in Europe/Copenhagen.
- Motion: user-facing UI follows the animations.dev principles (ease-out enter/exit,
  ease-in-out for on-screen movement, spring for the state selector, staggered list
  entrance, transform/opacity only) and honors `prefers-reduced-motion`. See the
  Claude Design brief for exact easing and timing values.
