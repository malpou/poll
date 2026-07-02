# results Delta

## MODIFIED Requirements

### Requirement: Per-option summary

For a date poll, the system SHALL show, for each date option, the count of
invitees choosing each of the event's enabled choices, and SHALL show one
overall "who answered" summary under the results heading. An "I don't know"
answer counts as having answered. Only enabled choices appear — disabling a
choice folds its recorded answers into Available or Unavailable (see
event-management). An RSVP poll shows a headcount instead (see rsvp-poll).

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

#### Scenario: Disabling a choice folds its counts into the fixed pair

- GIVEN an event where a date was marked Preferred before the organizer
  disabled the Preferred choice
- WHEN the organizer opens the results view
- THEN no Preferred count is shown and that answer counts as Available

### Requirement: Best-option highlight

While a date poll is open, the system SHALL highlight the option(s) with the
strongest availability, ranking by a weighted net score of
`Preferred×1.2 + Available − Unavailable` (highest wins). "I don't know"
answers carry no weight and SHALL NOT affect the score. Ties on the same score
highlight every matching option. With no availability answers at all
(Preferred/Available/Unavailable — "I don't know" alone does not count), no
option is highlighted. An RSVP poll has a single date, so no best-option
highlight is shown on it. Once the poll is closed or cancelled, the highlight
gives way to the recorded outcome (see specs/poll-closing).

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
