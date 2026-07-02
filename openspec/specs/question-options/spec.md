# question-options Specification

## Purpose

A second poll type alongside candidate dates: the organizer asks a free-form
question (carried by the poll's title and description) with two or more
free-form text options. Participants answer through the same links and choice
scale; results, closing, and reopening work as on a dates poll. This spec
covers everything question-specific: the type choice at creation, managing
text options, rendering options as text, absent date affordances, and
question wording.

## Requirements

### Requirement: Poll type chosen at creation

The system SHALL let the creator choose a poll type at creation: **dates**
(the default — candidate date options) or **question** — a
free-form question, carried by the poll's title and description, with two or
more free-form text options. A question poll SHALL be rejected with a
validation message when fewer than two non-empty text options are submitted;
blank option texts SHALL NOT count toward the minimum.

#### Scenario: Create a question poll

- GIVEN a visitor on the create page
- WHEN they pick the question type, enter a title, and add two text options
- AND submit the form
- THEN the system creates the event with status "open"
- AND generates an unguessable organizer token and a share token
- AND redirects them to the organizer dashboard showing both options as text

#### Scenario: Type defaults to dates

- GIVEN a visitor on the create page
- WHEN they create an event without touching the type choice
- THEN the event is a dates poll and behaves exactly as before

#### Scenario: Reject a question poll with fewer than two options

- GIVEN a visitor creating a question poll
- WHEN they submit with one text option, or with two options where one is
  only whitespace
- THEN the system rejects the submission with a validation message

### Requirement: Poll type is immutable

A poll's type SHALL be fixed at creation. The dashboard SHALL offer no way to
change it, and the system SHALL reject any request that attempts to change it.

#### Scenario: No type switch on the dashboard

- GIVEN an organizer on the dashboard of a question poll
- WHEN the settings render
- THEN mode and language are editable but no poll-type control is offered

#### Scenario: Crafted type change is rejected

- GIVEN a question poll
- WHEN a crafted request tries to change its type (bypassing the UI)
- THEN the system rejects it and the poll remains a question poll

### Requirement: Manage question options

On a question poll, the system SHALL let the organizer add, edit, remove, and
reorder text options while the poll is open. An edit or addition with empty
text SHALL be rejected. Removing an option that has recorded responses SHALL
warn the organizer before deleting the option and its responses. Options
added after an invitee answered SHALL be flagged for that invitee exactly as
newly added dates are on a dates poll.

#### Scenario: Edit an option's text

- GIVEN an open question poll with responses
- WHEN the organizer changes an option's text and saves
- THEN the new text renders on the dashboard, response pages, and results
- AND existing responses for that option are kept

#### Scenario: Empty option text rejected

- GIVEN an organizer editing a question option
- WHEN they save with only whitespace
- THEN the system rejects it and the old text is kept

#### Scenario: Remove an option that has responses

- GIVEN a question option with recorded responses
- WHEN the organizer removes it
- THEN the organizer is warned before the deletion is confirmed
- AND the option and its responses are deleted

#### Scenario: Add an option after invitees answered

- GIVEN an open question poll where an invitee already answered
- WHEN the organizer adds a new text option
- THEN the invitee's response page flags the new option and opens into
  editing, as for a newly added date on a dates poll

#### Scenario: Move an option up

- GIVEN an open question poll with options in the order A, B, C
- WHEN the organizer moves B up
- THEN the options are listed in the order B, A, C for everyone

### Requirement: Question polls carry no date affordances

A question poll SHALL offer no calendar, no time slots, no timezone setting,
no timezone note on response pages, and no sort-by-date action. Its options
are entered and edited as plain text.

#### Scenario: Create form swaps date affordances for text options

- GIVEN a visitor on the create page
- WHEN they pick the question type
- THEN the options section offers free-form text entry instead of the month
  calendar
- AND no timezone picker is shown

#### Scenario: Dashboard of a question poll hides date tools

- GIVEN an organizer on the dashboard of a question poll
- WHEN the page renders
- THEN no timezone setting and no sort-by-date action are offered
- AND options are edited as text, with no date or time fields

### Requirement: Question options render as their text everywhere

A question poll SHALL render each option as its text everywhere a dates poll
renders an option as weekday, date, and time: on response pages (`/r` and
`/s`), on the organizer's results, and in the closed poll's outcome.

#### Scenario: Response page lists the option texts

- GIVEN a question poll with options "Pizza" and "Sushi"
- WHEN an invitee opens their response link
- THEN both options render as their text, each offering the poll's enabled
  choices

#### Scenario: Closed question poll shows the chosen option's text

- GIVEN a question poll closed with one option chosen
- WHEN anyone opens a link to it
- THEN the chosen option's text is shown prominently as the outcome
- AND each option shows its per-choice count distribution

### Requirement: Question-poll wording

The system SHALL render question polls with question wording wherever a
dates poll's copy names dates: the response scale's choice labels, section
headings, the response prompt, chosen-outcome headings, and new-option
notices. The Available and Unavailable choices SHALL be labeled in
works-for-me / doesn't-work terms. All such copy SHALL render in the poll's
language, and dates polls SHALL keep their current wording.

#### Scenario: Choice labels read in question wording

- GIVEN a question poll
- WHEN an invitee opens their response link
- THEN the choice controls are labeled with the question-poll wording, in the
  poll's language, not the date wording

#### Scenario: Dates polls keep date wording

- GIVEN a dates poll
- WHEN an invitee opens their response link
- THEN the choice controls and page copy read exactly as before this change
