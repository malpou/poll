// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
/// <reference types="@cloudflare/workers-types" />
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: D1Database;
				// Load-cache TTL; "0" disables (see src/lib/server/cache.ts).
				CACHE_TTL_SECONDS?: string;
			};
			context: { waitUntil(promise: Promise<unknown>): void };
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
