import type { Locale } from '$lib/paraglide/runtime';

export type { Locale };

// Mirrors the D1 model in specs/PROJECT.md. starts_at/ends_at optional;
// ends_at requires starts_at. On the create form we hold date + times as
// separate fields and compose starts_at/ends_at at submit.

export interface DateOption {
	id: string;
	value: string; // yyyy-mm-dd, native <input type=date>
	startTime: string; // hh:mm or '' - optional
	endTime: string; // hh:mm or '' - optional, requires startTime
}

export interface Participant {
	id: string;
	name: string;
	token: string;
}

export interface EventDraft {
	title: string;
	description: string;
	locale: Locale;
	dates: DateOption[];
	participants: Participant[];
}

// --- Persisted row shapes (D1). Returned by the provider's query methods. ---

export type Preference = 'preferred' | 'available' | 'unavailable';

export interface EventRow {
	id: string;
	title: string;
	description: string | null;
	locale: Locale;
	organizerToken: string;
	status: 'open' | 'closed';
	createdAt: string;
}

export interface DateOptionRow {
	id: string;
	eventId: string;
	startsAt: string | null;
	endsAt: string | null;
	sortOrder: number;
}

export interface InviteeRow {
	id: string;
	eventId: string;
	label: string;
	token: string;
	note: string | null;
	createdAt: string;
}

export interface ResponseRow {
	inviteeId: string;
	dateOptionId: string;
	preference: Preference;
	updatedAt: string;
}

// Organizer dashboard payload.
export type EventWithDetails = EventRow & {
	dateOptions: DateOptionRow[];
	invitees: InviteeRow[];
};

// Recipient response page payload.
export interface InviteeContext {
	invitee: InviteeRow;
	event: EventRow;
	dateOptions: DateOptionRow[];
	responses: ResponseRow[];
}

// Per-date aggregate for the results view. notAnswered = invitees − answered,
// so a missing responses row reads as "no answer", never "unavailable".
export interface DateOptionResult {
	dateOptionId: string;
	preferred: number;
	available: number;
	unavailable: number;
	notAnswered: number;
}
