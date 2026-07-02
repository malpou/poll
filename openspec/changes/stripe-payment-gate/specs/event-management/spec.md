# event-management Delta

## MODIFIED Requirements

### Requirement: Event creation

The system SHALL allow anyone to create an event with a title, a language, a
timezone, a poll mode, and one or more candidate date options, and SHALL return
a secret organizer link for it once payment completes. The timezone picker
SHALL default to the visitor's own timezone, and SHALL label each timezone with
its identifier plus a zone name localized to the form's current language. The
timezone picker SHALL be a combo box: an editable text field whose suggestion
list narrows to the timezones matching the typed text, and only a real timezone
can end up selected — text matching no timezone reverts to the previously
selected zone.

#### Scenario: Create an event with options

- GIVEN a visitor on the create page
- WHEN they submit a title, a language, a timezone, a poll mode (assigned or
  open), and at least one date option
- THEN the system creates the event with status "open", awaiting payment
- AND generates an unguessable organizer token and a share token
- AND in assigned mode records the participants they added
- AND redirects them to the payment checkout for that event

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

#### Scenario: Choose a timezone by typing

- GIVEN a visitor on the create page
- WHEN they type part of a timezone's label into the timezone picker and pick
  the matching suggestion
- AND submit the form
- THEN the event is created in that timezone

#### Scenario: Text matching no timezone reverts

- GIVEN a visitor on the create page who typed text matching no timezone
- WHEN they leave the timezone field
- THEN the picker reverts to the previously selected timezone
