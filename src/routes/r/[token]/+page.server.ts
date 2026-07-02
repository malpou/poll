import { fail } from '@sveltejs/kit';
import { getProvider } from '$lib/data/provider';
import { formatDateOption } from '$lib/date';
import { orderForRespondent } from '$lib/participant-status';
import { setRequestLocale } from '../../../hooks.server';
import type { Preference } from '$lib/types';
import type { ResponseInput } from '$lib/data/provider';
import type { Actions, PageServerLoad } from './$types';

const PREFERENCES: readonly string[] = ['preferred', 'available', 'unavailable'];
const isPreference = (v: string): v is Preference => PREFERENCES.includes(v);

export const load: PageServerLoad = async ({ params, platform }) => {
	const ctx = await getProvider(platform).getInviteeContext(params.token);
	if (!ctx) return { invalid: true as const };

	// Response page renders in the poll's stored locale for every consumer.
	setRequestLocale(ctx.event.locale);

	const answers: Record<string, Preference> = {};
	for (const r of ctx.responses) answers[r.dateOptionId] = r.preference;

	// Returning respondents get dates added since their answer sorted first and
	// flagged. Closed polls are read-only, so no flags/reorder there.
	const answeredIds =
		ctx.event.status === 'open'
			? new Set(ctx.responses.map((r) => r.dateOptionId))
			: new Set<string>();

	return {
		invalid: false as const,
		closed: ctx.event.status === 'closed',
		name: ctx.invitee.label,
		title: ctx.event.title,
		description: ctx.event.description,
		dates: orderForRespondent(ctx.dateOptions, answeredIds).map((d) => ({
			id: d.id,
			needsAnswer: d.needsAnswer,
			...formatDateOption(d.startsAt, d.endsAt, ctx.event.locale)
		})),
		answers,
		note: ctx.invitee.note ?? ''
	};
};

export const actions = {
	save: async ({ params, request, platform }) => {
		const provider = getProvider(platform);
		// Re-fetch server-side: never trust the client for invitee id, option ids,
		// or status. Closed events are read-only here too, not just in the UI.
		const ctx = await provider.getInviteeContext(params.token);
		if (!ctx) return fail(404);
		if (ctx.event.status === 'closed') return fail(403);

		const form = await request.formData();
		const optionIds = new Set(ctx.dateOptions.map((d) => d.id));

		const answers: ResponseInput[] = [];
		for (const id of optionIds) {
			const v = form.get(`pref.${id}`);
			// Unmarked = no field = no row (stays "no answer").
			if (typeof v === 'string' && isPreference(v)) {
				answers.push({ dateOptionId: id, preference: v });
			}
		}

		const note = form.get('note');
		await provider.saveResponses(ctx.invitee.id, answers);
		await provider.saveNote(ctx.invitee.id, typeof note === 'string' ? note.trim() : '');

		return { saved: true };
	}
} satisfies Actions;
