# event-management Specification

## Purpose

Let an organizer create a scheduling event, seed candidate date options, and
manage the event through a secret organizer link.

## Requirements

### Requirement: Event creation

The system SHALL allow anyone to create an event with a title, a language, a poll
mode, and one or more candidate date options, and SHALL return a secret organizer
link for it.

#### Scenario: Create an event with options

- GIVEN a visitor on the create page
- WHEN they submit a title, a language, a poll mode (assigned or open), and at
  least one date option
- THEN the system creates the event with status "open"
- AND generates an unguessable organizer token and a share token
- AND in assigned mode records the participants they added
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

### Requirement: Reorder date options

The system SHALL let the organizer change the display order of date options while
the event is open, by moving a single option one step up or down and by sorting
all options ascending by date. The chosen order SHALL apply everywhere the
options are listed, including response pages and results.

#### Scenario: Move an option up

- GIVEN an open event with options in the order A, B, C
- WHEN the organizer moves B up
- THEN the options are listed in the order B, A, C for everyone

#### Scenario: Sort options ascending by date

- GIVEN an open event whose options are not in chronological order
- WHEN the organizer sorts the options by date
- THEN the options are listed earliest-first for everyone

### Requirement: Optional start and end time on a date option

A date option MAY have a start time and an end time; both are optional. An end
time MAY only be set when a start time is present, and MUST NOT be before it.

#### Scenario: Date only, no times

- WHEN the organizer adds an option with a date but no start time
- THEN the option is saved with no start or end time

#### Scenario: Start time without end time

- WHEN the organizer adds an option with a start time but no end time
- THEN the option is saved with the start time and no end time

#### Scenario: End time requires a start time

- WHEN the organizer tries to set an end time without a start time
- THEN the system rejects it and no end time is saved

#### Scenario: End time before start time

- WHEN the organizer sets an end time earlier than the start time
- THEN the system rejects it

### Requirement: Close and reopen an event

The system SHALL let the organizer close an event to stop further responses, and
reopen it.

#### Scenario: Closing an event

- GIVEN an open event
- WHEN the organizer closes it
- THEN new and existing invitees can view but not change their responses

### Requirement: Switch mode and language

The system SHALL let the organizer change an event's poll mode and language after
creation, editing them alongside the title and description. Switching mode SHALL
preserve all existing invitees and responses; it only changes how new people
submit.

#### Scenario: Switch assigned to open

- GIVEN an assigned-mode event with invitees and responses
- WHEN the organizer switches it to open mode
- THEN the shared `/s` link becomes the way to submit
- AND all existing invitees and their responses remain and keep counting

#### Scenario: Change language

- GIVEN an event in one language
- WHEN the organizer picks another language
- THEN the dashboard and every response page render in the new language
