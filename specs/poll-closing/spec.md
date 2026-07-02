# poll-closing Specification

## Purpose

Closing a poll records the organizer's decision - one or more of the existing
date options as the final date(s), or an explicit cancellation - and shows that
outcome to everyone who holds a link.

## Requirements

### Requirement: Closing requires a decision

The system SHALL require the organizer, when closing a poll, to select one or
more of the poll's existing date options as the final date(s). The system SHALL
reject a close with zero options selected, or with any option that does not
belong to the poll. Closing SHALL stop further response changes.

#### Scenario: Close with one chosen date

- GIVEN an open poll with date options A, B and C
- WHEN the organizer closes the poll and selects B as the final date
- THEN the poll's status becomes "closed"
- AND B is recorded as the chosen date
- AND invitees can no longer change their responses

#### Scenario: Close with several chosen dates

- GIVEN an open poll with date options A, B and C
- WHEN the organizer closes the poll and selects both B and C
- THEN both B and C are recorded as chosen dates

#### Scenario: Reject a close with no selection

- GIVEN an organizer in the closing flow who has selected no dates
- WHEN they try to confirm the close
- THEN the system rejects it with a validation message
- AND the poll stays open with no chosen dates

#### Scenario: Reject options from another poll

- GIVEN an open poll P and a date option X belonging to a different poll
- WHEN a close request for P names X among the selected options
- THEN the system rejects the request
- AND P stays open with no chosen dates

### Requirement: Cancel a poll

The system SHALL let the organizer close a poll without choosing a date by
cancelling it. A cancelled poll records no chosen dates, its status becomes
"cancelled", and responses are locked exactly as for a closed poll. The
organizer SHALL be asked to confirm before the cancellation takes effect.

#### Scenario: Cancel an open poll

- GIVEN an open poll with responses
- WHEN the organizer cancels it and confirms the warning
- THEN the poll's status becomes "cancelled"
- AND no date option is recorded as chosen
- AND invitees can no longer change their responses

#### Scenario: Dismissing the warning keeps the poll open

- GIVEN an open poll
- WHEN the organizer starts a cancellation but dismisses the warning
- THEN the poll stays open and responses remain editable

### Requirement: Outcome shown to participants

Once a poll is closed with chosen dates, the system SHALL show the chosen
date(s) prominently on the invitee page (`/r`), the shared page (`/s`), and the
organizer dashboard (`/e`), together with a per-date result distribution
(Preferred / Available / Unavailable counts as bars). Participant pages SHALL
show counts only, never which named person chose what. For a cancelled poll,
the system SHALL show a cancelled message instead of chosen dates and
distribution.

#### Scenario: Invitee link on a decided poll

- GIVEN a poll closed with B chosen and several recorded responses
- WHEN an invitee opens their `/r` link
- THEN B is shown prominently as the chosen date
- AND every date option shows its Preferred / Available / Unavailable counts as
  bars
- AND the chosen option is visually marked
- AND no response controls or submit button are shown

#### Scenario: Shared link on a decided poll

- GIVEN an open-mode poll closed with B chosen
- WHEN a visitor opens the `/s` link
- THEN they see the same chosen-date outcome and distribution, with no name
  field or submit button

#### Scenario: Organizer dashboard on a decided poll

- GIVEN a poll closed with B and C chosen
- WHEN the organizer opens the dashboard
- THEN B and C are shown as the chosen dates
- AND their result cards carry a "chosen" mark

#### Scenario: Invitee link on a cancelled poll

- GIVEN a cancelled poll
- WHEN an invitee opens their `/r` link
- THEN a cancelled message is shown
- AND no chosen date and no result distribution are shown
- AND no response controls or submit button are shown

#### Scenario: Poll closed before decisions existed

- GIVEN a poll that was closed before choosing dates became part of closing
  (status "closed", no chosen dates recorded)
- WHEN anyone opens a link to it
- THEN it renders as a plain closed poll: the closed notice, read-only
  responses, and no outcome block

### Requirement: Reopen clears the decision

The system SHALL let the organizer reopen a closed or cancelled poll. Reopening
SHALL discard any recorded chosen dates and restore response editing; closing
again SHALL ask for a fresh selection.

#### Scenario: Reopen a decided poll

- GIVEN a poll closed with B chosen
- WHEN the organizer reopens it
- THEN the poll's status becomes "open"
- AND no date option remains recorded as chosen
- AND invitees can change their responses again

#### Scenario: Reopen a cancelled poll

- GIVEN a cancelled poll
- WHEN the organizer reopens it
- THEN the poll behaves exactly like a reopened closed poll

### Requirement: A closed poll is immutable except for reopening

While a poll is closed or cancelled, the system SHALL reject any change to its
date options, invitees, title, description, language or mode - reopening is the
only permitted mutation. This protects the recorded chosen dates from being
edited or deleted underneath the outcome.

#### Scenario: Server rejects option deletion on a closed poll

- GIVEN a poll closed with B chosen
- WHEN a request tries to delete option B directly (bypassing the UI)
- THEN the system rejects it and B remains the chosen date
