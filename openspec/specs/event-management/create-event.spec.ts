import { test, expect, type Page } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';

// The create page renders in the browser's preferred locale (Accept-Language).
// Pin an English browser so bare m.*() assertions (baseLocale = en) match the
// page. The browser timezone is pinned too, for the tz-picker default test.
test.use({ locale: 'en-US', timezoneId: 'America/New_York' });

// The form starts with no rows; dates are added through the same fill-then-add
// card the dashboard uses (unnamed inputs so they never post with the form).
// E2E runs against real D1 (wrangler), so a successful submit actually writes
// rows before redirecting.

// The add-card's fields are the unnamed ones; row fields carry dates.{i}.* names.
async function addDate(page: Page, value: string, startTime = '', endTime = '') {
	await page.locator('input[type="date"]:not([name])').fill(value);
	if (startTime) await page.locator('input[type="time"]:not([name])').first().fill(startTime);
	if (endTime) await page.locator('input[type="time"]:not([name])').last().fill(endTime);
	await page.getByRole('button', { name: m.addDate() }).click();
}

test('valid submit creates an event and redirects to /e/{token}', async ({ page }) => {
	await page.goto('/');
	await page.getByLabel(m.fieldTitle()).fill('Sommerfest');
	await addDate(page, '2026-09-12');
	await expect(page.locator('input[name="dates.0.value"]')).toHaveValue('2026-09-12');
	await page.getByRole('button', { name: m.create() }).click();
	// A real /e/{token} only exists because the event row was written (D1-backed).
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
});

test('zero date options is rejected with a validation message, no redirect', async ({ page }) => {
	await page.goto('/');
	await page.getByLabel(m.fieldTitle()).fill('Sommerfest');
	// Add no dates → zero options server-side.
	await page.getByRole('button', { name: m.create() }).click();
	// exact - the dates hint copy also contains this phrase as a substring.
	await expect(page.getByText(m.errorNoDates(), { exact: true })).toBeVisible();
	await expect(page).toHaveURL(/\/$/);
});

test('end time without a start time is rejected server-side', async ({ page }) => {
	await page.goto('/');
	await page.getByLabel(m.fieldTitle()).fill('Sommerfest');
	await addDate(page, '2026-09-12', '', '11:00');
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page.getByText(m.errorEndNeedsStart())).toBeVisible();
	await expect(page).toHaveURL(/\/$/);
});

test('end time before start time is rejected server-side', async ({ page }) => {
	await page.goto('/');
	await page.getByLabel(m.fieldTitle()).fill('Sommerfest');
	await addDate(page, '2026-09-12', '12:00', '10:00');
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page.getByText(m.errorEndBeforeStart())).toBeVisible();
	await expect(page).toHaveURL(/\/$/);
});

test('language picker switches the whole form live, no reload', async ({ page }) => {
	await page.goto('/');
	// en-US browser (see test.use above) → English create page.
	await expect(
		page.getByRole('heading', { name: m.createTitle({}, { locale: 'en' }) })
	).toBeVisible();

	// Switch to Spanish: heading, button, and <html lang> all update in place.
	await page.locator('select#locale').selectOption('es');
	await expect(
		page.getByRole('heading', { name: m.createTitle({}, { locale: 'es' }) })
	).toBeVisible();
	await expect(page.getByRole('button', { name: m.create({}, { locale: 'es' }) })).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'es');

	// And on to German, still no navigation (URL stays "/").
	await page.locator('select#locale').selectOption('de');
	await expect(
		page.getByRole('heading', { name: m.createTitle({}, { locale: 'de' }) })
	).toBeVisible();
	await expect(page).toHaveURL(/\/$/);
});

test('timezone picker defaults to the visitor timezone and persists on create', async ({
	page
}) => {
	await page.goto('/');
	// The picker pre-selects the browser's own zone (pinned above).
	await expect(page.locator('select[name="timezone"]')).toHaveValue('America/New_York');

	await page.getByLabel(m.fieldTitle()).fill('NYC brunch');
	await addDate(page, '2026-09-12');
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	// The dashboard header shows the persisted zone, localized.
	await expect(page.getByText('America/New_York (Eastern Time)')).toBeVisible();
});

test('timezone picker labels follow the picked language', async ({ page }) => {
	await page.goto('/');
	const cph = page.locator('select[name="timezone"] option[value="Europe/Copenhagen"]');
	// English browser first: identifier plus English generic zone name.
	await expect(cph).toHaveText('Europe/Copenhagen (Central European Time)');
	// Pick Danish: the same option re-labels with the Danish zone name, live.
	await page.locator('select#locale').selectOption('da');
	await expect(cph).toHaveText('Europe/Copenhagen (Centraleuropæisk tid)');
});
