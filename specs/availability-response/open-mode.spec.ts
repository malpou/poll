import { test, expect, type Page } from '@playwright/test';
import { m } from '../../src/lib/paraglide/messages';
import {
	inviteesFor,
	responsesFor,
	seedDateOption,
	seedEvent,
	seedInvitee,
	seedResponse,
	wipeEvent
} from '../support/db';

// Open mode: one shared /s/{share_token} link. Anyone opening it names themselves
// and submits; each submission becomes an invitee row, so results reuse the same
// machinery as assigned mode. Seeding goes through the shared e2e/db.ts helper.

const SHARE = 'e2e-share-token';
const OTOK = 'e2e-otok-open-mode';
const EV = 'e2e-ev-open-mode';
const D1 = 'e2e-om-d1';
const D2 = 'e2e-om-d2';
const TITLE = 'Åbent link (e2e)';

function seed() {
	wipeEvent(EV);
	seedEvent({
		id: EV,
		title: TITLE,
		organizerToken: OTOK,
		status: 'open',
		pollMode: 'open',
		shareToken: SHARE
	});
	seedDateOption({ id: D1, eventId: EV, startsAt: '2026-09-12T08:00:00Z', sortOrder: 0 });
	seedDateOption({ id: D2, eventId: EV, startsAt: '2026-09-20T09:00:00Z', sortOrder: 1 });
}

function mark(page: Page, dateId: string, label: string) {
	return page.getByTestId(`date-card-${dateId}`).getByRole('button', { name: label }).click();
}

test.beforeEach(seed);

test('unknown or non-open share token shows the friendly not-found', async ({ page }) => {
	await page.goto('/s/does-not-exist');
	await expect(page.getByText(m.linkNotFound())).toBeVisible();
});

test('anyone can submit a name + preferences and gets a personal edit link', async ({ page }) => {
	await page.goto(`/s/${SHARE}`);
	await expect(page.getByRole('heading', { name: TITLE })).toBeVisible();

	await page.getByLabel(m.namePrompt()).fill('Charlie');
	await mark(page, D1, m.prefPreferred());
	await mark(page, D2, m.prefAvailable());
	await page.getByRole('button', { name: m.sendAnswer() }).click();

	await expect(page.getByText(m.savedSub())).toBeVisible();
	// Personal edit link is shown for the submitter to save.
	await expect(page.getByText(m.editLinkTitle())).toBeVisible();

	const invitees = inviteesFor(EV);
	expect(invitees).toHaveLength(1);
	expect(invitees[0].label).toBe('Charlie');
	expect(responsesFor(invitees[0].id)).toEqual([
		{ date_option_id: D1, preference: 'preferred' },
		{ date_option_id: D2, preference: 'available' }
	]);
});

test('revisiting the share link edits the same answer, no duplicate invitee', async ({ page }) => {
	await page.goto(`/s/${SHARE}`);
	await page.getByLabel(m.namePrompt()).fill('Dana');
	await mark(page, D1, m.prefPreferred());
	await mark(page, D2, m.prefUnavailable());
	await page.getByRole('button', { name: m.sendAnswer() }).click();
	await expect(page.getByText(m.savedSub())).toBeVisible();

	const [me] = inviteesFor(EV);

	// The cookie from the first submit redirects the share link to /r/{token}.
	await page.goto(`/s/${SHARE}`);
	await expect(page).toHaveURL(new RegExp(`/r/${me.token}$`));
	await expect(page.getByText(m.greeting({ name: 'Dana' }))).toBeVisible();

	// Edit in place - still one invitee, updated preference.
	await page.getByRole('button', { name: m.editAnswer() }).click();
	await mark(page, D1, m.prefUnavailable());
	await page.locator('form').evaluate((f: HTMLFormElement) => f.requestSubmit());
	await expect(page.getByText(m.savedSub())).toBeVisible();

	expect(inviteesFor(EV)).toHaveLength(1);
	expect(responsesFor(me.id)).toEqual([
		{ date_option_id: D1, preference: 'unavailable' },
		{ date_option_id: D2, preference: 'unavailable' }
	]);
});

test('dashboard in open mode shows the shared link, a read-only respondent list, and an open-style summary', async ({
	page
}) => {
	// One person has already submitted via the shared link.
	seedInvitee({ id: `${EV}-r1`, eventId: EV, label: 'Erin', token: `${SHARE}-r1` });
	seedResponse({ inviteeId: `${EV}-r1`, dateOptionId: D1, preference: 'preferred' });

	await page.goto(`/e/${OTOK}`);
	await expect(page.getByText(m.shareLinkTitle())).toBeVisible();
	await expect(page.getByText(`/s/${SHARE}`)).toBeVisible();
	// The per-person "add invitee" form is not rendered in open mode.
	await expect(page.getByRole('button', { name: m.addParticipant() })).toHaveCount(0);
	// The respondent shows in the read-only list, but with no per-person link.
	const erinRow = page.locator('div').filter({ hasText: 'Erin' }).last();
	await expect(erinRow).toBeVisible();
	await expect(erinRow.getByRole('button', { name: m.copyLink() })).toHaveCount(0);
	// Summary reads "1 har svaret", never "1 af 1 har svaret".
	await expect(page.getByText(m.answeredLabelOpen({ total: 1 }), { exact: true })).toBeVisible();
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
