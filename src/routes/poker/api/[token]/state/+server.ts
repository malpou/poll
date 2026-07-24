import { error, json } from '@sveltejs/kit';
import { getPokerProvider } from '$lib/data/poker';
import { assembleSnapshot, readPid, resolveRoom } from '$lib/server/poker';
import type { RequestHandler } from './$types';

// Live state snapshot for one viewer, short-polled by the client (~1s). Reveals
// nothing on an unknown token. Each poll doubles as a heartbeat so presence
// stays fresh without a separate call.
export const GET: RequestHandler = async ({ params, platform, cookies }) => {
	const provider = getPokerProvider(platform);
	if (!provider) error(503, 'planning poker requires a database');

	const resolved = await resolveRoom(provider, params.token);
	if (!resolved) error(404, 'not found');
	const { room, auth } = resolved;

	const pid = readPid(cookies, room.id);
	// Polling is the heartbeat: refresh this seat's presence if it has one.
	if (pid) await provider.heartbeat(pid);

	const snapshot = await assembleSnapshot(provider, room, pid, auth === 'controller');
	return json(snapshot, { headers: { 'cache-control': 'no-store' } });
};
