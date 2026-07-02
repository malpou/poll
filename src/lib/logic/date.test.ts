import { describe, it, expect } from 'vitest';
import { zonedToUtcIso, utcIsoToZonedParts, formatDateOption } from './date';

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

// Europe/Copenhagen (PROJECT.md). 2026-09-12 is a Saturday; in September
// Copenhagen is UTC+2, so 08:00Z renders as 10:00 local. The poll's stored
// locale drives weekday/month wording and the "at" prefix (kl./at/à).
describe('formatDateOption', () => {
	it('renders Danish weekday/date and a start–end time range', () => {
		expect(formatDateOption('2026-09-12T08:00:00Z', '2026-09-12T09:00:00Z', 'da')).toEqual({
			weekday: 'lørdag',
			dateLabel: '12. september 2026',
			timeRange: 'kl. 10.00-11.00'
		});
	});

	it('renders the same instant in English', () => {
		expect(formatDateOption('2026-09-12T08:00:00Z', '2026-09-12T09:00:00Z', 'en')).toEqual({
			weekday: 'Saturday',
			dateLabel: '12 September 2026',
			timeRange: 'at 10:00-11:00'
		});
	});

	it('renders the same instant in French', () => {
		expect(formatDateOption('2026-09-12T08:00:00Z', '2026-09-12T09:00:00Z', 'fr')).toEqual({
			weekday: 'samedi',
			dateLabel: '12 septembre 2026',
			timeRange: 'à 10:00-11:00'
		});
	});

	it('omits the range end when only a start time is present', () => {
		expect(formatDateOption('2026-09-12T08:00:00Z', null, 'da').timeRange).toBe('kl. 10.00');
	});

	it('returns all-empty for a null start (malformed data, no crash)', () => {
		expect(formatDateOption(null, null, 'da')).toEqual({
			weekday: '',
			dateLabel: '',
			timeRange: ''
		});
	});
});
