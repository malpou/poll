import { describe, it, expect } from 'vitest';
import { buildOutcome, markBest } from '../src/lib/results';
import type { DateOptionResult } from '../src/lib/types';

// buildOutcome drives the participant-facing outcome view on a decided poll
// (specs/poll-closing): per-option counts + percentages, chosen flags, and the
// legacy null for polls closed before decisions existed.

const counts = (rows: DateOptionResult[]) => new Map(rows.map((r) => [r.dateOptionId, r]));

const result = (
	dateOptionId: string,
	preferred: number,
	available: number,
	unavailable: number,
	notAnswered: number
): DateOptionResult => ({ dateOptionId, preferred, available, unavailable, notAnswered });

describe('buildOutcome', () => {
	it('returns null when no option is selected (legacy closed poll)', () => {
		expect(
			buildOutcome([{ id: 'a', selected: false }], counts([result('a', 1, 1, 1, 0)]))
		).toBeNull();
		expect(buildOutcome([], counts([]))).toBeNull();
	});

	it('flags the chosen options and keeps every date in the view', () => {
		const rows = buildOutcome(
			[
				{ id: 'a', selected: false },
				{ id: 'b', selected: true },
				{ id: 'c', selected: true }
			],
			counts([result('a', 1, 0, 2, 0), result('b', 3, 0, 0, 0), result('c', 2, 1, 0, 0)])
		)!;
		expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
		expect(rows.map((r) => r.chosen)).toEqual([false, true, true]);
	});

	it('computes percentages over the full roster, not-answered included', () => {
		// 4 invitees: 2 preferred, 1 available, 0 unavailable, 1 silent.
		const [row] = buildOutcome([{ id: 'a', selected: true }], counts([result('a', 2, 1, 0, 1)]))!;
		expect(row).toMatchObject({
			preferred: 2,
			available: 1,
			unavailable: 0,
			preferredPct: 50,
			availablePct: 25,
			unavailablePct: 0
		});
	});

	it('a date with no responses at all renders as zeros, not NaN', () => {
		const [row] = buildOutcome([{ id: 'a', selected: true }], counts([]))!;
		expect(row).toMatchObject({
			preferred: 0,
			available: 0,
			unavailable: 0,
			preferredPct: 0,
			availablePct: 0,
			unavailablePct: 0
		});
	});
});

// markBest ranks options by weighted net score preferred*1.2 + available -
// unavailable (specs/results Best-option highlight), flagging every row that
// ties the top score.
describe('markBest', () => {
	it('flags the single highest-scoring option', () => {
		const rows = markBest([
			{ id: 'a', preferred: 3, available: 0, unavailable: 2 }, // 1.6
			{ id: 'b', preferred: 2, available: 3, unavailable: 0 }, // 5.4 → best
			{ id: 'c', preferred: 1, available: 0, unavailable: 0 } // 1.2
		]);
		expect(rows.find((r) => r.id === 'b')?.isBest).toBe(true);
		expect(rows.filter((r) => r.isBest)).toHaveLength(1);
	});

	it('highlights every option tying the top score', () => {
		const rows = markBest([
			{ id: 'a', preferred: 1, available: 2, unavailable: 0 }, // 3.2
			{ id: 'b', preferred: 1, available: 2, unavailable: 0 }, // 3.2 → ties a
			{ id: 'c', preferred: 0, available: 1, unavailable: 2 } // -1
		]);
		expect(rows.filter((r) => r.isBest).map((r) => r.id)).toEqual(['a', 'b']);
	});

	it('does not tie a thinly-answered date with well-attended siblings', () => {
		// Regression: all four share unavailable=1, preferred=2, but mardi15 has no
		// available votes (fewer responses) so it must not be flagged best.
		const rows = markBest([
			{ id: 'lundi', preferred: 2, available: 3, unavailable: 1 }, // 4.4
			{ id: 'mardi15', preferred: 2, available: 0, unavailable: 1 }, // 1.4
			{ id: 'mardi18', preferred: 2, available: 3, unavailable: 1 }, // 4.4
			{ id: 'jeudi', preferred: 2, available: 3, unavailable: 1 } // 4.4
		]);
		expect(rows.find((r) => r.id === 'mardi15')?.isBest).toBe(false);
		expect(rows.filter((r) => r.isBest)).toHaveLength(3);
	});

	it('flags nothing on an all-zero board or empty list', () => {
		const zeros = markBest([
			{ id: 'a', preferred: 0, available: 0, unavailable: 0 },
			{ id: 'b', preferred: 0, available: 0, unavailable: 0 }
		]);
		expect(zeros.every((r) => !r.isBest)).toBe(true);
		expect(markBest([])).toHaveLength(0);
	});
});
