# event-management — delta for add-unsure-option

## ADDED Requirements

### Requirement: Configurable response choices

Every event SHALL offer the Available and Unavailable choices. The organizer
SHALL be able to enable or disable the "Preferred" choice (enabled by
default) and the "I don't know" choice (disabled by default), both at
creation and while the event is open — including events that already have
recorded answers. Disabling a choice SHALL fold its already-recorded answers
into the fixed pair: Preferred answers become Available, "I don't know"
answers become Unavailable. Folded answers still count as answered.
Re-enabling a choice offers it again but SHALL NOT restore folded answers.

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
