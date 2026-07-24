import { test, expect, type Browser, type Page } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import { roomResults, roomStatus, seedRoom, wipeRoom } from '../support/db';

// Planning poker: a real-time, controller-run estimation room
// (openspec/specs/planning-poker). Real-time is D1-backed and clients short-
// poll, so assertions wait for the ~1s loop via Playwright's auto-retrying
// expect. Two browser contexts stand in for the controller and a participant.
// English browser so bare m.*() matches the page (poker renders baseLocale).
test.use({ locale: 'en-US', timezoneId: 'Europe/Copenhagen' });

// One seeded room per test, reset in beforeEach. Own e2e-poker-* family.
const ROOM = 'e2e-poker-room';
const CTOK = 'e2e-poker-ctok';
const JTOK = 'e2e-poker-jtok';

function seedFresh() {
	wipeRoom(ROOM);
	seedRoom({ id: ROOM, title: 'Sprint 12 (e2e)', controllerToken: CTOK, joinToken: JTOK });
}
test.beforeEach(() => {
	// Realtime flows drive up to three browser contexts (controller + two
	// participants) each polling ~1s, so they run well past the 30s default.
	test.setTimeout(90_000);
	seedFresh();
});
test.afterAll(() => wipeRoom(ROOM));

// Open a participant in its own context (own cookie = own seat) and join.
async function joinParticipant(
	browser: Browser,
	name: string,
	opts: { observer?: boolean } = {}
): Promise<{ page: Page; close: () => Promise<void> }> {
	const ctx = await browser.newContext({ locale: 'en-US', timezoneId: 'Europe/Copenhagen' });
	const page = await ctx.newPage();
	await page.goto(`/poker/j/${JTOK}`);
	await page.getByLabel(m.pokerNameLabel()).fill(name);
	if (opts.observer) await page.getByRole('checkbox').check();
	await page.getByRole('button', { name: m.pokerJoinButton() }).click();
	return { page, close: () => ctx.close() };
}

async function openController(
	browser: Browser
): Promise<{ page: Page; close: () => Promise<void> }> {
	const ctx = await browser.newContext({ locale: 'en-US', timezoneId: 'Europe/Copenhagen' });
	const page = await ctx.newPage();
	await page.goto(`/poker/c/${CTOK}`);
	return { page, close: () => ctx.close() };
}

// --- Requirement: Create a planning-poker room ---

test('creating a room lands on the controller console with a join link', async ({ page }) => {
	await page.goto('/poker/new');
	await page.getByLabel(m.pokerRoomNameLabel()).fill('Backlog grooming');
	await page.getByRole('button', { name: m.pokerCreateButton() }).click();

	await expect(page).toHaveURL(/\/poker\/c\//);
	await expect(page.getByRole('heading', { name: 'Backlog grooming' })).toBeVisible();
	// The shareable join link is shown.
	await expect(page.getByText(m.pokerJoinLinkLabel())).toBeVisible();
});

// --- Requirement: Join a room and be remembered ---

test('joining by name appears in the roster for everyone live', async ({ browser }) => {
	const c = await openController(browser);
	const p = await joinParticipant(browser, 'Alice');

	// The controller sees Alice's seat appear without reloading.
	await expect(c.page.getByText('Alice')).toBeVisible();
	await expect(p.page.getByText('Alice')).toBeVisible();

	await p.close();
	await c.close();
});

test('a refresh resumes the same seat, no duplicate', async ({ browser }) => {
	const p = await joinParticipant(browser, 'Alice');
	// Seated: the join form is gone.
	await expect(p.page.getByRole('button', { name: m.pokerJoinButton() })).toBeHidden();

	await p.page.reload();
	// Still seated after reload (no name form), exactly one Alice.
	await expect(p.page.getByRole('button', { name: m.pokerJoinButton() })).toBeHidden();
	await expect(p.page.getByText('Alice')).toHaveCount(1);

	await p.close();
});

test('a closed room shows the final log and offers no vote', async ({ browser }) => {
	// Pre-close the room by seeding it closed.
	wipeRoom(ROOM);
	seedRoom({
		id: ROOM,
		title: 'Sprint 12 (e2e)',
		controllerToken: CTOK,
		joinToken: JTOK,
		status: 'closed'
	});
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	await page.goto(`/poker/j/${JTOK}`);

	await expect(page.getByText(m.pokerClosedNotice())).toBeVisible();
	await expect(page.getByLabel(m.pokerNameLabel())).toBeHidden();

	await ctx.close();
});

// --- Requirement: Controller drives the per-item phases + Live propagation ---

test('opening voting reaches a joined participant live', async ({ browser }) => {
	const c = await openController(browser);
	const p = await joinParticipant(browser, 'Alice');

	await c.page.getByLabel(m.pokerNextItemLabel()).fill('PROJ-42 login');
	await c.page.getByRole('button', { name: m.pokerOpenVoting() }).click();

	// Both flip to the voting phase; the participant sees the item and a deck.
	await expect(p.page.getByTestId('poker-active-item')).toHaveText('PROJ-42 login');
	await expect(p.page.getByText(m.pokerPickACard())).toBeVisible();

	await p.close();
	await c.close();
});

test('a participant has no way to drive the phase (no reveal control)', async ({ browser }) => {
	const c = await openController(browser);
	const p = await joinParticipant(browser, 'Alice');
	await c.page.getByLabel(m.pokerNextItemLabel()).fill('PROJ-9');
	await c.page.getByRole('button', { name: m.pokerOpenVoting() }).click();
	await expect(p.page.getByTestId('poker-active-item')).toBeVisible();

	// The participant view never offers the controller's reveal action.
	await expect(p.page.getByRole('button', { name: m.pokerReveal() })).toHaveCount(0);

	await p.close();
	await c.close();
});

// --- Requirement: Cast a hidden vote + Synchronized reveal ---

test('votes stay hidden until the reveal, then flip face-up', async ({ browser }) => {
	const c = await openController(browser);
	const p = await joinParticipant(browser, 'Alice');
	await c.page.getByLabel(m.pokerNextItemLabel()).fill('PROJ-42');
	await c.page.getByRole('button', { name: m.pokerOpenVoting() }).click();

	// Alice votes 5 from the deck.
	await p.page.getByTestId('poker-active-item').waitFor();
	await p.page.getByRole('button', { name: '5', exact: true }).click();

	// Alice shows as present in the controller's roster, but her number is not
	// shown while voting (privacy: card values are withheld before reveal).
	const roster = c.page.locator('section', { hasText: m.pokerRosterHeading() });
	await expect(roster.getByText('Alice')).toBeVisible();
	await expect(roster.getByText('5', { exact: true })).toHaveCount(0);

	// Reveal: her card is now face-up in the roster.
	await c.page.getByRole('button', { name: m.pokerReveal() }).click();
	await expect(roster.getByText('5', { exact: true })).toBeVisible();

	await p.close();
	await c.close();
});

// --- Requirement: Agreement signal + Controller records the final estimate ---

test('the room agrees, the suggestion is offered, and the estimate is recorded', async ({
	browser
}) => {
	const c = await openController(browser);
	const a = await joinParticipant(browser, 'Alice');
	const b = await joinParticipant(browser, 'Bob');
	await c.page.getByLabel(m.pokerNextItemLabel()).fill('PROJ-42');
	await c.page.getByRole('button', { name: m.pokerOpenVoting() }).click();

	for (const pg of [a.page, b.page]) {
		await pg.getByTestId('poker-active-item').waitFor();
		await pg.getByRole('button', { name: '5', exact: true }).click();
	}

	await c.page.getByRole('button', { name: m.pokerReveal() }).click();
	await expect(c.page.getByText(m.pokerSignalAgree())).toBeVisible();

	// Record the estimate from the finalize row, then it lands in the results log.
	await c.page
		.getByTestId('poker-finalize')
		.getByRole('button', { name: '5', exact: true })
		.click();
	await expect(c.page.getByTestId('poker-results').getByText('PROJ-42')).toBeVisible();
	await expect.poll(() => roomResults(ROOM)).toEqual([{ title: 'PROJ-42', estimate: '5' }]);

	await a.close();
	await b.close();
	await c.close();
});

test('more than one deck step apart is a spread', async ({ browser }) => {
	const c = await openController(browser);
	const a = await joinParticipant(browser, 'Alice');
	const b = await joinParticipant(browser, 'Bob');
	await c.page.getByLabel(m.pokerNextItemLabel()).fill('PROJ-77');
	await c.page.getByRole('button', { name: m.pokerOpenVoting() }).click();

	await a.page.getByTestId('poker-active-item').waitFor();
	await a.page.getByRole('button', { name: '3', exact: true }).click();
	await b.page.getByTestId('poker-active-item').waitFor();
	await b.page.getByRole('button', { name: '13', exact: true }).click();

	await c.page.getByRole('button', { name: m.pokerReveal() }).click();
	await expect(c.page.getByText(m.pokerSignalSpread())).toBeVisible();

	await a.close();
	await b.close();
	await c.close();
});

test('an infinity vote forces a spread even when the numbers agree', async ({ browser }) => {
	const c = await openController(browser);
	const a = await joinParticipant(browser, 'Alice');
	const b = await joinParticipant(browser, 'Bob');
	await c.page.getByLabel(m.pokerNextItemLabel()).fill('PROJ-88');
	await c.page.getByRole('button', { name: m.pokerOpenVoting() }).click();

	await a.page.getByTestId('poker-active-item').waitFor();
	await a.page.getByRole('button', { name: '5', exact: true }).click();
	await b.page.getByTestId('poker-active-item').waitFor();
	// The infinity card, by its accessible label.
	await b.page.getByRole('button', { name: m.pokerCardInfinity() }).click();

	await c.page.getByRole('button', { name: m.pokerReveal() }).click();
	await expect(c.page.getByText(m.pokerSignalSpread())).toBeVisible();

	await a.close();
	await b.close();
	await c.close();
});

// --- Requirement: Close the room ---

test('closing the room ends estimation for participants', async ({ browser }) => {
	const c = await openController(browser);
	const p = await joinParticipant(browser, 'Alice');

	await c.page.getByRole('button', { name: m.pokerCloseRoom() }).click();

	await expect(p.page.getByText(m.pokerClosedNotice())).toBeVisible();
	await expect.poll(() => roomStatus(ROOM)).toBe('closed');

	await p.close();
	await c.close();
});
