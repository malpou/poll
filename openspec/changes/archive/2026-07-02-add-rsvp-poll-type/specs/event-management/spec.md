# event-management Delta

## MODIFIED Requirements

### Requirement: Event creation

The system SHALL allow anyone to create an event with a title, a language, a
timezone, a poll mode, and one or more candidate date options, and SHALL return
a secret organizer link for it. The create page SHALL offer a poll type
choice — date poll (the default) or RSVP; the RSVP creation flow is specified
in rsvp-poll. The timezone picker SHALL default to the
visitor's own timezone, and SHALL label each timezone with its identifier plus
a zone name localized to the form's current language. The timezone picker
SHALL be a combo box: an editable text field whose suggestion list narrows to
the timezones matching the typed text, and only a real timezone can end up
selected — text matching no timezone reverts to the previously selected zone.

#### Scenario: Create an event with options

- GIVEN a visitor on the create page
- WHEN they submit a title, a language, a timezone, a poll mode (assigned or
  open), and at least one date option
- THEN the system creates the event with status "open"
- AND generates an unguessable organizer token and a share token
- AND in assigned mode records the participants they added
- AND redirects them to the organizer dashboard for that token

#### Scenario: Poll type defaults to date poll

- GIVEN a visitor on the create page
- WHEN they create an event without touching the poll type choice
- THEN a date poll is created

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

### Requirement: Manage date options

The system SHALL let the organizer of a date poll add, edit, and remove date
options while the event is open (RSVP polls keep exactly one option — see
rsvp-poll). Candidate dates SHALL be chosen by toggling days in a month
calendar (navigable month by month), not by free-form entry. A selected day
MAY carry any number of optional time slots; a day with several time slots
SHALL yield one date option per slot.

#### Scenario: Pick dates from a calendar

- GIVEN an organizer choosing candidate dates
- WHEN they toggle two days in the calendar
- THEN both days are listed as selected date options
- AND toggling one of them again deselects it and removes it from the list

#### Scenario: Several time slots on one day

- GIVEN a selected day
- WHEN the organizer adds two time slots to it
- THEN the event offers two date options on that day, one per slot

#### Scenario: Add an option after invitees exist

- GIVEN an open event with existing invitees and responses
- WHEN the organizer adds a new date option
- THEN the option appears for all invitees
- AND existing invitees show as "not yet answered" for the new option

#### Scenario: Remove an option that has responses

- GIVEN a date option with recorded responses
- WHEN the organizer removes it
- THEN the option and its responses are deleted
- AND the organizer is warned before the deletion is confirmed

### Requirement: Configurable response choices

Every date poll SHALL offer the Available and Unavailable choices. The
organizer SHALL be able to enable or disable the "Preferred" choice (enabled
by default) and the "I don't know" choice (disabled by default), both at
creation and while the event is open — including events that already have
recorded answers. Disabling a choice SHALL fold its already-recorded answers
into the fixed pair: Preferred answers become Available, "I don't know"
answers become Unavailable. Folded answers still count as answered.
Re-enabling a choice offers it again but SHALL NOT restore folded answers.
RSVP polls offer exactly yes and no; the choice toggles do not apply to them
(see rsvp-poll).

#### Scenario: Defaults at creation

- GIVEN a visitor on the create page
- WHEN they create an event without touching the choice settings
- THEN the event offers Preferred, Available, and Unavailable
- AND does not offer "I don't know"

#### Scenario: Enable "I don't know" at creation

- GIVEN a visitor on the create page
- WHEN they enable the "I don't know" choice and create the event
- THEN response pages for that event offer all four choices

#### Scenario: Disable "Preferred" while open folds its votes to Available

- GIVEN an open event where an invitee already marked a date Preferred
- WHEN the organizer disables the "Preferred" choice
- THEN response pages stop offering Preferred
- AND the recorded Preferred answer becomes Available and keeps counting in
  results

#### Scenario: Disable "I don't know" while open folds its votes to Unavailable

- GIVEN an open event with "I don't know" enabled where an invitee already
  marked a date "I don't know"
- WHEN the organizer disables the "I don't know" choice
- THEN response pages stop offering "I don't know"
- AND the recorded answer becomes Unavailable and still counts as answered

#### Scenario: Enable "I don't know" on an existing event

- GIVEN an open event created without the "I don't know" choice, with
  answers already recorded
- WHEN the organizer enables the "I don't know" choice
- THEN response pages start offering "I don't know"
- AND every recorded answer is unchanged

#### Scenario: Yes and No cannot be disabled

- GIVEN an organizer editing an event's choice settings
- WHEN the settings render
- THEN Available and Unavailable are not offered as toggles — every event
  always has both
