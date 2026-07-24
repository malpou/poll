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
// one fixed date, yes/no answers; rank = order text options; highlight =
// spend marker strokes on text options. Chosen at creation, immutable after;
// validated at the form boundary (no SQL CHECK).
export const POLL_TYPES = ['dates', 'question', 'rsvp', 'rank', 'highlight'] as const;
export type PollType = (typeof POLL_TYPES)[number];

// The text-option types share the question type's option management: label
// holds the text, no date/timezone affordances, choice toggles forced off
// for rank/highlight.
export const TEXT_POLL_TYPES = ['question', 'rank', 'highlight'] as const;
export function isTextPollType(t: PollType): boolean {
	return (TEXT_POLL_TYPES as readonly string[]).includes(t);
}

// Highlight stroke budget bounds; validated at the form boundary like accent.
export const HIGHLIGHT_BUDGET_MIN = 1;
export const HIGHLIGHT_BUDGET_MAX = 10;
export const HIGHLIGHT_BUDGET_DEFAULT = 5;

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
	highlightBudget: number; // highlight polls only; 1-10, default 5
	// Second admin secret, set only when the creator gave an email; null = ungated.
	adminCode: string | null;
	dates: DateOption[]; // dates polls only
	textOptions: string[]; // text-option polls - trimmed option labels
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
	highlightBudget: number;
	// Second admin secret; null = organizer pages are ungated (the default).
	adminCode: string | null;
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
	// Rank position 1..N or highlight stroke count 0..budget; null on the
	// preference-based types (preference holds a constant filler on value rows -
	// the column is NOT NULL).
	value: number | null;
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
	// Rank/highlight value summaries (zeros/empty on the preference types):
	// Borda sum or stroke total, average rank position, highlight's share of
	// all strokes, and each respondent's value for the organizer's pills.
	valueSum: number;
	valueCount: number;
	avgPosition: number | null;
	sharePct: number;
	valueNames: { name: string; value: number }[];
}

export interface InviteeView {
	id: string;
	label: string;
	url: string;
	status: 'complete' | 'partial' | 'none';
	note: string | null;
}

// --- Planning poker (openspec/specs/planning-poker). Durable row shapes only;
// the live phase and in-flight votes are ephemeral coordination state held by
// the real-time layer, never persisted here. ---

// open = estimating; closed = the controller ended the session (final log only).
export type RoomStatus = 'open' | 'closed';

// The live phase of the current item. waiting = between items.
export type RoomPhase = 'waiting' | 'voting' | 'revealed';

// estimator = casts votes; observer = watches without voting.
export type ParticipantRole = 'estimator' | 'observer';

export interface PokerRoomRow {
	id: string;
	title: string;
	deck: string; // 'fibonacci' today; column reserved for future decks
	controllerToken: string; // private, facilitates the room
	joinToken: string; // shared, participants enter through it
	status: RoomStatus;
	phase: RoomPhase;
	activeRoundId: string | null; // the item being voted/revealed; null while waiting
	rev: number; // bumped on every mutation so a state poll detects change
	createdAt: string;
}

// One seat in a room. Presence is derived from lastSeenAt (heartbeat window),
// not stored. id is the cookie-carried per-browser id (a refresh resumes it).
export interface PokerParticipantRow {
	id: string;
	roomId: string;
	name: string;
	role: ParticipantRole;
	isController: boolean;
	lastSeenAt: string;
}

// One vote on the active item. card is canonical text (a deck numeral like
// '5' or a special '?'/'infinity'/'coffee'). Transient - cleared on
// finalize/re-vote.
export interface PokerVoteRow {
	roundId: string;
	participantId: string;
	card: string;
	updatedAt: string;
}

// One estimation item. final_estimate/decided_at are null until the controller
// records the estimate (the single durable artifact of a decided item).
export interface PokerRoundRow {
	id: string;
	roomId: string;
	title: string;
	sortOrder: number;
	finalEstimate: string | null;
	decidedAt: string | null;
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
	// Value aggregates (rank/highlight; all 0 on preference types). valueSum is
	// the Borda position sum or the stroke total; valueCount the number of
	// value rows; firstPlaces the count of position-1 rows (rank tiebreak).
	valueSum: number;
	valueCount: number;
	firstPlaces: number;
}
