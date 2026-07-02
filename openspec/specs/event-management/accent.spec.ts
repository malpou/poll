import { test, expect, type Page } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import { d1, eventAccent, seedDateOption, seedEvent, seedInvitee, wipeEvent } from '../support/db';

// Poll accent color (openspec/specs/event-management): picked at creation,
// editable from the dashboard, rendered on every page of the poll. Rendering
// is the data-accent attribute on the page root - layout.css maps it to the
// highlighter custom property every accent-tinted style reads.

test.use({ locale: 'en-US' });

const EV = 'e2e-accent-ev';
const OTOK = 'e2e-accent-otok';
const RTOK = 'e2e-accent-rtok';
const TITLE = 'Accent poll';

function seed(accent?: 'yellow' | 'pink' | 'green' | 'blue' | 'purple') {
	wipeEvent(EV);
	seedEvent({ id: EV, title: TITLE, organizerToken: OTOK, status: 'open', accent });
	seedDateOption({ id: 'e2e-accent-opt', eventId: EV, sortOrder: 0 });
	seedInvitee({ id: 'e2e-accent-inv', eventId: EV, label: 'Anna', token: RTOK });
}

// Fill the minimum valid create form. Dates are picked from the month
// calendar; the poll title is the only other required field.
async function fillCreateForm(page: Page) {
	await page.goto('/');
	await page.getByLabel(m.fieldTitle()).fill(TITLE);
	await page.getByRole('button', { name: '12', exact: true }).click();
}

test('default accent: creating without touching the picker yields yellow', async ({ page }) => {
	await fillCreateForm(page);
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	const otok = page.url().split('/').pop() ?? '';
	await expect
		.poll(
			() =>
				d1(`SELECT accent FROM events WHERE organizer_token = '${otok}'`).results[0]
					?.accent as string
		)
		.toBe('yellow');
	await expect(page.locator('[data-accent]').first()).toHaveAttribute('data-accent', 'yellow');
});

test('an accent picked at creation renders on the dashboard and response pages', async ({
	page
}) => {
	await fillCreateForm(page);
	await page.getByRole('radio', { name: m.accentPink() }).check();
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	await expect(page.locator('[data-accent]').first()).toHaveAttribute('data-accent', 'pink');

	// Seed an invitee onto the freshly created event to reach its response page.
	// Delete-then-insert: the fixed id/token may linger on a previous run's event.
	const otok = page.url().split('/').pop() ?? '';
	const eventId = d1(`SELECT id FROM events WHERE organizer_token = '${otok}'`).results[0]
		.id as string;
	d1(`DELETE FROM responses WHERE invitee_id = 'e2e-accent-inv2';
	    DELETE FROM invitees WHERE id = 'e2e-accent-inv2';`);
	seedInvitee({ id: 'e2e-accent-inv2', eventId, label: 'Bo', token: 'e2e-accent-rtok2' });
	await page.goto('/r/e2e-accent-rtok2');
	await expect(page.locator('[data-accent]').first()).toHaveAttribute('data-accent', 'pink');
});

test('changing the accent from the dashboard re-renders every page with it', async ({ page }) => {
	seed(); // default yellow
	await page.goto(`/e/${OTOK}`);
	await page.getByRole('button', { name: m.edit() }).first().click();
	const form = page.locator('form[action="?/saveDetails"]');
	await form.getByRole('radio', { name: m.accentGreen() }).check();
	await form.getByRole('button', { name: m.save() }).click();
	await expect.poll(() => eventAccent(EV)).toBe('green');
	await expect(page.locator('[data-accent]').first()).toHaveAttribute('data-accent', 'green');

	await page.goto(`/r/${RTOK}`);
	await expect(page.locator('[data-accent]').first()).toHaveAttribute('data-accent', 'green');
});

test('an invalid accent value is rejected and the previous accent kept', async ({ page }) => {
	seed('pink');
	// Bypass the picker: a crafted POST is the case the server must defend.
	// Same-origin header so SvelteKit's CSRF check lets the action run.
	const base = test.info().project.use.baseURL ?? '';
	await page.request.post(`/e/${OTOK}?/saveDetails`, {
		headers: { origin: base },
		form: { title: TITLE, pollMode: 'assigned', locale: 'en', accent: 'magenta' }
	});
	await expect.poll(() => eventAccent(EV)).toBe('pink');
});
