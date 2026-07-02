## Why

Timezones render as raw IANA ids ("Europe/Copenhagen", "America/New_York") in
the create picker, the dashboard header and its edit picker, and the response
page's timezone note. Every other UI string is localized via Paraglide; the
timezone is the one label still stuck in English, which reads jarringly for
da/de/es/fr polls.

## What Changes

- Wherever a timezone is shown (create picker, dashboard header, dashboard
  edit picker, response timezone note), it is labeled in the page's current
  language using the platform's localized zone names — e.g. for da
  "Europe/Copenhagen (centraleuropæisk tid)" — instead of the bare IANA id.
- The stored value stays the IANA id — only presentation changes. No data or
  API changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `event-management`: timezone labels in the create picker and on the
  organizer dashboard (display + edit picker) SHALL render localized to the
  current language.
- `availability-response`: the timezone note SHALL name the event's timezone
  localized to the poll's language.

## Impact

- Presentation layer only: the components that render timezone labels and a
  shared formatting helper. Uses the built-in Intl API — no new dependency,
  no schema or route changes.
- Existing e2e tests that assert raw IANA ids in labels/notes need their
  expectations updated to the localized labels.
