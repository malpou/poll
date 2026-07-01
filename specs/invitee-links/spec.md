# invitee-links Specification

## Purpose
Give the organizer a unique response link for each recipient, where a recipient
may be one person or a whole group.

## Requirements

### Requirement: Add invitees
The system SHALL let the organizer add invitees to an event, each with a display
label, and SHALL generate an unguessable token per invitee.

#### Scenario: Add an individual invitee
- GIVEN an organizer on the dashboard
- WHEN they add an invitee labeled "Grandma"
- THEN the system creates the invitee with a unique token
- AND shows the copyable link `/r/{token}`

#### Scenario: Add a group invitee
- GIVEN an organizer on the dashboard
- WHEN they add an invitee labeled "The Smiths (Ann + Bob)"
- THEN the system creates one invitee with one link
- AND that link's responses count as a single response set

### Requirement: Distribute links
The system SHALL let the organizer view and copy each invitee's link for sending
by their own means (email, text, etc.).

#### Scenario: Copy a link
- GIVEN an invitee exists
- WHEN the organizer copies the invitee's link
- THEN the full absolute URL is placed on the clipboard

### Requirement: Rename and remove invitees
The system SHALL let the organizer rename or remove an invitee while the event is
open.

#### Scenario: Remove an invitee
- GIVEN an invitee with recorded responses
- WHEN the organizer removes them
- THEN the invitee, their token, and their responses are deleted
- AND their link stops working