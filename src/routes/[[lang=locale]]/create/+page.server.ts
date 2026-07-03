import { fail, redirect } from '@sveltejs/kit';
import { getProvider } from '$lib/data/provider';
import { newToken } from '$lib/data/shared';
import { m } from '$lib/paraglide/messages';
import { baseLocale, extractLocaleFromHeader, isLocale } from '$lib/paraglide/runtime';
import { field, parseIndexed, validateTimes } from '$lib/forms/forms';
import { richTextIsEmpty, sanitizeRichText } from '$lib/forms/richtext';
import type { Accent, DateOption, Locale, Participant, PollMode, PollType } from '$lib/types';
import {
	ACCENTS,
	HIGHLIGHT_BUDGET_DEFAULT,
	HIGHLIGHT_BUDGET_MAX,
	HIGHLIGHT_BUDGET_MIN,
	isTextPollType,
	POLL_TYPES
} from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

/**
 * Loads the create page. The page chrome renders in the URL's language segment
 * (bare /create is English; the server hook seeds the request locale from the
 * segment) and the poll-language picker defaults to that same language. The
 * highlighter picker defaults to the ?accent= the landing page carried over.
 */
export const load: PageServerLoad = ({ params, request, url }) => {
	const suggestedLocale: Locale = isLocale(params.lang) ? params.lang : baseLocale;
	const accentParam = url.searchParams.get('accent') ?? '';
	const suggestedAccent: Accent = (ACCENTS as readonly string[]).includes(accentParam)
		? (accentParam as Accent)
		: 'yellow';
	// The browser-language hint, same offer as the landing page: never a
	// redirect, only set when the preference differs from the form's language.
	const browserLocale = extractLocaleFromHeader(request);
	return {
		suggestedLocale,
		suggestedAccent,
		hintLocale: browserLocale && browserLocale !== suggestedLocale ? browserLocale : null
	};
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
		// Same discipline as pollMode: anything but a known value is the default.
		const typeField = field(form, 'pollType');
		const pollType: PollType = (POLL_TYPES as readonly string[]).includes(typeField)
			? (typeField as PollType)
			: 'dates';
		// Hidden inputs carry explicit '1'/'0'; absence falls back to the defaults.
		// RSVP is strictly yes/no and rank/highlight answer by value, not
		// preference - all three force both toggles off regardless of the form.
		const noToggles = pollType === 'rsvp' || pollType === 'rank' || pollType === 'highlight';
		const allowPreferred = !noToggles && field(form, 'allowPreferred') !== '0';
		const allowUnsure = !noToggles && field(form, 'allowUnsure') === '1';
		// Highlight stroke budget: rejected below when out of range (unlike accent,
		// which falls back - the budget is a deliberate creator choice).
		const budgetField = field(form, 'highlightBudget');
		const highlightBudget =
			pollType === 'highlight' && budgetField !== ''
				? Number(budgetField)
				: HIGHLIGHT_BUDGET_DEFAULT;
		// Unknown accent falls back to the default, same discipline as locale/timezone.
		const accentField = field(form, 'accent');
		const accent: Accent = (ACCENTS as readonly string[]).includes(accentField)
			? (accentField as Accent)
			: 'yellow';

		// Drop rows the user added but never filled with a date.
		const dates: DateOption[] = isTextPollType(pollType)
			? []
			: parseIndexed(form, 'dates')
					.map((d) => ({
						id: newToken(),
						value: d.value ?? '',
						startTime: d.startTime ?? '',
						endTime: d.endTime ?? ''
					}))
					.filter((d) => d.value !== '');

		// Text options: trimmed by field(); blank rows don't count (or post).
		const textOptions: string[] = isTextPollType(pollType)
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
			highlightBudget,
			dates,
			textOptions,
			participants
		};

		let error: string | null = null;
		if (!title) error = m.errorNoTitle();
		else if (
			pollType === 'highlight' &&
			(!Number.isInteger(highlightBudget) ||
				highlightBudget < HIGHLIGHT_BUDGET_MIN ||
				highlightBudget > HIGHLIGHT_BUDGET_MAX)
		)
			error = m.errorBudgetRange();
		else if (isTextPollType(pollType)) {
			if (textOptions.length < 2) error = m.errorTooFewOptions();
		} else if (pollType === 'rsvp' && dates.length !== 1) error = m.errorRsvpOneDate();
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
