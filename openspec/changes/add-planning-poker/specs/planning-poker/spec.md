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
instantly, without an account. Creating a room SHALL generate two unguessable
capability tokens — a private **controller** token and a shared **join**
token — and SHALL land the creator on the controller console. A new room
SHALL start with status "open", the Fibonacci deck, and no decided items.

#### Scenario: Create a room

- GIVEN a visitor on the create-a-room page
- WHEN they name the room and submit
- THEN the system creates a room with status "open"
- AND generates an unguessable controller token and a separate join token
- AND redirects them to the controller console showing an empty results log
  and a shareable join link

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

Every phase change, join, leave, vote-cast tick, reveal, and recorded
estimate SHALL propagate to all present participants live, without a manual
refresh. A newly loaded client SHALL promptly receive the current room state
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
