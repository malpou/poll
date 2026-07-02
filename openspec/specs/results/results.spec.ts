import { test, expect, type Page } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import type { Preference } from '../../../src/lib/types';
import {
	seedDateOption,
	seedEvent,
	seedInvitee,
	seedResponse,
	setNote,
	wipeEvent,
	type ResponseSeed
} from '../support/db';

// Results view on the organizer dashboard: counts, pending, best-option
// highlight, chase-up callout. Seeds local D1 through the shared
// specs/support/db.ts helper; fixed tokens so re-runs are deterministic;
// seeding is delete-then-insert so it's idempotent.

const R_OTOK = 'e2e-res-otok';
const R_EV = 'e2e-res-ev';

// Fresh event with 3 invitees + 3 options, then whatever responses are given.
function seedResults(
	responses: ResponseSeed[] = [],
	flags: { allowPreferred?: boolean; allowUnsure?: boolean } = {}
) {
	wipeEvent(R_EV);
	seedEvent({ id: R_EV, title: 'Resultater', organizerToken: R_OTOK, status: 'open', ...flags });
	seedDateOption({ id: 'ra', eventId: R_EV, startsAt: '2026-09-12T08:00:00Z', sortOrder: 0 });
	seedDateOption({ id: 'rb', eventId: R_EV, startsAt: '2026-09-20T08:00:00Z', sortOrder: 1 });
	seedDateOption({ id: 'rc', eventId: R_EV, startsAt: '2026-10-03T08:00:00Z', sortOrder: 2 });
	seedInvitee({ id: 'ri1', eventId: R_EV, label: 'Anna', token: 'e2e-res-t1' });
	seedInvitee({ id: 'ri2', eventId: R_EV, label: 'Bo', token: 'e2e-res-t2' });
	seedInvitee({ id: 'ri3', eventId: R_EV, label: 'Ced', token: 'e2e-res-t3' });
	for (const r of responses) seedResponse(r);
}

const resp = (inviteeId: string, dateOptionId: string, preference: Preference): ResponseSeed => ({
	inviteeId,
	dateOptionId,
	preference
});

// Locate a result card by the date weekday it renders (each option is a distinct
// date), so we can assert on that specific card's contents.
function cardByWeekday(page: Page, weekday: string) {
	return page
		.locator('section')
		.filter({ hasText: m.resultsSection() })
		.locator('div')
		.filter({ hasText: weekday })
		.filter({ has: page.getByText(m.prefPreferred()) });
}

test('per-option counts and a clear winner is highlighted', async ({ page }) => {
	// rb: 2×preferred, 1×available, 0×unavailable → fewest unavailable + most preferred.
	// ra: 1×preferred, 2×unavailable. rc: 3×available, 0×unavailable (loses on preferred).
	seedResults([
		resp('ri1', 'rb', 'preferred'),
		resp('ri2', 'rb', 'preferred'),
		resp('ri3', 'rb', 'available'),
		resp('ri1', 'ra', 'preferred'),
		resp('ri2', 'ra', 'unavailable'),
		resp('ri3', 'ra', 'unavailable'),
		resp('ri1', 'rc', 'available'),
		resp('ri2', 'rc', 'available'),
		resp('ri3', 'rc', 'available')
	]);
	await page.goto(`/e/${R_OTOK}`);

	// Winner rb (Sunday 20 Sep) is the fully-answered option and carries the badge.
	const winner = cardByWeekday(page, 'Sunday');
	await expect(winner.getByText(m.bestDate())).toBeVisible();

	// Exactly one best-date badge → clear winner, not a tie.
	await expect(page.getByText(m.bestDate())).toHaveCount(1);
});

test('a tie highlights both options', async ({ page }) => {
	// ra and rb both: 1×preferred, 0×unavailable → identical (unavailable, preferred).
	seedResults([resp('ri1', 'ra', 'preferred'), resp('ri2', 'rb', 'preferred')]);
	await page.goto(`/e/${R_OTOK}`);
	await expect(page.getByText(m.bestDate())).toHaveCount(2);
});

test('with no responses at all, no date is highlighted as best', async ({ page }) => {
	seedResults();
	await page.goto(`/e/${R_OTOK}`);
	// Bars render (Foretrukket label present) but no date is crowned best.
	await expect(page.getByText(m.prefPreferred()).first()).toBeVisible();
	await expect(page.getByText(m.bestDate())).toHaveCount(0);
});

test('"I don\'t know" answers do not sway the ranking', async ({ page }) => {
	// ra and rb: identical preferred/available/unavailable; rb also has unsure
	// answers. Both must score equally and both be highlighted.
	seedResults(
		[
			resp('ri1', 'ra', 'preferred'),
			resp('ri1', 'rb', 'preferred'),
			resp('ri2', 'rb', 'unsure'),
			resp('ri3', 'rb', 'unsure')
		],
		{ allowUnsure: true }
	);
	await page.goto(`/e/${R_OTOK}`);
	await expect(page.getByText(m.bestDate())).toHaveCount(2);
});

test('an invitee who marked every date "I don\'t know" counts as fully answered', async ({
	page
}) => {
	seedResults(
		[resp('ri1', 'ra', 'unsure'), resp('ri1', 'rb', 'unsure'), resp('ri1', 'rc', 'unsure')],
		{ allowUnsure: true }
	);
	await page.goto(`/e/${R_OTOK}`);
	// Anna carries the fully-answered badge - never pending or partial.
	await expect(page.getByText(m.answered(), { exact: true })).toHaveCount(1);
	await expect(page.getByText(m.partialAnswered(), { exact: true })).toHaveCount(0);
	await expect(page.getByText(m.pending(), { exact: true })).toHaveCount(2); // Bo, Ced
	// The unsure count renders on the bars.
	await expect(page.getByText(m.prefUnsure()).first()).toBeVisible();
});

test('a disabled choice shows no count - its folded answers count in the fixed pair', async ({
	page
}) => {
	// Post-fold state: preferred was disabled, its vote already folded to
	// available (the fold itself is covered in event-management/choices).
	seedResults([resp('ri1', 'ra', 'available')], { allowPreferred: false });
	await page.goto(`/e/${R_OTOK}`);
	await expect(page.getByText(m.prefAvailable()).first()).toBeVisible();
	await expect(page.getByText(m.prefPreferred())).toHaveCount(0);
});

test('expanding a result lists the names behind the "I don\'t know" count', async ({ page }) => {
	seedResults([resp('ri1', 'ra', 'unsure'), resp('ri2', 'ra', 'available')], {
		allowUnsure: true
	});
	await page.goto(`/e/${R_OTOK}`);
	const results = page.locator('section').filter({ hasText: m.resultsSection() });
	await expect(results.getByText('Anna', { exact: true })).toHaveCount(0);
	await results.getByRole('button', { name: m.showWho() }).first().click();
	await expect(results.getByText('Anna', { exact: true })).toBeVisible(); // unsure ra
	await expect(results.getByText('Bo', { exact: true })).toBeVisible(); // available ra
});

test('invitee badges distinguish pending, partial, and fully answered', async ({ page }) => {
	// Anna answers 1 of 3 dates (partial); Bo answers all 3; Ced answers nothing.
	seedResults([
		resp('ri1', 'ra', 'preferred'),
		resp('ri2', 'ra', 'available'),
		resp('ri2', 'rb', 'preferred'),
		resp('ri2', 'rc', 'unavailable')
	]);
	await page.goto(`/e/${R_OTOK}`);
	// Exact match: the summary "n af 3 har svaret" label also contains "har svaret".
	await expect(page.getByText(m.pending(), { exact: true })).toHaveCount(1); // Ced
	await expect(page.getByText(m.partialAnswered(), { exact: true })).toHaveCount(1); // Anna
	await expect(page.getByText(m.answered(), { exact: true })).toHaveCount(1); // Bo
});

test('expanding a result shows which people chose each preference', async ({ page }) => {
	seedResults([resp('ri1', 'ra', 'preferred'), resp('ri2', 'ra', 'unavailable')]);
	await page.goto(`/e/${R_OTOK}`);

	// Scoped to the results section: the chase-up callout above it also lists the
	// partial responders by name.
	const results = page.locator('section').filter({ hasText: m.resultsSection() });
	// Names hidden until the card is expanded.
	await expect(results.getByText('Anna', { exact: true })).toHaveCount(0);
	await results.getByRole('button', { name: m.showWho() }).first().click();
	await expect(results.getByText('Anna', { exact: true })).toBeVisible(); // preferred ra
	await expect(results.getByText('Bo', { exact: true })).toBeVisible(); // unavailable ra
});

// --- Chase-up callout: partial responders surfaced with their /r/ links. ---

function callout(page: Page) {
	return page.locator('div.border-primary').filter({ has: page.getByText(m.needsUpdateTitle()) });
}

test('partial responders appear in a callout with their copyable link', async ({
	page,
	context
}) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	// Anna answered before rb/rc were added; Bo and Ced never answered → only
	// Anna needs a chase-up.
	seedResults([resp('ri1', 'ra', 'preferred')]);
	await page.goto(`/e/${R_OTOK}`);

	await expect(callout(page)).toBeVisible();
	await expect(callout(page).getByText('Anna', { exact: true })).toBeVisible();
	await expect(callout(page).getByText('Bo', { exact: true })).toHaveCount(0);
	await callout(page).getByRole('button', { name: m.copyLink() }).click();
	const copied = await page.evaluate(() => navigator.clipboard.readText());
	expect(copied).toMatch(/^https?:\/\/[^/]+\/r\//);
	expect(copied.endsWith('/r/e2e-res-t1')).toBe(true);
});

test('no callout when nobody is partially answered', async ({ page }) => {
	// Anna complete, Bo and Ced pending - neither state warrants a chase-up.
	seedResults([
		resp('ri1', 'ra', 'preferred'),
		resp('ri1', 'rb', 'available'),
		resp('ri1', 'rc', 'unavailable')
	]);
	await page.goto(`/e/${R_OTOK}`);
	// Anna's "answered" pill proves the page rendered before we assert absence.
	await expect(page.getByText(m.answered(), { exact: true })).toBeVisible();
	await expect(page.getByText(m.needsUpdateTitle())).toHaveCount(0);
});

test('open mode: a partial responder link surfaces in the callout', async ({ page }) => {
	wipeEvent('e2e-dashop-ev');
	seedEvent({
		id: 'e2e-dashop-ev',
		title: 'Åben afstemning',
		organizerToken: 'e2e-dashop-otok',
		status: 'open',
		pollMode: 'open',
		shareToken: 'e2e-dashop-share'
	});
	seedDateOption({
		id: 'e2e-dashop-a',
		eventId: 'e2e-dashop-ev',
		startsAt: '2026-09-12T08:00:00Z',
		sortOrder: 0
	});
	seedDateOption({
		id: 'e2e-dashop-b',
		eventId: 'e2e-dashop-ev',
		startsAt: '2026-09-20T08:00:00Z',
		sortOrder: 1
	});
	// Mia submitted via the shared link while only one date existed.
	seedInvitee({
		id: 'e2e-dashop-inv',
		eventId: 'e2e-dashop-ev',
		label: 'Mia',
		token: 'e2e-dashop-rtok'
	});
	seedResponse({
		inviteeId: 'e2e-dashop-inv',
		dateOptionId: 'e2e-dashop-a',
		preference: 'preferred'
	});

	await page.goto('/e/e2e-dashop-otok');
	// Open mode hides /r/ links in the participant list; the callout is where
	// the organizer can grab Mia's personal link.
	await expect(callout(page).getByText('Mia', { exact: true })).toBeVisible();
	await expect(callout(page)).toContainText('/r/e2e-dashop-rtok');
});

test('dashboard in open mode shows the shared link, a read-only respondent list, and an open-style summary', async ({
	page
}) => {
	// Own open-mode event; one person has already submitted via the shared link.
	const OEV = 'e2e-resop-ev';
	const OSHARE = 'e2e-resop-share';
	wipeEvent(OEV);
	seedEvent({
		id: OEV,
		title: 'Åbent link (resultater)',
		organizerToken: 'e2e-resop-otok',
		status: 'open',
		pollMode: 'open',
		shareToken: OSHARE
	});
	seedDateOption({ id: `${OEV}-d1`, eventId: OEV, startsAt: '2026-09-12T08:00:00Z', sortOrder: 0 });
	seedInvitee({ id: `${OEV}-r1`, eventId: OEV, label: 'Erin', token: `${OSHARE}-r1` });
	seedResponse({ inviteeId: `${OEV}-r1`, dateOptionId: `${OEV}-d1`, preference: 'preferred' });

	await page.goto('/e/e2e-resop-otok');
	await expect(page.getByText(m.shareLinkTitle())).toBeVisible();
	await expect(page.getByText(`/s/${OSHARE}`)).toBeVisible();
	// The per-person "add invitee" form is not rendered in open mode.
	await expect(page.getByRole('button', { name: m.addParticipant() })).toHaveCount(0);
	// The respondent shows in the read-only list, but with no per-person link.
	const erinRow = page.locator('div').filter({ hasText: 'Erin' }).last();
	await expect(erinRow).toBeVisible();
	await expect(erinRow.getByRole('button', { name: m.copyLink() })).toHaveCount(0);
	// Summary reads "1 har svaret", never "1 af 1 har svaret".
	await expect(page.getByText(m.answeredLabelOpen({ total: 1 }), { exact: true })).toBeVisible();
});

test('an invitee note shows behind a comment toggle', async ({ page }) => {
	seedResults([resp('ri1', 'ra', 'preferred')]);
	setNote('ri1', 'Jeg kan ikke om morgenen');
	await page.goto(`/e/${R_OTOK}`);

	await expect(page.getByText('Jeg kan ikke om morgenen')).toHaveCount(0);
	await page.getByRole('button', { name: m.showNote() }).click();
	await expect(page.getByText('Jeg kan ikke om morgenen')).toBeVisible();
});
