# planning-poker Specification

## Purpose

A real-time, controller-run estimation room. A team sizes a sequence of
items on a Fibonacci deck, one item at a time: everyone casts a hidden vote,
the controller reveals all votes together, and the room sees whether it
agrees or needs to discuss. One person controls the room over a private link;
everyone else joins through a shared link and names themselves. The room, its
items, and each item's final estimate persist; the live phase and in-flight
votes are ephemeral coordination state.

## Requirements

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

### Requirement: Join a room and be remembered

A participant SHALL join a room through the shared join link by entering a
display name, after which they appear in the room's live roster. The system
SHALL remember the participant's identity in their browser so a refresh or a
dropped connection resumes the same seat rather than creating a duplicate. A
participant MAY join as an observer who watches without casting a vote.
Joining a room whose status is "closed" SHALL NOT allow voting and SHALL show
the final results log.

#### Scenario: Join by naming yourself

- GIVEN a visitor on a room's join page
- WHEN they enter a display name and join
- THEN they appear in the live roster under that name
- AND every already-connected participant sees the new seat appear live

#### Scenario: Refresh resumes the same seat

- GIVEN a participant who has joined and been remembered by their browser
- WHEN they refresh the page or reconnect after a dropped connection
- THEN they rejoin under the same identity
- AND no duplicate seat is created for them

#### Scenario: Joining a closed room

- GIVEN a room whose status is "closed"
- WHEN a visitor opens the join link
- THEN they see the final results log
- AND they are not offered a way to cast a vote

### Requirement: Controller drives the per-item phases

The room SHALL move one item at a time through three phases —
**waiting**, **voting**, and **revealed** — and only the controller SHALL
change phase. From waiting the controller SHALL open voting on an item; from
voting the controller SHALL reveal; from revealed the controller SHALL either
re-open voting (a re-vote) or record the final estimate and return the room
to waiting. At most one item SHALL be active at a time. A control action
attempted by a non-controller participant SHALL be ignored.

#### Scenario: Open voting on an item

- GIVEN a controller on a room in the waiting phase
- WHEN they name the next item and open voting
- THEN the room enters the voting phase for that item
- AND every connected participant sees the voting view live

#### Scenario: Re-vote after revealing

- GIVEN a room in the revealed phase
- WHEN the controller re-opens voting for the same item
- THEN the room returns to the voting phase
- AND every participant's previous vote for that item is cleared

#### Scenario: Participant cannot drive phases

- GIVEN a participant (not the controller) in a room
- WHEN a reveal or open-voting action arrives from that participant's client
- THEN the room's phase does not change

### Requirement: Cast a hidden vote

While the phase is voting, an estimator SHALL cast a vote by picking one card
from the modified Fibonacci deck (`0 1 2 3 5 8 13 20 40 100`) or a special
card, and SHALL be able to change it until the reveal. The controller MAY
also take part as an estimator; when they do, their vote counts and is
hidden and revealed like any other. Until the reveal the system SHALL show
only **which** seats have voted, never **what** any seat voted. A vote
message that arrives when the phase is not voting SHALL be rejected.

#### Scenario: Cast and change a vote

- GIVEN an estimator in a room in the voting phase
- WHEN they pick a card and then pick a different card before the reveal
- THEN their vote is recorded as the later card
- AND their seat shows as "voted" to everyone without exposing the value

#### Scenario: Votes stay hidden until reveal

- GIVEN several estimators who have voted in the voting phase
- WHEN another participant inspects what is sent to their client
- THEN no card value for any other seat is present before the reveal
- AND only the "has voted" state per seat is visible

#### Scenario: Late joiner can still vote

- GIVEN a room already in the voting phase
- WHEN a new participant joins and picks a card before the reveal
- THEN their vote is recorded and their seat shows as "voted"

#### Scenario: Controller votes as an estimator

- GIVEN a controller who has chosen to take part as an estimator
- WHEN they pick a card in the voting phase
- THEN their vote is hidden until reveal like any other seat
- AND it is included in the distribution and agreement signal on reveal

#### Scenario: Vote after reveal is rejected

- GIVEN a room in the revealed phase
- WHEN a vote message arrives from a participant's client
- THEN it is rejected and no vote is recorded or changed

### Requirement: Synchronized reveal

When the controller reveals, every cast vote SHALL become visible to all
connected participants at the same time, and the system SHALL show the
distribution of votes across the deck.

#### Scenario: Reveal flips all votes at once

- GIVEN a room in the voting phase where several seats have voted
- WHEN the controller reveals
- THEN every participant sees all cast cards face-up together
- AND the distribution of votes across the deck is shown

### Requirement: Special cards

The deck SHALL include three special cards: **?** (need more info), **∞**
(too big to estimate), and **☕** (I need a break). The special cards SHALL be
castable like any card and SHALL be shown on reveal, but SHALL NOT count as
numeric estimates. A **∞** vote SHALL force the agreement signal to a spread.
A **☕** vote SHALL raise an advisory "someone needs a break" hint without
affecting the numeric agreement.

#### Scenario: Infinity forces a spread

- GIVEN a room where the numeric votes would otherwise agree
- WHEN at least one participant has voted ∞ and the controller reveals
- THEN the agreement signal is a spread
- AND the ∞ vote is shown but excluded from the numeric distribution

#### Scenario: Coffee raises a break hint

- GIVEN a room in the voting phase
- WHEN a participant votes ☕ and the controller reveals
- THEN a "someone needs a break" hint is shown
- AND the ☕ vote does not change the numeric agreement signal

### Requirement: Agreement signal

On reveal the system SHALL classify the numeric votes as **agree**,
**close**, or **spread**, considering only numeric cards by their position on
the deck. It SHALL be **agree** when there is at least one numeric vote, all
numeric votes are the same card, and no ∞ is present; **close** when the
numeric votes span exactly one adjacent deck step with no ∞; and **spread**
when they span more than one step, any ∞ is present, or there are no numeric
votes at all. On **agree** the system SHALL pre-fill the agreed value as the
suggested estimate. The signal SHALL be advisory only and SHALL NOT record an
estimate on its own.

#### Scenario: Room agrees

- GIVEN a room in the voting phase where every numeric vote is the card "5"
  and no one voted ∞
- WHEN the controller reveals
- THEN the signal is "agree"
- AND "5" is pre-filled as the suggested final estimate

#### Scenario: Close but not equal

- GIVEN votes on the two adjacent cards "3" and "5" and no ∞
- WHEN the controller reveals
- THEN the signal is "close"

#### Scenario: More than one step apart is a spread

- GIVEN votes on "3" and "13" (more than one deck step apart)
- WHEN the controller reveals
- THEN the signal is "spread"

#### Scenario: No numeric votes is a spread

- GIVEN a room where every cast vote is a special card (? / ∞ / ☕)
- WHEN the controller reveals
- THEN the signal is "spread"
- AND no value is pre-filled as the suggested estimate

### Requirement: Controller records the final estimate

The controller SHALL be authoritative over the final estimate: from the
revealed phase they SHALL record a final estimate for the item — accepting
the suggestion, choosing any other deck value, or marking the item as split
or skipped. Recording an estimate SHALL decide the item, persist it to the
durable results log, and return the room to the waiting phase for the next
item. A decided item's estimate SHALL survive after the live session ends.

#### Scenario: Record the suggested estimate

- GIVEN a revealed room with an "agree" signal suggesting "5"
- WHEN the controller records the final estimate
- THEN the item is decided with estimate "5"
- AND it appears in the room's results log
- AND the room returns to the waiting phase

#### Scenario: Controller overrides the suggestion

- GIVEN a revealed room suggesting "5"
- WHEN the controller records "8" instead after discussion
- THEN the item is decided with estimate "8"

#### Scenario: Decided estimate persists

- GIVEN a room with one decided item
- WHEN the room's results are loaded fresh from durable storage
- THEN the decided item and its final estimate are present

### Requirement: Live propagation

The room SHALL propagate every phase change, join, leave, vote-cast tick,
reveal, and recorded estimate to all present participants live, without a
manual refresh. A newly loaded client SHALL promptly receive the current room state
(phase, roster, revealed votes if any, and results log).

#### Scenario: A phase change reaches everyone live

- GIVEN two participants connected to the same room
- WHEN the controller opens voting
- THEN both participants' views switch to the voting phase without reloading

#### Scenario: Connecting mid-session shows current state

- GIVEN a room already in the revealed phase with a results log
- WHEN a new participant connects
- THEN they immediately see the revealed votes and the existing results log

#### Scenario: A leaving participant drops from the live roster

- GIVEN two connected participants
- WHEN one closes their connection
- THEN the other sees that seat removed from the live roster
- AND the durable results log is unaffected

### Requirement: Control actions require the controller token

Only the holder of the controller token SHALL be able to open voting,
reveal, re-vote, record an estimate, or close the room. The shared join token
SHALL grant joining and voting only. The server SHALL authorize the token
before a connection is treated as the controller.

#### Scenario: Join token cannot control the room

- GIVEN a participant connected with the join token
- WHEN a control action is issued from their client
- THEN the server does not perform it and the room state is unchanged

#### Scenario: Controller token controls the room

- GIVEN a client connected with the controller token
- WHEN they open voting on an item
- THEN the room enters the voting phase

### Requirement: Close the room

The controller SHALL be able to close the room, setting its status to
"closed". A closed room SHALL refuse new votes and phase changes and SHALL
present the final results log.

#### Scenario: Closing ends estimation

- GIVEN an open room with decided items
- WHEN the controller closes the room
- THEN the room status becomes "closed"
- AND participants see the final results log and cannot cast votes

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
