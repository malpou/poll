// Shared form-action helpers. Extracted from the create page's inline parser
// once the dashboard became the second caller (the promised extraction).
import { m } from '$lib/paraglide/messages';

/**
 * Read one trimmed string field; '' when absent or non-string.
 */
export function field(form: FormData, key: string): string {
	const v = form.get(key);
	return typeof v === 'string' ? v.trim() : '';
}

/**
 * Rebuilds row arrays from indexed named inputs (`dates.0.value`,
 * `participants.1.token`, ...). Only string fields are read.
 */
export function parseIndexed(form: FormData, prefix: string): Partial<Record<string, string>>[] {
	const re = new RegExp(`^${prefix}\\.(\\d+)\\.(\\w+)$`);
	const rows: Partial<Record<string, string>>[] = [];
	for (const key of form.keys()) {
		const m = re.exec(key);
		if (!m) continue;
		const i = Number(m[1]);
		(rows[i] ??= {})[m[2]] = field(form, key);
	}
	return rows.filter(Boolean);
}

/**
 * Validate a date option's optional times.
 * end requires start; end must not precede start (both hh:mm, same day).
 * @returns An error string, or null when the times are valid.
 */
export function validateTimes(startTime: string, endTime: string): string | null {
	if (endTime && !startTime) return m.errorEndNeedsStart();
	if (startTime && endTime && endTime < startTime) return m.errorEndBeforeStart();
	return null;
}
