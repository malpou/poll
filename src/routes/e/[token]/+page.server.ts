import { fail } from '@sveltejs/kit';
import { getProvider } from '$lib/data/provider';
import { formatDateOption, utcIsoToZonedParts } from '$lib/date';
import { field, validateTimes } from '$lib/forms';
import { markBest } from '$lib/results';
import { setRequestLocale } from '../../../hooks.server';
import { m } from '$lib/paraglide/messages';
import { isLocale } from '$lib/paraglide/runtime';
import type { DateOptionInput } from '$lib/data/provider';
import type { Preference } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

// Read date + optional times from a form into the provider's input shape.
function dateInput(form: FormData): DateOptionInput {
	return {
		value: field(form, 'value'),
		startTime: field(form, 'startTime'),
		endTime: field(form, 'endTime')
	};
}

export const load: PageServerLoad = async ({ params, platform, url }) => {
	const provider = getProvider(platform);
	const event = await provider.getEventByOrganizerToken(params.token);
	// Reveal nothing on an unknown token - same discipline as the response page.
	if (!event) return { invalid: true as const };

	// The whole dashboard renders in the poll's stored locale (m.*() + dates).
	setRequestLocale(event.locale);

	const [results, answered, responses] = await Promise.all([
		provider.getResults(event.id),
		provider.getAnsweredInviteeIds(event.id),
		provider.getEventResponses(event.id)
	]);
	const totalInvitees = event.invitees.length;

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
		token: params.token,
		organizerUrl: provider.organizerUrl(url.origin, params.token),
		shareUrl: provider.shareUrl(url.origin, event.shareToken),
		title: event.title,
		description: event.description,
		locale: event.locale,
		pollMode: event.pollMode,
		closed: event.status === 'closed',
		results: resultsView,
		// One summary of who has answered, shown under the results heading. Open mode
		// has no fixed roster, so it drops the "of Y" denominator.
		respondedLabel:
			event.pollMode === 'open'
				? m.answeredLabelOpen({ total: answered.size })
				: m.answeredLabel({ total: answered.size, totalInvitees }),
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
			url: provider.inviteeUrl(url.origin, inv.token),
			answered: answered.has(inv.id),
			note: inv.note
		}))
	};
};

// Every action re-resolves the event by token server-side; never trust the
// client for event id or status.
async function resolve(platform: App.Platform | undefined, token: string) {
	const provider = getProvider(platform);
	const event = await provider.getEventByOrganizerToken(token);
	return { provider, event };
}

export const actions = {
	saveDetails: async ({ params, request, platform }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		const form = await request.formData();
		const title = field(form, 'title');
		// Validation error copy renders in the poll's own locale.
		if (!title) return fail(400, { error: m.errorNoTitle({}, { locale: event.locale }) });
		const description = field(form, 'description');
		await provider.updateEventDetails(event.id, title, description || null);

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
		return { ok: true };
	},

	addOption: async ({ params, request, platform }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		const form = await request.formData();
		const date = dateInput(form);
		if (!date.value) return fail(400, { error: 'value' });
		const timeError = validateTimes(date.startTime, date.endTime);
		if (timeError) return fail(400, { error: timeError });
		await provider.addDateOption(event.id, date);
		return { ok: true };
	},

	editOption: async ({ params, request, platform }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		const form = await request.formData();
		const optionId = field(form, 'optionId');
		const date = dateInput(form);
		if (!optionId || !event.dateOptions.some((d) => d.id === optionId)) return fail(404);
		if (!date.value) return fail(400, { error: 'value' });
		const timeError = validateTimes(date.startTime, date.endTime);
		if (timeError) return fail(400, { error: timeError });
		await provider.updateDateOption(optionId, date);
		return { ok: true };
	},

	removeOption: async ({ params, request, platform }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		const optionId = field(await request.formData(), 'optionId');
		if (!event.dateOptions.some((d) => d.id === optionId)) return fail(404);
		await provider.removeDateOption(optionId);
		return { ok: true };
	},

	moveOption: async ({ params, request, platform }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
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
		return { ok: true };
	},

	sortOptions: async ({ params, platform }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		// Chronological ascending. UTC ISO strings compare lexically; a malformed
		// option with no starts_at sinks to the end. Sort is stable, so ties keep
		// their current order.
		const ids = [...event.dateOptions]
			.sort((a, b) => (a.startsAt ?? '\uffff').localeCompare(b.startsAt ?? '\uffff'))
			.map((d) => d.id);
		await provider.reorderDateOptions(event.id, ids);
		return { ok: true };
	},

	addInvitee: async ({ params, request, platform }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		const label = field(await request.formData(), 'label');
		if (!label) return fail(400, { error: 'label' });
		await provider.addInvitee(event.id, label);
		return { ok: true };
	},

	renameInvitee: async ({ params, request, platform }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		const form = await request.formData();
		const inviteeId = field(form, 'inviteeId');
		const label = field(form, 'label');
		if (!event.invitees.some((i) => i.id === inviteeId)) return fail(404);
		if (!label) return fail(400, { error: 'label' });
		await provider.renameInvitee(inviteeId, label);
		return { ok: true };
	},

	removeInvitee: async ({ params, request, platform }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		const inviteeId = field(await request.formData(), 'inviteeId');
		if (!event.invitees.some((i) => i.id === inviteeId)) return fail(404);
		await provider.removeInvitee(inviteeId);
		return { ok: true };
	},

	close: async ({ params, platform }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		await provider.setEventStatus(event.id, 'closed');
		return { ok: true };
	},

	reopen: async ({ params, platform }) => {
		const { provider, event } = await resolve(platform, params.token);
		if (!event) return fail(404);
		await provider.setEventStatus(event.id, 'open');
		return { ok: true };
	}
} satisfies Actions;
