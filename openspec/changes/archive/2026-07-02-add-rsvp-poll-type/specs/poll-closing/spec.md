# poll-closing Delta

## MODIFIED Requirements

### Requirement: Closing requires a decision

The system SHALL require the organizer, when closing a date poll, to select
one or more of the poll's existing date options as the final date(s). The
system SHALL reject a close with zero options selected, or with any option
that does not belong to the poll. Closing SHALL stop further response
changes. Closing an RSVP poll asks for no selection — it is a confirm or
call-off (see rsvp-poll).

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

### Requirement: Outcome shown to participants

Once a date poll is closed with chosen dates, the system SHALL show the chosen
date(s) prominently on the invitee page (`/r`), the shared page (`/s`), and the
organizer dashboard (`/e`), together with a per-date result distribution
(Preferred / Available / Unavailable counts as bars). A confirmed RSVP poll
shows its date and the final headcount instead (see rsvp-poll). Participant
pages SHALL show counts only, never which named person chose what. For a
cancelled poll, the system SHALL show a cancelled message instead of chosen
dates and distribution.

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
