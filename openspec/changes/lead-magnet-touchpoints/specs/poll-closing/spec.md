# poll-closing Delta

## MODIFIED Requirements

### Requirement: Outcome shown to participants

Once a poll is closed with chosen dates, the system SHALL show the chosen
date(s) prominently on the invitee page (`/r`), the shared page (`/s`) —
regardless of poll mode — and the organizer dashboard (`/e`), together with a
per-date result distribution (Preferred / Available / Unavailable counts as
bars). A confirmed RSVP poll shows its date and the final headcount instead
(see specs/rsvp-poll). Participant pages SHALL show counts only, never which
named person chose what. For a cancelled poll, the system SHALL show a
cancelled message instead of chosen dates and distribution. An assigned-mode
poll's shared page SHALL serve only this decided outcome: while the poll is
open or cancelled it SHALL remain not-found.

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

#### Scenario: Shared link on a decided assigned-mode poll

- GIVEN an assigned-mode poll closed with B chosen
- WHEN a visitor opens the `/s` link
- THEN they see the chosen-date outcome and distribution, counts only,
  with no response controls

#### Scenario: Shared link on an open assigned-mode poll stays hidden

- GIVEN an assigned-mode poll that is still open
- WHEN its `/s` link is opened
- THEN a not-found page is shown and no event data is revealed

#### Scenario: Shared link on a cancelled assigned-mode poll stays hidden

- GIVEN a cancelled assigned-mode poll
- WHEN its `/s` link is opened
- THEN a not-found page is shown and no event data is revealed

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

## ADDED Requirements

### Requirement: Organizer can share the result

A decided poll's organizer dashboard SHALL offer an action, in the poll's
language, that copies the poll's shared result link for passing on to the
group. The action SHALL NOT be offered while the poll is open or after it
was cancelled.

#### Scenario: Copy the result link

- GIVEN a decided poll's organizer dashboard
- WHEN the organizer uses the share-the-result action
- THEN the poll's shared link is on the clipboard

#### Scenario: No share action on a cancelled poll

- GIVEN a cancelled poll's organizer dashboard
- WHEN the dashboard is shown
- THEN no share-the-result action is offered
