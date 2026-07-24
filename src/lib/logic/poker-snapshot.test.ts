import { describe, it, expect } from 'vitest';
import { buildSnapshot, type SnapshotInput } from './poker-snapshot';
import type { PokerParticipantRow, PokerRoomRow, PokerVoteRow, RoomPhase } from '$lib/types';

// The snapshot builder is the single enforcement point for vote privacy
// (openspec/specs/planning-poker "Cast a hidden vote"): no other seat's card
// value may appear in the payload before the reveal.

const room = (phase: RoomPhase): PokerRoomRow => ({
	id: 'e2e-poker-room',
	title: 'Sprint 12',
	deck: 'fibonacci',
	controllerToken: 'ctrl',
	joinToken: 'join',
	status: 'open',
	phase,
	activeRoundId: phase === 'waiting' ? null : 'round-1',
	rev: 3,
	createdAt: '2026-07-01T00:00:00Z'
});

const seat = (id: string, over: Partial<PokerParticipantRow> = {}): PokerParticipantRow => ({
	id,
	roomId: 'e2e-poker-room',
	name: id.toUpperCase(),
	role: 'estimator',
	isController: false,
	lastSeenAt: '2026-07-01T00:00:00Z',
	...over
});

const vote = (participantId: string, card: string): PokerVoteRow => ({
	roundId: 'round-1',
	participantId,
	card,
	updatedAt: '2026-07-01T00:00:00Z'
});

const base = (phase: RoomPhase, votes: PokerVoteRow[], viewer: string | null): SnapshotInput => ({
	room: room(phase),
	activeRound: phase === 'waiting' ? null : { id: 'round-1', title: 'Ticket A' },
	participants: [seat('alice'), seat('bob'), seat('carol')],
	votes,
	results: [],
	viewerParticipantId: viewer,
	viewerIsController: false,
	nowMs: Date.parse('2026-07-01T00:00:00Z'),
	presenceWindowMs: 15000
});

describe('buildSnapshot privacy', () => {
	it('hides every card value during voting, exposing only hasVoted', () => {
		const snap = buildSnapshot(base('voting', [vote('alice', '5'), vote('bob', '8')], 'carol'));
		expect(snap.revealed).toBeNull();
		expect(snap.signal).toBeNull();
		expect(snap.distribution).toBeNull();
		// Carol has not voted; she can see who voted, not what.
		expect(snap.roster.find((s) => s.id === 'alice')?.hasVoted).toBe(true);
		expect(snap.roster.find((s) => s.id === 'carol')?.hasVoted).toBe(false);
		// No card leaks anywhere in the serialized payload.
		expect(JSON.stringify(snap)).not.toContain('"card"');
		expect(snap.myVote).toBeNull();
	});

	it('echoes the caller their own card during voting but no one else', () => {
		const snap = buildSnapshot(base('voting', [vote('alice', '5'), vote('bob', '8')], 'alice'));
		expect(snap.myVote).toBe(5);
		// Still nothing about bob's card.
		expect(JSON.stringify(snap)).not.toContain('"card":8');
	});

	it('reveals all cards, the distribution, and the signal once revealed', () => {
		const snap = buildSnapshot(
			base('revealed', [vote('alice', '5'), vote('bob', '5'), vote('carol', '5')], 'carol')
		);
		expect(snap.revealed).toHaveLength(3);
		expect(snap.signal?.level).toBe('agree');
		expect(snap.signal?.suggestion).toBe(5);
		expect(snap.distribution?.find((d) => d.card === 5)?.count).toBe(3);
	});

	it('derives presence from the heartbeat window', () => {
		const input = base('voting', [], 'alice');
		input.participants = [
			seat('alice', { lastSeenAt: '2026-07-01T00:00:00Z' }), // just seen
			seat('bob', { lastSeenAt: '2026-06-30T23:59:00Z' }) // 60s stale > 15s window
		];
		const snap = buildSnapshot(input);
		expect(snap.roster.find((s) => s.id === 'alice')?.present).toBe(true);
		expect(snap.roster.find((s) => s.id === 'bob')?.present).toBe(false);
	});
});
