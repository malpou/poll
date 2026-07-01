import { execFileSync } from 'node:child_process';
import type { Locale, Preference } from '../src/lib/types';

// The single home for e2e DB access. Specs seed/read the local D1 through these
// typed builders and never write SQL themselves - mirroring how src/lib/data/d1.ts
// is the only place app SQL lives. Seeding runs against the same local D1 the
// preview server uses (wrangler dev), via `wrangler d1 execute`.

const NOW = '2026-07-01T00:00:00Z';

export function d1(sql: string): { results: Record<string, unknown>[] } {
	// The preview server (wrangler dev) and this spawned wrangler share one local
	// D1 file, so writes occasionally lose a lock/visibility race and surface as a
	// transient FK/BUSY error. One retry clears it; the seeds are idempotent.
	const run = () =>
		execFileSync(
			'bunx',
			['wrangler', 'd1', 'execute', 'DB', '--local', '--json', '--command', sql],
			{ encoding: 'utf8' }
		);
	let out: string;
	for (let attempt = 0; ; attempt++) {
		try {
			out = run();
			break;
		} catch (e) {
			if (attempt >= 2) throw e;
		}
	}
	// wrangler prints a JSON array of statement results; take the first.
	const parsed = JSON.parse(out.slice(out.indexOf('['))) as {
		results: Record<string, unknown>[];
	}[];
	return parsed[0];
}

// SQL literal for a string-or-null value. String-escaped rather than
// parameterized because `wrangler d1 execute --command` takes no bind params;
// safe here as these are fixed, developer-controlled test seeds only.
function lit(v: string | null | undefined): string {
	if (v === null || v === undefined) return 'NULL';
	return `'${v.replace(/'/g, "''")}'`;
}

export interface EventSeed {
	id: string;
	title: string;
	description?: string | null;
	organizerToken: string;
	status: 'open' | 'closed';
	locale?: Locale; // omit → column default 'da'
	pollMode?: 'assigned' | 'open'; // omit → column default 'assigned'
	shareToken?: string; // open-mode shared link token
	createdAt?: string;
}
export interface DateOptionSeed {
	id: string;
	eventId: string;
	startsAt?: string | null;
	endsAt?: string | null;
	label?: string | null;
	sortOrder: number;
}
export interface InviteeSeed {
	id: string;
	eventId: string;
	label: string;
	token: string;
	note?: string | null;
	createdAt?: string;
}
export interface ResponseSeed {
	inviteeId: string;
	dateOptionId: string;
	preference: Preference;
	updatedAt?: string;
}

export function seedEvent(e: EventSeed) {
	d1(
		`INSERT INTO events (id, title, description, organizer_token, status, locale, poll_mode, share_token, created_at) VALUES
		   (${lit(e.id)}, ${lit(e.title)}, ${lit(e.description)}, ${lit(e.organizerToken)}, ${lit(e.status)}, ${lit(e.locale ?? 'da')}, ${lit(e.pollMode ?? 'assigned')}, ${lit(e.shareToken ?? null)}, ${lit(e.createdAt ?? NOW)});`
	);
}

export function seedDateOption(o: DateOptionSeed) {
	d1(
		`INSERT INTO date_options (id, event_id, starts_at, ends_at, label, sort_order) VALUES
		   (${lit(o.id)}, ${lit(o.eventId)}, ${lit(o.startsAt)}, ${lit(o.endsAt)}, ${lit(o.label)}, ${o.sortOrder});`
	);
}

export function seedInvitee(i: InviteeSeed) {
	d1(
		`INSERT INTO invitees (id, event_id, label, token, note, created_at) VALUES
		   (${lit(i.id)}, ${lit(i.eventId)}, ${lit(i.label)}, ${lit(i.token)}, ${lit(i.note)}, ${lit(i.createdAt ?? NOW)});`
	);
}

export function seedResponse(r: ResponseSeed) {
	d1(
		`INSERT INTO responses (invitee_id, date_option_id, preference, updated_at) VALUES
		   (${lit(r.inviteeId)}, ${lit(r.dateOptionId)}, ${lit(r.preference)}, ${lit(r.updatedAt ?? NOW)});`
	);
}

// Delete an event and all its children in FK order (responses first). Accepts one
// id or several. Idempotent - safe to call before every seed.
export function wipeEvent(eventId: string | string[]) {
	const ids = (Array.isArray(eventId) ? eventId : [eventId]).map(lit).join(', ');
	d1(
		`DELETE FROM responses WHERE invitee_id IN (SELECT id FROM invitees WHERE event_id IN (${ids}));
		 DELETE FROM responses WHERE date_option_id IN (SELECT id FROM date_options WHERE event_id IN (${ids}));
		 DELETE FROM invitees WHERE event_id IN (${ids});
		 DELETE FROM date_options WHERE event_id IN (${ids});
		 DELETE FROM events WHERE id IN (${ids});`
	);
}

export function setNote(inviteeId: string, note: string) {
	d1(`UPDATE invitees SET note = ${lit(note)} WHERE id = ${lit(inviteeId)};`);
}

// --- Read helpers (assertions) ---

export function optionIds(eventId: string): string[] {
	return d1(
		`SELECT id FROM date_options WHERE event_id = ${lit(eventId)} ORDER BY sort_order`
	).results.map((r) => r.id as string);
}

export function eventDetails(eventId: string): { title: string; description: string | null } {
	const r = d1(`SELECT title, description FROM events WHERE id = ${lit(eventId)}`).results[0];
	return { title: r.title as string, description: (r.description as string | null) ?? null };
}

export function inviteeLabels(eventId: string): string[] {
	return d1(`SELECT label FROM invitees WHERE event_id = ${lit(eventId)}`).results.map(
		(r) => r.label as string
	);
}

export function responsesFor(
	inviteeId: string
): { date_option_id: string; preference: Preference }[] {
	return d1(
		`SELECT date_option_id, preference FROM responses WHERE invitee_id = ${lit(inviteeId)} ORDER BY date_option_id`
	).results.map((r) => ({
		date_option_id: r.date_option_id as string,
		preference: r.preference as Preference
	}));
}

// Invitees created for an event, oldest first (open submissions land here too).
export function inviteesFor(eventId: string): { id: string; label: string; token: string }[] {
	return d1(
		`SELECT id, label, token FROM invitees WHERE event_id = ${lit(eventId)} ORDER BY created_at, id`
	).results.map((r) => ({
		id: r.id as string,
		label: r.label as string,
		token: r.token as string
	}));
}

export function countResponsesForOption(optionId: string): number {
	return d1(`SELECT COUNT(*) AS n FROM responses WHERE date_option_id = ${lit(optionId)}`)
		.results[0].n as number;
}
