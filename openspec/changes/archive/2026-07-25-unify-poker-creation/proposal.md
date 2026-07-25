## Why

Planning poker ships as a working capability that nothing links to: the site's
landing page pitches only the async polls, and rooms are created on a separate,
non-indexed page reachable only by typing its URL. A visitor has no way to
discover the tool exists. Planning poker is also the one capability that never
renders in the visitor's language — rooms always fall back to the base locale,
even though every string is already translated into all five.

## What Changes

- The landing page presents planning poker as a **sibling tool**, not a sixth
  poll type: its own section leading the page body — above the poll examples,
  badged as new, since nobody arrives looking for it — in the tool's own fixed
  highlighter (so the landing highlighter picker leaves it alone), with a short
  non-persisting example of the reveal and its own call-to-action.
- Room creation moves onto the **same create page as polls**, behind a
  first-choice "what are you making" between a poll and a planning-poker room.
  Picking the room reduces the form to a room name; picking a poll leaves
  today's form untouched.
- **BREAKING (URL):** the standalone room-creation page is removed outright. It
  was never released, never linked, and never indexed, so there is no link in
  the wild to preserve.
- Room creation becomes **indexable** like poll creation; the controller and
  join pages stay non-indexable like every other token page.
- A room **records the language chosen when it was created** and renders in it
  for everyone who joins — the controller console, the join page, and the
  results log.

Three defects found while putting the tool in front of visitors, fixed here
because the landing page is about to advertise it:

- **Reveal no longer cuts a round short.** It is held until every estimator
  present has voted, and the room names who it is waiting on. Observers and
  dropped-out seats never hold it up.
- **The recorded estimate stays inside what the room voted.** Only the deck
  numerals between the lowest and highest card cast are offered, so a round
  that split 3/8 cannot be recorded as 40.
- **Enter submits the room's text fields.** Naming yourself, naming yourself as
  an estimating controller, and naming the next item were all mouse-only.

## Capabilities

### New Capabilities

None. Both affected areas already have specs.

### Modified Capabilities

- `landing-page`: new requirement for the planning-poker section and its
  example; the indexability requirement extends to name room creation
  (indexable) and the room's token pages (not).
- `planning-poker`: the create-a-room requirement moves creation onto the
  shared create page behind an explicit choice, and gains room language —
  chosen at creation, rendered for every participant.

## Impact

- Landing page and create page: a new section, a new first choice, and the
  copy for both in all five languages.
- Room storage gains a language column; a new migration, additive, nothing to
  backfill (existing rooms read as the base locale).
- The standalone room-creation route is removed.
- Colocated Playwright suites for both capabilities grow; the poker suite's
  room seeding gains the new column.
- Deployment note, outside this change: planning poker is not live — the
  capability has never been released to production and the remote database has
  never had the planning-poker migration applied.
