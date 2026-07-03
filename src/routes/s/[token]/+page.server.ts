import { fail, redirect } from '@sveltejs/kit';
import { getProvider } from '$lib/data/provider';
import { enabledPreferences } from '$lib/logic/choices';
import { optionDisplay } from '$lib/logic/options';
import { outcomeFor } from '$lib/logic/results';
import { parseHighlightAnswers, parseRankAnswers } from '$lib/logic/value-answers';
import { cachedLoad, invalidateCache } from '$lib/server/cache';
import { setRequestLocale } from '../../../hooks.server';
import type { Preference } from '$lib/types';
import type { ResponseInput } from '$lib/data/provider';
import type { Actions, PageServerLoad } from './$types';

/**
 * Builds the cookie name that holds the invitee token of this browser's own
 * submission for a given event, so a revisit edits in place instead of creating
 * a duplicate.
 */
const cookieName = (eventId: string) => `edit_${eventId}`;

export const load: PageServerLoad = async ({ params, platform, cookies, url }) => {
	// Envelope around the page payload: the cookie-redirect check needs the
	// event id and cache hits need the locale, neither of which the page shows.
	const payload = await cachedLoad(platform, url.origin, 's', params.token, async () => {
		const provider = getProvider(platform);
		const ctx = await provider.getShareContext(params.token);
		// Unknown token or not an open poll - reveal nothing (same discipline as /r, /e).
		if (!ctx) return null;

		// Same decided-poll outcome as /r: chosen dates + count distribution.
		const outcome = await outcomeFor(provider, ctx.event, ctx.dateOptions);

		return {
			eventId: ctx.event.id,
			locale: ctx.event.locale,
			page: {
				invalid: false as const,
				status: ctx.event.status,
				outcome,
				title: ctx.event.title,
				description: ctx.event.description,
				timezone: ctx.event.timezone,
				accent: ctx.event.accent,
				pollType: ctx.event.pollType,
				highlightBudget: ctx.event.highlightBudget,
				choices: enabledPreferences(ctx.event),
				dates: ctx.dateOptions.map((d) => ({
					id: d.id,
					...optionDisplay(d, ctx.event)
				}))
			}
		};
	});
	if (!payload) return { invalid: true as const };

	// Already submitted from this browser? Edit that answer on the /r page instead.
	const mine = cookies.get(cookieName(payload.eventId));
	if (mine) redirect(303, `/r/${mine}`);

	// Shared page renders in the poll's stored locale for every consumer.
	setRequestLocale(payload.locale);
	return payload.page;
};

export const actions = {
	submit: async ({ params, request, platform, cookies, url }) => {
		const provider = getProvider(platform);
		// Re-resolve server-side: never trust the client for event id, option ids,
		// mode, or status.
		const ctx = await provider.getShareContext(params.token);
		if (!ctx) return fail(404);
		if (ctx.event.status !== 'open') return fail(403);

		const form = await request.formData();
		const nameVal = form.get('name');
		const name = typeof nameVal === 'string' ? nameVal.trim() : '';
		if (!name) return fail(400, { error: 'name' });

		const optionIds = new Set(ctx.dateOptions.map((d) => d.id));

		let answers: ResponseInput[];
		if (ctx.event.pollType === 'rank' || ctx.event.pollType === 'highlight') {
			// All-or-nothing, exactly as on /r: bad or stale values reject the submit.
			const parsed =
				ctx.event.pollType === 'rank'
					? parseRankAnswers(form, [...optionIds])
					: parseHighlightAnswers(form, [...optionIds], ctx.event.highlightBudget);
			if (!parsed) return fail(400);
			answers = parsed;
		} else {
			// Trust boundary: only the event's enabled choices are accepted (as on /r).
			const enabled: ReadonlySet<string> = new Set(enabledPreferences(ctx.event));
			answers = [];
			for (const id of optionIds) {
				const v = form.get(`pref.${id}`);
				if (typeof v === 'string' && enabled.has(v)) {
					answers.push({ dateOptionId: id, preference: v as Preference });
				}
			}
		}
		const noteVal = form.get('note');
		const note = typeof noteVal === 'string' ? noteVal.trim() : '';

		const { token } = await provider.submitOpenResponse(ctx.event.id, name, answers, note);

		// Only the organizer's tallies change: the shared page renders no
		// responses, and the new invitee's /r token is fresh (nothing cached).
		await invalidateCache(platform, url.origin, [{ kind: 'e', token: ctx.event.organizerToken }]);

		// Remember this browser's submission so a revisit edits it, and hand back a
		// personal edit link the user can save.
		cookies.set(cookieName(ctx.event.id), token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 180
		});

		return { saved: true, editUrl: provider.inviteeUrl(url.origin, token) };
	}
} satisfies Actions;
