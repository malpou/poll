import { test, expect, type Page } from '@playwright/test';
import { m } from '../src/lib/paraglide/messages';
import type { Preference } from '../src/lib/types';
import {
	countResponsesForOption,
	eventDetails,
	inviteeLabels,
	optionIds,
	seedDateOption,
	seedEvent,
	seedInvitee,
	seedResponse,
	setNote,
	wipeEvent,
	type ResponseSeed
} from './db';

// Organizer dashboard at /e/{organizer_token}. Seeds local D1 through the shared
// e2e/db.ts helper; fixed tokens so re-runs are deterministic; seeding is
// delete-then-insert so it's idempotent.

const OTOK = 'e2e-dash-otok'; // organizer token under test
const RTOK = 'e2e-dash-rtok'; // invitee token, for the close/reopen round-trip
const EV = 'e2e-dash-ev';
const INV = 'e2e-dash-inv';
const OPT = 'e2e-dash-opt'; // an option that will carry a response
const TITLE = 'Rundvisning i DR Byen (dash)';

function seed() {
	wipeEvent(EV);
	seedEvent({
		id: EV,
		title: TITLE,
		description: 'Vi mødes ved indgangen.',
		organizerToken: OTOK,
		status: 'open'
	});
	seedDateOption({ id: OPT, eventId: EV, startsAt: '2026-09-12T08:00:00Z', sortOrder: 0 });
	seedInvitee({ id: INV, eventId: EV, label: 'Anna', token: RTOK });
	seedResponse({ inviteeId: INV, dateOptionId: OPT, preference: 'preferred' });
}

function optionRows() {
	return optionIds(EV);
}
function inviteeRows() {
	return inviteeLabels(EV).map((label) => ({ label }));
}

test.beforeAll(seed);

test('unknown organizer token shows not-found and leaks no event data', async ({ page }) => {
	await page.goto('/e/does-not-exist-token');
	await expect(page.getByText(m.linkNotFound())).toBeVisible();
	await expect(page.getByRole('heading', { name: TITLE })).toHaveCount(0);
});

test('add an option and an invitee persists to D1', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	await expect(page.getByRole('heading', { name: TITLE })).toBeVisible();

	// Add a date option.
	const addOption = page.locator('form[action="?/addOption"]');
	await addOption.locator('input[name="value"]').fill('2026-09-20');
	await addOption.getByRole('button', { name: m.addDate() }).click();
	await expect.poll(() => optionRows().length).toBe(2);

	// Add an invitee.
	const addInvitee = page.locator('form[action="?/addInvitee"]');
	await addInvitee.locator('input[name="label"]').fill('Bo');
	await addInvitee.getByRole('button', { name: m.addParticipant() }).click();
	await expect.poll(() => inviteeRows().length).toBe(2);
});

test('rename an invitee persists', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	const row = page.locator('form[action="?/renameInvitee"]');
	await row.locator('input[name="label"]').fill('Anna B.');
	await row.getByRole('button', { name: m.save() }).click();
	await expect.poll(() => inviteeRows().map((r) => r.label)).toEqual(['Anna B.']);
});

test('editing the title and description persists', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	// Open the header editor, change both fields, save.
	await page.getByRole('button', { name: m.edit() }).first().click();
	const form = page.locator('form[action="?/saveDetails"]');
	await form.locator('input[name="title"]').fill('Ny titel');
	await form.locator('textarea[name="description"]').fill('Ny beskrivelse');
	await form.getByRole('button', { name: m.save() }).click();
	await expect
		.poll(() => eventDetails(EV))
		.toEqual({
			title: 'Ny titel',
			description: 'Ny beskrivelse'
		});
	await expect(page.getByRole('heading', { name: 'Ny titel' })).toBeVisible();
});

test('saving an empty title is rejected and keeps the old title', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	await page.getByRole('button', { name: m.edit() }).first().click();
	const form = page.locator('form[action="?/saveDetails"]');
	await form.locator('input[name="title"]').fill('');
	await form.getByRole('button', { name: m.save() }).click();
	// Server rejects → title unchanged in D1.
	await expect.poll(() => eventDetails(EV).title).toBe(TITLE);
});

test('deleting an option with responses warns and dismiss keeps it', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	page.once('dialog', (d) => {
		expect(d.message()).toBe(m.confirmDeleteOption());
		void d.dismiss();
	});
	await page
		.locator('form[action="?/removeOption"]')
		.getByRole('button', { name: m.remove() })
		.click();
	await expect.poll(() => optionRows().length).toBe(1);
});

test('accepting the warning deletes the option and its responses', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	page.once('dialog', (d) => void d.accept());
	await page
		.locator('form[action="?/removeOption"]')
		.getByRole('button', { name: m.remove() })
		.click();
	await expect.poll(() => optionRows().length).toBe(0);
	expect(countResponsesForOption(OPT)).toBe(0);
});

// Scope to the invitees section - the organizer-link banner also has a copy
// button (it copies the /e URL), so an unscoped .first() would grab that one.
function inviteesSection(page: Page) {
	return page.locator('section', { has: page.getByText(m.participantsSection()) });
}

async function copiedUrl(page: Page): Promise<string> {
	await inviteesSection(page).getByRole('button', { name: m.copyLink() }).first().click();
	return page.evaluate(() => navigator.clipboard.readText());
}

test('copy link puts the full absolute invitee URL on the clipboard', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	seed();
	await page.goto(`/e/${OTOK}`);
	// URLs follow the request host the server saw (a custom-domain route can
	// rewrite it), so assert shape - absolute + correct path - not a fixed host.
	const copied = await copiedUrl(page);
	expect(copied).toMatch(/^https?:\/\/[^/]+\/r\//);
	expect(copied.endsWith(`/r/${RTOK}`)).toBe(true);
});

test('organizer-link banner copies the /e URL and warns to save it', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	seed();
	await page.goto(`/e/${OTOK}`);
	// The warning heading and its copy button share the banner's outer div.
	const banner = page
		.locator('div.border-amber')
		.filter({ has: page.getByText(m.organizerLinkTitle()) });
	await expect(banner).toBeVisible();
	await banner.getByRole('button', { name: m.copyLink() }).click();
	const copied = await page.evaluate(() => navigator.clipboard.readText());
	expect(copied).toMatch(/^https?:\/\/[^/]+\/e\//);
	expect(copied.endsWith(`/e/${OTOK}`)).toBe(true);
});

test('close stops response edits; reopen restores them', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);

	// Close from the dashboard.
	await page.getByRole('button', { name: m.closePoll() }).click();
	await expect(page.getByText(m.closedBanner())).toBeVisible();

	// The invitee link is now read-only (iteration-4 path).
	await page.goto(`/r/${RTOK}`);
	await expect(page.getByText(m.closedBanner())).toBeVisible();
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toHaveCount(0);

	// Reopen → the invitee can edit again. Anna was seeded with an answer, so the
	// response bar shows the "saved / Rediger" affordance (not a fresh "Send svar")
	// - that Rediger button only renders when the event is open, so its presence is
	// exactly the "edits restored" signal. Clicking it reveals the submit button.
	await page.goto(`/e/${OTOK}`);
	await page.getByRole('button', { name: m.reopenPoll() }).click();
	await expect(page.getByText(m.closedBanner())).toHaveCount(0);
	await page.goto(`/r/${RTOK}`);
	await expect(page.getByText(m.closedBanner())).toHaveCount(0);
	await page.getByRole('button', { name: m.editAnswer() }).click();
	await expect(page.getByRole('button', { name: m.sendAnswer() })).toBeVisible();
});

// --- Results view (iteration 6): counts, pending, best-option highlight. ---
// Separate event/tokens from the mutation tests above so seeds don't collide.

const R_OTOK = 'e2e-res-otok';
const R_EV = 'e2e-res-ev';

// Fresh event with 3 invitees + 3 options, then whatever responses are given.
function seedResults(responses: ResponseSeed[] = []) {
	wipeEvent(R_EV);
	seedEvent({ id: R_EV, title: 'Resultater', organizerToken: R_OTOK, status: 'open' });
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

// Each option renders one result card; its "{n} af 3 har svaret" label is unique
// per option, so we locate the card by that label and assert on its contents.
function cardByAnswered(page: Page, label: string) {
	return page
		.locator('section')
		.filter({ hasText: m.resultsSection() })
		.locator('div')
		.filter({ hasText: label })
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

	// Winner rb is the only fully-answered option (3 of 3) and carries the badge.
	const winner = cardByAnswered(page, m.answeredLabel({ total: 3, totalInvitees: 3 }));
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

test('pending invitees are listed as Mangler at svare', async ({ page }) => {
	// Anna answers; Bo and Ced do not → two pending, one answered.
	seedResults([resp('ri1', 'ra', 'preferred')]);
	await page.goto(`/e/${R_OTOK}`);
	// Exact match: the "{n} af 3 har svaret" labels also contain "har svaret".
	await expect(page.getByText(m.pending(), { exact: true })).toHaveCount(2); // Bo + Ced
	await expect(page.getByText(m.answered(), { exact: true })).toHaveCount(1); // Anna
});

test('expanding a result shows which people chose each preference', async ({ page }) => {
	seedResults([resp('ri1', 'ra', 'preferred'), resp('ri2', 'ra', 'unavailable')]);
	await page.goto(`/e/${R_OTOK}`);

	// Names hidden until the card is expanded.
	await expect(page.getByText('Anna', { exact: true })).toHaveCount(0);
	await page.getByRole('button', { name: m.showWho() }).first().click();
	await expect(page.getByText('Anna', { exact: true })).toBeVisible(); // preferred ra
	await expect(page.getByText('Bo', { exact: true })).toBeVisible(); // unavailable ra
});

test('an invitee note shows behind a comment toggle', async ({ page }) => {
	seedResults([resp('ri1', 'ra', 'preferred')]);
	setNote('ri1', 'Jeg kan ikke om morgenen');
	await page.goto(`/e/${R_OTOK}`);

	await expect(page.getByText('Jeg kan ikke om morgenen')).toHaveCount(0);
	await page.getByRole('button', { name: m.showNote() }).click();
	await expect(page.getByText('Jeg kan ikke om morgenen')).toBeVisible();
});
