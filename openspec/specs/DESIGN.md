# Design principles

## Identity

"Paper Poll" — a paper-and-ink, analog feel: cream paper surfaces, typewriter
mono type, hand-drawn irregular corners, and a highlighter-marker accent the
organizer picks per poll. Calm, warm, and mobile-first — built to feel personal
and effortless on a phone, scaling gracefully to desktop for organizer views.

## Color

Tokens live in `src/routes/layout.css` (`@theme`); use them, never raw hexes
in markup. Markup uses canonical Tailwind utilities only — no `px` values and
no arbitrary `[...]` values; a length that doesn't fit the scale becomes a
theme token instead.

- **Paper & surfaces:** page `paper #eae7de`, sheet `card #fcfbf6`, inner
  surfaces `card-alt #fffef9`, borders `border #dedacb` /
  `border-strong #d5d0bf`. Ink: `#26241f`, secondary `#57534a` (`ink-soft`),
  muted `#8a8578` (`ink-muted`), faint `#a8a394` (`ink-faint` — placeholders,
  dashed add-borders, the calendar weekday header). `wash #e8e4d5` is the
  neutral gray face (selector "available", result-bar tracks, disabled CTA).
- **The paper sheet:** every screen's content sits on one floating cream
  sheet (`paper-sheet` utility: `bg-card`, 1px `border`, card radius, soft
  drop shadow, `clamp(26px, 6vw, 52px)` padding) over the darker page
  ground, max-width 640px, centered.
- **Paper grain:** a subtle noise overlay (inline-SVG `feTurbulence` data URI
  on a `body::before` pseudo-element, ~5% opacity, `pointer-events: none`)
  sits over the whole page. No image assets, no JS.
- **Highlighter accent — a poll setting, not a fixed token.** Five options:
  yellow `#f7e36b` (default), pink `#ffc9d4`, green `#c9e6a5`, blue
  `#bfdcf3`, purple `#d9c9f0`. The organizer picks it at creation and can change it when
  editing the poll; every page of that poll renders with it. The event page
  root carries `data-accent="<name>"`; `layout.css` maps each name to the
  `--hl` custom property, and every highlighter-tinted style references
  `--hl` — the text-marker swipe under titles, the "preferred" state, the
  best-date badge, the preferred result-bar fill, and notice tints. Tints
  derive with
  `color-mix(in srgb, var(--hl) N%, <surface>)`; never hardcode a
  per-accent hex in markup.
- **Ink is the primary.** Solid-ink fills for the primary CTA and toasts;
  ghost buttons invert to ink fill on hover.
- **Semantic pair:** `good #5c8067` / `bad #a85b4e` (+ tints) for the
  answered-status pill and saved-check (good), error text, and destructive
  hover intent (bad).
- **Unavailable renders analog:** a diagonal ink hatch pattern (45°,
  ink at 14% via `color-mix`, 1.5px stripes on a 6px rhythm — the
  `ink-hatch` class) on the "no" selector state, and strikethrough on
  unavailable text. **Available** is the plain gray `wash` — no color
  temperature.
- **Neutral fourth state** — the "I don't know" (unsure) answer: muted ink on
  the shared track, no dedicated token, Lucide question-mark icon.
  Deliberately quieter than the highlighter/good/bad trio.
- **Muted text** (the description editor's toned-down tool) is
  reduced-opacity ink — `<small>` at 0.65 opacity, same size — never a
  separate grey token, so it tones relative to any surrounding color.
- Dark mode is deferred — the palette is light-only today.

## Type & shape

- Courier Prime (typewriter monospace) throughout — the mono face reads
  larger than a sans, keeping the body comfortable for older family members
  on a phone. Semantic scale (tokens): 11px `2xs` badges/pills/eyebrows,
  13px `caption`, ~14.5px `body`, 16px `lead`, titles
  `clamp(24px, 5vw, 31px)` (`title`). Default Tailwind steps (`text-xs`,
  `text-sm`, …) may fill in-between cases; arbitrary pixel values may not.
- Page/section titles carry the **highlighter swipe** (the `hl-swipe`
  class): a semi-transparent marker band behind the lower half of the text —
  `color-mix(in oklab, var(--hl) 65%, transparent)` between 55% and 94% of
  the line — like a text marker run across paper.
- Section headings AND field labels are eyebrows: uppercase 11px bold,
  `tracking-widest`, muted ink (the `SectionHeading` atom; every form
  control label uses the same style).
- **Text wraps pretty:** headings and paragraphs use `text-wrap: pretty`
  (better break points, no orphaned words) and `overflow-wrap: break-word`
  so a long unbroken word breaks instead of overflowing the sheet. Rows of
  controls wrap on narrow screens — content is never squeezed into a
  one-word-per-line column to keep a button cluster on the same row.
- **Hand-drawn shape:** irregular eight-value corner radii instead of uniform
  rounding, as radius tokens in three tiers — control
  (`--radius-control: 8px 11px 7px 12px / 11px 7px 12px 8px`), card
  (`--radius-card: 9px 13px 8px 14px / 13px 8px 14px 9px`), and button/CTA
  (`--radius-cta: 10px 6px 12px 7px / 6px 12px 7px 10px`). The best-date
  badge sits slightly rotated (±1–2°). Subtle 2px borders over shadows;
  generous whitespace; one column on mobile.
- **Pills/badges:** `rounded-full px-2.5 py-1 text-2xs font-bold` (usually
  uppercase `tracking-wider`); the best-date badge fills with `--hl` and
  tilts slightly. Solid-ink pills (`bg-ink text-card`) mark decided state —
  the chosen-date badge on closed polls.
- **Rank position badge:** a circled typewriter numeral — a 24px circle with
  the 2px ink border, 11px bold ink digit — leads each rank slip and always
  shows the slip's current position; it reuses the badge conventions, no new
  token.
- **Stacked marker strokes** (the highlight type's answer): each stroke is
  one `hl-swipe`-style translucent band over the option's text, each pass
  nudged a little upward so repeated runs read as separate marker strokes;
  the overlapping `color-mix` bands deepen the tint as strokes stack. The
  `hl-strokes` class keeps wrapped lines marked via
  `box-decoration-break: clone`. The budget renders as a row of marker-cap
  dots (14px circles, `--hl` fill while unspent) that deplete as strokes are
  spent; each picked option then carries that same circle motif — one filled
  marker-cap dot per stroke it holds — instead of a numeric count, so the
  spent dots on the cards visibly mirror the depleted dots in the budget row.
- **Status strips** (the `NoticeBanner` atom): a 2px-bordered card-radius
  strip led by an 8px colored dot, in two tones — highlighter tint with an
  `--hl` dot, and neutral `card-alt` with an ink dot.
- **Controls:** underline-only text inputs (2px bottom border, darkens to ink
  on focus — no box), 2px-bordered textareas and cards on `card-alt`, dashed
  add-row buttons (`ink-faint` dash, ink on hover), ghost buttons that
  invert to ink fill on hover, solid-ink full-width 52px primary CTA with a
  hover lift and `tracking-wider`. Dashed 2px rules as section dividers.
- **Radio choices** (who-can-answer and similar): bordered option cards with
  a hand-drawn control radius and an ink dot indicator; the active card gets
  an ink border on the highlighter tint. The **language selector** is a row
  of circular flag swatches styled like the accent picker (28px circles, 2px
  `border-strong` border, ink border + ring when active); the artwork is the
  MIT-licensed circle-flags SVG set, inlined — no external requests. Each
  language's native name stays as the radio's accessible label and tooltip.
  On the create and landing pages both swatch rows are legend-less and sit in
  the sheet's top corners — accent top-left, language top-right — pinned to
  the edges at every width; on narrow phones each row wraps onto multiple
  lines rather than the two pickers stacking. On the landing page the accent
  swatch restyles the page live and the flag swatch navigates to that
  language's URL.
- **Buttons** (the `Button` atom's three variants): primary ink-filled
  (52px, full-width, hover lift, the arrow icon trailing the label), dashed
  add-row, ghost ink-bordered (36px, inverts to ink on hover, with an
  icon-only square form). Copy buttons are icon-only ghosts (the Copy icon
  beside the link chip — the row stays one line on any phone); the
  aria-label keeps the full "Copy link". A fourth,
  destructive form (the `IconButton` atom): 36px square on `card-alt` with a
  quiet border and muted icon that signals intent on hover
  (`hover:bg-bad-tint hover:text-bad`).
- **Icons:** Lucide (`@lucide/svelte`), stroke style — the one exception is
  the language selector's circle-flags artwork (above) — sized small (12–17px)
  to sit in the mono type: 13–14 inside compact/inline controls, 16 in
  icon-only buttons and callout/notice title rows, 17 for primary actions.
  The star is **filled**
  (`fill="currentColor"`) when a date is preferred. Save actions use the
  `Save` icon (never a bare check — checks mean "available"/"done"); inline
  editing is entered via a `Pencil` icon button, with values read-only until
  then. Icon-only buttons always carry an accessible label; destructive ones
  signal intent on hover (`hover:bg-bad-tint hover:text-bad`). Meta/detail lists use a small icon
  as the bullet in place of a text label, with the label kept as `sr-only`
  text.
- **Combo box** (type-to-filter pickers over long lists): the input styled
  like the other controls (control radius, 2px border, ink focus); the
  suggestion list is a panel directly beneath on the inner surface
  (`bg-card-alt`, `border-border`, control radius, `max-h-60` scroll, no
  shadow). The
  active/keyboard-highlighted option gets a `--hl` tint. The list appears
  and closes instantly — no open/close animation, per the "seen dozens of
  times per session" motion rule.
- **Calendar** (date picking on create and organizer add-date): an inline
  month grid — ghost prev/next month buttons, uppercase 11px `ink-faint`
  weekday header in the poll's locale, pill-shaped day cells (real
  `<button>`s, 2px border) that toggle selection; selected days fill with
  `--hl` and take an ink border, hover outlines in ink. Time slots under
  each selected day use native `<input type="time">`. With nothing selected,
  an italic `ink-faint` hint points at the calendar.
- **Callout tones:** ink (informational), highlighter tint with ink border
  (save-this-link), neutral, and dashed `ink-faint` (the chase-up list —
  attention without alarm).
- **Submit area** (response form): inline at the bottom of the sheet — no
  fixed bar. Once answered it becomes the notice card: ink border on the
  highlighter tint with a check title and a ghost edit button.
- **Date rows everywhere share one baseline header:** bold capitalized
  weekday, softer date, muted time — pushed right on cards, dot-separated
  inline in tight rows (the dashboard options list).
- **Result cards:** one baseline header row — bold capitalized weekday, date,
  time, the badge pushed right — then an icon-marked count per enabled
  choice in muted caption text, then a single stacked bar on the `wash`
  track (`--hl` preferred fill, `border-strong` available fill; Available
  takes `--hl` when Preferred isn't offered; unavailable fills with the
  diagonal ink hatch — the same mark as the selector's "no" face — so it
  never reads as "hasn't answered"; unsure and not-yet-answered stay plain
  track), and — organizer only — one pill per respondent marked with their
  answer:
  `--hl` fill with a filled star for preferred, bordered with a check for
  available, a question mark for "I don't know", and struck-through muted
  with an X for unavailable. Best and chosen cards take an ink border.
- **Value result cards** (rank / highlight) share one shape: a single caption
  (average position for rank, stroke total for highlight) over the same
  `wash`-track `--hl` bar the preference cards use, growing on mount. The bar
  fills by the option's standing — highlight by its share of all strokes,
  rank by how close its average position is to first place (first place fills
  it, last empties it) — so both types read as one visual language. The
  organizer's per-respondent pills carry a locale-neutral `#position` or
  `×strokes`, with the words in `sr-only` text.
- Prominent date displays capitalize the weekday via CSS (`capitalize`);
  running text keeps the poll language's own casing (Danish lowercase).

## Motion

Follow the animations.dev principles. Motion is intentional and quiet — never
decorative. Animate transform and opacity only — the result bar grows with a
`scaleX` transform on mount (~450ms ease-out).

- **Enter/exit → ease-out, fast.** Svelte `fly` with `cubicOut`, ~240ms,
  `translateY(8px)→0` + fade. Keep enters snappy.
- **Hover / color / focus → `ease`, ~150ms.**
- **The three-state selector is the signature interaction.** One ink-bordered
  56px track; each segment stacks a small icon (filled star / check / X /
  question mark) over its 11px label; the active indicator glides between
  states, ~350ms `cubic-bezier(.3, 1.25, .5, 1)` — a soft overshoot; it
  never cuts. Indicator faces, all four distinct: `--hl` for preferred, gray
  `wash` for available, diagonal ink hatch for unavailable, pencil dots
  (`ink-dots`) for unsure. When the poll doesn't offer Preferred, Available
  is the positive answer and takes the `--hl` face instead of the wash.
- **List entrance → staggered**, ~35ms between cards on first load.
  Orchestrate, don't dump.
- **Accent switch is live and animated:** picking a highlighter updates the
  page immediately (create previews on the form; the dashboard previews like
  the language picker, rolled back on cancel), and `--hl` is a registered
  custom property with a ~200ms ease transition, so the new color sweeps
  across every tinted element instead of cutting.
- **Toasts** are ink-filled, slide up bottom-center + fade in, ease-out
  ~200ms, auto-dismiss ~3s.
- **Results re-sorts** slide rows to their new position (flip transition,
  ~300ms ease-in-out), never jump.
- **Lifted slip** (rank reordering): the dragged slip lifts with a soft ink
  shadow, ~1° rotate and a slight scale (the `slip-lifted` class — transform
  only), while its siblings glide around it with the standard flip params.
  Drag starts only on the grip handle so touch scrolling elsewhere is never
  hijacked; the move up/down buttons are the keyboard and assistive-tech
  path and always present.
- **State swaps animate, never cut.** Content replaced in place — a live
  language re-render, a hint that follows a picked type or mode, a
  disclosure opening or closing — fades/slides in with a short ease-out
  (~180ms, `cubicOut`): full-block re-renders fade opacity-only, small text
  swaps get a 4px rise, disclosures slide open. Nothing bounces. Under
  reduced motion: near-instant opacity fade, disclosures snap.
- Shared motion params live in `src/lib/motion.ts` — use
  `flyIn`/`flipParams`/`swapIn`/`slideParams` instead of inlining values;
  they handle reduced motion for you. Live locale re-renders wrap in the
  shared `LocaleSwap` atom rather than hand-rolling `{#key}` + fade.
- **Accessibility:** honor `prefers-reduced-motion` — drop transforms and
  stagger, keep only near-instant opacity fades. No motion blocks
  interaction.
- Don't animate anything seen dozens of times per session (no per-keystroke
  animation, no looping effects). Stay within CSS transitions / Svelte
  transitions / Motion — nothing that needs a heavy 3D or canvas library.

## Voice

- **No em-dashes in user-facing copy, any locale.** Rephrase with a period,
  comma, colon, or parentheses instead. Applies to every string in
  `messages/{da,de,en,es,fr}.json`; enforced by a unit test scanning the
  message catalogs. (Docs and code comments are exempt.)

## Not in this file

- Copy and translations: `messages/{da,de,en,es,fr}.json` (Paraglide `m.*()`).
- Behavior: `specs/<area>/spec.md`.
- Product, data model, routes, conventions: `specs/PROJECT.md`.
