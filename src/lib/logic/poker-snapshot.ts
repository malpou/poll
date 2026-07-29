// Assembles the viewer-facing room snapshot from raw D1 rows
// (openspec/specs/planning-poker). Pure and viewer-aware: it is the single
// place that enforces vote privacy - card values of other seats are never
// included before the reveal. Both the state endpoint and any test build the
// snapshot through here, so the privacy guarantee cannot be bypassed.

import type {
	PokerParticipantRow,
	PokerRoomRow,
	PokerVoteRow,
	ParticipantRole,
	RoomPhase,
	RoomStatus
} from '$lib/types';
import {
	type AgreementSignal,
	type Card,
	DECK,
	agreementSignal,
	cardFromText,
	voteDistribution
} from './poker';

// A seat as the roster renders it. During voting only `hasVoted` is exposed
// per seat; the card itself is withheld (privacy).
export interface RosterSeat {
	id: string;
	name: string;
	role: ParticipantRole;
	isController: boolean;
	present: boolean;
	hasVoted: boolean;
}

/**
 * Whether the controller may reveal yet: every estimator who is actually here
 * has cast a card, and there is at least one of them. Observers never vote, so
 * they never hold the room up; away seats (someone who closed the tab or
 * dropped) are skipped too, so one absentee can't deadlock the round.
 *
 * ponytail: advisory - enforced on the controller's own UI only. The reveal
 * command still accepts, because the controller already holds full control of
 * the room; there is no adversary to guard against, only a mis-click.
 */
export function pendingVoters(roster: RosterSeat[]): RosterSeat[] {
	return roster.filter((s) => s.role === 'estimator' && s.present && !s.hasVoted);
}

export function canReveal(roster: RosterSeat[]): boolean {
	const estimators = roster.filter((s) => s.role === 'estimator' && s.present);
	return estimators.length > 0 && estimators.every((s) => s.hasVoted);
}

export interface RevealedVote {
	participantId: string;
	name: string;
	card: Card;
}

export interface RoomSnapshot {
	status: RoomStatus;
	phase: RoomPhase;
	rev: number;
	activeRound: { id: string; title: string } | null;
	roster: RosterSeat[];
	// The caller's own current card (echoed back to them during voting so their
	// selection survives a refresh). Null when they have not voted / have no seat.
	myVote: Card | null;
	// Non-null only when phase is 'revealed': every cast card, face up.
	revealed: RevealedVote[] | null;
	signal: AgreementSignal | null;
	distribution: { card: Card; count: number }[] | null;
	// Decided items, in order - the durable results log.
	results: { title: string; estimate: string }[];
	// Who called the standing coffee break ('' = a caller without a seat), or
	// null when the room is not on a break.
	breakCalledBy: string | null;
	viewerIsController: boolean;
	// Whether this viewer already holds a seat (so a refresh skips the join
	// form), and that seat's role. Null role when they have no seat yet.
	viewerSeated: boolean;
	viewerRole: ParticipantRole | null;
}

export interface SnapshotInput {
	room: PokerRoomRow;
	activeRound: { id: string; title: string } | null;
	participants: PokerParticipantRow[];
	// Votes for the active round only.
	votes: PokerVoteRow[];
	// Decided rounds (final_estimate set), in display order.
	results: { title: string; estimate: string }[];
	viewerParticipantId: string | null;
	viewerIsController: boolean;
	nowMs: number;
	presenceWindowMs: number;
}

export function buildSnapshot(input: SnapshotInput): RoomSnapshot {
	const {
		room,
		activeRound,
		participants,
		votes,
		results,
		viewerParticipantId,
		viewerIsController,
		nowMs,
		presenceWindowMs
	} = input;

	const votedIds = new Set(votes.map((v) => v.participantId));
	const nameById = new Map(participants.map((p) => [p.id, p.name]));

	// Alphabetical by name so the roster does not reshuffle between polls
	// (join order and row order are both unstable); id breaks name ties. Once
	// revealed the same list re-sorts by card, low to high, so the spread reads
	// off the roster directly - deck order puts the specials after the numerals
	// and seats without a card last.
	const cardByPid = new Map(votes.map((v) => [v.participantId, cardFromText(v.card)]));
	const rank = (pid: string) => {
		const i = DECK.indexOf(cardByPid.get(pid) ?? (null as never));
		return i < 0 ? DECK.length : i;
	};
	const byName = (a: RosterSeat, b: RosterSeat) =>
		a.name.localeCompare(b.name) || a.id.localeCompare(b.id);

	const roster: RosterSeat[] = participants
		.map((p) => ({
			id: p.id,
			name: p.name,
			role: p.role,
			isController: p.isController,
			present: nowMs - Date.parse(p.lastSeenAt) <= presenceWindowMs,
			hasVoted: votedIds.has(p.id)
		}))
		.sort(room.phase === 'revealed' ? (a, b) => rank(a.id) - rank(b.id) || byName(a, b) : byName);

	// The caller's own vote is always theirs to see (voting or revealed).
	const own = viewerParticipantId
		? votes.find((v) => v.participantId === viewerParticipantId)
		: undefined;
	const myVote = own ? cardFromText(own.card) : null;

	const mySeat = viewerParticipantId
		? participants.find((p) => p.id === viewerParticipantId)
		: undefined;

	// Privacy gate: other seats' card values only exist in the payload once the
	// controller has revealed. Before that, the roster's hasVoted is all anyone
	// (including a crafted client) can read.
	let revealed: RevealedVote[] | null = null;
	let signal: AgreementSignal | null = null;
	let distribution: { card: Card; count: number }[] | null = null;

	if (room.phase === 'revealed') {
		const cards: Card[] = [];
		revealed = [];
		for (const v of votes) {
			const card = cardFromText(v.card);
			if (card === null) continue;
			cards.push(card);
			revealed.push({
				participantId: v.participantId,
				name: nameById.get(v.participantId) ?? '',
				card
			});
		}
		signal = agreementSignal(cards);
		distribution = voteDistribution(cards);
	}

	return {
		status: room.status,
		phase: room.phase,
		rev: room.rev,
		activeRound,
		roster,
		myVote,
		revealed,
		signal,
		distribution,
		results,
		breakCalledBy: room.breakCalledBy,
		viewerIsController,
		viewerSeated: !!mySeat,
		viewerRole: mySeat?.role ?? null
	};
}
