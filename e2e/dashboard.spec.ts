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
	// The preview server (wrangler dev) and this spawned wrangler share one local
	// D1 file, so writes occasionally lose a lock/visibility race and surface as a
	// transient FK/BUSY error. One retry clears it; the seeds are idempotent.
	const run = () =>
		execFileSync(
			'bunx',
			['wrangler', 'd1', 'execute', 'DB', '--local', '--json', '--command', sql],
			{
				encoding: 'utf8'
			}
		);
	let out: string;
	for (let attempt = 0; ; attempt++) {
		try {
			out = run();
			break;
		} catch (e) {
			if (attempt >= 2) throw e;
		}
	}
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

// --- Results view (iteration 6): counts, pending, best-option highlight. ---
// Separate event/tokens from the mutation tests above so seeds don't collide.

const R_OTOK = 'e2e-res-otok';
const R_EV = 'e2e-res-ev';

function seedResults(sql: string) {
	// Fresh event with 3 invitees + 3 options, then whatever responses `sql` adds.
	d1(
		`DELETE FROM responses WHERE invitee_id IN (SELECT id FROM invitees WHERE event_id = '${R_EV}');
		 DELETE FROM invitees WHERE event_id = '${R_EV}';
		 DELETE FROM date_options WHERE event_id = '${R_EV}';
		 DELETE FROM events WHERE id = '${R_EV}';`
	);
	const now = '2026-07-01T00:00:00Z';
	d1(
		`INSERT INTO events (id, title, description, organizer_token, status, created_at) VALUES
		   ('${R_EV}', 'Resultater', NULL, '${R_OTOK}', 'open', '${now}');
		 INSERT INTO date_options (id, event_id, starts_at, ends_at, label, sort_order) VALUES
		   ('ra', '${R_EV}', '2026-09-12T08:00:00Z', NULL, NULL, 0),
		   ('rb', '${R_EV}', '2026-09-20T08:00:00Z', NULL, NULL, 1),
		   ('rc', '${R_EV}', '2026-10-03T08:00:00Z', NULL, NULL, 2);
		 INSERT INTO invitees (id, event_id, label, token, note, created_at) VALUES
		   ('ri1', '${R_EV}', 'Anna', 'e2e-res-t1', NULL, '${now}'),
		   ('ri2', '${R_EV}', 'Bo',   'e2e-res-t2', NULL, '${now}'),
		   ('ri3', '${R_EV}', 'Ced',  'e2e-res-t3', NULL, '${now}');`
	);
	if (sql) d1(sql);
}

const resp = (inv: string, opt: string, pref: string) =>
	`INSERT INTO responses (invitee_id, date_option_id, preference, updated_at) VALUES
	   ('${inv}', '${opt}', '${pref}', '2026-07-01T00:00:00Z');`;

// Each option renders one result card; its "{n} af 3 har svaret" label is unique
// per option, so we locate the card by that label and assert on its contents.
function cardByAnswered(page: Page, label: string) {
	return page
		.locator('section')
		.filter({ hasText: da.resultsSection })
		.locator('div')
		.filter({ hasText: label })
		.filter({ has: page.getByText(da.prefPreferred) });
}

test('per-option counts and a clear winner is highlighted', async ({ page }) => {
	// rb: 2×preferred, 1×available, 0×unavailable → fewest unavailable + most preferred.
	// ra: 1×preferred, 2×unavailable. rc: 3×available, 0×unavailable (loses on preferred).
	seedResults(
		resp('ri1', 'rb', 'preferred') +
			resp('ri2', 'rb', 'preferred') +
			resp('ri3', 'rb', 'available') +
			resp('ri1', 'ra', 'preferred') +
			resp('ri2', 'ra', 'unavailable') +
			resp('ri3', 'ra', 'unavailable') +
			resp('ri1', 'rc', 'available') +
			resp('ri2', 'rc', 'available') +
			resp('ri3', 'rc', 'available')
	);
	await page.goto(`/e/${R_OTOK}`);

	// Winner rb is the only fully-answered option (3 of 3) and carries the badge.
	const winner = cardByAnswered(page, '3 af 3 har svaret');
	await expect(winner.getByText(da.bestDate)).toBeVisible();

	// Exactly one best-date badge → clear winner, not a tie.
	await expect(page.getByText(da.bestDate)).toHaveCount(1);
});

test('a tie highlights both options', async ({ page }) => {
	// ra and rb both: 1×preferred, 0×unavailable → identical (unavailable, preferred).
	seedResults(resp('ri1', 'ra', 'preferred') + resp('ri2', 'rb', 'preferred'));
	await page.goto(`/e/${R_OTOK}`);
	await expect(page.getByText(da.bestDate)).toHaveCount(2);
});

test('with no responses at all, no date is highlighted as best', async ({ page }) => {
	seedResults('');
	await page.goto(`/e/${R_OTOK}`);
	// Bars render (Foretrukket label present) but no date is crowned best.
	await expect(page.getByText(da.prefPreferred).first()).toBeVisible();
	await expect(page.getByText(da.bestDate)).toHaveCount(0);
});

test('pending invitees are listed as Mangler at svare', async ({ page }) => {
	// Anna answers; Bo and Ced do not → two pending, one answered.
	seedResults(resp('ri1', 'ra', 'preferred'));
	await page.goto(`/e/${R_OTOK}`);
	// Exact match: the "{n} af 3 har svaret" labels also contain "har svaret".
	await expect(page.getByText(da.pending, { exact: true })).toHaveCount(2); // Bo + Ced
	await expect(page.getByText(da.answered, { exact: true })).toHaveCount(1); // Anna
});

test('expanding a result shows which people chose each preference', async ({ page }) => {
	seedResults(resp('ri1', 'ra', 'preferred') + resp('ri2', 'ra', 'unavailable'));
	await page.goto(`/e/${R_OTOK}`);

	// Names hidden until the card is expanded.
	await expect(page.getByText('Anna', { exact: true })).toHaveCount(0);
	await page.getByRole('button', { name: da.showWho }).first().click();
	await expect(page.getByText('Anna', { exact: true })).toBeVisible(); // preferred ra
	await expect(page.getByText('Bo', { exact: true })).toBeVisible(); // unavailable ra
});

test('an invitee note shows behind a comment toggle', async ({ page }) => {
	seedResults(
		resp('ri1', 'ra', 'preferred') +
			`UPDATE invitees SET note = 'Jeg kan ikke om morgenen' WHERE id = 'ri1';`
	);
	await page.goto(`/e/${R_OTOK}`);

	await expect(page.getByText('Jeg kan ikke om morgenen')).toHaveCount(0);
	await page.getByRole('button', { name: da.showNote }).click();
	await expect(page.getByText('Jeg kan ikke om morgenen')).toBeVisible();
});
