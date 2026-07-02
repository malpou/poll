import type { DataProvider } from '$lib/data/provider';
import type { DateOptionResult, DateOptionRow, EventRow } from '$lib/types';

// Best-option ranking (specs/results/spec.md): weighted net score
// preferred*2 + available - unavailable, highest wins. Counting available stops
// a thinly-answered date from tying well-attended ones. Ties on the same score
// → every matching row is flagged best, leaving the final call to the organizer.

export function markBest<T extends { preferred: number; available: number; unavailable: number }>(
	rows: T[]
): (T & { isBest: boolean })[] {
	const score = (r: T) => r.preferred * 2 + r.available - r.unavailable;
	const sorted = [...rows].sort((a, b) => score(b) - score(a));
	// No highlight until at least one response exists - otherwise an all-zero
	// board ties every row on score=0 and marks them all "best".
	const anyAnswered = sorted.some((r) => r.preferred + r.available + r.unavailable > 0);
	const top = sorted[0];
	return sorted.map((r) => ({
		...r,
		isBest: anyAnswered && score(r) === score(top)
	}));
}

// Outcome view for a decided poll (specs/poll-closing): per-option counts and
// percentages shown to participants after close. Null when no option is
// selected - polls closed before decisions existed render as plain closed.
// Percentage denominator is that option's full roster (answered + not), the
// same basis the organizer dashboard uses.
export interface OutcomeRow {
	id: string;
	chosen: boolean;
	preferred: number;
	available: number;
	unavailable: number;
	preferredPct: number;
	availablePct: number;
	unavailablePct: number;
}

export function buildOutcome(
	options: { id: string; selected: boolean }[],
	counts: Map<string, DateOptionResult>
): OutcomeRow[] | null {
	if (!options.some((o) => o.selected)) return null;
	return options.map((o) => {
		const c = counts.get(o.id) ?? { preferred: 0, available: 0, unavailable: 0, notAnswered: 0 };
		const total = c.preferred + c.available + c.unavailable + c.notAnswered;
		const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
		return {
			id: o.id,
			chosen: o.selected,
			preferred: c.preferred,
			available: c.available,
			unavailable: c.unavailable,
			preferredPct: pct(c.preferred),
			availablePct: pct(c.available),
			unavailablePct: pct(c.unavailable)
		};
	});
}

// The /r and /s loads both surface a decided poll's outcome the same way:
// only when closed, pulling counts fresh. Kept here so both routes stay a
// one-liner.
export async function outcomeFor(
	provider: Pick<DataProvider, 'getResults'>,
	event: Pick<EventRow, 'id' | 'status'>,
	dateOptions: Pick<DateOptionRow, 'id' | 'selected'>[]
): Promise<OutcomeRow[] | null> {
	if (event.status !== 'closed') return null;
	const results = await provider.getResults(event.id);
	return buildOutcome(dateOptions, new Map(results.map((r) => [r.dateOptionId, r])));
}

// Assert-based self-check, no test framework needed. Run directly with the runtime.
function demo() {
	const clearWinner = markBest([
		{ id: 'a', preferred: 3, available: 0, unavailable: 2 }, // score 4
		{ id: 'b', preferred: 2, available: 3, unavailable: 0 }, // score 7 → best
		{ id: 'c', preferred: 1, available: 0, unavailable: 0 } // score 2
	]);
	console.assert(clearWinner.find((r) => r.id === 'b')?.isBest === true, 'b should win');
	console.assert(clearWinner.filter((r) => r.isBest).length === 1, 'one clear winner');

	const tie = markBest([
		{ id: 'a', preferred: 2, available: 0, unavailable: 1 }, // score 3
		{ id: 'b', preferred: 1, available: 2, unavailable: 0 }, // score 3 → ties a
		{ id: 'c', preferred: 5, available: 0, unavailable: 3 } // score 7
	]);
	console.assert(tie.find((r) => r.id === 'c')?.isBest === true, 'c wins outright');
	console.assert(tie.filter((r) => r.isBest).length === 1, 'no false tie');

	// Screenshot regression: a low-response date (score 3) must NOT tie the
	// well-attended siblings (score 6) just because unavailable/preferred match.
	const uneven = markBest([
		{ id: 'lundi', preferred: 2, available: 3, unavailable: 1 }, // score 6
		{ id: 'mardi15', preferred: 2, available: 0, unavailable: 1 }, // score 3
		{ id: 'mardi18', preferred: 2, available: 3, unavailable: 1 }, // score 6
		{ id: 'jeudi', preferred: 2, available: 3, unavailable: 1 } // score 6
	]);
	console.assert(uneven.find((r) => r.id === 'mardi15')?.isBest === false, 'low-response not best');
	console.assert(uneven.filter((r) => r.isBest).length === 3, 'three well-attended dates tie');

	const noAnswers = markBest([
		{ id: 'a', preferred: 0, available: 0, unavailable: 0 },
		{ id: 'b', preferred: 0, available: 0, unavailable: 0 }
	]);
	console.assert(
		noAnswers.every((r) => !r.isBest),
		'no responses → no highlight'
	);

	console.assert(markBest([]).length === 0, 'empty list, no highlight');
	console.log('results.ts self-check passed');
}

if (import.meta.main) demo();
