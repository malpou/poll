## Context

Planning poker landed as a self-contained capability: its own tables, its own
provider, its own routes under `/poker`, its own fixed blue accent. Nothing
links to it. `/poker/new` carries `noindex` and is reachable only by typing the
URL, so in practice the capability is invisible.

Two structural facts drive this design:

- **Poker shares no field with a poll.** No options, no invitees, no timezone,
  no answering mode, no choice toggles, no highlighter. It writes to different
  tables through a different provider. The only field in common is a title.
- **Poker has no locale.** `poker_rooms` has no locale column, and `/poker/*`
  has no `[[lang=locale]]` segment, so `hooks.server` falls back to the base
  locale and every room renders in English — even though all 49 poker strings
  are already translated into all five languages.

The second fact is latent today but becomes visible the moment creation moves
onto the localized create page: a visitor would pick Dansk, fill in a Danish
form, and land on an English console.

## Goals / Non-Goals

**Goals:**

- Planning poker is discoverable from the landing page and reads as a sibling
  tool, not a sixth poll type.
- One create page for both tools, sharing the same chrome, so the two look and
  feel like one product.
- A room renders in the language it was created in.
- No regression to poll creation — the existing form is untouched behind the
  choice.

**Non-Goals:**

- Merging poker into the events data model. `poll_type` stays a five-value
  enum; poker keeps its own tables and provider.
- Making the landing example a real multi-player demo. It is a one-tap reveal
  toy, the same class of thing as the existing poll examples.
- Changing the room's fixed accent, the deck, or any live-session behavior.
- Shipping planning poker to production. That is a separate release step (see
  Migration Plan).

## Decisions

**A chooser on the create page, not a sixth poll type.** The two candidates
were making `poker` a value in `POLL_TYPES` alongside the five poll types, or
branching above the poll form. The poll type picker's contract is "the type
decides what the rest of the form asks for" — but every poll type still asks
for options, a mode, participants, and a highlighter, and poker asks for none
of them. Adding it there would thread a dead branch through the type union,
the form-boundary validator, the create action, and the events table's
`poll_type` column, for a value that never reaches that table. Branching one
level above keeps the poll form and its validation exactly as they are and
keeps poker's insert on its own provider. Cost: one more decision before the
form, on a page whose first control is already a radio group — the shape is
familiar, so the added step is cheap.

**The choice rides a query parameter, not a separate route.** Keeping both
flows on `/[[lang=locale]]/create` is what buys poker the language segment,
the hreflang alternates, the browser-language hint, and the indexability that
poll creation already has. The choice is reflected in the URL the same way the
highlighter already is, so a "start a room" link is just the create page with a
query - which is what the landing call-to-action points at. The standalone
`/poker/new` is deleted rather than redirected: it was never released, linked,
or indexed, so there is no link in the wild it would rescue. Two form actions
on one page — the existing poll action and a room action — rather than one
action that branches, so neither validator has to know about the other's
fields.

**Room language is a column, not a URL segment.** The alternative was giving
`/poker/*` its own `[[lang=locale]]` segment. That fails for the join link: the
controller shares one URL with the whole team, and a language baked into the
path would be a language the _controller's browser_ chose, not the room's.
Storing the locale on the room and calling the existing request-locale hook
from each poker load mirrors exactly how a poll's locale already works — the
poll's language comes from its row, not its URL — so poker stops being the
odd one out. The column is additive with a base-locale default; existing rows
read as English with nothing to backfill.

**Planning poker leads the landing body.** The poll examples are what a visitor
came for and will find regardless; planning poker is the capability nobody is
searching for, so burying it under five example cards would keep it invisible
in a new way. It sits directly under the poll call-to-action, badged as new,
between solid rules — a harder break than the dashed rule the poll sections
use, because the thing below it is a different tool.

**The landing section keeps its own accent.** The landing page's highlighter
picker restyles the whole page through `data-accent`. Poker's accent is fixed
by DESIGN.md. Scoping `data-accent="blue"` to the poker section makes the
picker's reach stop at the section boundary — which is the point: the visual
break is what tells a visitor this is a different tool. Consequence: the
poker call-to-action must not carry the `?accent=` query the poll one does.
This is a new design rule (an accent island inside an accent-picking page) and
lands in DESIGN.md with this change.

**The example is a reveal, not a round.** Poker's signature interaction per
DESIGN.md is the synchronized reveal, and it is the one part of the tool that
reads in a single tap: four face-down cards turn face-up together and an
agreement read-out appears. Simulating a full round — join, name yourself,
vote, reveal — would be a second implementation of the live client for a toy.
The example reuses the existing card and signal surfaces so it stays correct
by construction if either changes.

## Risks / Trade-offs

- **The create page grows a second decision before the first field.** →
  The choice reuses the radio-card pattern the poll type picker already
  established, and the poll branch is pre-selected, so the poll flow costs one
  glance and no clicks.
- **Landing page grows a fifth concern (pitch, poker, examples, pickers,
  hint).** → The poker section leads the body behind solid rules on both sides,
  so it reads as a separate tool rather than a poll section; the hero pitch and
  poll call-to-action above it are untouched.
- **Poker strings now render in five languages for the first time in a real
  flow.** They were translated but never exercised, so this change is where any
  bad translation or overflowing label surfaces. → The colocated suite covers
  the console in a non-base language.

## Migration Plan

1. Additive migration adds the room language column, defaulting to the base
   locale. Existing rooms keep working and render in English.
2. Rollback is a redeploy of the previous Worker; the extra column is inert to
   older code.

Separately, and outside this change: **planning poker has never been released.**
`main` contains no poker files, so production serves 404 for every `/poker`
URL, and the remote database has never had the planning-poker migration
applied. Going live is merge → apply migrations remotely → deploy, and it must
happen before or with this change, or the landing page will advertise a tool
that 404s.

## Open Questions

- Should the results log of a closed room be indexable? Out of scope here — it
  stays a token page, non-indexable with the rest.
