import type {
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
	// Open-mode shared link: resolve the event + its dates by share_token. Null if
	// unknown or the poll is not in open mode.
	getShareContext(shareToken: string): Promise<ShareContext | null>;
	// One open submission: create an invitee (label = name) and save its answers +
	// note in one go. Returns the new invitee token (personal edit link / cookie).
	submitOpenResponse(
		eventId: string,
		name: string,
		answers: ResponseInput[],
		note: string
	): Promise<{ token: string }>;
	setPollMode(eventId: string, mode: PollMode): Promise<void>;
	saveResponses(inviteeId: string, answers: ResponseInput[]): Promise<void>;
	saveNote(inviteeId: string, note: string): Promise<void>;
	getResults(eventId: string): Promise<DateOptionResult[]>;
	// Ids of invitees with at least one response - the complement is "pending".
	getAnsweredInviteeIds(eventId: string): Promise<Set<string>>;
	// Every response for the event, so the dashboard can list who chose what.
	getEventResponses(eventId: string): Promise<ResponseRow[]>;
	// Organizer dashboard mutations. IDs/tokens are generated server-side.
	addDateOption(eventId: string, date: DateOptionInput): Promise<void>;
	updateDateOption(optionId: string, date: DateOptionInput): Promise<void>;
	removeDateOption(optionId: string): Promise<void>;
	addInvitee(eventId: string, label: string): Promise<{ token: string }>;
	renameInvitee(inviteeId: string, label: string): Promise<void>;
	removeInvitee(inviteeId: string): Promise<void>;
	setEventStatus(eventId: string, status: 'open' | 'closed'): Promise<void>;
	setEventLocale(eventId: string, locale: Locale): Promise<void>;
	updateEventDetails(eventId: string, title: string, description: string | null): Promise<void>;
}

// Swap point: D1 when a platform/DB is present (Workers), mock otherwise
// (`bun run dev` without a DB, and unit tests). This is the only decision point.
export function getProvider(platform?: App.Platform): DataProvider {
	return platform?.env.DB ? d1Provider(platform.env.DB) : mockProvider;
}
