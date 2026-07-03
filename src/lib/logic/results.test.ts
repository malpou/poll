import { describe, it, expect } from 'vitest';
import { buildOutcome, markBest, markBestRank, markBestStrokes, rankFillPct } from './results';
import type { DateOptionResult } from '../types';

// buildOutcome drives the participant-facing outcome view on a decided poll
// (openspec/specs/poll-closing): per-option counts + percentages, chosen flags, and the
// legacy null for polls closed before decisions existed.

const counts = (rows: DateOptionResult[]) => new Map(rows.map((r) => [r.dateOptionId, r]));

const result = (
	dateOptionId: string,
	preferred: number,
	available: number,
	unavailable: number,
	notAnswered: number,
	unsure = 0
): DateOptionResult => ({
	dateOptionId,
	preferred,
	available,
	unavailable,
	unsure,
	notAnswered,
	valueSum: 0,
	valueCount: 0,
	firstPlaces: 0
});

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
		// Ranked like the organizer's results view: b 3.6, c 3.4, a -0.8.
		expect(rows.map((r) => r.id)).toEqual(['b', 'c', 'a']);
		expect(rows.map((r) => r.chosen)).toEqual([true, true, false]);
	});

	it('orders the rows by the organizer ranking, ties keeping option order', () => {
		const rows = buildOutcome(
			[
				{ id: 'a', selected: false },
				{ id: 'b', selected: true },
				{ id: 'c', selected: false }
			],
			// a and c tie on score 1.0; b outranks both. Ties must not swap a/c.
			counts([result('a', 0, 1, 0, 0), result('b', 1, 1, 0, 0), result('c', 0, 1, 0, 0)])
		)!;
		expect(rows.map((r) => r.id)).toEqual(['b', 'a', 'c']);
	});

	it('carries unsure counts so the outcome can show the enabled choices', () => {
		const [row] = buildOutcome(
			[{ id: 'a', selected: true }],
			counts([result('a', 0, 2, 1, 0, 3)])
		)!;
		expect(row.unsure).toBe(3);
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

	it('keeps unsure answers in the percentage denominator', () => {
		// 4 invitees: 2 preferred, 1 unsure, 1 silent - preferred is 50%, not 66%.
		const [row] = buildOutcome(
			[{ id: 'a', selected: true }],
			counts([result('a', 2, 0, 0, 1, 1)])
		)!;
		expect(row.preferredPct).toBe(50);
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
// unavailable (openspec/specs/results Best-option highlight), flagging every row that
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

	it('unsure carries no weight and does not sway the ranking', () => {
		// Identical preferred/available/unavailable; b also has unsure answers.
		const rows = markBest([
			{ id: 'a', preferred: 1, available: 2, unavailable: 0, unsure: 0 },
			{ id: 'b', preferred: 1, available: 2, unavailable: 0, unsure: 3 }
		]);
		expect(
			rows
				.filter((r) => r.isBest)
				.map((r) => r.id)
				.sort()
		).toEqual(['a', 'b']);
	});

	it('an all-unsure board still yields no highlight', () => {
		const rows = markBest([
			{ id: 'a', preferred: 0, available: 0, unavailable: 0, unsure: 2 },
			{ id: 'b', preferred: 0, available: 0, unavailable: 0, unsure: 1 }
		]);
		expect(rows.every((r) => !r.isBest)).toBe(true);
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

// markBestRank scores by Borda position sums (lower wins), ties broken by
// first-place count (openspec/specs/rank-poll Rank results).
describe('markBestRank', () => {
	const row = (id: string, valueSum: number, valueCount: number, firstPlaces: number) => ({
		id,
		valueSum,
		valueCount,
		firstPlaces
	});

	it('orders options by position sum, lowest first, and flags the best', () => {
		// Ballots A,B,C and B,A,C: A=3, B=3... use A,B,C + A,C,B: A=2, B=5, C=5.
		const rows = markBestRank([row('b', 5, 2, 0), row('a', 2, 2, 2), row('c', 5, 2, 0)]);
		expect(rows[0].id).toBe('a');
		expect(rows[0].isBest).toBe(true);
		expect(rows.filter((r) => r.isBest)).toHaveLength(1);
	});

	it('breaks a score tie by first-place count', () => {
		// A and B both sum 3 across two ballots; A took first place twice.
		const rows = markBestRank([row('b', 3, 2, 0), row('a', 3, 2, 2)]);
		expect(rows.map((r) => r.id)).toEqual(['a', 'b']);
		expect(rows[0].isBest).toBe(true);
		expect(rows[1].isBest).toBe(false);
	});

	it('flags nothing and keeps the incoming order with no ballots', () => {
		const rows = markBestRank([row('a', 0, 0, 0), row('b', 0, 0, 0)]);
		expect(rows.map((r) => r.id)).toEqual(['a', 'b']);
		expect(rows.every((r) => !r.isBest)).toBe(true);
	});
});

// markBestStrokes totals strokes, most wins; ties are all highlighted
// (openspec/specs/highlight-poll Stroke results).
describe('markBestStrokes', () => {
	it('orders options by stroke totals and flags the leader', () => {
		const rows = markBestStrokes([
			{ id: 'b', valueSum: 2 },
			{ id: 'a', valueSum: 5 }
		]);
		expect(rows.map((r) => r.id)).toEqual(['a', 'b']);
		expect(rows[0].isBest).toBe(true);
		expect(rows[1].isBest).toBe(false);
	});

	it('highlights every option tied for most strokes', () => {
		const rows = markBestStrokes([
			{ id: 'a', valueSum: 3 },
			{ id: 'b', valueSum: 3 },
			{ id: 'c', valueSum: 1 }
		]);
		expect(rows.filter((r) => r.isBest).map((r) => r.id)).toEqual(['a', 'b']);
	});

	it('flags nothing when no strokes are spent', () => {
		const rows = markBestStrokes([
			{ id: 'a', valueSum: 0 },
			{ id: 'b', valueSum: 0 }
		]);
		expect(rows.every((r) => !r.isBest)).toBe(true);
	});
});

// rankFillPct maps a rank option's average position to a bar fill: first
// place fills it, last place empties it, linear in between.
describe('rankFillPct', () => {
	it('fills full at first place and empty at last', () => {
		expect(rankFillPct(1, 3)).toBe(100);
		expect(rankFillPct(3, 3)).toBe(0);
	});

	it('scales linearly between the ends', () => {
		expect(rankFillPct(1.3, 3)).toBe(85);
		expect(rankFillPct(1.7, 3)).toBe(65);
		expect(rankFillPct(2, 3)).toBe(50);
	});

	it('fills nothing with no ballots or a single option', () => {
		expect(rankFillPct(null, 3)).toBe(0);
		expect(rankFillPct(1, 1)).toBe(0);
	});
});
