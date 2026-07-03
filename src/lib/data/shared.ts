import type { DateOption, Participant } from '$lib/types';

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generates a random base62 token with at least 128 bits of entropy (PROJECT.md).
 * 22 chars is approximately 131 bits.
 */
export function newToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(22));
	let out = '';
	for (const b of bytes) out += BASE62[b % 62];
	return out;
}

export function id(prefix: string): string {
	return `${prefix}-${newToken().slice(0, 7)}`;
}

// Unambiguous alphabet: A-Z without I/O, digits 2-9 (no 0/1). Read aloud or
// typed from an email without l/1/O/0 confusion.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * The organizer's admin code - a second secret emailed alongside the link.
 * 8 chars over a 32-symbol alphabet ≈ 40 bits (32^8 ≈ 10^12), so online guessing
 * is impractical without a rate limiter (openspec admin-link-email design).
 */
export function newAdminCode(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(8));
	let out = '';
	for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
	return out;
}

// Per-date preference counts. notAnswered is derived from the invitee total
// (see getResults), NOT from this query - a missing responses row contributes 0
// to every count here, so it can never read as "unavailable".
export const RESULTS_SQL = `
	SELECT d.id AS id,
		SUM(CASE WHEN r.value IS NULL AND r.preference = 'preferred'   THEN 1 ELSE 0 END) AS preferred,
		SUM(CASE WHEN r.value IS NULL AND r.preference = 'available'   THEN 1 ELSE 0 END) AS available,
		SUM(CASE WHEN r.value IS NULL AND r.preference = 'unavailable' THEN 1 ELSE 0 END) AS unavailable,
		SUM(CASE WHEN r.value IS NULL AND r.preference = 'unsure'      THEN 1 ELSE 0 END) AS unsure,
		COALESCE(SUM(r.value), 0)                                      AS value_sum,
		COUNT(r.value)                                                 AS value_count,
		SUM(CASE WHEN r.value = 1 THEN 1 ELSE 0 END)                   AS first_places
	FROM date_options d
	LEFT JOIN responses r ON r.date_option_id = d.id
	WHERE d.event_id = ?
	GROUP BY d.id
	ORDER BY d.sort_order;
`;

// Pure DataProvider helpers - identical for mock and D1, so both spread them in.
export const helpers = {
	blankDate(): DateOption {
		return { id: id('date'), value: '', startTime: '', endTime: '' };
	},

	blankParticipant(): Participant {
		return { id: id('p'), name: '', token: newToken() };
	},

	/**
	 * Builds an absolute invitee link off the runtime origin (request host in
	 * prod, localhost in dev).
	 * @param origin Pass url.origin server-side or page.url.origin in a component.
	 */
	inviteeUrl(origin: string, token: string): string {
		return `${origin}/r/${token}`;
	},

	organizerUrl(origin: string, token: string): string {
		return `${origin}/e/${token}`;
	},

	/**
	 * Builds the open-mode shared submission link. One per event; anyone with it
	 * can respond.
	 */
	shareUrl(origin: string, token: string): string {
		return `${origin}/s/${token}`;
	}
};
