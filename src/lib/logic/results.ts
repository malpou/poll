import type { DataProvider } from '$lib/data/provider';
import type { DateOptionResult, DateOptionRow, EventRow, PollType } from '$lib/types';

/**
 * Ranks options by weighted net score (openspec/specs/results/spec.md):
 * `preferred*1.2 + available - unavailable`, highest wins. Counting available
 * stops a thinly-answered date from tying well-attended ones. Ties on the same
 * score flag every matching row as best, leaving the final call to the organizer.
 * Unsure ("I don't know") is deliberately absent: stated ignorance carries
 * weight 0, so it can never sway the highlight either way.
 */
const score = (r: { preferred: number; available: number; unavailable: number }) =>
	r.preferred * 1.2 + r.available - r.unavailable;

/**
 * Bar fill (0-100) for a rank option's average position, mirroring the
 * highlight bar: first place (avg 1) fills the bar, last place (avg N) empties
 * it, linearly in between. Null (no ballots) and the single-option edge case
 * fill nothing.
 */
export function rankFillPct(avgPosition: number | null, optionCount: number): number {
	if (avgPosition === null || optionCount < 2) return 0;
	return Math.round(((optionCount - avgPosition) / (optionCount - 1)) * 100);
}

export function markBest<T extends { preferred: number; available: number; unavailable: number }>(
	rows: T[]
): (T & { isBest: boolean })[] {
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

/**
 * Rank scoring (openspec/specs/rank-poll): Borda - the sum of positions an
 * option received, lower wins; ties break on first-place count. With no
 * ballots every option ties at 0 and nothing is highlighted (the stable sort
 * keeps the organizer's order).
 */
export function markBestRank<
	T extends { valueSum: number; valueCount: number; firstPlaces: number }
>(rows: T[]): (T & { isBest: boolean })[] {
	const sorted = [...rows].sort((a, b) => a.valueSum - b.valueSum || b.firstPlaces - a.firstPlaces);
	const anyBallots = sorted.some((r) => r.valueCount > 0);
	const top = sorted[0];
	return sorted.map((r) => ({
		...r,
		isBest: anyBallots && r.valueSum === top.valueSum && r.firstPlaces === top.firstPlaces
	}));
}

/**
 * Highlight scoring (openspec/specs/highlight-poll): total strokes, most wins;
 * options tied for most are all highlighted. All-zero boards highlight nothing.
 */
export function markBestStrokes<T extends { valueSum: number }>(
	rows: T[]
): (T & { isBest: boolean })[] {
	const sorted = [...rows].sort((a, b) => b.valueSum - a.valueSum);
	const anyStrokes = sorted.some((r) => r.valueSum > 0);
	const top = sorted[0];
	return sorted.map((r) => ({
		...r,
		isBest: anyStrokes && r.valueSum === top.valueSum
	}));
}

// Outcome view for a decided poll (openspec/specs/poll-closing): per-option counts and
// percentages shown to participants after close, mirroring the organizer's
// results view - same rank order, counts per enabled choice, never names.
// Null when no option is selected - polls closed before decisions existed
// render as plain closed. Percentage denominator is that option's full roster
// (answered + not), the same basis the organizer dashboard uses.
export interface OutcomeRow {
	id: string;
	chosen: boolean;
	preferred: number;
	available: number;
	unavailable: number;
	unsure: number;
	preferredPct: number;
	availablePct: number;
	unavailablePct: number;
	// Value summaries for rank/highlight outcomes (zeros on preference types):
	// Borda sum / stroke total, ballot count, and highlight's share of all
	// strokes for the proportional bar.
	valueSum: number;
	valueCount: number;
	sharePct: number;
}

export function buildOutcome(
	options: { id: string; selected: boolean }[],
	counts: Map<string, DateOptionResult>,
	pollType: PollType = 'dates'
): OutcomeRow[] | null {
	if (!options.some((o) => o.selected)) return null;
	const allStrokes = [...counts.values()].reduce((a, c) => a + c.valueSum, 0);
	const rows = options.map((o) => {
		const c = counts.get(o.id) ?? {
			preferred: 0,
			available: 0,
			unavailable: 0,
			unsure: 0,
			notAnswered: 0,
			valueSum: 0,
			valueCount: 0,
			firstPlaces: 0
		};
		// unsure answers are part of the roster, so they stay in the denominator
		// even though the outcome view has no unsure bar.
		const total = c.preferred + c.available + c.unavailable + c.unsure + c.notAnswered;
		const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
		const avgPosition = c.valueCount ? c.valueSum / c.valueCount : null;
		return {
			id: o.id,
			chosen: o.selected,
			preferred: c.preferred,
			available: c.available,
			unavailable: c.unavailable,
			unsure: c.unsure,
			preferredPct: pct(c.preferred),
			availablePct: pct(c.available),
			unavailablePct: pct(c.unavailable),
			valueSum: c.valueSum,
			valueCount: c.valueCount,
			firstPlaces: c.firstPlaces,
			// The value bar's fill: highlight by stroke share, rank by how close
			// the average position is to first place.
			sharePct:
				pollType === 'rank'
					? rankFillPct(avgPosition, options.length)
					: allStrokes
						? Math.round((c.valueSum / allStrokes) * 100)
						: 0
		};
	});
	// Same order as the organizer's results view; sorts are stable, so ties
	// keep the poll's option order.
	if (pollType === 'rank')
		return rows.sort((a, b) => a.valueSum - b.valueSum || b.firstPlaces - a.firstPlaces);
	if (pollType === 'highlight') return rows.sort((a, b) => b.valueSum - a.valueSum);
	return rows.sort((a, b) => score(b) - score(a));
}

/**
 * Surfaces a decided poll's outcome for the /r and /s loads the same way: only
 * when closed, pulling counts fresh. Kept here so both routes stay a one-liner.
 */
export async function outcomeFor(
	provider: Pick<DataProvider, 'getResults'>,
	event: Pick<EventRow, 'id' | 'status' | 'pollType'>,
	dateOptions: Pick<DateOptionRow, 'id' | 'selected'>[]
): Promise<OutcomeRow[] | null> {
	if (event.status !== 'closed') return null;
	const results = await provider.getResults(event.id);
	return buildOutcome(
		dateOptions,
		new Map(results.map((r) => [r.dateOptionId, r])),
		event.pollType
	);
}
