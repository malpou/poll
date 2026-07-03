import { test, expect, type Page } from '@playwright/test';
import { m } from '../../../src/lib/paraglide/messages';
import { d1, seedDateOption, seedEvent, seedInvitee, wipeEvent } from '../support/db';

// admin-link-email (openspec/specs/admin-link-email): an optional organizer
// email on /create emails the admin link + a gate code and stores the code on
// the poll; organizer pages then prompt for the code once per browser. Polls
// created without an email carry no code and are never gated. The e2e worker
// has no EMAIL binding, so the send is a silent no-op here - which is exactly
// the delivery-unavailable condition the spec requires creation to survive.

test.use({ locale: 'en-US', timezoneId: 'America/New_York' });

// Minimal valid poll: a title plus one calendar day. Optionally type an email.
async function createPoll(page: Page, title: string, email?: string) {
	await page.goto('/create');
	await page.getByLabel(m.fieldTitle()).fill(title);
	if (email !== undefined) await page.getByLabel(m.fieldOrganizerEmail()).fill(email);
	await page.getByRole('button', { name: '12', exact: true }).click();
}

function adminCodeByToken(otok: string): string | null {
	const row = d1(`SELECT admin_code FROM events WHERE organizer_token = '${otok}'`).results[0];
	return (row?.admin_code as string | null) ?? null;
}

// --- Create form (Optional organizer email requirement) ---

test('Create without an email lands on the dashboard and stores no code', async ({ page }) => {
	await createPoll(page, 'No email poll');
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	const otok = page.url().split('/').pop() ?? '';
	await expect.poll(() => adminCodeByToken(otok)).toBeNull();
	// Ungated: the creator sees the dashboard, not a prompt.
	await expect(page.getByRole('button', { name: m.codePromptSubmit() })).toHaveCount(0);
});

test('Reject an invalid email address without creating the poll', async ({ page }) => {
	const title = 'Invalid email poll';
	await createPoll(page, title, 'not-an-email');
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page.getByText(m.errorInvalidEmail(), { exact: true })).toBeVisible();
	await expect(page).toHaveURL(/\/create$/);
	// No row was written for this attempt.
	await expect
		.poll(() => d1(`SELECT COUNT(*) AS n FROM events WHERE title = '${title}'`).results[0].n)
		.toBe(0);
});

test('Create with an email lands on the dashboard and stores a code', async ({ page }) => {
	await createPoll(page, 'With email poll', 'organizer@example.com');
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	const otok = page.url().split('/').pop() ?? '';
	await expect.poll(() => adminCodeByToken(otok)).not.toBeNull();
});

test('Emailed poll hides the save-your-link reminder, no-email poll shows it', async ({ page }) => {
	// Emailed: the organizer already has a durable copy, so no reminder.
	await createPoll(page, 'Emailed reminder poll', 'reminder@example.com');
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	await expect(page.getByText(m.organizerLinkTitle())).toHaveCount(0);
	// No email: the reminder is the only durable copy, so it stays.
	await createPoll(page, 'No-email reminder poll');
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	await expect(page.getByText(m.organizerLinkTitle()).first()).toBeVisible();
});

test('Creator is not prompted for the code on the dashboard', async ({ page }) => {
	await createPoll(page, 'Creator unlocked poll', 'creator@example.com');
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	// The create action set the unlock cookie, so no prompt - the poll title shows.
	await expect(page.getByRole('button', { name: m.codePromptSubmit() })).toHaveCount(0);
	await expect(page.getByText('Creator unlocked poll').first()).toBeVisible();
});

test('Address is not stored anywhere on the event', async ({ page }) => {
	const address = 'private.address@example.com';
	await createPoll(page, 'No PII poll', address);
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	const otok = page.url().split('/').pop() ?? '';
	await expect
		.poll(() => {
			const row = d1(`SELECT * FROM events WHERE organizer_token = '${otok}'`).results[0];
			return row ? JSON.stringify(row).includes(address) : true;
		})
		.toBe(false);
});

test('Delivery unavailable does not block creation', async ({ page }) => {
	// No EMAIL binding in e2e = delivery unavailable; creation must still succeed.
	await createPoll(page, 'Delivery unavailable poll', 'anyone@example.com');
	await page.getByRole('button', { name: m.create() }).click();
	await expect(page).toHaveURL(/\/e\/[A-Za-z0-9]+$/);
	await expect(page.getByText('Delivery unavailable poll').first()).toBeVisible();
});

// --- Code gate (Admin code gate requirement) ---

const GATE_EV = 'e2e-adminlink-ev';
const GATE_OTOK = 'e2e-adminlink-otok';
const CODE = 'ABCD2345';

function seedGated(adminCode: string | null) {
	wipeEvent(GATE_EV);
	seedEvent({
		id: GATE_EV,
		title: 'Gated poll',
		organizerToken: GATE_OTOK,
		status: 'open',
		adminCode
	});
	seedDateOption({ id: 'e2e-adminlink-opt', eventId: GATE_EV, startsAt: null, sortOrder: 0 });
	seedInvitee({
		id: 'e2e-adminlink-inv',
		eventId: GATE_EV,
		label: 'Anna',
		token: 'e2e-adminlink-rtok'
	});
}

test('New browser must enter the code before any organizer content', async ({ page }) => {
	seedGated(CODE);
	await page.goto(`/e/${GATE_OTOK}`);
	await expect(page.getByRole('button', { name: m.codePromptSubmit() })).toBeVisible();
	await expect(page.getByText('Gated poll')).toHaveCount(0);
});

test('Correct code unlocks and is remembered by the browser', async ({ page }) => {
	seedGated(CODE);
	await page.goto(`/e/${GATE_OTOK}`);
	await page.getByLabel(m.codePromptLabel()).fill(CODE);
	await page.getByRole('button', { name: m.codePromptSubmit() }).click();
	// Dashboard opens - the prompt is gone and the poll title shows.
	await expect(page.getByRole('button', { name: m.codePromptSubmit() })).toHaveCount(0);
	await expect(page.getByText('Gated poll').first()).toBeVisible();
	// Same browser, revisit: no prompt (cookie holds the code).
	await page.goto(`/e/${GATE_OTOK}`);
	await expect(page.getByRole('button', { name: m.codePromptSubmit() })).toHaveCount(0);
	await expect(page.getByText('Gated poll').first()).toBeVisible();
});

test('Wrong code is rejected and reveals no organizer content', async ({ page }) => {
	seedGated(CODE);
	await page.goto(`/e/${GATE_OTOK}`);
	await page.getByLabel(m.codePromptLabel()).fill('WRONG999');
	await page.getByRole('button', { name: m.codePromptSubmit() }).click();
	await expect(page.getByText(m.codePromptError())).toBeVisible();
	await expect(page.getByText('Gated poll')).toHaveCount(0);
});

test('Polls without a code stay ungated', async ({ page }) => {
	seedGated(null);
	await page.goto(`/e/${GATE_OTOK}`);
	await expect(page.getByRole('button', { name: m.codePromptSubmit() })).toHaveCount(0);
	await expect(page.getByText('Gated poll').first()).toBeVisible();
});
