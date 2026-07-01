---
name: plan-issue
description: >
  Turn a GitHub issue into a reviewed implementation plan for the family-date-poll
  app. Give it an issue link or number (e.g. "/plan-issue 3" or a
  github.com/malpou/family-date-poll/issues/N URL) and it enters plan mode, reads
  the issue and the specs it references, inspects the current code, and produces a
  spec-grounded plan that always includes Playwright e2e smoke coverage. Use when
  the user wants to start work on an issue, plan an iteration, or asks "plan issue
  N" / "how should I implement this issue". Planning only — it does not write app
  code; approval happens via ExitPlanMode.
---

# plan-issue

Plan the implementation of one GitHub issue for **malpou/family-date-poll**, then
stop for approval. You produce a plan, not code.

## Input

The user gives an issue link or number. Accept any of:

- `123`
- `#123`
- `https://github.com/malpou/family-date-poll/issues/123`

Extract the number `N`.

## Step 1 — Enter plan mode

Call `EnterPlanMode` immediately. Everything below is read-only until the user
approves via `ExitPlanMode`. Do not edit files (except the plan file the harness
gives you), run migrations, create branches, or push.

## Step 2 — Read the issue

Run: `gh issue view N --json title,body,labels,comments`
Pull out: the scope, the **References** section (which `specs/*` files it cites),
and the **Acceptance** checklist. The acceptance items are your plan's contract —
each must be satisfiable by the plan and covered by a test.

## Step 3 — Read the referenced specs

For every spec named in the issue's References, read the file under `specs/`
(e.g. `specs/event-management/spec.md`, `specs/results/spec.md`). Also skim
`specs/PROJECT.md` (data model, routes, security, conventions) and
`specs/DESIGN.md` (Danish copy table, layout, motion) — they constrain almost
every issue. Treat the spec scenarios (GIVEN/WHEN/THEN) as the behaviors your
plan must implement and your e2e tests must assert.

If the issue and the specs disagree, surface it with `AskUserQuestion` rather
than guessing.

## Step 4 — Understand the current code

Use Explore/Grep/Read (or launch an `Explore` agent for anything broad) to find:

- What already exists that this issue builds on or reuses. Key spots:
  - `src/lib/data/provider.ts` — the `DataProvider` swap point (mock ↔ D1).
  - `src/lib/components/{atoms,molecules,organisms,feedback}` — the atomic library.
  - `src/lib/da.ts` — all Danish strings live here (PROJECT.md convention).
  - `src/lib/types.ts`, `src/routes/` — routes are `/`, `/e/[token]`, `/r/[token]`.
- Reserved names to honor if the issue touches them: `SegmentedControl`
  (the Foretrukket/Kan godt/Kan ikke selector) and `lib/date.ts` (Danish
  lowercase date formatter).
  Reuse before adding. This is a ponytail codebase — the plan should climb the
  ladder (reuse → stdlib → native → one line → minimal new code) and call out
  anything it deliberately does NOT build.

## Step 5 — Write the plan

Write the plan to the plan file with these sections:

- **Context** — what the issue needs and why, in your words, tying it to the specs.
- **Approach** — the recommended implementation only (not every alternative).
  Name the exact files to add/change (routes, form actions, provider methods,
  components, migrations). Reference existing code to reuse with paths.
- **Data / provider** — any `DataProvider` additions or D1 queries/migrations,
  keeping the mock↔D1 swap intact.
- **Danish copy** — new strings go in `src/lib/da.ts`; list them.
- **E2E smoke tests (required)** — the specific Playwright specs under `e2e/`
  that assert this issue's acceptance criteria and the relevant spec scenarios
  (happy path + the notable edge cases: invalid token → friendly not-found,
  unmarked option stays "no answer", end-before-start rejected, tie highlight,
  etc. — whichever the issue touches). Every Acceptance checkbox maps to a test
  or a manual verification line. State how the test seeds data (local D1 helper).
- **Verification** — `bun run check`, `bun run test:e2e`, and a manual
  click-through via the Playwright MCP against the dev/preview server.
- **Out of scope** — what this issue explicitly leaves to other iterations.

Keep it scannable: name files and patterns, don't paste whole implementations.

## Step 6 — Clarify, then hand off

- Use `AskUserQuestion` only for genuine forks the issue/specs don't settle.
- End by calling `ExitPlanMode` with the plan. Do not ask for approval in prose.

## Notes

- Iterations are sequential-ish: iteration 1 (Cloudflare) and 2 (schema/provider)
  underpin the rest. If the issue depends on unfinished earlier work, say so in
  Context and plan against the expected interface.
- Do not create the branch or start coding in this skill — that's the next step
  after the user approves the plan.
