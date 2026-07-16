# poll

[![CI](https://github.com/malpou/family-date-poll/actions/workflows/ci.yml/badge.svg)](https://github.com/malpou/family-date-poll/actions/workflows/ci.yml)

A tiny, no-login date poll. One organizer seeds a few candidate dates and sees
at a glance which date suits everyone - originally built to schedule a
_rundvisning i DR Byen_, but it works for any "when suits you?" question.

Live at **[poll.malpou.io](https://poll.malpou.io)**. Each poll renders in its
chosen language - **Danish, English, or French**.

## How it works

No accounts. Access is by **capability URL** - whoever holds a token can act,
and tokens are unguessable and never listed.

A poll runs in one of two modes, chosen at creation and switchable later:

- **Named people** - the organizer adds each participant, and everyone gets
  their own personal `/r/{invitee_token}` link to copy and send.
- **Anyone with the link** - one shared `/s/{share_token}` link. Whoever opens
  it enters their own name and answer; a browser cookie lets them come back and
  edit, plus they get a personal edit link to save.

| Route                  | Who                | What                                                                                          |
| ---------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| `/`                    | anyone             | Create a poll: title, description, language, mode, candidate dates (optional start/end times) |
| `/e/{organizer_token}` | the organizer      | Dashboard: manage dates & people, copy links, see results, switch mode/language, close/reopen |
| `/r/{invitee_token}`   | a named invitee    | Mark each date **preferred / available / unavailable**, add a note, submit                    |
| `/s/{share_token}`     | anyone (open mode) | Enter a name, mark each date, add a note, submit                                              |

The organizer link is private - treat it like a password, never share it. In
open mode the **shared link** (`/s/…`) is the one to hand out; the dashboard
shows it prominently at the top.

## Stack

- **Go** + **[templ](https://templ.guide)** for server-rendered HTML
- **[HTMX](https://htmx.org)** for server round-trips (form actions, mutations)
  and **[Alpine.js](https://alpinejs.dev)** for in-page state (the preference
  selector, the submit gate, inline edit toggles)
- **[sqlc](https://sqlc.dev)** over **Postgres** (pgx/v5) - queries are written
  as SQL and compiled to typed Go
- **Tailwind 4** for styling, compiled to a static `static/app.css`
- **Paraglide** (inlang) for DA/EN/FR messages, compiled from
  `messages/{da,en,fr}.json`
- **Playwright** for end-to-end tests

Layout:

```
cmd/server/         main - wiring, config, graceful DB wait
internal/handlers/  HTTP: routes, form actions, validation
internal/views/     templ templates (the only place HTML lives)
internal/domain/    dates, results ranking, tokens - pure logic, unit-tested
internal/db/        store.go + queries.sql -> sqlc-generated code
messages/           da/en/fr JSON: one source of truth for copy
```

`messages/{da,en,fr}.json` is read by **both** the Go server (rendering) and the
Playwright specs (asserting), so copy can never drift between app and tests.
All app SQL lives in `internal/db/queries.sql`; the e2e specs seed through
`e2e/db.ts`. Neither writes SQL anywhere else.

## Develop

Requires Go 1.25+, [templ](https://templ.guide/quick-start/installation),
[sqlc](https://docs.sqlc.dev/en/latest/overview/install.html), bun, and Docker
(for the local Postgres).

```sh
bun install
make run        # brings up Postgres, builds, serves on http://localhost:8787
```

Useful targets:

```sh
make build      # generate (templ, sqlc, messages) + tailwind + vendor JS + go build
make test       # Go unit tests
make db         # bring up Postgres and apply the schema
make clean      # drop generated artifacts and the database container
```

## Testing

```sh
make test          # Go unit tests (dates, results ranking)
bun run test:e2e   # Playwright: full journey against the real server + Postgres
```

`test:e2e` boots the Go server against a throwaway Postgres container
(`compose.yaml`), applies the schema, and drives the real create → dashboard →
respond → results journey. Specs seed and read the database through one shared
helper (`e2e/db.ts`) - no raw SQL in the tests themselves.

**CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs the full
gate - vet → unit tests → e2e - on every push and pull request, and uploads the
Playwright HTML report as an artifact when a run fails.

## Deploy

The server is a single Go binary plus the `static/` directory. It needs
`DATABASE_URL` (Postgres) and optionally `PORT` (default 8787). Apply
`internal/db/migrations/0001_init.sql` to a fresh database before first boot.
