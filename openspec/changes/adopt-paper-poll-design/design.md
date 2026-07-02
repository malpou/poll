# Design — adopt-paper-poll-design

## Context

Every page currently renders the Nordic/DR-blue system defined in
`openspec/specs/DESIGN.md` (Inter, blue primary, amber accent, Lucide icons,
`@theme` tokens in `src/routes/layout.css`, shared motion in
`src/lib/motion.ts`). The Paper Poll mockups
([claude.ai/design](https://claude.ai/design/p/c44c5172-2638-4bd7-84a9-8e1f9de9f797?file=Paper+Poll.dc.html),
[issue #18](https://github.com/malpou/poll/issues/18)) replace that identity
wholesale and introduce two behavior changes: a per-poll accent color and
calendar-based date picking (see the `event-management` delta spec).

## Goals / Non-Goals

**Goals:**

- Rewrite DESIGN.md as the single source of truth for the Paper Poll system;
  every route and shared atom conforms to it.
- Per-poll accent stored in D1, picked at creation, editable on the
  dashboard, rendered on all of the poll's pages.
- Calendar + per-day time-slot picking on create and on the dashboard's
  add-date flow.
- All existing behavior specs keep passing; new scenarios get colocated
  Playwright tests.

**Non-Goals:**

- Dark mode (still deferred).
- No new poll behavior beyond accent + date picking (results, closing,
  invitee flows are restyle-only).
- No visual-regression/screenshot test infrastructure.

## Decisions

- **Accent stored as a semantic name** (`accent` TEXT on `events`, one of
  `yellow|pink|green|blue`, default `yellow`), not a hex. Hexes stay in CSS
  tokens per the no-raw-hexes rule; renaming a shade later is a CSS-only
  change. Validated in the form action (D1 can't add a CHECK via ALTER).
  Migration: `ALTER TABLE events ADD COLUMN accent TEXT NOT NULL DEFAULT
'yellow'` — existing polls come out yellow, no backfill.
- **Accent rendering via one CSS custom property.** The event layout sets
  `data-accent` on the page root; `layout.css` maps each accent name to the
  `--hl` variable. All highlighter-tinted styles (title swipe, preference
  state, best-date badge, bars, notices) reference `--hl`, so the four
  accents cost four CSS lines, not four component variants. Tints derive
  with `color-mix()` as in the mockup.
- **Hand-drawn shape via radius tokens.** The irregular
  `a b c d / e f g h` border-radius values become theme tokens
  (card/control/button tiers), replacing the current 10/12/14/16px tiers —
  same tier structure, new values.
- **Paper grain as a body pseudo-element** with the mockup's inline-SVG
  `feTurbulence` data URI, `pointer-events: none`, ~5% opacity. No assets,
  no JS.
- **Calendar built in-house, no dependency.** A month grid is ~50 lines with
  `Intl` (weekday headers from the poll's locale, `getDay` math); day cells
  are real `<button>`s (keyboard-accessible for free). Time slots are native
  `<input type="time">`. A picker library contradicts both the ladder and
  the hand-drawn styling, which we'd fight in any lib.
- **Selected days + slots serialize to the existing `date_options` model.**
  One option per (day, slot); a day with no slots is one option with null
  times. No schema change for dates; the existing start/end validation
  rules apply per slot unchanged.
- **Icons stay `@lucide/svelte`**, resized down (11–17px) per the mockup;
  the preferred star uses `fill="currentColor"`. No icon work beyond sizing
  conventions in DESIGN.md.
- **Courier Prime loaded the same way Inter is today** (swap the font
  package/source, update the `--font-*` token). Body sizes follow the
  mockup (~14.5px) — the mono face reads larger than Inter, so the
  older-family-members legibility bar is still met.
- **Motion params updated in place** in `src/lib/motion.ts` (fadeUp ~240ms /
  35ms stagger, indicator glide `cubic-bezier(.3,1.25,.5,1)` ~350ms, bar
  grow ~450ms). Reduced-motion handling is already centralized there.

## Risks / Trade-offs

- [Whole-app restyle can drift from mockups] → DESIGN.md is rewritten first
  and is the review checklist; finish with `/spec-audit`.
- [Calendar replaces a known-working date-row form] → behavior is pinned by
  the new scenarios' e2e tests before restyling ships; the serialization
  target (`date_options`) is unchanged.
- [`color-mix()`/irregular radii browser support] → both are baseline in all
  evergreen browsers this app targets; no fallback layer.
- [Existing e2e selectors/copy may break under new markup] → tests assert
  `m.*()` strings and roles, not visuals; update the few that touch removed
  controls (free-text date rows) alongside the calendar work.

## Open Questions

- None blocking. The accent picker's exact placement on create/dashboard is
  taken from the mockup pattern (swatch row); the design file exposes the
  color only as a tool prop, so the swatch row follows existing form-control
  styling.
