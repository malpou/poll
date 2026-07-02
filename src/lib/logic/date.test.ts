import { describe, it, expect } from 'vitest';
import { zonedToUtcIso, utcIsoToZonedParts, formatDateOption } from './date';
import { langLabel } from './locales';

const CPH = 'Europe/Copenhagen';

describe('Copenhagen wall-clock <-> UTC ISO', () => {
	it('summer (CEST, UTC+2): 15:00 CPH -> 13:00 UTC', () => {
		expect(zonedToUtcIso('2026-07-15', '15:00', CPH)).toBe('2026-07-15T13:00:00.000Z');
	});

	it('winter (CET, UTC+1): 15:00 CPH -> 14:00 UTC', () => {
		expect(zonedToUtcIso('2026-01-15', '15:00', CPH)).toBe('2026-01-15T14:00:00.000Z');
	});

	it('blank time defaults to midnight CPH', () => {
		// Midnight 15 Jul CPH (CEST +2) is 22:00 UTC the day before.
		expect(zonedToUtcIso('2026-07-15', '', CPH)).toBe('2026-07-14T22:00:00.000Z');
	});

	it('blank date -> null', () => {
		expect(zonedToUtcIso('', '15:00', CPH)).toBeNull();
	});

	it('round-trips through utcIsoToZonedParts', () => {
		const iso = zonedToUtcIso('2026-07-15', '15:00', CPH)!;
		expect(utcIsoToZonedParts(iso, CPH)).toEqual({ value: '2026-07-15', time: '15:00' });
	});

	it('date-only round-trip keeps the CPH date', () => {
		const iso = zonedToUtcIso('2026-07-15', '', CPH)!; // 22:00Z prior day
		expect(utcIsoToZonedParts(iso, CPH).value).toBe('2026-07-15');
	});

	it('utcIsoToZonedParts(null) is blank', () => {
		expect(utcIsoToZonedParts(null, CPH)).toEqual({ value: '', time: '' });
	});
});

// The zone is per event, not global: the same wall-clock in another zone must
// land on a different instant, and the same instant must render differently.
describe('other event timezones', () => {
	it('New York wall-clock -> UTC (EDT, UTC-4)', () => {
		expect(zonedToUtcIso('2026-09-12', '10:00', 'America/New_York')).toBe(
			'2026-09-12T14:00:00.000Z'
		);
	});

	it('New York round-trip', () => {
		const iso = zonedToUtcIso('2026-01-15', '09:30', 'America/New_York')!; // EST, UTC-5
		expect(iso).toBe('2026-01-15T14:30:00.000Z');
		expect(utcIsoToZonedParts(iso, 'America/New_York')).toEqual({
			value: '2026-01-15',
			time: '09:30'
		});
	});

	it('renders the same instant in the event zone, not Copenhagen', () => {
		expect(formatDateOption('2026-09-12T08:00:00Z', null, 'en', 'America/New_York')).toEqual({
			weekday: 'Saturday',
			dateLabel: '12 September 2026',
			timeRange: 'at 04:00'
		});
	});
});

// Europe/Copenhagen. 2026-09-12 is a Saturday; in September Copenhagen is
// UTC+2, so 08:00Z renders as 10:00 local. The poll's stored locale drives
// weekday/month wording and the "at" prefix (kl./at/à).
describe('formatDateOption', () => {
	it('renders Danish weekday/date and a start–end time range', () => {
		expect(formatDateOption('2026-09-12T08:00:00Z', '2026-09-12T09:00:00Z', 'da', CPH)).toEqual({
			weekday: 'lørdag',
			dateLabel: '12. september 2026',
			timeRange: 'kl. 10.00-11.00'
		});
	});

	it('renders the same instant in English', () => {
		expect(formatDateOption('2026-09-12T08:00:00Z', '2026-09-12T09:00:00Z', 'en', CPH)).toEqual({
			weekday: 'Saturday',
			dateLabel: '12 September 2026',
			timeRange: 'at 10:00-11:00'
		});
	});

	it('renders the same instant in French', () => {
		expect(formatDateOption('2026-09-12T08:00:00Z', '2026-09-12T09:00:00Z', 'fr', CPH)).toEqual({
			weekday: 'samedi',
			dateLabel: '12 septembre 2026',
			timeRange: 'à 10:00-11:00'
		});
	});

	it('omits the range end when only a start time is present', () => {
		expect(formatDateOption('2026-09-12T08:00:00Z', null, 'da', CPH).timeRange).toBe('kl. 10.00');
	});

	it('renders a date-only option (local-midnight anchor) with no time', () => {
		// The write path stores a time-less date as midnight in the event zone
		// (both ends when the form posts blank times).
		const midnight = zonedToUtcIso('2026-09-12', '', CPH)!;
		expect(formatDateOption(midnight, midnight, 'da', CPH)).toEqual({
			weekday: 'lørdag',
			dateLabel: '12. september 2026',
			timeRange: ''
		});
		expect(formatDateOption(midnight, null, 'da', CPH).timeRange).toBe('');
	});

	it('returns all-empty for a null start (malformed data, no crash)', () => {
		expect(formatDateOption(null, null, 'da', CPH)).toEqual({
			weekday: '',
			dateLabel: '',
			timeRange: ''
		});
	});
});

describe('langLabel', () => {
	it('names a language in the UI locale, capitalized', () => {
		expect(langLabel('da', 'en')).toBe('Danish');
		expect(langLabel('en', 'da')).toBe('Engelsk');
		expect(langLabel('es', 'de')).toBe('Spanisch');
	});
});
