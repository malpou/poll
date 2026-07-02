# Design principles

## Identity

Clean Nordic minimalism that nods to DR Byen's architecture: the blue-lit cube
of DR Koncerthuset, glass, and pale concrete (evoke the mood; this is not
official DR branding). Calm, warm, and mobile-first — built to feel personal
and effortless on a phone, scaling gracefully to desktop for organizer views.

## Color

Tokens live in `src/routes/layout.css` (`@theme`); use them, never raw hexes
in markup.

- **Paper & surfaces:** `paper #f7f6f3` background, `card #ffffff`,
  `card-alt #f1efea`, `border #e4e1da`. Ink: `#16233f`, muted `#63697a`.
- **Primary:** deep architectural blue `#1b3a7b` (hover `#274b9e`), tint
  `#e8ecf6`. The Koncerthuset blue.
- **Amber `#b7863f`** (tint `#f3e8d6`): the warm accent — the "preferred"
  state, and the attention tone for notices, the best-date badge, and the
  partial-answered pill.
- **Semantic pair:** `good #5c8067` / `bad #a85b4e` (+ tints) for
  available/unavailable states, result bars, and destructive hover intent.
- **Muted text** (the description editor's toned-down tool) is
  reduced-opacity ink — `<small>` at 0.65 opacity, same size — never a
  separate grey token, so it tones relative to any surrounding color.
- Dark mode is deferred — the palette is light-only today. When it lands, it
  should feel like the cube lit at night: near-black blue ground, luminous
  blue accents.

## Type & shape

- Inter (clean grotesque sans). Five-step scale (tokens): 11px `2xs`
  badges/pills, 13px `caption`, 15px `body`, 17px `lead`, 28px `title`.
  Comfortable body size for older family members on a phone.
- Section headings are eyebrows: uppercase 13px bold, `tracking-[0.06em]`,
  muted ink (the `SectionHeading` atom).
- Radius tiers: 10px `--radius-control` (inputs, small buttons), 12px
  `rounded-xl` (most cards), 14px `--radius-cta` (large CTAs), 16px
  `rounded-2xl` (date option cards, toast). Subtle borders over heavy
  shadows; generous whitespace; one column on mobile.
- **Pills/badges:** `rounded-full px-2.5 py-1 text-2xs font-bold` (usually
  uppercase `tracking-[0.04em]`) in primary/amber/good tints.
- **Buttons** (the `Button` atom's three variants): primary filled (50px),
  dashed add-row, ghost bordered (36px, with an icon-only square form).
- **Icons:** Lucide (`@lucide/svelte`), stroke style only. Default
  `size={16}`; `14` inside compact/inline controls, `18` for primary
  actions. Icon-only buttons always carry an accessible label; destructive
  ones signal intent on hover (`hover:bg-bad-tint hover:text-bad`).
- Prominent date displays capitalize the weekday via CSS (`capitalize`);
  running text keeps the poll language's own casing (Danish lowercase).

## Motion

Follow the animations.dev principles. Motion is intentional and quiet — never
decorative. Animate transform and opacity; the one sanctioned exception is
the results bars animating `width` on mount (~450ms ease-out).

- **Enter/exit → ease-out, fast.** Svelte `fly` with `cubicOut`, ~220–260ms,
  `translateY(8px)→0` + fade. Keep enters snappy.
- **Hover / color / focus → `ease`, ~150ms.**
- **The three-state selector is the signature interaction.** The active
  indicator glides on a Svelte `Spring` (stiffness 0.42, damping 0.75 on
  Svelte's 0–1 scale) — snappy but soft; it never cuts.
- **List entrance → staggered**, ~40ms between cards on first load.
  Orchestrate, don't dump.
- **Toasts** slide up 16px + fade in, ease-out ~200ms, auto-dismiss ~3s.
- **Results re-sorts** slide rows to their new position (flip transition,
  ~300ms ease-in-out), never jump.
- Shared motion params live in `src/lib/motion.ts` — use `flyIn`/`flipParams`
  instead of inlining values; they handle reduced motion for you.
- **Accessibility:** honor `prefers-reduced-motion` — drop transforms and
  stagger, keep only near-instant opacity fades. No motion blocks
  interaction.
- Don't animate anything seen dozens of times per session (no per-keystroke
  animation, no looping effects). Stay within CSS transitions / Svelte
  transitions / Motion — nothing that needs a heavy 3D or canvas library.

## Not in this file

- Copy and translations: `messages/{da,de,en,es,fr}.json` (Paraglide `m.*()`).
- Behavior: `specs/<area>/spec.md`.
- Product, data model, routes, conventions: `specs/PROJECT.md`.
