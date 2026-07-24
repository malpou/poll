import { error, fail, redirect } from '@sveltejs/kit';
import { getPokerProvider } from '$lib/data/poker';
import { field } from '$lib/forms/forms';
import { m } from '$lib/paraglide/messages';
import type { Actions } from './$types';

// Create a planning-poker room: free and instant, like the async create flow.
// Lands the creator on the controller console.
export const actions = {
	create: async ({ request, platform }) => {
		const provider = getPokerProvider(platform);
		if (!provider) error(503, 'planning poker requires a database');

		const form = await request.formData();
		const title = field(form, 'title');
		if (!title) return fail(400, { error: m.pokerErrorNoRoomName(), title });

		const { controllerToken } = await provider.createRoom(title);
		redirect(303, `/poker/c/${controllerToken}`);
	}
} satisfies Actions;
