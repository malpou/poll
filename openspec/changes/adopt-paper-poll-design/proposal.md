# Adopt the "Paper Poll" design

## Why

The product is moving from the Nordic/DR-Byen-blue visual identity to the
"Paper Poll" design (paper/analog: Courier Prime mono, cream paper, ink,
highlighter accent, hand-drawn corners) — reference mockups at
[claude.ai/design](https://claude.ai/design/p/c44c5172-2638-4bd7-84a9-8e1f9de9f797?file=Paper+Poll.dc.html),
tracked as [GitHub issue #18](https://github.com/malpou/poll/issues/18).
Most of it is restyling, but two parts change observable behavior and must go
through specs.

## What Changes

- **Full visual redesign** of every page to the Paper Poll system: paper/ink
  palette, per-poll highlighter accent, Courier Prime, hand-drawn irregular
  corner radii, paper-grain overlay, underline inputs, dashed dividers and
  add-buttons, ink-filled primary CTA, hatch pattern + strikethrough for
  "unavailable", highlighter for "preferred". `openspec/specs/DESIGN.md` is
  rewritten as the source of truth for the new system.
- **Highlighter color becomes a poll setting** (behavior change): the
  organizer picks one of four colors — yellow (default), pink, green, blue —
  at creation and can change it from the dashboard; every page of that poll
  renders with the chosen accent.
- **Calendar-based date picking** (behavior change): candidate dates are
  chosen by toggling days in a month calendar instead of typing free-text
  rows; each selected date carries zero or more optional time slots, and one
  date with several slots yields several date options.
- Icons stay Lucide (stroke style), resized to sit in the mono type; the
  preferred-state star renders filled.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `event-management`: new requirement — poll accent color (picked at
  creation, editable from the dashboard, rendered on all of the poll's
  pages). Modified requirement — "Manage date options" changes to the
  calendar + per-date time-slot flow. The optional start/end-time
  constraints are unchanged.

## Impact

- **Data model:** `events` gains an accent-color column (one of four values,
  default yellow).
- **All routes** (`/`, `/e/…`, `/r/…`, `/s/…`) restyled; shared atoms
  (buttons, section headings, three-state selector, pills, toast, inputs)
  and design tokens in the theme CSS replaced; shared motion params updated.
- **`openspec/specs/DESIGN.md`** rewritten; `event-management` spec + its
  colocated Playwright tests updated in the same change.
- **Translations:** new UI strings (accent-color picker, calendar labels)
  added to `messages/{da,de,en,es,fr}.json`.
- No changes to tokens/security model, poll modes, results aggregation, or
  closing flow beyond restyling.
