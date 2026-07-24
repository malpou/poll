import Database from 'better-sqlite3';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Locale, Preference } from '../../../src/lib/types';

// The single home for e2e DB access. Specs seed/read the local D1 through these
// typed builders and never write SQL themselves - mirroring how src/lib/data/d1.ts
// is the only place app SQL lives. We open the same local-D1 SQLite file the
// preview server (wrangler/miniflare) uses, in-process via better-sqlite3 -
// spawning `wrangler d1 execute` per statement cost a ~1s cold start each and
// dominated e2e wall time. busy_timeout lets our connection wait out miniflare's
// writes instead of erroring SQLITE_BUSY (the flake the old per-call retry chased).

const NOW = '2026-07-01T00:00:00Z';

let _db: Database.Database | undefined;
function conn(): Database.Database {
	if (_db) return _db;
	// globalSetup runs d1:migrate before the server boots, so the file exists by
	// the first seed. Name is a content hash; metadata.sqlite is miniflare's own.
	const dir = fileURLToPath(
		new URL('../../../.wrangler/state/v3/d1/miniflare-D1DatabaseObject', import.meta.url)
	);
	const file = readdirSync(dir).find((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite');
	if (!file) throw new Error(`no local D1 sqlite under ${dir} - did globalSetup migrate?`);
	_db = new Database(`${dir}/${file}`);
	_db.pragma('busy_timeout = 5000');
	return _db;
}

export function d1(sql: string): { results: Record<string, unknown>[] } {
	const db = conn();
	// Reads need rows back; writes (including wipeEvent's multi-statement DELETE)
	// don't and go through exec, which - unlike prepare - takes several statements.
	if (/^\s*SELECT/i.test(sql)) {
		return { results: db.prepare(sql).all() as Record<string, unknown>[] };
	}
	db.exec(sql);
	return { results: [] };
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
	status: 'open' | 'closed' | 'cancelled';
	locale?: Locale; // omit → seeded as 'en' (matches bare m.*() = baseLocale in specs)
	timezone?: string; // omit → 'Europe/Copenhagen'
	pollMode?: 'assigned' | 'open'; // omit → column default 'assigned'
	shareToken?: string; // open-mode shared link token
	allowPreferred?: boolean; // omit → column default on
	allowUnsure?: boolean; // omit → column default off
	accent?: 'yellow' | 'pink' | 'green' | 'blue' | 'purple'; // omit → column default 'yellow'
	pollType?: 'dates' | 'question' | 'rsvp' | 'rank' | 'highlight'; // omit → column default 'dates'
	highlightBudget?: number; // highlight polls; omit → column default 5
	adminCode?: string | null; // gate code; omit → NULL (ungated)
	createdAt?: string;
}
export interface DateOptionSeed {
	id: string;
	eventId: string;
	startsAt?: string | null;
	endsAt?: string | null;
	label?: string | null;
	sortOrder: number;
	selected?: boolean; // chosen when the poll was closed; omit → not chosen
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
	value?: number | null; // rank position / highlight stroke count
	updatedAt?: string;
}

export function seedEvent(e: EventSeed) {
	d1(
		`INSERT INTO events (id, title, description, organizer_token, status, locale, timezone, poll_mode, allow_preferred, allow_unsure, accent, poll_type, highlight_budget, admin_code, share_token, created_at) VALUES
		   (${lit(e.id)}, ${lit(e.title)}, ${lit(e.description)}, ${lit(e.organizerToken)}, ${lit(e.status)}, ${lit(e.locale ?? 'en')}, ${lit(e.timezone ?? 'Europe/Copenhagen')}, ${lit(e.pollMode ?? 'assigned')}, ${e.allowPreferred === false ? 0 : 1}, ${e.allowUnsure ? 1 : 0}, ${lit(e.accent ?? 'yellow')}, ${lit(e.pollType ?? 'dates')}, ${e.highlightBudget ?? 5}, ${lit(e.adminCode ?? null)}, ${lit(e.shareToken ?? null)}, ${lit(e.createdAt ?? NOW)});`
	);
}

export function seedDateOption(o: DateOptionSeed) {
	d1(
		`INSERT INTO date_options (id, event_id, starts_at, ends_at, label, sort_order, selected) VALUES
		   (${lit(o.id)}, ${lit(o.eventId)}, ${lit(o.startsAt)}, ${lit(o.endsAt)}, ${lit(o.label)}, ${o.sortOrder}, ${o.selected ? 1 : 0});`
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
		`INSERT INTO responses (invitee_id, date_option_id, preference, value, updated_at) VALUES
		   (${lit(r.inviteeId)}, ${lit(r.dateOptionId)}, ${lit(r.preference)}, ${r.value ?? 'NULL'}, ${lit(r.updatedAt ?? NOW)});`
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

export function eventStatus(eventId: string): string {
	return d1(`SELECT status FROM events WHERE id = ${lit(eventId)}`).results[0].status as string;
}

// The per-event choice toggles (allow_preferred / allow_unsure).
export function eventChoices(eventId: string): { allowPreferred: boolean; allowUnsure: boolean } {
	const r = d1(`SELECT allow_preferred, allow_unsure FROM events WHERE id = ${lit(eventId)}`)
		.results[0];
	return { allowPreferred: r.allow_preferred === 1, allowUnsure: r.allow_unsure === 1 };
}

// The poll's highlighter accent (yellow|pink|green|blue).
export function eventAccent(eventId: string): string {
	return d1(`SELECT accent FROM events WHERE id = ${lit(eventId)}`).results[0].accent as string;
}

// dates | question - immutable after creation.
export function eventPollType(eventId: string): string {
	return d1(`SELECT poll_type FROM events WHERE id = ${lit(eventId)}`).results[0]
		.poll_type as string;
}

// Question options' texts, in display order (null labels come back as null).
export function optionLabels(eventId: string): (string | null)[] {
	return d1(
		`SELECT label FROM date_options WHERE event_id = ${lit(eventId)} ORDER BY sort_order`
	).results.map((r) => (r.label as string | null) ?? null);
}

// Rank positions / highlight stroke counts per option for one invitee,
// keyed by date_option_id. Options without a value row are absent.
export function responseValues(inviteeId: string): Record<string, number> {
	const out: Record<string, number> = {};
	for (const r of d1(
		`SELECT date_option_id, value FROM responses WHERE invitee_id = ${lit(inviteeId)} AND value IS NOT NULL`
	).results) {
		out[r.date_option_id as string] = r.value as number;
	}
	return out;
}

// The highlight poll's stroke budget.
export function eventHighlightBudget(eventId: string): number {
	return d1(`SELECT highlight_budget FROM events WHERE id = ${lit(eventId)}`).results[0]
		.highlight_budget as number;
}

export function eventTimezone(eventId: string): string {
	return d1(`SELECT timezone FROM events WHERE id = ${lit(eventId)}`).results[0].timezone as string;
}

// The options recorded as the closing decision - empty while open/cancelled.
export function selectedOptionIds(eventId: string): string[] {
	return d1(
		`SELECT id FROM date_options WHERE event_id = ${lit(eventId)} AND selected = 1 ORDER BY sort_order`
	).results.map((r) => r.id as string);
}

// --- Planning poker (openspec/specs/planning-poker). Durable skeleton only:
// rooms + rounds + final estimates. Live phase/votes are held by the real-time
// layer, not D1, so there is nothing to seed for them. Own e2e-poker-* id/token
// family. ---

export interface RoomSeed {
	id: string;
	title: string;
	controllerToken: string;
	joinToken: string;
	status?: 'open' | 'closed'; // omit → column default 'open'
	deck?: string; // omit → column default 'fibonacci'
	createdAt?: string;
}
export interface RoundSeed {
	id: string;
	roomId: string;
	title: string;
	sortOrder: number;
	finalEstimate?: string | null; // omit → NULL (not yet decided)
	decidedAt?: string | null;
}

export function seedRoom(r: RoomSeed) {
	d1(
		`INSERT INTO poker_rooms (id, title, deck, controller_token, join_token, status, created_at) VALUES
		   (${lit(r.id)}, ${lit(r.title)}, ${lit(r.deck ?? 'fibonacci')}, ${lit(r.controllerToken)}, ${lit(r.joinToken)}, ${lit(r.status ?? 'open')}, ${lit(r.createdAt ?? NOW)});`
	);
}

export function seedRound(r: RoundSeed) {
	d1(
		`INSERT INTO poker_rounds (id, room_id, title, sort_order, final_estimate, decided_at) VALUES
		   (${lit(r.id)}, ${lit(r.roomId)}, ${lit(r.title)}, ${r.sortOrder}, ${lit(r.finalEstimate ?? null)}, ${lit(r.decidedAt ?? null)});`
	);
}

// Delete a room and its rounds (children first). Accepts one id or several.
// Idempotent - safe to call before every seed.
export function wipeRoom(roomId: string | string[]) {
	const ids = (Array.isArray(roomId) ? roomId : [roomId]).map(lit).join(', ');
	d1(
		`DELETE FROM poker_rounds WHERE room_id IN (${ids});
		 DELETE FROM poker_rooms WHERE id IN (${ids});`
	);
}

// --- Read helpers (assertions) ---

export function roomStatus(roomId: string): string {
	return d1(`SELECT status FROM poker_rooms WHERE id = ${lit(roomId)}`).results[0].status as string;
}

// Decided items with their recorded estimate, in display order. Undecided
// rounds are absent (final_estimate IS NULL).
export function roomResults(roomId: string): { title: string; estimate: string }[] {
	return d1(
		`SELECT title, final_estimate FROM poker_rounds WHERE room_id = ${lit(roomId)} AND final_estimate IS NOT NULL ORDER BY sort_order`
	).results.map((r) => ({ title: r.title as string, estimate: r.final_estimate as string }));
}

// Every round title for a room in order (decided or not) - for roster/queue asserts.
export function roundTitles(roomId: string): string[] {
	return d1(
		`SELECT title FROM poker_rounds WHERE room_id = ${lit(roomId)} ORDER BY sort_order`
	).results.map((r) => r.title as string);
}
