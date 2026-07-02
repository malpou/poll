import { describe, it, expect } from 'vitest';
import {
	inviteeStatus,
	orderForRespondent,
	responseCountByInvitee
} from '../src/lib/participant-status';

describe('responseCountByInvitee', () => {
	it('counts rows per invitee', () => {
		const counts = responseCountByInvitee([
			{ inviteeId: 'a' },
			{ inviteeId: 'a' },
			{ inviteeId: 'b' }
		]);
		expect(counts.get('a')).toBe(2);
		expect(counts.get('b')).toBe(1);
		expect(counts.has('c')).toBe(false);
	});

	it('empty input → empty map', () => {
		expect(responseCountByInvitee([]).size).toBe(0);
	});
});

describe('inviteeStatus', () => {
	it('zero responses → none', () => {
		expect(inviteeStatus(0, 3)).toBe('none');
	});

	it('fewer responses than options → partial', () => {
		expect(inviteeStatus(1, 3)).toBe('partial');
		expect(inviteeStatus(2, 3)).toBe('partial');
	});

	it('all options answered → complete', () => {
		expect(inviteeStatus(3, 3)).toBe('complete');
	});

	it('no options → none, never partial', () => {
		expect(inviteeStatus(0, 0)).toBe('none');
	});
});

describe('orderForRespondent', () => {
	const dates = [{ id: 'd1' }, { id: 'd2' }, { id: 'd3' }, { id: 'd4' }];

	it('first visit (no prior answers) keeps order and flags nothing', () => {
		const out = orderForRespondent(dates, new Set());
		expect(out.map((d) => d.id)).toEqual(['d1', 'd2', 'd3', 'd4']);
		expect(out.every((d) => !d.needsAnswer)).toBe(true);
	});

	it('unanswered dates move first, both groups keeping input order', () => {
		const out = orderForRespondent(dates, new Set(['d1', 'd3']));
		expect(out.map((d) => d.id)).toEqual(['d2', 'd4', 'd1', 'd3']);
		expect(out.map((d) => d.needsAnswer)).toEqual([true, true, false, false]);
	});

	it('everything answered → original order, no flags', () => {
		const out = orderForRespondent(dates, new Set(['d1', 'd2', 'd3', 'd4']));
		expect(out.map((d) => d.id)).toEqual(['d1', 'd2', 'd3', 'd4']);
		expect(out.every((d) => !d.needsAnswer)).toBe(true);
	});
});
