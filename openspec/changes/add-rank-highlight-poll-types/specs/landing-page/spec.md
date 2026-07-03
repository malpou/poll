## MODIFIED Requirements

### Requirement: Interactive poll type examples

The landing page SHALL show one interactive example per poll type: a date
poll, an RSVP, a question poll, a rank poll, and a highlight poll. Each
example SHALL be answerable in place, and answering SHALL immediately update
that example's small results tally. Each example SHALL name its poll type,
the surrounding section SHALL make clear the cards are examples, the
examples SHALL persist nothing, and SHALL render their sample content in the
page's language with sample dates in the near future.

#### Scenario: Date poll example reacts to a tap

- GIVEN a visitor on the landing page
- WHEN they mark a date in the date poll example as available
- THEN that example's tally updates immediately to include their answer

#### Scenario: RSVP example takes a yes or no

- GIVEN a visitor on the landing page
- WHEN they tap yes in the RSVP example
- THEN the example's headcount updates immediately

#### Scenario: Question poll example reacts to a tap

- GIVEN a visitor on the landing page
- WHEN they mark an option in the question poll example
- THEN that example's tally updates immediately

#### Scenario: Rank example reacts to a reorder

- GIVEN a visitor on the landing page
- WHEN they move an option in the rank example to a new position
- THEN the example's tally updates immediately to reflect the new order

#### Scenario: Highlight example spends strokes

- GIVEN a visitor on the landing page
- WHEN they tap an option in the highlight example
- THEN a marker stroke appears on that option, the remaining-stroke count
  drops, and the example's tally updates immediately

#### Scenario: Example answers are not persisted

- GIVEN a visitor who answered in an example
- WHEN they reload the landing page
- THEN the example is back in its initial state
- AND no invitee or response was recorded anywhere
