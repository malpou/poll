import { fail, redirect } from '@sveltejs/kit';
import { getProvider } from '$lib/data/provider';
import { newToken } from '$lib/data/shared';
import { m } from '$lib/paraglide/messages';
import { baseLocale, extractLocaleFromHeader, isLocale } from '$lib/paraglide/runtime';
import { setRequestLocale } from '../hooks.server';
import { field, parseIndexed, validateTimes } from '$lib/forms/forms';
import { richTextIsEmpty, sanitizeRichText } from '$lib/forms/richtext';
import type { Accent, DateOption, Locale, Participant, PollMode, PollType } from '$lib/types';
import { ACCENTS } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

/**
 * Loads the create page, which is the organizer's own, pre-submit: renders it in
 * the browser's preferred locale and pre-selects that in the language picker.
 * Falls back to baseLocale (en) when Accept-Language matches no supported locale.
 */
export const load: PageServerLoad = ({ request }) => {
	const suggestedLocale: Locale = extractLocaleFromHeader(request) ?? baseLocale;
	setRequestLocale(suggestedLocale);
	return { suggestedLocale };
};

export const actions = {
	create: async ({ request, platform }) => {
		const form = await request.formData();
		const title = field(form, 'title');
		const rawDescription = sanitizeRichText(field(form, 'description'));
		const description = richTextIsEmpty(rawDescription) ? '' : rawDescription;
		const localeField = field(form, 'locale');
		const locale: Locale = isLocale(localeField) ? localeField : baseLocale;
		// Trust boundary: only a real IANA zone reaches the DB (no SQL CHECK possible).
		const tzField = field(form, 'timezone');
		const timezone = Intl.supportedValuesOf('timeZone').includes(tzField)
			? tzField
			: 'Europe/Copenhagen';
		const pollMode: PollMode = field(form, 'pollMode') === 'open' ? 'open' : 'assigned';
		// Same discipline as pollMode: anything but the known other value is the default.
		const pollType: PollType = field(form, 'pollType') === 'question' ? 'question' : 'dates';
		// Hidden inputs carry explicit '1'/'0'; absence falls back to the defaults.
		const allowPreferred = field(form, 'allowPreferred') !== '0';
		const allowUnsure = field(form, 'allowUnsure') === '1';
		// Unknown accent falls back to the default, same discipline as locale/timezone.
		const accentField = field(form, 'accent');
		const accent: Accent = (ACCENTS as readonly string[]).includes(accentField)
			? (accentField as Accent)
			: 'yellow';

		// Drop rows the user added but never filled with a date.
		const dates: DateOption[] =
			pollType === 'question'
				? []
				: parseIndexed(form, 'dates')
						.map((d) => ({
							id: newToken(),
							value: d.value ?? '',
							startTime: d.startTime ?? '',
							endTime: d.endTime ?? ''
						}))
						.filter((d) => d.value !== '');

		// Question options: trimmed by field(); blank rows don't count (or post).
		const textOptions: string[] =
			pollType === 'question'
				? parseIndexed(form, 'options')
						.map((o) => o.text ?? '')
						.filter((t) => t !== '')
				: [];

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

		const draft = {
			title,
			description,
			locale,
			timezone,
			pollMode,
			allowPreferred,
			allowUnsure,
			accent,
			pollType,
			dates,
			textOptions,
			participants
		};

		let error: string | null = null;
		if (!title) error = m.errorNoTitle();
		else if (pollType === 'question') {
			if (textOptions.length < 2) error = m.errorTooFewOptions();
		} else if (dates.length === 0) error = m.errorNoDates();
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
