import { fail, redirect } from '@sveltejs/kit';
import { getProvider } from '$lib/data/provider';
import { newToken } from '$lib/data/shared';
import { m } from '$lib/paraglide/messages';
import { baseLocale, extractLocaleFromHeader, isLocale } from '$lib/paraglide/runtime';
import { setRequestLocale } from '../hooks.server';
import { field, validateTimes } from '$lib/forms/forms';
import { richTextIsEmpty, sanitizeRichText } from '$lib/forms/richtext';
import type { DateOption, Locale, Participant, PollMode } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

type Row = Partial<Record<string, string>>;

/**
 * Loads the create page, which is the organizer's own, pre-submit: renders it in
 * the browser's preferred locale and pre-selects that in the language picker.
 * Falls back to baseLocale (da) when Accept-Language matches none of da/en/fr.
 */
export const load: PageServerLoad = ({ request }) => {
	const suggestedLocale: Locale = extractLocaleFromHeader(request) ?? baseLocale;
	setRequestLocale(suggestedLocale);
	return { suggestedLocale };
};

/**
 * Rebuilds the dates/participants arrays from indexed named inputs
 * (`dates.0.value`, `participants.1.token`, ...). Only string fields are read.
 */
function parseIndexed(form: FormData, prefix: string): Row[] {
	const re = new RegExp(`^${prefix}\\.(\\d+)\\.(\\w+)$`);
	const rows: Row[] = [];
	for (const key of form.keys()) {
		const m = re.exec(key);
		if (!m) continue;
		const i = Number(m[1]);
		(rows[i] ??= {})[m[2]] = field(form, key);
	}
	return rows.filter(Boolean);
}

export const actions = {
	create: async ({ request, platform }) => {
		const form = await request.formData();
		const title = field(form, 'title');
		const rawDescription = sanitizeRichText(field(form, 'description'));
		const description = richTextIsEmpty(rawDescription) ? '' : rawDescription;
		const localeField = field(form, 'locale');
		const locale: Locale = isLocale(localeField) ? localeField : baseLocale;
		const pollMode: PollMode = field(form, 'pollMode') === 'open' ? 'open' : 'assigned';

		// Drop rows the user added but never filled with a date.
		const dates: DateOption[] = parseIndexed(form, 'dates')
			.map((d) => ({
				id: newToken(),
				value: d.value ?? '',
				startTime: d.startTime ?? '',
				endTime: d.endTime ?? ''
			}))
			.filter((d) => d.value !== '');

		// Open mode has no named list - anyone submits via the shared link.
		const participants: Participant[] =
			pollMode === 'open'
				? []
				: parseIndexed(form, 'participants')
						.map((p) => ({
							id: newToken(),
							name: p.name ?? '',
							// Hidden input carries the client-generated token; regenerate if absent.
							token: p.token ?? newToken()
						}))
						.filter((p) => p.name !== '');

		const draft = { title, description, locale, pollMode, dates, participants };

		let error: string | null = null;
		if (!title) error = m.errorNoTitle();
		else if (dates.length === 0) error = m.errorNoDates();
		else {
			for (const d of dates) {
				error = validateTimes(d.startTime, d.endTime);
				if (error) break;
			}
		}
		if (error) return fail(400, { error, values: draft });

		const { organizerToken } = await getProvider(platform).createEvent(draft);
		redirect(303, `/e/${organizerToken}`);
	}
} satisfies Actions;
