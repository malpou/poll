# invitee-links Specification

## Purpose

Give the organizer the right link(s) to distribute: in assigned mode a unique
response link per recipient (one person or a whole group); in open mode a single
shared link anyone can respond through.

## Requirements

### Requirement: Add invitees (assigned mode)

In assigned mode the system SHALL let the organizer add invitees to an event, each
with a display label, and SHALL generate an unguessable token per invitee. Open
mode has no hand-added roster - submitters name themselves through the shared link
(see the availability-response spec).

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

The system SHALL let the organizer view and copy the link(s) to send by their own
means (email, text, etc.): each invitee's personal link in assigned mode, or the
one shared link in open mode.

#### Scenario: Copy a personal link (assigned mode)

- GIVEN an assigned-mode invitee exists
- WHEN the organizer copies the invitee's link
- THEN the full absolute `/r/{token}` URL is placed on the clipboard

#### Scenario: Copy the shared link (open mode)

- GIVEN an open-mode event
- WHEN the organizer copies the shared link (shown prominently at the top of the
  dashboard, distinct from the private organizer link)
- THEN the full absolute `/s/{share_token}` URL is placed on the clipboard

### Requirement: Rename and remove invitees (assigned mode)

In assigned mode the system SHALL let the organizer rename or remove an invitee
while the event is open. In open mode the roster is read-only (submitters name
themselves), so there is no rename/remove.

#### Scenario: Rename an invitee

- GIVEN an invitee labeled "Anna"
- WHEN the organizer renames them to "Anna B."
- THEN the new label persists and shows everywhere the invitee is listed

#### Scenario: Remove an invitee

- GIVEN an invitee with recorded responses
- WHEN the organizer removes them
- THEN the invitee, their token, and their responses are deleted
- AND their link stops working

#### Scenario: Open mode rejects roster changes server-side

- GIVEN an open-mode event
- WHEN a request tries to add, rename, or remove an invitee directly
  (bypassing the UI)
- THEN the system rejects it and the roster is unchanged
