import { fail } from '@sveltejs/kit';
import { getProvider } from '$lib/data/provider';
import { formatDateOption, utcIsoToZonedParts } from '$lib/date';
import { field, validateTimes } from '$lib/forms';
import { markBest } from '$lib/results';
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

export const load: PageServerLoad = async ({ params, platform }) => {
	const provider = getProvider(platform);
	const event = await provider.getEventByOrganizerToken(params.token);
	// Reveal nothing on an unknown token — same discipline as the response page.
	if (!event) return { invalid: true as const };

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
			const total = c.preferred + c.available + c.unavailable;
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
				answeredLabel: `${String(total)} af ${String(totalInvitees)} har svaret`,
				...formatDateOption(d.startsAt, d.endsAt)
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
		title: event.title,
		description: event.description,
		closed: event.status === 'closed',
		results: resultsView,
		options: event.dateOptions.map((d) => {
			// Copenhagen wall-clock parts for the edit form's native inputs.
			const start = utcIsoToZonedParts(d.startsAt);
			return {
				id: d.id,
				value: start.value,
				startTime: start.time,
				endTime: d.endsAt ? utcIsoToZonedParts(d.endsAt).time : '',
				hasResponses: optionHasResponses.get(d.id) ?? false,
				...formatDateOption(d.startsAt, d.endsAt)
			};
		}),
		invitees: event.invitees.map((inv) => ({
			id: inv.id,
			label: inv.label,
			url: provider.inviteeUrl(inv.token),
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
