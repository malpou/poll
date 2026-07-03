## Context

Three poll types exist (dates, question, rsvp); all answer via the per-row
four-state selector backed by `responses.preference`. This change adds two
text-option types with different answering verbs: rank (order the options)
and highlight (spend marker strokes). Both must fit the capability-URL
model, the `invitee × option` response shape, Paraglide i18n, and the
paper-and-ink design system with no new dependencies.

## Goals / Non-Goals

**Goals:**

- Two new poll types end to end: create, answer, edit, results, close,
  landing demo, all five locales.
- One small migration; reuse the question type's text-option management.
- Interactions built from existing motion vocabulary (flip re-sort,
  `hl-swipe` band), transform/opacity only, reduced-motion safe.

**Non-Goals:**

- Ranking or highlighting date options (text options only in v1; dates can
  come later by letting these types use `starts_at`/`ends_at` rows).
- Ties or partial rankings; fractional or per-option-capped strokes.
- Pairwise (this-or-that) polls, when2meet-style grid painting.
- Changing the stroke budget after creation.

## Decisions

- **One shared `responses.value` integer column** (nullable) instead of
  separate `rank`/`strokes` columns: rank stores position 1..N, highlight
  stores stroke count 0..budget. `preference` stays NULL-free for old types
  and unused for new ones. One migration, no enum change. Alternative
  (separate table per type) rejected: the `invitee × option` PK already fits
  both.
- **`events.highlight_budget` integer, default 5**, validated 1–10 at the
  form boundary like `accent`; immutable after creation (same enforcement
  pattern as poll type immutability). Alternative (organizer-editable
  budget) rejected: reallocation semantics for existing answers get murky.
- **Rank scoring = Borda (sum of positions, lower wins), first-place count
  as tiebreaker.** Computable in one SQL GROUP BY, explainable to a family.
  Alternatives (Condorcet, IRV) rejected as over-engineering for this
  audience.
- **Rank ballots are always full permutations.** Server validates the
  submitted set of positions is exactly 1..N. Option added later → append at
  position N+1 to existing ballots (one UPDATE); option removed → compact
  positions (one UPDATE). Keeps every stored ballot valid with no repair
  pass at read time.
- **Drag implemented with pointer events on a drag handle + move up/down
  buttons** (the buttons are also the keyboard/AT path and satisfy the
  non-drag scenario). Vertical drag starts from the handle only, so page
  scroll on touch is never hijacked. Visuals: lifted slip = shadow + ~1°
  rotate + scale, siblings animate via the existing flip params. No
  drag-and-drop library.
- **Strokes render as stacked `hl-swipe` bands** on the option text — each
  stroke a slightly offset/rotated band, deepening via
  `color-mix(in srgb, var(--hl) N%, <surface>)` as they stack; add/remove
  animates scaleX left-to-right (~200ms ease-out), instant under reduced
  motion. Budget indicator is a row of marker-cap dots that deplete.
- **New types reuse the question type's text-option plumbing** (creation
  options editor, dashboard option management, option rendering). The
  question-options spec widens from "question" to "text-option polls";
  wording stays per-type via new Paraglide message groups (ordering wording,
  stroke wording).
- **Both types force `allow_preferred`/`allow_unsure` off** at creation
  (rsvp precedent); the choice-toggle UI is simply absent for them.
- **DESIGN.md additions** in the same change: the lifted-slip drag rule
  (shadow + slight rotate, flip for siblings), the stacked-stroke rule
  (offset bands, deepening tint), rank badge as circled typewriter numeral
  reusing the badge conventions.

## Risks / Trade-offs

- [Touch drag vs. page scroll] → drag only starts on the handle; move
  buttons always available; e2e covers the button path (drag gestures are
  flaky in CI).
- [Concurrent option add/remove while an invitee is mid-edit] → server
  validates positions against the current option set and rejects stale
  submissions (same "reject, reload, flag new option" behavior other types
  use for late-added options).
- [Borda sensitivity to option removal] → positions are compacted on
  removal, scores recomputed from stored ballots at read time; nothing is
  cached.
- [Landing page gains two demos → longer page] → demos stay client-only and
  lightweight; section order puts the two new, flashier demos where they
  sell (exact order is copy/layout, not spec).
- [Five poll types strain the create form's type choice] → same radio-card
  pattern; if it wraps poorly on narrow phones that is a layout fix, not a
  new control.

## Migration Plan

1. D1 migration: `ALTER TABLE events ADD COLUMN highlight_budget INTEGER
NOT NULL DEFAULT 5; ALTER TABLE responses ADD COLUMN value INTEGER;`
   (additive, no backfill, old types unaffected; rollback = ignore the
   columns).
2. Deploy code that writes/reads `value` only for the new types.
3. No data rollback needed; new-type events simply stop being creatable if
   the code is reverted.

## Open Questions

None blocking. Deferred deliberately: date-option ranking, budget editing,
pairwise type.
