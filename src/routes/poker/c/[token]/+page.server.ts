import { error } from '@sveltejs/kit';
import { getPokerProvider } from '$lib/data/poker';
import { setRequestLocale } from '../../../../hooks.server';
import type { PageServerLoad } from './$types';

// Controller console. Resolves the private controller token; 404 (reveal
// nothing) on an unknown token, same discipline as the async token pages. The
// live loop runs client-side against the state/command endpoints.
export const load: PageServerLoad = async ({ params, platform, url }) => {
	const provider = getPokerProvider(platform);
	if (!provider) error(503, 'planning poker requires a database');

	const room = await provider.getRoomByControllerToken(params.token);
	if (!room) error(404, 'not found');
	// The room's own language, not the visitor's: one join link serves everyone.
	setRequestLocale(room.locale);

	return {
		token: params.token,
		roomTitle: room.title,
		accent: room.accent,
		// The shared link to hand out; built off the request origin like the
		// async dashboard's invitee/share links.
		joinUrl: `${url.origin}/poker/j/${room.joinToken}`
	};
};
