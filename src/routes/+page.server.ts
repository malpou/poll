import { fail, redirect } from '@sveltejs/kit';
import { getProvider } from '$lib/data/provider';
import { newToken } from '$lib/data/shared';
import { da } from '$lib/da';
import { field, validateTimes } from '$lib/forms';
import type { DateOption, Participant } from '$lib/types';
import type { Actions } from './$types';

type Row = Partial<Record<string, string>>;

// Rebuild the dates/participants arrays from indexed named inputs
// (`dates.0.value`, `participants.1.token`, ...). Only string fields are read.
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
		const description = field(form, 'description');

		// Drop rows the user added but never filled with a date.
		const dates: DateOption[] = parseIndexed(form, 'dates')
			.map((d) => ({
				id: newToken(),
				value: d.value ?? '',
				startTime: d.startTime ?? '',
				endTime: d.endTime ?? ''
			}))
			.filter((d) => d.value !== '');

		const participants: Participant[] = parseIndexed(form, 'participants')
			.map((p) => ({
				id: newToken(),
				name: p.name ?? '',
				// Hidden input carries the client-generated token; regenerate if absent.
				token: p.token ?? newToken()
			}))
			.filter((p) => p.name !== '');

		const draft = { title, description, dates, participants };

		let error: string | null = null;
		if (!title) error = da.errorNoTitle;
		else if (dates.length === 0) error = da.errorNoDates;
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
