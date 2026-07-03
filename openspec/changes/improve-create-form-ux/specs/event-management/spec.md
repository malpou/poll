## MODIFIED Requirements

### Requirement: Event creation

The system SHALL allow anyone to create an event with a title, a language, a
poll mode, and a poll type — dates (the default), question (see
specs/question-options), or RSVP (see specs/rsvp-poll) — and SHALL return a
secret organizer link for it. The poll type choice SHALL come before every
other field on the create page, and the page SHALL show exactly one explainer
for the picked type — a short hint attached to the type choice, not a
separate introductory paragraph repeating it. The poll mode SHALL default to
open ("anyone with the link"); assigned mode ("named people") is the opt-in
alternative.

A dates-type event SHALL additionally require a timezone and one or more
candidate date options; an RSVP event requires a timezone and its single date
(see specs/rsvp-poll). The timezone SHALL default to the visitor's own
timezone and start collapsed: instead of a picker, the form shows a short
note naming the pre-picked zone with an affordance to change it. Activating
the affordance SHALL reveal the timezone picker; picking a different zone
SHALL update the note and collapse the picker again after a short delay. The
revealed picker SHALL label each timezone with its identifier plus a zone
name localized to the form's current language, and SHALL be a combo box: an
editable text field whose suggestion list narrows to the timezones matching
the typed text, and only a real timezone can end up selected — text matching
no timezone reverts to the previously selected zone.

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
- WHEN a submission with zero date options reaches the server
- THEN the system rejects it with a validation message

#### Scenario: Poll type is chosen first with a single explainer

- GIVEN a visitor on the create page
- WHEN the page renders, whichever of the three poll types is picked
- THEN the poll type choice appears before every other field
- AND exactly one explainer for the picked type is shown

#### Scenario: Poll mode defaults to anyone with the link

- GIVEN a visitor on the create page
- WHEN they create an event without touching the poll mode choice
- THEN the event is created in open mode

#### Scenario: Timezone starts collapsed on the visitor's zone

- GIVEN a visitor on the create page with a dates or RSVP type picked
- WHEN the page renders
- THEN no timezone picker is shown — only a note naming the visitor's own
  timezone as pre-picked, with an affordance to change it

#### Scenario: Changing the timezone collapses the picker again

- GIVEN a visitor who activated the change-timezone affordance
- WHEN they pick a different timezone
- THEN the note updates to the new zone
- AND the picker collapses again shortly after
- AND submitting creates the event in that timezone

#### Scenario: Language picker previews the create form live

- GIVEN a visitor on the create page
- WHEN they pick another language
- THEN the whole form re-renders in that language without a reload
- AND the browser tab title follows the picked language

#### Scenario: Timezone picker labels follow the picked language

- GIVEN a visitor on the create page who revealed the timezone picker
- WHEN they pick a non-English language
- THEN each timezone option shows its identifier together with a zone name in
  that language

#### Scenario: Choose a timezone by typing

- GIVEN a visitor on the create page who revealed the timezone picker
- WHEN they type part of a timezone's label into the picker and pick the
  matching suggestion
- AND submit the form
- THEN the event is created in that timezone

#### Scenario: Text matching no timezone reverts

- GIVEN a visitor who revealed the timezone picker and typed text matching no
  timezone
- WHEN they leave the timezone field
- THEN the picker reverts to the previously selected timezone

### Requirement: Configurable response choices

Every event SHALL offer the Available and Unavailable choices, and the choice
settings SHALL state that these two are always included. On dates and
question polls the organizer SHALL be able to enable or disable the
"Preferred" choice and the "I don't know" choice — both disabled by default —
both at creation and while the event is open, including events that already
have recorded answers. RSVP polls offer exactly yes and no; the choice
toggles do not apply to them (see specs/rsvp-poll). Disabling a choice SHALL
fold its already-recorded answers into the fixed pair: Preferred answers
become Available, "I don't know" answers become Unavailable. Folded answers
still count as answered. Re-enabling a choice offers it again but SHALL NOT
restore folded answers.

#### Scenario: Defaults at creation

- GIVEN a visitor on the create page
- WHEN they create an event without touching the choice settings
- THEN the event offers exactly Available and Unavailable
- AND does not offer Preferred or "I don't know"

#### Scenario: Enable "I don't know" at creation

- GIVEN a visitor on the create page
- WHEN they enable the "I don't know" choice and create the event
- THEN response pages for that event offer "I don't know" alongside the fixed
  pair

#### Scenario: Disable "Preferred" while open folds its votes to Available

- GIVEN an open event with "Preferred" enabled where an invitee already
  marked a date Preferred
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

## ADDED Requirements

### Requirement: Create form submit gating

The create page SHALL disable submission while the form would fail
validation for the picked poll type — an empty title, a dates poll with no
date options, a question poll with fewer than two options, or an RSVP poll
without its date — and SHALL enable it once the form is valid. Server-side
validation still applies to whatever reaches it.

#### Scenario: Submit disabled until the form is valid

- GIVEN a visitor on the create page with an empty title
- WHEN the page renders
- THEN the submit control is disabled
- AND it stays disabled after they enter a title but no date option
- AND it becomes enabled once a title and a date option are both present

#### Scenario: Gating follows the picked poll type

- GIVEN a visitor with a title and one date option on a dates poll
- WHEN they switch the poll type to question with no options added
- THEN the submit control is disabled until at least two question options
  exist
