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
	Preference,
	ShareContext
} from '$lib/types';
import { helpers, id, newToken, RESULTS_SQL } from './shared';
import { zonedToUtcIso } from '$lib/logic/date';

function mapEvent(r: Record<string, unknown>): EventRow {
	return {
		id: r.id as string,
		title: r.title as string,
		description: (r.description as string | null) ?? null,
		locale: r.locale as EventRow['locale'],
		timezone: r.timezone as string,
		pollMode: r.poll_mode as EventRow['pollMode'],
		organizerToken: r.organizer_token as string,
		shareToken: r.share_token as string,
		status: r.status as EventRow['status'],
		allowPreferred: r.allow_preferred === 1,
		allowUnsure: r.allow_unsure === 1,
		accent: r.accent as EventRow['accent'],
		createdAt: r.created_at as string
	};
}

function mapDateOption(r: Record<string, unknown>): DateOptionRow {
	return {
		id: r.id as string,
		eventId: r.event_id as string,
		startsAt: (r.starts_at as string | null) ?? null,
		endsAt: (r.ends_at as string | null) ?? null,
		sortOrder: r.sort_order as number,
		selected: r.selected === 1
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
	const setStatusClearing = (eventId: string, status: 'open' | 'cancelled') =>
		db.batch([
			db.prepare(`UPDATE events SET status = ? WHERE id = ?`).bind(status, eventId),
			db.prepare(`UPDATE date_options SET selected = 0 WHERE event_id = ?`).bind(eventId)
		]);

	return {
		...helpers,

		async createEvent(draft: EventDraft) {
			const now = new Date().toISOString();
			const eventId = id('event');
			const organizerToken = newToken();
			const shareToken = newToken();

			const statements: D1PreparedStatement[] = [
				db
					.prepare(
						`INSERT INTO events (id, title, description, locale, timezone, poll_mode, allow_preferred, allow_unsure, accent, organizer_token, share_token, status, created_at)
						 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`
					)
					.bind(
						eventId,
						draft.title,
						draft.description || null,
						draft.locale,
						draft.timezone,
						draft.pollMode,
						draft.allowPreferred ? 1 : 0,
						draft.allowUnsure ? 1 : 0,
						draft.accent,
						organizerToken,
						shareToken,
						now
					)
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
							zonedToUtcIso(d.value, d.startTime, draft.timezone),
							zonedToUtcIso(d.value, d.endTime, draft.timezone),
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

		async getShareContext(shareToken: string): Promise<ShareContext | null> {
			const eventRow = await db
				.prepare(`SELECT * FROM events WHERE share_token = ?`)
				.bind(shareToken)
				.first();
			if (!eventRow) return null;
			const event = mapEvent(eventRow);
			// Only open polls accept shared-link submissions.
			if (event.pollMode !== 'open') return null;

			const dates = await db
				.prepare(`SELECT * FROM date_options WHERE event_id = ? ORDER BY sort_order`)
				.bind(event.id)
				.all();
			return { event, dateOptions: dates.results.map(mapDateOption) };
		},

		async submitOpenResponse(eventId, name, answers, note) {
			// Mint the invitee row directly so we hold its id (token is the edit link).
			const inviteeId = id('p');
			const token = newToken();
			await db
				.prepare(
					`INSERT INTO invitees (id, event_id, label, token, note, created_at)
					 VALUES (?, ?, ?, ?, ?, ?)`
				)
				.bind(inviteeId, eventId, name, token, note || null, new Date().toISOString())
				.run();
			await this.saveResponses(inviteeId, answers);
			return { token };
		},

		async setPollMode(eventId, mode) {
			await db.prepare(`UPDATE events SET poll_mode = ? WHERE id = ?`).bind(mode, eventId).run();
		},

		async setResponseChoices(eventId, allowPreferred, allowUnsure) {
			// Disabling folds recorded answers into the fixed pair (preferred →
			// available, unsure → unavailable) in the same batch as the flag write,
			// so results never show a choice the event no longer offers.
			const fold = (from: string, to: string) =>
				db
					.prepare(
						`UPDATE responses SET preference = ?
						 WHERE preference = ?
						   AND invitee_id IN (SELECT id FROM invitees WHERE event_id = ?)`
					)
					.bind(to, from, eventId);
			const statements = [
				db
					.prepare(`UPDATE events SET allow_preferred = ?, allow_unsure = ? WHERE id = ?`)
					.bind(allowPreferred ? 1 : 0, allowUnsure ? 1 : 0, eventId)
			];
			if (!allowPreferred) statements.push(fold('preferred', 'available'));
			if (!allowUnsure) statements.push(fold('unsure', 'unavailable'));
			await db.batch(statements);
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

			const rows = await db.prepare(RESULTS_SQL).bind(eventId).all<{
				id: string;
				preferred: number;
				available: number;
				unavailable: number;
				unsure: number;
			}>();

			return rows.results.map((r) => ({
				dateOptionId: r.id,
				preferred: r.preferred,
				available: r.available,
				unavailable: r.unavailable,
				unsure: r.unsure,
				// missing responses row => counted here, never as unavailable.
				// unsure is a recorded answer, so it never lands here either.
				notAnswered: totalInvitees - (r.preferred + r.available + r.unavailable + r.unsure)
			}));
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

		async addDateOption(eventId, date, timezone) {
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
					zonedToUtcIso(date.value, date.startTime, timezone),
					zonedToUtcIso(date.value, date.endTime, timezone),
					(max?.m ?? -1) + 1
				)
				.run();
		},

		async updateDateOption(optionId, date, timezone) {
			await db
				.prepare(`UPDATE date_options SET starts_at = ?, ends_at = ? WHERE id = ?`)
				.bind(
					zonedToUtcIso(date.value, date.startTime, timezone),
					zonedToUtcIso(date.value, date.endTime, timezone),
					optionId
				)
				.run();
		},

		async reorderDateOptions(eventId, orderedIds) {
			// event_id guard so a stray id can't renumber another event's option.
			await db.batch(
				orderedIds.map((optionId, i) =>
					db
						.prepare(`UPDATE date_options SET sort_order = ? WHERE id = ? AND event_id = ?`)
						.bind(i, optionId, eventId)
				)
			);
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

		async closeEvent(eventId, selectedOptionIds) {
			const marks = selectedOptionIds.map(() => '?').join(', ');
			await db.batch([
				db.prepare(`UPDATE events SET status = 'closed' WHERE id = ?`).bind(eventId),
				db
					.prepare(
						`UPDATE date_options SET selected = CASE WHEN id IN (${marks}) THEN 1 ELSE 0 END
						 WHERE event_id = ?`
					)
					.bind(...selectedOptionIds, eventId)
			]);
		},

		// Both clear every selection flag - closing again always asks for a fresh
		// pick - and differ only in the status they land on.
		async cancelEvent(eventId) {
			await setStatusClearing(eventId, 'cancelled');
		},

		async reopenEvent(eventId) {
			await setStatusClearing(eventId, 'open');
		},

		async setEventLocale(eventId, locale) {
			await db.prepare(`UPDATE events SET locale = ? WHERE id = ?`).bind(locale, eventId).run();
		},

		async setEventAccent(eventId, accent) {
			await db.prepare(`UPDATE events SET accent = ? WHERE id = ?`).bind(accent, eventId).run();
		},

		async setEventTimezone(eventId, timezone) {
			await db.prepare(`UPDATE events SET timezone = ? WHERE id = ?`).bind(timezone, eventId).run();
		},

		async updateEventDetails(eventId, title, description) {
			await db
				.prepare(`UPDATE events SET title = ?, description = ? WHERE id = ?`)
				.bind(title, description, eventId)
				.run();
		}
	};
}
