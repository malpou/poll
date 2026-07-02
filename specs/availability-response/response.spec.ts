import { test, expect, type Page } from '@playwright/test';
import { m } from '../../src/lib/paraglide/messages';
import {
	responsesFor,
	seedDateOption,
	seedEvent,
	seedInvitee,
	seedResponse,
	wipeEvent
} from '../support/db';

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
	await expect(page.getByText(m.greeting({ name: 'Anna' }))).toBeVisible();
	await expect(page.getByTestId(`date-card-${D1}`)).toContainText('lørdag');
	await expect(page.getByTestId(`date-card-${D2}`)).toContainText('søndag');
});

test('invalid token shows the friendly not-found and no event data', async ({ page }) => {
	await page.goto('/r/does-not-exist-token');
	await expect(page.getByText(m.linkNotFound())).toBeVisible();
	await expect(page.getByRole('heading', { name: TITLE })).toHaveCount(0);
});

test('marking options saves the chosen preferences', async ({ page }) => {
	seed(); // isolate from other tests' writes
	await page.goto(`/r/${OPEN_TOKEN}`);
	await mark(page, D1, m.prefPreferred());
	await mark(page, D2, m.prefUnavailable());
	await page.getByRole('button', { name: m.sendAnswer() }).click();
	await expect(page.getByText(m.savedSub())).toBeVisible();

	expect(responseRows()).toEqual([
		{ date_option_id: D1, preference: 'preferred' },
		{ date_option_id: D2, preference: 'unavailable' }
	]);
});

test('leaving a date unmarked writes no row for it', async ({ page }) => {
	seed();
	await page.goto(`/r/${OPEN_TOKEN}`);
	await mark(page, D1, m.prefAvailable()); // D2 left unmarked
	await submitForm(page);
	await expect(page.getByText(m.savedSub())).toBeVisible();

	// Only the marked date persisted; the unmarked one stays "no answer".
	expect(responseRows()).toEqual([{ date_option_id: D1, preference: 'available' }]);
});

test('note round-trips across a reload', async ({ page }) => {
	seed();
	await page.goto(`/r/${OPEN_TOKEN}`);
	await page.getByLabel(m.noteLabel()).fill('Jeg kan ikke om morgenen');
	await mark(page, D1, m.prefPreferred());
	await mark(page, D2, m.prefAvailable());
	await page.getByRole('button', { name: m.sendAnswer() }).click();
	await expect(page.getByText(m.savedSub())).toBeVisible();

	await page.reload();
	await expect(page.getByText(m.savedSub())).toBeVisible(); // confirmation shows on revisit
	await expect(page.getByLabel(m.noteLabel())).toHaveValue('Jeg kan ikke om morgenen');
});

test('editing while open replaces the choice in place (still one row)', async ({ page }) => {
	seed();
	await page.goto(`/r/${OPEN_TOKEN}`);
	await mark(page, D1, m.prefPreferred());
	await submitForm(page);
	await expect(page.getByText(m.savedSub())).toBeVisible();

	await page.getByRole('button', { name: m.editAnswer() }).click();
	await mark(page, D1, m.prefUnavailable());
	await submitForm(page);
	await expect(page.getByText(m.savedSub())).toBeVisible();

	expect(responseRows()).toEqual([{ date_option_id: D1, preference: 'unavailable' }]);
});

test('closed event renders read-only with the closed banner and no submit', async ({ page }) => {
	await page.goto(`/r/${CLOSED_TOKEN}`);
	await expect(page.getByText(m.closedBanner())).toBeVisible();
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toHaveCount(0);
	await expect(page.getByRole('button', { name: m.prefPreferred() }).first()).toBeDisabled();
});

// --- Dates added after the invitee answered (chase-up flow). ---

test('a date added after answering is flagged, sorted first, and editable', async ({ page }) => {
	seed();
	// Anna answered D1 while it was the only date; D2 arrived later.
	seedResponse({ inviteeId: INV_OPEN, dateOptionId: D1, preference: 'preferred' });
	await page.goto(`/r/${OPEN_TOKEN}`);

	await expect(page.getByText(m.newDatesBanner())).toBeVisible();
	// Straight into editing - no saved-state bar to click through.
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toBeVisible();
	await expect(page.getByRole('button', { name: m.editAnswer() })).toHaveCount(0);
	// Only the unanswered date carries the badge, and it renders first.
	await expect(page.getByTestId(`date-card-${D2}`).getByText(m.newDateBadge())).toBeVisible();
	await expect(page.getByTestId(`date-card-${D1}`).getByText(m.newDateBadge())).toHaveCount(0);
	const cards = page.locator('[data-testid^="date-card-"]');
	await expect(cards.first()).toHaveAttribute('data-testid', `date-card-${D2}`);

	// Answering the new date clears the chase-up on the next visit.
	await mark(page, D2, m.prefAvailable());
	await page.getByRole('button', { name: m.sendAnswer() }).click();
	await expect(page.getByText(m.savedSub())).toBeVisible();
	await page.reload();
	await expect(page.getByText(m.newDatesBanner())).toHaveCount(0);
	await expect(cards.first()).toHaveAttribute('data-testid', `date-card-${D1}`);
});

test('a closed poll never flags or reorders unanswered dates', async ({ page }) => {
	seed();
	seedDateOption({
		id: `${D2}-c`,
		eventId: EV_CLOSED,
		startsAt: '2026-09-20T09:00:00Z',
		sortOrder: 1
	});
	seedResponse({ inviteeId: INV_CLOSED, dateOptionId: `${D1}-c`, preference: 'available' });
	await page.goto(`/r/${CLOSED_TOKEN}`);

	await expect(page.getByText(m.closedBanner())).toBeVisible();
	await expect(page.getByText(m.newDatesBanner())).toHaveCount(0);
	await expect(page.getByText(m.newDateBadge())).toHaveCount(0);
	// Original sort order kept.
	const cards = page.locator('[data-testid^="date-card-"]');
	await expect(cards.first()).toHaveAttribute('data-testid', `date-card-${D1}-c`);
});
