# results Specification

## Purpose

Let the organizer see who prefers or can make each date, and identify the best
option.

## Requirements

### Requirement: Per-option summary

The system SHALL show, for each date option, the count of invitees marking it
Preferred, Available, and Unavailable, and SHALL show one overall "who answered"
summary under the results heading.

#### Scenario: View the summary

- GIVEN an event with several responses
- WHEN the organizer opens the results view
- THEN each date option shows its Preferred / Available / Unavailable counts
- AND a single summary under the heading shows how many have answered:
  "X of Y answered" in assigned mode, and "X answered" in open mode (no fixed
  roster, so no denominator)

### Requirement: Response status

The system SHALL show who has answered.

#### Scenario: Outstanding invitees (assigned mode)

- GIVEN some invitees on an assigned-mode event have not responded
- WHEN the organizer opens the results view
- THEN those invitees are listed as pending

#### Scenario: Open-mode respondents

- GIVEN an open-mode event with submissions
- WHEN the organizer opens the results view
- THEN everyone who submitted is listed (read-only), growing as new names arrive

### Requirement: Best-option highlight

The system SHALL highlight the option(s) with the strongest availability, ranking
by a weighted net score of `Preferred×2 + Available − Unavailable` (highest
wins). Ties on the same score highlight every matching option.

#### Scenario: A clear winner

- GIVEN one date has zero Unavailable and the most Preferred
- WHEN the organizer opens the results view
- THEN that date is visually highlighted as the recommended choice

#### Scenario: A tie

- GIVEN two dates score equally
- WHEN the organizer opens the results view
- THEN both are highlighted, leaving the final call to the organizer
