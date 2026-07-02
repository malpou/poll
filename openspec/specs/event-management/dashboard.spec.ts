import { test, expect } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import {
	countResponsesForOption,
	eventDetails,
	inviteesFor,
	optionIds,
	responsesFor,
	seedDateOption,
	seedEvent,
	seedInvitee,
	seedResponse,
	wipeEvent
} from '../support/db';

// Organizer dashboard at /e/{organizer_token}. Seeds local D1 through the shared
// specs/support/db.ts helper; fixed tokens so re-runs are deterministic; seeding
// is delete-then-insert so it's idempotent.

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

test.beforeAll(seed);

test('unknown organizer token shows not-found and leaks no event data', async ({ page }) => {
	await page.goto('/e/does-not-exist-token');
	await expect(page.getByText(m.linkNotFound())).toBeVisible();
	await expect(page.getByRole('heading', { name: TITLE })).toHaveCount(0);
});

test('add a date option persists to D1', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	await expect(page.getByRole('heading', { name: TITLE })).toBeVisible();

	const addOption = page.locator('form[action="?/addOption"]');
	await addOption.locator('input[name="value"]').fill('2026-09-20');
	await addOption.getByRole('button', { name: m.addDate() }).click();
	await expect.poll(() => optionRows().length).toBe(2);
});

test('editing the title and description persists', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	// Open the header editor, change both fields, save.
	await page.getByRole('button', { name: m.edit() }).first().click();
	const form = page.locator('form[action="?/saveDetails"]');
	await form.locator('input[name="title"]').fill('Ny titel');
	// Description is a rich-text contenteditable; fill() replaces its content.
	await form.getByRole('textbox', { name: m.fieldDescription() }).fill('Ny beskrivelse');
	await form.getByRole('button', { name: m.save() }).click();
	await expect
		.poll(() => eventDetails(EV))
		.toEqual({
			title: 'Ny titel',
			description: '<p>Ny beskrivelse</p>'
		});
	await expect(page.getByRole('heading', { name: 'Ny titel' })).toBeVisible();
});

test('bold formatting persists and renders for invitees', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	await page.getByRole('button', { name: m.edit() }).first().click();
	const form = page.locator('form[action="?/saveDetails"]');
	const desc = form.getByRole('textbox', { name: m.fieldDescription() });
	await desc.fill('Husk madkurv');
	await desc.press('ControlOrMeta+a');
	await form.getByRole('button', { name: m.rteBold() }).click();
	await form.getByRole('button', { name: m.save() }).click();
	await expect.poll(() => eventDetails(EV).description).toContain('<strong>');

	await page.goto(`/r/${RTOK}`);
	await expect(page.locator('strong', { hasText: 'Husk madkurv' })).toBeVisible();
});

test('muted text persists and renders toned down for invitees', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	await page.getByRole('button', { name: m.edit() }).first().click();
	const form = page.locator('form[action="?/saveDetails"]');
	const desc = form.getByRole('textbox', { name: m.fieldDescription() });
	await desc.fill('Kun hvis vejret holder');
	await desc.press('ControlOrMeta+a');
	await form.getByRole('button', { name: m.rteMuted() }).click();
	await form.getByRole('button', { name: m.save() }).click();
	await expect.poll(() => eventDetails(EV).description).toContain('<small>');

	await page.goto(`/r/${RTOK}`);
	const muted = page.locator('small', { hasText: 'Kun hvis vejret holder' });
	await expect(muted).toBeVisible();
	// Toned down = rendered at reduced opacity relative to the surrounding text.
	await expect(muted).toHaveCSS('opacity', '0.65');
});

test('disallowed markup is stripped server-side', async ({ page }) => {
	seed();
	// Bypass the editor: a crafted POST is the case the server must defend.
	// Same-origin header so SvelteKit's CSRF check lets the action run.
	const base = test.info().project.use.baseURL ?? '';
	await page.request.post(`/e/${OTOK}?/saveDetails`, {
		headers: { origin: base },
		form: {
			title: TITLE,
			description: '<p>ok</p><script>alert(1)</script>',
			pollMode: 'assigned',
			locale: 'da'
		}
	});
	await expect.poll(() => eventDetails(EV).description).not.toContain('<script');
	await expect.poll(() => eventDetails(EV).description).toContain('<p>ok</p>');
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

// --- Option ordering: move up/down + sort ascending. Own event so the
// single-option seeds above stay untouched. ---

const O_OTOK = 'e2e-ord-otok';
const O_EV = 'e2e-ord-ev';

function seedOrdering() {
	wipeEvent(O_EV);
	seedEvent({ id: O_EV, title: 'Rækkefølge', organizerToken: O_OTOK, status: 'open' });
	// Deliberately not chronological: sort_order runs [oct, sep 12, sep 20].
	seedDateOption({ id: 'oa', eventId: O_EV, startsAt: '2026-10-03T08:00:00Z', sortOrder: 0 });
	seedDateOption({ id: 'ob', eventId: O_EV, startsAt: '2026-09-12T08:00:00Z', sortOrder: 1 });
	seedDateOption({ id: 'oc', eventId: O_EV, startsAt: '2026-09-20T08:00:00Z', sortOrder: 2 });
}

test('move up and move down swap an option with its neighbour', async ({ page }) => {
	seedOrdering();
	await page.goto(`/e/${O_OTOK}`);
	// Every option renders both arrows (edges disabled), so nth(1) = second option.
	await page.getByRole('button', { name: m.moveUp() }).nth(1).click();
	await expect.poll(() => optionIds(O_EV)).toEqual(['ob', 'oa', 'oc']);
	// Move the (new) first option down again → original order restored.
	await page.getByRole('button', { name: m.moveDown() }).first().click();
	await expect.poll(() => optionIds(O_EV)).toEqual(['oa', 'ob', 'oc']);
});

test('sort by date orders the options chronologically', async ({ page }) => {
	seedOrdering();
	await page.goto(`/e/${O_OTOK}`);
	await page.getByRole('button', { name: m.sortByDate() }).click();
	await expect.poll(() => optionIds(O_EV)).toEqual(['ob', 'oc', 'oa']);
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

test('switching an assigned event to open keeps existing invitees and responses', async ({
	page
}) => {
	// Seed an ASSIGNED event with one answered invitee.
	const AEV = 'e2e-ev-switch';
	const AOTOK = 'e2e-otok-switch';
	const AINV = 'e2e-inv-switch';
	wipeEvent(AEV);
	seedEvent({ id: AEV, title: 'Skift (e2e)', organizerToken: AOTOK, status: 'open' });
	seedDateOption({ id: `${AEV}-d`, eventId: AEV, startsAt: '2026-09-12T08:00:00Z', sortOrder: 0 });
	seedInvitee({ id: AINV, eventId: AEV, label: 'Existing', token: 'e2e-tok-switch' });
	seedResponse({ inviteeId: AINV, dateOptionId: `${AEV}-d`, preference: 'preferred' });

	await page.goto(`/e/${AOTOK}`);
	// The header details-edit button (the date-option list has its own "Edit").
	await page.getByRole('button', { name: m.edit() }).first().click();
	await page.getByLabel(m.fieldMode()).selectOption('open');
	// The header details form's Save (invitee rows have their own "Save").
	await page.getByRole('button', { name: m.save() }).first().click();

	// Mode flipped, but the existing invitee + its response are untouched.
	await expect(page.getByText(m.shareLinkTitle())).toBeVisible();
	const invitees = inviteesFor(AEV);
	expect(invitees.map((i) => i.label)).toContain('Existing');
	expect(responsesFor(AINV)).toEqual([{ date_option_id: `${AEV}-d`, preference: 'preferred' }]);

	wipeEvent(AEV);
});

test('language picker previews the dashboard live, cancel rolls back', async ({ page }) => {
	seed();
	await page.goto(`/e/${OTOK}`);
	await page.getByRole('button', { name: m.edit() }).first().click();

	// Switch to French: the whole dashboard re-renders in place, unsaved.
	await page.locator('select[name="locale"]').selectOption('fr');
	await expect(page.getByText(m.datesSection({}, { locale: 'fr' }))).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

	// Cancel the edit: the preview rolls back to the stored locale.
	await page.getByRole('button', { name: m.cancel({}, { locale: 'fr' }) }).click();
	await expect(page.getByText(m.datesSection())).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
