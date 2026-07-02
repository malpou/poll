## 1. Prerequisites

- [ ] 1.1 Confirm `add-rsvp-poll-type` and `add-question-poll-type` are implemented and archived (all three poll types exist in main specs); do not start before then

## 2. Routes and locale plumbing

- [ ] 2.1 Add a route param matcher that accepts exactly the non-base locale codes (da, de, es, fr) so the optional language segment can never shadow `/e`, `/r`, `/s`
- [ ] 2.2 Move the create form route wholesale from `src/routes/` root to the create route under the optional language segment; update the 14 `goto('/')` calls in `openspec/specs/event-management/*.spec.ts` to the create URL
- [ ] 2.3 Make the server hook routing-specific: marketing routes seed the request locale from the URL language segment; token routes keep poll-row resolution unchanged
- [ ] 2.4 Default the create form's poll-language picker to the page language
- [ ] 2.5 Update the Routes section of `openspec/specs/PROJECT.md`

## 3. Voice rule

- [ ] 3.1 Add a Voice section to `openspec/specs/DESIGN.md`: no em-dashes in user-facing copy, any locale
- [ ] 3.2 Add a unit test scanning `messages/*.json` for em-dashes; rewrite any existing violations

## 4. Landing page

- [ ] 4.1 Landing route at the root with the optional language segment: pitch copy and create call-to-action in all five locales via Paraglide, per DESIGN.md
- [ ] 4.2 Language switcher: five links labeled in native language names, no flags
- [ ] 4.3 hreflang alternates plus x-default on landing and create pages, per language version
- [ ] 4.4 Browser-language hint: shown when Accept-Language prefers another supported language, written in that language, links to its version, dismissible for the session, never a redirect

## 5. Interactive examples

- [ ] 5.1 Extract the four-state selector and RSVP yes/no widgets so they render from local props without a form action (presentational only; existing availability-response and rsvp-poll e2e stay green untouched)
- [ ] 5.2 Date poll example card: relative near-future sample dates, tap moves a client-only tally, labeled as an example
- [ ] 5.3 RSVP example card: yes/no tap updates the headcount tally
- [ ] 5.4 Question poll example card: sample options with the question-poll wording, tap moves the tally

## 6. Indexability

- [ ] 6.1 Token pages (`/e`, `/r`, `/s`) declare noindex; marketing pages carry no robots restriction

## 7. Tests and verification

- [ ] 7.1 Colocated `openspec/specs/landing-page/landing.spec.ts`: one test per scenario (pitch and CTA, CTA keeps language, three example taps, no persistence on reload, switcher, direct language URL, alternates, unsupported segment 404, hint shown/absent/dismissed, indexability split), `e2e-landing-*` token family where seeding is needed
- [ ] 7.2 Create-page-language scenarios added to the event-management colocated tests
- [ ] 7.3 `bun run check`, `bun run lint`, `bun run test`, `bun run test:e2e` all green
