import { AsyncLocalStorage } from 'node:async_hooks';
import { building } from '$app/environment';
import { overwriteGetLocale, getTextDirection, baseLocale, isLocale } from '$lib/paraglide/runtime';
import type { Locale } from '$lib/types';
import type { Handle } from '@sveltejs/kit';

// Locale is never derived from the visitor's browser. Token pages render in the
// poll's locale (stored in D1, the same for every consumer); marketing pages
// (landing, create) in the URL's language segment. So instead of Paraglide's
// url/cookie strategy we run each request inside an AsyncLocalStorage seeded
// from the URL segment, which token-page load functions then overwrite from the
// resolved event. Bare m.*() calls in components render in that locale via the
// overwritten getLocale().
const store = new AsyncLocalStorage<{ locale: Locale }>();

const currentLocale = (): Locale => store.getStore()?.locale ?? baseLocale;

// `building` guards prerender/analysis where there is no request context.
if (!building) {
	overwriteGetLocale(currentLocale);
}

/**
 * Called from load functions once the poll's locale is known. No-op if the
 * negotiated value isn't a supported locale.
 */
export function setRequestLocale(locale: string): void {
	const box = store.getStore();
	if (box && isLocale(locale)) box.locale = locale;
}

export const handle: Handle = ({ event, resolve }) =>
	// Marketing routes carry an optional [[lang]] segment that seeds the request
	// locale; token routes have no such param and keep overwriting from the poll
	// row in their loads.
	store.run({ locale: isLocale(event.params.lang) ? event.params.lang : baseLocale }, () =>
		resolve(event, {
			// Stamp <html lang>/<dir> from the resolved locale (app.html has the
			// %lang%/%dir% placeholders). Runs after load has set the store, so the
			// value reflects the poll's locale. The client mirrors it from the DOM
			// (see +layout.svelte) so hydration doesn't fall back to baseLocale.
			transformPageChunk: ({ html }) =>
				html.replace('%lang%', currentLocale()).replace('%dir%', getTextDirection(currentLocale()))
		})
	);
