import { fail } from '@sveltejs/kit';
import { getProvider } from '$lib/data/provider';
import { enabledPreferences } from '$lib/logic/choices';
import { optionDisplay } from '$lib/logic/options';
import { orderForRespondent } from '$lib/logic/participant-status';
import { outcomeFor } from '$lib/logic/results';
import { cachedLoad, invalidateCache } from '$lib/server/cache';
import { setRequestLocale } from '../../../hooks.server';
import type { Preference } from '$lib/types';
import type { ResponseInput } from '$lib/data/provider';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, url }) => {
	const page = await cachedLoad(platform, url.origin, 'r', params.token, async () => {
		const provider = getProvider(platform);
		const ctx = await provider.getInviteeContext(params.token);
		if (!ctx) return null;

		const answers: Record<string, Preference> = {};
		for (const r of ctx.responses) answers[r.dateOptionId] = r.preference;

		// Returning respondents get dates added since their answer sorted first and
		// flagged. Closed polls are read-only, so no flags/reorder there.
		const answeredIds =
			ctx.event.status === 'open'
				? new Set(ctx.responses.map((r) => r.dateOptionId))
				: new Set<string>();

		// Decided poll → chosen dates + count distribution (counts only, never
		// names); null on a poll closed before decisions existed (openspec/specs/poll-closing).
		const outcome = await outcomeFor(provider, ctx.event, ctx.dateOptions);

		return {
			invalid: false as const,
			// Carried so cache hits can restore the request locale below.
			locale: ctx.event.locale,
			status: ctx.event.status,
			outcome,
			name: ctx.invitee.label,
			title: ctx.event.title,
			description: ctx.event.description,
			timezone: ctx.event.timezone,
			accent: ctx.event.accent,
			pollType: ctx.event.pollType,
			choices: enabledPreferences(ctx.event),
			dates: orderForRespondent(ctx.dateOptions, answeredIds).map((d) => ({
				id: d.id,
				needsAnswer: d.needsAnswer,
				...optionDisplay(d, ctx.event)
			})),
			answers,
			note: ctx.invitee.note ?? ''
		};
	});
	if (!page) return { invalid: true as const };

	// Response page renders in the poll's stored locale for every consumer.
	setRequestLocale(page.locale);
	return page;
};

export const actions = {
	save: async ({ params, request, platform, url }) => {
		const provider = getProvider(platform);
		// Re-fetch server-side: never trust the client for invitee id, option ids,
		// or status. Closed events are read-only here too, not just in the UI.
		const ctx = await provider.getInviteeContext(params.token);
		if (!ctx) return fail(404);
		if (ctx.event.status !== 'open') return fail(403);

		const form = await request.formData();
		const optionIds = new Set(ctx.dateOptions.map((d) => d.id));
		// Trust boundary: only the event's enabled choices are accepted - a
		// disabled choice in a crafted request is dropped, storing nothing.
		const enabled: ReadonlySet<string> = new Set(enabledPreferences(ctx.event));

		const answers: ResponseInput[] = [];
		for (const id of optionIds) {
			const v = form.get(`pref.${id}`);
			// Unmarked = no field = no row (stays "no answer").
			if (typeof v === 'string' && enabled.has(v)) {
				answers.push({ dateOptionId: id, preference: v as Preference });
			}
		}

		const note = form.get('note');
		await provider.saveResponses(ctx.invitee.id, answers);
		await provider.saveNote(ctx.invitee.id, typeof note === 'string' ? note.trim() : '');

		// New answers change this page and the organizer's tallies; the shared
		// page renders no responses, so it stays cached.
		await invalidateCache(platform, url.origin, [
			{ kind: 'r', token: params.token },
			{ kind: 'e', token: ctx.event.organizerToken }
		]);

		return { saved: true };
	}
} satisfies Actions;
