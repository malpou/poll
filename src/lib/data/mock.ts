import type { DataProvider } from './provider';
import { helpers, newToken } from './shared';

// In-memory mock for `bun run dev` without a DB and for tests. No persistence
// across requests - the read methods return empty/not-found. Real storage is
// d1.ts; this keeps the create page working locally without wrangler.
/* eslint-disable @typescript-eslint/no-empty-function -- write methods are intentional no-ops */
export const mockProvider: DataProvider = {
	...helpers,

	async createEvent() {
		return { organizerToken: newToken() };
	},

	async getEventByOrganizerToken() {
		return null;
	},

	async getInviteeContext() {
		return null;
	},

	async getShareContext() {
		return null;
	},

	async submitOpenResponse() {
		return { token: newToken() };
	},

	async setPollMode() {},

	async saveResponses() {},

	async saveNote() {},

	async getResults() {
		return [];
	},

	async getAnsweredInviteeIds() {
		// No persistence - local dev shows everyone pending; e2e uses real D1.
		return new Set<string>();
	},

	async getEventResponses() {
		return [];
	},

	async addDateOption() {},

	async updateDateOption() {},

	async removeDateOption() {},

	async addInvitee() {
		return { token: newToken() };
	},

	async renameInvitee() {},

	async removeInvitee() {},

	async setEventStatus() {},

	async setEventLocale() {},

	async updateEventDetails() {}
};
