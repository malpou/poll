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

	const roster: RosterSeat[] = participants.map((p) => ({
		id: p.id,
		name: p.name,
		role: p.role,
		isController: p.isController,
		present: nowMs - Date.parse(p.lastSeenAt) <= presenceWindowMs,
		hasVoted: votedIds.has(p.id)
	}));

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
		viewerIsController,
		viewerSeated: !!mySeat,
		viewerRole: mySeat?.role ?? null
	};
}
