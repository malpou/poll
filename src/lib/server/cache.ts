// Edge caching for the token-page loads. On Workers the CDN cache sits behind
// the worker, so `caches.default` inside the worker is the only cache layer we
// get - it saves D1 reads and CPU, not invocations. Entries are keyed per
// origin + token, live for CACHE_TTL_SECONDS (cross-colo staleness backstop),
// and are purged explicitly by the form actions that mutate the event.

export type CacheKind = 'e' | 'r' | 's';

// Minimal structural view of the Cache interface, so the workers-types and
// lib.dom declarations (both in this project's type graph) are interchangeable.
export interface CacheLike {
	match(url: string): Promise<{ json(): Promise<unknown> } | undefined>;
	// `any` because the two type worlds disagree on Response and only one is
	// ever live at runtime; the helper below only ever passes a real Response.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	put(url: string, response: any): Promise<void>;
	delete(url: string): Promise<boolean>;
}

// Structural subset of App.Platform so unit tests can pass a plain fake.
export interface CachePlatform {
	env?: { CACHE_TTL_SECONDS?: string };
	caches?: { default: CacheLike };
	context?: { waitUntil(promise: Promise<unknown>): void };
}

// Cache API keys must be request URLs. The origin is part of the key so
// payloads with baked absolute URLs (dashboard share/invitee links) can never
// leak between localhost and the production host.
export function cacheKey(origin: string, kind: CacheKind, token: string): string {
	return `${origin}/__cache/${kind}/${encodeURIComponent(token)}`;
}

function ttlSeconds(platform: CachePlatform | undefined): number {
	const ttl = Number(platform?.env?.CACHE_TTL_SECONDS ?? '30');
	return Number.isFinite(ttl) ? ttl : 0;
}

// Serve `compute()`'s result from the edge cache when possible. Passthrough
// when there is no Cache API (vite dev, unit tests) or the TTL is disabled
// (.dev.vars sets 0 so wrangler-dev e2e runs stay deterministic). A null from
// compute is never cached: unknown tokens must not pin a just-created event
// or re-added invitee invisible.
export async function cachedLoad<T>(
	platform: CachePlatform | undefined,
	origin: string,
	kind: CacheKind,
	token: string,
	compute: () => Promise<T | null>
): Promise<T | null> {
	const cache = platform?.caches?.default;
	const ttl = ttlSeconds(platform);
	if (!cache || ttl <= 0) return compute();

	const key = cacheKey(origin, kind, token);
	const hit = await cache.match(key);
	if (hit) return hit.json() as Promise<T>;

	const value = await compute();
	if (value === null) return null;

	const put = cache.put(
		key,
		new Response(JSON.stringify(value), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': `max-age=${String(ttl)}`
			}
		})
	);
	// Don't block the response on the write when the runtime lets us defer it.
	if (platform.context?.waitUntil) platform.context.waitUntil(put);
	else await put;

	return value;
}

// Purge entries after a mutation. Callers must await this before returning
// from an action: the client re-runs load immediately afterwards against the
// same colo, so awaited deletes give the acting user read-your-writes.
export async function invalidateCache(
	platform: CachePlatform | undefined,
	origin: string,
	entries: readonly { kind: CacheKind; token: string }[]
): Promise<void> {
	const cache = platform?.caches?.default;
	if (!cache) return;
	await Promise.all(entries.map((e) => cache.delete(cacheKey(origin, e.kind, e.token))));
}
