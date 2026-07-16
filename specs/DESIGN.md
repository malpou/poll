# Prompt for Claude Design - "Rundvisning i DR Byen" date poll

> Paste everything below into Claude Design. Instructions are in English. The copy
> table lists the Danish strings; the shipped app is multilingual (Danish, English,
> French) with the same strings translated in `messages/{da,en,fr}.json`. Use the
> listed strings for the Danish rendering, don't translate the labels yourself.
>
> Note: this is the original design brief. The app has since gained a second poll
> mode (open / shared link) and per-poll language - see specs/PROJECT.md for the
> current model; the visual direction below still holds.

---

## What to build

A small, warm, mobile-first web UI for collecting preferred dates for a family
**rundvisning (guided tour) at DR Byen** in Copenhagen. One organizer seeds a few
candidate dates; people mark how each date suits them, either via a **personal
link** (assigned mode) or a single **shared link** where they name themselves
(open mode). The organizer sees the aggregate and picks a date. No logins - the
link is the credential.

Screens, in priority order:

1. **Response page** (`/r/{token}`, and `/s/{share_token}` for open mode) - the
   star. Opened on a phone; make it feel personal and effortless. In open mode it
   also asks for the visitor's name.
2. **Results / dashboard** (`/e/{token}`) - organizer sees counts per date and who
   has answered.
3. **Create event** (`/`) - organizer sets title, description, language, poll mode,
   and dates. In assigned mode they add participants (each generating a copyable
   link); in open mode they get one shared link to distribute.

Mobile-first; scale gracefully to desktop for the organizer views.

## Data the UI reflects

- Event: title, description, language, poll mode, list of date options, status
  (open / closed).
- Each date option has one preference per participant: **Foretrukket**,
  **Kan godt**, or **Kan ikke**.
- In assigned mode a participant is one person or group the organizer added (one
  link = one response set); in open mode a participant self-identifies by name
  through the shared link.
- Participant may leave an optional note.

## Visual direction

Clean Nordic minimalism that nods to DR Byen's architecture - the blue-lit cube of
DR Koncerthuset, glass, and pale concrete. (Evoke the mood; this isn't official DR
branding.)

- **Palette:** off-white paper background (`#F7F6F3`-ish), deep architectural blue
  as primary (Koncerthuset blue, roughly `#1B3A7B`→`#274B9E`), soft concrete grays
  for structure, one warm accent for the "Foretrukket" state (a muted amber). Dark
  mode should feel like the cube lit at night: near-black blue ground, luminous
  blue accents.
- **Type:** a clean grotesque sans (Inter, or similar). Large, confident headings;
  comfortable body size for older family members reading on a phone.
- **Layout:** generous whitespace, one column on mobile, restrained corner radius
  (~12px), subtle borders over heavy shadows. Feels calm, not busy.
- Each date option is a card/row with the day-of-week and date shown prominently in
  Danish (e.g. "Lør. 14. mar" / full "lørdag den 14. marts").

## Animation direction (core requirement)

Follow the animations.dev principles. Motion should feel intentional and quiet -
never decorative. Animate **transform and opacity only**. Concrete rules:

- **Enter / exit → ease-out, fast.** Elements fading/rising in use
  `cubic-bezier(0.16, 1, 0.3, 1)`, ~220–260ms, `translateY(8px)→0` + `opacity 0→1`.
  Keep enters snappy; a too-long enter feels sluggish.
- **On-screen movement / reflow → ease-in-out** (e.g. `cubic-bezier(0.32, 0.72, 0, 1)`).
- **Hover / color / focus → `ease`, ~150ms.**
- **The three-state selector is the signature interaction.** Selecting
  Foretrukket / Kan godt / Kan ikke should feel organic - animate the active
  indicator with a **spring** (Framer Motion `type: "spring", stiffness: 420,
damping: 32`, or an equivalent snappy-but-soft feel). Think Dynamic-Island
  smoothness: the highlight glides between the three options, it doesn't cut.
- **Date list entrance → staggered.** Cards fade+rise in with ~40ms between each on
  first load. Orchestrate, don't dump.
- **Submit confirmation → a toast** in the Sonner style: slides up 16px + fades in,
  ease-out ~200ms, auto-dismisses after ~3s.
- **Results bars → animate width on mount** with ease-out (~450ms). When the
  organizer's data re-sorts (best date to top), use a layout/spring transition so
  rows slide to their new position rather than jumping.
- **Accessibility:** honor `prefers-reduced-motion` - drop transforms and stagger,
  keep only near-instant opacity fades. No motion should block interaction.
- Don't animate anything a user sees dozens of times per session (no animating on
  every keystroke, no looping effects).

Pages are server-rendered and the client carries only HTMX and Alpine, so keep
animations achievable with CSS transitions and Alpine's own transition helpers -
nothing that depends on a heavy 3D or canvas library.

## Screen details

**Response page (mobile, primary):**

- Header: event title, a short intro line, and a personal greeting using the
  participant's name.
- A list of date cards. Each card shows the date and a three-option segmented
  control (Foretrukket / Kan godt / Kan ikke) with the animated spring highlight.
- Optional note field below the list.
- Sticky "Send svar" button; on submit, show the success toast and a calm
  confirmation state ("Tak! Dit svar er gemt." + that they can still change it).
- Closed state: everything read-only with a "Afstemningen er lukket" banner.
- Invalid link: a friendly full-screen "Linket findes ikke" state.

**Results / dashboard (organizer):**

- One "who answered" summary under the Results heading (assigned: "X af Y har
  svaret"; open: "X har svaret").
- Per date: a row with the date and three animated count bars (Foretrukket / Kan
  godt / Kan ikke). Best date highlighted at top with a "Bedste dato" badge.
- A participant list: assigned mode shows who has answered and who is "Mangler at
  svare"; open mode lists the submitters (read-only) plus the shared link at the top.
- Controls: language + mode (shown as text, edited in the details Edit→Save block);
  "Luk afstemning" / "Åbn afstemning igen".

**Create event (organizer):**

- Fields: Titel, Beskrivelse, Sprog (language), poll mode, then a repeatable
  "Mulige datoer" list with "Tilføj dato".
- Assigned mode: a "Deltagere" section to add each participant by name; each row
  shows a "Kopiér link" button (copying triggers a "Linket er kopieret" toast).
  Open mode hides this - one shared link is distributed instead.

## Danish copy - use these exact strings

These are the Danish (`messages/da.json`) strings; English and French equivalents
live in `messages/en.json` / `messages/fr.json`. Open mode adds a few more (shared
link, name prompt, edit link) - see the message files for the full set.

| Context                          | Danish string                                                     |
| -------------------------------- | ----------------------------------------------------------------- |
| App / event title (example)      | Rundvisning i DR Byen                                             |
| Event description (example)      | Vi mødes ved hovedindgangen til DR Byen. Turen tager ca. en time. |
| Response page intro              | Vælg de datoer, der passer dig bedst                              |
| Greeting                         | Hej {navn}                                                        |
| Section heading on response page | Hvordan passer datoerne dig?                                      |
| State: preferred                 | Foretrukket                                                       |
| State: available                 | Kan godt                                                          |
| State: unavailable               | Kan ikke                                                          |
| Note label                       | Bemærkning (valgfri)                                              |
| Note placeholder                 | Fx: Jeg kan ikke om morgenen                                      |
| Submit button                    | Send svar                                                         |
| Success toast                    | Tak! Dit svar er gemt.                                            |
| Success subtext                  | Du kan ændre dit svar, indtil afstemningen lukker.                |
| Closed banner                    | Afstemningen er lukket                                            |
| Invalid link                     | Linket findes ikke                                                |
| Create page title                | Opret afstemning                                                  |
| Field: title                     | Titel                                                             |
| Field: description               | Beskrivelse                                                       |
| Dates section                    | Mulige datoer                                                     |
| Add date                         | Tilføj dato                                                       |
| Field: start time                | Starttid                                                          |
| Field: end time                  | Sluttid                                                           |
| Participants section             | Deltagere                                                         |
| Add participant                  | Tilføj deltager                                                   |
| Field: name                      | Navn                                                              |
| Copy link button                 | Kopiér link                                                       |
| Link copied toast                | Linket er kopieret                                                |
| Dashboard title                  | Oversigt                                                          |
| Results section                  | Resultater                                                        |
| Best date badge                  | Bedste dato                                                       |
| Pending status                   | Mangler at svare                                                  |
| Answered status                  | Har svaret                                                        |
| Close poll                       | Luk afstemning                                                    |
| Reopen poll                      | Åbn afstemning igen                                               |

Weekday/month rendering should be Danish (lørdag, søndag, marts, etc.), lowercase
as is conventional in Danish.

## Out of scope

No login screens, no email-sending UI (links are copied and sent by the organizer),
no account settings. Keep it to the three screens above.
