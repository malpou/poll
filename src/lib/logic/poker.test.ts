import { describe, it, expect } from 'vitest';
import { agreementSignal, voteDistribution, isCard, isSpecialCard, NUMERIC_DECK } from './poker';

// The reveal-time agreement signal (openspec/specs/planning-poker "Agreement
// signal" + "Special cards"): agree / close / spread by deck-index span, with
// infinity forcing a spread, coffee raising an advisory break hint, and only
// agree pre-filling a suggestion.

describe('agreementSignal', () => {
	it('agrees when every numeric vote is the same card and pre-fills it', () => {
		const s = agreementSignal([5, 5, 5]);
		expect(s.level).toBe('agree');
		expect(s.suggestion).toBe(5);
		expect(s.hasInfinity).toBe(false);
		expect(s.needsBreak).toBe(false);
	});

	it('is close on two adjacent deck cards, with no suggestion', () => {
		// 3 and 5 are adjacent on the deck (indices 3 and 4).
		const s = agreementSignal([3, 5, 3]);
		expect(s.level).toBe('close');
		expect(s.suggestion).toBeNull();
	});

	it('is a spread when votes are more than one step apart', () => {
		// 3 (index 3) and 13 (index 6) span three steps.
		const s = agreementSignal([3, 13]);
		expect(s.level).toBe('spread');
		expect(s.suggestion).toBeNull();
	});

	it('infinity forces a spread even when the numbers would agree', () => {
		const s = agreementSignal([5, 5, 'infinity']);
		expect(s.level).toBe('spread');
		expect(s.suggestion).toBeNull();
		expect(s.hasInfinity).toBe(true);
	});

	it('is a spread with a null suggestion when there are no numeric votes', () => {
		const s = agreementSignal(['?', 'coffee', 'infinity']);
		expect(s.level).toBe('spread');
		expect(s.suggestion).toBeNull();
	});

	it('coffee raises the break hint without changing the numeric agreement', () => {
		const s = agreementSignal([8, 8, 'coffee']);
		expect(s.level).toBe('agree');
		expect(s.suggestion).toBe(8);
		expect(s.needsBreak).toBe(true);
	});

	it('a lone question mark leaves nothing numeric to size', () => {
		expect(agreementSignal(['?']).level).toBe('spread');
	});

	it('treats a single numeric vote as agreement on that value', () => {
		const s = agreementSignal([13]);
		expect(s.level).toBe('agree');
		expect(s.suggestion).toBe(13);
	});
});

describe('voteDistribution', () => {
	it('counts votes per card across the whole deck in order', () => {
		const dist = voteDistribution([5, 5, 'coffee']);
		expect(dist).toHaveLength(NUMERIC_DECK.length + 3);
		expect(dist.find((d) => d.card === 5)?.count).toBe(2);
		expect(dist.find((d) => d.card === 'coffee')?.count).toBe(1);
		expect(dist.find((d) => d.card === 0)?.count).toBe(0);
	});
});

describe('card guards', () => {
	it('accepts deck numerals and specials, rejects off-deck values', () => {
		expect(isCard(8)).toBe(true);
		expect(isCard('infinity')).toBe(true);
		expect(isCard(7)).toBe(false); // 7 is not on the modified-Fibonacci deck
		expect(isCard('banana')).toBe(false);
		expect(isSpecialCard('coffee')).toBe(true);
		expect(isSpecialCard(5)).toBe(false);
	});
});
