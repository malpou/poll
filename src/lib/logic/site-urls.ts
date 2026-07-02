// Marketing-page URLs (landing and create): English lives at the bare path,
// the other locales under /{lang}. A non-default highlighter rides the
// ?accent= query so the pick survives language switches and page changes.
import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import { baseLocale } from '$lib/paraglide/runtime';
import type { Accent, Locale } from '$lib/types';

const params = (l: Locale) => (l === baseLocale ? {} : { lang: l });

const withAccent = (path: ResolvedPathname, accent: Accent): ResolvedPathname =>
	accent === 'yellow' ? path : `${path}?accent=${accent}`;

export function landingUrl(locale: Locale, accent: Accent = 'yellow'): ResolvedPathname {
	return withAccent(resolve('/[[lang=locale]]', params(locale)), accent);
}

export function createUrl(locale: Locale, accent: Accent = 'yellow'): ResolvedPathname {
	return withAccent(resolve('/[[lang=locale]]/create', params(locale)), accent);
}
