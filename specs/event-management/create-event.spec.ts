import { test, expect, type Page } from '@playwright/test';
import { m } from '../../src/lib/paraglide/messages';

// The create page renders in the browser's preferred locale (Accept-Language).
// Pin a Danish browser so the m.*() assertions (baseLocale = da) match the page.
test.use({ locale: 'da-DK' });

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
	// da-DK browser (see test.use above) → Danish create page.
	await expect(
		page.getByRole('heading', { name: m.createTitle({}, { locale: 'da' }) })
	).toBeVisible();

	// Switch to French: heading, button, and <html lang> all update in place.
	await page.locator('select#locale').selectOption('fr');
	await expect(
		page.getByRole('heading', { name: m.createTitle({}, { locale: 'fr' }) })
	).toBeVisible();
	await expect(page.getByRole('button', { name: m.create({}, { locale: 'fr' }) })).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

	// And back to English, still no navigation (URL stays "/").
	await page.locator('select#locale').selectOption('en');
	await expect(
		page.getByRole('heading', { name: m.createTitle({}, { locale: 'en' }) })
	).toBeVisible();
	await expect(page).toHaveURL(/\/$/);
});
