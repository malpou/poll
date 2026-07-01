// Mirrors the D1 model in specs/PROJECT.md. starts_at/ends_at optional;
// ends_at requires starts_at. On the create form we hold date + times as
// separate fields and compose starts_at/ends_at at submit.

export type DateOption = {
	id: string;
	value: string; // yyyy-mm-dd, native <input type=date>
	startTime: string; // hh:mm or '' — optional
	endTime: string; // hh:mm or '' — optional, requires startTime
};

export type Participant = {
	id: string;
	name: string;
	token: string;
};

export type EventDraft = {
	title: string;
	description: string;
	dates: DateOption[];
	participants: Participant[];
};

// --- Persisted row shapes (D1). Returned by the provider's query methods. ---

export type Preference = 'preferred' | 'available' | 'unavailable';

export type EventRow = {
	id: string;
	title: string;
	description: string | null;
	organizerToken: string;
	status: 'open' | 'closed';
	createdAt: string;
};

export type DateOptionRow = {
	id: string;
	eventId: string;
	startsAt: string | null;
	endsAt: string | null;
	label: string | null;
	sortOrder: number;
};

export type InviteeRow = {
	id: string;
	eventId: string;
	label: string;
	token: string;
	note: string | null;
	createdAt: string;
};

export type ResponseRow = {
	inviteeId: string;
	dateOptionId: string;
	preference: Preference;
	updatedAt: string;
};

// Organizer dashboard payload.
export type EventWithDetails = EventRow & {
	dateOptions: DateOptionRow[];
	invitees: InviteeRow[];
};

// Recipient response page payload.
export type InviteeContext = {
	invitee: InviteeRow;
	event: EventRow;
	dateOptions: DateOptionRow[];
	responses: ResponseRow[];
};

// Per-date aggregate for the results view. notAnswered = invitees − answered,
// so a missing responses row reads as "no answer", never "unavailable".
export type DateOptionResult = {
	dateOptionId: string;
	preferred: number;
	available: number;
	unavailable: number;
	notAnswered: number;
};
