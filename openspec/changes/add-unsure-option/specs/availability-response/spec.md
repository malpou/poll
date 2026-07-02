# availability-response — delta for add-unsure-option

## MODIFIED Requirements

### Requirement: Record preferences

The system SHALL let an invitee mark each date option with one of the event's
enabled choices — always Available and Unavailable, plus Preferred and
"I don't know" when the event enables them — and SHALL persist the choices.
An "I don't know" answer counts as answering that date. A submission
carrying a choice the event does not offer SHALL be rejected.

#### Scenario: Submit preferences

- GIVEN an invitee viewing their options
- WHEN they mark each option and submit
- THEN each choice is saved against their invitee record
- AND a confirmation is shown

#### Scenario: Only enabled choices are offered

- GIVEN an event with "I don't know" enabled and "Preferred" disabled
- WHEN an invitee opens their response page
- THEN each date offers Available, Unavailable, and "I don't know"
- AND no Preferred choice is shown

#### Scenario: "I don't know" satisfies the submit gate

- GIVEN an event with "I don't know" enabled
- WHEN an invitee marks some dates "I don't know", the rest with other
  choices, and submits
- THEN the submission succeeds and the "I don't know" choices are saved like
  any other

#### Scenario: A disabled choice is rejected server-side

- GIVEN an event that does not offer "I don't know"
- WHEN a crafted request submits "I don't know" for a date
- THEN the system rejects that choice and stores nothing for it

#### Scenario: Submit requires answering every date

- GIVEN an invitee who marks some dates but leaves others unmarked
- WHEN they view the submit button
- THEN it is disabled until every date has an answer

#### Scenario: A partial submission saves only the marked dates

- GIVEN a submission that reaches the server with some dates unmarked (e.g. a
  crafted or scripted request)
- WHEN it is processed
- THEN only the marked dates are saved
- AND unmarked dates remain "no answer" (shown to the organizer as not-yet-answered
  for that date), never silently defaulted to "unavailable"
