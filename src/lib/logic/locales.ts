// The single per-locale table in the app. The list of supported locales itself
// comes from project.inlang/settings.json via the generated Paraglide runtime,
// so pickers can never drift from the message catalogs.
import { locales } from '$lib/paraglide/runtime';
import type { Locale } from '$lib/types';

export { locales };

// BCP-47 tag per app locale. Region pins date/time conventions. Record<Locale,
// ...> means adding a locale to settings.json fails typecheck here until a tag
// is added.
export const INTL_LOCALE: Record<Locale, string> = {
	da: 'da-DK',
	de: 'de-DE',
	en: 'en-GB',
	es: 'es-ES',
	fr: 'fr-FR'
};

// Language name translated into the UI locale ("Danish"/"Dansk"/"Danois") via
// Intl.DisplayNames - no catalog keys needed. Capitalized because some locales
// (da, fr) return lowercase names.
export function langLabel(lang: Locale, ui: Locale): string {
	const name = new Intl.DisplayNames(INTL_LOCALE[ui], { type: 'language' }).of(lang) ?? lang;
	return name[0].toUpperCase() + name.slice(1);
}
