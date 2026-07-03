## Context

The create form (`src/lib/components/templates/CreatePage.svelte`) predates
the question and RSVP poll types. Today it renders: intro paragraph → type
picker (with per-type hint — duplicating the intro) → title → description →
type-specific options → timezone combo box → who-can-respond (default
assigned, participant list) → answer choices (Preferred pre-checked) →
submit (always enabled; validation is server-side `fail()`).

All UI strings live in `messages/{da,de,en,es,fr}.json` via Paraglide. Live
language switching works by re-rendering the form under `{#key locale}`.
Motion rules live in `openspec/specs/DESIGN.md`.

## Goals / Non-Goals

**Goals:**

- One explainer per poll type, type choice first.
- Timezone as a quiet default with a reveal-to-change disclosure.
- Friendlier defaults: open mode, no optional choices pre-checked.
- Section order that reads top-down: type → title/description → options →
  answer choices → who can respond (+ named list) → submit.
- Type-neutral wording for the named-people list.
- Client-side submit gating per poll type.
- Swift, consistent transitions where the form swaps state.

**Non-Goals:**

- No changes to the dashboard's edit flows (timezone editing there keeps the
  always-visible combo box).
- No server/API/schema changes; server validation stays the safety net.
- No redesign of the calendar, option list, or participant list internals.

## Decisions

- **Kill the intro paragraph, keep the type hint.** The `createIntro*`
  strings are deleted from all five language files; the `pollType*Hint`
  strings become the single explainer. Removing strings beats deduplicating
  them — less copy to maintain in five languages.
- **Timezone disclosure is a wrapper state in CreatePage, not a new combobox
  mode.** A note line ("We've picked ⟨zone⟩ for you — change") toggles a
  boolean; the existing `TimezoneCombobox` mounts only when revealed. On
  `value` change while revealed, a short `setTimeout` (~600ms) collapses it.
  The hidden `<input name="timezone">` must post even while collapsed — keep
  the hidden input outside the disclosure. Placed inside the date section,
  directly under its hint and above the calendar, for both dates and RSVP
  types (same spot in both branches), with the dashboard's clock icon so the
  note reads as "timezone".
- **Auto-collapse only on a _different_ zone.** Re-picking the same zone via
  the combobox also collapses (simplest: collapse on any pick event) —
  acceptable; the spec only demands collapse after picking.
- **Defaults change in component state only.** `pollMode = 'open'`,
  `allowPreferred = false`. Mode radio order swaps so open renders first.
  Server defaults untouched (explicit hidden inputs already post values).
- **Choices hint moves above the checkboxes** and keeps its "always
  included" copy; checkboxes both start unchecked.
- **Rename Participants → Invitees** (da "Inviterede", de "Eingeladene", es
  "Invitados", fr "Invités") in the create-form/participant-list strings.
  Rename message _values_ only; keys stay (`participantsSection` etc.) to
  avoid a noisy cross-file rename — key renames are cheap to do later if it
  grates.
- **Submit gating is a `$derived` boolean** over existing state: title
  trimmed non-empty AND (dates: `dates.length > 0` | question:
  `textOptions.length >= 2` (non-empty text) | rsvp: `rsvpDates.length ===
1`). Button gets `disabled` + a caption naming the first missing thing so
  the disabled state is explicable. No assigned-mode participant gate —
  server accepts zero participants today; don't invent a rule.
- **Animations use the existing motion vocabulary.** Svelte `transition:`
  (fade/slide, ~150–200ms, ease-out) on: timezone disclosure open/close,
  hint text swaps (type/mode), and the `{#key locale}` re-render. DESIGN.md
  gains one rule: state swaps animate with a short fade/slide; nothing
  bounces. Respect `prefers-reduced-motion`.

## Risks / Trade-offs

- [Existing e2e tests assume assigned default and Preferred on] → Sweep
  `openspec/specs/**/*.spec.ts` for creations relying on defaults; make them
  explicit where the test isn't about defaults.
- [Disabled submit can strand a confused user] → Always render the reason
  caption next to the disabled button; server validation remains for
  anything that slips through.
- [Collapsed timezone hides a wrong guess (VPN, travel)] → The note always
  names the picked zone, so the wrong guess is visible, one click from
  fixable.
- [Animating `{#key locale}` re-render can flash the whole form] → Keep it
  subtle (opacity-only, short); skip entirely under reduced motion.

## Open Questions

None blocking — wording of the timezone note and the invitee rename per
language gets settled while writing the message files.
