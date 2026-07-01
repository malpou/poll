import { test, expect } from '@playwright/test';
import { m } from '../src/lib/paraglide/messages';
import { seedDateOption, seedEvent, seedInvitee, wipeEvent } from './db';

// A poll stores one locale (same for every consumer, resolved server-side from
// the event, not the browser). Seed a French poll and confirm both the response
// page copy and the French date labels render, regardless of browser language.

const FR_EVENT = 'e2e-ev-fr';
const FR_INVITEE = 'e2e-inv-fr';
const FR_TOKEN = 'e2e-fr-invitee-token';
const FR_D1 = 'e2e-fr-d1'; // 2026-09-12 08:00Z → samedi 12 septembre 2026, à 10:00 local

function seed() {
	wipeEvent(FR_EVENT);
	seedEvent({
		id: FR_EVENT,
		title: 'Visite guidée (e2e)',
		organizerToken: 'e2e-otok-fr',
		status: 'open',
		locale: 'fr'
	});
	seedDateOption({
		id: FR_D1,
		eventId: FR_EVENT,
		startsAt: '2026-09-12T08:00:00Z',
		endsAt: '2026-09-12T09:00:00Z',
		sortOrder: 0
	});
	seedInvitee({ id: FR_INVITEE, eventId: FR_EVENT, label: 'Marie', token: FR_TOKEN });
}

test.beforeAll(seed);

// Force a non-French browser to prove the poll locale wins over Accept-Language.
test.use({ locale: 'en-US' });

test('French poll renders the response page and dates in French', async ({ page }) => {
	await page.goto(`/r/${FR_TOKEN}`);

	// Personal greeting + intro in French.
	await expect(page.getByText(m.greeting({ name: 'Marie' }, { locale: 'fr' }))).toBeVisible();
	await expect(page.getByText(m.responseIntro({}, { locale: 'fr' }))).toBeVisible();

	// Preference labels in French.
	await expect(
		page.getByRole('button', { name: m.prefPreferred({}, { locale: 'fr' }) })
	).toBeVisible();

	// Date label localised: weekday "samedi", month "septembre", prefix "à".
	const card = page.getByTestId(`date-card-${FR_D1}`);
	await expect(card).toContainText('samedi');
	await expect(card).toContainText('septembre');
	await expect(card).toContainText('à 10:00');

	// <html lang> reflects the poll locale.
	await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
});
