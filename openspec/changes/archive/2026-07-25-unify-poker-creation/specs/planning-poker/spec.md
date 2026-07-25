## ADDED Requirements

### Requirement: Room language

A room SHALL record the language chosen when it was created, and SHALL render
in that language for everyone — the controller console, the join page, the
voting view, and the results log — regardless of any visitor's browser
language. The language SHALL be fixed at creation. A room created before rooms
recorded a language SHALL render in the base language.

#### Scenario: Room renders in the language it was created in

- GIVEN a room created with Danish chosen
- WHEN the controller opens the console
- THEN the console renders in Danish

#### Scenario: Participants see the creator's language, not their own

- GIVEN a room created with Danish chosen
- WHEN a participant whose browser prefers French opens the join link
- THEN the join page and voting view render in Danish

### Requirement: Room highlighter

A room SHALL take a highlighter chosen when it was created, from the same set a
poll offers, and SHALL wear it for everyone — the controller console, the join
page, the voting view, and the results log. Planning poker SHALL therefore
offer the same highlighter choice as poll creation, at the same point in the
same flow. The highlighter SHALL be fixed at creation. A room created before
rooms recorded a highlighter SHALL keep the appearance it had.

#### Scenario: Room wears the highlighter it was created with

- GIVEN a visitor creating a room who picks the pink highlighter
- WHEN they land on the controller console
- THEN the console renders in pink

#### Scenario: Participants see the room's highlighter

- GIVEN a room created with the pink highlighter
- WHEN a participant opens the join link
- THEN the join page renders in pink

#### Scenario: Room creation offers the same highlighters as poll creation

- GIVEN a visitor on the create page
- WHEN they switch between making a poll and making a room
- THEN the same highlighter choice is offered either way
- AND the pick carries across the switch

### Requirement: Room email

Room creation SHALL offer the same optional email field poll creation does. An
address that is not a valid email address SHALL be rejected with an explanation
and SHALL NOT create the room. When a room is created with an address the
system SHALL send that address two transactional emails: one immediately,
carrying the room's title and its private controller link with a warning that
the link is secret; and one when the room is closed, carrying the room's title
and every decided item with its final estimate, in the order they were decided.
Unlike a poll organizer's address, a room's address SHALL be stored — the
closing summary is sent arbitrarily later — and SHALL live no longer than the
room. The stored address SHALL NOT be disclosed to any client. Delivery SHALL
be best-effort: a failure SHALL NOT prevent, delay, or roll back creating the
room, closing it, or any other room action. A room closed with no decided items
SHALL still send a summary, saying that nothing was decided.

#### Scenario: Creating a room with an address mails the room's link

- GIVEN a visitor creating a room who entered their email address
- WHEN the room is created
- THEN they land on the controller console exactly as without an address
- AND an email is sent to that address carrying the room's title, the private
  controller link, and a warning to keep the link secret

#### Scenario: Closing the room mails the results

- GIVEN a room created with an address, with two decided items
- WHEN the controller closes the room
- THEN an email is sent to that address carrying the room's title and both
  items with their final estimates

#### Scenario: Closing a room that decided nothing

- GIVEN a room created with an address and no decided items
- WHEN the controller closes the room
- THEN the email says that nothing was decided

#### Scenario: Create without an address

- GIVEN a visitor creating a room who leaves the email field empty
- WHEN the room is created
- THEN no address is stored and no email is ever sent for that room

#### Scenario: Reject an invalid address

- GIVEN a visitor creating a room who typed text that is not a valid email
  address
- WHEN they submit
- THEN the submission is rejected with a validation message
- AND no room is created

#### Scenario: The stored address is never disclosed

- GIVEN a room created with an address
- WHEN anyone inspects what is sent to their client
- THEN the address is absent

### Requirement: A closed room stops offering its join link

Once a room is closed the controller console SHALL NOT offer the shared join
link for copying, since the link no longer admits anyone.

#### Scenario: Join link disappears on close

- GIVEN a controller on an open room showing the shareable join link
- WHEN they close the room
- THEN the join link is no longer offered

### Requirement: Reveal waits for everyone present

The controller SHALL NOT be able to reveal while an estimator who is present in
the room has not yet cast a card, and the room SHALL name who it is still
waiting on. Observers never cast a card and SHALL never hold a reveal up;
neither SHALL a seat that has dropped out of the room, so one absentee cannot
deadlock a round. With no present estimator at all the reveal SHALL stay
unavailable.

#### Scenario: Reveal is held while someone has not voted

- GIVEN a room in the voting phase with two estimators, one of whom has voted
- WHEN the controller looks at the reveal control
- THEN it is unavailable
- AND the room names the estimator it is still waiting on

#### Scenario: Reveal frees up on the last vote

- GIVEN a room in the voting phase where all but one estimator have voted
- WHEN the last estimator casts a card
- THEN the reveal becomes available to the controller

#### Scenario: Observers never hold up a reveal

- GIVEN a room where every estimator has voted and an observer is watching
- WHEN the controller looks at the reveal control
- THEN it is available

#### Scenario: A dropped participant does not deadlock the round

- GIVEN a room in the voting phase where one estimator has stopped being
  present without voting and everyone still present has voted
- WHEN the controller looks at the reveal control
- THEN it is available

### Requirement: Recorded estimate stays within what was voted

On reveal the controller SHALL be offered, as the final estimate, only the deck
numerals from the lowest numeral cast through the highest, inclusive — never a
value the room did not bracket. A unanimous round SHALL offer only the agreed
numeral. Special cards SHALL NOT widen the range; when no numeral was cast at
all the whole deck SHALL be offered. The non-numeric outcomes (recording a
split, or skipping the item) SHALL remain available regardless.

#### Scenario: Offered estimates span only the votes cast

- GIVEN a revealed round whose numeric votes were "3" and "8"
- WHEN the controller records the estimate
- THEN the numerals offered are 3, 5, and 8
- AND no numeral outside that span is offered

#### Scenario: A unanimous round offers only its own value

- GIVEN a revealed round where every numeric vote was "5"
- WHEN the controller records the estimate
- THEN "5" is the only numeral offered

#### Scenario: Special cards do not widen the range

- GIVEN a revealed round whose votes were "2", "3", and ∞
- WHEN the controller records the estimate
- THEN the numerals offered are 2 and 3

#### Scenario: No numeric votes offers the whole deck

- GIVEN a revealed round where every vote was a special card
- WHEN the controller records the estimate
- THEN the full deck of numerals is offered

### Requirement: Keyboard submits the room's text entries

Every single-line text entry in a room SHALL be submittable from the keyboard:
pressing Enter in the field SHALL do the same thing as its button. This covers
naming yourself to take a seat, naming yourself as an estimating controller,
and naming the next item. Submitting an empty field SHALL do nothing.

#### Scenario: Enter joins the room

- GIVEN a visitor on a room's join page
- WHEN they type a display name and press Enter in the name field
- THEN they take a seat under that name, exactly as if they had pressed the
  join button

#### Scenario: Enter opens voting on the next item

- GIVEN a controller on a room in the waiting phase
- WHEN they type an item name and press Enter in the item field
- THEN the room enters the voting phase for that item

#### Scenario: Enter on an empty field does nothing

- GIVEN a visitor on a room's join page with an empty name field
- WHEN they press Enter in the field
- THEN no seat is taken and the page stays as it is

## MODIFIED Requirements

### Requirement: Create a planning-poker room

The system SHALL let anyone create a planning-poker room for free and
instantly, without an account. Room creation SHALL live on the same create page
as poll creation, which SHALL open by asking what the visitor is making — a
poll or a planning-poker room — and SHALL ask only for a room name once a room
is chosen, plus the language and highlighter every created thing carries. Because a room's look is fixed, room creation SHALL NOT offer a
highlighter choice; because a room has a language, it SHALL offer a language
choice. Creating a room SHALL generate two unguessable capability tokens — a
private **controller** token and a shared **join** token — and SHALL land the
creator on the controller console. A new room SHALL start with status "open",
the Fibonacci deck, and no decided items. Submitting without a room name SHALL
be rejected with an explanation and SHALL NOT create a room.

#### Scenario: Create a room

- GIVEN a visitor on the create page who chose to make a planning-poker room
- WHEN they name the room and submit
- THEN the system creates a room with status "open"
- AND generates an unguessable controller token and a separate join token
- AND redirects them to the controller console showing an empty results log
  and a shareable join link

#### Scenario: Choosing a room asks only for a room name

- GIVEN a visitor on the create page
- WHEN they choose to make a planning-poker room
- THEN the form asks for a room name, a language, a highlighter, and the same
  optional email address poll creation asks for
- AND it no longer asks for anything that belongs only to a poll — poll type,
  dates, options, answering mode, or participants

#### Scenario: Choosing a poll leaves poll creation unchanged

- GIVEN a visitor on the create page who chose a planning-poker room
- WHEN they switch back to making a poll
- THEN the full poll form is offered again, exactly as specified in
  event-management

#### Scenario: Room without a name is rejected

- GIVEN a visitor on the create page who chose to make a planning-poker room
- WHEN they submit without naming the room
- THEN the page explains that a room name is required
- AND no room is created

#### Scenario: Controller and join links are distinct capabilities

- GIVEN a created room
- WHEN the controller link and the join link are compared
- THEN they are different unguessable tokens
- AND the join link never grants control actions
