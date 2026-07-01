import type {
	DateOption,
	DateOptionResult,
	EventDraft,
	EventWithDetails,
	InviteeContext,
	Participant,
	Preference
} from '$lib/types';
import { mockProvider } from './mock';
import { d1Provider } from './d1';

export type CreateResult = { organizerToken: string };
export type ResponseInput = { dateOptionId: string; preference: Preference };

export interface DataProvider {
	seedEvent(): { title: string; description: string };
	blankDate(): DateOption;
	blankParticipant(): Participant;
	inviteeUrl(token: string): string;
	createEvent(draft: EventDraft): Promise<CreateResult>;
	getEventByOrganizerToken(token: string): Promise<EventWithDetails | null>;
	getInviteeContext(inviteeToken: string): Promise<InviteeContext | null>;
	saveResponses(inviteeId: string, answers: ResponseInput[]): Promise<void>;
	getResults(eventId: string): Promise<DateOptionResult[]>;
}

// Swap point: D1 when a platform/DB is present (Workers), mock otherwise
// (`bun run dev` without a DB, and unit tests). This is the only decision point.
export function getProvider(platform?: App.Platform): DataProvider {
	return platform?.env.DB ? d1Provider(platform.env.DB) : mockProvider;
}
