import { test, expect } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import { eventTimezone, seedDateOption, seedEvent, wipeEvent } from '../support/db';

// Event timezone (specs/event-management): every date option's times render in
// the event's stored zone, and the organizer can change it from the header's
// edit form. Seed a New York poll whose option starts 08:00Z - that's 04:00 in
// New York and 10:00 in Copenhagen (September, EDT/CEST).

const EV = 'e2e-tz-ev';
const OTOK = 'e2e-tz-otok';
const OPT = 'e2e-tz-opt';
const TITLE = 'Tz change (e2e)';

const DA_EV = 'e2e-tz-ev-da';
const DA_OTOK = 'e2e-tz-otok-da';

function seed() {
	wipeEvent([EV, DA_EV]);
	seedEvent({
		id: EV,
		title: TITLE,
		organizerToken: OTOK,
		status: 'open',
		timezone: 'America/New_York'
	});
	seedDateOption({ id: OPT, eventId: EV, startsAt: '2026-09-12T08:00:00Z', sortOrder: 0 });

	seedEvent({
		id: DA_EV,
		title: 'Tz på dansk (e2e)',
		organizerToken: DA_OTOK,
		status: 'open',
		locale: 'da',
		timezone: 'America/New_York'
	});
}

test.beforeAll(seed);

test('the organizer picks another timezone and the times convert', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	await expect(page.getByRole('heading', { name: TITLE })).toBeVisible();

	// 08:00Z renders as New York wall-clock, and the header labels the zone
	// with its localized (en event) generic name.
	await expect(page.getByText('America/New_York (Eastern Time)')).toBeVisible();
	await expect(page.getByText(`${m.timeAt()}04:00`).first()).toBeVisible();

	// Change the timezone in the header edit form and save.
	await page.getByRole('button', { name: m.edit() }).first().click();
	const form = page.locator('form[action="?/saveDetails"]');
	await form.locator('select[name="timezone"]').selectOption('Europe/Copenhagen');
	await form.getByRole('button', { name: m.save() }).click();

	// Persisted, and the same instant now renders as Copenhagen wall-clock.
	await expect.poll(() => eventTimezone(EV)).toBe('Europe/Copenhagen');
	await expect(page.getByText(`${m.timeAt()}10:00`).first()).toBeVisible();
	await expect(page.getByText('Europe/Copenhagen (Central European Time)')).toBeVisible();
});

test("the dashboard names the timezone in the event's language", async ({ page }) => {
	await page.goto(`/e/${DA_OTOK}`);
	// da event: the identifier plus the Danish generic zone name.
	await expect(page.getByText('America/New_York (Eastern-tid)')).toBeVisible();
});
