import { test, expect, type Page } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import {
	d1,
	eventHighlightBudget,
	eventPollType,
	optionLabels,
	responseValues,
	seedDateOption,
	seedEvent,
	seedInvitee,
	seedResponse,
	wipeEvent
} from '../support/db';

// Highlight polls: 2+ text options answered by spending a fixed budget of
// marker strokes; results total the strokes (openspec/specs/highlight-poll).
// English browser so bare m.*() (baseLocale = en) matches the pages.
test.use({ locale: 'en-US', timezoneId: 'Europe/Copenhagen' });

// Main open highlight poll (budget 5), reseeded by every mutating test. Anna
// starts with no recorded strokes; tests seed answers where needed.
const EV = 'e2e-highlight-ev';
const OTOK = 'e2e-highlight-otok';
const RTOK = 'e2e-highlight-rtok';
const INV = 'e2e-highlight-inv';
const O1 = 'e2e-highlight-o1';
const O2 = 'e2e-highlight-o2';
const O3 = 'e2e-highlight-o3';

function seed() {
	wipeEvent(EV);
	seedEvent({
		id: EV,
		title: 'Party menu (e2e)',
		organizerToken: OTOK,
		status: 'open',
		pollType: 'highlight',
		highlightBudget: 5,
		allowPreferred: false,
		allowUnsure: false
	});
	seedDateOption({ id: O1, eventId: EV, label: 'Lasagna', sortOrder: 0 });
	seedDateOption({ id: O2, eventId: EV, label: 'Tacos', sortOrder: 1 });
	seedDateOption({ id: O3, eventId: EV, label: 'Curry', sortOrder: 2 });
	seedInvitee({ id: INV, eventId: EV, label: 'Anna', token: RTOK });
}

function seedAnswer(values: Record<string, number>, inviteeId = INV) {
	for (const [dateOptionId, value] of Object.entries(values)) {
		seedResponse({ inviteeId, dateOptionId, preference: 'available', value });
	}
}

test.beforeAll(seed);

const addStroke = (page: Page, option: string) =>
	page.getByRole('button', { name: m.addStroke({ option }) });
const removeStroke = (page: Page, option: string) =>
	page.getByRole('button', { name: m.removeStroke({ option }) });
const strokesLeft = (page: Page, count: number, budget = 5) =>
	page.getByText(m.strokesLeft({ count, budget }));

// --- Requirement: Create a highlight poll ---

test('creating a highlight poll without touching the budget defaults it to 5', async ({ page }) => {
	await page.goto('/create');
	await page.getByRole('radio', { name: m.pollTypeHighlight() }).check();
	await page.getByLabel(m.fieldTitle()).fill('Snack vote');
	await page.getByPlaceholder(m.optionPlaceholder()).last().fill('Chips');
	await page.getByRole('button', { name: m.addOption() }).click();
	await page.getByPlaceholder(m.optionPlaceholder()).last().fill('Fruit');
	await page.getByRole('button', { name: m.addOption() }).click();
	// The budget field shows for the highlight type, prefilled with 5.
	await expect(page.getByLabel(m.fieldBudget())).toHaveValue('5');
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	await expect(page.getByText('Chips').first()).toBeVisible();
	const otok = page.url().split('/').pop() ?? '';
	const id = d1(`SELECT id FROM events WHERE organizer_token = '${otok}'`).results[0].id as string;
	expect(eventPollType(id)).toBe('highlight');
	expect(eventHighlightBudget(id)).toBe(5);
});

test('the budget is fixed after creation and a crafted change is rejected', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	// The settings offer no budget control.
	await page.getByRole('button', { name: m.edit() }).first().click();
	const form = page.locator('form[action="?/saveDetails"]');
	await expect(form.locator('[name="highlightBudget"]')).toHaveCount(0);
	// A crafted request smuggling a budget changes nothing.
	const base = test.info().project.use.baseURL ?? '';
	await page.request.post(`/e/${OTOK}?/saveDetails`, {
		headers: { origin: base },
		form: {
			title: 'Party menu (e2e)',
			description: '',
			pollMode: 'assigned',
			locale: 'en',
			highlightBudget: '9'
		}
	});
	await expect.poll(() => eventHighlightBudget(EV)).toBe(5);
});

test('a budget of 0 or 11 reaching the server is rejected', async ({ page }) => {
	const base = test.info().project.use.baseURL ?? '';
	for (const budget of ['0', '11']) {
		const res = await page.request.post('/create?/create', {
			headers: { origin: base },
			form: {
				title: 'Bad budget',
				pollType: 'highlight',
				pollMode: 'open',
				locale: 'en',
				highlightBudget: budget,
				'options.0.text': 'One',
				'options.1.text': 'Two'
			}
		});
		expect(await res.json()).toMatchObject({ type: 'failure', status: 400 });
	}
});

// --- Requirement: Answer by spending strokes ---

test('strokes spread across options are recorded, zero-stroke options included', async ({
	page
}) => {
	seed();
	await page.goto(`/r/${RTOK}`);
	await expect(strokesLeft(page, 5)).toBeVisible();
	for (let i = 0; i < 3; i++) await addStroke(page, 'Lasagna').click();
	for (let i = 0; i < 2; i++) await addStroke(page, 'Tacos').click();
	// The remaining-stroke indicator reached zero before submitting.
	await expect(strokesLeft(page, 0)).toBeVisible();
	await page.getByRole('button', { name: m.sendAnswer() }).click();
	await expect(page.getByText(m.savedTitle()).first()).toBeVisible();
	await expect.poll(() => responseValues(INV)).toEqual({ [O1]: 3, [O2]: 2, [O3]: 0 });
});

test('the budget cannot be exceeded until a stroke is removed', async ({ page }) => {
	seed();
	await page.goto(`/r/${RTOK}`);
	for (let i = 0; i < 5; i++) await addStroke(page, 'Lasagna').click();
	await expect(strokesLeft(page, 0)).toBeVisible();
	// No stroke can be added anywhere until one is removed.
	await expect(addStroke(page, 'Tacos')).toBeDisabled();
	await removeStroke(page, 'Lasagna').click();
	await expect(strokesLeft(page, 1)).toBeVisible();
	await expect(addStroke(page, 'Tacos')).toBeEnabled();
});

test('a stroke can be taken back and the remaining count goes up', async ({ page }) => {
	seed();
	await page.goto(`/r/${RTOK}`);
	await addStroke(page, 'Lasagna').click();
	await addStroke(page, 'Lasagna').click();
	await expect(page.getByTestId(`stroke-count-${O1}`)).toHaveText('×2');
	await expect(strokesLeft(page, 3)).toBeVisible();
	await removeStroke(page, 'Lasagna').click();
	await expect(page.getByTestId(`stroke-count-${O1}`)).toHaveText('×1');
	await expect(strokesLeft(page, 4)).toBeVisible();
});

test('an empty answer is refused until at least one stroke is spent', async ({ page }) => {
	seed();
	await page.goto(`/r/${RTOK}`);
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toBeDisabled();
	await expect(page.getByText(m.errorNoStrokes())).toBeVisible();
	await addStroke(page, 'Lasagna').click();
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toBeEnabled();
});

test('crafted over-budget or negative submissions are rejected with nothing recorded', async ({
	page
}) => {
	seed();
	const base = test.info().project.use.baseURL ?? '';
	// Six strokes against a budget of five.
	let res = await page.request.post(`/r/${RTOK}?/save`, {
		headers: { origin: base },
		form: { [`value.${O1}`]: '6', [`value.${O2}`]: '0', [`value.${O3}`]: '0', note: '' }
	});
	expect(await res.json()).toMatchObject({ type: 'failure', status: 400 });
	// A negative count.
	res = await page.request.post(`/r/${RTOK}?/save`, {
		headers: { origin: base },
		form: { [`value.${O1}`]: '-1', [`value.${O2}`]: '3', [`value.${O3}`]: '0', note: '' }
	});
	expect(await res.json()).toMatchObject({ type: 'failure', status: 400 });
	await expect.poll(() => responseValues(INV)).toEqual({});
});

// --- Requirement: Stroke results ---

function seedTwoAnswers() {
	seed();
	seedAnswer({ [O1]: 3, [O2]: 2, [O3]: 0 });
	seedInvitee({ id: 'e2e-highlight-bo', eventId: EV, label: 'Bo', token: 'e2e-highlight-botok' });
	seedAnswer({ [O1]: 2, [O2]: 0, [O3]: 1 }, 'e2e-highlight-bo');
}

test('results order the options by stroke totals with the leader highlighted', async ({ page }) => {
	seedTwoAnswers();
	await page.goto(`/e/${OTOK}`);
	// Lasagna 5, Tacos 2, Curry 1 - listed in that order, Lasagna leading.
	const labels = await page.locator('div.rounded-card span.text-lead').allTextContents();
	expect(labels.indexOf('Lasagna')).toBeLessThan(labels.indexOf('Tacos'));
	expect(labels.indexOf('Tacos')).toBeLessThan(labels.indexOf('Curry'));
	const lasagna = page.locator('div.rounded-card', { hasText: 'Lasagna' }).first();
	await expect(lasagna.getByText(m.strokesTotal({ count: 5 }))).toBeVisible();
	await expect(page.getByText(m.bestOption())).toBeVisible();
});

test("the organizer sees each respondent's stroke count per option", async ({ page }) => {
	seedTwoAnswers();
	await page.goto(`/e/${OTOK}`);
	const lasagna = page.locator('div.rounded-card', { hasText: 'Lasagna' }).first();
	await expect(lasagna.getByText('Anna')).toBeVisible();
	await expect(lasagna.getByText('×3')).toBeVisible();
	await expect(lasagna.getByText('Bo')).toBeVisible();
	await expect(lasagna.getByText('×2')).toBeVisible();
});

// --- Requirement: Options changed after an invitee answered ---

test('an option added after an answer starts at zero strokes, flagged, in edit mode', async ({
	page
}) => {
	seed();
	seedAnswer({ [O1]: 3, [O2]: 2, [O3]: 0 });
	await page.goto(`/e/${OTOK}`);
	const addForm = page.locator('form[action="?/addOption"]');
	await addForm.locator('input[name="label"]').fill('Pancakes');
	await addForm.getByRole('button', { name: m.addOption() }).click();
	await expect.poll(() => optionLabels(EV)).toEqual(['Lasagna', 'Tacos', 'Curry', 'Pancakes']);

	await page.goto(`/r/${RTOK}`);
	await expect(page.getByText(m.newOptionsBanner())).toBeVisible();
	const pancakesId = d1(
		`SELECT id FROM date_options WHERE event_id = '${EV}' AND label = 'Pancakes'`
	).results[0].id as string;
	const card = page.getByTestId(`highlight-card-${pancakesId}`);
	await expect(card.getByText(m.newDateBadge())).toBeVisible();
	// Zero strokes on the new option, and the page is open for editing.
	await expect(page.getByTestId(`stroke-count-${pancakesId}`)).toHaveCount(0);
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toBeVisible();
});

// --- Requirement: Highlight-poll wording and outcome ---

const DEV = 'e2e-highlight-dev';
const DRTOK = 'e2e-highlight-drtok';

test("the response page reads in stroke wording in the poll's language", async ({ page }) => {
	wipeEvent(DEV);
	seedEvent({
		id: DEV,
		title: 'Festmenu (e2e)',
		organizerToken: 'e2e-highlight-dotok',
		status: 'open',
		locale: 'da',
		pollType: 'highlight',
		highlightBudget: 4,
		allowPreferred: false,
		allowUnsure: false
	});
	seedDateOption({ id: 'e2e-highlight-do1', eventId: DEV, label: 'Lasagne', sortOrder: 0 });
	seedDateOption({ id: 'e2e-highlight-do2', eventId: DEV, label: 'Tacos', sortOrder: 1 });
	seedInvitee({ id: 'e2e-highlight-dinv', eventId: DEV, label: 'Clara', token: DRTOK });

	await page.goto(`/r/${DRTOK}`);
	await expect(page.getByText(m.responseIntroHighlight({}, { locale: 'da' }))).toBeVisible();
	await expect(
		page.getByText(m.strokesLeft({ count: 4, budget: 4 }, { locale: 'da' }))
	).toBeVisible();
	await expect(page.getByText(m.datesQuestion({}, { locale: 'da' }))).toHaveCount(0);
	await expect(page.getByText(m.responseIntro({}, { locale: 'da' }))).toHaveCount(0);
});

const CEV = 'e2e-highlight-cev';
const CRTOK = 'e2e-highlight-crtok';
const CINV = 'e2e-highlight-cinv';

test('a closed highlight poll shows the chosen option and refuses stroke changes', async ({
	page
}) => {
	wipeEvent(CEV);
	seedEvent({
		id: CEV,
		title: 'Decided menu (e2e)',
		organizerToken: 'e2e-highlight-cotok',
		status: 'closed',
		pollType: 'highlight',
		highlightBudget: 5,
		allowPreferred: false,
		allowUnsure: false
	});
	seedDateOption({
		id: 'e2e-highlight-co1',
		eventId: CEV,
		label: 'Lasagna',
		sortOrder: 0,
		selected: true
	});
	seedDateOption({ id: 'e2e-highlight-co2', eventId: CEV, label: 'Tacos', sortOrder: 1 });
	seedInvitee({ id: CINV, eventId: CEV, label: 'Bo', token: CRTOK });
	seedResponse({
		inviteeId: CINV,
		dateOptionId: 'e2e-highlight-co1',
		preference: 'available',
		value: 4
	});
	seedResponse({
		inviteeId: CINV,
		dateOptionId: 'e2e-highlight-co2',
		preference: 'available',
		value: 1
	});

	await page.goto(`/r/${CRTOK}`);
	// The chosen option's text is the outcome; options keep their totals.
	await expect(page.getByText(m.chosenOptionHeading())).toBeVisible();
	await expect(page.getByText('Lasagna').first()).toBeVisible();
	await expect(page.getByText(m.strokesTotal({ count: 4 }))).toBeVisible();

	// A crafted stroke change is refused while closed.
	const base = test.info().project.use.baseURL ?? '';
	const res = await page.request.post(`/r/${CRTOK}?/save`, {
		headers: { origin: base },
		form: { [`value.e2e-highlight-co1`]: '1', [`value.e2e-highlight-co2`]: '4', note: '' }
	});
	expect(await res.json()).toMatchObject({ type: 'failure', status: 403 });
	await expect
		.poll(() => responseValues(CINV))
		.toEqual({ 'e2e-highlight-co1': 4, 'e2e-highlight-co2': 1 });
});
