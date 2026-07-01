import { test, expect, type Page } from '@playwright/test';
import { da } from '../src/lib/da';
import { responsesFor, seedDateOption, seedEvent, seedInvitee, wipeEvent } from './db';

// The response page needs a seeded invitee link, but no UI surfaces invitee
// tokens yet (that's the iteration-5 dashboard). So we seed local D1 through the
// shared e2e/db.ts helper. Tokens are fixed constants; seeding is
// delete-then-insert so re-runs are idempotent.

// Deterministic fixtures.
const OPEN_TOKEN = 'e2e-open-invitee-token';
const CLOSED_TOKEN = 'e2e-closed-invitee-token';
const EV_OPEN = 'e2e-ev-open';
const EV_CLOSED = 'e2e-ev-closed';
const INV_OPEN = 'e2e-inv-open';
const INV_CLOSED = 'e2e-inv-closed';
const D1 = 'e2e-d1'; // lørdag 12. sep 2026, 10.00–11.00 (local)
const D2 = 'e2e-d2'; // søndag 20. sep 2026
const TITLE = 'Rundvisning i DR Byen (e2e)';

function seed() {
	wipeEvent([EV_OPEN, EV_CLOSED]);
	seedEvent({
		id: EV_OPEN,
		title: TITLE,
		description: 'Vi mødes ved indgangen.',
		organizerToken: 'e2e-otok-open',
		status: 'open'
	});
	seedEvent({ id: EV_CLOSED, title: TITLE, organizerToken: 'e2e-otok-closed', status: 'closed' });
	seedDateOption({
		id: D1,
		eventId: EV_OPEN,
		startsAt: '2026-09-12T08:00:00Z',
		endsAt: '2026-09-12T09:00:00Z',
		sortOrder: 0
	});
	seedDateOption({ id: D2, eventId: EV_OPEN, startsAt: '2026-09-20T09:00:00Z', sortOrder: 1 });
	seedDateOption({
		id: `${D1}-c`,
		eventId: EV_CLOSED,
		startsAt: '2026-09-12T08:00:00Z',
		sortOrder: 0
	});
	seedInvitee({ id: INV_OPEN, eventId: EV_OPEN, label: 'Anna', token: OPEN_TOKEN });
	seedInvitee({ id: INV_CLOSED, eventId: EV_CLOSED, label: 'Bo', token: CLOSED_TOKEN });
}

function responseRows() {
	return responsesFor(INV_OPEN);
}

// Click a preference on a specific date card.
function mark(page: Page, dateId: string, label: string) {
	return page.getByTestId(`date-card-${dateId}`).getByRole('button', { name: label }).click();
}

// The submit button is disabled until every date is answered (mockup rule), so
// tests that intentionally leave a date blank submit the form element directly.
function submitForm(page: Page) {
	return page.locator('form').evaluate((f: HTMLFormElement) => f.requestSubmit());
}

test.beforeAll(seed);

test('valid token shows title, greeting, and every date option', async ({ page }) => {
	await page.goto(`/r/${OPEN_TOKEN}`);
	await expect(page.getByRole('heading', { name: TITLE })).toBeVisible();
	await expect(page.getByText(`${da.greeting} Anna`)).toBeVisible();
	await expect(page.getByTestId(`date-card-${D1}`)).toContainText('lørdag');
	await expect(page.getByTestId(`date-card-${D2}`)).toContainText('søndag');
});

test('invalid token shows the friendly not-found and no event data', async ({ page }) => {
	await page.goto('/r/does-not-exist-token');
	await expect(page.getByText(da.linkNotFound)).toBeVisible();
	await expect(page.getByRole('heading', { name: TITLE })).toHaveCount(0);
});

test('marking options saves the chosen preferences', async ({ page }) => {
	seed(); // isolate from other tests' writes
	await page.goto(`/r/${OPEN_TOKEN}`);
	await mark(page, D1, da.prefPreferred);
	await mark(page, D2, da.prefUnavailable);
	await page.getByRole('button', { name: da.sendAnswer }).click();
	await expect(page.getByText(da.savedSub)).toBeVisible();

	expect(responseRows()).toEqual([
		{ date_option_id: D1, preference: 'preferred' },
		{ date_option_id: D2, preference: 'unavailable' }
	]);
});

test('leaving a date unmarked writes no row for it', async ({ page }) => {
	seed();
	await page.goto(`/r/${OPEN_TOKEN}`);
	await mark(page, D1, da.prefAvailable); // D2 left unmarked
	await submitForm(page);
	await expect(page.getByText(da.savedSub)).toBeVisible();

	// Only the marked date persisted; the unmarked one stays "no answer".
	expect(responseRows()).toEqual([{ date_option_id: D1, preference: 'available' }]);
});

test('note round-trips across a reload', async ({ page }) => {
	seed();
	await page.goto(`/r/${OPEN_TOKEN}`);
	await page.getByLabel(da.noteLabel).fill('Jeg kan ikke om morgenen');
	await mark(page, D1, da.prefPreferred);
	await mark(page, D2, da.prefAvailable);
	await page.getByRole('button', { name: da.sendAnswer }).click();
	await expect(page.getByText(da.savedSub)).toBeVisible();

	await page.reload();
	await expect(page.getByText(da.savedSub)).toBeVisible(); // confirmation shows on revisit
	await expect(page.getByLabel(da.noteLabel)).toHaveValue('Jeg kan ikke om morgenen');
});

test('editing while open replaces the choice in place (still one row)', async ({ page }) => {
	seed();
	await page.goto(`/r/${OPEN_TOKEN}`);
	await mark(page, D1, da.prefPreferred);
	await submitForm(page);
	await expect(page.getByText(da.savedSub)).toBeVisible();

	await page.getByRole('button', { name: da.editAnswer }).click();
	await mark(page, D1, da.prefUnavailable);
	await submitForm(page);
	await expect(page.getByText(da.savedSub)).toBeVisible();

	expect(responseRows()).toEqual([{ date_option_id: D1, preference: 'unavailable' }]);
});

test('closed event renders read-only with the closed banner and no submit', async ({ page }) => {
	await page.goto(`/r/${CLOSED_TOKEN}`);
	await expect(page.getByText(da.closedBanner)).toBeVisible();
	await expect(page.getByRole('button', { name: da.sendAnswer })).toHaveCount(0);
	await expect(page.getByRole('button', { name: da.prefPreferred }).first()).toBeDisabled();
});
