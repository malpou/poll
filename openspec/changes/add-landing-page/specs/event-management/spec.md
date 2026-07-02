## ADDED Requirements

### Requirement: Create page language

The create page SHALL exist per language on language-specific URLs matching
the landing page's scheme, and SHALL render its own chrome in that language.
The form's poll-language picker SHALL default to the page's language. The
language picked for the poll remains independent: changing it previews the
form live without changing the page URL, as already specified.

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
