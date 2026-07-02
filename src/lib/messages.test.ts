import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// DESIGN.md Voice rule: no em-dashes in user-facing copy, any locale.
const dir = new URL('../../messages/', import.meta.url);
const catalogs = readdirSync(dir).filter((f) => f.endsWith('.json'));

describe('message catalogs', () => {
	it('cover all five locales', () => {
		expect(catalogs.sort()).toEqual(['da.json', 'de.json', 'en.json', 'es.json', 'fr.json']);
	});

	for (const file of catalogs) {
		it(`${file} contains no em-dashes`, () => {
			const messages = JSON.parse(readFileSync(new URL(file, dir), 'utf8')) as Record<
				string,
				unknown
			>;
			const offenders = Object.entries(messages)
				.filter(([, value]) => typeof value === 'string' && value.includes('—'))
				.map(([key]) => key);
			expect(offenders).toEqual([]);
		});
	}
});
