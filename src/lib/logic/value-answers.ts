import type { ResponseInput } from '$lib/data/provider';

// Trust boundary for rank/highlight submissions (openspec/specs/rank-poll,
// highlight-poll). The form posts one `value.{optionId}` integer per option;
// every current option must be present, so a stale form (options changed since
// it rendered) is rejected rather than silently mis-recorded.
//
// preference on value rows is only the NOT NULL filler: 'available' marks an
// invitee-submitted answer (clearing any 'unsure' needs-confirmation marker a
// rank ballot picked up when the organizer added an option).

function readValues(form: FormData, optionIds: string[]): Map<string, number> | null {
	const values = new Map<string, number>();
	for (const id of optionIds) {
		const raw = form.get(`value.${id}`);
		if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return null;
		values.set(id, Number(raw));
	}
	return values;
}

const toAnswers = (values: Map<string, number>): ResponseInput[] =>
	[...values].map(([dateOptionId, value]) => ({
		dateOptionId,
		preference: 'available' as const,
		value
	}));

/** A rank ballot must be a strict total order: positions exactly 1..N. */
export function parseRankAnswers(form: FormData, optionIds: string[]): ResponseInput[] | null {
	const values = readValues(form, optionIds);
	if (!values) return null;
	const positions = new Set(values.values());
	if (positions.size !== optionIds.length) return null; // duplicates
	for (let p = 1; p <= optionIds.length; p++) if (!positions.has(p)) return null;
	return toAnswers(values);
}

/** Highlight strokes: each ≥ 0, at least one spent, total within the budget. */
export function parseHighlightAnswers(
	form: FormData,
	optionIds: string[],
	budget: number
): ResponseInput[] | null {
	const values = readValues(form, optionIds);
	if (!values) return null;
	let total = 0;
	for (const v of values.values()) total += v;
	if (total < 1 || total > budget) return null;
	return toAnswers(values);
}
