## Context

Timezone labels are the bare stored IANA id in four places: the create page's
picker, the dashboard header's read-only row, the header's edit picker, and
the response page's timezone note. All other strings localize via Paraglide;
the zone label doesn't, because IANA ids are fixed English city paths.

## Goals / Non-Goals

**Goals:**

- Every rendered timezone label carries a localized zone name in the page's
  current language, with zero new dependencies and no data-model change.

**Non-Goals:**

- Localizing the IANA city names themselves ("Europe/København"). Intl does
  not expose CLDR exemplar cities; doing this would require shipping CLDR
  data. The id stays as-is and disambiguates zones that share a generic name.
- Searchable/grouped timezone picker UX. The picker stays a plain select.

## Decisions

- **Label format: `<IANA id> (<localized generic zone name>)`**, e.g.
  `Europe/Copenhagen (centraleuropæisk tid)` for da. The localized part comes
  from `Intl.DateTimeFormat(tag, { timeZone: tz, timeZoneName: 'longGeneric' })
.formatToParts()` — stdlib, already the pattern used throughout
  `src/lib/logic/date.ts`. Alternative considered: replace the id entirely
  with the localized name — rejected because generic names collide across
  zones (hundreds of zones map to a handful of names), breaking the picker.
- **One shared helper** (`tzLabel(tz, locale)` in `src/lib/logic/date.ts`)
  used by all four render sites, with a per-locale cache like the existing
  `fmtCache` — the create/edit pickers format ~400 zones in one go.
- **Fallback**: if `longGeneric` yields no `timeZoneName` part (older engine
  or a zone without a generic name, where Intl returns a `GMT±X` literal),
  fall back to whatever Intl produced, or the bare id. Never throw over a
  label.
- **Which locale drives the label**: the page's current locale, same source
  every other string uses — create page uses the live-preview locale, the
  dashboard the poll locale (respecting language preview), the response page
  the poll locale.
- The `timezoneNote` message keeps its `{timezone}` parameter; only the value
  interpolated changes.

## Risks / Trade-offs

- [`longGeneric` support varies by engine] → Node ≥ 17 / all evergreen
  browsers / workerd support it; the fallback above degrades to the bare id,
  which is today's behavior.
- [~400 `Intl.DateTimeFormat` constructions when a picker opens] → done once
  per locale and cached; only the two picker sites pay it, and only on the
  client.
- [E2E assertions on bare ids] → tests asserting `America/New_York` etc. in
  visible text must assert the localized label instead; done in the same
  change per the spec invariant.
