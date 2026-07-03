# pro-tier Delta

## ADDED Requirements

### Requirement: Polls are free by default with an optional Pro upgrade

The system SHALL create every poll free and immediately usable, and SHALL
offer the organizer, from the poll's management page, a one-time upgrade of
that single poll to Pro for 10 DKK via an external checkout page. A poll that
is already Pro SHALL NOT be offered the upgrade again.

#### Scenario: Creation is free and instant

- GIVEN a visitor who submits a valid create form
- WHEN the submission is accepted
- THEN the poll is created as a free poll, fully usable
- AND the visitor lands on the organizer page with no payment step

#### Scenario: Organizer starts a Pro upgrade

- GIVEN a free poll's organizer page
- WHEN the organizer uses the upgrade action
- THEN they are redirected to a checkout page charging 10 DKK for that poll

#### Scenario: Pro poll is not offered the upgrade

- GIVEN a Pro poll's organizer page
- WHEN the page is shown
- THEN it indicates the poll is Pro
- AND no upgrade action is offered

### Requirement: Payment confirmation is server-verified

The system SHALL treat the payment provider's signed server-to-server
confirmation as the sole source of truth for a Pro upgrade. A browser
returning via the checkout return URL SHALL NOT by itself make a poll Pro,
confirmations with a missing or invalid signature SHALL be rejected without
changing any poll, and a duplicate confirmation SHALL leave the poll's Pro
state and timestamp unchanged.

#### Scenario: Payment confirmation upgrades the poll

- GIVEN a free poll with a checkout in progress
- WHEN the payment provider confirms the checkout completed
- THEN the poll becomes Pro

#### Scenario: Forged confirmation is rejected

- GIVEN a free poll
- WHEN a confirmation arrives whose signature is missing or invalid
- THEN the request is rejected
- AND the poll remains free

#### Scenario: Duplicate confirmation is harmless

- GIVEN a poll already Pro
- WHEN the payment provider delivers the same confirmation again
- THEN the poll's Pro state and timestamp are unchanged

#### Scenario: Visiting the return URL without paying does not upgrade

- GIVEN a free poll with a checkout in progress
- WHEN someone opens the checkout return URL without a completed payment
- THEN the poll remains free

### Requirement: Return from checkout keeps the organizer token private

The checkout round trip SHALL NOT place the organizer token in any URL or
data given to the payment provider. Returning from checkout — completed or
canceled — SHALL resolve server-side to that poll's organizer page.

#### Scenario: Completed checkout lands on the organizer page

- GIVEN a poll whose checkout just completed
- WHEN the payer returns via the checkout return URL
- THEN they are forwarded to that poll's organizer page
- AND the URLs shared with the payment provider contain no organizer token

#### Scenario: Canceled checkout returns to the organizer page

- GIVEN a free poll whose checkout was canceled
- WHEN the organizer returns via the cancel URL
- THEN they are forwarded to that poll's organizer page, still free

### Requirement: Free polls carry a made-with badge on participant pages

A free poll's participant-facing pages SHALL show a discreet badge — on
respondent links and the open-mode shared link — in the poll's language,
saying the poll was made with this tool and inviting the visitor to create
their own for free, linking to the landing page in that language. Pro polls
SHALL NOT show the badge. Organizer pages SHALL never show it.

#### Scenario: Badge on a free poll's respondent page

- GIVEN a free poll with an invitee
- WHEN the invitee's response link is opened
- THEN a badge in the poll's language invites creating your own poll
- AND it links to the landing page in that language

#### Scenario: Badge on a free poll's shared page

- GIVEN a free open-mode poll
- WHEN its shared link is opened
- THEN the badge is shown

#### Scenario: No badge on a Pro poll

- GIVEN a Pro poll with an invitee
- WHEN the invitee's response link is opened
- THEN no badge is shown

### Requirement: Pre-existing polls are free polls

Polls created before the Pro tier existed SHALL behave exactly as free
polls: fully usable, badge shown, upgrade offered.

#### Scenario: Old poll behaves as free

- GIVEN a poll created before the Pro tier
- WHEN its organizer and participant links are opened
- THEN everything works unchanged
- AND the participant pages show the badge
- AND the organizer page offers the upgrade
