import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// D1 is SQLite, so the whole migration stack runs against in-memory
// better-sqlite3. 0004 rebuilds `events` (inline CHECK can't be altered), so
// this guards the rebuild: rows survive, unique indexes come back, and the new
// constraints hold - before the migration ever touches remote D1.

const dir = fileURLToPath(new URL('../migrations', import.meta.url));
const migrations = readdirSync(dir)
	.filter((f) => f.endsWith('.sql'))
	.sort();

let db: Database.Database;

// D1 applies each migration file as one transaction, which is what makes
// 0004's `PRAGMA defer_foreign_keys` effective during the events rebuild -
// mirror that here (better-sqlite3 autocommits per statement otherwise).
const apply = (file: string) =>
	db.exec(`BEGIN;\n${readFileSync(`${dir}/${file}`, 'utf8')}\nCOMMIT;`);

beforeEach(() => {
	db = new Database(':memory:');
	// Seed between 0001 and the rest so the copy step in 0004 has rows to carry.
	apply(migrations[0]);
	db.exec(`INSERT INTO events (id, title, organizer_token, status, created_at)
	         VALUES ('e1', 'Legacy', 'otok-1', 'closed', '2026-07-01T00:00:00Z')`);
	db.exec(`INSERT INTO date_options (id, event_id, sort_order) VALUES ('d1', 'e1', 0)`);
	for (const m of migrations.slice(1)) apply(m);
});

describe('migration stack', () => {
	it('applies every migration in order', () => {
		expect(migrations[0]).toBe('0001_init.sql');
		expect(migrations.length).toBeGreaterThanOrEqual(4);
	});

	it('the events rebuild preserves existing rows and their columns', () => {
		const row = db.prepare(`SELECT * FROM events WHERE id = 'e1'`).get() as Record<string, unknown>;
		expect(row).toMatchObject({ title: 'Legacy', organizer_token: 'otok-1', status: 'closed' });
		// Back-fills from 0002/0003 survive the copy.
		expect(row.locale).toBe('da');
		expect(row.poll_mode).toBe('assigned');
		expect(row.share_token).toBeTruthy();
	});

	it('unique constraints survive the rebuild', () => {
		const insert = (id: string, otok: string, share: string) =>
			db
				.prepare(
					`INSERT INTO events (id, title, organizer_token, status, created_at, share_token)
					 VALUES (?, 'T', ?, 'open', '2026-07-01T00:00:00Z', ?)`
				)
				.run(id, otok, share);
		insert('e2', 'otok-2', 'share-2');
		expect(() => insert('e3', 'otok-2', 'share-3')).toThrow(/UNIQUE/);
		expect(() => insert('e3', 'otok-3', 'share-2')).toThrow(/UNIQUE/);
	});

	it('status accepts cancelled and rejects unknown values', () => {
		db.exec(`UPDATE events SET status = 'cancelled' WHERE id = 'e1'`);
		expect(
			(db.prepare(`SELECT status FROM events WHERE id = 'e1'`).get() as { status: string }).status
		).toBe('cancelled');
		expect(() => db.exec(`UPDATE events SET status = 'bogus' WHERE id = 'e1'`)).toThrow(/CHECK/);
	});

	it('date_options.selected defaults to 0 and only accepts 0/1', () => {
		const row = db.prepare(`SELECT selected FROM date_options WHERE id = 'd1'`).get() as {
			selected: number;
		};
		expect(row.selected).toBe(0);
		db.exec(`UPDATE date_options SET selected = 1 WHERE id = 'd1'`);
		expect(() => db.exec(`UPDATE date_options SET selected = 2 WHERE id = 'd1'`)).toThrow(/CHECK/);
	});

	it('child tables still reference the rebuilt events table', () => {
		db.pragma('foreign_keys = ON');
		expect(() =>
			db.exec(`INSERT INTO date_options (id, event_id, sort_order) VALUES ('dX', 'missing', 0)`)
		).toThrow(/FOREIGN KEY/);
		// The pre-rebuild child row still resolves.
		const ok = db
			.prepare(
				`SELECT COUNT(*) AS n FROM date_options d JOIN events e ON e.id = d.event_id WHERE d.id = 'd1'`
			)
			.get() as { n: number };
		expect(ok.n).toBe(1);
	});
});
