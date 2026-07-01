import type { DataProvider } from './provider';
import type { EventDraft } from '$lib/types';
import { helpers, newToken } from './shared';

// In-memory mock for `bun run dev` without a DB and for tests. No persistence
// across requests — the read methods return empty/not-found. Real storage is
// d1.ts; this keeps the create page working locally without wrangler.
export const mockProvider: DataProvider = {
	...helpers,

	async createEvent(draft: EventDraft) {
		const organizerToken = newToken();
		console.log('[mock] createEvent', { organizerToken, draft });
		return { organizerToken };
	},

	async getEventByOrganizerToken() {
		return null;
	},

	async getInviteeContext() {
		return null;
	},

	async saveResponses(inviteeId, answers) {
		console.log('[mock] saveResponses', { inviteeId, answers });
	},

	async getResults() {
		return [];
	}
};
