import type { DateOption, Participant } from '$lib/types';

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// ≥128 bits of entropy, base62 (PROJECT.md). 22 chars ≈ 131 bits.
export function newToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(22));
	let out = '';
	for (const b of bytes) out += BASE62[b % 62];
	return out;
}

export function id(prefix: string): string {
	return `${prefix}-${newToken().slice(0, 7)}`;
}

// Per-date preference counts. notAnswered is derived from the invitee total
// (see getResults), NOT from this query - a missing responses row contributes 0
// to every count here, so it can never read as "unavailable".
export const RESULTS_SQL = `
	SELECT d.id AS id,
		SUM(CASE WHEN r.preference = 'preferred'   THEN 1 ELSE 0 END) AS preferred,
		SUM(CASE WHEN r.preference = 'available'   THEN 1 ELSE 0 END) AS available,
		SUM(CASE WHEN r.preference = 'unavailable' THEN 1 ELSE 0 END) AS unavailable
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

	// Absolute links off the runtime origin (request host in prod, localhost in
	// dev) - pass url.origin server-side or page.url.origin in a component.
	inviteeUrl(origin: string, token: string): string {
		return `${origin}/r/${token}`;
	},

	organizerUrl(origin: string, token: string): string {
		return `${origin}/e/${token}`;
	}
};
