## MODIFIED Requirements

### Requirement: Event creation

The system SHALL allow anyone to create an event with a title, a language, a
timezone, a poll mode, and one or more candidate date options, and SHALL return
a secret organizer link for it. The timezone picker SHALL default to the
visitor's own timezone, and SHALL label each timezone with its identifier plus
a zone name localized to the form's current language.

#### Scenario: Create an event with options

- GIVEN a visitor on the create page
- WHEN they submit a title, a language, a timezone, a poll mode (assigned or
  open), and at least one date option
- THEN the system creates the event with status "open"
- AND generates an unguessable organizer token and a share token
- AND in assigned mode records the participants they added
- AND redirects them to the organizer dashboard for that token

#### Scenario: Reject an event with no options

- GIVEN a visitor on the create page
- WHEN they submit with zero date options
- THEN the system rejects the submission with a validation message

#### Scenario: Language picker previews the create form live

- GIVEN a visitor on the create page
- WHEN they pick another language
- THEN the whole form re-renders in that language without a reload

#### Scenario: Timezone picker labels follow the picked language

- GIVEN a visitor on the create page
- WHEN they pick a non-English language
- THEN each timezone option shows its identifier together with a zone name in
  that language

### Requirement: Event timezone

The system SHALL render every date option's times in the event's timezone,
chosen by the organizer at creation and changeable afterwards alongside the
title and description. Wherever the event's timezone is named — on the
dashboard and in the timezone picker when editing — the label SHALL include a
zone name localized to the current language alongside the identifier.

#### Scenario: Change the timezone

- GIVEN an event whose options have start times
- WHEN the organizer picks another timezone
- THEN the dashboard and every response page show the times converted to it

#### Scenario: Dashboard names the timezone in the event's language

- GIVEN an event in a non-English language
- WHEN the organizer opens the dashboard
- THEN the event's timezone is shown as its identifier together with a zone
  name in that language
