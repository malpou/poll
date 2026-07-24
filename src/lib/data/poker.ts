// D1 access for planning poker (openspec/specs/planning-poker). Self-contained:
// planning poker shares no tables with the events model, so it has its own
// provider rather than extending DataProvider. Real-time is D1-backed - the
// live phase, roster, and votes are rows here, kept current by clients that
// short-poll the state endpoint. This is the only place poker SQL lives.

import type {
	PokerParticipantRow,
	PokerRoomRow,
	PokerRoundRow,
	PokerVoteRow,
	ParticipantRole
} from '$lib/types';
import { id, newToken } from './shared';

function mapRoom(r: Record<string, unknown>): PokerRoomRow {
	return {
		id: r.id as string,
		title: r.title as string,
		deck: r.deck as string,
		controllerToken: r.controller_token as string,
		joinToken: r.join_token as string,
		status: r.status as PokerRoomRow['status'],
		phase: r.phase as PokerRoomRow['phase'],
		activeRoundId: (r.active_round_id as string | null) ?? null,
		rev: r.rev as number,
		createdAt: r.created_at as string
	};
}

function mapRound(r: Record<string, unknown>): PokerRoundRow {
	return {
		id: r.id as string,
		roomId: r.room_id as string,
		title: r.title as string,
		sortOrder: r.sort_order as number,
		finalEstimate: (r.final_estimate as string | null) ?? null,
		decidedAt: (r.decided_at as string | null) ?? null
	};
}

function mapParticipant(r: Record<string, unknown>): PokerParticipantRow {
	return {
		id: r.id as string,
		roomId: r.room_id as string,
		name: r.name as string,
		role: r.role as ParticipantRole,
		isController: r.is_controller === 1,
		lastSeenAt: r.last_seen_at as string
	};
}

function mapVote(r: Record<string, unknown>): PokerVoteRow {
	return {
		roundId: r.round_id as string,
		participantId: r.participant_id as string,
		card: r.card as string,
		updatedAt: r.updated_at as string
	};
}

export interface CreateRoomResult {
	roomId: string;
	controllerToken: string;
	joinToken: string;
}

export interface PokerProvider {
	createRoom(title: string): Promise<CreateRoomResult>;
	getRoomByControllerToken(token: string): Promise<PokerRoomRow | null>;
	getRoomByJoinToken(token: string): Promise<PokerRoomRow | null>;
	getRoundById(roundId: string): Promise<PokerRoundRow | null>;
	listParticipants(roomId: string): Promise<PokerParticipantRow[]>;
	listVotes(roundId: string): Promise<PokerVoteRow[]>;
	/** Decided items in display order - the durable results log. */
	listResults(roomId: string): Promise<{ title: string; estimate: string }[]>;

	// --- Participant actions ---
	/** Upsert a seat by id (cookie-carried), refreshing its name/role and heartbeat. */
	joinRoom(
		roomId: string,
		participantId: string,
		name: string,
		role: ParticipantRole,
		isController: boolean
	): Promise<void>;
	/** Refresh presence only. */
	heartbeat(participantId: string): Promise<void>;
	/** Cast/replace the active-round vote. No-op unless the room is in `voting`. */
	castVote(roomId: string, participantId: string, card: string): Promise<void>;

	// --- Controller actions (each bumps rev) ---
	/** Create the next item and open voting on it. */
	openRound(roomId: string, title: string): Promise<void>;
	/** waiting/revealed → voting is refused; only voting reveals. */
	reveal(roomId: string): Promise<void>;
	/** Re-open voting on the active item, clearing its votes. */
	revote(roomId: string): Promise<void>;
	/** Record the final estimate, clear votes, return to waiting. */
	finalize(roomId: string, estimate: string): Promise<void>;
	/** End the session: status closed, votes cleared, results kept. */
	closeRoom(roomId: string): Promise<void>;
}

export function pokerProvider(db: D1Database): PokerProvider {
	const room = async (where: string, token: string): Promise<PokerRoomRow | null> => {
		const r = await db.prepare(`SELECT * FROM poker_rooms WHERE ${where} = ?`).bind(token).first();
		return r ? mapRoom(r) : null;
	};

	// A room is required for most mutations; caller already resolved it by token.
	const bumpRev = (roomId: string) =>
		db.prepare(`UPDATE poker_rooms SET rev = rev + 1 WHERE id = ?`).bind(roomId);

	return {
		async createRoom(title: string) {
			const roomId = id('room');
			const controllerToken = newToken();
			const joinToken = newToken();
			await db
				.prepare(
					`INSERT INTO poker_rooms (id, title, deck, controller_token, join_token, status, phase, active_round_id, rev, created_at)
					 VALUES (?, ?, 'fibonacci', ?, ?, 'open', 'waiting', NULL, 0, datetime('now'))`
				)
				.bind(roomId, title, controllerToken, joinToken)
				.run();
			return { roomId, controllerToken, joinToken };
		},

		getRoomByControllerToken: (t) => room('controller_token', t),
		getRoomByJoinToken: (t) => room('join_token', t),

		async getRoundById(roundId) {
			const r = await db.prepare(`SELECT * FROM poker_rounds WHERE id = ?`).bind(roundId).first();
			return r ? mapRound(r) : null;
		},

		async listParticipants(roomId) {
			const { results } = await db
				.prepare(`SELECT * FROM poker_participants WHERE room_id = ? ORDER BY last_seen_at`)
				.bind(roomId)
				.all();
			return results.map(mapParticipant);
		},

		async listVotes(roundId) {
			const { results } = await db
				.prepare(`SELECT * FROM poker_votes WHERE round_id = ?`)
				.bind(roundId)
				.all();
			return results.map(mapVote);
		},

		async listResults(roomId) {
			const { results } = await db
				.prepare(
					`SELECT title, final_estimate FROM poker_rounds
					 WHERE room_id = ? AND final_estimate IS NOT NULL ORDER BY sort_order`
				)
				.bind(roomId)
				.all();
			return results.map((r) => ({
				title: r.title as string,
				estimate: r.final_estimate as string
			}));
		},

		async joinRoom(roomId, participantId, name, role, isController) {
			// Insert a new seat or update the existing one (name/role can change,
			// heartbeat always refreshes). rev bumps so others see the roster change.
			await db.batch([
				db
					.prepare(
						`INSERT INTO poker_participants (id, room_id, name, role, is_controller, last_seen_at)
						 VALUES (?, ?, ?, ?, ?, datetime('now'))
						 ON CONFLICT(id) DO UPDATE SET name = excluded.name, role = excluded.role,
						   is_controller = excluded.is_controller, last_seen_at = datetime('now')`
					)
					.bind(participantId, roomId, name, role, isController ? 1 : 0),
				bumpRev(roomId)
			]);
		},

		async heartbeat(participantId) {
			await db
				.prepare(`UPDATE poker_participants SET last_seen_at = datetime('now') WHERE id = ?`)
				.bind(participantId)
				.run();
		},

		async castVote(roomId, participantId, card) {
			// Guard the phase in SQL: the vote only lands while the room is voting and
			// there is an active round. Refresh presence at the same time.
			await db.batch([
				db
					.prepare(
						`INSERT INTO poker_votes (round_id, participant_id, card, updated_at)
						 SELECT active_round_id, ?, ?, datetime('now') FROM poker_rooms
						 WHERE id = ? AND phase = 'voting' AND active_round_id IS NOT NULL
						 ON CONFLICT(round_id, participant_id) DO UPDATE SET card = excluded.card, updated_at = excluded.updated_at`
					)
					.bind(participantId, card, roomId),
				db
					.prepare(`UPDATE poker_participants SET last_seen_at = datetime('now') WHERE id = ?`)
					.bind(participantId),
				bumpRev(roomId)
			]);
		},

		async openRound(roomId, title) {
			const roundId = id('round');
			await db.batch([
				db
					.prepare(
						`INSERT INTO poker_rounds (id, room_id, title, sort_order, final_estimate, decided_at)
						 VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM poker_rounds WHERE room_id = ?), NULL, NULL)`
					)
					.bind(roundId, roomId, title, roomId),
				db
					.prepare(
						`UPDATE poker_rooms SET phase = 'voting', active_round_id = ?, rev = rev + 1
						 WHERE id = ? AND status = 'open'`
					)
					.bind(roundId, roomId)
			]);
		},

		async reveal(roomId) {
			await db
				.prepare(
					`UPDATE poker_rooms SET phase = 'revealed', rev = rev + 1
					 WHERE id = ? AND phase = 'voting'`
				)
				.bind(roomId)
				.run();
		},

		async revote(roomId) {
			await db.batch([
				db
					.prepare(
						`DELETE FROM poker_votes WHERE round_id = (SELECT active_round_id FROM poker_rooms WHERE id = ?)`
					)
					.bind(roomId),
				db
					.prepare(
						`UPDATE poker_rooms SET phase = 'voting', rev = rev + 1
						 WHERE id = ? AND phase = 'revealed'`
					)
					.bind(roomId)
			]);
		},

		async finalize(roomId, estimate) {
			await db.batch([
				db
					.prepare(
						`UPDATE poker_rounds SET final_estimate = ?, decided_at = datetime('now')
						 WHERE id = (SELECT active_round_id FROM poker_rooms WHERE id = ? AND phase = 'revealed')`
					)
					.bind(estimate, roomId),
				db
					.prepare(
						`DELETE FROM poker_votes WHERE round_id = (SELECT active_round_id FROM poker_rooms WHERE id = ?)`
					)
					.bind(roomId),
				db
					.prepare(
						`UPDATE poker_rooms SET phase = 'waiting', active_round_id = NULL, rev = rev + 1
						 WHERE id = ? AND phase = 'revealed'`
					)
					.bind(roomId)
			]);
		},

		async closeRoom(roomId) {
			await db.batch([
				db
					.prepare(
						`DELETE FROM poker_votes WHERE round_id IN (SELECT id FROM poker_rounds WHERE room_id = ?)`
					)
					.bind(roomId),
				db
					.prepare(
						`UPDATE poker_rooms SET status = 'closed', phase = 'waiting', active_round_id = NULL, rev = rev + 1
						 WHERE id = ?`
					)
					.bind(roomId)
			]);
		}
	};
}

// Poker requires D1 (the live session is D1-backed); the mock provider used by
// `vite dev`/unit tests has no DB. Routes call this and handle a null (503).
export function getPokerProvider(platform?: App.Platform): PokerProvider | null {
	return platform?.env.DB ? pokerProvider(platform.env.DB) : null;
}
