import { fail } from '@sveltejs/kit';
import { getProvider } from '$lib/data/provider';
import { formatDateOption, utcIsoToZonedParts } from '$lib/date';
import { field, validateTimes } from '$lib/forms';
import type { DateOptionInput } from '$lib/data/provider';
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

	// Which options/invitees have responses? Drives the delete-warning confirm.
	const results = await provider.getResults(event.id);
	const optionHasResponses = new Map(
		results.map((r) => [r.dateOptionId, r.preferred + r.available + r.unavailable > 0])
	);

	return {
		invalid: false as const,
		token: params.token,
		title: event.title,
		description: event.description,
		closed: event.status === 'closed',
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
			url: provider.inviteeUrl(inv.token)
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
