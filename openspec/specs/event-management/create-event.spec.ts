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

// The question type's fill-then-add option list: the add row is the last input.
async function addTextOption(page: Page, text: string) {
	await page.getByPlaceholder(m.optionPlaceholder()).last().fill(text);
	await page.getByRole('button', { name: m.addOption() }).click();
}

// The collapsed timezone note's change affordance reveals the combo box.
async function revealTimezone(page: Page) {
	await page.getByRole('button', { name: m.timezoneChange() }).click();
	return page.getByRole('combobox', { name: m.fieldTimezone() });
}

// The client gate disables the submit button on an invalid form; fire the
// form's own submit to prove the server safety net still rejects it. Returns
// SvelteKit's ActionResult (enhance POSTs get HTTP 200; the failure status
// travels in the JSON body).
async function forceSubmit(page: Page) {
	const [res] = await Promise.all([
		page.waitForResponse((r) => r.request().method() === 'POST'),
		page.evaluate(() => document.querySelector('form')?.requestSubmit())
	]);
	return res.json() as Promise<{ type: string; status: number }>;
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

test('a submission with zero date options reaching the server is rejected', async ({ page }) => {
	await page.goto('/create');
	await page.getByLabel(m.fieldTitle()).fill('Sommerfest');
	// Toggle no days → zero options; the gate blocks the button, so force the
	// POST through to the server.
	expect(await forceSubmit(page)).toMatchObject({ type: 'failure', status: 400 });
	// exact - the dates hint copy also contains this phrase as a substring;
	// first - the gating caption shows the same message as the server error.
	await expect(page.getByText(m.errorNoDates(), { exact: true }).first()).toBeVisible();
	await expect(page).toHaveURL(/\/create$/);
});

test('the poll type leads the form and shows a single explainer', async ({ page }) => {
	await page.goto('/create');
	// The type choice appears before every other field.
	const typeBeforeTitle = await page.evaluate(() => {
		const type = document.querySelector('input[name="pollType"]');
		const title = document.querySelector('input[name="title"]');
		return Boolean(
			type && title && type.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING
		);
	});
	expect(typeBeforeTitle).toBe(true);
	// Exactly one explainer for the picked type - the hint under the type
	// choice; no separate intro paragraph repeats it.
	await expect(page.getByText(m.pollTypeDatesHint())).toHaveCount(1);
	await page.getByRole('radio', { name: m.pollTypeRsvp() }).check();
	await expect(page.getByText(m.pollTypeRsvpHint())).toHaveCount(1);
	await expect(page.getByText(m.pollTypeDatesHint())).toHaveCount(0);
});

test('creating without touching the poll mode yields an open poll', async ({ page }) => {
	await page.goto('/create');
	await page.getByLabel(m.fieldTitle()).fill('Åben som standard');
	await addDate(page, 12);
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	const otok = page.url().split('/').pop() ?? '';
	await expect
		.poll(
			() =>
				d1(`SELECT poll_mode FROM events WHERE organizer_token = '${otok}'`).results[0]
					?.poll_mode as string
		)
		.toBe('open');
	// Open-mode dashboards lead with the shared link to hand out.
	await expect(page.getByText(m.shareLinkTitle())).toBeVisible();
});

test('assigned mode records the invitees added at creation', async ({ page }) => {
	await page.goto('/create');
	await page.getByLabel(m.fieldTitle()).fill('Navngivne folk');
	await addDate(page, 12);
	// Named people is the opt-in alternative to the open default.
	await page.getByRole('radio', { name: m.modeAssigned() }).check();
	await page.getByPlaceholder(m.name()).fill('Anna');
	await page.getByRole('button', { name: m.addParticipant() }).click();
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	const otok = page.url().split('/').pop() ?? '';
	await expect
		.poll(
			() =>
				d1(
					`SELECT COUNT(*) AS n FROM invitees WHERE event_id =
					 (SELECT id FROM events WHERE organizer_token = '${otok}')`
				).results[0].n as number
		)
		.toBe(1);
	await expect(page.getByText('Anna').first()).toBeVisible();
});

test('submit is disabled until the form is valid, naming the first missing thing', async ({
	page
}) => {
	await page.goto('/create');
	const submit = page.getByRole('button', { name: m.create() });
	await expect(submit).toBeDisabled();
	await expect(page.getByText(m.errorNoTitle(), { exact: true })).toBeVisible();
	await page.getByLabel(m.fieldTitle()).fill('Snart gyldig');
	await expect(submit).toBeDisabled();
	// exact - the dates hint copy also contains this phrase as a substring.
	await expect(page.getByText(m.errorNoDates(), { exact: true })).toBeVisible();
	await addDate(page, 12);
	await expect(submit).toBeEnabled();
	await expect(page.getByText(m.errorNoDates(), { exact: true })).toHaveCount(0);
});

test('the submit gate follows the picked poll type', async ({ page }) => {
	await page.goto('/create');
	const submit = page.getByRole('button', { name: m.create() });
	await page.getByLabel(m.fieldTitle()).fill('Skiftende type');
	await addDate(page, 12);
	await expect(submit).toBeEnabled();
	// Switching to a question poll with no options re-disables the submit.
	await page.getByRole('radio', { name: m.pollTypeQuestion() }).check();
	await expect(submit).toBeDisabled();
	await expect(page.getByText(m.errorTooFewOptions(), { exact: true })).toBeVisible();
	await addTextOption(page, 'Pizza');
	await expect(submit).toBeDisabled();
	await addTextOption(page, 'Sushi');
	await expect(submit).toBeEnabled();
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

test('the timezone starts collapsed on the visitor zone and persists on create', async ({
	page
}) => {
	await page.goto('/create');
	// No picker on load - only a note naming the browser's own zone (pinned
	// above) as pre-picked; the hidden input still carries the IANA id.
	await expect(page.getByRole('combobox', { name: m.fieldTimezone() })).toHaveCount(0);
	await expect(
		page.getByText(m.timezonePicked({ timezone: 'America/New_York (Eastern Time)' }))
	).toBeVisible();
	await expect(page.locator('input[name="timezone"]')).toHaveValue('America/New_York');

	await page.getByLabel(m.fieldTitle()).fill('NYC brunch');
	await addDate(page, 12);
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	// The dashboard header shows the persisted zone, localized.
	await expect(page.getByText('America/New_York (Eastern Time)')).toBeVisible();
});

test('picking a different timezone updates the note and collapses the picker again', async ({
	page
}) => {
	await page.goto('/create');
	await page.getByLabel(m.fieldTitle()).fill('CPH brunch');
	await addDate(page, 12);

	const combo = await revealTimezone(page);
	await combo.fill('Copenhagen');
	await page.getByRole('option', { name: 'Europe/Copenhagen (Central European Time)' }).click();
	// The picker folds away on its own shortly after the pick...
	await expect(page.getByRole('combobox', { name: m.fieldTimezone() })).toHaveCount(0);
	// ...and the note names the new zone, which still posts.
	await expect(
		page.getByText(m.timezonePicked({ timezone: 'Europe/Copenhagen (Central European Time)' }))
	).toBeVisible();
	await expect(page.locator('input[name="timezone"]')).toHaveValue('Europe/Copenhagen');

	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	await expect(page.getByText('Europe/Copenhagen (Central European Time)')).toBeVisible();
});

test('revealed timezone picker labels follow the picked language', async ({ page }) => {
	await page.goto('/create');
	// English browser first: the selected zone shows identifier plus English
	// generic zone name.
	const combo = await revealTimezone(page);
	await expect(combo).toHaveValue('America/New_York (Eastern Time)');
	// Pick Danish: the same zone re-labels with the Danish zone name, live.
	// The disclosure stays revealed across the language re-render.
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
	const combo = await revealTimezone(page);
	await combo.fill('Copenhagen');
	await page.getByRole('option', { name: 'Europe/Copenhagen (Central European Time)' }).click();
	// Wait out the auto-collapse so exactly one timezone input remains.
	await expect(page.getByRole('combobox', { name: m.fieldTimezone() })).toHaveCount(0);
	await expect(page.locator('input[name="timezone"]')).toHaveValue('Europe/Copenhagen');

	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	// The dashboard header shows the typed-and-picked zone persisted.
	await expect(page.getByText('Europe/Copenhagen (Central European Time)')).toBeVisible();
});

test('text matching no timezone reverts to the previous selection', async ({ page }) => {
	await page.goto('/create');
	const combo = await revealTimezone(page);
	await combo.fill('not a real zone');
	// No suggestion matches, so leaving the field falls back to the default.
	// A blur is not a pick, so the picker stays revealed.
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
