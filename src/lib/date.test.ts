import { describe, it, expect } from 'vitest';
import { zonedToUtcIso, utcIsoToZonedParts } from './date';

describe('Copenhagen wall-clock <-> UTC ISO', () => {
	it('summer (CEST, UTC+2): 15:00 CPH -> 13:00 UTC', () => {
		expect(zonedToUtcIso('2026-07-15', '15:00')).toBe('2026-07-15T13:00:00.000Z');
	});

	it('winter (CET, UTC+1): 15:00 CPH -> 14:00 UTC', () => {
		expect(zonedToUtcIso('2026-01-15', '15:00')).toBe('2026-01-15T14:00:00.000Z');
	});

	it('blank time defaults to midnight CPH', () => {
		// Midnight 15 Jul CPH (CEST +2) is 22:00 UTC the day before.
		expect(zonedToUtcIso('2026-07-15', '')).toBe('2026-07-14T22:00:00.000Z');
	});

	it('blank date -> null', () => {
		expect(zonedToUtcIso('', '15:00')).toBeNull();
	});

	it('round-trips through utcIsoToZonedParts', () => {
		const iso = zonedToUtcIso('2026-07-15', '15:00')!;
		expect(utcIsoToZonedParts(iso)).toEqual({ value: '2026-07-15', time: '15:00' });
	});

	it('date-only round-trip keeps the CPH date', () => {
		const iso = zonedToUtcIso('2026-07-15', '')!; // 22:00Z prior day
		expect(utcIsoToZonedParts(iso).value).toBe('2026-07-15');
	});

	it('utcIsoToZonedParts(null) is blank', () => {
		expect(utcIsoToZonedParts(null)).toEqual({ value: '', time: '' });
	});
});
