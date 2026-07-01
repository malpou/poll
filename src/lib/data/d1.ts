import type { DataProvider } from './provider';
import type {
	DateOptionResult,
	DateOptionRow,
	EventDraft,
	EventRow,
	EventWithDetails,
	InviteeContext,
	InviteeRow,
	ResponseRow,
	Preference
} from '$lib/types';
import { helpers, id, newToken, RESULTS_SQL } from './shared';
import { zonedToUtcIso } from '$lib/date';

function mapEvent(r: Record<string, unknown>): EventRow {
	return {
		id: r.id as string,
		title: r.title as string,
		description: (r.description as string | null) ?? null,
		organizerToken: r.organizer_token as string,
		status: r.status as 'open' | 'closed',
		createdAt: r.created_at as string
	};
}

function mapDateOption(r: Record<string, unknown>): DateOptionRow {
	return {
		id: r.id as string,
		eventId: r.event_id as string,
		startsAt: (r.starts_at as string | null) ?? null,
		endsAt: (r.ends_at as string | null) ?? null,
		sortOrder: r.sort_order as number
	};
}

function mapInvitee(r: Record<string, unknown>): InviteeRow {
	return {
		id: r.id as string,
		eventId: r.event_id as string,
		label: r.label as string,
		token: r.token as string,
		note: (r.note as string | null) ?? null,
		createdAt: r.created_at as string
	};
}

function mapResponse(r: Record<string, unknown>): ResponseRow {
	return {
		inviteeId: r.invitee_id as string,
		dateOptionId: r.date_option_id as string,
		preference: r.preference as Preference,
		updatedAt: r.updated_at as string
	};
}

export function d1Provider(db: D1Database): DataProvider {
	return {
		...helpers,

		async createEvent(draft: EventDraft) {
			const now = new Date().toISOString();
			const eventId = id('event');
			const organizerToken = newToken();

			const statements: D1PreparedStatement[] = [
				db
					.prepare(
						`INSERT INTO events (id, title, description, organizer_token, status, created_at)
						 VALUES (?, ?, ?, ?, 'open', ?)`
					)
					.bind(eventId, draft.title, draft.description || null, organizerToken, now)
			];

			draft.dates.forEach((d, i) => {
				statements.push(
					db
						.prepare(
							`INSERT INTO date_options (id, event_id, starts_at, ends_at, sort_order)
							 VALUES (?, ?, ?, ?, ?)`
						)
						.bind(
							id('date'),
							eventId,
							zonedToUtcIso(d.value, d.startTime),
							zonedToUtcIso(d.value, d.endTime),
							i
						)
				);
			});

			for (const p of draft.participants) {
				statements.push(
					db
						.prepare(
							`INSERT INTO invitees (id, event_id, label, token, note, created_at)
							 VALUES (?, ?, ?, ?, ?, ?)`
						)
						.bind(id('p'), eventId, p.name, p.token, null, now)
				);
			}

			await db.batch(statements);
			return { organizerToken };
		},

		async getEventByOrganizerToken(token: string): Promise<EventWithDetails | null> {
			const event = await db
				.prepare(`SELECT * FROM events WHERE organizer_token = ?`)
				.bind(token)
				.first();
			if (!event) return null;

			const eventId = event.id as string;
			const [dates, invitees] = await db.batch<Record<string, unknown>>([
				db
					.prepare(`SELECT * FROM date_options WHERE event_id = ? ORDER BY sort_order`)
					.bind(eventId),
				db.prepare(`SELECT * FROM invitees WHERE event_id = ? ORDER BY created_at`).bind(eventId)
			]);

			return {
				...mapEvent(event),
				dateOptions: dates.results.map(mapDateOption),
				invitees: invitees.results.map(mapInvitee)
			};
		},

		async getInviteeContext(inviteeToken: string): Promise<InviteeContext | null> {
			const inviteeRow = await db
				.prepare(`SELECT * FROM invitees WHERE token = ?`)
				.bind(inviteeToken)
				.first();
			if (!inviteeRow) return null;

			const invitee = mapInvitee(inviteeRow);
			const eventRow = await db
				.prepare(`SELECT * FROM events WHERE id = ?`)
				.bind(invitee.eventId)
				.first();
			if (!eventRow) return null;

			const [dates, responses] = await db.batch<Record<string, unknown>>([
				db
					.prepare(`SELECT * FROM date_options WHERE event_id = ? ORDER BY sort_order`)
					.bind(invitee.eventId),
				db.prepare(`SELECT * FROM responses WHERE invitee_id = ?`).bind(invitee.id)
			]);

			return {
				invitee,
				event: mapEvent(eventRow),
				dateOptions: dates.results.map(mapDateOption),
				responses: responses.results.map(mapResponse)
			};
		},

		async saveResponses(inviteeId, answers) {
			if (answers.length === 0) return;
			const now = new Date().toISOString();
			const statements = answers.map((a) =>
				db
					.prepare(
						`INSERT INTO responses (invitee_id, date_option_id, preference, updated_at)
						 VALUES (?, ?, ?, ?)
						 ON CONFLICT(invitee_id, date_option_id)
						 DO UPDATE SET preference = excluded.preference, updated_at = excluded.updated_at`
					)
					.bind(inviteeId, a.dateOptionId, a.preference, now)
			);
			await db.batch(statements);
		},

		async saveNote(inviteeId, note) {
			await db
				.prepare(`UPDATE invitees SET note = ? WHERE id = ?`)
				.bind(note || null, inviteeId)
				.run();
		},

		async getResults(eventId: string): Promise<DateOptionResult[]> {
			const invitee = await db
				.prepare(`SELECT COUNT(*) AS n FROM invitees WHERE event_id = ?`)
				.bind(eventId)
				.first<{ n: number }>();
			const totalInvitees = invitee?.n ?? 0;

			const rows = await db
				.prepare(RESULTS_SQL)
				.bind(eventId)
				.all<{ id: string; preferred: number; available: number; unavailable: number }>();

			return rows.results.map((r) => ({
				dateOptionId: r.id,
				preferred: r.preferred,
				available: r.available,
				unavailable: r.unavailable,
				// missing responses row => counted here, never as unavailable.
				notAnswered: totalInvitees - (r.preferred + r.available + r.unavailable)
			}));
		},

		async getAnsweredInviteeIds(eventId: string): Promise<Set<string>> {
			const rows = await db
				.prepare(
					`SELECT DISTINCT r.invitee_id AS id
					 FROM responses r JOIN invitees i ON i.id = r.invitee_id
					 WHERE i.event_id = ?`
				)
				.bind(eventId)
				.all<{ id: string }>();
			return new Set(rows.results.map((r) => r.id));
		},

		async getEventResponses(eventId: string): Promise<ResponseRow[]> {
			const rows = await db
				.prepare(
					`SELECT r.* FROM responses r JOIN invitees i ON i.id = r.invitee_id
					 WHERE i.event_id = ?`
				)
				.bind(eventId)
				.all();
			return rows.results.map(mapResponse);
		},

		async addDateOption(eventId, date) {
			// Append after the current last option for this event.
			const max = await db
				.prepare(`SELECT MAX(sort_order) AS m FROM date_options WHERE event_id = ?`)
				.bind(eventId)
				.first<{ m: number | null }>();
			await db
				.prepare(
					`INSERT INTO date_options (id, event_id, starts_at, ends_at, sort_order)
					 VALUES (?, ?, ?, ?, ?)`
				)
				.bind(
					id('date'),
					eventId,
					zonedToUtcIso(date.value, date.startTime),
					zonedToUtcIso(date.value, date.endTime),
					(max?.m ?? -1) + 1
				)
				.run();
		},

		async updateDateOption(optionId, date) {
			await db
				.prepare(`UPDATE date_options SET starts_at = ?, ends_at = ? WHERE id = ?`)
				.bind(
					zonedToUtcIso(date.value, date.startTime),
					zonedToUtcIso(date.value, date.endTime),
					optionId
				)
				.run();
		},

		async removeDateOption(optionId) {
			// No FK cascade - clear responses first, then the option.
			await db.batch([
				db.prepare(`DELETE FROM responses WHERE date_option_id = ?`).bind(optionId),
				db.prepare(`DELETE FROM date_options WHERE id = ?`).bind(optionId)
			]);
		},

		async addInvitee(eventId, label) {
			const token = newToken();
			await db
				.prepare(
					`INSERT INTO invitees (id, event_id, label, token, note, created_at)
					 VALUES (?, ?, ?, ?, ?, ?)`
				)
				.bind(id('p'), eventId, label, token, null, new Date().toISOString())
				.run();
			return { token };
		},

		async renameInvitee(inviteeId, label) {
			await db.prepare(`UPDATE invitees SET label = ? WHERE id = ?`).bind(label, inviteeId).run();
		},

		async removeInvitee(inviteeId) {
			// No FK cascade - clear responses first, then the invitee (link stops working).
			await db.batch([
				db.prepare(`DELETE FROM responses WHERE invitee_id = ?`).bind(inviteeId),
				db.prepare(`DELETE FROM invitees WHERE id = ?`).bind(inviteeId)
			]);
		},

		async setEventStatus(eventId, status) {
			await db.prepare(`UPDATE events SET status = ? WHERE id = ?`).bind(status, eventId).run();
		}
	};
}
