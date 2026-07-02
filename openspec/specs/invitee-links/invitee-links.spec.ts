import { test, expect, type Page } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import {
	inviteeLabels,
	responsesFor,
	seedDateOption,
	seedEvent,
	seedInvitee,
	seedResponse,
	wipeEvent
} from '../support/db';

// Invitee roster + link distribution on the organizer dashboard. Seeds local D1
// through the shared specs/support/db.ts helper; fixed tokens so re-runs are
// deterministic; seeding is delete-then-insert so it's idempotent.

const OTOK = 'e2e-links-otok';
const RTOK = 'e2e-links-rtok';
const EV = 'e2e-links-ev';

function seed() {
	wipeEvent(EV);
	seedEvent({ id: EV, title: 'Links', organizerToken: OTOK, status: 'open' });
	seedDateOption({
		id: 'e2e-links-opt',
		eventId: EV,
		startsAt: '2026-09-12T08:00:00Z',
		sortOrder: 0
	});
	seedInvitee({ id: 'e2e-links-inv', eventId: EV, label: 'Anna', token: RTOK });
}

test('add an invitee persists to D1', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	const addInvitee = page.locator('form[action="?/addInvitee"]');
	await addInvitee.locator('input[name="label"]').fill('Bo');
	await addInvitee.getByRole('button', { name: m.addParticipant() }).click();
	await expect.poll(() => inviteeLabels(EV)).toEqual(['Anna', 'Bo']);
});

test('a group invitee is one invitee with one link', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	const addInvitee = page.locator('form[action="?/addInvitee"]');
	await addInvitee.locator('input[name="label"]').fill('The Smiths (Ann + Bob)');
	await addInvitee.getByRole('button', { name: m.addParticipant() }).click();
	// One row, one link - the group answers as a single response set.
	await expect.poll(() => inviteeLabels(EV)).toEqual(['Anna', 'The Smiths (Ann + Bob)']);
	// Two invitees → exactly two copyable links, one per row.
	await expect(inviteesSection(page).getByRole('button', { name: m.copyLink() })).toHaveCount(2);
});

test('removing an invitee deletes their responses and their link stops working', async ({
	page
}) => {
	seed();
	seedResponse({
		inviteeId: 'e2e-links-inv',
		dateOptionId: 'e2e-links-opt',
		preference: 'preferred'
	});
	await page.goto(`/e/${OTOK}`);
	page.once('dialog', (d) => {
		expect(d.message()).toBe(m.confirmDeleteInvitee());
		void d.accept();
	});
	await page
		.locator('form[action="?/removeInvitee"]')
		.getByRole('button', { name: m.remove() })
		.click();
	await expect.poll(() => inviteeLabels(EV)).toEqual([]);
	expect(responsesFor('e2e-links-inv')).toEqual([]);
	// The deleted invitee's link is gone.
	await page.goto(`/r/${RTOK}`);
	await expect(page.getByText(m.linkNotFound())).toBeVisible();
});

test('rename an invitee persists', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	// Names are read-only until the row's pencil opens the rename form.
	await inviteesSection(page).getByRole('button', { name: m.edit() }).click();
	const row = page.locator('form[action="?/renameInvitee"]');
	await row.locator('input[name="label"]').fill('Anna B.');
	await row.getByRole('button', { name: m.save() }).click();
	await expect.poll(() => inviteeLabels(EV)).toEqual(['Anna B.']);
});

// Scope to the invitees section - the organizer-link banner also has a copy
// button (it copies the /e URL), so an unscoped .first() would grab that one.
function inviteesSection(page: Page) {
	return page.locator('section', { has: page.getByText(m.participantsSection()) });
}

test('copy link puts the full absolute invitee URL on the clipboard', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	seed();
	await page.goto(`/e/${OTOK}`);
	// URLs follow the request host the server saw (a custom-domain route can
	// rewrite it), so assert shape - absolute + correct path - not a fixed host.
	await inviteesSection(page).getByRole('button', { name: m.copyLink() }).first().click();
	const copied = await page.evaluate(() => navigator.clipboard.readText());
	expect(copied).toMatch(/^https?:\/\/[^/]+\/r\//);
	expect(copied.endsWith(`/r/${RTOK}`)).toBe(true);
});

// --- Open mode: one shared /s link; the roster manages itself. ---

const O_EV = 'e2e-links-oev';
const O_OTOK = 'e2e-links-ootok';
const O_SHARE = 'e2e-links-oshare';

function seedOpen() {
	wipeEvent(O_EV);
	seedEvent({
		id: O_EV,
		title: 'Links (åben)',
		organizerToken: O_OTOK,
		status: 'open',
		pollMode: 'open',
		shareToken: O_SHARE
	});
	seedDateOption({
		id: `${O_EV}-d`,
		eventId: O_EV,
		startsAt: '2026-09-12T08:00:00Z',
		sortOrder: 0
	});
	seedInvitee({ id: `${O_EV}-inv`, eventId: O_EV, label: 'Mia', token: `${O_SHARE}-r1` });
}

test('copy the shared link puts the full absolute /s URL on the clipboard', async ({
	page,
	context
}) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	seedOpen();
	await page.goto(`/e/${O_OTOK}`);
	// The shared-link callout at the top (ink tone), distinct from the
	// highlighter organizer-link banner which has its own copy button.
	const banner = page
		.locator('div[data-tone="ink"]')
		.filter({ has: page.getByText(m.shareLinkTitle()) });
	await banner.getByRole('button', { name: m.copyLink() }).click();
	const copied = await page.evaluate(() => navigator.clipboard.readText());
	expect(copied).toMatch(/^https?:\/\/[^/]+\/s\//);
	expect(copied.endsWith(`/s/${O_SHARE}`)).toBe(true);
});

test("copy an open-mode participant's personal link puts their /r URL on the clipboard", async ({
	page,
	context
}) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	seedOpen();
	await page.goto(`/e/${O_OTOK}`);
	await inviteesSection(page).getByRole('button', { name: m.copyLink() }).click();
	const copied = await page.evaluate(() => navigator.clipboard.readText());
	expect(copied).toMatch(/^https?:\/\/[^/]+\/r\//);
	expect(copied.endsWith(`/r/${O_SHARE}-r1`)).toBe(true);
});

test('open mode rejects roster changes server-side', async ({ request }) => {
	seedOpen();
	const origin = { origin: 'http://localhost:8787' };
	// The UI hides these forms in open mode; crafted POSTs must bounce too.
	const add = await request.post(`/e/${O_OTOK}?/addInvitee`, {
		form: { label: 'Intruder' },
		headers: origin
	});
	expect(await add.json()).toMatchObject({ type: 'failure', status: 409 });
	const rename = await request.post(`/e/${O_OTOK}?/renameInvitee`, {
		form: { inviteeId: `${O_EV}-inv`, label: 'Renamed' },
		headers: origin
	});
	expect(await rename.json()).toMatchObject({ type: 'failure', status: 409 });
	const remove = await request.post(`/e/${O_OTOK}?/removeInvitee`, {
		form: { inviteeId: `${O_EV}-inv` },
		headers: origin
	});
	expect(await remove.json()).toMatchObject({ type: 'failure', status: 409 });
	expect(inviteeLabels(O_EV)).toEqual(['Mia']);
});
