# results Specification

## Purpose

Let the organizer see who prefers or can make each date, and identify the best
option.

## Requirements

### Requirement: Per-option summary

The system SHALL show, for each date option, the count of invitees marking it
Preferred, Available, and Unavailable, plus how many have not answered that date.

#### Scenario: View the summary

- GIVEN an event with several responses
- WHEN the organizer opens the results view
- THEN each date option shows its Preferred / Available / Unavailable counts

### Requirement: Response status

The system SHALL show which invitees have responded and which have not.

#### Scenario: Outstanding invitees

- GIVEN some invitees have not responded
- WHEN the organizer opens the results view
- THEN those invitees are listed as pending

### Requirement: Best-option highlight

The system SHALL highlight the option(s) with the strongest availability, ranking
by fewest Unavailable, then most Preferred.

#### Scenario: A clear winner

- GIVEN one date has zero Unavailable and the most Preferred
- WHEN the organizer opens the results view
- THEN that date is visually highlighted as the recommended choice

#### Scenario: A tie

- GIVEN two dates score equally
- WHEN the organizer opens the results view
- THEN both are highlighted, leaving the final call to the organizer
