# payment-gating Delta

## ADDED Requirements

### Requirement: Payment required to activate a poll

The system SHALL require a one-time payment of 10 DKK before a newly created
poll becomes usable. A valid creation submission SHALL store the event in an
awaiting-payment state and send the creator to an external checkout page for
that amount.

#### Scenario: Creation leads to checkout

- GIVEN a visitor who submits a valid create form
- WHEN the submission is accepted
- THEN the event is stored awaiting payment
- AND the visitor is redirected to a checkout page charging 10 DKK

#### Scenario: Payment confirmation activates the poll

- GIVEN an event awaiting payment
- WHEN the payment provider confirms the checkout completed
- THEN the event becomes paid and fully usable

#### Scenario: Duplicate payment confirmation is harmless

- GIVEN an event already marked paid
- WHEN the payment provider delivers the same confirmation again
- THEN the event's paid state and timestamp are unchanged

### Requirement: Payment confirmation is server-verified

The system SHALL treat the payment provider's signed server-to-server
confirmation as the sole source of truth for payment. A browser returning via
the success URL SHALL NOT by itself mark an event paid, and confirmations
with a missing or invalid signature SHALL be rejected without changing any
event.

#### Scenario: Forged confirmation is rejected

- GIVEN an event awaiting payment
- WHEN a confirmation arrives whose signature is missing or invalid
- THEN the request is rejected
- AND the event still awaits payment

#### Scenario: Visiting the success URL without paying does not activate

- GIVEN an event awaiting payment
- WHEN someone opens the post-payment return URL without a completed payment
- THEN the event still awaits payment

### Requirement: Awaiting-payment organizer state

While an event awaits payment, its organizer page SHALL show an
awaiting-payment notice, in the poll's language, with an action to start a
new checkout for the same event, and SHALL NOT show the management dashboard.
Once paid, the organizer page SHALL show the normal dashboard.

#### Scenario: Organizer page while unpaid

- GIVEN an event awaiting payment
- WHEN its organizer link is opened
- THEN an awaiting-payment notice appears with a retry-payment action
- AND no management controls are shown

#### Scenario: Retry payment from the organizer page

- GIVEN an event awaiting payment
- WHEN the organizer uses the retry-payment action
- THEN they are redirected to a checkout page for that event

#### Scenario: Organizer page after payment

- GIVEN an event whose payment was confirmed
- WHEN its organizer link is opened
- THEN the normal management dashboard is shown

### Requirement: Unpaid events are hidden from respondents

An event awaiting payment SHALL have its respondent links and its open-mode
shared link respond with a not-found page revealing no event data.

#### Scenario: Respondent link while unpaid

- GIVEN an event awaiting payment with an invitee
- WHEN the invitee's response link is opened
- THEN a not-found page is shown and no event data is revealed

#### Scenario: Shared link while unpaid

- GIVEN an open-mode event awaiting payment
- WHEN its shared link is opened
- THEN a not-found page is shown and no event data is revealed

### Requirement: Return from payment keeps the organizer token private

The post-payment return trip SHALL NOT place the organizer token in any URL
or data given to the payment provider. After a completed payment, the return
URL SHALL be resolved server-side to the organizer page for the paid event.

#### Scenario: Completed payment lands on the organizer page

- GIVEN an event whose checkout just completed
- WHEN the payer returns via the post-payment return URL
- THEN they are forwarded to that event's organizer page
- AND the URLs shared with the payment provider contain no organizer token

### Requirement: Pre-existing events remain usable

Events created before payment gating existed SHALL count as paid and keep
working unchanged.

#### Scenario: Old event unaffected

- GIVEN an event created before payment gating
- WHEN its organizer, respondent, or shared links are opened
- THEN they behave exactly as for a paid event
