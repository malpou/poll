// Per-invitee answer status + respondent-facing date ordering. A missing
// responses row means "no answer", so an invitee who answered before a new
// date was added ends up 'partial' - the dashboard and response page both
// surface that gap (specs: new-date follow-up UX).

export type InviteeStatus = 'complete' | 'partial' | 'none';

export function responseCountByInvitee(responses: { inviteeId: string }[]): Map<string, number> {
	const counts = new Map<string, number>();
	for (const r of responses) counts.set(r.inviteeId, (counts.get(r.inviteeId) ?? 0) + 1);
	return counts;
}

export function inviteeStatus(count: number, optionCount: number): InviteeStatus {
	if (count === 0) return 'none';
	return count < optionCount ? 'partial' : 'complete';
}

/**
 * Orders dates with unanswered ones first (each group keeps its incoming order), flagged so the
 * UI can badge them. A first visit (no prior answers) flags nothing and keeps
 * the original order - the treatment only applies to returning respondents.
 */
export function orderForRespondent<T extends { id: string }>(
	dates: T[],
	answeredIds: Set<string>
): (T & { needsAnswer: boolean })[] {
	if (answeredIds.size === 0) return dates.map((d) => ({ ...d, needsAnswer: false }));
	const flagged = dates.map((d) => ({ ...d, needsAnswer: !answeredIds.has(d.id) }));
	return [...flagged.filter((d) => d.needsAnswer), ...flagged.filter((d) => !d.needsAnswer)];
}
