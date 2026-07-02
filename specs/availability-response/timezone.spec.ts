import { test, expect } from '@playwright/test';
import { m } from '../../src/lib/paraglide/messages';
import { seedDateOption, seedEvent, seedInvitee, wipeEvent } from '../support/db';

// Times shown in the event's timezone (specs/availability-response): the
// respondent sees the event's wall-clock regardless of their own browser zone,
// and the page names that zone - but only when an option actually has a time.

const EV = 'e2e-rtz-ev';
const OTOK = 'e2e-rtz-otok';
const OPT = 'e2e-rtz-opt';
const INV = 'e2e-rtz-inv';
const RTOK = 'e2e-rtz-rtok';

const DATEONLY_EV = 'e2e-rtz-ev2';
const DATEONLY_OPT = 'e2e-rtz-opt2';
const DATEONLY_INV = 'e2e-rtz-inv2';
const DATEONLY_RTOK = 'e2e-rtz-rtok2';

function seed() {
	wipeEvent([EV, DATEONLY_EV]);
	seedEvent({
		id: EV,
		title: 'NY times (e2e)',
		organizerToken: OTOK,
		status: 'open',
		timezone: 'America/New_York'
	});
	// 08:00Z = 04:00 in New York (September, EDT).
	seedDateOption({ id: OPT, eventId: EV, startsAt: '2026-09-12T08:00:00Z', sortOrder: 0 });
	seedInvitee({ id: INV, eventId: EV, label: 'Nora', token: RTOK });

	seedEvent({
		id: DATEONLY_EV,
		title: 'Date only (e2e)',
		organizerToken: 'e2e-rtz-otok2',
		status: 'open',
		timezone: 'America/New_York'
	});
	// Date-only options are anchored at local midnight (00:00 EDT = 04:00Z).
	seedDateOption({
		id: DATEONLY_OPT,
		eventId: DATEONLY_EV,
		startsAt: '2026-09-12T04:00:00Z',
		sortOrder: 0
	});
	seedInvitee({ id: DATEONLY_INV, eventId: DATEONLY_EV, label: 'Otto', token: DATEONLY_RTOK });
}

test.beforeAll(seed);

// A non-US browser zone proves the event's zone wins over the visitor's.
test.use({ timezoneId: 'Europe/Copenhagen' });

test('a respondent in another timezone sees the event-zone time and its name', async ({ page }) => {
	await page.goto(`/r/${RTOK}`);
	const card = page.getByTestId(`date-card-${OPT}`);
	await expect(card).toContainText(`${m.timeAt()}04:00`);
	await expect(page.getByText(m.timezoneNote({ timezone: 'America/New_York' }))).toBeVisible();
});

test('a date-only poll shows no timezone note', async ({ page }) => {
	await page.goto(`/r/${DATEONLY_RTOK}`);
	await expect(page.getByText(m.greeting({ name: 'Otto' }))).toBeVisible();
	await expect(page.getByText(m.timezoneNote({ timezone: 'America/New_York' }))).toHaveCount(0);
});
