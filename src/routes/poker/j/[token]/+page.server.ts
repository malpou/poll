import { error } from '@sveltejs/kit';
import { getPokerProvider } from '$lib/data/poker';
import type { PageServerLoad } from './$types';

// Participant join + vote page. Resolves the shared join token; 404 on unknown.
export const load: PageServerLoad = async ({ params, platform }) => {
	const provider = getPokerProvider(platform);
	if (!provider) error(503, 'planning poker requires a database');

	const room = await provider.getRoomByJoinToken(params.token);
	if (!room) error(404, 'not found');

	return {
		token: params.token,
		roomTitle: room.title
	};
};
