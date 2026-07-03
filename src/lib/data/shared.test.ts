import { describe, it, expect } from 'vitest';
import { newAdminCode } from './shared';

describe('newAdminCode', () => {
	it('is 8 chars from the unambiguous alphabet (no I/O/0/1)', () => {
		const allowed = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;
		for (let i = 0; i < 200; i++) {
			const code = newAdminCode();
			expect(code).toMatch(allowed);
		}
	});
});
