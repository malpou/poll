# rank-poll Specification

## Purpose

A text-option poll type answered by ordering: the organizer supplies two or
more text options and each invitee arranges all of them into one strict
order of preference, by dragging or with explicit move controls. Results
score options by the sum of received positions (Borda, lower is better) with
a first-place tiebreak. Option management, closing, and reopening reuse the
question type's behavior (openspec/specs/question-options, poll-closing).

## Requirements

### Requirement: Create a rank poll

The system SHALL let the creator choose a **rank** poll type at creation: a
free-form question (carried by the poll's title and description) over two or
more free-form text options that participants put in order of preference. A
rank poll SHALL be rejected with a validation message when fewer than two
non-empty text options are submitted. Rank polls SHALL NOT offer the
preferred/unsure choice toggles; both are off and stay off.

#### Scenario: Create a rank poll

- GIVEN a visitor on the create page
- WHEN they pick the rank type, enter a title, add three text options, and
  submit
- THEN the system creates the event with status "open"
- AND generates an unguessable organizer token and a share token
- AND redirects them to the organizer dashboard showing the options as text

#### Scenario: Choice toggles are not offered

- GIVEN a visitor on the create page
- WHEN they pick the rank type
- THEN the preferred/unsure choice toggles are not offered
- AND the created poll records both as off

#### Scenario: Reject a rank poll with fewer than two options

- GIVEN a visitor creating a rank poll
- WHEN a submission with one non-empty text option reaches the server
- THEN the system rejects it with a validation message

### Requirement: Answer by ordering

On a rank poll, an invitee SHALL answer by arranging all options into one
strict total order: every option gets exactly one position, no ties, no
partial orders. The order SHALL be adjustable both by dragging an option to a
new position and by an explicit non-drag control that moves an option up or
down, so ordering works by keyboard and by touch without drag. The options
SHALL start in the organizer's order, and submitting SHALL record the full
order. While the poll is open, an invitee SHALL be able to revise and resubmit
their order. A submission that reaches the server with missing or duplicate
positions SHALL be rejected.

#### Scenario: Drag an option to a new position

- GIVEN an invitee on the response page of a rank poll with options A, B, C
- WHEN they drag C above A and submit
- THEN the recorded order is C, A, B
- AND the results reflect that order

#### Scenario: Reorder without dragging

- GIVEN an invitee on the response page of a rank poll
- WHEN they use the non-drag move control to move the last option up one
  position and submit
- THEN the recorded order reflects the move

#### Scenario: Edit a submitted order while the poll is open

- GIVEN an invitee who already submitted an order on an open rank poll
- WHEN they reopen their link, change the order, and resubmit
- THEN the previous order is replaced with the new one

#### Scenario: Crafted partial or duplicate order is rejected

- GIVEN a rank poll with three options
- WHEN a crafted submission with two positions, or with the same position
  twice, reaches the server
- THEN the system rejects it and no response is recorded

### Requirement: Rank results

For a rank poll, the results SHALL score each option by the sum of positions
it received across submitted orders (lower is better) and list options from
best to worst score. Ties on score SHALL be broken by the number of
first-place positions. The best-scoring option SHALL be highlighted the way
the best option is on other poll types. Each option SHALL show its average
position, and the organizer SHALL additionally see each respondent's position
for each option. An invitee who has not submitted SHALL NOT affect any
option's score.

#### Scenario: Options ordered by score

- GIVEN a rank poll where two invitees submitted the orders A, B, C and
  B, A, C
- WHEN the organizer opens the dashboard
- THEN the results list A and B above C
- AND the best-scoring option is highlighted

#### Scenario: Tie broken by first places

- GIVEN a rank poll where options A and B have equal position sums but A has
  more first-place positions
- WHEN the results render
- THEN A is listed above B

#### Scenario: Organizer sees each respondent's positions

- GIVEN a rank poll with submitted orders
- WHEN the organizer opens the dashboard
- THEN each option shows, per respondent, the position that respondent gave it

### Requirement: Options changed after an invitee ordered

Recorded orders SHALL survive option changes as valid total orders. When the
organizer adds an option after an invitee submitted an order, that invitee's
recorded order SHALL keep its positions with the new option appended at the
end, and their response page SHALL flag the new option and open into editing,
as on other poll types. When the organizer removes an option, remaining
recorded orders SHALL close the gap so each stays a strict total order.

#### Scenario: Option added after an order was submitted

- GIVEN an open rank poll where an invitee submitted the order A, B
- WHEN the organizer adds option C
- THEN the invitee's recorded order is A, B, C
- AND their response page flags the new option and opens into editing

#### Scenario: Option removed after orders were submitted

- GIVEN an open rank poll where an invitee submitted the order A, B, C
- WHEN the organizer removes B
- THEN the invitee's recorded order is A, C with no gap in positions

### Requirement: Rank-poll wording and outcome

Rank polls SHALL render with ordering wording (arrange these, best-to-worst
terms) wherever a dates poll's copy names dates, all in the poll's language.
Closing a rank poll SHALL work as closing a question poll does: the organizer
picks the winning option(s), and the outcome page shows the chosen option's
text prominently while each option keeps its score summary.

#### Scenario: Response page reads in ordering wording

- GIVEN a rank poll
- WHEN an invitee opens their response link
- THEN the prompt and controls read in ordering wording, in the poll's
  language, not date or question wording

#### Scenario: Closed rank poll shows the chosen option

- GIVEN a rank poll closed with one option chosen
- WHEN anyone opens a link to it
- THEN the chosen option's text is shown prominently as the outcome
- AND further order changes are refused
