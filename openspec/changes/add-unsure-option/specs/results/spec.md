# results — delta for add-unsure-option

## MODIFIED Requirements

### Requirement: Per-option summary

The system SHALL show, for each date option, the count of invitees choosing
each of the event's enabled choices, plus any disabled choice that still has
recorded answers, and SHALL show one overall "who answered" summary under
the results heading. An "I don't know" answer counts as having answered.

#### Scenario: View the summary

- GIVEN an event with several responses
- WHEN the organizer opens the results view
- THEN each date option shows a count per enabled choice
- AND a single summary under the heading shows how many have answered:
  "X of Y answered" in assigned mode, and "X answered" in open mode (no fixed
  roster, so no denominator)

#### Scenario: An all-unsure respondent counts as answered

- GIVEN an event with "I don't know" enabled and an invitee who marked every
  date "I don't know"
- WHEN the organizer opens the results view
- THEN that invitee is counted as answered and carries the fully-answered
  badge, not pending or partial

#### Scenario: A since-disabled choice with answers stays visible

- GIVEN an event where a date was marked Preferred before the organizer
  disabled the Preferred choice
- WHEN the organizer opens the results view
- THEN that date still shows its Preferred count

### Requirement: Per-preference breakdown

The system SHALL let the organizer expand a date option's result to see which
named people chose each preference. Names SHALL stay hidden until expanded.

#### Scenario: Expand a result

- GIVEN a date option with recorded responses, including "I don't know"
- WHEN the organizer expands that option's result
- THEN the names behind each shown choice's count are listed, "I don't know"
  included

### Requirement: Best-option highlight

While the poll is open, the system SHALL highlight the option(s) with the
strongest availability, ranking by a weighted net score of
`Preferred×1.2 + Available − Unavailable` (highest wins). "I don't know"
answers carry no weight and SHALL NOT affect the score. Ties on the same score
highlight every matching option. With no responses at all, no option is
highlighted. Once the poll is closed or cancelled, the highlight gives way to
the recorded outcome (see specs/poll-closing).

#### Scenario: A clear winner

- GIVEN one date has zero Unavailable and the most Preferred
- WHEN the organizer opens the results view
- THEN that date is visually highlighted as the recommended choice

#### Scenario: "I don't know" does not sway the ranking

- GIVEN two dates with identical Preferred / Available / Unavailable counts,
  where one also has several "I don't know" answers
- WHEN the organizer opens the results view
- THEN both dates score equally and both are highlighted

#### Scenario: A tie

- GIVEN two dates score equally
- WHEN the organizer opens the results view
- THEN both are highlighted, leaving the final call to the organizer

#### Scenario: No responses, no highlight

- GIVEN an event with no responses at all
- WHEN the organizer opens the results view
- THEN the count bars render but no date is highlighted as best
