# landing-page Specification

## Purpose

The landing page end-to-end: the product explanation and create
call-to-action at the site root, one interactive client-only example per poll
type, language-specific URLs with the switcher, hreflang alternates and the
browser-language hint, the highlighter hand-off into the create form, and the
indexability split (marketing pages indexable, token pages not).

## Requirements

### Requirement: Landing page

The site's root SHALL be a landing page that explains the product and offers a
clear call-to-action leading to the create page. Event creation SHALL live on
its own create page and behave exactly as specified in event-management.

#### Scenario: Visitor sees the pitch and a create call-to-action

- GIVEN a visitor on the landing page
- WHEN the page renders
- THEN it explains what the product does
- AND shows a call-to-action that leads to the create page

#### Scenario: Call-to-action keeps the page language

- GIVEN a visitor on the Danish landing page
- WHEN they follow the create call-to-action
- THEN the create page renders in Danish

### Requirement: Interactive poll type examples

The landing page SHALL show one interactive example per poll type: a date
poll, an RSVP, a question poll, a rank poll, and a highlight poll. Each
example SHALL be answerable in place, and answering SHALL immediately update
that example's small results tally. Each example SHALL name its poll type,
the surrounding section SHALL make clear the cards are examples, the
examples SHALL persist nothing, and SHALL render their sample content in the
page's language with sample dates in the near future.

#### Scenario: Date poll example reacts to a tap

- GIVEN a visitor on the landing page
- WHEN they mark a date in the date poll example as available
- THEN that example's tally updates immediately to include their answer

#### Scenario: RSVP example takes a yes or no

- GIVEN a visitor on the landing page
- WHEN they tap yes in the RSVP example
- THEN the example's headcount updates immediately

#### Scenario: Question poll example reacts to a tap

- GIVEN a visitor on the landing page
- WHEN they mark an option in the question poll example
- THEN that example's tally updates immediately

#### Scenario: Rank example reacts to a reorder

- GIVEN a visitor on the landing page
- WHEN they move an option in the rank example to a new position
- THEN the example's tally updates immediately to reflect the new order

#### Scenario: Highlight example spends strokes

- GIVEN a visitor on the landing page
- WHEN they tap an option in the highlight example
- THEN a marker stroke appears on that option, the remaining-stroke count
  drops, and the example's tally updates immediately

#### Scenario: Example answers are not persisted

- GIVEN a visitor who answered in an example
- WHEN they reload the landing page
- THEN the example is back in its initial state
- AND no invitee or response was recorded anywhere

### Requirement: Language-specific landing URLs

Each supported language SHALL have its own landing page URL, with English at
the bare root and the other languages under a language segment. A language
switcher SHALL offer all five languages using the same selector as the create
form (each option labeled with the language's native name, ordered by
worldwide speaker count, most-spoken first); picking one SHALL
re-render the page in that language, on that language's URL, without a full
page load. Each language version SHALL declare the other
versions as alternates for search engines. An unsupported language segment
SHALL yield the not-found page.

#### Scenario: Switch language

- GIVEN a visitor on the English landing page
- WHEN they pick Dansk in the language switcher
- THEN the Danish landing page renders, on its own URL, entirely in Danish —
  including the browser tab title
- AND the page did not fully reload

#### Scenario: Languages ordered by worldwide speakers

- GIVEN a visitor on the landing page
- WHEN they look at the language switcher
- THEN the languages read English, Spanish, French, German, Danish — most
  spoken worldwide first

#### Scenario: Direct visit to a language URL

- GIVEN a visitor opening the Danish landing URL directly
- WHEN the page renders
- THEN all copy is Danish and the page declares Danish as its language

#### Scenario: Language versions cross-reference as alternates

- GIVEN any language version of the landing page
- WHEN the page renders
- THEN it declares alternate versions for all five languages plus a default

#### Scenario: Unsupported language segment

- GIVEN a visitor opening the landing URL with an unsupported language segment
- WHEN the request resolves
- THEN the not-found page is shown, explaining the link doesn't exist
- AND the browser tab title names the app

### Requirement: Landing page highlighter

The landing page SHALL offer the same highlighter picker as the create form.
Picking a highlighter SHALL restyle the landing page immediately and SHALL be
reflected in the page's URL, so it survives a language switch and a reload.
The create call-to-action SHALL carry the picked highlighter into the create
page.

#### Scenario: Highlighter restyles the landing page live

- GIVEN a visitor on the landing page
- WHEN they pick another highlighter color
- THEN the page's highlighted elements restyle immediately
- AND the page URL reflects the pick

#### Scenario: Highlighter carries into the create page

- GIVEN a visitor who picked pink on the landing page
- WHEN they follow the create call-to-action
- THEN the create form's highlighter picker starts on pink

### Requirement: Browser language hint without redirect

The landing page MUST NOT redirect based on the browser's preferred language.
When the browser's preferred language is a supported language other than the
page's, the page SHALL show a dismissible hint, written in the browser's
language, linking to that language's version. Dismissing the hint SHALL keep
it hidden for the rest of the visit.

#### Scenario: Hint offered to a mismatched browser

- GIVEN a browser preferring Danish
- WHEN it opens the English landing page
- THEN the English page renders without redirecting
- AND a hint in Danish links to the Danish landing page

#### Scenario: No hint when languages match

- GIVEN a browser preferring Danish
- WHEN it opens the Danish landing page
- THEN no language hint is shown

#### Scenario: Dismissed hint stays away

- GIVEN a visitor who dismissed the language hint
- WHEN they navigate back to the landing page in the same visit
- THEN the hint is not shown

### Requirement: Marketing pages indexable, token pages not

The landing page SHALL be indexable by search engines, and so SHALL both
creation flows — poll creation and planning-poker room creation. Pages reached through a
capability token (organizer dashboard, response pages, the shared open-mode
page, the planning-poker controller console, the planning-poker join page)
SHALL instruct search engines not to index them.

#### Scenario: Landing page is indexable

- GIVEN the landing page in any language
- WHEN the page renders
- THEN it carries no instruction blocking search engine indexing

#### Scenario: Room creation is indexable

- GIVEN the create page with planning-poker room creation chosen
- WHEN the page renders
- THEN it carries no instruction blocking search engine indexing

#### Scenario: Token pages are not indexable

- GIVEN a valid organizer, response, or shared link
- WHEN its page renders
- THEN the page instructs search engines not to index it

#### Scenario: Planning-poker token pages are not indexable

- GIVEN a valid planning-poker controller or join link
- WHEN its page renders
- THEN the page instructs search engines not to index it

### Requirement: Planning poker on the landing page

The landing page SHALL present planning poker as a tool distinct from the
polls, not as another poll type: it SHALL appear in its own section ahead of
the poll examples, marked as a new capability, explain that it is a live,
real-time way for a team to estimate together, and offer its own
call-to-action leading to room creation. The section SHALL show a non-persisting
example of the reveal — face-down cards that turn face-up together on a tap,
with the resulting agreement read-out — and the section SHALL make clear the
cards are an example. All of its copy SHALL render in the page's language.

#### Scenario: Visitor sees planning poker as its own tool

- GIVEN a visitor on the landing page
- WHEN the page renders
- THEN a section ahead of the poll examples explains planning poker as a live
  team estimation tool, marked as new
- AND that section offers its own call-to-action for starting a room

#### Scenario: Planning poker call-to-action keeps the page language

- GIVEN a visitor on the Danish landing page
- WHEN they follow the planning-poker call-to-action
- THEN room creation renders in Danish

#### Scenario: Reveal example turns the cards over

- GIVEN a visitor on the landing page
- WHEN they tap the planning-poker example
- THEN the face-down cards turn face-up together showing their values
- AND the example's agreement read-out appears

#### Scenario: Example answers are not persisted

- GIVEN a visitor who revealed the planning-poker example
- WHEN they reload the landing page
- THEN the example is back to face-down
- AND no room, participant, or vote was recorded anywhere

#### Scenario: Planning poker call-to-action carries the picked highlighter

- GIVEN a visitor on the landing page who picked pink
- WHEN they follow the planning-poker call-to-action
- THEN room creation starts on pink
