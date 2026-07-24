import { error, json } from '@sveltejs/kit';
import { getPokerProvider } from '$lib/data/poker';
import { id } from '$lib/data/shared';
import { cardFromText } from '$lib/logic/poker';
import { assembleSnapshot, readPid, resolveRoom, writePid } from '$lib/server/poker';
import type { ParticipantRole } from '$lib/types';
import type { RequestHandler } from './$types';

// One live action against a room. The token is the credential: control actions
// (open/reveal/revote/finalize/close) require the controller token; the join
// token grants only join/vote/heartbeat/leave. Returns the fresh snapshot so
// the acting client updates without waiting for its next poll.

const CONTROL = new Set(['open', 'reveal', 'revote', 'finalize', 'close']);

// A finalized estimate is a deck card or an explicit split/skip marker.
function validEstimate(v: unknown): v is string {
	return typeof v === 'string' && (cardFromText(v) !== null || v === 'split' || v === 'skip');
}

export const POST: RequestHandler = async ({ params, platform, cookies, request }) => {
	const provider = getPokerProvider(platform);
	if (!provider) error(503, 'planning poker requires a database');

	const resolved = await resolveRoom(provider, params.token);
	if (!resolved) error(404, 'not found');
	const { room, auth } = resolved;

	const body = (await request.json().catch(() => null)) as
		({ action?: string } & Record<string, unknown>) | null;
	if (!body || typeof body.action !== 'string') error(400, 'missing action');
	const action = body.action;

	// Control actions are controller-only; a participant's attempt is refused,
	// never silently applied.
	if (CONTROL.has(action) && auth !== 'controller') error(403, 'controller only');
	// A closed room accepts no mutations, only reads.
	if (room.status === 'closed' && action !== 'heartbeat') error(409, 'room is closed');

	let pid = readPid(cookies, room.id);

	switch (action) {
		case 'join': {
			const name = typeof body.name === 'string' ? body.name.trim().slice(0, 60) : '';
			if (!name) error(400, 'name required');
			const role: ParticipantRole = body.role === 'observer' ? 'observer' : 'estimator';
			if (!pid) {
				pid = id('seat');
				writePid(cookies, room.id, pid);
			}
			await provider.joinRoom(room.id, pid, name, role, auth === 'controller');
			break;
		}
		case 'vote': {
			if (!pid) error(400, 'join first');
			const card = cardFromText(typeof body.card === 'string' ? body.card : '');
			if (card === null) error(400, 'invalid card');
			await provider.castVote(room.id, pid, String(card));
			break;
		}
		case 'heartbeat': {
			if (pid) await provider.heartbeat(pid);
			break;
		}
		case 'leave': {
			if (pid) await provider.removeParticipant(room.id, pid);
			break;
		}
		case 'open': {
			const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
			if (!title) error(400, 'title required');
			await provider.openRound(room.id, title);
			break;
		}
		case 'reveal':
			await provider.reveal(room.id);
			break;
		case 'revote':
			await provider.revote(room.id);
			break;
		case 'finalize': {
			if (!validEstimate(body.estimate)) error(400, 'invalid estimate');
			await provider.finalize(room.id, body.estimate);
			break;
		}
		case 'close':
			await provider.closeRoom(room.id);
			break;
		default:
			error(400, 'unknown action');
	}

	// Re-read the room (phase/rev/active round may have changed) and return the
	// fresh snapshot for the acting viewer.
	const reresolved = await resolveRoom(provider, params.token);
	const fresh = reresolved?.room ?? room;
	const snapshot = await assembleSnapshot(provider, fresh, pid, auth === 'controller');
	return json(snapshot, { headers: { 'cache-control': 'no-store' } });
};
