// Server helpers shared by the planning-poker state + command endpoints
// (openspec/specs/planning-poker). Resolves a capability token to a room + the
// caller's authority, and assembles the viewer-aware snapshot. The token is the
// only credential; an unknown token resolves to null and the endpoint 404s.

import type { Cookies } from '@sveltejs/kit';
import type { PokerProvider } from '$lib/data/poker';
import type { PokerRoomRow } from '$lib/types';
import { buildSnapshot, type RoomSnapshot } from '$lib/logic/poker-snapshot';

// A seat is "present" while its heartbeat is within this window. Clients poll
// ~every second, so a closed tab drops out a few polls after it stops (explicit
// leave removes it at once; this is the crash backstop).
export const PRESENCE_WINDOW_MS = 15_000;

// controller = holds the private controller token (may facilitate + estimate);
// participant = holds the shared join token (join + vote only).
export type Authority = 'controller' | 'participant';

export interface ResolvedRoom {
	room: PokerRoomRow;
	auth: Authority;
}

/** Resolve a token to its room + authority. Controller token wins if both matched. */
export async function resolveRoom(
	provider: PokerProvider,
	token: string
): Promise<ResolvedRoom | null> {
	const asController = await provider.getRoomByControllerToken(token);
	if (asController) return { room: asController, auth: 'controller' };
	const asParticipant = await provider.getRoomByJoinToken(token);
	if (asParticipant) return { room: asParticipant, auth: 'participant' };
	return null;
}

// The per-browser participant id lives in a cookie scoped to the room, so one
// browser holds a stable seat per room (a refresh resumes it) without the id
// ever appearing in a URL.
export function pidCookieName(roomId: string): string {
	return `pk_${roomId}`;
}

export function readPid(cookies: Cookies, roomId: string): string | null {
	return cookies.get(pidCookieName(roomId)) ?? null;
}

export function writePid(cookies: Cookies, roomId: string, pid: string): void {
	cookies.set(pidCookieName(roomId), pid, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 // a day is plenty for one estimation session
	});
}

/** Fetch the room's live rows and assemble the snapshot for this viewer. */
export async function assembleSnapshot(
	provider: PokerProvider,
	room: PokerRoomRow,
	viewerPid: string | null,
	viewerIsController: boolean
): Promise<RoomSnapshot> {
	const activeRoundP = room.activeRoundId
		? provider.getRoundById(room.activeRoundId)
		: Promise.resolve(null);
	const [activeRound, participants, results] = await Promise.all([
		activeRoundP,
		provider.listParticipants(room.id),
		provider.listResults(room.id)
	]);
	const votes = room.activeRoundId ? await provider.listVotes(room.activeRoundId) : [];

	return buildSnapshot({
		room,
		activeRound: activeRound ? { id: activeRound.id, title: activeRound.title } : null,
		participants,
		votes,
		results,
		viewerParticipantId: viewerPid,
		viewerIsController,
		nowMs: Date.now(),
		presenceWindowMs: PRESENCE_WINDOW_MS
	});
}
