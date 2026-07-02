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
	// The combo box shows the browser's own zone (pinned above); the hidden
	// input carries the IANA id the form will post.
	await expect(page.getByRole('combobox', { name: m.fieldTimezone() })).toHaveValue(
		'America/New_York (Eastern Time)'
	);
	await expect(page.locator('input[name="timezone"]')).toHaveValue('America/New_York');

	await page.getByLabel(m.fieldTitle()).fill('NYC brunch');
	await addDate(page, '2026-09-12');
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	// The dashboard header shows the persisted zone, localized.
	await expect(page.getByText('America/New_York (Eastern Time)')).toBeVisible();
});

test('timezone picker labels follow the picked language', async ({ page }) => {
	await page.goto('/');
	// English browser first: the selected zone shows identifier plus English
	// generic zone name.
	await expect(page.getByRole('combobox', { name: m.fieldTimezone() })).toHaveValue(
		'America/New_York (Eastern Time)'
	);
	// Pick Danish: the same zone re-labels with the Danish zone name, live.
	await page.locator('select#locale').selectOption('da');
	await expect(
		page.getByRole('combobox', { name: m.fieldTimezone({}, { locale: 'da' }) })
	).toHaveValue('America/New_York (Eastern-tid)');
});

test('choosing a timezone by typing creates the event in that zone', async ({ page }) => {
	await page.goto('/');
	await page.getByLabel(m.fieldTitle()).fill('CPH brunch');
	await addDate(page, '2026-09-12');

	// Typing filters the suggestion list; picking a match selects the zone.
	const combo = page.getByRole('combobox', { name: m.fieldTimezone() });
	await combo.fill('Copenhagen');
	await page.getByRole('option', { name: 'Europe/Copenhagen (Central European Time)' }).click();
	await expect(page.locator('input[name="timezone"]')).toHaveValue('Europe/Copenhagen');

	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	// The dashboard header shows the typed-and-picked zone persisted.
	await expect(page.getByText('Europe/Copenhagen (Central European Time)')).toBeVisible();
});

test('text matching no timezone reverts to the previous selection', async ({ page }) => {
	await page.goto('/');
	const combo = page.getByRole('combobox', { name: m.fieldTimezone() });
	await combo.fill('not a real zone');
	// No suggestion matches, so leaving the field falls back to the default.
	await page.keyboard.press('Tab');
	await expect(combo).toHaveValue('America/New_York (Eastern Time)');
	await expect(page.locator('input[name="timezone"]')).toHaveValue('America/New_York');
});
