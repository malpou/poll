# availability-response Specification

## Purpose

Let a recipient record a preference for each date option - either through their
personal invitee link (assigned mode) or the shared link (open mode, where they
name themselves).

## Requirements

### Requirement: View the response page

The system SHALL show the event's date options to anyone who opens a valid
invitee link, without requiring a login.

#### Scenario: Open a valid link

- GIVEN an invitee with token T on an open event
- WHEN they load `/r/T`
- THEN the system shows the event title and every date option
- AND greets them by their label

#### Scenario: Open an invalid link

- GIVEN no invitee has token X
- WHEN a request loads `/r/X`
- THEN the system shows a friendly "link not found" message and no event data

#### Scenario: Open the shared link (open mode)

- GIVEN an open-mode event with share token S
- WHEN a new visitor loads `/s/S`
- THEN the system shows the event title, a required name field, and every date option
- WHEN they enter a name and submit
- THEN an invitee record is created under that name and their choices are saved
- AND they are shown a personal `/r/{token}` edit link to save
- AND a cookie remembers this browser, so a revisit to `/s/S` edits their answer in place

#### Scenario: Open an invalid shared link

- GIVEN no event has share token Y (or the event is not in open mode)
- WHEN a request loads `/s/Y`
- THEN the system shows a friendly "link not found" message and no event data

### Requirement: Record preferences

The system SHALL let an invitee mark each date option as Preferred, Available, or
Unavailable, and SHALL persist the choices.

#### Scenario: Submit preferences

- GIVEN an invitee viewing their options
- WHEN they mark each option and submit
- THEN each choice is saved against their invitee record
- AND a confirmation is shown

#### Scenario: Leave an option unmarked

- GIVEN an invitee who marks some dates but leaves others unmarked
- WHEN they submit
- THEN only the marked dates are saved
- AND unmarked dates remain "no answer" (shown to the organizer as not-yet-answered
  for that date), never silently defaulted to "unavailable"

### Requirement: Edit responses while open

The system SHALL let an invitee change their responses any time before the event
is closed.

#### Scenario: Revisit and change

- GIVEN an invitee who already submitted
- WHEN they reopen their link and change an option
- THEN the updated choice replaces the previous one

#### Scenario: Attempt to change after close

- GIVEN an event that has been closed
- WHEN the invitee reopens their link
- THEN their responses are shown read-only

### Requirement: Optional note

The system SHALL let an invitee attach an optional free-text note to their
response.

#### Scenario: Leave a note

- GIVEN an invitee on their response page
- WHEN they add "Can't do mornings" and submit
- THEN the note is saved and visible to the organizer
