import { test, expect } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import {
	d1,
	seedDateOption,
	seedEvent,
	seedInvitee,
	seedRoom,
	wipeEvent,
	wipeRoom
} from '../support/db';

// The landing page: pitch + create call-to-action, per-language URLs, the
// client-only example cards, the browser-language hint, and the indexability
// split (openspec/specs/landing-page). English browser so bare m.*() matches.
test.use({ locale: 'en-US', timezoneId: 'Europe/Copenhagen' });

const rows = (table: string) => d1(`SELECT COUNT(*) AS n FROM ${table}`).results[0].n as number;

// --- Requirement: Landing page ---

test('visitor sees the pitch and a create call-to-action', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: m.landingTitle() })).toBeVisible();
	await expect(page.getByText(m.landingIntro())).toBeVisible();
	await page.getByRole('link', { name: m.createTitle(), exact: true }).click();
	await expect(page).toHaveURL(/\/create$/);
	await expect(page.getByRole('heading', { name: m.createTitle() })).toBeVisible();
});

test('call-to-action keeps the page language', async ({ page }) => {
	await page.goto('/da');
	await page.getByRole('link', { name: m.createTitle({}, { locale: 'da' }), exact: true }).click();
	await expect(page).toHaveURL(/\/da\/create$/);
	await expect(
		page.getByRole('heading', { name: m.createTitle({}, { locale: 'da' }) })
	).toBeVisible();
});

// --- Requirement: Interactive poll type examples ---

test('date poll example reacts to a tap', async ({ page }) => {
	await page.goto('/');
	const dates = page.getByTestId('example-dates');
	// Baseline: one pretend friend can make the first date; my tap makes two.
	await expect(dates.getByText(`2 ${m.prefAvailable()}`)).toHaveCount(0);
	await dates
		.getByTestId('date-card-demo-dates-0')
		.getByRole('button', { name: m.prefAvailable(), exact: true })
		.click();
	await expect(dates.getByText(`2 ${m.prefAvailable()}`)).toBeVisible();
});

test('RSVP example takes a yes and the headcount updates', async ({ page }) => {
	await page.goto('/');
	const rsvp = page.getByTestId('example-rsvp');
	// Baseline headcount: three coming; my yes makes four.
	await expect(rsvp.getByText(`3 ${m.prefAvailableRsvp()}`)).toBeVisible();
	await rsvp.getByRole('button', { name: m.prefAvailableRsvp(), exact: true }).click();
	await expect(rsvp.getByText(`4 ${m.prefAvailableRsvp()}`)).toBeVisible();
});

test('question poll example reacts to a tap', async ({ page }) => {
	await page.goto('/');
	const question = page.getByTestId('example-question');
	await question
		.getByTestId('date-card-demo-question-0')
		.getByRole('button', { name: m.prefAvailableQuestion(), exact: true })
		.click();
	await expect(question.getByText(`3 ${m.prefAvailableQuestion()}`)).toBeVisible();
});

test('rank example reacts to a reorder and updates its tally', async ({ page }) => {
	await page.goto('/');
	const rank = page.getByTestId('example-rank');
	// The last option averages position 3.0 until my reorder moves it up one.
	await expect(rank.getByTestId('rank-tally-2')).toContainText(m.averagePosition({ avg: '3.0' }));
	await rank.getByTestId('rank-slip-demo-rank-2').getByRole('button', { name: m.moveUp() }).click();
	await expect(rank.getByTestId('rank-tally-2')).toContainText(m.averagePosition({ avg: '2.7' }));
});

test('highlight example spends a stroke and updates its tally', async ({ page }) => {
	await page.goto('/');
	const highlight = page.getByTestId('example-highlight');
	await expect(highlight.getByText(m.strokesLeft({ count: 5, budget: 5 }))).toBeVisible();
	await expect(highlight.getByTestId('highlight-tally-0')).toContainText(
		m.strokesTotal({ count: 3 })
	);
	// A tap marks the option, drops the remaining count, and moves the tally.
	const optionA = m.landingSampleHighlightOptionA();
	await highlight.getByRole('button', { name: m.addStroke({ option: optionA }) }).click();
	await expect(highlight.getByTestId('stroke-dots-demo-highlight-0').locator('span')).toHaveCount(
		1
	);
	await expect(highlight.getByText(m.strokesLeft({ count: 4, budget: 5 }))).toBeVisible();
	await expect(highlight.getByTestId('highlight-tally-0')).toContainText(
		m.strokesTotal({ count: 4 })
	);
});

test('example answers are not persisted across a reload', async ({ page }) => {
	const before = { invitees: rows('invitees'), responses: rows('responses') };
	await page.goto('/');
	const rsvp = page.getByTestId('example-rsvp');
	await rsvp.getByRole('button', { name: m.prefAvailableRsvp(), exact: true }).click();
	await expect(rsvp.getByText(`4 ${m.prefAvailableRsvp()}`)).toBeVisible();

	await page.reload();
	// Back to the initial state: the tally is the baseline again.
	await expect(rsvp.getByText(`3 ${m.prefAvailableRsvp()}`)).toBeVisible();
	await expect(rsvp.getByText(`4 ${m.prefAvailableRsvp()}`)).toHaveCount(0);
	// And nothing was recorded anywhere.
	await expect.poll(() => rows('invitees')).toBe(before.invitees);
	await expect.poll(() => rows('responses')).toBe(before.responses);
});

// --- Requirement: Language-specific landing URLs ---

test('switching language renders that language on its own URL without a full reload', async ({
	page
}) => {
	await page.goto('/');
	// A full navigation would wipe this stamp.
	await page.evaluate(() => ((window as { __live?: number }).__live = 1));
	await page.getByRole('radio', { name: 'Dansk' }).check();
	await expect(page).toHaveURL(/\/da$/);
	await expect(page.locator('html')).toHaveAttribute('lang', 'da');
	await expect(
		page.getByRole('heading', { name: m.landingTitle({}, { locale: 'da' }) })
	).toBeVisible();
	await expect(page).toHaveTitle(
		`${m.appName({}, { locale: 'da' })} · ${m.landingTitle({}, { locale: 'da' })}`
	);
	expect(await page.evaluate(() => (window as { __live?: number }).__live)).toBe(1);
});

test('highlighter restyles the landing page live and carries into the create form', async ({
	page
}) => {
	await page.goto('/');
	await page.getByRole('radio', { name: m.accentPink() }).check();
	// The page restyles immediately and the URL reflects the pick.
	await expect(page.getByTestId('landing-root')).toHaveAttribute('data-accent', 'pink');
	await expect(page).toHaveURL(/\?accent=pink$/);
	// Following the call-to-action seeds the create form's picker with it.
	await page.getByRole('link', { name: m.createTitle(), exact: true }).click();
	await expect(page).toHaveURL(/\/create\?accent=pink$/);
	await expect(page.getByRole('radio', { name: m.accentPink() })).toBeChecked();
	await expect(page.locator('form[data-accent="pink"]')).toBeVisible();
});

test('language switcher lists languages by worldwide speakers, most spoken first', async ({
	page
}) => {
	await page.goto('/');
	const radios = page.getByRole('group', { name: m.fieldLanguage() }).getByRole('radio');
	await expect(radios).toHaveCount(5);
	const order = ['English', 'Español', 'Français', 'Deutsch', 'Dansk'];
	for (const [i, name] of order.entries()) {
		await expect(radios.nth(i)).toHaveAccessibleName(name);
	}
});

test('direct visit to a language URL renders entirely in that language', async ({ page }) => {
	await page.goto('/da');
	await expect(page.locator('html')).toHaveAttribute('lang', 'da');
	await expect(
		page.getByRole('heading', { name: m.landingTitle({}, { locale: 'da' }) })
	).toBeVisible();
	await expect(
		page.getByRole('link', { name: m.createTitle({}, { locale: 'da' }), exact: true })
	).toBeVisible();
	await expect(page.getByText(m.landingIntro({}, { locale: 'da' }))).toBeVisible();
});

test('language versions cross-reference as alternates plus a default', async ({ page }) => {
	await page.goto('/da');
	const alternates = page.locator('link[rel="alternate"]');
	await expect(alternates).toHaveCount(6); // five languages + x-default
	await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', /\/$/);
	await expect(page.locator('link[hreflang="da"]')).toHaveAttribute('href', /\/da$/);
	await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute('href', /\/$/);
});

test('unsupported language segment yields the not-found page', async ({ page }) => {
	const response = await page.goto('/xx');
	expect(response?.status()).toBe(404);
	await expect(page.getByText(m.linkNotFound())).toBeVisible();
	await expect(page).toHaveTitle(`${m.linkNotFound()} · ${m.appName()}`);
});

// --- Requirement: Browser language hint without redirect ---

test.describe('browser language hint', () => {
	test.use({ locale: 'da-DK' });
	const hintText = () => m.landingHintLink({ language: 'Dansk' }, { locale: 'da' });

	test('hint offered to a mismatched browser, no redirect', async ({ page }) => {
		await page.goto('/');
		// The English page renders (no redirect), with a Danish hint offering /da.
		expect(new URL(page.url()).pathname).toBe('/');
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		const hint = page.getByTestId('lang-hint');
		await expect(hint.getByRole('button', { name: hintText() })).toBeVisible();
	});

	test('picking the hint switches language live without a full reload', async ({ page }) => {
		await page.goto('/');
		// A full navigation would wipe this stamp.
		await page.evaluate(() => ((window as { __live?: number }).__live = 1));
		await page.getByTestId('lang-hint').getByRole('button', { name: hintText() }).click();
		await expect(page).toHaveURL(/\/da$/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'da');
		await expect(
			page.getByRole('heading', { name: m.landingTitle({}, { locale: 'da' }) })
		).toBeVisible();
		expect(await page.evaluate(() => (window as { __live?: number }).__live)).toBe(1);
	});

	test('no hint when the page already matches the browser language', async ({ page }) => {
		await page.goto('/da');
		await expect(
			page.getByRole('heading', { name: m.landingTitle({}, { locale: 'da' }) })
		).toBeVisible();
		await expect(page.getByTestId('lang-hint')).toHaveCount(0);
	});

	test('dismissed hint stays away for the rest of the visit', async ({ page }) => {
		await page.goto('/');
		const dismiss = page
			.getByTestId('lang-hint')
			.getByRole('button', { name: m.landingHintDismiss({}, { locale: 'da' }) });
		await dismiss.click();
		await expect(page.getByTestId('lang-hint')).toHaveCount(0);
		// Navigate away and back in the same visit: still gone.
		await page.getByRole('radio', { name: 'Dansk' }).check();
		await expect(page).toHaveURL(/\/da$/);
		await page.getByRole('radio', { name: 'English' }).check();
		await expect(page.getByRole('heading', { name: m.landingTitle() })).toBeVisible();
		await expect(page.getByTestId('lang-hint')).toHaveCount(0);
	});
});

// --- Requirement: Marketing pages indexable, token pages not ---

test('landing and create pages carry no robots restriction', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: m.landingTitle() })).toBeVisible();
	await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
	await page.goto('/create');
	await expect(page.getByRole('heading', { name: m.createTitle() })).toBeVisible();
	await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});

test('token pages instruct search engines not to index', async ({ page }) => {
	const EV = 'e2e-landing-ev';
	wipeEvent(EV);
	seedEvent({
		id: EV,
		title: 'Landing noindex (e2e)',
		organizerToken: 'e2e-landing-otok',
		shareToken: 'e2e-landing-stok',
		status: 'open'
	});
	seedDateOption({
		id: 'e2e-landing-o1',
		eventId: EV,
		startsAt: '2026-09-12T16:00:00Z',
		sortOrder: 0
	});
	seedInvitee({ id: 'e2e-landing-anna', eventId: EV, label: 'Anna', token: 'e2e-landing-rtok' });

	for (const path of ['/e/e2e-landing-otok', '/r/e2e-landing-rtok', '/s/e2e-landing-stok']) {
		await page.goto(path);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
	}
});

// --- Requirement: Planning poker on the landing page ---

test('visitor sees planning poker as its own tool', async ({ page }) => {
	await page.goto('/');
	const poker = page.getByTestId('landing-poker');
	await expect(poker.getByText(m.landingPokerTitle())).toBeVisible();
	await expect(poker.getByText(m.landingPokerBadge())).toBeVisible();
	await expect(poker.getByText(m.landingPokerIntro())).toBeVisible();
	// Its own call-to-action, separate from the poll one.
	await expect(poker.getByRole('link', { name: m.pokerCreateTitle() })).toBeVisible();

	// Ahead of the poll examples on the page, not buried under them.
	const pokerBox = await poker.boundingBox();
	const examplesBox = await page.getByText(m.landingExamplesHint()).boundingBox();
	expect(pokerBox?.y ?? 0).toBeLessThan(examplesBox?.y ?? 0);
});

test('planning poker call-to-action keeps the page language', async ({ page }) => {
	await page.goto('/da');
	await page.getByTestId('landing-poker').getByRole('link').click();
	// Danish create page, opened on the room branch.
	await expect(page).toHaveURL(/\/da\/create\?make=poker$/);
	await expect(
		page.getByRole('heading', { name: m.pokerCreateTitle({}, { locale: 'da' }) })
	).toBeVisible();
});

test('reveal example turns the cards over', async ({ page }) => {
	await page.goto('/');
	const poker = page.getByTestId('landing-poker');
	// Face-down: no card value is on the page yet.
	await expect(poker.getByLabel('8')).toHaveCount(0);

	await poker.getByRole('button', { name: m.landingPokerReveal() }).click();

	// Face-up: the seat's card now shows its value (the distribution below
	// repeats it, hence first()), and the agreement read-out appears - 5,5,8,5
	// spans exactly one deck step, so "close".
	await expect(poker.getByLabel('8').first()).toBeVisible();
	await expect(poker.getByText(m.pokerSignalClose())).toBeVisible();
});

test('planning poker example answers are not persisted', async ({ page }) => {
	// Before/after, not absolute zero: these tables are shared with the poker
	// suite, which leaves its own rooms and seats behind.
	const before = ['poker_rooms', 'poker_participants', 'poker_votes'].map(rows);
	await page.goto('/');
	await page
		.getByTestId('landing-poker')
		.getByRole('button', { name: m.landingPokerReveal() })
		.click();
	await expect(page.getByTestId('landing-poker').getByLabel('8').first()).toBeVisible();

	await page.reload();
	// Back to face-down, and nothing was recorded.
	await expect(page.getByTestId('landing-poker').getByLabel('8')).toHaveCount(0);
	await expect(
		page.getByTestId('landing-poker').getByRole('button', { name: m.landingPokerReveal() })
	).toBeVisible();
	expect(['poker_rooms', 'poker_participants', 'poker_votes'].map(rows)).toEqual(before);
});

test('planning poker call-to-action carries the picked highlighter', async ({ page }) => {
	await page.goto('/');
	// Pick pink: the whole page follows, the poker section included (a room takes
	// an organizer-picked highlighter just like a poll).
	await page.getByRole('radio', { name: m.accentPink() }).check();
	await expect(page.getByTestId('landing-root')).toHaveAttribute('data-accent', 'pink');

	await page.getByTestId('landing-poker').getByRole('link').click();
	await expect(page).toHaveURL(/accent=pink/);
	await expect(page).toHaveURL(/make=poker/);
	await expect(page.getByRole('radio', { name: m.accentPink() })).toBeChecked();
});

test('room creation is indexable', async ({ page }) => {
	await page.goto('/create?make=poker');
	await expect(page.getByRole('heading', { name: m.pokerCreateTitle() })).toBeVisible();
	await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});

test('planning-poker token pages are not indexable', async ({ page }) => {
	const ROOM = 'e2e-landing-room';
	wipeRoom(ROOM);
	seedRoom({
		id: ROOM,
		title: 'Landing noindex room (e2e)',
		controllerToken: 'e2e-landing-ctok',
		joinToken: 'e2e-landing-jtok'
	});

	for (const path of ['/poker/c/e2e-landing-ctok', '/poker/j/e2e-landing-jtok']) {
		await page.goto(path);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
	}
	wipeRoom(ROOM);
});
