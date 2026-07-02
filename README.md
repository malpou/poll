# family-date-poll

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

Closing a poll means deciding: the organizer picks one or more of the candidate
dates as the final date(s) - or cancels the poll outright - and every link then
shows the chosen date(s) with a per-date distribution of the answers. Reopening
puts the decision back on the table.

The organizer link is private - treat it like a password, never share it. In
open mode the **shared link** (`/s/…`) is the one to hand out; the dashboard
shows it prominently at the top.

## Stack

- **SvelteKit 2** + **Svelte 5** (runes) + **Tailwind 4**
- **Cloudflare Workers/Pages** hosting, **D1** (SQLite) for storage
- **Paraglide** (inlang) for DA/EN/FR messages, compiled from `messages/{da,en,fr}.json`
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
