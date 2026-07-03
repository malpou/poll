import { test, expect, type Page } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import {
	d1,
	eventChoices,
	eventPollType,
	optionLabels,
	responseValues,
	seedDateOption,
	seedEvent,
	seedInvitee,
	seedResponse,
	wipeEvent
} from '../support/db';

// Rank polls: 2+ text options every invitee puts in a strict total order;
// Borda scoring with a first-place tiebreak (openspec/specs/rank-poll).
// English browser so bare m.*() (baseLocale = en) matches the pages.
test.use({ locale: 'en-US', timezoneId: 'Europe/Copenhagen' });

// Main open rank poll, reseeded by every mutating test. Anna starts with no
// recorded order; tests seed one where a scenario needs it.
const EV = 'e2e-rank-ev';
const OTOK = 'e2e-rank-otok';
const RTOK = 'e2e-rank-rtok';
const INV = 'e2e-rank-inv';
const O1 = 'e2e-rank-o1';
const O2 = 'e2e-rank-o2';
const O3 = 'e2e-rank-o3';

function seed() {
	wipeEvent(EV);
	seedEvent({
		id: EV,
		title: 'Order the outings (e2e)',
		organizerToken: OTOK,
		status: 'open',
		pollType: 'rank',
		allowPreferred: false,
		allowUnsure: false
	});
	seedDateOption({ id: O1, eventId: EV, label: 'Museum', sortOrder: 0 });
	seedDateOption({ id: O2, eventId: EV, label: 'Beach', sortOrder: 1 });
	seedDateOption({ id: O3, eventId: EV, label: 'Forest', sortOrder: 2 });
	seedInvitee({ id: INV, eventId: EV, label: 'Anna', token: RTOK });
}

// Anna's recorded ballot: the seeded order by option id, positions 1..N.
function seedBallot(order: string[]) {
	order.forEach((optionId, i) => {
		seedResponse({ inviteeId: INV, dateOptionId: optionId, preference: 'available', value: i + 1 });
	});
}

test.beforeAll(seed);

const slip = (page: Page, id: string) => page.getByTestId(`rank-slip-${id}`);

async function pickRankType(page: Page) {
	await page.getByRole('radio', { name: m.pollTypeRank() }).check();
}

async function addTextOption(page: Page, text: string) {
	await page.getByPlaceholder(m.optionPlaceholder()).last().fill(text);
	await page.getByRole('button', { name: m.addOption() }).click();
}

// --- Requirement: Create a rank poll ---

test('creating a rank poll with three text options lands on the dashboard', async ({ page }) => {
	await page.goto('/create');
	await pickRankType(page);
	await page.getByLabel(m.fieldTitle()).fill('Weekend plan');
	await addTextOption(page, 'Hiking');
	await addTextOption(page, 'Baking');
	await addTextOption(page, 'Karting');
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	await expect(page.getByText('Hiking').first()).toBeVisible();
	await expect(page.getByText('Karting').first()).toBeVisible();
	const otok = page.url().split('/').pop() ?? '';
	const id = d1(`SELECT id FROM events WHERE organizer_token = '${otok}'`).results[0].id as string;
	expect(eventPollType(id)).toBe('rank');
	expect(optionLabels(id)).toEqual(['Hiking', 'Baking', 'Karting']);
});

test('the choice toggles are not offered and the poll records both off', async ({ page }) => {
	await page.goto('/create');
	await pickRankType(page);
	// No preferred/unsure checkboxes once the rank type is picked.
	await expect(page.getByText(m.fieldChoices())).toHaveCount(0);
	await page.getByLabel(m.fieldTitle()).fill('Toggles off');
	await addTextOption(page, 'One');
	await addTextOption(page, 'Two');
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	const otok = page.url().split('/').pop() ?? '';
	const id = d1(`SELECT id FROM events WHERE organizer_token = '${otok}'`).results[0].id as string;
	expect(eventChoices(id)).toEqual({ allowPreferred: false, allowUnsure: false });
});

test('a rank poll with fewer than two options reaching the server is rejected', async ({
	page
}) => {
	const base = test.info().project.use.baseURL ?? '';
	const res = await page.request.post('/create?/create', {
		headers: { origin: base },
		form: {
			title: 'Too few',
			pollType: 'rank',
			pollMode: 'open',
			locale: 'en',
			'options.0.text': 'Only one'
		}
	});
	expect(await res.json()).toMatchObject({ type: 'failure', status: 400 });
});

// --- Requirement: Answer by ordering ---

test('dragging an option above another records the dragged order', async ({ page }) => {
	seed();
	await page.goto(`/r/${RTOK}`);
	// Drag Forest (last) above Museum (first) by the grip handle.
	const handle = slip(page, O3).getByRole('button', { name: m.dragToReorder() });
	const from = await handle.boundingBox();
	const target = await slip(page, O1).boundingBox();
	if (!from || !target) throw new Error('rank slips are not visible');
	await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
	await page.mouse.down();
	await page.mouse.move(from.x + from.width / 2, target.y + 4, { steps: 10 });
	await page.mouse.up();
	// The lifted slip landed first; its numeral badge reads 1.
	await expect(page.locator('[data-testid^="rank-slip-"]').first()).toContainText('Forest');
	await page.getByRole('button', { name: m.sendAnswer() }).click();
	await expect(page.getByText(m.savedTitle()).first()).toBeVisible();
	await expect.poll(() => responseValues(INV)).toEqual({ [O3]: 1, [O1]: 2, [O2]: 3 });
});

test('the move buttons reorder without dragging and the move is recorded', async ({ page }) => {
	seed();
	await page.goto(`/r/${RTOK}`);
	// Move the last option (Forest) up one position: Museum, Forest, Beach.
	await slip(page, O3).getByRole('button', { name: m.moveUp() }).click();
	await page.getByRole('button', { name: m.sendAnswer() }).click();
	await expect(page.getByText(m.savedTitle()).first()).toBeVisible();
	await expect.poll(() => responseValues(INV)).toEqual({ [O1]: 1, [O3]: 2, [O2]: 3 });
});

test('a submitted order can be revised and resubmitted while the poll is open', async ({
	page
}) => {
	seed();
	seedBallot([O1, O2, O3]);
	await page.goto(`/r/${RTOK}`);
	// The saved notice shows; editing reopens the list in the recorded order.
	await page.getByRole('button', { name: m.editAnswer() }).click();
	await slip(page, O2).getByRole('button', { name: m.moveUp() }).click();
	await page.getByRole('button', { name: m.sendAnswer() }).click();
	await expect(page.getByText(m.savedTitle()).first()).toBeVisible();
	// The previous order is replaced with Beach, Museum, Forest.
	await expect.poll(() => responseValues(INV)).toEqual({ [O2]: 1, [O1]: 2, [O3]: 3 });
});

test('a crafted partial or duplicate order is rejected and nothing recorded', async ({ page }) => {
	seed();
	const base = test.info().project.use.baseURL ?? '';
	// Two positions for three options.
	let res = await page.request.post(`/r/${RTOK}?/save`, {
		headers: { origin: base },
		form: { [`value.${O1}`]: '1', [`value.${O2}`]: '2', note: '' }
	});
	expect(await res.json()).toMatchObject({ type: 'failure', status: 400 });
	// The same position twice.
	res = await page.request.post(`/r/${RTOK}?/save`, {
		headers: { origin: base },
		form: { [`value.${O1}`]: '1', [`value.${O2}`]: '1', [`value.${O3}`]: '3', note: '' }
	});
	expect(await res.json()).toMatchObject({ type: 'failure', status: 400 });
	await expect.poll(() => responseValues(INV)).toEqual({});
});

// --- Requirement: Rank results ---

// Two ballots: Anna A,B,C and Bo B,A,C (A=Museum, B=Beach, C=Forest).
function seedTwoBallots() {
	seed();
	seedBallot([O1, O2, O3]);
	seedInvitee({ id: 'e2e-rank-bo', eventId: EV, label: 'Bo', token: 'e2e-rank-botok' });
	[O2, O1, O3].forEach((optionId, i) => {
		seedResponse({
			inviteeId: 'e2e-rank-bo',
			dateOptionId: optionId,
			preference: 'available',
			value: i + 1
		});
	});
}

test('results list the options by position score with the best highlighted', async ({ page }) => {
	seedTwoBallots();
	await page.goto(`/e/${OTOK}`);
	const cards = page.locator('section', { hasText: m.resultsSection() }).first();
	// Museum and Beach (sum 3 each) list above Forest (sum 6).
	const labels = await cards.locator('div.rounded-card span.text-lead').allTextContents();
	expect(labels.indexOf('Forest')).toBeGreaterThan(labels.indexOf('Museum'));
	expect(labels.indexOf('Forest')).toBeGreaterThan(labels.indexOf('Beach'));
	await expect(page.getByText(m.bestOption()).first()).toBeVisible();
});

test('a score tie breaks by the number of first places', async ({ page }) => {
	seed();
	// Anna: Museum 1, Beach 2, Forest 3. Bo: Forest 1, Beach 2, Museum 3.
	// All sums tie at 4; Museum and Forest have a first place, Beach has none,
	// so Beach lists below Museum.
	seedBallot([O1, O2, O3]);
	seedInvitee({ id: 'e2e-rank-bo', eventId: EV, label: 'Bo', token: 'e2e-rank-botok' });
	[O3, O2, O1].forEach((optionId, i) => {
		seedResponse({
			inviteeId: 'e2e-rank-bo',
			dateOptionId: optionId,
			preference: 'available',
			value: i + 1
		});
	});
	await page.goto(`/e/${OTOK}`);
	const labels = await page.locator('div.rounded-card span.text-lead').allTextContents();
	expect(labels.indexOf('Beach')).toBeGreaterThan(labels.indexOf('Museum'));
});

test("the organizer sees each respondent's position per option", async ({ page }) => {
	seedTwoBallots();
	await page.goto(`/e/${OTOK}`);
	// Museum's card: Anna gave it position 1, Bo position 2.
	const museum = page.locator('div.rounded-card', { hasText: 'Museum' }).first();
	await expect(museum.getByText('Anna')).toBeVisible();
	await expect(museum.getByText('#1')).toBeVisible();
	await expect(museum.getByText('Bo')).toBeVisible();
	await expect(museum.getByText('#2')).toBeVisible();
	// And the average position is named.
	await expect(museum.getByText(m.averagePosition({ avg: '1.5' }))).toBeVisible();
});

// --- Requirement: Options changed after an invitee ordered ---

test('an option added after an order was submitted appends to the ballot and flags it', async ({
	page
}) => {
	seed();
	seedBallot([O1, O2, O3]);
	await page.goto(`/e/${OTOK}`);
	const addForm = page.locator('form[action="?/addOption"]');
	await addForm.locator('input[name="label"]').fill('Zoo');
	await addForm.getByRole('button', { name: m.addOption() }).click();
	await expect.poll(() => optionLabels(EV)).toEqual(['Museum', 'Beach', 'Forest', 'Zoo']);
	// Anna's recorded order gained Zoo at the last position.
	const zooId = d1(`SELECT id FROM date_options WHERE event_id = '${EV}' AND label = 'Zoo'`)
		.results[0].id as string;
	await expect.poll(() => responseValues(INV)).toEqual({ [O1]: 1, [O2]: 2, [O3]: 3, [zooId]: 4 });

	// Her response page flags the new option and opens into editing.
	await page.goto(`/r/${RTOK}`);
	await expect(page.getByText(m.newOptionsBanner())).toBeVisible();
	await expect(slip(page, zooId).getByText(m.newDateBadge())).toBeVisible();
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toBeVisible();
});

test('an option removed after orders were submitted closes the position gap', async ({ page }) => {
	seed();
	seedBallot([O1, O2, O3]);
	await page.goto(`/e/${OTOK}`);
	page.once('dialog', (d) => void d.accept());
	await page
		.locator('section', { hasText: m.optionsSection() })
		.first()
		.locator('div.rounded-card', { hasText: 'Beach' })
		.getByRole('button', { name: m.remove() })
		.click();
	await expect.poll(() => optionLabels(EV)).toEqual(['Museum', 'Forest']);
	// Anna's order is Museum, Forest with no gap.
	await expect.poll(() => responseValues(INV)).toEqual({ [O1]: 1, [O3]: 2 });
});

// --- Requirement: Rank-poll wording and outcome ---

const DEV = 'e2e-rank-dev';
const DRTOK = 'e2e-rank-drtok';

test("the response page reads in ordering wording in the poll's language", async ({ page }) => {
	wipeEvent(DEV);
	seedEvent({
		id: DEV,
		title: 'Udflugter (e2e)',
		organizerToken: 'e2e-rank-dotok',
		status: 'open',
		locale: 'da',
		pollType: 'rank',
		allowPreferred: false,
		allowUnsure: false
	});
	seedDateOption({ id: 'e2e-rank-do1', eventId: DEV, label: 'Museet', sortOrder: 0 });
	seedDateOption({ id: 'e2e-rank-do2', eventId: DEV, label: 'Stranden', sortOrder: 1 });
	seedInvitee({ id: 'e2e-rank-dinv', eventId: DEV, label: 'Clara', token: DRTOK });

	await page.goto(`/r/${DRTOK}`);
	await expect(page.getByText(m.responseIntroRank({}, { locale: 'da' }))).toBeVisible();
	await expect(page.getByText(m.rankQuestion({}, { locale: 'da' }))).toBeVisible();
	await expect(page.getByText(m.datesQuestion({}, { locale: 'da' }))).toHaveCount(0);
	await expect(page.getByText(m.responseIntro({}, { locale: 'da' }))).toHaveCount(0);
});

const CEV = 'e2e-rank-cev';
const CRTOK = 'e2e-rank-crtok';
const CINV = 'e2e-rank-cinv';

test('a closed rank poll shows the chosen option and refuses further order changes', async ({
	page
}) => {
	wipeEvent(CEV);
	seedEvent({
		id: CEV,
		title: 'Decided outing (e2e)',
		organizerToken: 'e2e-rank-cotok',
		status: 'closed',
		pollType: 'rank',
		allowPreferred: false,
		allowUnsure: false
	});
	seedDateOption({
		id: 'e2e-rank-co1',
		eventId: CEV,
		label: 'Museum',
		sortOrder: 0,
		selected: true
	});
	seedDateOption({ id: 'e2e-rank-co2', eventId: CEV, label: 'Beach', sortOrder: 1 });
	seedInvitee({ id: CINV, eventId: CEV, label: 'Bo', token: CRTOK });
	seedResponse({
		inviteeId: CINV,
		dateOptionId: 'e2e-rank-co1',
		preference: 'available',
		value: 1
	});
	seedResponse({
		inviteeId: CINV,
		dateOptionId: 'e2e-rank-co2',
		preference: 'available',
		value: 2
	});

	await page.goto(`/r/${CRTOK}`);
	// The chosen option's text is the outcome; each option keeps its summary.
	await expect(page.getByText(m.chosenOptionHeading())).toBeVisible();
	await expect(page.getByText('Museum').first()).toBeVisible();
	await expect(page.getByText(m.distributionHeading())).toBeVisible();

	// A crafted order change is refused while closed.
	const base = test.info().project.use.baseURL ?? '';
	const res = await page.request.post(`/r/${CRTOK}?/save`, {
		headers: { origin: base },
		form: { [`value.e2e-rank-co1`]: '2', [`value.e2e-rank-co2`]: '1', note: '' }
	});
	expect(await res.json()).toMatchObject({ type: 'failure', status: 403 });
	await expect.poll(() => responseValues(CINV)).toEqual({ 'e2e-rank-co1': 1, 'e2e-rank-co2': 2 });
});
