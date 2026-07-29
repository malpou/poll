import { test, expect, type Browser, type Page } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import {
	roomEmail,
	roomIdByControllerToken,
	roomJoinToken,
	roomResults,
	roomStatus,
	seedRoom,
	wipeRoom
} from '../support/db';

// Planning poker: a real-time, controller-run estimation room
// (openspec/specs/planning-poker). Real-time is D1-backed and clients short-
// poll, so assertions wait for the ~1s loop via Playwright's auto-retrying
// expect. Two browser contexts stand in for the controller and a participant.
// English browser so bare m.*() matches the page (rooms seeded without a
// language read as the base locale).
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
	await page.goto('/create?make=poker');
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

test('the roster reads alphabetically whoever joined first', async ({ browser }) => {
	const c = await openController(browser);
	// Joined out of order on purpose: the roster must not show join order.
	const charlie = await joinParticipant(browser, 'Charlie');
	const alice = await joinParticipant(browser, 'Alice');
	const bob = await joinParticipant(browser, 'Bob');

	const roster = c.page.locator('section', { hasText: m.pokerRosterHeading() });
	await expect(roster.locator('li')).toHaveText([/Alice/, /Bob/, /Charlie/]);

	// Still alphabetical while the votes land - order is by name until reveal.
	await c.page.getByLabel(m.pokerNextItemLabel()).fill('PROJ-42');
	await c.page.getByRole('button', { name: m.pokerOpenVoting() }).click();
	for (const p of [charlie, alice, bob]) {
		await p.page.getByTestId('poker-active-item').waitFor();
		await p.page.getByRole('button', { name: '5', exact: true }).click();
	}
	await expect(roster.locator('li')).toHaveText([/Alice/, /Bob/, /Charlie/]);

	await charlie.close();
	await alice.close();
	await bob.close();
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

test('the revealed roster reads by card, low to high', async ({ browser }) => {
	const c = await openController(browser);
	// Alphabetically Alice, Bob, Charlie - by card the other way round.
	const a = await joinParticipant(browser, 'Alice');
	const b = await joinParticipant(browser, 'Bob');
	const ch = await joinParticipant(browser, 'Charlie');
	await c.page.getByLabel(m.pokerNextItemLabel()).fill('PROJ-42');
	await c.page.getByRole('button', { name: m.pokerOpenVoting() }).click();

	for (const [pg, card] of [
		[a.page, '13'],
		[b.page, '8'],
		[ch.page, '3']
	] as const) {
		await pg.getByTestId('poker-active-item').waitFor();
		await pg.getByRole('button', { name: card, exact: true }).click();
	}
	await c.page.getByRole('button', { name: m.pokerReveal() }).click();

	const roster = c.page.locator('section', { hasText: m.pokerRosterHeading() });
	await expect(roster.locator('li')).toHaveText([/Charlie/, /Bob/, /Alice/]);

	await a.close();
	await b.close();
	await ch.close();
	await c.close();
});

test('a distribution card expands to name who played it', async ({ browser }) => {
	const c = await openController(browser);
	const a = await joinParticipant(browser, 'Alice');
	const b = await joinParticipant(browser, 'Bob');
	const d = await joinParticipant(browser, 'Dave');
	await c.page.getByLabel(m.pokerNextItemLabel()).fill('PROJ-42');
	await c.page.getByRole('button', { name: m.pokerOpenVoting() }).click();

	for (const [pg, card] of [
		[a.page, '5'],
		[b.page, '5'],
		[d.page, '8']
	] as const) {
		await pg.getByTestId('poker-active-item').waitFor();
		await pg.getByRole('button', { name: card, exact: true }).click();
	}
	await c.page.getByRole('button', { name: m.pokerReveal() }).click();

	// Stacks sit in deck order, so the first one is the "5".
	const five = c.page.getByTestId('poker-distribution').locator('details').first();
	await five.locator('summary').click();
	await expect(five.getByText('Alice')).toBeVisible();
	await expect(five.getByText('Bob')).toBeVisible();
	await expect(five.getByText('Dave')).toHaveCount(0);

	await a.close();
	await b.close();
	await d.close();
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

// --- Requirement: Call a coffee break ---

test('a break called between items reaches the whole room, named', async ({ browser }) => {
	const c = await openController(browser);
	const p = await joinParticipant(browser, 'Alice');

	// Waiting phase, no item open - the break is still available.
	await p.page.getByRole('button', { name: m.pokerCallBreak() }).click();
	await expect(c.page.getByText(m.pokerBreakCalledBy({ name: 'Alice' }))).toBeVisible();
	await expect(p.page.getByText(m.pokerBreakCalledBy({ name: 'Alice' }))).toBeVisible();

	await p.close();
	await c.close();
});

test('a break called mid-round is ended by anyone and holds nothing up', async ({ browser }) => {
	const c = await openController(browser);
	const p = await joinParticipant(browser, 'Alice');
	await c.page.getByLabel(m.pokerNextItemLabel()).fill('PROJ-99');
	await c.page.getByRole('button', { name: m.pokerOpenVoting() }).click();
	await p.page.getByTestId('poker-active-item').waitFor();

	await p.page.getByRole('button', { name: m.pokerCallBreak() }).click();
	await expect(c.page.getByTestId('poker-break')).toBeVisible();

	// The controller (who did not call it) ends it; voting was never blocked.
	await c.page.getByRole('button', { name: m.pokerEndBreak() }).click();
	await expect(p.page.getByTestId('poker-break')).toHaveCount(0);
	await p.page.getByRole('button', { name: '5', exact: true }).click();
	await c.page.getByRole('button', { name: m.pokerReveal() }).click();
	await expect(c.page.getByText(m.pokerSignalAgree())).toBeVisible();

	await p.close();
	await c.close();
});

test('opening the next item ends a standing break', async ({ browser }) => {
	const c = await openController(browser);
	const p = await joinParticipant(browser, 'Alice');

	await p.page.getByRole('button', { name: m.pokerCallBreak() }).click();
	await expect(c.page.getByTestId('poker-break')).toBeVisible();

	await c.page.getByLabel(m.pokerNextItemLabel()).fill('PROJ-100');
	await c.page.getByRole('button', { name: m.pokerOpenVoting() }).click();
	await expect(c.page.getByTestId('poker-break')).toHaveCount(0);
	await expect(p.page.getByTestId('poker-break')).toHaveCount(0);

	await p.close();
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

// --- Requirement: Create a planning-poker room (on the shared create page) ---

test('choosing a room asks only for a room name', async ({ page }) => {
	await page.goto('/create?make=poker');
	await expect(page.getByLabel(m.pokerRoomNameLabel())).toBeVisible();

	// None of the poll form's own fields are mounted, so none of them post.
	await expect(page.getByText(m.fieldPollType())).toHaveCount(0);
	await expect(page.getByText(m.datesSection())).toHaveCount(0);
	await expect(page.getByText(m.optionsSection())).toHaveCount(0);
	await expect(page.getByText(m.fieldMode())).toHaveCount(0);
	// Parity with polls: the same highlighter choice is offered.
	await expect(page.getByRole('radio', { name: m.accentPink() })).toBeVisible();
});

test('choosing a poll leaves poll creation unchanged', async ({ page }) => {
	await page.goto('/create?make=poker');
	await expect(page.getByLabel(m.pokerRoomNameLabel())).toBeVisible();

	// Switch back: the full poll form returns.
	await page.getByRole('radio', { name: m.createKindPoll() }).check();
	await expect(page.getByText(m.fieldPollType())).toBeVisible();
	await expect(page.getByText(m.fieldMode())).toBeVisible();
	await expect(page.getByRole('radio', { name: m.accentPink() })).toBeVisible();
	await expect(page.getByLabel(m.pokerRoomNameLabel())).toHaveCount(0);
});

test('a room wears the highlighter it was created with', async ({ page }) => {
	await page.goto('/create?make=poker&accent=pink');
	await page.getByLabel(m.pokerRoomNameLabel()).fill('Pink room (e2e)');
	await page.getByRole('button', { name: m.pokerCreateButton() }).click();

	await expect(page).toHaveURL(/\/poker\/c\//);
	await expect(page.getByTestId('poker-console')).toHaveAttribute('data-accent', 'pink');

	// And every participant sees the same, not their own preference.
	const roomId = roomIdByControllerToken(page.url().split('/').pop() as string);
	await page.goto(`/poker/j/${roomJoinToken(roomId)}`);
	await expect(page.getByTestId('poker-room')).toHaveAttribute('data-accent', 'pink');
});

test('a room without a name is rejected', async ({ page }) => {
	await page.goto('/create?make=poker');
	// The submit stays disabled until the room is named, so no room can be made.
	await expect(page.getByRole('button', { name: m.pokerCreateButton() })).toBeDisabled();
	await expect(page).toHaveURL(/\/create/);
});

// --- Requirement: Room language ---

test('a room renders in the language it was created in', async ({ page }) => {
	await page.goto('/da/create?make=poker');
	await page.getByLabel(m.pokerRoomNameLabel({}, { locale: 'da' })).fill('Sprint 13 (e2e)');
	await page.getByRole('button', { name: m.pokerCreateButton({}, { locale: 'da' }) }).click();

	await expect(page).toHaveURL(/\/poker\/c\//);
	// The console is Danish even though the browser asks for English.
	await expect(page.getByText(m.pokerRosterHeading({}, { locale: 'da' }))).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'da');
});

test('participants see the creator language, not their own', async ({ page, browser }) => {
	await page.goto('/da/create?make=poker');
	await page.getByLabel(m.pokerRoomNameLabel({}, { locale: 'da' })).fill('Sprint 14 (e2e)');
	await page.getByRole('button', { name: m.pokerCreateButton({}, { locale: 'da' }) }).click();
	await expect(page).toHaveURL(/\/poker\/c\//);

	const roomId = roomIdByControllerToken(page.url().split('/').pop() as string);
	const ctx = await browser.newContext({ locale: 'fr-FR' });
	const p = await ctx.newPage();
	await p.goto(`/poker/j/${roomJoinToken(roomId)}`);

	// A French browser still gets the room's Danish.
	await expect(p.getByLabel(m.pokerNameLabel({}, { locale: 'da' }))).toBeVisible();
	await ctx.close();
});

// --- Requirement: Reveal waits for everyone present ---

test('the reveal is held while someone has not voted, and frees up on the last vote', async ({
	browser
}) => {
	const c = await openController(browser);
	const a = await joinParticipant(browser, 'Alice');
	const b = await joinParticipant(browser, 'Bob');
	await c.page.getByLabel(m.pokerNextItemLabel()).fill('PROJ-100');
	await c.page.getByRole('button', { name: m.pokerOpenVoting() }).click();

	await a.page.getByTestId('poker-active-item').waitFor();
	await a.page.getByRole('button', { name: '5', exact: true }).click();

	// Bob has not voted: reveal is unavailable and the room names who it waits on.
	await expect(c.page.getByRole('button', { name: m.pokerReveal() })).toBeDisabled();
	await expect(c.page.getByTestId('poker-reveal-blocked')).toContainText('Bob');

	await b.page.getByTestId('poker-active-item').waitFor();
	await b.page.getByRole('button', { name: '5', exact: true }).click();

	await expect(c.page.getByRole('button', { name: m.pokerReveal() })).toBeEnabled();

	await a.close();
	await b.close();
	await c.close();
});

test('observers never hold up a reveal', async ({ browser }) => {
	const c = await openController(browser);
	const a = await joinParticipant(browser, 'Alice');
	const o = await joinParticipant(browser, 'Olive', { observer: true });
	await c.page.getByLabel(m.pokerNextItemLabel()).fill('PROJ-101');
	await c.page.getByRole('button', { name: m.pokerOpenVoting() }).click();

	await a.page.getByTestId('poker-active-item').waitFor();
	await a.page.getByRole('button', { name: '5', exact: true }).click();

	// Every estimator has voted; the watching observer does not block it.
	await expect(c.page.getByRole('button', { name: m.pokerReveal() })).toBeEnabled();

	await a.close();
	await o.close();
	await c.close();
});

// --- Requirement: Recorded estimate stays within what was voted ---

test('offered estimates span only the votes cast', async ({ browser }) => {
	const c = await openController(browser);
	const a = await joinParticipant(browser, 'Alice');
	const b = await joinParticipant(browser, 'Bob');
	await c.page.getByLabel(m.pokerNextItemLabel()).fill('PROJ-102');
	await c.page.getByRole('button', { name: m.pokerOpenVoting() }).click();

	await a.page.getByTestId('poker-active-item').waitFor();
	await a.page.getByRole('button', { name: '3', exact: true }).click();
	await b.page.getByTestId('poker-active-item').waitFor();
	await b.page.getByRole('button', { name: '8', exact: true }).click();

	await c.page.getByRole('button', { name: m.pokerReveal() }).click();

	// 3 through 8 inclusive, and nothing outside that span.
	const finalize = c.page.getByTestId('poker-finalize');
	for (const n of ['3', '5', '8'])
		await expect(finalize.getByRole('button', { name: n, exact: true })).toBeVisible();
	for (const n of ['0', '1', '2', '13', '20', '40', '100'])
		await expect(finalize.getByRole('button', { name: n, exact: true })).toHaveCount(0);

	await a.close();
	await b.close();
	await c.close();
});

// --- Requirement: Keyboard submits the room's text entries ---

test('enter joins the room and opens voting on the next item', async ({ browser }) => {
	const ctx = await browser.newContext({ locale: 'en-US', timezoneId: 'Europe/Copenhagen' });
	const p = await ctx.newPage();
	await p.goto(`/poker/j/${JTOK}`);

	// Empty field: Enter does nothing, the join form stays.
	await p.getByLabel(m.pokerNameLabel()).press('Enter');
	await expect(p.getByRole('button', { name: m.pokerJoinButton() })).toBeVisible();

	await p.getByLabel(m.pokerNameLabel()).fill('Alice');
	await p.getByLabel(m.pokerNameLabel()).press('Enter');
	await expect(p.getByRole('button', { name: m.pokerJoinButton() })).toBeHidden();
	await expect(p.getByText('Alice')).toBeVisible();

	// Same on the console's item field.
	const c = await openController(browser);
	await c.page.getByLabel(m.pokerNextItemLabel()).fill('PROJ-103');
	await c.page.getByLabel(m.pokerNextItemLabel()).press('Enter');
	await expect(c.page.getByTestId('poker-active-item')).toHaveText('PROJ-103');

	await c.close();
	await ctx.close();
});

// --- Requirement: A closed room stops offering its join link ---

test('the join link disappears when the room closes', async ({ browser }) => {
	const c = await openController(browser);
	await expect(c.page.getByText(m.pokerJoinLinkLabel())).toBeVisible();

	await c.page.getByRole('button', { name: m.pokerCloseRoom() }).click();

	await expect(c.page.getByText(m.pokerJoinLinkLabel())).toHaveCount(0);
	await c.close();
});

// --- Requirement: Room email ---

test('creating a room with an address stores it for the closing summary', async ({ page }) => {
	await page.goto('/create?make=poker');
	await page.getByLabel(m.pokerRoomNameLabel()).fill('Emailed room (e2e)');
	await page.getByLabel(m.fieldOrganizerEmail()).fill('controller@example.com');
	await page.getByRole('button', { name: m.pokerCreateButton() }).click();
	await expect(page).toHaveURL(/\/poker\/c\//);

	const roomId = roomIdByControllerToken(page.url().split('/').pop() as string);
	expect(roomEmail(roomId)).toBe('controller@example.com');

	// Stored, but never sent back to any client.
	const state = await page.request.get(`/poker/api/${page.url().split('/').pop()}/state`);
	expect(await state.text()).not.toContain('controller@example.com');
});

test('creating a room without an address stores none', async ({ page }) => {
	await page.goto('/create?make=poker');
	await page.getByLabel(m.pokerRoomNameLabel()).fill('No-email room (e2e)');
	await page.getByRole('button', { name: m.pokerCreateButton() }).click();
	await expect(page).toHaveURL(/\/poker\/c\//);

	const roomId = roomIdByControllerToken(page.url().split('/').pop() as string);
	expect(roomEmail(roomId)).toBe(null);
});

test('an invalid address is rejected and creates no room', async ({ page }) => {
	await page.goto('/create?make=poker');
	await page.getByLabel(m.pokerRoomNameLabel()).fill('Bad-email room (e2e)');
	await page.getByLabel(m.fieldOrganizerEmail()).fill('not-an-email');
	await page.getByRole('button', { name: m.pokerCreateButton() }).click();

	await expect(page.getByText(m.errorInvalidEmail())).toBeVisible();
	await expect(page).toHaveURL(/\/create/);
});
