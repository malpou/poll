## ADDED Requirements

### Requirement: Planning poker on the landing page

The landing page SHALL present planning poker as a tool distinct from the
polls, not as another poll type: it SHALL appear in its own section ahead of
the poll examples, marked as a new capability, explain that it is a live,
real-time way for a team to estimate together, and offer its own
call-to-action leading to room creation. The section SHALL show a non-persisting
example of the reveal — face-down cards that turn face-up together on a tap,
with the resulting agreement read-out — and the section SHALL make clear the
cards are an example. All of its copy SHALL render in the page's language.

#### Scenario: Visitor sees planning poker as its own tool

- GIVEN a visitor on the landing page
- WHEN the page renders
- THEN a section ahead of the poll examples explains planning poker as a live
  team estimation tool, marked as new
- AND that section offers its own call-to-action for starting a room

#### Scenario: Planning poker call-to-action keeps the page language

- GIVEN a visitor on the Danish landing page
- WHEN they follow the planning-poker call-to-action
- THEN room creation renders in Danish

#### Scenario: Reveal example turns the cards over

- GIVEN a visitor on the landing page
- WHEN they tap the planning-poker example
- THEN the face-down cards turn face-up together showing their values
- AND the example's agreement read-out appears

#### Scenario: Example answers are not persisted

- GIVEN a visitor who revealed the planning-poker example
- WHEN they reload the landing page
- THEN the example is back to face-down
- AND no room, participant, or vote was recorded anywhere

#### Scenario: Planning poker call-to-action carries the picked highlighter

- GIVEN a visitor on the landing page who picked pink
- WHEN they follow the planning-poker call-to-action
- THEN room creation starts on pink

## MODIFIED Requirements

### Requirement: Marketing pages indexable, token pages not

The landing page SHALL be indexable by search engines, and so SHALL both
creation flows — poll creation and planning-poker room creation. Pages reached through a
capability token (organizer dashboard, response pages, the shared open-mode
page, the planning-poker controller console, the planning-poker join page)
SHALL instruct search engines not to index them.

#### Scenario: Landing page is indexable

- GIVEN the landing page in any language
- WHEN the page renders
- THEN it carries no instruction blocking search engine indexing

#### Scenario: Room creation is indexable

- GIVEN the create page with planning-poker room creation chosen
- WHEN the page renders
- THEN it carries no instruction blocking search engine indexing

#### Scenario: Token pages are not indexable

- GIVEN a valid organizer, response, or shared link
- WHEN its page renders
- THEN the page instructs search engines not to index it

#### Scenario: Planning-poker token pages are not indexable

- GIVEN a valid planning-poker controller or join link
- WHEN its page renders
- THEN the page instructs search engines not to index it
