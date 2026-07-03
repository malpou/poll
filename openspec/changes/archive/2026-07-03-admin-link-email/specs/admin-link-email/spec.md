# admin-link-email Specification (delta)

## ADDED Requirements

### Requirement: Optional organizer email on the create form

The create form SHALL offer an optional email field for the organizer. An
empty field SHALL leave creation exactly as it is today. A value that is not
a valid email address SHALL be rejected with a validation message and SHALL
NOT create the poll. The field's label and hint SHALL render in the form's
currently picked language.

#### Scenario: Create without an email

- GIVEN a visitor on the create page who leaves the email field empty
- WHEN they submit a valid poll
- THEN the poll is created and they land on the organizer dashboard
- AND no email is sent

#### Scenario: Reject an invalid email address

- GIVEN a visitor on the create page who typed text that is not a valid
  email address into the email field
- WHEN they submit the form
- THEN the submission is rejected with a validation message
- AND no poll is created

#### Scenario: Create with an email

- GIVEN a visitor on the create page who entered their email address
- WHEN they submit a valid poll
- THEN the poll is created and they land on the organizer dashboard, exactly
  as without an email

### Requirement: Organizer link emailed on creation

WHEN a poll is created with an organizer email, the system SHALL send that
address one transactional email containing the organizer link and the
poll's admin code, written in the poll's language and warning that the link
is secret. The system SHALL NOT store the address. Email delivery SHALL be
best-effort: a delivery failure SHALL NOT prevent, delay, or roll back poll
creation.

#### Scenario: Email carries the organizer link and code in the poll's language

- GIVEN a poll being created in Danish with an organizer email
- WHEN the poll is created
- THEN the email's subject and body are in Danish
- AND the body contains the organizer link and the admin code and notes they
  must be kept secret

#### Scenario: Address is not stored

- GIVEN a poll created with an organizer email
- WHEN the creation completes
- THEN the address is not persisted anywhere in the system

#### Scenario: Delivery failure does not block creation

- GIVEN email delivery is unavailable
- WHEN a visitor creates a poll with an organizer email
- THEN the poll is created and the organizer dashboard loads normally

### Requirement: Admin code gate on organizer pages

WHEN a poll is created with an organizer email, the system SHALL generate an
unguessable admin code and store it on the poll. For a poll that has an
admin code, organizer pages SHALL require the code once per browser: a
browser that has not previously supplied it SHALL see a code prompt, in the
poll's language, instead of any organizer content. Entering the correct code
SHALL open the organizer pages and be remembered by that browser; an
incorrect code SHALL be rejected with a message and SHALL reveal no
organizer content. The creator's own browser SHALL be unlocked automatically
at creation. A poll without an admin code SHALL NOT be gated.

#### Scenario: Creator is not prompted for the code

- GIVEN a visitor who just created a poll with an organizer email
- WHEN they land on the organizer dashboard
- THEN it opens without a code prompt

#### Scenario: New browser must enter the code

- GIVEN a poll with an admin code
- WHEN its organizer link is opened in a browser that never entered the code
- THEN a code prompt is shown
- AND no organizer content is revealed

#### Scenario: Correct code unlocks and is remembered

- GIVEN the code prompt for a poll with an admin code
- WHEN the correct code is entered
- THEN the organizer dashboard opens
- AND revisiting the organizer link in the same browser shows no prompt

#### Scenario: Wrong code is rejected

- GIVEN the code prompt for a poll with an admin code
- WHEN an incorrect code is entered
- THEN an error message in the poll's language is shown
- AND no organizer content is revealed

#### Scenario: Polls without a code stay ungated

- GIVEN a poll that has no admin code
- WHEN its organizer link is opened in any browser
- THEN the organizer dashboard opens directly, with no code prompt
