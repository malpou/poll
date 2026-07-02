import { test, expect, type Page } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import { responsesFor, seedDateOption, seedEvent, seedInvitee, wipeEvent } from '../support/db';

// The offered choices follow the event's configuration (specs/
// availability-response): unsure counts as an answer, disabled choices are
// rejected server-side. Fixed e2e-avch-* tokens; seeding is delete-then-insert.

const RTOK = 'e2e-avch-rtok';
const EV = 'e2e-avch-ev';
const INV = 'e2e-avch-inv';
const D1 = 'e2e-avch-d1';
const D2 = 'e2e-avch-d2';

function seed(flags: { allowPreferred?: boolean; allowUnsure?: boolean } = {}) {
	wipeEvent(EV);
	seedEvent({
		id: EV,
		title: 'Svarmuligheder (e2e)',
		organizerToken: 'e2e-avch-otok',
		status: 'open',
		...flags
	});
	seedDateOption({ id: D1, eventId: EV, startsAt: '2026-09-12T08:00:00Z', sortOrder: 0 });
	seedDateOption({ id: D2, eventId: EV, startsAt: '2026-09-20T08:00:00Z', sortOrder: 1 });
	seedInvitee({ id: INV, eventId: EV, label: 'Anna', token: RTOK });
}

function mark(page: Page, dateId: string, label: string) {
	return page.getByTestId(`date-card-${dateId}`).getByRole('button', { name: label }).click();
}

test("only the event's enabled choices are offered on the response page", async ({ page }) => {
	seed({ allowPreferred: false, allowUnsure: true });
	await page.goto(`/r/${RTOK}`);
	const card = page.getByTestId(`date-card-${D1}`);
	await expect(card.getByRole('button', { name: m.prefAvailable() })).toBeVisible();
	await expect(card.getByRole('button', { name: m.prefUnavailable() })).toBeVisible();
	await expect(card.getByRole('button', { name: m.prefUnsure() })).toBeVisible();
	await expect(card.getByRole('button', { name: m.prefPreferred() })).toHaveCount(0);
});

test('"I don\'t know" satisfies the answer-every-date submit gate and saves like any other', async ({
	page
}) => {
	seed({ allowUnsure: true });
	await page.goto(`/r/${RTOK}`);
	await mark(page, D1, m.prefUnsure());
	// One date still unanswered → gate holds.
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toBeDisabled();
	await mark(page, D2, m.prefAvailable());
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toBeEnabled();
	await page.getByRole('button', { name: m.sendAnswer() }).click();
	await expect(page.getByText(m.savedSub())).toBeVisible();

	expect(responsesFor(INV)).toEqual([
		{ date_option_id: D1, preference: 'unsure' },
		{ date_option_id: D2, preference: 'available' }
	]);
});

test('a crafted submission with a choice the event does not offer stores nothing for it', async ({
	page
}) => {
	seed(); // unsure NOT enabled
	// Bypass the UI entirely - a crafted form POST straight to the action.
	// Same-origin header so SvelteKit's CSRF check lets the action run.
	const base = test.info().project.use.baseURL ?? '';
	await page.request.post(`/r/${RTOK}?/save`, {
		headers: { origin: base },
		form: { [`pref.${D1}`]: 'unsure', [`pref.${D2}`]: 'available', note: '' }
	});
	// The disabled choice was rejected; the valid one saved.
	await expect
		.poll(() => responsesFor(INV))
		.toEqual([{ date_option_id: D2, preference: 'available' }]);
});
