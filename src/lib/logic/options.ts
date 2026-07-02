import { formatDateOption } from './date';
import type { DateOptionRow, EventRow } from '$lib/types';

/**
 * The one branch between the two poll types' option rendering
 * (openspec/specs/question-options): a question option carries its text in
 * `label` and shows no weekday/date/time; a date option is the reverse.
 */
export function optionDisplay(
	d: Pick<DateOptionRow, 'startsAt' | 'endsAt' | 'label'>,
	event: Pick<EventRow, 'pollType' | 'locale' | 'timezone'>
): { weekday: string; dateLabel: string; timeRange: string; label: string } {
	return event.pollType === 'question'
		? { weekday: '', dateLabel: '', timeRange: '', label: d.label ?? '' }
		: { ...formatDateOption(d.startsAt, d.endsAt, event.locale, event.timezone), label: '' };
}
