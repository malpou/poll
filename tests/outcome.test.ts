import { describe, it, expect } from 'vitest';
import { buildOutcome } from '../src/lib/results';
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
