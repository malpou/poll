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
