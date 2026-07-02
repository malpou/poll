import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// D1 is SQLite, so the whole migration stack runs against in-memory
// better-sqlite3. 0004 rebuilds `events` (inline CHECK can't be altered), so
// this guards the rebuild: rows survive, unique indexes come back, and the new
// constraints hold - before the migration ever touches remote D1.

const dir = fileURLToPath(new URL('../../../migrations', import.meta.url));
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
	// Seed a full child graph on the 0001 schema so 0004's events-rebuild must
	// carry real data across the DROP: two events, each with date_options AND
	// invitees (both direct FKs to events), plus responses (grandchildren via
	// invitees + date_options). e9 stresses value fidelity - NULL vs present
	// description, unicode + newline title - so silent corruption fails here too,
	// not just row loss. Seeded on the legacy 0001 shape so 0002/0003 back-fill.
	apply(migrations[0]);
	db.exec(`INSERT INTO events (id, title, description, organizer_token, status, created_at) VALUES
	         ('e1', 'Legacy', NULL, 'otok-1', 'closed', '2026-07-01T00:00:00Z'),
	         ('e9', 'Årsmøde 🎉', 'Line one
Line two', 'otok-9', 'open', '2026-07-02T00:00:00Z')`);
	db.exec(`INSERT INTO date_options (id, event_id, sort_order) VALUES
	         ('d1', 'e1', 0), ('d2', 'e1', 1), ('d9', 'e9', 0)`);
	db.exec(`INSERT INTO invitees (id, event_id, label, token, created_at) VALUES
	         ('i1', 'e1', 'Anna', 'itok-1', '2026-07-01T00:00:00Z'),
	         ('i9', 'e9', 'Bo', 'itok-9', '2026-07-02T00:00:00Z')`);
	db.exec(`INSERT INTO responses (invitee_id, date_option_id, preference, updated_at) VALUES
	         ('i1', 'd1', 'preferred', '2026-07-01T00:00:00Z'),
	         ('i1', 'd2', 'available', '2026-07-01T00:00:00Z'),
	         ('i9', 'd9', 'unavailable', '2026-07-02T00:00:00Z')`);
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

	it('0005 backfills timezone and defaults new rows to en / Europe/Copenhagen', () => {
		// Pre-0005 rows get the old implicit zone; their locale is untouched.
		const legacy = db.prepare(`SELECT locale, timezone FROM events WHERE id = 'e1'`).get() as {
			locale: string;
			timezone: string;
		};
		expect(legacy).toEqual({ locale: 'da', timezone: 'Europe/Copenhagen' });
		// New rows land on the new defaults.
		db.exec(`INSERT INTO events (id, title, organizer_token, status, created_at)
		         VALUES ('eN', 'T', 'otok-n', 'open', '2026-07-01T00:00:00Z')`);
		const fresh = db.prepare(`SELECT locale, timezone FROM events WHERE id = 'eN'`).get() as {
			locale: string;
			timezone: string;
		};
		expect(fresh).toEqual({ locale: 'en', timezone: 'Europe/Copenhagen' });
	});

	it('locale accepts es/de and rejects unknown values', () => {
		db.exec(`UPDATE events SET locale = 'es' WHERE id = 'e1'`);
		db.exec(`UPDATE events SET locale = 'de' WHERE id = 'e1'`);
		expect(() => db.exec(`UPDATE events SET locale = 'xx' WHERE id = 'e1'`)).toThrow(/CHECK/);
	});

	it('0006 adds choice flags with legacy-preserving defaults and widens preference to unsure', () => {
		const legacy = db
			.prepare(`SELECT allow_preferred, allow_unsure FROM events WHERE id = 'e1'`)
			.get() as { allow_preferred: number; allow_unsure: number };
		expect(legacy).toEqual({ allow_preferred: 1, allow_unsure: 0 });
		expect(() => db.exec(`UPDATE events SET allow_unsure = 2 WHERE id = 'e1'`)).toThrow(/CHECK/);

		db.exec(
			`UPDATE responses SET preference = 'unsure' WHERE invitee_id = 'i1' AND date_option_id = 'd1'`
		);
		expect(() =>
			db.exec(
				`UPDATE responses SET preference = 'bogus' WHERE invitee_id = 'i1' AND date_option_id = 'd1'`
			)
		).toThrow(/CHECK/);
		// The (invitee_id, date_option_id) PK survives the rebuild - the save
		// upsert depends on it.
		expect(() =>
			db.exec(`INSERT INTO responses (invitee_id, date_option_id, preference, updated_at)
			         VALUES ('i1', 'd1', 'available', '2026-07-02T00:00:00Z')`)
		).toThrow(/UNIQUE|PRIMARY/);
	});

	it('0007 defaults accent to yellow on legacy and new rows', () => {
		const legacy = db.prepare(`SELECT accent FROM events WHERE id = 'e1'`).get() as {
			accent: string;
		};
		expect(legacy.accent).toBe('yellow');
		db.exec(`INSERT INTO events (id, title, organizer_token, status, created_at)
		         VALUES ('eA', 'T', 'otok-a', 'open', '2026-07-01T00:00:00Z')`);
		const fresh = db.prepare(`SELECT accent FROM events WHERE id = 'eA'`).get() as {
			accent: string;
		};
		expect(fresh.accent).toBe('yellow');
	});

	it('0008 defaults poll_type to dates on legacy and new rows', () => {
		const legacy = db.prepare(`SELECT poll_type FROM events WHERE id = 'e1'`).get() as {
			poll_type: string;
		};
		expect(legacy.poll_type).toBe('dates');
		db.exec(`INSERT INTO events (id, title, organizer_token, status, created_at)
		         VALUES ('eQ', 'T', 'otok-q', 'open', '2026-07-01T00:00:00Z')`);
		const fresh = db.prepare(`SELECT poll_type FROM events WHERE id = 'eQ'`).get() as {
			poll_type: string;
		};
		expect(fresh.poll_type).toBe('dates');
	});

	it('the rebuild drops no rows from events or any child table', () => {
		const count = (t: string) =>
			(db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n;
		expect(count('events')).toBe(2);
		expect(count('date_options')).toBe(3);
		expect(count('invitees')).toBe(2);
		expect(count('responses')).toBe(3);
	});

	it('column values survive verbatim - NULL, unicode, and newlines', () => {
		const legacy = db.prepare(`SELECT description FROM events WHERE id = 'e1'`).get() as {
			description: string | null;
		};
		expect(legacy.description).toBeNull();
		const rich = db.prepare(`SELECT title, description FROM events WHERE id = 'e9'`).get() as {
			title: string;
			description: string;
		};
		expect(rich.title).toBe('Årsmøde 🎉');
		expect(rich.description).toBe('Line one\nLine two');
	});

	it('child tables still reference the rebuilt events table', () => {
		db.pragma('foreign_keys = ON');
		expect(() =>
			db.exec(`INSERT INTO date_options (id, event_id, sort_order) VALUES ('dX', 'missing', 0)`)
		).toThrow(/FOREIGN KEY/);
		// invitees is the other direct FK to events - the rebuild must keep it too.
		expect(() =>
			db.exec(
				`INSERT INTO invitees (id, event_id, label, token, created_at)
				 VALUES ('iX', 'missing', 'X', 'itok-x', '2026-07-01T00:00:00Z')`
			)
		).toThrow(/FOREIGN KEY/);
		// Every seeded child (both direct FKs) still resolves to its event.
		const resolved = (t: string) =>
			(
				db.prepare(`SELECT COUNT(*) AS n FROM ${t} c JOIN events e ON e.id = c.event_id`).get() as {
					n: number;
				}
			).n;
		expect(resolved('date_options')).toBe(3);
		expect(resolved('invitees')).toBe(2);
	});

	it('responses (grandchildren) still join up to the rebuilt events by both paths', () => {
		// responses reach events only through invitees AND date_options; if the
		// rebuild orphaned either FK chain this count would drop below 3.
		const n = (
			db
				.prepare(
					`SELECT COUNT(*) AS n FROM responses r
					 JOIN invitees i ON i.id = r.invitee_id
					 JOIN date_options d ON d.id = r.date_option_id
					 JOIN events ei ON ei.id = i.event_id
					 JOIN events ed ON ed.id = d.event_id`
				)
				.get() as { n: number }
		).n;
		expect(n).toBe(3);
	});
});
