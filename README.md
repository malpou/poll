# family-date-poll

[![CI](https://github.com/malpou/family-date-poll/actions/workflows/ci.yml/badge.svg)](https://github.com/malpou/family-date-poll/actions/workflows/ci.yml)

A tiny, no-login date poll. One organizer seeds a few candidate dates, sends
each person a personal link, and sees at a glance which date suits everyone -
originally built to schedule a _rundvisning i DR Byen_, but it works for any
"når passer det jer?" question.

Live at **[poll.malpou.io](https://poll.malpou.io)**. All user-facing text is
Danish.

## How it works

No accounts. Access is by **capability URL** - whoever holds a token can act,
and tokens are unguessable and never listed.

| Route                  | Who           | What                                                                                        |
| ---------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| `/`                    | anyone        | Create a poll: title, description, candidate dates (optional start/end times), participants |
| `/e/{organizer_token}` | the organizer | Dashboard: manage dates & invitees, copy links, see results, close/reopen                   |
| `/r/{invitee_token}`   | an invitee    | Mark each date **Foretrukket / Kan godt / Kan ikke**, add a note, submit                    |

The organizer link is the secret - treat it like a password. Each invitee gets
their own link to copy and send by their own means (email, text, …).

## Stack

- **SvelteKit 2** + **Svelte 5** (runes) + **Tailwind 4**
- **Cloudflare Workers/Pages** hosting, **D1** (SQLite) for storage
- **bun** for install, scripts, and lockfile
- **Playwright** for end-to-end smoke tests

UI is organized by **atomic design** under `src/lib/components/`
(`atoms/` → `molecules/` → `organisms/`). Data goes through a
single `DataProvider` interface (`src/lib/data/provider.ts`) with a mock
implementation for local dev and tests and a D1 implementation in production -
swapping is one line.

## Develop

```sh
bun install
bun run dev        # http://localhost:5173, uses the mock data provider
```

Useful scripts:

```sh
bun run check      # svelte-check (types)
bun run build      # production build
bun run preview    # preview the production build
```

## Testing

```sh
bun run test       # unit tests (vitest)
bun run test:e2e   # Playwright smoke tests: full journey against a local D1
```

`test:e2e` builds the app, boots `wrangler dev` on a freshly-migrated **local
D1**, and drives the real create → dashboard → respond → results journey. Specs
seed and read the database through one shared helper (`e2e/db.ts`) - no raw SQL
in the tests themselves; all query-building lives in that module, mirroring how
`src/lib/data/d1.ts` is the single home for app SQL.

**CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs the full
gate - `check` → unit tests → e2e - on every push and pull request, and uploads
the Playwright HTML report as an artifact when a run fails.

## Deploy (Cloudflare)

```sh
bun run d1:migrate # apply migrations to D1
bun run deploy     # publish to Cloudflare
```

Requires a Cloudflare account with a D1 database bound as `DB` and the
`poll.malpou.io` route configured. See `wrangler.toml`.

## Project layout

```
specs/                       the source of truth - see below
src/lib/components/          atoms / molecules / organisms
src/lib/data/                DataProvider: provider.ts, mock.ts, d1.ts
src/lib/da.ts                all Danish strings, in one place
src/routes/                  /, /e/[token], /r/[token]
migrations/                  D1 schema, versioned
e2e/                         Playwright smoke tests
.claude/skills/plan-issue/   plan an implementation from a GitHub issue
```

## Specs & roadmap

The behavior is specified up front in [`specs/`](specs/) - `PROJECT.md` (data
model, routes, security, conventions), `DESIGN.md` (visual + Danish copy), and
one folder per capability (`event-management`, `invitee-links`,
`availability-response`, `results`). Work is tracked as
[iteration issues](https://github.com/malpou/family-date-poll/issues), each
referencing the spec it implements and carrying its own e2e acceptance checks.

To start on an issue, the `plan-issue` skill reads the issue + its specs and
drafts a spec-grounded implementation plan (in plan mode):

```
/plan-issue 3
```
