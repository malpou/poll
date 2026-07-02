## Why

The create form grew organically as question and RSVP poll types were bolted
onto a dates-first flow, and it now reads awkwardly for all three types: the
long intro paragraph duplicates the per-type hint shown under the type picker,
the timezone combo box demands attention even though the auto-detected zone is
almost always right, the defaults (named-people mode, Preferred pre-checked)
don't match how most polls are actually created, and the submit button lets
you submit a form that is guaranteed to fail validation. "Participants" also
reads wrong on question polls where nobody is attending anything.

## What Changes

All copy changes apply across all five languages (da, de, en, es, fr), and all
structural changes are considered holistically across the three poll types
(dates, question, RSVP).

- Poll type is chosen first: the type picker moves to the top of the form and
  the long per-type intro paragraph is removed — the short per-type hint under
  the picker is the single explainer (no duplicated text).
- Timezone becomes a quiet default: dates and RSVP forms show a one-line note
  next to the calendar — "We've picked ⟨zone⟩ for you — change" — and only
  clicking it reveals the existing combo box; picking a different zone
  collapses it again after a short delay, with a swift animation. Question
  polls keep no timezone UI.
- **BREAKING (defaults)** Poll mode defaults to "Anyone with the link" (open);
  "Named people" becomes the second, opt-in option.
- **BREAKING (defaults)** Answer choices start with nothing checked
  (Preferred and "I don't know" both off), and the "Available and Unavailable
  are always included" hint moves above the checkboxes. RSVP polls keep no
  choice toggles.
- Section order: Answer choices moves above "Who can respond" (with the
  participant list, when shown, staying attached to "Who can respond").
- "Participants" is renamed to a type-neutral word (e.g. "Invitees" /
  "Deltagere" → language-appropriate equivalents) everywhere it labels the
  named-people list, since question polls have no attendees.
- The submit button is disabled while the form would fail validation (empty
  title; dates poll with no dates; question poll with fewer than two options;
  RSVP poll without its single date), per poll type. Server-side validation
  stays as-is.
- Swift, consistent animations on state transitions the form already has:
  live language switch, poll-type switch, timezone reveal/collapse, and the
  choices/mode hint swaps — codified as a motion rule in DESIGN.md.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `event-management`: Event creation requirement gains the type-first form,
  the collapsed timezone disclosure (defaulted zone, reveal-to-change,
  auto-collapse on pick), the open-mode default, and disabled-submit-while-
  invalid behavior. Configurable response choices requirement changes its
  creation default from "Preferred enabled" to "no optional choices enabled".

## Impact

- `src/lib/components/templates/CreatePage.svelte` — reordering, timezone
  disclosure, disabled submit, defaults.
- `src/lib/components/atoms/TimezoneCombobox.svelte` (or a small wrapper) —
  collapsed/revealed states, auto-collapse, animation.
- `messages/{da,de,en,es,fr}.json` — remove the three createIntro* strings,
  new timezone-note string, renamed participants strings, hint rewording.
- `openspec/specs/event-management/spec.md` + colocated `.spec.ts` — updated
  requirements and scenarios (mode default, choices default, timezone
  disclosure, submit gating).
- `openspec/specs/DESIGN.md` — motion rule for state-transition animations.
- Existing e2e tests that rely on current defaults (assigned mode, Preferred
  on) will need updating.
- No schema or API changes; server validation unchanged.
