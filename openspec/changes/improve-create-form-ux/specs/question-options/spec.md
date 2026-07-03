## MODIFIED Requirements

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
- WHEN a submission with one text option, or with two options where one is
  only whitespace, reaches the server
- THEN the system rejects it with a validation message
