import { test, expect, type Page } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import {
	eventChoices,
	responsesFor,
	seedDateOption,
	seedEvent,
	seedInvitee,
	seedResponse,
	wipeEvent
} from '../support/db';

// Configurable response choices (specs/event-management): Preferred and
// "I don't know" toggles at creation and while open; disabling folds recorded
// answers into the fixed pair. Seeds local D1 through the shared
// specs/support/db.ts helper; fixed e2e-choice-* tokens, delete-then-insert.

test.use({ locale: 'en-US' });

const OTOK = 'e2e-choice-otok';
const RTOK = 'e2e-choice-rtok';
const EV = 'e2e-choice-ev';
const INV = 'e2e-choice-inv';
const OPT = 'e2e-choice-opt';

function seed(flags: { allowPreferred?: boolean; allowUnsure?: boolean } = {}) {
	wipeEvent(EV);
	seedEvent({
		id: EV,
		title: 'Valgmuligheder (e2e)',
		organizerToken: OTOK,
		status: 'open',
		...flags
	});
	seedDateOption({ id: OPT, eventId: EV, startsAt: '2026-09-12T08:00:00Z', sortOrder: 0 });
	seedInvitee({ id: INV, eventId: EV, label: 'Anna', token: RTOK });
}

// Toggle a day of the visible (current) month in the create page's calendar.
async function addDate(page: Page, day = 12) {
	await page.getByRole('button', { name: String(day), exact: true }).click();
}

// Open the dashboard's edit form and return its locator.
async function openEdit(page: Page) {
	await page.getByRole('button', { name: m.edit() }).first().click();
	return page.locator('form[action="?/saveDetails"]');
}

test('creating without touching the choice settings offers Preferred but not "I don\'t know"', async ({
	page
}) => {
	await page.goto('/create');
	await page.getByLabel(m.fieldTitle()).fill('Standardvalg');
	await addDate(page);
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	// The result bars render one row per offered choice.
	await expect(page.getByText(m.prefPreferred()).first()).toBeVisible();
	await expect(page.getByText(m.prefUnsure())).toHaveCount(0);
});

test('enabling "I don\'t know" at creation offers all four choices', async ({ page }) => {
	await page.goto('/create');
	await page.getByLabel(m.fieldTitle()).fill('Med ved-ikke');
	await addDate(page);
	await page.getByRole('checkbox', { name: m.prefUnsure() }).check();
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	await expect(page.getByText(m.prefPreferred()).first()).toBeVisible();
	await expect(page.getByText(m.prefUnsure()).first()).toBeVisible();
});

test('disabling Preferred while open folds its recorded votes to Available', async ({ page }) => {
	seed();
	seedResponse({ inviteeId: INV, dateOptionId: OPT, preference: 'preferred' });
	await page.goto(`/e/${OTOK}`);
	const form = await openEdit(page);
	await form.getByRole('checkbox', { name: m.prefPreferred() }).uncheck();
	await form.getByRole('button', { name: m.save() }).click();

	// The recorded answer folded to available and the flag persisted.
	await expect
		.poll(() => responsesFor(INV))
		.toEqual([{ date_option_id: OPT, preference: 'available' }]);
	expect(eventChoices(EV).allowPreferred).toBe(false);

	// Response pages stop offering Preferred; the fold keeps counting in results.
	await page.goto(`/r/${RTOK}`);
	await expect(page.getByRole('button', { name: m.prefAvailable() })).toBeVisible();
	await expect(page.getByRole('button', { name: m.prefPreferred() })).toHaveCount(0);
});

test('disabling "I don\'t know" while open folds its recorded votes to Unavailable', async ({
	page
}) => {
	seed({ allowUnsure: true });
	seedResponse({ inviteeId: INV, dateOptionId: OPT, preference: 'unsure' });
	await page.goto(`/e/${OTOK}`);
	const form = await openEdit(page);
	await form.getByRole('checkbox', { name: m.prefUnsure() }).uncheck();
	await form.getByRole('button', { name: m.save() }).click();

	await expect
		.poll(() => responsesFor(INV))
		.toEqual([{ date_option_id: OPT, preference: 'unavailable' }]);
	expect(eventChoices(EV).allowUnsure).toBe(false);

	await page.goto(`/r/${RTOK}`);
	await expect(page.getByRole('button', { name: m.prefUnavailable() })).toBeVisible();
	await expect(page.getByRole('button', { name: m.prefUnsure() })).toHaveCount(0);
});

test('enabling "I don\'t know" on an existing event offers it and keeps recorded answers', async ({
	page
}) => {
	seed();
	seedResponse({ inviteeId: INV, dateOptionId: OPT, preference: 'available' });
	await page.goto(`/e/${OTOK}`);
	const form = await openEdit(page);
	await form.getByRole('checkbox', { name: m.prefUnsure() }).check();
	await form.getByRole('button', { name: m.save() }).click();

	await expect.poll(() => eventChoices(EV).allowUnsure).toBe(true);
	// Every recorded answer is unchanged.
	expect(responsesFor(INV)).toEqual([{ date_option_id: OPT, preference: 'available' }]);

	await page.goto(`/r/${RTOK}`);
	await expect(page.getByRole('button', { name: m.prefUnsure() })).toBeVisible();
});

test('Available and Unavailable are never offered as toggles', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	const form = await openEdit(page);
	// Exactly the two optional choices are toggleable; yes/no are fixed.
	await expect(form.getByRole('checkbox', { name: m.prefPreferred() })).toBeVisible();
	await expect(form.getByRole('checkbox', { name: m.prefUnsure() })).toBeVisible();
	await expect(form.getByRole('checkbox', { name: m.prefAvailable() })).toHaveCount(0);
	await expect(form.getByRole('checkbox', { name: m.prefUnavailable() })).toHaveCount(0);
	await expect(form.getByRole('checkbox')).toHaveCount(2);
});
