// Locale-aware date rendering for date options, in the event's timezone (IANA
// id, stored per event). The poll's stored locale drives weekday/month wording
// and the "at" prefix (kl./at/à/...). starts_at/ends_at are UTC ISO or null.
// da-DK renders weekday/month lowercase (lørdag, marts); other locales keep
// Intl's default casing.
import { m } from '$lib/paraglide/messages';
import { INTL_LOCALE } from '$lib/logic/locales';
import type { Locale } from '$lib/types';

// Cache one formatter trio per locale+zone - Intl.DateTimeFormat construction
// isn't free and this is the hot read path.
const fmtCache = new Map<
	string,
	{ weekday: Intl.DateTimeFormat; date: Intl.DateTimeFormat; time: Intl.DateTimeFormat }
>();
function formatters(locale: Locale, tz: string) {
	const key = `${locale}|${tz}`;
	let f = fmtCache.get(key);
	if (!f) {
		const tag = INTL_LOCALE[locale];
		f = {
			weekday: new Intl.DateTimeFormat(tag, { timeZone: tz, weekday: 'long' }),
			date: new Intl.DateTimeFormat(tag, {
				timeZone: tz,
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			}),
			time: new Intl.DateTimeFormat(tag, {
				timeZone: tz,
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			})
		};
		fmtCache.set(key, f);
	}
	return f;
}

export interface FormattedDate {
	weekday: string; // "lørdag"
	dateLabel: string; // "12. september 2026"
	timeRange: string; // "kl. 10:00-11:00", "kl. 10:00", or ""
}

// yyyy-mm-dd + hh:mm (wall-clock in tz) -> UTC ISO instant. Blank date => null.
// Treat the wall-clock as UTC, measure how far that instant renders from the
// wanted wall-clock in tz, then subtract that offset. Handles DST via Intl.
// Built inline (not cached): write/edit path, a handful of calls per request.
function offsetFmt(tz: string) {
	return new Intl.DateTimeFormat('en-US', {
		timeZone: tz,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
}
export function zonedToUtcIso(value: string, time: string, tz: string): string | null {
	if (!value) return null;
	const asUtc = new Date(`${value}T${time || '00:00'}:00Z`);
	const p = Object.fromEntries(
		offsetFmt(tz)
			.formatToParts(asUtc)
			.map((x) => [x.type, x.value])
	);
	const shown = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
	return new Date(asUtc.getTime() - (shown - asUtc.getTime())).toISOString();
}

// UTC ISO -> wall-clock parts in tz for the edit form's native inputs.
export function utcIsoToZonedParts(
	iso: string | null,
	tz: string
): { value: string; time: string } {
	if (!iso) return { value: '', time: '' };
	const partsFmt = new Intl.DateTimeFormat('en-CA', {
		timeZone: tz,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});
	const p = Object.fromEntries(partsFmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
	return { value: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/**
 * Formats a date option into locale-aware weekday, date, and time-range parts,
 * rendered in the event's timezone.
 *
 * Defensive: a date option with no starts_at renders blank rather than crashing
 * (the create form requires a date, so this is only reached if data is malformed).
 */
export function formatDateOption(
	startsAt: string | null,
	endsAt: string | null,
	locale: Locale,
	tz: string
): FormattedDate {
	if (!startsAt) return { weekday: '', dateLabel: '', timeRange: '' };
	const fmt = formatters(locale, tz);
	const start = new Date(startsAt);
	// ponytail: a local-midnight start with no distinct end IS a date-only
	// option - the write path anchors time-less dates at midnight in the event
	// zone. A genuinely midnight-starting event needs explicit has-time storage
	// to render its time; until someone asks, this heuristic wins.
	const dateOnly =
		utcIsoToZonedParts(startsAt, tz).time === '00:00' && (!endsAt || endsAt === startsAt);
	const at = m.timeAt({}, { locale }); // "kl. " / "at " / "à " / ...
	let timeRange = '';
	if (!dateOnly) {
		timeRange = `${at}${fmt.time.format(start)}`;
		if (endsAt) timeRange += `-${fmt.time.format(new Date(endsAt))}`;
	}
	return {
		weekday: fmt.weekday.format(start),
		dateLabel: fmt.date.format(start),
		timeRange
	};
}
