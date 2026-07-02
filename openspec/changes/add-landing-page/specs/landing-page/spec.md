## ADDED Requirements

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
poll, an RSVP, and a question poll. Each example SHALL be answerable in place,
and answering SHALL immediately update that example's small results tally.
Examples SHALL be visibly labeled as examples, SHALL persist nothing, and
SHALL render their sample content in the page's language with sample dates in
the near future.

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

#### Scenario: Example answers are not persisted

- GIVEN a visitor who answered in an example
- WHEN they reload the landing page
- THEN the example is back in its initial state
- AND no invitee or response was recorded anywhere

### Requirement: Language-specific landing URLs

Each supported language SHALL have its own landing page URL, with English at
the bare root and the other languages under a language segment. A language
switcher SHALL list all five languages as links, each labeled with the
language's name in that language, without flags. Each language version SHALL
declare the other versions as alternates for search engines. An unsupported
language segment SHALL yield the not-found page.

#### Scenario: Switch language

- GIVEN a visitor on the English landing page
- WHEN they pick Dansk in the language switcher
- THEN the Danish landing page renders, on its own URL, entirely in Danish

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
- THEN the not-found page is shown

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

The landing and create pages SHALL be indexable by search engines. Pages
reached through a capability token (organizer dashboard, response pages, the
shared open-mode page) SHALL instruct search engines not to index them.

#### Scenario: Landing page is indexable

- GIVEN the landing page in any language
- WHEN the page renders
- THEN it carries no instruction blocking search engine indexing

#### Scenario: Token pages are not indexable

- GIVEN a valid organizer, response, or shared link
- WHEN its page renders
- THEN the page instructs search engines not to index it
