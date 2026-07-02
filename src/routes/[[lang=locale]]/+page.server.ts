import { baseLocale, extractLocaleFromHeader, isLocale } from '$lib/paraglide/runtime';
import { zonedToUtcIso } from '$lib/logic/date';
import { ACCENTS, type Accent, type Locale } from '$lib/types';
import type { PageServerLoad } from './$types';

// Sample dates for the example cards, computed relative to now so the page
// never shows stale dates: the next two Saturdays for the date poll, the next
// Friday evening for the RSVP.
const TZ = 'Europe/Copenhagen';
function upcoming(dow: number, weeks = 0): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + (((dow - d.getUTCDay() + 6) % 7) + 1) + weeks * 7);
	return d.toISOString().slice(0, 10);
}

export const load: PageServerLoad = ({ params, request, url }) => {
	const pageLocale: Locale = isLocale(params.lang) ? params.lang : baseLocale;
	// The browser-language hint: never a redirect, just an offer (see the
	// landing-page spec). Only set when the preference differs from the page.
	const browserLocale = extractLocaleFromHeader(request);
	// The highlighter picked on the landing page rides the ?accent= param so it
	// survives language switches and carries into the create form.
	const accentParam = url.searchParams.get('accent') ?? '';
	const accent: Accent = (ACCENTS as readonly string[]).includes(accentParam)
		? (accentParam as Accent)
		: 'yellow';
	return {
		pageLocale,
		accent,
		hintLocale: browserLocale && browserLocale !== pageLocale ? browserLocale : null,
		samples: {
			dates: [upcoming(6), upcoming(6, 1)].map((d) => zonedToUtcIso(d, '', TZ) ?? ''),
			rsvp: zonedToUtcIso(upcoming(5), '18:00', TZ) ?? '',
			tz: TZ
		}
	};
};
