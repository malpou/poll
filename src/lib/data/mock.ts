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

	async saveNote(inviteeId, note) {
		console.log('[mock] saveNote', { inviteeId, note });
	},

	async getResults() {
		return [];
	},

	async getAnsweredInviteeIds() {
		// No persistence — local dev shows everyone pending; e2e uses real D1.
		return new Set<string>();
	},

	async getEventResponses() {
		return [];
	},

	async addDateOption(eventId, date) {
		console.log('[mock] addDateOption', { eventId, date });
	},

	async updateDateOption(optionId, date) {
		console.log('[mock] updateDateOption', { optionId, date });
	},

	async removeDateOption(optionId) {
		console.log('[mock] removeDateOption', { optionId });
	},

	async addInvitee(eventId, label) {
		const token = newToken();
		console.log('[mock] addInvitee', { eventId, label, token });
		return { token };
	},

	async renameInvitee(inviteeId, label) {
		console.log('[mock] renameInvitee', { inviteeId, label });
	},

	async removeInvitee(inviteeId) {
		console.log('[mock] removeInvitee', { inviteeId });
	},

	async setEventStatus(eventId, status) {
		console.log('[mock] setEventStatus', { eventId, status });
	}
};
