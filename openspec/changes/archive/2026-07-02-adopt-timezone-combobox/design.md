## Context

Two timezone pickers — create page and dashboard edit form — are native
selects over ~600 IANA zones. PR #22 (localize-timezone-names) labels each
option `id (localized zone name)`; this change builds on that text and makes
both pickers a combo box (editable field + filtered suggestions).

## Goals / Non-Goals

**Goals:**

- Type-to-filter timezone selection in both pickers, zero new dependencies.
- An invalid typed value can never become the event's timezone.

**Non-Goals:**

- Fuzzy matching, ranking, or grouping of zones. Substring match is enough.
- Touching how the timezone is displayed anywhere else (PR #22 owns labels).

## Decisions

- **Custom minimal combo box, not native `<datalist>`.** Datalist is the
  native combo box, but it fails three needs at once: its dropdown is
  unstylable browser chrome (this repo's DESIGN.md paper look), its filtering
  is prefix-only on Safari (useless for `Europe/…` prefixes shared by ~60
  zones), and its popup can't be asserted in Playwright, so the new scenarios
  would be untestable. So: one small component — text input + listbox of
  matches — following the ARIA combobox pattern (role="combobox",
  aria-expanded, listbox options, arrow-key + Enter selection, Esc closes).
- **Match against the full localized label** (`tzLabel` from PR #22),
  case-insensitive substring, so "copen" and the Danish zone name both hit.
- **Selection model:** the input shows the selected zone's label; a hidden
  input carries the IANA id so the existing form contracts don't change. On
  blur without a valid pick, the input text resets to the selected zone's
  label — the hidden value never held anything invalid.
- **Server stays the backstop:** existing whitelist against
  `Intl.supportedValuesOf('timeZone')` is untouched.
- **DESIGN.md** gains the combo box pattern (suggestion list styling, motion)
  in the same change, per the design-rule invariant.

## Risks / Trade-offs

- [Custom widget instead of native select] → keyboard/screen-reader behavior
  must follow the ARIA combobox pattern; keep it to the minimum (filter,
  arrows, Enter, Esc) and lean on the listbox semantics — no portal, no
  virtualization; 600 plain list items render fine.
- [Sequencing on PR #22] → delta specs here are written against PR #22's
  spec text; land this change after it merges to avoid spec conflicts.
