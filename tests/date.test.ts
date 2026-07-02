import { describe, it, expect } from 'vitest';
import { formatDateOption } from '../src/lib/date';

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
