import { fail } from '@sveltejs/kit';
import { getProvider } from '$lib/data/provider';
import { formatDateOption, utcIsoToZonedParts } from '$lib/logic/date';
import { field, validateTimes } from '$lib/forms/forms';
import { richTextIsEmpty, sanitizeRichText } from '$lib/forms/richtext';
import { inviteeStatus, responseCountByInvitee } from '$lib/logic/participant-status';
import { markBest } from '$lib/logic/results';
import { cachedLoad, invalidateCache } from '$lib/server/cache';
import { setRequestLocale } from '../../../hooks.server';
import { m } from '$lib/paraglide/messages';
import { isLocale } from '$lib/paraglide/runtime';
import type { DateOptionInput } from '$lib/data/provider';
import type { EventWithDetails, Preference } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

/**
 * Reads date + optional times from a form into the provider's input shape.
 */
function dateInput(form: FormData): DateOptionInput {
	return {
		value: field(form, 'value'),
		startTime: field(form, 'startTime'),
		endTime: field(form, 'endTime')
	};
}

/**
 * Computes the whole dashboard view from D1. Cached per token+origin, so it
 * must not touch per-request state: the locale goes to m.*() explicitly, and
 * setRequestLocale happens in `load` (also needed on cache hits).
 */
async function computeDashboard(platform: App.Platform | undefined, token: string, origin: string) {
	const provider = getProvider(platform);
	const event = await provider.getEventByOrganizerToken(token);
	// Reveal nothing on an unknown token - same discipline as the response page.
	if (!event) return null;

	const [results, responses] = await Promise.all([
		provider.getResults(event.id),
		provider.getEventResponses(event.id)
	]);
	const totalInvitees = event.invitees.length;
	// Per-invitee answer counts vs option count: 'partial' means dates were added
	// after they answered (the UI's only way to save is all-at-once).
	const responseCounts = responseCountByInvitee(responses);

	// Who chose what, per option: group responder names by preference so the
	// organizer can expand a date and see the specific people behind each count.
	const nameById = new Map(event.invitees.map((i) => [i.id, i.label]));
	const namesByOption = new Map<string, Record<Preference, string[]>>();
	for (const r of responses) {
		let bucket = namesByOption.get(r.dateOptionId);
		if (!bucket) {
			bucket = { preferred: [], available: [], unavailable: [] };
			namesByOption.set(r.dateOptionId, bucket);
		}
		bucket[r.preference].push(nameById.get(r.inviteeId) ?? '');
	}

	// Join counts with each option's Danish date labels, then rank + highlight.
	const counts = new Map(results.map((r) => [r.dateOptionId, r]));
	const pct = (n: number) => (totalInvitees ? Math.round((n / totalInvitees) * 100) : 0);
	const resultsView = markBest(
		event.dateOptions.map((d) => {
			const c = counts.get(d.id) ?? { preferred: 0, available: 0, unavailable: 0 };
			const names = namesByOption.get(d.id) ?? {
				preferred: [],
				available: [],
				unavailable: []
			};
			return {
				id: d.id,
				chosen: d.selected,
				preferred: c.preferred,
				available: c.available,
				unavailable: c.unavailable,
				preferredPct: pct(c.preferred),
				availablePct: pct(c.available),
				unavailablePct: pct(c.unavailable),
				preferredNames: names.preferred,
				availableNames: names.available,
				unavailableNames: names.unavailable,
				...formatDateOption(d.startsAt, d.endsAt, event.locale)
			};
		})
	);

	// Same counts drive the delete-warning confirm on the options list.
	const optionHasResponses = new Map(
		results.map((r) => [r.dateOptionId, r.preferred + r.available + r.unavailable > 0])
	);

	return {
		invalid: false as const,
		token,
		organizerUrl: provider.organizerUrl(origin, token),
		shareUrl: provider.shareUrl(origin, event.shareToken),
		title: event.title,
		description: event.description,
		locale: event.locale,
		pollMode: event.pollMode,
		status: event.status,
		// The decided dates for the closed banner - empty unless closed with a pick.
		chosenDates: event.dateOptions
			.filter((d) => d.selected)
			.map((d) => formatDateOption(d.startsAt, d.endsAt, event.locale)),
		results: resultsView,
		// One summary of who has answered, shown under the results heading. Open mode
		// has no fixed roster, so it drops the "of Y" denominator.
		respondedLabel:
			event.pollMode === 'open'
				? m.answeredLabelOpen({ total: responseCounts.size }, { locale: event.locale })
				: m.answeredLabel({ total: responseCounts.size, totalInvitees }, { locale: event.locale }),
		options: event.dateOptions.map((d) => {
			// Copenhagen wall-clock parts for the edit form's native inputs.
			const start = utcIsoToZonedParts(d.startsAt);
			return {
				id: d.id,
				value: start.value,
				startTime: start.time,
				endTime: d.endsAt ? utcIsoToZonedParts(d.endsAt).time : '',
				hasResponses: optionHasResponses.get(d.id) ?? false,
				...formatDateOption(d.startsAt, d.endsAt, event.locale)
			};
		}),
		invitees: event.invitees.map((inv) => ({
			id: inv.id,
			label: inv.label,
			url: provider.inviteeUrl(origin, inv.token),
			status: inviteeStatus(responseCounts.get(inv.id) ?? 0, event.dateOptions.length),
			note: inv.note
		}))
	};
}

export const load: PageServerLoad = async ({ params, platform, url }) => {
	const payload = await cachedLoad(platform, url.origin, 'e', params.token, () =>
		computeDashboard(platform, params.token, url.origin)
	);
	if (!payload) return { invalid: true as const };
	// The whole dashboard renders in the poll's stored locale (m.*() + dates);
	// must run on cache hits too, so it lives outside the cached compute.
	setRequestLocale(payload.locale);
	return payload;
};

/**
 * Re-resolves the event by token server-side, as every action must; never
 * trust the client for event id or status.
 */
async function resolve(platform: App.Platform | undefined, token: string) {
	const provider = getProvider(platform);
	const event = await provider.getEventByOrganizerToken(token);
	return { provider, event };
}

/**
 * Reports whether a poll is not open. A closed or cancelled poll is immutable
 * except for reopening (specs/poll-closing) - the UI hides the edit
 * affordances, but the recorded decision must also survive a crafted POST.
 */
function notOpen(event: { status: string }) {
	return event.status !== 'open';
}

/**
 * Purges everything a dashboard mutation can affect: the dashboard itself, the
 * shared page, and every invitee page (date/detail/status/locale edits change
 * them all). Uses the pre-mutation event, so a removed invitee's page is
 * purged too; a just-added invitee has no entry yet. Await before returning -
 * the client re-runs load immediately after a successful action.
 */
function purgeEvent(
	platform: App.Platform | undefined,
	origin: string,
	organizerToken: string,
	event: EventWithDetails
) {
	return invalidateCache(platform, origin, [
		{ kind: 'e', token: organizerToken },
		{ kind: 's', token: event.shareToken },
		...event.invitees.map((i) => ({ kind: 'r' as const, token: i.token }))
	]);
}

export const actions = {
	saveDetails: async ({ params, request, platform, url }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		if (notOpen(event)) return fail(409);
		const form = await request.formData();
		const title = field(form, 'title');
		// Validation error copy renders in the poll's own locale.
		if (!title) return fail(400, { error: m.errorNoTitle({}, { locale: event.locale }) });
		const description = sanitizeRichText(field(form, 'description'));
		await provider.updateEventDetails(
			event.id,
			title,
			richTextIsEmpty(description) ? null : description
		);

		// Language + mode live in the same edit block; apply them here too. Mode
		// switching keeps every existing invitee and response - it only changes how
		// new people submit.
		const locale = field(form, 'locale');
		if (isLocale(locale) && locale !== event.locale)
			await provider.setEventLocale(event.id, locale);

		const mode = field(form, 'pollMode');
		if ((mode === 'assigned' || mode === 'open') && mode !== event.pollMode) {
			await provider.setPollMode(event.id, mode);
		}
		await purgeEvent(platform, url.origin, params.token, event);
		return { ok: true };
	},

	addOption: async ({ params, request, platform, url }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		if (notOpen(event)) return fail(409);
		const form = await request.formData();
		const date = dateInput(form);
		if (!date.value) return fail(400, { error: 'value' });
		const timeError = validateTimes(date.startTime, date.endTime);
		if (timeError) return fail(400, { error: timeError });
		await provider.addDateOption(event.id, date);
		await purgeEvent(platform, url.origin, params.token, event);
		return { ok: true };
	},

	editOption: async ({ params, request, platform, url }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		if (notOpen(event)) return fail(409);
		const form = await request.formData();
		const optionId = field(form, 'optionId');
		const date = dateInput(form);
		if (!optionId || !event.dateOptions.some((d) => d.id === optionId)) return fail(404);
		if (!date.value) return fail(400, { error: 'value' });
		const timeError = validateTimes(date.startTime, date.endTime);
		if (timeError) return fail(400, { error: timeError });
		await provider.updateDateOption(optionId, date);
		await purgeEvent(platform, url.origin, params.token, event);
		return { ok: true };
	},

	removeOption: async ({ params, request, platform, url }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		if (notOpen(event)) return fail(409);
		const optionId = field(await request.formData(), 'optionId');
		if (!event.dateOptions.some((d) => d.id === optionId)) return fail(404);
		await provider.removeDateOption(optionId);
		await purgeEvent(platform, url.origin, params.token, event);
		return { ok: true };
	},

	moveOption: async ({ params, request, platform, url }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		if (notOpen(event)) return fail(409);
		const form = await request.formData();
		const optionId = field(form, 'optionId');
		const direction = field(form, 'direction');
		if (direction !== 'up' && direction !== 'down') return fail(400);
		// dateOptions arrive ordered by sort_order; swap with the neighbour.
		const ids = event.dateOptions.map((d) => d.id);
		const from = ids.indexOf(optionId);
		if (from === -1) return fail(404);
		const to = direction === 'up' ? from - 1 : from + 1;
		if (to < 0 || to >= ids.length) return { ok: true }; // already at the edge
		[ids[from], ids[to]] = [ids[to], ids[from]];
		await provider.reorderDateOptions(event.id, ids);
		await purgeEvent(platform, url.origin, params.token, event);
		return { ok: true };
	},

	sortOptions: async ({ params, platform, url }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		if (notOpen(event)) return fail(409);
		// Chronological ascending. UTC ISO strings compare lexically; a malformed
		// option with no starts_at sinks to the end. Sort is stable, so ties keep
		// their current order.
		const ids = [...event.dateOptions]
			.sort((a, b) => (a.startsAt ?? '\uffff').localeCompare(b.startsAt ?? '\uffff'))
			.map((d) => d.id);
		await provider.reorderDateOptions(event.id, ids);
		await purgeEvent(platform, url.origin, params.token, event);
		return { ok: true };
	},

	addInvitee: async ({ params, request, platform, url }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		if (notOpen(event)) return fail(409);
		// Open mode has no hand-managed roster (specs/invitee-links) - the UI hides
		// these forms, but a crafted POST must be rejected too.
		if (event.pollMode === 'open') return fail(409);
		const label = field(await request.formData(), 'label');
		if (!label) return fail(400, { error: 'label' });
		await provider.addInvitee(event.id, label);
		await purgeEvent(platform, url.origin, params.token, event);
		return { ok: true };
	},

	renameInvitee: async ({ params, request, platform, url }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		if (notOpen(event)) return fail(409);
		if (event.pollMode === 'open') return fail(409);
		const form = await request.formData();
		const inviteeId = field(form, 'inviteeId');
		const label = field(form, 'label');
		if (!event.invitees.some((i) => i.id === inviteeId)) return fail(404);
		if (!label) return fail(400, { error: 'label' });
		await provider.renameInvitee(inviteeId, label);
		await purgeEvent(platform, url.origin, params.token, event);
		return { ok: true };
	},

	removeInvitee: async ({ params, request, platform, url }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		if (notOpen(event)) return fail(409);
		if (event.pollMode === 'open') return fail(409);
		const inviteeId = field(await request.formData(), 'inviteeId');
		if (!event.invitees.some((i) => i.id === inviteeId)) return fail(404);
		await provider.removeInvitee(inviteeId);
		await purgeEvent(platform, url.origin, params.token, event);
		return { ok: true };
	},

	close: async ({ params, request, platform, url }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		if (notOpen(event)) return fail(409);
		// Closing means deciding: at least one chosen option, every id belonging
		// to this event (specs/poll-closing).
		const form = await request.formData();
		const ids = [
			...new Set(form.getAll('selectedOptionIds').filter((v): v is string => typeof v === 'string'))
		];
		const valid = new Set(event.dateOptions.map((d) => d.id));
		if (ids.length === 0 || !ids.every((id) => valid.has(id)))
			return fail(400, { error: m.errorNoSelection({}, { locale: event.locale }) });
		await provider.closeEvent(event.id, ids);
		await purgeEvent(platform, url.origin, params.token, event);
		return { ok: true };
	},

	cancel: async ({ params, platform, url }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		if (notOpen(event)) return fail(409);
		await provider.cancelEvent(event.id);
		await purgeEvent(platform, url.origin, params.token, event);
		return { ok: true };
	},

	reopen: async ({ params, platform, url }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		if (!notOpen(event)) return fail(409);
		// Also discards the chosen dates - closing again asks for a fresh pick.
		await provider.reopenEvent(event.id);
		await purgeEvent(platform, url.origin, params.token, event);
		return { ok: true };
	}
} satisfies Actions;
