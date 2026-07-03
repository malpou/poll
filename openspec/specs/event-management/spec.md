# event-management Specification

## Purpose

Let an organizer create a scheduling event, seed candidate date options, and
manage the event through a secret organizer link.

## Requirements

### Requirement: Event creation

The system SHALL allow anyone to create an event with a title, a language, a
poll mode, and a poll type — dates (the default), question (see
specs/question-options), or RSVP (see specs/rsvp-poll) — and SHALL return a
secret organizer link for it. A dates-type event SHALL additionally require a
timezone and one or more candidate date options. The timezone picker SHALL default to the visitor's
own timezone, and SHALL label each timezone with its identifier plus a zone
name localized to the form's current language. The timezone picker SHALL be a
combo box: an editable text field whose suggestion list narrows to the
timezones matching the typed text, and only a real timezone can end up
selected — text matching no timezone reverts to the previously selected zone.

#### Scenario: Create an event with options

- GIVEN a visitor on the create page
- WHEN they submit a title, a language, a timezone, a poll mode (assigned or
  open), and at least one date option
- THEN the system creates the event with status "open"
- AND generates an unguessable organizer token and a share token
- AND in assigned mode records the participants they added
- AND redirects them to the organizer dashboard for that token

#### Scenario: Reject an event with no options

- GIVEN a visitor on the create page
- WHEN they submit with zero date options
- THEN the system rejects the submission with a validation message

#### Scenario: Language picker previews the create form live

- GIVEN a visitor on the create page
- WHEN they pick another language
- THEN the whole form re-renders in that language without a reload
- AND the browser tab title follows the picked language

#### Scenario: Timezone picker labels follow the picked language

- GIVEN a visitor on the create page
- WHEN they pick a non-English language
- THEN each timezone option shows its identifier together with a zone name in
  that language

#### Scenario: Choose a timezone by typing

- GIVEN a visitor on the create page
- WHEN they type part of a timezone's label into the timezone picker and pick
  the matching suggestion
- AND submit the form
- THEN the event is created in that timezone

#### Scenario: Text matching no timezone reverts

- GIVEN a visitor on the create page who typed text matching no timezone
- WHEN they leave the timezone field
- THEN the picker reverts to the previously selected timezone

### Requirement: Browser language hint on the create page

When the browser's preferred language is a supported language other than the
create form's current language, the create page SHALL show a dismissible
hint, written in the browser's language, offering to use that language for
the poll. Picking the hint SHALL flip the form's language picker to that
language in place, without a reload, and the hint SHALL disappear once the
form's language matches the browser's. Dismissing the hint SHALL keep it
hidden for the rest of the visit.

#### Scenario: Hint applies the browser language to the form

- GIVEN a browser preferring Danish
- WHEN it opens the English create page and the visitor picks the hint
- THEN the form re-renders in Danish without a reload
- AND the language picker shows Danish selected
- AND the hint disappears

#### Scenario: Dismissed create hint stays away

- GIVEN a visitor who dismissed the language hint on the create page
- WHEN they load the create page again in the same visit
- THEN the hint is not shown

### Requirement: Organizer access control

The system SHALL grant management access to an event only when a valid organizer
token is presented.

#### Scenario: Valid organizer token

- GIVEN an event with organizer token T
- WHEN a request loads `/e/T`
- THEN the system shows the management dashboard

#### Scenario: Unknown organizer token

- GIVEN no event has organizer token X
- WHEN a request loads `/e/X`
- THEN the system responds with a not-found page and reveals no event data

#### Scenario: Organizer link surfaced with a save warning

- GIVEN an organizer on the dashboard
- WHEN the page renders
- THEN a banner shows the copyable `/e` organizer link and warns them to save
  it, since it is the only way back in

### Requirement: Edit title and description

The system SHALL let the organizer edit the event's title and description while
the event is open, and SHALL reject an empty title.

#### Scenario: Edit persists

- GIVEN an organizer on the dashboard
- WHEN they change the title and description and save
- THEN the new details persist and render everywhere

#### Scenario: Empty title rejected

- GIVEN an organizer editing the details
- WHEN they save with an empty title
- THEN the system rejects it and the old title is kept

### Requirement: Formatted description

The system SHALL let the organizer format the event description with bold,
italic, bullet lists, numbered lists, and toned-down (muted) text — both at
creation and when editing — and SHALL render that formatting on the dashboard
and on invitee pages. The system SHALL strip any other markup from a submitted
description. Descriptions saved before formatting existed SHALL keep their
line breaks.

#### Scenario: Formatting renders for invitees

- GIVEN an organizer saves a description with a bolded phrase
- WHEN an invitee opens their response link
- THEN the phrase renders bold

#### Scenario: Muted text renders toned down for invitees

- GIVEN an organizer saves a description with a phrase marked as muted
- WHEN an invitee opens their response link
- THEN the phrase renders visibly toned down relative to the rest

#### Scenario: Disallowed markup is stripped

- GIVEN a save request whose description contains a script tag
- WHEN the system processes it
- THEN the stored description contains no script tag
- AND the description renders as inert text

#### Scenario: Legacy plain-text description keeps line breaks

- GIVEN an event whose description predates formatting
- WHEN any page renders it
- THEN its line breaks are preserved

### Requirement: Poll accent color

Each event SHALL have an accent color, one of five: yellow (the default),
pink, green, blue, or purple. The organizer SHALL be able to pick it at creation and
change it afterwards alongside the title and description. Every page of the
event — dashboard, response pages, and the shared open-mode page — SHALL
render with the event's accent color.

#### Scenario: Default accent

- GIVEN a visitor on the create page
- WHEN they create an event without touching the accent picker
- THEN the event is created with the yellow accent

#### Scenario: Pick an accent at creation

- GIVEN a visitor on the create page
- WHEN they pick the pink accent and create the event
- THEN the dashboard and every response page render with the pink accent

#### Scenario: Change the accent from the dashboard

- GIVEN an event with the yellow accent
- WHEN the organizer picks the green accent and saves
- THEN the dashboard and every response page render with the green accent

#### Scenario: Invalid accent rejected

- GIVEN a save request whose accent value is not one of the five colors
- WHEN the system processes it
- THEN it rejects the value and the event keeps its previous accent

### Requirement: Manage date options

The system SHALL let the organizer of a dates-type poll add, edit, and remove
date options while the event is open (RSVP polls keep exactly one option —
see specs/rsvp-poll). Candidate dates SHALL be chosen by toggling days in a
month calendar (navigable month by month), not by free-form entry. A selected day
MAY carry any number of optional time slots; a day with several time slots
SHALL yield one date option per slot.

#### Scenario: Pick dates from a calendar

- GIVEN an organizer choosing candidate dates
- WHEN they toggle two days in the calendar
- THEN both days are listed as selected date options
- AND toggling one of them again deselects it and removes it from the list

#### Scenario: Several time slots on one day

- GIVEN a selected day
- WHEN the organizer adds two time slots to it
- THEN the event offers two date options on that day, one per slot

#### Scenario: Add an option after invitees exist

- GIVEN an open event with existing invitees and responses
- WHEN the organizer adds a new date option
- THEN the option appears for all invitees
- AND existing invitees show as "not yet answered" for the new option

#### Scenario: Remove an option that has responses

- GIVEN a date option with recorded responses
- WHEN the organizer removes it
- THEN the option and its responses are deleted
- AND the organizer is warned before the deletion is confirmed

### Requirement: Reorder date options

The system SHALL let the organizer change the display order of date options while
the event is open, by moving a single option one step up or down and by sorting
all options ascending by date. The chosen order SHALL apply everywhere the
options are listed, including response pages and results.

#### Scenario: Move an option up

- GIVEN an open event with options in the order A, B, C
- WHEN the organizer moves B up
- THEN the options are listed in the order B, A, C for everyone

#### Scenario: Sort options ascending by date

- GIVEN an open event whose options are not in chronological order
- WHEN the organizer sorts the options by date
- THEN the options are listed earliest-first for everyone

### Requirement: Optional start and end time on a date option

A date option's start and end times SHALL both be optional. An end time SHALL
only be accepted when a start time is present, and MUST NOT be before it.

#### Scenario: Date only, no times

- WHEN the organizer adds an option with a date but no start time
- THEN the option is saved with no start or end time
- AND the option renders everywhere with no time of day

#### Scenario: Start time without end time

- WHEN the organizer adds an option with a start time but no end time
- THEN the option is saved with the start time and no end time

#### Scenario: End time requires a start time

- WHEN the organizer tries to set an end time without a start time
- THEN the system rejects it and no end time is saved

#### Scenario: End time before start time

- WHEN the organizer sets an end time earlier than the start time
- THEN the system rejects it

### Requirement: Configurable response choices

Every event SHALL offer the Available and Unavailable choices. On dates and
question polls the organizer SHALL be able to enable or disable the
"Preferred" choice (enabled by default) and the "I don't know" choice
(disabled by default), both at creation and while the event is open —
including events that already have recorded answers. RSVP polls offer exactly
yes and no; the choice toggles do not apply to them (see specs/rsvp-poll). Disabling a choice SHALL fold its already-recorded answers
into the fixed pair: Preferred answers become Available, "I don't know"
answers become Unavailable. Folded answers still count as answered.
Re-enabling a choice offers it again but SHALL NOT restore folded answers.

#### Scenario: Defaults at creation

- GIVEN a visitor on the create page
- WHEN they create an event without touching the choice settings
- THEN the event offers Preferred, Available, and Unavailable
- AND does not offer "I don't know"

#### Scenario: Enable "I don't know" at creation

- GIVEN a visitor on the create page
- WHEN they enable the "I don't know" choice and create the event
- THEN response pages for that event offer all four choices

#### Scenario: Disable "Preferred" while open folds its votes to Available

- GIVEN an open event where an invitee already marked a date Preferred
- WHEN the organizer disables the "Preferred" choice
- THEN response pages stop offering Preferred
- AND the recorded Preferred answer becomes Available and keeps counting in
  results

#### Scenario: Disable "I don't know" while open folds its votes to Unavailable

- GIVEN an open event with "I don't know" enabled where an invitee already
  marked a date "I don't know"
- WHEN the organizer disables the "I don't know" choice
- THEN response pages stop offering "I don't know"
- AND the recorded answer becomes Unavailable and still counts as answered

#### Scenario: Enable "I don't know" on an existing event

- GIVEN an open event created without the "I don't know" choice, with
  answers already recorded
- WHEN the organizer enables the "I don't know" choice
- THEN response pages start offering "I don't know"
- AND every recorded answer is unchanged

#### Scenario: Yes and No cannot be disabled

- GIVEN an organizer editing an event's choice settings
- WHEN the settings render
- THEN Available and Unavailable are not offered as toggles — every event
  always has both

### Requirement: Switch mode and language

The system SHALL let the organizer change an event's poll mode and language after
creation, editing them alongside the title and description. Switching mode SHALL
preserve all existing invitees and responses; it only changes how new people
submit.

#### Scenario: Switch assigned to open

- GIVEN an assigned-mode event with invitees and responses
- WHEN the organizer switches it to open mode
- THEN the shared `/s` link becomes the way to submit
- AND all existing invitees and their responses remain and keep counting

#### Scenario: Change language

- GIVEN an event in one language
- WHEN the organizer picks another language
- THEN the dashboard and every response page render in the new language

### Requirement: Event timezone

On a dates-type or RSVP poll, the system SHALL render every date option's
times in the event's timezone, chosen by the organizer at creation and
changeable afterwards alongside the title and description. Wherever the event's timezone
is named — on the dashboard and in the timezone picker when editing — the
label SHALL include a zone name localized to the current language alongside
the identifier. The edit picker SHALL be the same combo box as at creation:
typing filters the timezone list, and text matching no timezone reverts to
the event's current zone. A question-type poll SHALL surface no timezone
setting (see specs/question-options).

#### Scenario: Change the timezone

- GIVEN an event whose options have start times
- WHEN the organizer picks another timezone
- THEN the dashboard and every response page show the times converted to it

#### Scenario: Dashboard names the timezone in the event's language

- GIVEN an event in a non-English language
- WHEN the organizer opens the dashboard
- THEN the event's timezone is shown as its identifier together with a zone
  name in that language

#### Scenario: Change the timezone by typing

- GIVEN an organizer editing their event
- WHEN they type part of another timezone's label into the picker, pick the
  matching suggestion, and save
- THEN the event's timezone changes to it

#### Scenario: Invalid edit text keeps the current timezone

- GIVEN an organizer editing their event who typed text matching no timezone
- WHEN they leave the timezone field
- THEN the picker reverts to the event's current timezone

### Requirement: Create page language

The create page SHALL exist per language on language-specific URLs matching
the landing page's scheme, and SHALL render its own chrome in that language.
The form's poll-language picker SHALL default to the page's language, and
picking another language SHALL move the page URL to that language's create
URL while the form re-renders live, without a reload.

#### Scenario: Create page follows the site language

- GIVEN a visitor on the Danish create page URL
- WHEN the page renders
- THEN the page chrome is Danish
- AND the poll-language picker defaults to Danish

#### Scenario: Bare create URL is English

- GIVEN a visitor opening the create page with no language segment
- WHEN the page renders
- THEN the page chrome is English
- AND the poll-language picker defaults to English

#### Scenario: Picking a language moves the create URL

- GIVEN a visitor on the English create page
- WHEN they pick Danish in the language picker
- THEN the form previews Danish live without a reload
- AND the page URL becomes the Danish create URL

### Requirement: Create page highlighter hand-off

The create form's highlighter picker SHALL start on the highlighter carried
over from the landing page, and SHALL keep the page URL in sync when the
visitor picks another one, so a reload keeps the choice.

#### Scenario: Landing highlighter seeds the create form

- GIVEN a visitor who picked pink on the landing page
- WHEN they open the create page through the call-to-action
- THEN the highlighter picker starts on pink
- AND the form previews pink
