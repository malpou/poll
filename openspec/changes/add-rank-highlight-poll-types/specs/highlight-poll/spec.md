## ADDED Requirements

### Requirement: Create a highlight poll

The system SHALL let the creator choose a **highlight** poll type at
creation: a free-form question (carried by the poll's title and description)
over two or more free-form text options, answered by spending a fixed budget
of marker strokes across the options. The creator SHALL be able to set the
stroke budget between 1 and 10, defaulting to 5; the budget SHALL be fixed
after creation. A highlight poll SHALL be rejected with a validation message
when fewer than two non-empty text options are submitted or the budget is
outside 1–10. Highlight polls SHALL NOT offer the preferred/unsure choice
toggles; both are off and stay off.

#### Scenario: Create a highlight poll with the default budget

- GIVEN a visitor on the create page
- WHEN they pick the highlight type, enter a title, add two text options, and
  submit without touching the budget
- THEN the system creates the event with status "open" and a budget of 5
- AND redirects them to the organizer dashboard showing the options as text

#### Scenario: Budget is fixed after creation

- GIVEN an organizer on the dashboard of a highlight poll
- WHEN the settings render
- THEN no budget control is offered
- AND a crafted request to change the budget is rejected

#### Scenario: Reject an out-of-range budget

- GIVEN a visitor creating a highlight poll
- WHEN a submission with a budget of 0 or 11 reaches the server
- THEN the system rejects it with a validation message

### Requirement: Answer by spending strokes

On a highlight poll, an invitee SHALL answer by distributing marker strokes
across the options: tapping an option adds one stroke to it, and a stroke can
be taken back off, as long as the poll is open. The page SHALL always show
how many strokes remain, adding a stroke SHALL be impossible once the budget
is spent until one is removed, and an option left at zero strokes SHALL be a
valid part of the answer. Submitting SHALL require at least one stroke
spent. Strokes SHALL render as the poll's highlighter marking the option's
text, deepening as strokes stack. A submission that reaches the server whose
strokes exceed the budget or include a negative count SHALL be rejected.
While the poll is open, an invitee SHALL be able to revise and resubmit their
strokes.

#### Scenario: Spend strokes across options

- GIVEN an invitee on a highlight poll with a budget of 5 and options A, B, C
- WHEN they tap A three times and B twice and submit
- THEN the recorded answer is 3 strokes on A, 2 on B, 0 on C
- AND the remaining-stroke indicator reached zero before submitting

#### Scenario: Budget cannot be exceeded

- GIVEN an invitee who has spent their whole budget
- WHEN they tap an option to add another stroke
- THEN no stroke is added until one is removed elsewhere

#### Scenario: Take a stroke back

- GIVEN an invitee who put two strokes on an option
- WHEN they remove one stroke
- THEN the option shows one stroke and the remaining count goes up by one

#### Scenario: Empty answer is refused

- GIVEN an invitee who has spent no strokes
- WHEN they try to submit
- THEN the submission is refused until at least one stroke is spent

#### Scenario: Crafted over-budget submission is rejected

- GIVEN a highlight poll with a budget of 5
- WHEN a crafted submission totaling 6 strokes, or containing a negative
  count, reaches the server
- THEN the system rejects it and no response is recorded

### Requirement: Stroke results

For a highlight poll, the results SHALL total the strokes each option
received across submitted answers and list options from most to least
strokes, with each option's bar proportional to its share of all strokes.
The most-stroked option SHALL be highlighted the way the best option is on
other poll types; options tied for most are all highlighted. The organizer
SHALL additionally see each respondent's stroke count per option.

#### Scenario: Options ordered by stroke totals

- GIVEN a highlight poll where submitted answers total 5 strokes on A and 2
  on B
- WHEN the organizer opens the dashboard
- THEN A is listed above B with a proportionally longer bar
- AND A is highlighted as the leading option

#### Scenario: Organizer sees each respondent's strokes

- GIVEN a highlight poll with submitted answers
- WHEN the organizer opens the dashboard
- THEN each option shows, per respondent, how many strokes that respondent
  gave it

### Requirement: Options changed after an invitee answered

Recorded stroke answers SHALL survive option changes. When the organizer
adds an option after an invitee submitted, the new option SHALL start at
zero strokes for that invitee, and their response page SHALL flag the new
option and open into editing so they can reallocate, as on other poll types.
Removing an option SHALL delete its strokes; the affected invitees'
remaining answers stay valid and they MAY re-spend the freed strokes.

#### Scenario: Option added after an answer was submitted

- GIVEN an open highlight poll where an invitee submitted strokes
- WHEN the organizer adds an option
- THEN the invitee's response page flags the new option at zero strokes and
  opens into editing

### Requirement: Highlight-poll wording and outcome

Highlight polls SHALL render with stroke wording (spend your marks,
strokes-left terms) wherever a dates poll's copy names dates, all in the
poll's language. Closing a highlight poll SHALL work as closing a question
poll does: the organizer picks the winning option(s), and the outcome page
shows the chosen option's text prominently while each option keeps its
stroke totals.

#### Scenario: Response page reads in stroke wording

- GIVEN a highlight poll
- WHEN an invitee opens their response link
- THEN the prompt and remaining-stroke indicator read in stroke wording, in
  the poll's language, not date or question wording

#### Scenario: Closed highlight poll shows the chosen option

- GIVEN a highlight poll closed with one option chosen
- WHEN anyone opens a link to it
- THEN the chosen option's text is shown prominently as the outcome
- AND further stroke changes are refused
