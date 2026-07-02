# availability-response Specification

## Purpose

Let a recipient record a preference for each date option - either through their
personal invitee link (assigned mode) or the shared link (open mode, where they
name themselves).

## Requirements

### Requirement: View the response page

The system SHALL show the event's date options to anyone who opens a valid
invitee link, without requiring a login.

#### Scenario: Open a valid link

- GIVEN an invitee with token T on an open event
- WHEN they load `/r/T`
- THEN the system shows the event title and every date option
- AND greets them by their label

#### Scenario: Open an invalid link

- GIVEN no invitee has token X
- WHEN a request loads `/r/X`
- THEN the system shows a friendly "link not found" message and no event data

#### Scenario: Open the shared link (open mode)

- GIVEN an open-mode event with share token S
- WHEN a new visitor loads `/s/S`
- THEN the system shows the event title, a required name field, and every date option
- WHEN they enter a name and submit
- THEN an invitee record is created under that name and their choices are saved
- AND they are shown a personal `/r/{token}` edit link to save
- AND a cookie remembers this browser, so a revisit to `/s/S` edits their answer in place

#### Scenario: Open an invalid shared link

- GIVEN no event has share token Y (or the event is not in open mode)
- WHEN a request loads `/s/Y`
- THEN the system shows a friendly "link not found" message and no event data

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

### Requirement: Edit responses while open

The system SHALL let an invitee change their responses any time before the event
is closed.

#### Scenario: Revisit and change

- GIVEN an invitee who already submitted
- WHEN they reopen their link and change an option
- THEN the updated choice replaces the previous one

#### Scenario: Attempt to change after close

- GIVEN an event that has been closed
- WHEN the invitee reopens their link
- THEN their responses are shown read-only

### Requirement: Dates added after answering

When date options are added after an invitee answered, the system SHALL flag the
unanswered dates on the invitee's response page, sort them first, and open the
page straight into editing. Answering them SHALL clear the flag. A closed or
cancelled poll SHALL never flag or reorder unanswered dates.

#### Scenario: A new date is flagged and sorted first

- GIVEN an invitee who answered when fewer dates existed
- WHEN they reopen their link
- THEN a banner notes the new dates and the page is directly editable
- AND only the unanswered dates carry a "new" badge and render first
- AND after answering them, a revisit shows no banner and the original order

#### Scenario: No flagging on a closed poll

- GIVEN a closed poll where an invitee left dates unanswered
- WHEN they open their link
- THEN no new-date banner or badge is shown and the original order is kept

### Requirement: Rendered in the poll's language

The system SHALL render response pages in the poll's stored language - copy,
date labels, and the page's `lang` attribute - regardless of the visitor's
browser language.

#### Scenario: Poll language wins over browser language

- GIVEN a French-language poll and a visitor with a non-French browser
- WHEN they open a response link
- THEN the page copy and date labels render in French

### Requirement: Times shown in the event's timezone

The system SHALL show date option times in the event's timezone and SHALL tell
respondents which timezone that is whenever any option has a time, naming the
timezone with a zone name localized to the poll's language alongside its
identifier.

#### Scenario: Respondent in another timezone

- GIVEN an event in the America/New_York timezone with an option starting at
  08:00 UTC
- WHEN a respondent opens their link
- THEN the option's time renders as 04:00
- AND the page names the event's timezone with a zone name in the poll's
  language

#### Scenario: No times, no timezone note

- GIVEN an event whose options are date-only
- WHEN a respondent opens their link
- THEN no timezone note is shown

### Requirement: Optional note

The system SHALL let an invitee attach an optional free-text note to their
response.

#### Scenario: Leave a note

- GIVEN an invitee on their response page
- WHEN they add "Can't do mornings" and submit
- THEN the note is saved and visible to the organizer
