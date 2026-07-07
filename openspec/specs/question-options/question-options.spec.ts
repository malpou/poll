import { test, expect, type Page } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import {
	countResponsesForOption,
	d1,
	eventPollType,
	optionLabels,
	responsesFor,
	seedDateOption,
	seedEvent,
	seedInvitee,
	seedResponse,
	wipeEvent
} from '../support/db';

// Question polls: free-form question + 2+ text options through the same
// capability-URL flows as dates polls (openspec/specs/question-options).
// English browser so bare m.*() (baseLocale = en) matches the pages.
test.use({ locale: 'en-US', timezoneId: 'Europe/Copenhagen' });

// Main open question poll, reseeded by every mutating test.
const EV = 'e2e-question-ev';
const OTOK = 'e2e-question-otok';
const RTOK = 'e2e-question-rtok';
const INV = 'e2e-question-inv';
const O1 = 'e2e-question-o1';
const O2 = 'e2e-question-o2';
const O3 = 'e2e-question-o3';
const TITLE = 'Which restaurant? (e2e)';

function seed() {
	wipeEvent(EV);
	seedEvent({ id: EV, title: TITLE, organizerToken: OTOK, status: 'open', pollType: 'question' });
	seedDateOption({ id: O1, eventId: EV, label: 'Pizza', sortOrder: 0 });
	seedDateOption({ id: O2, eventId: EV, label: 'Sushi', sortOrder: 1 });
	seedDateOption({ id: O3, eventId: EV, label: 'Burger', sortOrder: 2 });
	seedInvitee({ id: INV, eventId: EV, label: 'Anna', token: RTOK });
	seedResponse({ inviteeId: INV, dateOptionId: O1, preference: 'available' });
	seedResponse({ inviteeId: INV, dateOptionId: O2, preference: 'unavailable' });
	seedResponse({ inviteeId: INV, dateOptionId: O3, preference: 'available' });
}

test.beforeAll(seed);

// The dashboard's option manager section, as opposed to the results cards
// (both repeat the option texts).
function optionsSection(page: Page) {
	return page.locator('section').filter({ hasText: m.optionsSection() });
}

async function pickQuestionType(page: Page) {
	await page.getByRole('radio', { name: m.pollTypeQuestion() }).check();
}

// The create form's fill-then-add option list: the add row is the last input.
async function addTextOption(page: Page, text: string) {
	await page.getByPlaceholder(m.optionPlaceholder()).last().fill(text);
	await page.getByRole('button', { name: m.addOption() }).click();
}

// --- Requirement: Poll type chosen at creation ---

test('creating a question poll with two text options lands on the dashboard', async ({ page }) => {
	await page.goto('/create');
	await pickQuestionType(page);
	await page.getByLabel(m.fieldTitle()).fill('Team lunch spot');
	await addTextOption(page, 'Pizza place');
	await addTextOption(page, 'Sushi bar');
	await page.getByRole('button', { name: m.create() }).click();
	// A real /e/{token} only exists because the event row was written (D1-backed).
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	// Both options render as their text on the dashboard.
	await expect(page.getByText('Pizza place').first()).toBeVisible();
	await expect(page.getByText('Sushi bar').first()).toBeVisible();
	const otok = page.url().split('/').pop() ?? '';
	const id = d1(`SELECT id FROM events WHERE organizer_token = '${otok}'`).results[0].id as string;
	expect(eventPollType(id)).toBe('question');
	expect(optionLabels(id)).toEqual(['Pizza place', 'Sushi bar']);
});

test('an untouched type choice creates a dates poll', async ({ page }) => {
	await page.goto('/create');
	await page.getByLabel(m.fieldTitle()).fill('Plain dates poll');
	// The dates-type calendar is the options UI - the type choice was never touched.
	await page.getByRole('button', { name: '12', exact: true }).click();
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	const otok = page.url().split('/').pop() ?? '';
	const id = d1(`SELECT id FROM events WHERE organizer_token = '${otok}'`).results[0].id as string;
	expect(eventPollType(id)).toBe('dates');
});

test('fewer than two non-blank options reaching the server is rejected', async ({ page }) => {
	// The client gate disables the submit below two non-blank options; force
	// the POST through to prove the server safety net still rejects it. The
	// enhance POST returns HTTP 200; the failure status travels in the JSON.
	const forceSubmit = async () => {
		const [res] = await Promise.all([
			page.waitForResponse((r) => r.request().method() === 'POST'),
			page.evaluate(() => document.querySelector('form')?.requestSubmit())
		]);
		return res.json() as Promise<{ type: string; status: number }>;
	};

	await page.goto('/create');
	await pickQuestionType(page);
	await page.getByLabel(m.fieldTitle()).fill('Too few');
	await addTextOption(page, 'Only one');
	expect(await forceSubmit()).toMatchObject({ type: 'failure', status: 400 });
	// first - the gating caption shows the same message as the server error.
	await expect(page.getByText(m.errorTooFewOptions(), { exact: true }).first()).toBeVisible();
	await expect(page).toHaveURL(/\/create$/);

	// A second option that is only whitespace doesn't count toward the minimum.
	await addTextOption(page, 'Real second');
	await page.getByPlaceholder(m.optionPlaceholder()).nth(1).fill('   ');
	expect(await forceSubmit()).toMatchObject({ type: 'failure', status: 400 });
	await expect(page.getByText(m.errorTooFewOptions(), { exact: true }).first()).toBeVisible();
	await expect(page).toHaveURL(/\/create$/);
});

test('all five poll types are offered at creation', async ({ page }) => {
	await page.goto('/create');
	for (const name of [
		m.pollTypeDates(),
		m.pollTypeQuestion(),
		m.pollTypeRsvp(),
		m.pollTypeRank(),
		m.pollTypeHighlight()
	]) {
		await expect(page.getByRole('radio', { name })).toBeVisible();
	}
});

// --- Requirement: Poll type is immutable ---

test('the dashboard settings offer no poll-type control', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	await page.getByRole('button', { name: m.edit() }).first().click();
	const form = page.locator('form[action="?/saveDetails"]');
	// Mode and language stay editable...
	await expect(form.locator('select[name="pollMode"]')).toBeVisible();
	await expect(form.getByRole('radio', { name: 'English' })).toBeVisible();
	// ...but nothing posts or edits a poll type.
	await expect(form.locator('[name="pollType"], [name="poll_type"]')).toHaveCount(0);
});

test('a crafted request cannot change the poll type', async ({ page }) => {
	seed();
	const base = test.info().project.use.baseURL ?? '';
	// Bypass the UI: a stale tab or crafted POST must not flip the type.
	await page.request.post(`/e/${OTOK}?/saveDetails`, {
		headers: { origin: base },
		form: { title: TITLE, description: '', pollMode: 'assigned', locale: 'en', pollType: 'dates' }
	});
	await expect.poll(() => eventPollType(EV)).toBe('question');
});

// --- Requirement: Manage question options ---

test("editing an option's text keeps its recorded responses", async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	const card = optionsSection(page).locator('div.rounded-card', { hasText: 'Pizza' });
	await card.getByRole('button', { name: m.edit() }).click();
	const form = page.locator('form[action="?/editOption"]');
	await form.locator('input[name="label"]').fill('Tacos');
	await form.getByRole('button', { name: m.save() }).click();
	await expect.poll(() => optionLabels(EV)).toEqual(['Tacos', 'Sushi', 'Burger']);
	// The new text renders on the response page; Anna's answers are kept.
	await page.goto(`/r/${RTOK}`);
	await expect(page.getByText('Tacos').first()).toBeVisible();
	expect(responsesFor(INV)).toHaveLength(3);
});

test('saving an option as whitespace is rejected and the old text kept', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	const card = optionsSection(page).locator('div.rounded-card', { hasText: 'Pizza' });
	await card.getByRole('button', { name: m.edit() }).click();
	const form = page.locator('form[action="?/editOption"]');
	await form.locator('input[name="label"]').fill('   ');
	await form.getByRole('button', { name: m.save() }).click();
	await expect.poll(() => optionLabels(EV)).toEqual(['Pizza', 'Sushi', 'Burger']);
});

test('removing an option with responses warns, then deletes it and its responses', async ({
	page
}) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	page.once('dialog', (d) => {
		expect(d.message()).toBe(m.confirmDeleteOptionQuestion());
		void d.accept();
	});
	await optionsSection(page)
		.locator('div.rounded-card', { hasText: 'Pizza' })
		.getByRole('button', { name: m.remove() })
		.click();
	await expect.poll(() => optionLabels(EV)).toEqual(['Sushi', 'Burger']);
	expect(countResponsesForOption(O1)).toBe(0);
});

test('an option added after an invitee answered is flagged on their response page', async ({
	page
}) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	const addForm = page.locator('form[action="?/addOption"]');
	await addForm.locator('input[name="label"]').fill('Tapas');
	await addForm.getByRole('button', { name: m.addOption() }).click();
	await expect.poll(() => optionLabels(EV)).toEqual(['Pizza', 'Sushi', 'Burger', 'Tapas']);

	// Anna already answered: the new option arrives first, badged, and the page
	// opens back into editing (not the answered notice).
	await page.goto(`/r/${RTOK}`);
	await expect(page.getByText(m.newOptionsBanner())).toBeVisible();
	const firstCard = page.locator('[data-testid^="date-card-"]').first();
	await expect(firstCard).toContainText('Tapas');
	await expect(firstCard.getByText(m.newDateBadge())).toBeVisible();
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toBeVisible();
});

test('moving an option up reorders it for everyone', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	await optionsSection(page)
		.locator('div.rounded-card', { hasText: 'Sushi' })
		.getByRole('button', { name: m.moveUp() })
		.click();
	await expect.poll(() => optionLabels(EV)).toEqual(['Sushi', 'Pizza', 'Burger']);
	// The response page lists the options in the new order.
	await page.goto(`/r/${RTOK}`);
	await expect(page.locator('[data-testid^="date-card-"]').first()).toContainText('Sushi');
});

// Rank polls reuse this option management; highlight behaves identically
// (same actions, same provider path).
const REV = 'e2e-question-rankev';

test('rank and highlight options are managed the same way as question options', async ({
	page
}) => {
	wipeEvent(REV);
	seedEvent({
		id: REV,
		title: 'Rank managed (e2e)',
		organizerToken: 'e2e-question-rankotok',
		status: 'open',
		pollType: 'rank',
		allowPreferred: false,
		allowUnsure: false
	});
	seedDateOption({ id: 'e2e-question-ro1', eventId: REV, label: 'Museum', sortOrder: 0 });
	seedDateOption({ id: 'e2e-question-ro2', eventId: REV, label: 'Beach', sortOrder: 1 });

	await page.goto('/e/e2e-question-rankotok');
	const card = optionsSection(page).locator('div.rounded-card', { hasText: 'Museum' });
	await card.getByRole('button', { name: m.edit() }).click();
	const form = page.locator('form[action="?/editOption"]');
	await form.locator('input[name="label"]').fill('Gallery');
	await form.getByRole('button', { name: m.save() }).click();
	await expect.poll(() => optionLabels(REV)).toEqual(['Gallery', 'Beach']);
	await expect(page.getByText('Gallery').first()).toBeVisible();
});

// --- Requirement: Question polls carry no date affordances ---

test('picking the question type swaps the calendar and timezone for text entry', async ({
	page
}) => {
	await page.goto('/create');
	// Dates type first: calendar + the collapsed timezone note are there.
	await expect(page.getByRole('button', { name: m.nextMonth() })).toBeVisible();
	await expect(page.getByRole('button', { name: m.timezoneChange() })).toBeVisible();
	await pickQuestionType(page);
	// Question type: free-form text entry instead, no month calendar, no timezone.
	await expect(page.getByPlaceholder(m.optionPlaceholder())).toBeVisible();
	await expect(page.getByRole('button', { name: m.nextMonth() })).toHaveCount(0);
	await expect(page.getByRole('button', { name: m.timezoneChange() })).toHaveCount(0);
	await expect(page.locator('input[name="timezone"]')).toHaveCount(0);
});

test('a question poll dashboard offers no timezone, sort-by-date, or time fields', async ({
	page
}) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	await expect(page.getByRole('button', { name: m.sortByDate() })).toHaveCount(0);
	// The header names mode and language but no timezone.
	await expect(page.getByText('Europe/Copenhagen')).toHaveCount(0);
	// Editing the details offers no timezone picker either.
	await page.getByRole('button', { name: m.edit() }).first().click();
	await expect(page.getByRole('combobox', { name: m.fieldTimezone() })).toHaveCount(0);
	// Options are edited as text: no date or time inputs anywhere.
	await page.locator('form[action="?/saveDetails"]').getByLabel(m.cancel()).click();
	await optionsSection(page)
		.locator('div.rounded-card', { hasText: 'Pizza' })
		.getByRole('button', { name: m.edit() })
		.click();
	const form = page.locator('form[action="?/editOption"]');
	await expect(form.locator('input[name="label"]')).toBeVisible();
	await expect(form.locator('input[type="date"], input[type="time"]')).toHaveCount(0);
});

test('picking the rank or highlight type also swaps to text entry with no timezone', async ({
	page
}) => {
	await page.goto('/create');
	for (const name of [m.pollTypeRank(), m.pollTypeHighlight()]) {
		await page.getByRole('radio', { name }).check();
		await expect(page.getByPlaceholder(m.optionPlaceholder())).toBeVisible();
		await expect(page.getByRole('button', { name: m.nextMonth() })).toHaveCount(0);
		await expect(page.locator('input[name="timezone"]')).toHaveCount(0);
	}
});

// --- Requirement: Question options render as their text everywhere ---

test('the response page lists every option as its text with the choice controls', async ({
	page
}) => {
	seed();
	await page.goto(`/r/${RTOK}`);
	for (const label of ['Pizza', 'Sushi', 'Burger']) {
		const card = page.locator('[data-testid^="date-card-"]', { hasText: label });
		await expect(card).toBeVisible();
		// Each option offers the poll's enabled choices.
		await expect(card.getByRole('button', { name: m.prefPreferred() })).toBeVisible();
	}
});

// Closed question poll with a decision, for the outcome view.
const CEV = 'e2e-question-cev';
const CRTOK = 'e2e-question-crtok';

test("a closed question poll shows the chosen option's text and the distribution", async ({
	page
}) => {
	wipeEvent(CEV);
	seedEvent({
		id: CEV,
		title: 'Decided dinner (e2e)',
		organizerToken: 'e2e-question-cotok',
		status: 'closed',
		pollType: 'question'
	});
	seedDateOption({
		id: 'e2e-question-co1',
		eventId: CEV,
		label: 'Ramen',
		sortOrder: 0,
		selected: true
	});
	seedDateOption({ id: 'e2e-question-co2', eventId: CEV, label: 'Falafel', sortOrder: 1 });
	seedInvitee({ id: 'e2e-question-cinv', eventId: CEV, label: 'Bo', token: CRTOK });
	seedResponse({
		inviteeId: 'e2e-question-cinv',
		dateOptionId: 'e2e-question-co1',
		preference: 'available'
	});

	await page.goto(`/r/${CRTOK}`);
	// The chosen option's text, prominent under the question-poll heading.
	await expect(page.getByText(m.chosenOptionHeading())).toBeVisible();
	await expect(page.getByText('Ramen').first()).toBeVisible();
	// Every option shows its per-choice count distribution.
	await expect(page.getByText(m.distributionHeading())).toBeVisible();
	await expect(page.getByText(m.chosenBadgeQuestion(), { exact: true })).toBeVisible();
	await expect(page.getByText('Falafel')).toBeVisible();
});

// --- Requirement: Question-poll wording ---

// A Danish question poll: wording must follow the poll's language, not the browser's.
const DEV = 'e2e-question-dev';
const DRTOK = 'e2e-question-drtok';

test("the choice controls read in the poll's language in question wording", async ({ page }) => {
	wipeEvent(DEV);
	seedEvent({
		id: DEV,
		title: 'Hvilken restaurant? (e2e)',
		organizerToken: 'e2e-question-dotok',
		status: 'open',
		locale: 'da',
		pollType: 'question'
	});
	seedDateOption({ id: 'e2e-question-do1', eventId: DEV, label: 'Pizza', sortOrder: 0 });
	seedDateOption({ id: 'e2e-question-do2', eventId: DEV, label: 'Sushi', sortOrder: 1 });
	seedInvitee({ id: 'e2e-question-dinv', eventId: DEV, label: 'Clara', token: DRTOK });

	await page.goto(`/r/${DRTOK}`);
	// Question wording, in Danish - not the date wording.
	await expect(page.getByText(m.prefAvailableQuestion({}, { locale: 'da' })).first()).toBeVisible();
	await expect(
		page.getByText(m.prefUnavailableQuestion({}, { locale: 'da' })).first()
	).toBeVisible();
	await expect(page.getByText(m.optionsQuestion({}, { locale: 'da' }))).toBeVisible();
	await expect(page.getByText(m.prefAvailable({}, { locale: 'da' }))).toHaveCount(0);
	await expect(page.getByText(m.datesQuestion({}, { locale: 'da' }))).toHaveCount(0);
});

test('result tallies read in question wording on the dashboard', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	// Pizza: Anna alone can make it - the count row reads yes/no, not date terms.
	await expect(page.getByText(`1 ${m.prefAvailableQuestion()}`).first()).toBeVisible();
	await expect(page.getByText(`1 ${m.prefUnavailableQuestion()}`).first()).toBeVisible();
	await expect(page.getByText(m.prefAvailable())).toHaveCount(0);
});

// A dates poll seeded through the same suite: its copy must be untouched.
const FEV = 'e2e-question-fev';
const FRTOK = 'e2e-question-frtok';

test('dates polls keep their date wording', async ({ page }) => {
	wipeEvent(FEV);
	seedEvent({
		id: FEV,
		title: 'Sommerfest (e2e)',
		organizerToken: 'e2e-question-fotok',
		status: 'open'
	});
	seedDateOption({
		id: 'e2e-question-fo1',
		eventId: FEV,
		startsAt: '2026-09-12T08:00:00Z',
		sortOrder: 0
	});
	seedInvitee({ id: 'e2e-question-finv', eventId: FEV, label: 'Dora', token: FRTOK });

	await page.goto(`/r/${FRTOK}`);
	await expect(page.getByText(m.datesQuestion())).toBeVisible();
	await expect(page.getByText(m.prefAvailable()).first()).toBeVisible();
	await expect(page.getByText(m.prefAvailableQuestion())).toHaveCount(0);
	await expect(page.getByText(m.optionsQuestion())).toHaveCount(0);
});
