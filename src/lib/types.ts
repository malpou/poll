import type { Locale } from '$lib/paraglide/runtime';

export type { Locale };

// Mirrors the D1 model in openspec/specs/PROJECT.md. starts_at/ends_at optional;
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

export type PollMode = 'assigned' | 'open';

// dates = candidate-date options; question = free-form text options; rsvp =
// one fixed date, yes/no answers. Chosen at creation, immutable after;
// validated at the form boundary (no SQL CHECK).
export const POLL_TYPES = ['dates', 'question', 'rsvp'] as const;
export type PollType = (typeof POLL_TYPES)[number];

// The poll's highlighter accent; validated at the form boundary (no SQL CHECK).
export const ACCENTS = ['yellow', 'pink', 'green', 'blue', 'purple'] as const;
export type Accent = (typeof ACCENTS)[number];

export interface EventDraft {
	title: string;
	description: string;
	locale: Locale;
	timezone: string; // IANA id; validated at the form boundary
	pollMode: PollMode;
	// Available/Unavailable are always offered; these two are the toggles.
	allowPreferred: boolean;
	allowUnsure: boolean;
	accent: Accent;
	pollType: PollType;
	dates: DateOption[]; // dates polls only
	textOptions: string[]; // question polls only - trimmed option labels
	participants: Participant[];
}

// --- Persisted row shapes (D1). Returned by the provider's query methods. ---

export type Preference = 'preferred' | 'available' | 'unavailable' | 'unsure';

// closed = the organizer picked final date(s); cancelled = closed without a
// pick (abandoned). Reopening returns to open and clears any selection.
export type EventStatus = 'open' | 'closed' | 'cancelled';

export interface EventRow {
	id: string;
	title: string;
	description: string | null;
	locale: Locale;
	timezone: string;
	pollMode: PollMode;
	organizerToken: string;
	shareToken: string;
	status: EventStatus;
	allowPreferred: boolean;
	allowUnsure: boolean;
	accent: Accent;
	pollType: PollType;
	createdAt: string;
}

export interface DateOptionRow {
	id: string;
	eventId: string;
	startsAt: string | null;
	endsAt: string | null;
	// Question polls: the option's text (starts_at/ends_at null). Dates polls: null.
	label: string | null;
	sortOrder: number;
	// True on the option(s) the organizer picked when closing; false while open.
	selected: boolean;
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

// Shared open-link page payload - no invitee yet (submitter names themselves).
export interface ShareContext {
	event: EventRow;
	dateOptions: DateOptionRow[];
}

// One option as the response page renders it. On question polls `label` is the
// option's text and the three date fields are ''; on dates polls the reverse.
export interface ResponseDateView {
	id: string;
	weekday: string;
	dateLabel: string;
	timeRange: string;
	label: string;
	// Set by the /r load for returning respondents: dates added since they
	// answered arrive first in the list and flagged. Absent on /s.
	needsAnswer?: boolean;
}

// --- Dashboard view models (built by the /e load, rendered by organisms). ---

export interface OptionView {
	id: string;
	value: string;
	startTime: string;
	endTime: string;
	hasResponses: boolean;
	weekday: string;
	dateLabel: string;
	timeRange: string;
	label: string;
}

export interface ResultView {
	id: string;
	chosen: boolean;
	preferred: number;
	available: number;
	unavailable: number;
	unsure: number;
	preferredPct: number;
	availablePct: number;
	unavailablePct: number;
	unsurePct: number;
	preferredNames: string[];
	availableNames: string[];
	unavailableNames: string[];
	unsureNames: string[];
	isBest: boolean;
	weekday: string;
	dateLabel: string;
	timeRange: string;
	label: string;
}

export interface InviteeView {
	id: string;
	label: string;
	url: string;
	status: 'complete' | 'partial' | 'none';
	note: string | null;
}

// Per-date aggregate for the results view. notAnswered = invitees − answered,
// so a missing responses row reads as "no answer", never "unavailable".
export interface DateOptionResult {
	dateOptionId: string;
	preferred: number;
	available: number;
	unavailable: number;
	unsure: number;
	notAnswered: number;
}
