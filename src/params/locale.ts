import { baseLocale, locales } from '$lib/paraglide/runtime';
import type { ParamMatcher } from '@sveltejs/kit';

// Matches only the non-base locale codes (da, de, es, fr) so the optional
// [[lang]] segment can never shadow /e, /r, /s or swallow junk paths. English
// has no /en twin - the bare path is the English page.
export const match: ParamMatcher = (param) =>
	param !== baseLocale && (locales as readonly string[]).includes(param);
