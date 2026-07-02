## 1. Helper

- [x] 1.1 Add `tzLabel(tz, locale)` to `src/lib/logic/date.ts` — `<IANA id> (<localized longGeneric zone name>)`, per-locale cached, falls back to the bare id when Intl yields no zone name; unit tests in `src/lib/logic/date.test.ts` (da/en labels, fallback)

## 2. Render sites

- [x] 2.1 CreatePage picker: option labels via `tzLabel(tz, locale)`, re-rendering with the live language preview
- [x] 2.2 EventHeader: read-only timezone row and edit-picker options via `tzLabel` under the current (preview) locale
- [x] 2.3 ResponsePage: interpolate `tzLabel(view.timezone, locale)` into `m.timezoneNote`

## 3. Specs & tests

- [x] 3.1 Update e2e assertions on bare IANA ids to localized labels (`event-management/create-event.spec.ts`, `event-management/timezone.spec.ts`, `availability-response/timezone.spec.ts`) and add coverage for the two new scenarios (picker labels follow picked language; dashboard names the timezone in the event's language)
- [x] 3.2 Run `bun run check`, `bun run test`, `bun run test:e2e`
