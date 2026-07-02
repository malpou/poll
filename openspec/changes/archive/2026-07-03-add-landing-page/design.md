## Context

The root route is the create form; there is no page that explains the product
or gets indexed. Locale today is per-poll: the server hook runs every request
inside an AsyncLocalStorage seeded with the base locale, and token-page loads
overwrite it from the event row. Marketing pages (landing, create) have no
poll to take a locale from. Two poll-type changes (`add-rsvp-poll-type`,
`add-question-poll-type`) are prerequisites; the landing page demos all three
types.

## Goals / Non-Goals

**Goals:**

- Landing page at `/` with per-language URLs, a switcher, and one interactive
  example per poll type.
- Create form moved wholesale to a create route; zero creation behavior change.
- Marketing pages indexable with hreflang alternates; token pages not
  indexable.
- No em-dashes rule recorded in DESIGN.md and enforced mechanically.

**Non-Goals:**

- Payment gating (issue #25).
- Analytics, testimonials, pricing sections, or any lead capture.
- Localizing token pages by URL; they keep poll-row locale.
- Auto-redirect by browser language (explicitly rejected, see Decisions).

## Decisions

### Route-specific locale resolution in the server hook

The server hook becomes routing-aware: for marketing routes it seeds the
request's AsyncLocalStorage locale from the URL language segment before
resolve; token routes are untouched and keep overwriting the locale from the
poll row in their loads. One resolution mechanism (the existing store), two
route-dependent sources.

Alternative considered: Paraglide's built-in `url`/`cookie` strategy. Rejected
because the repo already overrides `getLocale()` for per-poll locale, and the
strategy would fight the token routes (they must never be URL-prefixed or
cookie-driven).

### URL scheme: optional language segment, English at the bare path

`/` and `/create` are the English (base) pages; `/da`, `/da/create`, `/de`,
`/es`, `/fr` etc. are the other four. Implemented as an optional route
parameter with a param matcher that only accepts the four non-base locale
codes, so `/e/...`, `/r/...`, `/s/...` and any junk segment can never collide
with it; an unsupported language segment falls through to the normal 404.
English deliberately has no `/en` twin so every page has exactly one URL (no
duplicate-content handling needed).

### No auto-redirect; hint instead

Serving different languages on one URL (or redirecting by `Accept-Language`)
hides four of the five versions from crawlers, which crawl from one region.
Each version lives on its own URL, all versions cross-reference via
`hreflang` alternates plus `x-default`, and when the browser's preferred
language differs from the page's, a dismissible hint links to the matching
version. Dismissal is remembered for the session.

### Language switcher: the create form's flag-swatch selector

The landing page reuses the create form's circular flag-swatch language
selector (native-name accessible labels via the existing Intl.DisplayNames
utility), pinned to the sheet's top-right corner exactly like the create
page; picking a flag navigates (full load) to that language's URL. Crawlers
discover the versions through the hreflang alternates, not the switcher.
(Supersedes an earlier plain-text-links decision: consistency with the
create form won.)

### Highlighter picker on the landing page

The landing page carries the accent picker in the sheet's top-left corner,
mirroring the create page. Picking restyles the landing page live (the same
data-accent → --hl mechanism as everywhere else) and rides a `?accent=`
query through language switches and into the create form, whose picker
starts on it. The default (yellow) keeps URLs clean. The create form keeps
the query in sync too, so a reload keeps the choice.

### Interactive examples are presentational reuses of the real widgets

The response widgets (four-state selector, RSVP yes/no pair) are extracted so
they can render from local props without a form action, and each example card
wires one to client-only state plus a small tally that reacts to taps. Nothing
is submitted; reload resets. Sample dates are computed relative to now (next
weekend) so the page never shows stale dates; sample copy renders in the page
language. One interaction per card, no deeper navigation. Cards are visibly
labeled as examples so a tap is not mistaken for a real RSVP.

Alternative considered: seeded real demo polls linked from the page. Rejected:
invites junk data, needs a reset job, and the tally toy delivers the same
"aha" with zero backend.

### Indexability split

Marketing pages carry the hreflang alternates and no robots restrictions.
Token pages (`/e`, `/r`, `/s`) declare noindex, follow-up to the existing
"keep tokens out of logs, referrers, analytics" rule in PROJECT.md.

### Em-dash rule enforced by test

DESIGN.md gains a Voice section: no em-dashes in user-facing copy, any locale.
A small unit test scans all five message files for the character, so the rule
survives future copy edits without anyone remembering it.

## Risks / Trade-offs

- [Widget extraction touches live response pages] → extraction is
  presentational-only refactoring; existing e2e specs for
  availability-response and rsvp-poll must stay green untouched.
- [Optional root param can shadow other routes] → the param matcher accepts
  exactly the four non-base locale codes; everything else falls through.
- [Existing copy may already contain em-dashes] → the enforcement test runs
  against all current messages first; violations get rewritten as part of this
  change.
- [Interactive examples read as real polls] → explicit example labeling on
  each card and no persistence.
- [Prerequisites not yet landed] → this change must be implemented after
  `add-rsvp-poll-type` and `add-question-poll-type`; its examples reference
  their wording (yes/no, "Works for me").

## Open Questions

- Prerender the marketing pages at build time? They are static per locale;
  the Cloudflare adapter supports it. Decide during implementation; not a
  behavioral question.
