import { test, expect, type Page } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import { inviteesFor, responsesFor, seedDateOption, seedEvent, wipeEvent } from '../support/db';

// Open mode: one shared /s/{share_token} link. Anyone opening it names themselves
// and submits; each submission becomes an invitee row, so results reuse the same
// machinery as assigned mode. Seeding goes through the shared e2e/db.ts helper.

const SHARE = 'e2e-share-token';
const OTOK = 'e2e-otok-open-mode';
const EV = 'e2e-ev-open-mode';
const D1 = 'e2e-om-d1';
const D2 = 'e2e-om-d2';
const TITLE = 'Åbent link (e2e)';

function seed() {
	wipeEvent(EV);
	seedEvent({
		id: EV,
		title: TITLE,
		organizerToken: OTOK,
		status: 'open',
		pollMode: 'open',
		shareToken: SHARE
	});
	seedDateOption({ id: D1, eventId: EV, startsAt: '2026-09-12T08:00:00Z', sortOrder: 0 });
	seedDateOption({ id: D2, eventId: EV, startsAt: '2026-09-20T09:00:00Z', sortOrder: 1 });
}

function mark(page: Page, dateId: string, label: string) {
	return page.getByTestId(`date-card-${dateId}`).getByRole('button', { name: label }).click();
}

test.beforeEach(seed);

test('unknown or non-open share token shows the friendly not-found', async ({ page }) => {
	await page.goto('/s/does-not-exist');
	await expect(page.getByText(m.linkNotFound())).toBeVisible();
});

test('anyone can submit a name + preferences and gets a personal edit link', async ({ page }) => {
	await page.goto(`/s/${SHARE}`);
	await expect(page.getByRole('heading', { name: TITLE })).toBeVisible();

	await page.getByLabel(m.namePrompt()).fill('Charlie');
	await mark(page, D1, m.prefPreferred());
	await mark(page, D2, m.prefAvailable());
	await page.getByRole('button', { name: m.sendAnswer() }).click();

	await expect(page.getByText(m.savedSub())).toBeVisible();
	// Personal edit link is shown for the submitter to save.
	await expect(page.getByText(m.editLinkTitle())).toBeVisible();

	const invitees = inviteesFor(EV);
	expect(invitees).toHaveLength(1);
	expect(invitees[0].label).toBe('Charlie');
	expect(responsesFor(invitees[0].id)).toEqual([
		{ date_option_id: D1, preference: 'preferred' },
		{ date_option_id: D2, preference: 'available' }
	]);
});

test('revisiting the share link edits the same answer, no duplicate invitee', async ({ page }) => {
	await page.goto(`/s/${SHARE}`);
	await page.getByLabel(m.namePrompt()).fill('Dana');
	await mark(page, D1, m.prefPreferred());
	await mark(page, D2, m.prefUnavailable());
	await page.getByRole('button', { name: m.sendAnswer() }).click();
	await expect(page.getByText(m.savedSub())).toBeVisible();

	const [me] = inviteesFor(EV);

	// The cookie from the first submit redirects the share link to /r/{token}.
	await page.goto(`/s/${SHARE}`);
	await expect(page).toHaveURL(new RegExp(`/r/${me.token}$`));
	await expect(page.getByText(m.greeting({ name: 'Dana' }))).toBeVisible();

	// Edit in place - still one invitee, updated preference.
	await page.getByRole('button', { name: m.editAnswer() }).click();
	await mark(page, D1, m.prefUnavailable());
	await page.locator('form').evaluate((f: HTMLFormElement) => f.requestSubmit());
	await expect(page.getByText(m.savedSub())).toBeVisible();

	expect(inviteesFor(EV)).toHaveLength(1);
	expect(responsesFor(me.id)).toEqual([
		{ date_option_id: D1, preference: 'unavailable' },
		{ date_option_id: D2, preference: 'unavailable' }
	]);
});
