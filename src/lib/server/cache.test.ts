import { describe, it, expect, vi } from 'vitest';
import { cacheKey, cachedLoad, invalidateCache, type CacheLike, type CachePlatform } from './cache';

const ORIGIN = 'https://poll.example';

// Minimal Map-backed stand-in for caches.default. Keeps the stored headers so
// the Cache-Control contract can be asserted; TTL expiry itself is enforced by
// the real Cache API and is out of scope here.
function fakeCaches() {
	const store = new Map<string, { body: string; cacheControl: string | null }>();
	const cache: CacheLike = {
		match: (k: string) => {
			const hit = store.get(k);
			return Promise.resolve(hit ? new Response(hit.body) : undefined);
		},
		put: async (k: string, r: Response) => {
			store.set(k, { body: await r.text(), cacheControl: r.headers.get('Cache-Control') });
		},
		delete: (k: string) => Promise.resolve(store.delete(k))
	};
	return { store, caches: { default: cache } };
}

function platformWith(caches: { default: CacheLike }, ttl = '30'): CachePlatform {
	return { env: { CACHE_TTL_SECONDS: ttl }, caches };
}

const computing = <T>(value: T) => vi.fn(() => Promise.resolve(value));

describe('cacheKey', () => {
	it('embeds origin and kind so entries cannot collide', () => {
		expect(cacheKey(ORIGIN, 'e', 'tok')).toBe(`${ORIGIN}/__cache/e/tok`);
		expect(cacheKey('http://localhost:8787', 'e', 'tok')).not.toBe(cacheKey(ORIGIN, 'e', 'tok'));
		expect(cacheKey(ORIGIN, 'r', 'tok')).not.toBe(cacheKey(ORIGIN, 's', 'tok'));
	});

	it('URL-encodes the token', () => {
		expect(cacheKey(ORIGIN, 'e', 'a/b c')).toBe(`${ORIGIN}/__cache/e/a%2Fb%20c`);
	});
});

describe('cachedLoad', () => {
	it('passes through without a platform', async () => {
		const compute = computing({ n: 1 });
		expect(await cachedLoad(undefined, ORIGIN, 'e', 'tok', compute)).toEqual({ n: 1 });
		expect(compute).toHaveBeenCalledOnce();
	});

	it('passes through when the TTL is 0 (wrangler dev / e2e)', async () => {
		const { store, caches } = fakeCaches();
		const compute = computing({ n: 1 });
		expect(await cachedLoad(platformWith(caches, '0'), ORIGIN, 'e', 'tok', compute)).toEqual({
			n: 1
		});
		expect(store.size).toBe(0);
	});

	it('stores a miss under the derived key and returns the value', async () => {
		const { store, caches } = fakeCaches();
		const value = { title: 'Dinner', options: [1, 2] };
		expect(await cachedLoad(platformWith(caches), ORIGIN, 'e', 'tok', computing(value))).toEqual(
			value
		);
		const stored = store.get(cacheKey(ORIGIN, 'e', 'tok'));
		expect(stored).toBeDefined();
		expect(JSON.parse(stored!.body)).toEqual(value);
		expect(stored!.cacheControl).toBe('max-age=30');
	});

	it('serves a hit without calling compute', async () => {
		const { caches } = fakeCaches();
		const platform = platformWith(caches);
		await cachedLoad(platform, ORIGIN, 'e', 'tok', computing({ n: 1 }));
		const compute = computing({ n: 2 });
		expect(await cachedLoad(platform, ORIGIN, 'e', 'tok', compute)).toEqual({ n: 1 });
		expect(compute).not.toHaveBeenCalled();
	});

	it('never caches null (unknown tokens)', async () => {
		const { store, caches } = fakeCaches();
		expect(await cachedLoad(platformWith(caches), ORIGIN, 'e', 'nope', computing(null))).toBeNull();
		expect(store.size).toBe(0);
	});

	it('defers the put through context.waitUntil when available', async () => {
		const { store, caches } = fakeCaches();
		const deferred: Promise<unknown>[] = [];
		const platform: CachePlatform = {
			...platformWith(caches),
			context: { waitUntil: (p) => deferred.push(p) }
		};
		await cachedLoad(platform, ORIGIN, 'e', 'tok', computing({ n: 1 }));
		expect(deferred).toHaveLength(1);
		await Promise.all(deferred);
		expect(store.has(cacheKey(ORIGIN, 'e', 'tok'))).toBe(true);
	});
});

describe('invalidateCache', () => {
	it('deletes exactly the given entries', async () => {
		const { store, caches } = fakeCaches();
		const platform = platformWith(caches);
		await cachedLoad(platform, ORIGIN, 'e', 'otok', computing({ n: 1 }));
		await cachedLoad(platform, ORIGIN, 'r', 'itok', computing({ n: 2 }));
		await cachedLoad(platform, ORIGIN, 's', 'stok', computing({ n: 3 }));

		await invalidateCache(platform, ORIGIN, [
			{ kind: 'e', token: 'otok' },
			{ kind: 'r', token: 'itok' }
		]);

		expect(store.has(cacheKey(ORIGIN, 'e', 'otok'))).toBe(false);
		expect(store.has(cacheKey(ORIGIN, 'r', 'itok'))).toBe(false);
		expect(store.has(cacheKey(ORIGIN, 's', 'stok'))).toBe(true);
	});

	it('is a no-op without a Cache API', async () => {
		await expect(
			invalidateCache(undefined, ORIGIN, [{ kind: 'e', token: 'x' }])
		).resolves.toBeUndefined();
	});
});
