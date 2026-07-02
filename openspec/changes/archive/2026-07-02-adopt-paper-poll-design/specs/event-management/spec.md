# event-management Delta

## ADDED Requirements

### Requirement: Poll accent color

Each event SHALL have an accent color, one of four: yellow (the default),
pink, green, or blue. The organizer SHALL be able to pick it at creation and
change it afterwards alongside the title and description. Every page of the
event — dashboard, response pages, and the shared open-mode page — SHALL
render with the event's accent color.

#### Scenario: Default accent

- GIVEN a visitor on the create page
- WHEN they create an event without touching the accent picker
- THEN the event is created with the yellow accent

#### Scenario: Pick an accent at creation

- GIVEN a visitor on the create page
- WHEN they pick the pink accent and create the event
- THEN the dashboard and every response page render with the pink accent

#### Scenario: Change the accent from the dashboard

- GIVEN an event with the yellow accent
- WHEN the organizer picks the green accent and saves
- THEN the dashboard and every response page render with the green accent

#### Scenario: Invalid accent rejected

- GIVEN a save request whose accent value is not one of the four colors
- WHEN the system processes it
- THEN it rejects the value and the event keeps its previous accent

## MODIFIED Requirements

### Requirement: Manage date options

The system SHALL let the organizer add, edit, and remove date options while the
event is open. Candidate dates SHALL be chosen by toggling days in a month
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
