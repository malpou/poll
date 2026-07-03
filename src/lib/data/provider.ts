import type {
	Accent,
	DateOption,
	DateOptionResult,
	EventDraft,
	EventWithDetails,
	InviteeContext,
	Locale,
	Participant,
	PollMode,
	Preference,
	ResponseRow,
	ShareContext
} from '$lib/types';
import { mockProvider } from './mock';
import { d1Provider } from './d1';

export interface CreateResult {
	organizerToken: string;
}
export interface ResponseInput {
	dateOptionId: string;
	preference: Preference;
	// Rank position / highlight stroke count. When set, preference is only the
	// NOT NULL filler ('available' for submitted answers, 'unsure' for rank rows
	// the system appended on option add - the needs-confirmation marker).
	value?: number;
}
// Date + optional times, as the dashboard/create forms hold them before compose.
export interface DateOptionInput {
	value: string; // yyyy-mm-dd
	startTime: string; // hh:mm or ''
	endTime: string; // hh:mm or ''
}

export interface DataProvider {
	blankDate(): DateOption;
	blankParticipant(): Participant;
	inviteeUrl(origin: string, token: string): string;
	organizerUrl(origin: string, token: string): string;
	shareUrl(origin: string, token: string): string;
	createEvent(draft: EventDraft): Promise<CreateResult>;
	getEventByOrganizerToken(token: string): Promise<EventWithDetails | null>;
	getInviteeContext(inviteeToken: string): Promise<InviteeContext | null>;
	/**
	 * Open-mode shared link: resolve the event + its dates by share_token. Null if
	 * unknown or the poll is not in open mode.
	 */
	getShareContext(shareToken: string): Promise<ShareContext | null>;
	/**
	 * One open submission: create an invitee (label = name) and save its answers +
	 * note in one go.
	 * @returns the new invitee token (personal edit link / cookie)
	 */
	submitOpenResponse(
		eventId: string,
		name: string,
		answers: ResponseInput[],
		note: string
	): Promise<{ token: string }>;
	setPollMode(eventId: string, mode: PollMode): Promise<void>;
	/** The per-event choice toggles; Available/Unavailable are always offered. */
	setResponseChoices(eventId: string, allowPreferred: boolean, allowUnsure: boolean): Promise<void>;
	saveResponses(inviteeId: string, answers: ResponseInput[]): Promise<void>;
	saveNote(inviteeId: string, note: string): Promise<void>;
	getResults(eventId: string): Promise<DateOptionResult[]>;
	/** Every response for the event, so the dashboard can list who chose what. */
	getEventResponses(eventId: string): Promise<ResponseRow[]>;
	/** Organizer dashboard mutations. IDs/tokens are generated server-side.
	 *  timezone = the event's IANA zone the date's wall-clock times are read in. */
	addDateOption(eventId: string, date: DateOptionInput, timezone: string): Promise<void>;
	updateDateOption(optionId: string, date: DateOptionInput, timezone: string): Promise<void>;
	/** Question-poll text options: label set, starts_at/ends_at stay null. */
	addTextOption(eventId: string, label: string): Promise<void>;
	updateTextOption(optionId: string, label: string): Promise<void>;
	removeDateOption(optionId: string): Promise<void>;
	/** Rewrite sort_order so the event's options follow orderedIds' array order. */
	reorderDateOptions(eventId: string, orderedIds: string[]): Promise<void>;
	addInvitee(eventId: string, label: string): Promise<{ token: string }>;
	renameInvitee(inviteeId: string, label: string): Promise<void>;
	removeInvitee(inviteeId: string): Promise<void>;
	/**
	 * The three legal status transitions, each atomic with its selection write
	 * (a close that set status but lost the pick would show a decided poll with
	 * no dates). closeEvent flags the chosen options and clears the rest;
	 * cancelEvent and reopenEvent clear every flag.
	 */
	closeEvent(eventId: string, selectedOptionIds: string[]): Promise<void>;
	cancelEvent(eventId: string): Promise<void>;
	reopenEvent(eventId: string): Promise<void>;
	setEventLocale(eventId: string, locale: Locale): Promise<void>;
	setEventAccent(eventId: string, accent: Accent): Promise<void>;
	setEventTimezone(eventId: string, timezone: string): Promise<void>;
	updateEventDetails(eventId: string, title: string, description: string | null): Promise<void>;
}

/**
 * Swap point: D1 when a platform/DB is present (Workers), mock otherwise
 * (`bun run dev` without a DB, and unit tests). This is the only decision point.
 */
export function getProvider(platform?: App.Platform): DataProvider {
	return platform?.env.DB ? d1Provider(platform.env.DB) : mockProvider;
}
