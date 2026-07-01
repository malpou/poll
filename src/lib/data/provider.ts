import type { DateOption, EventDraft, Participant } from '$lib/types';
import { mockProvider } from './mock';

export type CreateResult = { organizerToken: string };

export interface DataProvider {
	seedEvent(): { title: string; description: string };
	blankDate(): DateOption;
	blankParticipant(): Participant;
	inviteeUrl(token: string): string;
	createEvent(draft: EventDraft): Promise<CreateResult>;
}

// Swap point: replace with a D1-backed provider later. This one line changes.
export const provider: DataProvider = mockProvider;
