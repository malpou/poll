# pro-tier Delta

> Depends on the `pro-poll-upgrade` change landing first — it creates the
> `pro-tier` capability and the free/Pro tier this requirement keys on.

## ADDED Requirements

### Requirement: Post-answer prompt invites creating your own poll

A free poll's answer confirmation SHALL include a prompt, in the poll's
language, inviting the participant to create their own poll and linking to
the landing page in that language. It SHALL appear after a participant
submits or updates their answer, on both respondent links and the open-mode
shared link. Pro polls SHALL NOT show the prompt.

#### Scenario: Prompt after answering a free poll

- GIVEN a free poll with an invitee
- WHEN the invitee submits their answer
- THEN the confirmation view invites them to create their own poll
- AND the invitation links to the landing page in the poll's language

#### Scenario: Prompt after answering via the shared link

- GIVEN a free open-mode poll
- WHEN a visitor names themselves and submits through the `/s` link
- THEN the confirmation view shows the same invitation

#### Scenario: No prompt on a Pro poll

- GIVEN a Pro poll with an invitee
- WHEN the invitee submits their answer
- THEN no create-your-own invitation is shown
