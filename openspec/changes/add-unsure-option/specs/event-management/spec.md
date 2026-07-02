# event-management — delta for add-unsure-option

## ADDED Requirements

### Requirement: Configurable response choices

Every event SHALL offer the Available and Unavailable choices. The organizer
SHALL be able to enable or disable the "Preferred" choice (enabled by
default) and the "I don't know" choice (disabled by default), both at
creation and while the event is open. Disabling a choice SHALL keep
already-recorded answers with that choice; it only stops being offered for
new or changed answers.

#### Scenario: Defaults at creation

- GIVEN a visitor on the create page
- WHEN they create an event without touching the choice settings
- THEN the event offers Preferred, Available, and Unavailable
- AND does not offer "I don't know"

#### Scenario: Enable "I don't know" at creation

- GIVEN a visitor on the create page
- WHEN they enable the "I don't know" choice and create the event
- THEN response pages for that event offer all four choices

#### Scenario: Disable "Preferred" while open

- GIVEN an open event where an invitee already marked a date Preferred
- WHEN the organizer disables the "Preferred" choice
- THEN response pages stop offering Preferred
- AND the recorded Preferred answer remains stored and keeps counting in
  results

#### Scenario: Yes and No cannot be disabled

- GIVEN an organizer editing an event's choice settings
- WHEN the settings render
- THEN Available and Unavailable are not offered as toggles — every event
  always has both
