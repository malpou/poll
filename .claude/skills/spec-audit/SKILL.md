---
name: spec-audit
description: Audit spec.md ↔ .spec.ts ↔ src drift across all spec areas, plus PROJECT.md vs reality. Reports scenarios without tests, tests without scenarios, and spec claims contradicted by code.
disable-model-invocation: true
---

# Spec drift audit

Reconcile every spec three ways: prose (spec.md) ↔ tests (.spec.ts) ↔
implementation (src/). Purely static by default; print one report in chat,
write nothing to disk.

## Procedure

1. Enumerate areas at runtime: `ls specs/*/spec.md`. Never assume the list —
   new areas must be picked up automatically.
2. Fan out with the Workflow tool: one agent per area plus one for
   `specs/PROJECT.md` and one for `specs/DESIGN.md`, all in parallel. Inline
   the just-enumerated area list as a literal in the script (don't rely on
   `args` reaching it). Use this findings schema for every agent:

   ```json
   {
   	"type": "object",
   	"properties": {
   		"area": { "type": "string" },
   		"scenarios_without_tests": {
   			"type": "array",
   			"items": { "type": "string" },
   			"description": "scenario name (requirement name)"
   		},
   		"tests_without_scenarios": {
   			"type": "array",
   			"items": { "type": "string" },
   			"description": "test title (file)"
   		},
   		"spec_contradicted_by_code": {
   			"type": "array",
   			"items": { "type": "string" },
   			"description": "spec claim | evidence: file:line"
   		},
   		"misplaced": {
   			"type": "array",
   			"items": { "type": "string" },
   			"description": "test in this area exercising another area's spec, or vice versa"
   		}
   	},
   	"required": [
   		"area",
   		"scenarios_without_tests",
   		"tests_without_scenarios",
   		"spec_contradicted_by_code",
   		"misplaced"
   	]
   }
   ```

3. Area-agent prompt template:

   > Read `specs/<area>/spec.md`, every `specs/<area>/*.spec.ts`, and the src
   > files implementing the behavior (grep from `src/routes/` and `src/lib/`).
   > Match scenarios to test titles by semantic traceability, NOT string
   > equality — "Scenario: A tie" ↔ "a tie highlights both options" is a
   > match. List only clear orphans. For contradiction findings, quote the
   > spec claim and cite file:line evidence. Also check colocated vitest
   > coverage in `src/**/*.test.ts` before declaring a pure-logic scenario
   > untested.

   PROJECT.md agent: verify stack, security-model, data-model, and route
   claims against `wrangler.*`, `migrations/`, and `src/`.

   DESIGN.md agent: verify look-and-feel claims against the implementation —
   palette/spacing/radius tokens vs `src/app.css` and Tailwind classes in
   `src/lib/components/`, icon conventions vs `@lucide/svelte` usage (names,
   sizes), motion claims (easings, durations, springs, `prefers-reduced-motion`)
   vs transition/animation code. Report both directions: DESIGN.md rules the
   UI violates, and established UI conventions (a repeated color, icon size,
   animation pattern) that DESIGN.md doesn't document yet.

4. Aggregate one markdown report in chat: grouped by area, worst-first, one
   line per finding, ending with a one-paragraph verdict (is specs/ currently
   trustworthy as the source of truth?).
5. Optional runtime leg — only when the user asks: `bun run test:e2e` to
   confirm the suites are green.
