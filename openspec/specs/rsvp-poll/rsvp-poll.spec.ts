import { test, expect, type Page } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import {
	d1,
	eventChoices,
	eventPollType,
	eventStatus,
	optionIds,
	responsesFor,
	seedDateOption,
	seedEvent,
	seedInvitee,
	seedResponse,
	selectedOptionIds,
	inviteesFor,
	wipeEvent
} from '../support/db';

// RSVP polls: one fixed date/time, yes/no answers, headcount, confirm-or-call-off
// closing (openspec/specs/rsvp-poll). English browser so bare m.*() matches.
test.use({ locale: 'en-US', timezoneId: 'Europe/Copenhagen' });

// Main open assigned-mode RSVP poll, reseeded by every mutating test:
// Anna answered yes, Bo answered no, Clara hasn't answered.
const EV = 'e2e-rsvp-ev';
const OTOK = 'e2e-rsvp-otok';
const O1 = 'e2e-rsvp-o1';
const ANNA = 'e2e-rsvp-anna';
const ANNA_TOK = 'e2e-rsvp-anna-tok';
const BO = 'e2e-rsvp-bo';
const CLARA = 'e2e-rsvp-clara';
const TITLE = 'Housewarming (e2e)';
const START = '2026-09-12T16:00:00Z'; // 18:00 in Copenhagen

function seed() {
	wipeEvent(EV);
	seedEvent({
		id: EV,
		title: TITLE,
		organizerToken: OTOK,
		status: 'open',
		pollType: 'rsvp',
		allowPreferred: false,
		allowUnsure: false
	});
	seedDateOption({ id: O1, eventId: EV, startsAt: START, sortOrder: 0 });
	seedInvitee({ id: ANNA, eventId: EV, label: 'Anna', token: ANNA_TOK });
	seedInvitee({ id: BO, eventId: EV, label: 'Bo', token: 'e2e-rsvp-bo-tok' });
	seedInvitee({ id: CLARA, eventId: EV, label: 'Clara', token: 'e2e-rsvp-clara-tok' });
	seedResponse({ inviteeId: ANNA, dateOptionId: O1, preference: 'available' });
	seedResponse({ inviteeId: BO, dateOptionId: O1, preference: 'unavailable' });
}

test.beforeAll(seed);

// The dashboard's headcount lives under the results heading; scoped because
// the invitees section repeats names and the pending wording.
function resultsSection(page: Page) {
	return page.locator('section').filter({ hasText: m.resultsSection() });
}

// --- Requirement: Create an RSVP poll ---

test('creating an RSVP event with one date lands on the dashboard', async ({ page }) => {
	await page.goto('/create');
	await page.getByRole('radio', { name: m.pollTypeRsvp() }).check();
	await page.getByLabel(m.fieldTitle()).fill('Garden party');
	await page.getByRole('button', { name: '12', exact: true }).click();
	await page.locator('input[name="dates.0.startTime"]').fill('18:00');
	await page.getByRole('button', { name: m.create() }).click();
	// A real /e/{token} only exists because the event row was written (D1-backed).
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	const otok = page.url().split('/').pop() ?? '';
	const id = d1(`SELECT id FROM events WHERE organizer_token = '${otok}'`).results[0].id as string;
	expect(eventPollType(id)).toBe('rsvp');
	expect(optionIds(id)).toHaveLength(1);
	// Strict yes/no: both choice toggles forced off at creation.
	expect(eventChoices(id)).toEqual({ allowPreferred: false, allowUnsure: false });
});

test('a crafted RSVP creation with two dates is rejected', async ({ page }) => {
	const base = test.info().project.use.baseURL ?? '';
	// The single-select calendar can't post two dates - only a crafted request can.
	await page.request.post('/create?/create', {
		headers: { origin: base },
		form: {
			title: 'Two dates (e2e-rsvp)',
			description: '',
			locale: 'en',
			timezone: 'Europe/Copenhagen',
			pollMode: 'assigned',
			pollType: 'rsvp',
			'dates.0.value': '2026-09-12',
			'dates.1.value': '2026-09-13'
		}
	});
	await expect
		.poll(
			() => d1(`SELECT COUNT(*) AS n FROM events WHERE title = 'Two dates (e2e-rsvp)'`).results[0].n
		)
		.toBe(0);
});

test('the RSVP create form offers no choice toggles', async ({ page }) => {
	await page.goto('/create');
	// Dates type shows the answer-choice toggles...
	await expect(page.getByText(m.fieldChoices())).toBeVisible();
	await page.getByRole('radio', { name: m.pollTypeRsvp() }).check();
	// ...the RSVP type offers neither them nor their heading.
	await expect(page.getByText(m.fieldChoices())).toHaveCount(0);
	await expect(page.getByText(m.prefPreferred())).toHaveCount(0);
	await expect(page.getByText(m.prefUnsure())).toHaveCount(0);
});

// --- Requirement: Answer yes or no ---

test('an invitee answers yes through their link and gets a confirmation', async ({ page }) => {
	seed();
	seedResponse({ inviteeId: CLARA, dateOptionId: O1, preference: 'unavailable' });
	d1(`DELETE FROM responses WHERE invitee_id = '${ANNA}'`);
	await page.goto(`/r/${ANNA_TOK}`);
	// Exactly yes and no - none of the date-poll wording.
	await expect(page.getByRole('button', { name: m.prefAvailableRsvp() })).toBeVisible();
	await expect(page.getByRole('button', { name: m.prefUnavailableRsvp() })).toBeVisible();
	await expect(page.getByText(m.prefPreferred())).toHaveCount(0);
	await page.getByRole('button', { name: m.prefAvailableRsvp() }).click();
	await page.getByRole('button', { name: m.sendAnswer() }).click();
	// The answered notice (a toast repeats the same copy, hence .first()).
	await expect(page.getByText(m.savedTitle()).first()).toBeVisible();
	await expect
		.poll(() => responsesFor(ANNA))
		.toEqual([{ date_option_id: O1, preference: 'available' }]);
});

test('a visitor answers through the shared link and gets a personal edit link', async ({
	page
}) => {
	const SEV = 'e2e-rsvp-sev';
	wipeEvent(SEV);
	seedEvent({
		id: SEV,
		title: 'Open house (e2e)',
		organizerToken: 'e2e-rsvp-sotok',
		shareToken: 'e2e-rsvp-stok',
		status: 'open',
		pollMode: 'open',
		pollType: 'rsvp',
		allowPreferred: false,
		allowUnsure: false
	});
	seedDateOption({ id: 'e2e-rsvp-so1', eventId: SEV, startsAt: START, sortOrder: 0 });

	await page.goto('/s/e2e-rsvp-stok');
	await page.getByLabel(m.namePrompt()).fill('Dora');
	await page.getByRole('button', { name: m.prefUnavailableRsvp() }).click();
	await page.getByRole('button', { name: m.sendAnswer() }).click();
	await expect(page.getByText(m.editLinkTitle())).toBeVisible();
	await expect.poll(() => inviteesFor(SEV)).toHaveLength(1);
	const dora = inviteesFor(SEV)[0];
	expect(dora.label).toBe('Dora');
	expect(responsesFor(dora.id)).toEqual([
		{ date_option_id: 'e2e-rsvp-so1', preference: 'unavailable' }
	]);
});

test('a crafted submission with a non-yes/no choice is rejected', async ({ page }) => {
	seed();
	d1(`DELETE FROM responses WHERE invitee_id = '${ANNA}'`);
	const base = test.info().project.use.baseURL ?? '';
	await page.request.post(`/r/${ANNA_TOK}?/save`, {
		headers: { origin: base },
		form: { [`pref.${O1}`]: 'preferred', note: '' }
	});
	// The disabled choice was rejected; nothing was stored.
	await expect.poll(() => responsesFor(ANNA)).toEqual([]);
});

// --- Requirement: Organizer headcount ---

test('the assigned-mode dashboard shows coming, not coming, and pending with names', async ({
	page
}) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	const results = resultsSection(page);
	// One coming (Anna), one not coming (Bo), Clara pending - names with each.
	await expect(results.getByText(m.headcountComing(), { exact: true })).toBeVisible();
	await expect(results.getByText('Anna')).toBeVisible();
	await expect(results.getByText(m.headcountNotComing(), { exact: true })).toBeVisible();
	await expect(results.getByText('Bo')).toBeVisible();
	await expect(results.getByText(m.pending())).toBeVisible();
	await expect(results.getByText('Clara')).toBeVisible();
	await expect(results.getByText(m.answeredLabel({ total: 2, totalInvitees: 3 }))).toBeVisible();
	// No date-poll results matrix: no per-choice count bars.
	await expect(results.getByText(m.prefAvailable(), { exact: true })).toHaveCount(0);
});

test('the open-mode dashboard shows names with counts and no pending denominator', async ({
	page
}) => {
	const OEV = 'e2e-rsvp-oev';
	wipeEvent(OEV);
	seedEvent({
		id: OEV,
		title: 'Open headcount (e2e)',
		organizerToken: 'e2e-rsvp-ootok',
		shareToken: 'e2e-rsvp-ostok',
		status: 'open',
		pollMode: 'open',
		pollType: 'rsvp',
		allowPreferred: false,
		allowUnsure: false
	});
	seedDateOption({ id: 'e2e-rsvp-oo1', eventId: OEV, startsAt: START, sortOrder: 0 });
	for (const [i, name] of ['Eva', 'Finn'].entries()) {
		seedInvitee({ id: `e2e-rsvp-oinv${i}`, eventId: OEV, label: name, token: `e2e-rsvp-otok${i}` });
		seedResponse({
			inviteeId: `e2e-rsvp-oinv${i}`,
			dateOptionId: 'e2e-rsvp-oo1',
			preference: 'available'
		});
	}

	await page.goto('/e/e2e-rsvp-ootok');
	const results = resultsSection(page);
	await expect(results.getByText('Eva')).toBeVisible();
	await expect(results.getByText('Finn')).toBeVisible();
	// Open mode has no fixed roster: counts only, no "of Y" and no pending row.
	await expect(page.getByText(m.answeredLabelOpen({ total: 2 }))).toBeVisible();
	await expect(results.getByText(m.pending())).toHaveCount(0);
});

// --- Requirement: Move the event's date ---

test("changing the date's start time keeps every answer", async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	await page
		.locator('section')
		.filter({ hasText: m.dateSectionRsvp() })
		.getByRole('button', { name: m.edit() })
		.click();
	const form = page.locator('form[action="?/editOption"]');
	await form.locator('input[name="startTime"]').fill('20:00');
	await form.getByRole('button', { name: m.save() }).click();
	// 20:00 Copenhagen summer time = 18:00 UTC.
	await expect
		.poll(() => d1(`SELECT starts_at FROM date_options WHERE id = '${O1}'`).results[0].starts_at)
		.toBe('2026-09-12T18:00:00.000Z');
	expect(responsesFor(ANNA)).toHaveLength(1);
	expect(responsesFor(BO)).toHaveLength(1);
});

test('adding a second date is rejected and the poll keeps its single date', async ({ page }) => {
	seed();
	// The dashboard offers no add/remove affordances on an RSVP (the invitees
	// section has its own remove buttons, hence the date-section scope)...
	await page.goto(`/e/${OTOK}`);
	const dateSection = page.locator('section').filter({ hasText: m.dateSectionRsvp() });
	await expect(page.getByRole('button', { name: m.addDate() })).toHaveCount(0);
	await expect(dateSection.getByRole('button', { name: m.remove() })).toHaveCount(0);
	// ...and a crafted POST is rejected server-side.
	const base = test.info().project.use.baseURL ?? '';
	await page.request.post(`/e/${OTOK}?/addOption`, {
		headers: { origin: base },
		form: { 'dates.0.value': '2026-09-13' }
	});
	await expect.poll(() => optionIds(EV)).toEqual([O1]);
});

// --- Requirement: Confirm or call off ---

test('confirming the event closes it with its single date chosen', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	await page.getByRole('button', { name: m.closePoll() }).click();
	// No date selection step: confirm directly.
	await expect(page.getByText(m.closeSelectHintRsvp())).toBeVisible();
	await page.getByRole('button', { name: m.confirmEventRsvp() }).click();
	await expect.poll(() => eventStatus(EV)).toBe('closed');
	expect(selectedOptionIds(EV)).toEqual([O1]);
	// Answers are frozen: the invitee page offers no controls.
	await page.goto(`/r/${ANNA_TOK}`);
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toHaveCount(0);
});

test('an invitee sees the confirmed outcome as date plus counts only', async ({ page }) => {
	const CEV = 'e2e-rsvp-cev';
	const CRTOK = 'e2e-rsvp-crtok';
	wipeEvent(CEV);
	seedEvent({
		id: CEV,
		title: 'Confirmed dinner (e2e)',
		organizerToken: 'e2e-rsvp-cotok',
		status: 'closed',
		pollType: 'rsvp',
		allowPreferred: false,
		allowUnsure: false
	});
	seedDateOption({
		id: 'e2e-rsvp-co1',
		eventId: CEV,
		startsAt: START,
		sortOrder: 0,
		selected: true
	});
	seedInvitee({ id: 'e2e-rsvp-cinv', eventId: CEV, label: 'Greta', token: CRTOK });
	seedInvitee({ id: 'e2e-rsvp-cinv2', eventId: CEV, label: 'Hugo', token: 'e2e-rsvp-crtok2' });
	seedResponse({
		inviteeId: 'e2e-rsvp-cinv',
		dateOptionId: 'e2e-rsvp-co1',
		preference: 'available'
	});
	seedResponse({
		inviteeId: 'e2e-rsvp-cinv2',
		dateOptionId: 'e2e-rsvp-co1',
		preference: 'unavailable'
	});

	await page.goto(`/r/${CRTOK}`);
	// The event is happening at its date/time, shown prominently.
	await expect(page.getByText(m.confirmedHeadingRsvp())).toBeVisible();
	await expect(page.getByText('18:00').first()).toBeVisible();
	// The final headcount, counts only - no names.
	await expect(page.getByText(m.headcountComing(), { exact: true })).toBeVisible();
	await expect(page.getByText(m.headcountNotComing(), { exact: true })).toBeVisible();
	await expect(page.getByText('Greta')).toHaveCount(0);
	await expect(page.getByText('Hugo')).toHaveCount(0);
	// No answer controls.
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toHaveCount(0);
	await expect(page.getByRole('button', { name: m.prefAvailableRsvp() })).toHaveCount(0);
});

test('calling the event off shows the called-off message on every link', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	await page.getByRole('button', { name: m.closePoll() }).click();
	page.once('dialog', (d) => {
		expect(d.message()).toBe(m.confirmCancelPollRsvp());
		void d.accept();
	});
	await page.getByRole('button', { name: m.cancelPoll() }).click();
	await expect.poll(() => eventStatus(EV)).toBe('cancelled');
	await page.goto(`/r/${ANNA_TOK}`);
	await expect(page.getByText(m.cancelledMessageRsvp())).toBeVisible();
	// Called off: no headcount shown.
	await expect(page.getByText(m.headcountComing(), { exact: true })).toHaveCount(0);
});

test('reopening a confirmed RSVP clears the decision and reopens answering', async ({ page }) => {
	seed();
	d1(`UPDATE events SET status = 'closed' WHERE id = '${EV}'`);
	d1(`UPDATE date_options SET selected = 1 WHERE id = '${O1}'`);
	await page.goto(`/e/${OTOK}`);
	await page.getByRole('button', { name: m.reopenPoll() }).click();
	await expect.poll(() => eventStatus(EV)).toBe('open');
	expect(selectedOptionIds(EV)).toEqual([]);
	await page.goto(`/r/${ANNA_TOK}`);
	await expect(page.getByRole('button', { name: m.editAnswer() })).toBeVisible();
});
