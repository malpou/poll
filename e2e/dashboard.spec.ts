import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { da } from '../src/lib/da';

// Organizer dashboard at /e/{organizer_token}. Seeds local D1 directly via
// `wrangler d1 execute` (same helper shape as response.spec.ts); fixed tokens so
// re-runs are deterministic; seeding is delete-then-insert so it's idempotent.

const OTOK = 'e2e-dash-otok'; // organizer token under test
const RTOK = 'e2e-dash-rtok'; // invitee token, for the close/reopen round-trip
const EV = 'e2e-dash-ev';
const INV = 'e2e-dash-inv';
const OPT = 'e2e-dash-opt'; // an option that will carry a response
const TITLE = 'Rundvisning i DR Byen (dash)';

function d1(sql: string): { results: Record<string, unknown>[] } {
	const out = execFileSync(
		'bunx',
		['wrangler', 'd1', 'execute', 'DB', '--local', '--json', '--command', sql],
		{ encoding: 'utf8' }
	);
	const parsed = JSON.parse(out.slice(out.indexOf('['))) as {
		results: Record<string, unknown>[];
	}[];
	return parsed[0];
}

function seed() {
	// Delete ALL children by event (tests add invitees/options with generated
	// ids), then the event — children first, or the FK constraint trips.
	d1(
		`DELETE FROM responses WHERE invitee_id IN (SELECT id FROM invitees WHERE event_id = '${EV}');
		 DELETE FROM responses WHERE date_option_id IN (SELECT id FROM date_options WHERE event_id = '${EV}');
		 DELETE FROM invitees WHERE event_id = '${EV}';
		 DELETE FROM date_options WHERE event_id = '${EV}';
		 DELETE FROM events WHERE id = '${EV}';`
	);
	const now = '2026-07-01T00:00:00Z';
	d1(
		`INSERT INTO events (id, title, description, organizer_token, status, created_at) VALUES
		   ('${EV}', '${TITLE}', 'Vi mødes ved indgangen.', '${OTOK}', 'open', '${now}');
		 INSERT INTO date_options (id, event_id, starts_at, ends_at, label, sort_order) VALUES
		   ('${OPT}', '${EV}', '2026-09-12T08:00:00Z', NULL, NULL, 0);
		 INSERT INTO invitees (id, event_id, label, token, note, created_at) VALUES
		   ('${INV}', '${EV}', 'Anna', '${RTOK}', NULL, '${now}');
		 INSERT INTO responses (invitee_id, date_option_id, preference, updated_at) VALUES
		   ('${INV}', '${OPT}', 'preferred', '${now}');`
	);
}

function optionRows() {
	return d1(`SELECT id FROM date_options WHERE event_id = '${EV}' ORDER BY sort_order`).results;
}
function inviteeRows() {
	return d1(`SELECT label FROM invitees WHERE event_id = '${EV}'`).results;
}

test.beforeAll(seed);

test('unknown organizer token shows not-found and leaks no event data', async ({ page }) => {
	await page.goto('/e/does-not-exist-token');
	await expect(page.getByText(da.linkNotFound)).toBeVisible();
	await expect(page.getByRole('heading', { name: TITLE })).toHaveCount(0);
});

test('add an option and an invitee persists to D1', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	await expect(page.getByRole('heading', { name: TITLE })).toBeVisible();

	// Add a date option.
	const addOption = page.locator('form[action="?/addOption"]');
	await addOption.locator('input[name="value"]').fill('2026-09-20');
	await addOption.getByRole('button', { name: da.addDate }).click();
	await expect.poll(() => optionRows().length).toBe(2);

	// Add an invitee.
	const addInvitee = page.locator('form[action="?/addInvitee"]');
	await addInvitee.locator('input[name="label"]').fill('Bo');
	await addInvitee.getByRole('button', { name: da.addParticipant }).click();
	await expect.poll(() => inviteeRows().length).toBe(2);
});

test('rename an invitee persists', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	const row = page.locator('form[action="?/renameInvitee"]');
	await row.locator('input[name="label"]').fill('Anna B.');
	await row.getByRole('button', { name: da.save }).click();
	await expect.poll(() => inviteeRows().map((r) => r.label)).toEqual(['Anna B.']);
});

test('deleting an option with responses warns and dismiss keeps it', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	page.once('dialog', (d) => {
		expect(d.message()).toBe(da.confirmDeleteOption);
		void d.dismiss();
	});
	await page
		.locator('form[action="?/removeOption"]')
		.getByRole('button', { name: da.remove })
		.click();
	await expect.poll(() => optionRows().length).toBe(1);
});

test('accepting the warning deletes the option and its responses', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	page.once('dialog', (d) => void d.accept());
	await page
		.locator('form[action="?/removeOption"]')
		.getByRole('button', { name: da.remove })
		.click();
	await expect.poll(() => optionRows().length).toBe(0);
	expect(
		d1(`SELECT COUNT(*) AS n FROM responses WHERE date_option_id = '${OPT}'`).results[0].n
	).toBe(0);
});

async function copiedUrl(page: Page): Promise<string> {
	await page.getByRole('button', { name: da.copyLink }).first().click();
	return page.evaluate(() => navigator.clipboard.readText());
}

test('copy link puts the full absolute invitee URL on the clipboard', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	seed();
	await page.goto(`/e/${OTOK}`);
	expect(await copiedUrl(page)).toBe(`https://poll.malpou.io/r/${RTOK}`);
});

test('close stops response edits; reopen restores them', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);

	// Close from the dashboard.
	await page.getByRole('button', { name: da.closePoll }).click();
	await expect(page.getByText(da.closedBanner)).toBeVisible();

	// The invitee link is now read-only (iteration-4 path).
	await page.goto(`/r/${RTOK}`);
	await expect(page.getByText(da.closedBanner)).toBeVisible();
	await expect(page.getByRole('button', { name: da.sendAnswer })).toHaveCount(0);

	// Reopen → the invitee can submit again.
	await page.goto(`/e/${OTOK}`);
	await page.getByRole('button', { name: da.reopenPoll }).click();
	await expect(page.getByText(da.closedBanner)).toHaveCount(0);
	await page.goto(`/r/${RTOK}`);
	await expect(page.getByRole('button', { name: da.sendAnswer })).toBeVisible();
});
