import type { DataProvider } from './provider';
import type { DateOption, EventDraft, Participant } from '$lib/types';

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// ≥128 bits of entropy, base62 (PROJECT.md). 22 chars ≈ 131 bits.
function newToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(22));
	let out = '';
	for (const b of bytes) out += BASE62[b % 62];
	return out;
}

function id(prefix: string): string {
	return `${prefix}-${newToken().slice(0, 7)}`;
}

export const mockProvider: DataProvider = {
	seedEvent() {
		return {
			title: 'Rundvisning i DR Byen',
			description: 'Vi mødes ved hovedindgangen til DR Byen. Turen tager ca. en time.'
		};
	},

	blankDate(): DateOption {
		return { id: id('date'), value: '', startTime: '', endTime: '' };
	},

	blankParticipant(): Participant {
		return { id: id('p'), name: '', token: newToken() };
	},

	inviteeUrl(token: string): string {
		return `https://poll.malpou.io/r/${token}`;
	},

	async createEvent(draft: EventDraft) {
		const organizerToken = newToken();
		console.log('[mock] createEvent', { organizerToken, draft });
		return { organizerToken };
	}
};
