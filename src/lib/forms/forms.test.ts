import { describe, it, expect } from 'vitest';
import { field, validateTimes } from './forms';

// field() reads one trimmed string field; validateTimes() guards a date
// option's optional start/end times (src/lib/forms).

describe('field', () => {
	it('trims a present string value', () => {
		const f = new FormData();
		f.set('name', '  Alice  ');
		expect(field(f, 'name')).toBe('Alice');
	});

	it('returns empty string when absent or non-string', () => {
		const f = new FormData();
		f.set('file', new Blob(['x']));
		expect(field(f, 'missing')).toBe('');
		expect(field(f, 'file')).toBe('');
	});
});

describe('validateTimes', () => {
	it('accepts empty, start-only, and ordered start+end', () => {
		expect(validateTimes('', '')).toBeNull();
		expect(validateTimes('18:00', '')).toBeNull();
		expect(validateTimes('18:00', '21:00')).toBeNull();
		expect(validateTimes('18:00', '18:00')).toBeNull();
	});

	it('rejects an end without a start', () => {
		expect(validateTimes('', '21:00')).not.toBeNull();
	});

	it('rejects an end before its start', () => {
		expect(validateTimes('21:00', '18:00')).not.toBeNull();
	});
});
