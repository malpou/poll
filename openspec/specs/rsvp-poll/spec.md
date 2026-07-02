# rsvp-poll Specification

## Purpose

The RSVP poll type end-to-end: the organizer already knows the date and only
needs a headcount. One fixed date/time, each participant answers yes or no,
and closing is a confirm-or-call-off with no date to pick.

## Requirements

### Requirement: Create an RSVP poll

The create page SHALL offer a poll type choice — date poll (the default) or
RSVP. An RSVP poll SHALL be created like a date poll (title, description,
language, timezone, poll mode, accent) but with exactly one date, which MAY
carry an optional start time and, only with a start, an optional end time.
The system SHALL reject an RSVP creation with zero or more than one date
option. An RSVP poll SHALL offer respondents exactly two choices — yes and
no; the Preferred and "I don't know" toggles SHALL NOT be offered for it.

#### Scenario: Create an RSVP event

- GIVEN a visitor on the create page
- WHEN they pick the RSVP type, fill in a title, and pick one date with a
  start time
- THEN the event is created open with that single date/time
- AND they are redirected to the organizer dashboard

#### Scenario: Reject an RSVP with more than one date

- GIVEN a crafted creation request of RSVP type carrying two date options
- WHEN the system processes it
- THEN it rejects the submission and no event is created

#### Scenario: No choice toggles on an RSVP

- GIVEN a visitor on the create page who picked the RSVP type
- WHEN the form renders
- THEN the Preferred and "I don't know" toggles are not offered

### Requirement: Answer yes or no

Response pages for an RSVP poll SHALL show the event's single date/time and
offer exactly two answers, rendered as yes ("I'm coming") and no — in both
assigned mode (`/r`) and open mode (`/s`, naming yourself). The optional note
SHALL remain available. A submission carrying any other choice SHALL be
rejected.

#### Scenario: Answer yes through an invitee link

- GIVEN an invitee on an open RSVP poll
- WHEN they open their `/r` link, pick yes, and submit
- THEN the answer is saved and a confirmation is shown

#### Scenario: Answer through the shared link

- GIVEN an open-mode RSVP poll with share token S
- WHEN a visitor loads `/s/S`, enters their name, picks no, and submits
- THEN an invitee record is created with that answer
- AND they are shown a personal `/r` edit link

#### Scenario: Another choice is rejected server-side

- GIVEN an RSVP poll
- WHEN a crafted request submits a choice other than yes or no
- THEN the system rejects it and stores nothing

### Requirement: Organizer headcount

For an RSVP poll, the organizer dashboard SHALL show a headcount instead of
the per-date results matrix: how many are coming, how many are not, and who
has not answered — with each respondent's name marked by their answer. In
assigned mode the answered summary SHALL read "X of Y"; in open mode it
SHALL show counts only, growing as submissions arrive. Names SHALL stay with
the organizer; participant-facing views show counts only.

#### Scenario: Headcount in assigned mode

- GIVEN an assigned-mode RSVP poll where one invitee answered yes, one
  answered no, and one has not answered
- WHEN the organizer opens the dashboard
- THEN it shows one coming, one not coming, and the third listed as pending
- AND the summary reads "2 of 3 answered"

#### Scenario: Headcount in open mode

- GIVEN an open-mode RSVP poll with two yes submissions
- WHEN the organizer opens the dashboard
- THEN it shows two coming with their names and no pending denominator

### Requirement: Move the event's date

The system SHALL let the organizer of an RSVP poll change its single
date/time while the poll is open, and SHALL reject adding or removing date
options on an RSVP poll.

#### Scenario: Change the date

- GIVEN an open RSVP poll with recorded answers
- WHEN the organizer changes the date's start time and saves
- THEN every page shows the new time and all answers are kept

#### Scenario: Adding a second date is rejected

- GIVEN an open RSVP poll
- WHEN a request tries to add another date option to it
- THEN the system rejects it and the poll keeps its single date

### Requirement: Confirm or call off

Closing an RSVP poll SHALL NOT ask for a date selection. The organizer SHALL
either confirm the event — recording its single date as chosen, freezing
answers — or cancel it (called off), with the existing cancel confirmation.
Once confirmed, all links SHALL show the event as happening at its date/time
together with the final headcount as counts only; a cancelled RSVP SHALL
show a called-off message. Reopening SHALL restore answering, as for date
polls.

#### Scenario: Confirm the event

- GIVEN an open RSVP poll with answers
- WHEN the organizer confirms the event
- THEN the poll closes with its single date recorded as chosen
- AND answers can no longer be changed

#### Scenario: Invitee sees the confirmed outcome

- GIVEN a confirmed RSVP poll
- WHEN an invitee opens their `/r` link
- THEN the event's date/time is shown prominently as happening
- AND the final headcount is shown as counts only, no names
- AND no answer controls are shown

#### Scenario: Called off

- GIVEN an open RSVP poll
- WHEN the organizer cancels it and confirms the warning
- THEN every link shows a called-off message with no headcount

#### Scenario: Reopen an RSVP poll

- GIVEN a confirmed RSVP poll
- WHEN the organizer reopens it
- THEN the chosen date is cleared, the poll is open, and answers are
  editable again
