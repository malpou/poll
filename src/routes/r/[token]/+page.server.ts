import { fail } from '@sveltejs/kit';
import { getProvider } from '$lib/data/provider';
import { enabledPreferences } from '$lib/logic/choices';
import { optionDisplay } from '$lib/logic/options';
import { orderForRespondent } from '$lib/logic/participant-status';
import { outcomeFor } from '$lib/logic/results';
import { parseHighlightAnswers, parseRankAnswers } from '$lib/logic/value-answers';
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
		// Rank positions / highlight stroke counts, keyed by option id.
		const values: Record<string, number> = {};
		for (const r of ctx.responses) {
			if (r.value !== null) values[r.dateOptionId] = r.value;
			else answers[r.dateOptionId] = r.preference;
		}

		// Returning respondents get dates added since their answer sorted first and
		// flagged. Closed polls are read-only, so no flags/reorder there.
		const answeredIds =
			ctx.event.status === 'open'
				? new Set(ctx.responses.map((r) => r.dateOptionId))
				: new Set<string>();

		// Rank keeps the invitee's recorded order (the ballot is a full 1..N, so a
		// missing-row reorder never applies); options the system appended on an
		// organizer add carry the 'unsure' marker and get flagged instead.
		const rankDates = () => {
			const marker =
				ctx.event.status === 'open'
					? new Set(
							ctx.responses
								.filter((r) => r.value !== null && r.preference === 'unsure')
								.map((r) => r.dateOptionId)
						)
					: new Set<string>();
			return [...ctx.dateOptions]
				.sort((a, b) => (values[a.id] ?? Infinity) - (values[b.id] ?? Infinity))
				.map((d) => ({ ...d, needsAnswer: marker.has(d.id) }));
		};

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
			highlightBudget: ctx.event.highlightBudget,
			choices: enabledPreferences(ctx.event),
			dates: (ctx.event.pollType === 'rank'
				? rankDates()
				: orderForRespondent(ctx.dateOptions, answeredIds)
			).map((d) => ({
				id: d.id,
				needsAnswer: d.needsAnswer,
				...optionDisplay(d, ctx.event)
			})),
			answers,
			values,
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

		let answers: ResponseInput[];
		if (ctx.event.pollType === 'rank' || ctx.event.pollType === 'highlight') {
			// Value submissions are all-or-nothing: a missing/duplicate position,
			// over-budget total, or stale option set rejects the whole answer.
			const parsed =
				ctx.event.pollType === 'rank'
					? parseRankAnswers(form, [...optionIds])
					: parseHighlightAnswers(form, [...optionIds], ctx.event.highlightBudget);
			if (!parsed) return fail(400);
			answers = parsed;
		} else {
			// Trust boundary: only the event's enabled choices are accepted - a
			// disabled choice in a crafted request is dropped, storing nothing.
			const enabled: ReadonlySet<string> = new Set(enabledPreferences(ctx.event));
			answers = [];
			for (const id of optionIds) {
				const v = form.get(`pref.${id}`);
				// Unmarked = no field = no row (stays "no answer").
				if (typeof v === 'string' && enabled.has(v)) {
					answers.push({ dateOptionId: id, preference: v as Preference });
				}
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
