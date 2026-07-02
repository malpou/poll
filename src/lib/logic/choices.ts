import type { Preference } from '$lib/types';

/**
 * The choices an event offers, in display order. Available/Unavailable are
 * always present; Preferred and unsure follow the event's toggles
 * (openspec/specs/event-management). Used both to render the selector and to
 * validate submissions server-side - a disabled choice must be rejected on
 * write, not just hidden.
 */
export function enabledPreferences(event: {
	allowPreferred: boolean;
	allowUnsure: boolean;
}): Preference[] {
	const choices: Preference[] = [];
	if (event.allowPreferred) choices.push('preferred');
	choices.push('available', 'unavailable');
	if (event.allowUnsure) choices.push('unsure');
	return choices;
}
