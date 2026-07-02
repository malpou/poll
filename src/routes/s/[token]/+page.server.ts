import { fail, redirect } from '@sveltejs/kit';
import { getProvider } from '$lib/data/provider';
import { formatDateOption } from '$lib/date';
import { outcomeFor } from '$lib/results';
import { setRequestLocale } from '../../../hooks.server';
import type { Preference } from '$lib/types';
import type { ResponseInput } from '$lib/data/provider';
import type { Actions, PageServerLoad } from './$types';

const PREFERENCES: readonly string[] = ['preferred', 'available', 'unavailable'];
const isPreference = (v: string): v is Preference => PREFERENCES.includes(v);

// One cookie per event holds the invitee token of this browser's own submission,
// so a revisit edits in place instead of creating a duplicate.
const cookieName = (eventId: string) => `edit_${eventId}`;

export const load: PageServerLoad = async ({ params, platform, cookies }) => {
	const provider = getProvider(platform);
	const ctx = await provider.getShareContext(params.token);
	// Unknown token or not an open poll - reveal nothing (same discipline as /r, /e).
	if (!ctx) return { invalid: true as const };

	// Already submitted from this browser? Edit that answer on the /r page instead.
	const mine = cookies.get(cookieName(ctx.event.id));
	if (mine) redirect(303, `/r/${mine}`);

	// Shared page renders in the poll's stored locale for every consumer.
	setRequestLocale(ctx.event.locale);

	// Same decided-poll outcome as /r: chosen dates + count distribution.
	const outcome = await outcomeFor(provider, ctx.event, ctx.dateOptions);

	return {
		invalid: false as const,
		status: ctx.event.status,
		outcome,
		title: ctx.event.title,
		description: ctx.event.description,
		dates: ctx.dateOptions.map((d) => ({
			id: d.id,
			...formatDateOption(d.startsAt, d.endsAt, ctx.event.locale)
		}))
	};
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
		const answers: ResponseInput[] = [];
		for (const id of optionIds) {
			const v = form.get(`pref.${id}`);
			if (typeof v === 'string' && isPreference(v)) {
				answers.push({ dateOptionId: id, preference: v });
			}
		}
		const noteVal = form.get('note');
		const note = typeof noteVal === 'string' ? noteVal.trim() : '';

		const { token } = await provider.submitOpenResponse(ctx.event.id, name, answers, note);

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
