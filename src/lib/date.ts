// Danish date rendering for date options, Europe/Copenhagen, lowercase
// (PROJECT.md convention). starts_at/ends_at are UTC ISO or null.
// da-DK already renders weekday/month lowercase (lørdag, marts), so no casing.

const TZ = 'Europe/Copenhagen';

const weekdayFmt = new Intl.DateTimeFormat('da-DK', { timeZone: TZ, weekday: 'long' });
const dateFmt = new Intl.DateTimeFormat('da-DK', {
	timeZone: TZ,
	day: 'numeric',
	month: 'long',
	year: 'numeric'
});
const timeFmt = new Intl.DateTimeFormat('da-DK', {
	timeZone: TZ,
	hour: '2-digit',
	minute: '2-digit',
	hour12: false
});

export interface FormattedDate {
	weekday: string; // "lørdag"
	dateLabel: string; // "12. september 2026"
	timeRange: string; // "kl. 10:00–11:00", "kl. 10:00", or ""
}

// yyyy-mm-dd + hh:mm (Copenhagen wall-clock) -> UTC ISO instant. Blank date => null.
// Treat the wall-clock as UTC, measure how far that instant renders from the
// wanted wall-clock in TZ, then subtract that offset. Handles CET/CEST via Intl.
const offsetFmt = new Intl.DateTimeFormat('en-US', {
	timeZone: TZ,
	hourCycle: 'h23',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit'
});
export function zonedToUtcIso(value: string, time: string): string | null {
	if (!value) return null;
	const asUtc = new Date(`${value}T${time || '00:00'}:00Z`);
	const p = Object.fromEntries(offsetFmt.formatToParts(asUtc).map((x) => [x.type, x.value]));
	const shown = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
	return new Date(asUtc.getTime() - (shown - asUtc.getTime())).toISOString();
}

// UTC ISO -> Copenhagen wall-clock parts for the edit form's native inputs.
const partsFmt = new Intl.DateTimeFormat('en-CA', {
	timeZone: TZ,
	hourCycle: 'h23',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit'
});
export function utcIsoToZonedParts(iso: string | null): { value: string; time: string } {
	if (!iso) return { value: '', time: '' };
	const p = Object.fromEntries(partsFmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
	return { value: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

// Defensive: a date option with no starts_at renders blank rather than crashing
// (create form requires a date, so this is only reached if data is malformed).
export function formatDateOption(startsAt: string | null, endsAt: string | null): FormattedDate {
	if (!startsAt) return { weekday: '', dateLabel: '', timeRange: '' };
	const start = new Date(startsAt);
	const startTime = timeFmt.format(start);
	let timeRange = `kl. ${startTime}`;
	if (endsAt) timeRange = `kl. ${startTime}–${timeFmt.format(new Date(endsAt))}`;
	return {
		weekday: weekdayFmt.format(start),
		dateLabel: dateFmt.format(start),
		timeRange
	};
}
