import type { DataProvider } from '$lib/data/provider';
import type { DateOptionResult, DateOptionRow, EventRow } from '$lib/types';

/**
 * Ranks options by weighted net score (specs/results/spec.md):
 * `preferred*1.2 + available - unavailable`, highest wins. Counting available
 * stops a thinly-answered date from tying well-attended ones. Ties on the same
 * score flag every matching row as best, leaving the final call to the organizer.
 */
export function markBest<T extends { preferred: number; available: number; unavailable: number }>(
	rows: T[]
): (T & { isBest: boolean })[] {
	const score = (r: T) => r.preferred * 1.2 + r.available - r.unavailable;
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

/**
 * Surfaces a decided poll's outcome for the /r and /s loads the same way: only
 * when closed, pulling counts fresh. Kept here so both routes stay a one-liner.
 */
export async function outcomeFor(
	provider: Pick<DataProvider, 'getResults'>,
	event: Pick<EventRow, 'id' | 'status'>,
	dateOptions: Pick<DateOptionRow, 'id' | 'selected'>[]
): Promise<OutcomeRow[] | null> {
	if (event.status !== 'closed') return null;
	const results = await provider.getResults(event.id);
	return buildOutcome(dateOptions, new Map(results.map((r) => [r.dateOptionId, r])));
}
