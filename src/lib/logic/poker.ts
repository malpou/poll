// Planning-poker deck and the reveal-time agreement signal
// (openspec/specs/planning-poker). Pure logic, no transport coupling: the same
// computation runs wherever the reveal is assembled (server or client).

// Modified Fibonacci - the classic commercial planning-poker deck. Anything
// larger than 100 is really an "infinity" (split it) signal, not a number.
export const NUMERIC_DECK = [0, 1, 2, 3, 5, 8, 13, 20, 40, 100] as const;

// The three non-numeric cards. `?` = need more info, `infinity` = too big to
// estimate, `coffee` = I need a break. Castable like any card, shown on reveal,
// but never counted as a numeric estimate.
export const SPECIAL_CARDS = ['?', 'infinity', 'coffee'] as const;
export type SpecialCard = (typeof SPECIAL_CARDS)[number];

// A card is either a numeric deck value or one of the specials.
export type Card = number | SpecialCard;

// The full deck in display order: numbers first, then the specials.
export const DECK: readonly Card[] = [...NUMERIC_DECK, ...SPECIAL_CARDS];

export function isSpecialCard(card: unknown): card is SpecialCard {
	return typeof card === 'string' && (SPECIAL_CARDS as readonly string[]).includes(card);
}

/** True when `card` is a legal card to cast (a deck numeral or a special). */
export function isCard(card: unknown): card is Card {
	return isSpecialCard(card) || (typeof card === 'number' && NUMERIC_DECK.includes(card as never));
}

// agree  - at least one numeric vote, all numeric votes equal, no infinity.
// close  - the numeric votes span exactly one adjacent deck step, no infinity.
// spread - span of more than one step, any infinity, or no numeric votes.
export type AgreementLevel = 'agree' | 'close' | 'spread';

export interface AgreementSignal {
	level: AgreementLevel;
	// The agreed value, pre-filled as the suggested estimate. Non-null only when
	// level is 'agree'; the controller always records the final estimate.
	suggestion: number | null;
	// At least one infinity was cast (forces a spread - someone thinks it is too
	// big to size).
	hasInfinity: boolean;
	// At least one coffee was cast - an advisory "someone needs a break" hint,
	// independent of the numeric agreement.
	needsBreak: boolean;
}

/**
 * Classifies a round's cast votes, considering only numeric cards by their
 * position on the deck. Advisory only: it never records an estimate, it pre-
 * fills a suggestion when (and only when) the room agrees.
 */
export function agreementSignal(votes: readonly Card[]): AgreementSignal {
	const hasInfinity = votes.includes('infinity');
	const needsBreak = votes.includes('coffee');

	// Only real deck numerals count toward the span; `?`/`coffee`/`infinity`
	// never do. A vote off the deck (shouldn't happen) is ignored, not trusted.
	const indices = votes
		.filter((v): v is number => typeof v === 'number')
		.map((n) => NUMERIC_DECK.indexOf(n as never))
		.filter((i) => i >= 0);

	if (indices.length === 0) {
		// No numeric votes to size (all specials, or no votes) - nothing to agree on.
		return { level: 'spread', suggestion: null, hasInfinity, needsBreak };
	}

	if (hasInfinity) {
		// Infinity always forces a spread regardless of how the numbers land.
		return { level: 'spread', suggestion: null, hasInfinity, needsBreak };
	}

	const span = Math.max(...indices) - Math.min(...indices);
	if (span === 0) {
		return { level: 'agree', suggestion: NUMERIC_DECK[indices[0]], hasInfinity, needsBreak };
	}
	if (span === 1) {
		return { level: 'close', suggestion: null, hasInfinity, needsBreak };
	}
	return { level: 'spread', suggestion: null, hasInfinity, needsBreak };
}

/**
 * Counts votes per card in deck order, for the reveal's distribution display.
 * Cards with no votes are still present (count 0), so the distribution renders
 * against the full deck.
 */
export function voteDistribution(votes: readonly Card[]): { card: Card; count: number }[] {
	return DECK.map((card) => ({
		card,
		count: votes.filter((v) => v === card).length
	}));
}
