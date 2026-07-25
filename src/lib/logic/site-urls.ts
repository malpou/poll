// Marketing-page URLs (landing and create): English lives at the bare path,
// the other locales under /{lang}. A non-default highlighter rides the
// ?accent= query so the pick survives language switches and page changes.
import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import { baseLocale } from '$lib/paraglide/runtime';
import type { Accent, CreateKind, Locale } from '$lib/types';

const params = (l: Locale) => (l === baseLocale ? {} : { lang: l });

const withAccent = (path: ResolvedPathname, accent: Accent): ResolvedPathname =>
	accent === 'yellow' ? path : `${path}?accent=${accent}`;

export function landingUrl(locale: Locale, accent: Accent = 'yellow'): ResolvedPathname {
	return withAccent(resolve('/[[lang=locale]]', params(locale)), accent);
}

/**
 * The create page. `kind` picks which of the two things it opens on: a poll
 * (the default) or a planning-poker room. Both take a highlighter, so both
 * carry the picked one over.
 */
export function createUrl(
	locale: Locale,
	accent: Accent = 'yellow',
	kind: CreateKind = 'poll'
): ResolvedPathname {
	const path = withAccent(resolve('/[[lang=locale]]/create', params(locale)), accent);
	if (kind !== 'poker') return path;
	return path.includes('?') ? `${path}&make=poker` : `${path}?make=poker`;
}
