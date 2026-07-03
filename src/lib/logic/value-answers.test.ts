import { describe, it, expect } from 'vitest';
import { parseHighlightAnswers, parseRankAnswers } from './value-answers';

// The rank/highlight submission trust boundary: crafted partial, duplicate,
// over-budget, negative, and stale submissions must all come back null
// (openspec/specs/rank-poll + highlight-poll rejection scenarios).

const form = (entries: Record<string, string>) => {
	const f = new FormData();
	for (const [k, v] of Object.entries(entries)) f.set(`value.${k}`, v);
	return f;
};

describe('parseRankAnswers', () => {
	const ids = ['a', 'b', 'c'];

	it('accepts a full permutation and fills value + filler preference', () => {
		const answers = parseRankAnswers(form({ a: '2', b: '1', c: '3' }), ids)!;
		expect(answers).toHaveLength(3);
		expect(answers.find((x) => x.dateOptionId === 'b')).toMatchObject({
			preference: 'available',
			value: 1
		});
	});

	it('rejects duplicate positions', () => {
		expect(parseRankAnswers(form({ a: '1', b: '1', c: '3' }), ids)).toBeNull();
	});

	it('rejects a partial order (missing option = stale form)', () => {
		expect(parseRankAnswers(form({ a: '1', b: '2' }), ids)).toBeNull();
	});

	it('rejects positions outside 1..N', () => {
		expect(parseRankAnswers(form({ a: '0', b: '1', c: '2' }), ids)).toBeNull();
		expect(parseRankAnswers(form({ a: '1', b: '2', c: '4' }), ids)).toBeNull();
	});

	it('rejects non-integer garbage', () => {
		expect(parseRankAnswers(form({ a: '1', b: '2', c: 'x' }), ids)).toBeNull();
		expect(parseRankAnswers(form({ a: '1', b: '2', c: '-3' }), ids)).toBeNull();
	});
});

describe('parseHighlightAnswers', () => {
	const ids = ['a', 'b', 'c'];

	it('accepts strokes within budget, zeros included', () => {
		const answers = parseHighlightAnswers(form({ a: '3', b: '2', c: '0' }), ids, 5)!;
		expect(answers.map((x) => x.value)).toEqual([3, 2, 0]);
	});

	it('rejects over-budget totals', () => {
		expect(parseHighlightAnswers(form({ a: '3', b: '3', c: '0' }), ids, 5)).toBeNull();
	});

	it('rejects negative counts', () => {
		expect(parseHighlightAnswers(form({ a: '-1', b: '3', c: '0' }), ids, 5)).toBeNull();
	});

	it('rejects an empty answer (no strokes spent)', () => {
		expect(parseHighlightAnswers(form({ a: '0', b: '0', c: '0' }), ids, 5)).toBeNull();
	});

	it('rejects a stale form missing a current option', () => {
		expect(parseHighlightAnswers(form({ a: '1', b: '1' }), ids, 5)).toBeNull();
	});
});
