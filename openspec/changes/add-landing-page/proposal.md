## Why

The root URL today is the create form, so the product has no page that explains
what it is, shows what a poll looks like, or gets indexed by search engines
(GitHub issue #24). Once the RSVP and question poll types land (issues #17 and
#16, in-flight as `add-rsvp-poll-type` and `add-question-poll-type`), there are
three poll types worth showing off, and a landing page becomes worth building.

**Prerequisite:** this change ships after `add-rsvp-poll-type` and
`add-question-poll-type` are implemented — the interactive examples demo all
three poll types.

## What Changes

- New landing page at `/`: explains the product, shows one interactive example
  per poll type (dates, RSVP, question), and carries a create call-to-action.
- The interactive examples are client-only toys: tapping an answer moves a
  small results tally; nothing is persisted, reload resets.
- Event creation moves from `/` to `/create`. No creation behavior changes;
  existing specs already say "the create page" without naming a URL.
- The landing page gets language-specific URLs (`/` = English base, `/da`,
  `/de`, `/es`, `/fr`) with a language switcher (native-language names, no
  flags) and hreflang alternates. No automatic redirect by browser language;
  when the browser prefers another supported language a dismissible hint links
  to it. The selected language carries into the create page (`/{lang}/create`).
- Landing and create pages are indexable; token pages (`/e`, `/r`, `/s`)
  explicitly are not.
- Copywriting rule: no em-dashes in user-facing copy, in any locale. Recorded
  as a voice rule in `openspec/specs/DESIGN.md`.

## Capabilities

### New Capabilities

- `landing-page`: the landing page end-to-end — product explanation and
  create call-to-action, one interactive example per poll type with a
  client-only reacting tally, language-specific URLs with the switcher and
  hreflang alternates, the browser-language hint, and the indexability split
  (marketing pages indexable, token pages not).

### Modified Capabilities

- `event-management`: the create page renders in the language selected on the
  landing page (language-specific create URLs); creation behavior itself is
  unchanged.

## Impact

- Routes: create form moves wholesale from the root route to a create route;
  landing route gains an optional language segment. `openspec/specs/PROJECT.md`
  Routes section updated.
- Locale plumbing: the server hook resolves locale per route — marketing
  routes from the URL language segment, token routes from the poll row as
  today (`src/hooks.server.ts`).
- Response widgets (four-state selector, RSVP yes/no) must be renderable with
  local props for the examples; may need a light presentational extraction.
- New Paraglide strings in all five locales (landing copy, switcher labels,
  language hint, example sample data). Sample dates computed relative to
  "now" so they never go stale.
- E2E: existing tests that visit the root to create an event point at the
  create route instead (14 `goto('/')` calls across three spec files); new
  colocated Playwright spec for `landing-page`.
- `openspec/specs/DESIGN.md` gains a voice section (no em-dashes rule).
