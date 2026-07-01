import { describe, it, expect } from 'vitest';
import { formatDateOption } from '../src/lib/date';

// Danish, lowercase, Europe/Copenhagen (PROJECT.md). 2026-09-12 is a Saturday;
// in September Copenhagen is UTC+2, so 08:00Z renders as 10:00 local.
describe('formatDateOption', () => {
	it('renders Danish weekday/date and a start–end time range', () => {
		expect(formatDateOption('2026-09-12T08:00:00Z', '2026-09-12T09:00:00Z')).toEqual({
			weekday: 'lørdag',
			dateLabel: '12. september 2026',
			timeRange: 'kl. 10.00–11.00'
		});
	});

	it('omits the range end when only a start time is present', () => {
		expect(formatDateOption('2026-09-12T08:00:00Z', null).timeRange).toBe('kl. 10.00');
	});

	it('returns all-empty for a null start (malformed data, no crash)', () => {
		expect(formatDateOption(null, null)).toEqual({ weekday: '', dateLabel: '', timeRange: '' });
	});
});
