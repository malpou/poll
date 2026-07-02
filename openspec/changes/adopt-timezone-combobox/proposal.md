## Why

Both timezone pickers (create page and dashboard edit) are plain dropdowns
over all ~600 IANA zones — finding your zone means scrolling one giant
alphabetical list. A combo box (an editable text field combined with a
filtered suggestion list — https://en.wikipedia.org/wiki/Combo_box) lets the
user type a few characters and pick from the matches instead.

## What Changes

- The timezone picker on the create page and in the dashboard edit form
  becomes a combo box: typing filters the zone list, choosing a suggestion
  selects that zone.
- Typed text that matches no timezone can never become the event's timezone —
  the field falls back to the previously selected valid zone.
- Localized labels from the localize-timezone-names change (PR #22) are kept:
  suggestions show and match against `id (localized zone name)`.
- Stored value stays the IANA id. No data-model, route, or API changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `event-management`: the timezone picker requirements (create and edit)
  change from "pick from a list" to "type to filter, pick a match, invalid
  text cannot be selected".

## Impact

- The two components rendering timezone pickers; possibly one small shared
  input piece. The server already whitelists submissions against the IANA
  zone list, so free text is safe end to end.
- e2e tests covering timezone selection gain scenarios for typed selection
  and invalid-text fallback.
- Depends on PR #22 (localize-timezone-names) landing first — the delta specs
  here are written against its spec text.
