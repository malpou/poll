## ADDED Requirements

### Requirement: Create page language

The create page SHALL exist per language on language-specific URLs matching
the landing page's scheme, and SHALL render its own chrome in that language.
The form's poll-language picker SHALL default to the page's language, and
picking another language SHALL move the page URL to that language's create
URL while the form re-renders live, without a reload.

#### Scenario: Create page follows the site language

- GIVEN a visitor on the Danish create page URL
- WHEN the page renders
- THEN the page chrome is Danish
- AND the poll-language picker defaults to Danish

#### Scenario: Bare create URL is English

- GIVEN a visitor opening the create page with no language segment
- WHEN the page renders
- THEN the page chrome is English
- AND the poll-language picker defaults to English

#### Scenario: Picking a language moves the create URL

- GIVEN a visitor on the English create page
- WHEN they pick Danish in the language picker
- THEN the form previews Danish live without a reload
- AND the page URL becomes the Danish create URL

### Requirement: Create page highlighter hand-off

The create form's highlighter picker SHALL start on the highlighter carried
over from the landing page, and SHALL keep the page URL in sync when the
visitor picks another one, so a reload keeps the choice.

#### Scenario: Landing highlighter seeds the create form

- GIVEN a visitor who picked pink on the landing page
- WHEN they open the create page through the call-to-action
- THEN the highlighter picker starts on pink
- AND the form previews pink
