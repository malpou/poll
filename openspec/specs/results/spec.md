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

#### Scenario: Pending, partial, and fully answered badges

- GIVEN one invitee answered every date, one answered some dates, and one none
- WHEN the organizer opens the results view
- THEN each invitee carries a badge distinguishing pending, partially
  answered, and fully answered

#### Scenario: Open-mode respondents

- GIVEN an open-mode event with submissions
- WHEN the organizer opens the results view
- THEN everyone who submitted is listed (read-only), growing as new names arrive

### Requirement: Per-preference breakdown

The system SHALL let the organizer expand a date option's result to see which
named people chose each preference. Names SHALL stay hidden until expanded.

#### Scenario: Expand a result

- GIVEN a date option with recorded responses
- WHEN the organizer expands that option's result
- THEN the names behind each Preferred / Available / Unavailable count are shown

### Requirement: Invitee notes

The system SHALL show an invitee's optional note to the organizer behind a
toggle, hidden by default.

#### Scenario: Show a note

- GIVEN an invitee left a note with their response
- WHEN the organizer opens the note toggle
- THEN the note text is shown

### Requirement: Chase-up for partial responders

While the poll is open, the system SHALL surface invitees who answered only
some of the current date options (e.g. dates added after they responded) in a
callout with their personal response link, so the organizer can chase an
updated answer. Invitees who answered everything or nothing at all SHALL NOT
appear in the callout, and a closed or cancelled poll shows no callout.

#### Scenario: Partial responder in the callout

- GIVEN an invitee who answered before more dates were added
- WHEN the organizer opens the results view
- THEN that invitee is listed in a callout with their copyable `/r` link
- AND fully answered and fully pending invitees are not listed there

#### Scenario: No callout without partial responders

- GIVEN every invitee has either answered everything or nothing
- WHEN the organizer opens the results view
- THEN no chase-up callout is shown

#### Scenario: Open-mode partial responder

- GIVEN an open-mode event where a submitter answered before a date was added
- WHEN the organizer opens the results view
- THEN the callout shows that submitter's personal `/r` link (the participant
  list itself shows no links in open mode)

### Requirement: Best-option highlight

While the poll is open, the system SHALL highlight the option(s) with the
strongest availability, ranking by a weighted net score of
`Preferred×1.2 + Available − Unavailable` (highest wins). Ties on the same score
highlight every matching option. With no responses at all, no option is
highlighted. Once the poll is closed or cancelled, the highlight gives way to
the recorded outcome (see specs/poll-closing).

#### Scenario: A clear winner

- GIVEN one date has zero Unavailable and the most Preferred
- WHEN the organizer opens the results view
- THEN that date is visually highlighted as the recommended choice

#### Scenario: A tie

- GIVEN two dates score equally
- WHEN the organizer opens the results view
- THEN both are highlighted, leaving the final call to the organizer

#### Scenario: No responses, no highlight

- GIVEN an event with no responses at all
- WHEN the organizer opens the results view
- THEN the count bars render but no date is highlighted as best
