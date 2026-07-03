import { test, expect, type Page } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import { d1 } from '../support/db';

// The bare /create URL renders in English (language-specific URLs carry the
// other locales). Pin an English browser so bare m.*() assertions (baseLocale =
// en) match the page. The browser timezone is pinned too, for the tz-picker
// default test.
test.use({ locale: 'en-US', timezoneId: 'America/New_York' });

// Candidate dates are toggled in a month calendar that opens on the current
// month, so tests pick a fixed day-of-month and derive the expected ISO date
// from the same clock the browser uses. Each (day, slot) posts as indexed
// dates.{i}.* fields. E2E runs against real D1 (wrangler), so a successful
// submit actually writes rows before redirecting.

function isoFor(day: number) {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
		day
	).padStart(2, '0')}`;
}

// Toggle a day of the visible month; optionally fill the day's first slot times.
async function addDate(page: Page, day: number, startTime = '', endTime = '') {
	await page.getByRole('button', { name: String(day), exact: true }).click();
	if (startTime) await page.locator('input[name="dates.0.startTime"]').fill(startTime);
	if (endTime) await page.locator('input[name="dates.0.endTime"]').fill(endTime);
}

test('valid submit creates an event and redirects to /e/{token}', async ({ page }) => {
	await page.goto('/create');
	await page.getByLabel(m.fieldTitle()).fill('Sommerfest');
	await addDate(page, 12);
	await expect(page.locator('input[name="dates.0.value"]')).toHaveValue(isoFor(12));
	await page.getByRole('button', { name: m.create() }).click();
	// A real /e/{token} only exists because the event row was written (D1-backed).
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
});

test('days are picked from the calendar; toggling again deselects', async ({ page }) => {
	await page.goto('/create');
	// Two toggled days → two selected date options.
	await addDate(page, 12);
	await page.getByRole('button', { name: '14', exact: true }).click();
	await expect(page.locator('input[name="dates.0.value"]')).toHaveValue(isoFor(12));
	await expect(page.locator('input[name="dates.1.value"]')).toHaveValue(isoFor(14));
	// Toggling a selected day off removes it from the list.
	await page.getByRole('button', { name: '14', exact: true }).click();
	await expect(page.locator('input[name="dates.1.value"]')).toHaveCount(0);
	await expect(page.locator('input[name="dates.0.value"]')).toHaveValue(isoFor(12));
});

test('several time slots on one day yield one date option per slot', async ({ page }) => {
	await page.goto('/create');
	await page.getByLabel(m.fieldTitle()).fill('To tider samme dag');
	await addDate(page, 12, '10:00', '11:00');
	// A second slot on the same day posts as its own dates.{i}.* row.
	await page.getByRole('button', { name: m.addTime() }).click();
	await page.locator('input[name="dates.1.startTime"]').fill('14:00');
	await expect(page.locator('input[name="dates.1.value"]')).toHaveValue(isoFor(12));
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	// The created event offers two options, both on the picked day.
	const otok = page.url().split('/').pop() ?? '';
	await expect
		.poll(
			() =>
				d1(
					`SELECT COUNT(*) AS n FROM date_options WHERE event_id =
					 (SELECT id FROM events WHERE organizer_token = '${otok}')`
				).results[0].n as number
		)
		.toBe(2);
});

test('zero date options is rejected with a validation message, no redirect', async ({ page }) => {
	await page.goto('/create');
	await page.getByLabel(m.fieldTitle()).fill('Sommerfest');
	// Toggle no days → zero options server-side.
	await page.getByRole('button', { name: m.create() }).click();
	// exact - the dates hint copy also contains this phrase as a substring.
	await expect(page.getByText(m.errorNoDates(), { exact: true })).toBeVisible();
	await expect(page).toHaveURL(/\/create$/);
});

test('end time without a start time is rejected server-side', async ({ page }) => {
	await page.goto('/create');
	await page.getByLabel(m.fieldTitle()).fill('Sommerfest');
	await addDate(page, 12, '', '11:00');
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page.getByText(m.errorEndNeedsStart())).toBeVisible();
	await expect(page).toHaveURL(/\/create$/);
});

test('end time before start time is rejected server-side', async ({ page }) => {
	await page.goto('/create');
	await page.getByLabel(m.fieldTitle()).fill('Sommerfest');
	await addDate(page, 12, '12:00', '10:00');
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page.getByText(m.errorEndBeforeStart())).toBeVisible();
	await expect(page).toHaveURL(/\/create$/);
});

test('language picker switches the whole form live, no reload', async ({ page }) => {
	await page.goto('/create');
	// en-US browser (see test.use above) → English create page.
	await expect(
		page.getByRole('heading', { name: m.createTitle({}, { locale: 'en' }) })
	).toBeVisible();

	// Switch to Spanish via the language row (radios labeled with each
	// language's own native name): heading, button, and <html lang> all update
	// in place.
	await page.getByRole('radio', { name: 'Español' }).check();
	await expect(
		page.getByRole('heading', { name: m.createTitle({}, { locale: 'es' }) })
	).toBeVisible();
	await expect(page.getByRole('button', { name: m.create({}, { locale: 'es' }) })).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'es');
	// The browser tab follows the picked language too.
	await expect(page).toHaveTitle(
		`${m.createTitle({}, { locale: 'es' })} · ${m.appName({}, { locale: 'es' })}`
	);

	// And on to German: still no reload, but the URL follows shallowly.
	await page.getByRole('radio', { name: 'Deutsch' }).check();
	await expect(
		page.getByRole('heading', { name: m.createTitle({}, { locale: 'de' }) })
	).toBeVisible();
	await expect(page).toHaveURL(/\/de\/create$/);
});

test('picking a language moves the create URL to that language', async ({ page }) => {
	await page.goto('/create');
	await page.getByRole('radio', { name: 'Dansk' }).check();
	await expect(
		page.getByRole('heading', { name: m.createTitle({}, { locale: 'da' }) })
	).toBeVisible();
	await expect(page).toHaveURL(/\/da\/create$/);
});

// --- Requirement: Browser language hint on the create page ---

test.describe('create page language hint', () => {
	test.use({ locale: 'da-DK' });
	const hintText = () => m.createHintUse({ language: 'Dansk' }, { locale: 'da' });

	test('hint applies the browser language to the form without a reload', async ({ page }) => {
		await page.goto('/create');
		await page.evaluate(() => ((window as { __live?: number }).__live = 1));
		await page.getByTestId('lang-hint').getByRole('button', { name: hintText() }).click();
		// The whole form flips to Danish in place; the hint is gone.
		await expect(
			page.getByRole('heading', { name: m.createTitle({}, { locale: 'da' }) })
		).toBeVisible();
		await expect(page.getByRole('radio', { name: 'Dansk' })).toBeChecked();
		await expect(page.getByTestId('lang-hint')).toHaveCount(0);
		expect(await page.evaluate(() => (window as { __live?: number }).__live)).toBe(1);
	});

	test('dismissed create hint stays away for the rest of the visit', async ({ page }) => {
		await page.goto('/create');
		await page
			.getByTestId('lang-hint')
			.getByRole('button', { name: m.landingHintDismiss({}, { locale: 'da' }) })
			.click();
		await expect(page.getByTestId('lang-hint')).toHaveCount(0);
		await page.reload();
		await expect(page.getByRole('heading', { name: m.createTitle() })).toBeVisible();
		await expect(page.getByTestId('lang-hint')).toHaveCount(0);
	});
});

test('timezone picker defaults to the visitor timezone and persists on create', async ({
	page
}) => {
	await page.goto('/create');
	// The combo box shows the browser's own zone (pinned above); the hidden
	// input carries the IANA id the form will post.
	await expect(page.getByRole('combobox', { name: m.fieldTimezone() })).toHaveValue(
		'America/New_York (Eastern Time)'
	);
	await expect(page.locator('input[name="timezone"]')).toHaveValue('America/New_York');

	await page.getByLabel(m.fieldTitle()).fill('NYC brunch');
	await addDate(page, 12);
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	// The dashboard header shows the persisted zone, localized.
	await expect(page.getByText('America/New_York (Eastern Time)')).toBeVisible();
});

test('timezone picker labels follow the picked language', async ({ page }) => {
	await page.goto('/create');
	// English browser first: the selected zone shows identifier plus English
	// generic zone name.
	await expect(page.getByRole('combobox', { name: m.fieldTimezone() })).toHaveValue(
		'America/New_York (Eastern Time)'
	);
	// Pick Danish: the same zone re-labels with the Danish zone name, live.
	await page.getByRole('radio', { name: 'Dansk' }).check();
	await expect(
		page.getByRole('combobox', { name: m.fieldTimezone({}, { locale: 'da' }) })
	).toHaveValue('America/New_York (Eastern-tid)');
});

test('choosing a timezone by typing creates the event in that zone', async ({ page }) => {
	await page.goto('/create');
	await page.getByLabel(m.fieldTitle()).fill('CPH brunch');
	await addDate(page, 12);

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
	await page.goto('/create');
	const combo = page.getByRole('combobox', { name: m.fieldTimezone() });
	await combo.fill('not a real zone');
	// No suggestion matches, so leaving the field falls back to the default.
	await page.keyboard.press('Tab');
	await expect(combo).toHaveValue('America/New_York (Eastern Time)');
	await expect(page.locator('input[name="timezone"]')).toHaveValue('America/New_York');
});

// --- Requirement: Create page language ---

test('create page follows the site language from the URL', async ({ page }) => {
	// Browser is pinned en-US (see test.use above): the URL segment wins.
	await page.goto('/da/create');
	await expect(page.locator('html')).toHaveAttribute('lang', 'da');
	await expect(
		page.getByRole('heading', { name: m.createTitle({}, { locale: 'da' }) })
	).toBeVisible();
	// The poll-language picker defaults to the page language.
	await expect(page.getByRole('radio', { name: 'Dansk' })).toBeChecked();
});

test('bare create URL is English', async ({ page }) => {
	await page.goto('/create');
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page.getByRole('heading', { name: m.createTitle() })).toBeVisible();
	await expect(page.getByRole('radio', { name: 'English' })).toBeChecked();
});

// --- Requirement: Create page highlighter hand-off ---

test('landing highlighter seeds the create form and stays in the URL', async ({ page }) => {
	// The ?accent= carried over from the landing page seeds the picker.
	await page.goto('/create?accent=pink');
	await expect(page.getByRole('radio', { name: m.accentPink() })).toBeChecked();
	await expect(page.locator('form[data-accent="pink"]')).toBeVisible();
	// Picking another keeps the URL in sync, so a reload keeps the choice.
	await page.getByRole('radio', { name: m.accentGreen() }).check();
	await expect(page).toHaveURL(/\/create\?accent=green$/);
});
