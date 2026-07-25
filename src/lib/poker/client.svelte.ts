// Client-side live loop for a planning-poker room (openspec/specs/planning-poker).
// Real-time is D1-backed: this short-polls the state endpoint (~1s) and posts
// one-shot commands, applying the fresh snapshot each command returns so the
// acting client updates without waiting for the next tick. The token is the
// path credential; everything else (room id, role) is server-derived.

import type { RoomSnapshot } from '$lib/logic/poker-snapshot';

const POLL_MS = 1000;

export class RoomClient {
	snapshot = $state<RoomSnapshot | null>(null);
	// True after a failed fetch, so the UI can show a soft "reconnecting" state.
	offline = $state(false);

	#token: string;
	#timer: ReturnType<typeof setInterval> | null = null;
	#inFlight = false;

	constructor(token: string) {
		this.#token = token;
	}

	get #base() {
		return `/poker/api/${encodeURIComponent(this.#token)}`;
	}

	start() {
		void this.refresh();
		this.#timer = setInterval(() => void this.refresh(), POLL_MS);
	}

	stop() {
		if (this.#timer) clearInterval(this.#timer);
		this.#timer = null;
	}

	async refresh() {
		// Never overlap polls; skip a tick if the previous fetch is still running.
		if (this.#inFlight) return;
		this.#inFlight = true;
		try {
			const res = await fetch(`${this.#base}/state`, { headers: { accept: 'application/json' } });
			if (res.ok) {
				this.snapshot = await res.json();
				this.offline = false;
			}
		} catch {
			this.offline = true;
		} finally {
			this.#inFlight = false;
		}
	}

	/** Post one command; apply the returned snapshot immediately. Returns ok. */
	async command(action: string, args: Record<string, unknown> = {}): Promise<boolean> {
		try {
			const res = await fetch(`${this.#base}/command`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ action, ...args })
			});
			if (res.ok) {
				this.snapshot = await res.json();
				this.offline = false;
				return true;
			}
			return false;
		} catch {
			this.offline = true;
			return false;
		}
	}
}
