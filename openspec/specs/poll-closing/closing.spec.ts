import { test, expect, type Page } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import {
	eventStatus,
	optionIds,
	seedDateOption,
	seedEvent,
	seedInvitee,
	seedResponse,
	selectedOptionIds,
	wipeEvent
} from '../support/db';

// Closing a poll records a decision (specs/poll-closing): the organizer picks
// one or more dates and confirms, or cancels outright; participant links then
// show the outcome. Own event ids/tokens so seeds don't collide with other specs.

const OTOK = 'e2e-close-otok';
const RTOK = 'e2e-close-rtok';
const EV = 'e2e-close-ev';
const DA = 'e2e-close-da';
const DB = 'e2e-close-db';

function seed() {
	wipeEvent(EV);
	seedEvent({ id: EV, title: 'Lukning (e2e)', organizerToken: OTOK, status: 'open' });
	seedDateOption({ id: DA, eventId: EV, startsAt: '2026-09-12T08:00:00Z', sortOrder: 0 });
	seedDateOption({ id: DB, eventId: EV, startsAt: '2026-09-20T08:00:00Z', sortOrder: 1 });
	seedInvitee({ id: 'e2e-close-inv', eventId: EV, label: 'Anna', token: RTOK });
	seedResponse({ inviteeId: 'e2e-close-inv', dateOptionId: DB, preference: 'preferred' });
}

test.beforeEach(seed);

// The selection checkbox on the result card for one date, located via the
// card's weekday text (12 Sep 2026 is a Saturday, 20 Sep a Sunday).
function checkboxFor(page: Page, weekday: 'Saturday' | 'Sunday') {
	return page
		.locator('div.rounded-card', { has: page.getByRole('checkbox', { name: m.selectDateLabel() }) })
		.filter({ hasText: weekday })
		.getByRole('checkbox', { name: m.selectDateLabel() });
}

async function enterSelectionMode(page: Page) {
	await page.goto(`/e/${OTOK}`);
	await page.getByRole('button', { name: m.closePoll() }).click();
	await expect(page.getByText(m.closeSelectHint())).toBeVisible();
}

test('confirm is disabled until a date is picked; backing out changes nothing', async ({
	page
}) => {
	await enterSelectionMode(page);
	await expect(page.getByRole('button', { name: m.confirmClose() })).toBeDisabled();

	await page.getByRole('button', { name: m.closeBack() }).click();
	await expect(page.getByText(m.closeSelectHint())).toHaveCount(0);
	expect(eventStatus(EV)).toBe('open');
	expect(selectedOptionIds(EV)).toEqual([]);
});

test('closing with one date records it and shows the outcome banner', async ({ page }) => {
	await enterSelectionMode(page);
	await checkboxFor(page, 'Sunday').check();
	await page.getByRole('button', { name: m.confirmClose() }).click();

	await expect(page.getByText(m.chosenDateHeading())).toBeVisible();
	await expect(page.getByText(m.chosenBadge(), { exact: true })).toHaveCount(1);
	await expect.poll(() => eventStatus(EV)).toBe('closed');
	expect(selectedOptionIds(EV)).toEqual([DB]);
});

test('closing with several dates flags and badges them all', async ({ page }) => {
	await enterSelectionMode(page);
	await checkboxFor(page, 'Saturday').check();
	await checkboxFor(page, 'Sunday').check();
	await page.getByRole('button', { name: m.confirmClose() }).click();

	await expect(page.getByText(m.chosenDatesHeading())).toBeVisible();
	await expect(page.getByText(m.chosenBadge(), { exact: true })).toHaveCount(2);
	await expect.poll(() => selectedOptionIds(EV)).toEqual([DA, DB]);
});

test('a decided poll shows the outcome and distribution on the invitee link', async ({ page }) => {
	seedDecided();
	await page.goto(`/r/${RTOK}`);

	// The chosen date, prominent, and the per-date bars - but no way to answer
	// and no respondent names (counts only on participant pages).
	await expect(page.getByText(m.chosenDateHeading())).toBeVisible();
	await expect(page.getByText(m.distributionHeading())).toBeVisible();
	await expect(page.getByText(m.prefPreferred()).first()).toBeVisible();
	await expect(page.getByText(m.chosenBadge(), { exact: true })).toHaveCount(1);
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toHaveCount(0);
	await expect(page.getByText('Anna')).toHaveCount(0);
});

test('a decided open-mode poll shows the outcome on the shared link', async ({ page }) => {
	const SHARE = 'e2e-close-share';
	seedDecided({ pollMode: 'open', shareToken: SHARE });
	await page.goto(`/s/${SHARE}`);

	await expect(page.getByText(m.chosenDateHeading())).toBeVisible();
	await expect(page.getByText(m.distributionHeading())).toBeVisible();
	// No name field, no submit - the poll is decided.
	await expect(page.getByLabel(m.namePrompt())).toHaveCount(0);
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toHaveCount(0);
});

// Re-seed as already closed with DB chosen (same shape `closing with one date`
// produces), so the participant-view tests don't depend on the close flow.
function seedDecided(extra: { pollMode?: 'assigned' | 'open'; shareToken?: string } = {}) {
	wipeEvent(EV);
	seedEvent({
		id: EV,
		title: 'Lukning (e2e)',
		organizerToken: OTOK,
		status: 'closed',
		...extra
	});
	seedDateOption({ id: DA, eventId: EV, startsAt: '2026-09-12T08:00:00Z', sortOrder: 0 });
	seedDateOption({
		id: DB,
		eventId: EV,
		startsAt: '2026-09-20T08:00:00Z',
		sortOrder: 1,
		selected: true
	});
	seedInvitee({ id: 'e2e-close-inv', eventId: EV, label: 'Anna', token: RTOK });
	seedResponse({ inviteeId: 'e2e-close-inv', dateOptionId: DB, preference: 'preferred' });
}

test('cancelling closes without a decision; dismissing the warning keeps it open', async ({
	page
}) => {
	await enterSelectionMode(page);

	// Dismiss → still open.
	page.once('dialog', (d) => {
		expect(d.message()).toBe(m.confirmCancelPoll());
		void d.dismiss();
	});
	await page.getByRole('button', { name: m.cancelPoll() }).click();
	expect(eventStatus(EV)).toBe('open');

	// Accept → cancelled, no chosen dates, invitee sees the cancelled message.
	page.once('dialog', (d) => void d.accept());
	await page.getByRole('button', { name: m.cancelPoll() }).click();
	await expect(page.getByText(m.cancelledBanner()).first()).toBeVisible();
	await expect.poll(() => eventStatus(EV)).toBe('cancelled');
	expect(selectedOptionIds(EV)).toEqual([]);

	await page.goto(`/r/${RTOK}`);
	await expect(page.getByText(m.cancelledMessage())).toBeVisible();
	await expect(page.getByText(m.distributionHeading())).toHaveCount(0);
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toHaveCount(0);
});

test('close stops response edits; reopen restores them', async ({ page }) => {
	await enterSelectionMode(page);
	await checkboxFor(page, 'Sunday').check();
	await page.getByRole('button', { name: m.confirmClose() }).click();
	await expect(page.getByText(m.chosenDateHeading())).toBeVisible();
	await expect.poll(() => selectedOptionIds(EV)).toEqual([DB]);

	// The invitee link is now read-only and shows the outcome instead of a form.
	await page.goto(`/r/${RTOK}`);
	await expect(page.getByText(m.chosenDateHeading())).toBeVisible();
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toHaveCount(0);

	// Reopen → the decision is discarded and the invitee can edit again. Anna
	// answered only one of the two dates, so her page opens straight into
	// editing (the unanswered-dates flow) - the visible submit button is
	// exactly the "edits restored" signal.
	await page.goto(`/e/${OTOK}`);
	await page.getByRole('button', { name: m.reopenPoll() }).click();
	await expect(page.getByText(m.chosenDateHeading())).toHaveCount(0);
	await expect.poll(() => selectedOptionIds(EV)).toEqual([]);
	await page.goto(`/r/${RTOK}`);
	await expect(page.getByText(m.closedBanner())).toHaveCount(0);
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toBeVisible();
});

test('closing with an option from another poll is rejected', async ({ request }) => {
	// A second poll's option id must not be acceptable as this poll's decision.
	wipeEvent('e2e-close-fev');
	seedEvent({
		id: 'e2e-close-fev',
		title: 'Anden',
		organizerToken: 'e2e-close-fotok',
		status: 'open'
	});
	seedDateOption({
		id: 'e2e-close-fopt',
		eventId: 'e2e-close-fev',
		startsAt: '2026-09-25T08:00:00Z',
		sortOrder: 0
	});
	const res = await request.post(`/e/${OTOK}?/close`, {
		form: { selectedOptionIds: 'e2e-close-fopt' },
		headers: { origin: 'http://localhost:8787' }
	});
	expect(await res.json()).toMatchObject({ type: 'failure', status: 400 });
	expect(eventStatus(EV)).toBe('open');
	expect(selectedOptionIds(EV)).toEqual([]);
});

test('reopening a cancelled poll behaves like a reopened closed poll', async ({ page }) => {
	// Re-seed as already cancelled: no chosen dates, responses locked.
	wipeEvent(EV);
	seedEvent({ id: EV, title: 'Lukning (e2e)', organizerToken: OTOK, status: 'cancelled' });
	seedDateOption({ id: DA, eventId: EV, startsAt: '2026-09-12T08:00:00Z', sortOrder: 0 });
	seedDateOption({ id: DB, eventId: EV, startsAt: '2026-09-20T08:00:00Z', sortOrder: 1 });
	seedInvitee({ id: 'e2e-close-inv', eventId: EV, label: 'Anna', token: RTOK });

	await page.goto(`/e/${OTOK}`);
	await page.getByRole('button', { name: m.reopenPoll() }).click();
	await expect.poll(() => eventStatus(EV)).toBe('open');
	expect(selectedOptionIds(EV)).toEqual([]);

	// The invitee can answer again.
	await page.goto(`/r/${RTOK}`);
	await expect(page.getByText(m.cancelledMessage())).toHaveCount(0);
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toBeVisible();
});

test('reopening clears the decision and closing again starts fresh', async ({ page }) => {
	seedDecided();
	await page.goto(`/e/${OTOK}`);
	await page.getByRole('button', { name: m.reopenPoll() }).click();

	await expect.poll(() => eventStatus(EV)).toBe('open');
	expect(selectedOptionIds(EV)).toEqual([]);

	// The next closing flow starts with nothing pre-picked.
	await page.getByRole('button', { name: m.closePoll() }).click();
	await expect(page.getByRole('button', { name: m.confirmClose() })).toBeDisabled();
});

test('a closed poll rejects option deletion server-side', async ({ request }) => {
	seedDecided();
	// Bypass the UI: post the removeOption action directly, like a stale tab or
	// a crafted request would. The recorded decision must survive.
	const res = await request.post(`/e/${OTOK}?/removeOption`, {
		form: { optionId: DB },
		headers: { origin: 'http://localhost:8787' }
	});
	// SvelteKit wraps action failures in a 200 JSON envelope for fetch-style
	// posts - the rejection lives in the body.
	expect(await res.json()).toMatchObject({ type: 'failure', status: 409 });
	expect(optionIds(EV)).toEqual([DA, DB]);
	expect(selectedOptionIds(EV)).toEqual([DB]);
});

test('a closed poll rejects option reorder server-side', async ({ request }) => {
	seedDecided();
	// Reordering is a mutation too - move and sort must both bounce off a
	// closed poll, leaving the recorded order intact.
	const move = await request.post(`/e/${OTOK}?/moveOption`, {
		form: { optionId: DA, direction: 'down' },
		headers: { origin: 'http://localhost:8787' }
	});
	expect(await move.json()).toMatchObject({ type: 'failure', status: 409 });
	const sort = await request.post(`/e/${OTOK}?/sortOptions`, {
		form: {},
		headers: { origin: 'http://localhost:8787' }
	});
	expect(await sort.json()).toMatchObject({ type: 'failure', status: 409 });
	expect(optionIds(EV)).toEqual([DA, DB]);
});
