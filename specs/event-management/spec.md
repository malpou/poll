# event-management Specification

## Purpose
Let an organizer create a scheduling event, seed candidate date options, and
manage the event through a secret organizer link.

## Requirements

### Requirement: Event creation
The system SHALL allow anyone to create an event with a title and one or more
candidate date options, and SHALL return a secret organizer link for it.

#### Scenario: Create an event with options
- GIVEN a visitor on the create page
- WHEN they submit a title and at least one date option
- THEN the system creates the event with status "open"
- AND generates an unguessable organizer token
- AND redirects them to the organizer dashboard for that token

#### Scenario: Reject an event with no options
- GIVEN a visitor on the create page
- WHEN they submit with zero date options
- THEN the system rejects the submission with a validation message

### Requirement: Organizer access control
The system SHALL grant management access to an event only when a valid organizer
token is presented.

#### Scenario: Valid organizer token
- GIVEN an event with organizer token T
- WHEN a request loads `/e/T`
- THEN the system shows the management dashboard

#### Scenario: Unknown organizer token
- GIVEN no event has organizer token X
- WHEN a request loads `/e/X`
- THEN the system responds with a not-found page and reveals no event data

### Requirement: Manage date options
The system SHALL let the organizer add, edit, and remove date options while the
event is open.

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

### Requirement: Close and reopen an event
The system SHALL let the organizer close an event to stop further responses, and
reopen it.

#### Scenario: Closing an event
- GIVEN an open event
- WHEN the organizer closes it
- THEN new and existing invitees can view but not change their responses