import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { RESULTS_SQL } from './shared';

// D1 is SQLite, so we exercise the real 0001_init.sql + the real RESULTS_SQL
// against in-memory better-sqlite3 - test and prod schema can't drift.
const migration = readFileSync(
	fileURLToPath(new URL('../../../migrations/0001_init.sql', import.meta.url)),
	'utf8'
);

interface Row {
	id: string;
	preferred: number;
	available: number;
	unavailable: number;
}

let db: Database.Database;

// Mirror of getResults' notAnswered derivation (invitee total − answered).
function results(eventId: string) {
	const total = (
		db.prepare(`SELECT COUNT(*) AS n FROM invitees WHERE event_id = ?`).get(eventId) as {
			n: number;
		}
	).n;
	const rows = db.prepare(RESULTS_SQL).all(eventId) as Row[];
	return rows.map((r) => ({
		...r,
		notAnswered: total - (r.preferred + r.available + r.unavailable)
	}));
}

beforeEach(() => {
	db = new Database(':memory:');
	db.exec(migration);
	// One event, 3 dates, 3 invitees.
	db.exec(`INSERT INTO events (id, title, organizer_token, created_at)
	         VALUES ('e1', 'Test', 'otok', '2026-07-01T00:00:00Z')`);
	for (const d of ['d1', 'd2', 'd3']) {
		db.prepare(`INSERT INTO date_options (id, event_id, sort_order) VALUES (?, 'e1', ?)`).run(
			d,
			d.slice(1)
		);
	}
	for (const i of ['i1', 'i2', 'i3']) {
		db.prepare(
			`INSERT INTO invitees (id, event_id, label, token, created_at) VALUES (?, 'e1', ?, ?, '2026-07-01T00:00:00Z')`
		).run(i, i, `tok-${i}`);
	}
});

function respond(invitee: string, date: string, pref: string) {
	db.prepare(
		`INSERT INTO responses (invitee_id, date_option_id, preference, updated_at)
		 VALUES (?, ?, ?, '2026-07-01T00:00:00Z')
		 ON CONFLICT(invitee_id, date_option_id)
		 DO UPDATE SET preference = excluded.preference, updated_at = excluded.updated_at`
	).run(invitee, date, pref);
}

describe('results aggregation', () => {
	it('counts preferred/available/unavailable per date', () => {
		respond('i1', 'd1', 'preferred');
		respond('i2', 'd1', 'available');
		respond('i3', 'd1', 'unavailable');
		const d1 = results('e1').find((r) => r.id === 'd1')!;
		expect(d1).toMatchObject({ preferred: 1, available: 1, unavailable: 1, notAnswered: 0 });
	});

	// The Acceptance criterion: missing responses row = "no answer", never "unavailable".
	it('treats a missing responses row as not-answered, not unavailable', () => {
		respond('i1', 'd2', 'preferred'); // only 1 of 3 invitees answered d2
		const d2 = results('e1').find((r) => r.id === 'd2')!;
		expect(d2.unavailable).toBe(0);
		expect(d2.notAnswered).toBe(2);
		expect(d2.preferred).toBe(1);
	});

	it('a fully-unanswered date is all-zero counts + everyone not answered', () => {
		const d3 = results('e1').find((r) => r.id === 'd3')!;
		expect(d3).toMatchObject({ preferred: 0, available: 0, unavailable: 0, notAnswered: 3 });
	});

	it('upsert replaces a preference in place (PK dedup, no duplicate row)', () => {
		respond('i1', 'd1', 'available');
		respond('i1', 'd1', 'unavailable'); // same PK -> update
		const count = (
			db
				.prepare(
					`SELECT COUNT(*) AS n FROM responses WHERE invitee_id = 'i1' AND date_option_id = 'd1'`
				)
				.get() as { n: number }
		).n;
		expect(count).toBe(1);
		const d1 = results('e1').find((r) => r.id === 'd1')!;
		expect(d1).toMatchObject({ available: 0, unavailable: 1 });
	});
});
