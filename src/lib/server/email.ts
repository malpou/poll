import { m } from '$lib/paraglide/messages';
import { baseLocale } from '$lib/paraglide/runtime';
import type { Locale } from '$lib/types';

const FROM = 'poll@malpou.io';

export interface AdminEmailInput {
	organizerUrl: string;
	adminCode: string;
	locale: Locale;
}

/**
 * Builds the transactional email in the poll's language. Pure - no binding, no
 * I/O - so the unit test can assert subject/body against the m.*() values.
 */
export function composeAdminEmail({ organizerUrl, adminCode, locale }: AdminEmailInput): {
	subject: string;
	text: string;
	html: string;
} {
	const subject = m.emailSubject({}, { locale });
	const intro = m.emailIntro({}, { locale });
	const linkLabel = m.emailLinkLabel({}, { locale });
	const codeLabel = m.emailCodeLabel({}, { locale });
	const warning = m.emailSecretWarning({}, { locale });

	const text = `${intro}\n\n${linkLabel}: ${organizerUrl}\n${codeLabel}: ${adminCode}\n\n${warning}`;
	const html =
		`<p>${intro}</p>` +
		`<p>${linkLabel}: <a href="${organizerUrl}">${organizerUrl}</a></p>` +
		`<p>${codeLabel}: <strong>${adminCode}</strong></p>` +
		`<p>${warning}</p>`;

	return { subject, text, html };
}

/**
 * Best-effort send via the Cloudflare Email Service binding. No-op when the
 * EMAIL binding is absent (local wrangler dev, e2e, preview) so those keep
 * working with no email onboarding; a send failure is logged, never thrown.
 * ponytail: binding-absent = silent skip; add a dev mailbox only if we ever
 * want to e2e-assert delivered bodies.
 */
export async function sendAdminEmail(
	platform: App.Platform | undefined,
	input: AdminEmailInput & { to: string }
): Promise<void> {
	const binding = platform?.env.EMAIL;
	if (!binding) return;
	const { subject, text, html } = composeAdminEmail(input);
	try {
		await binding.send({
			to: input.to,
			from: { email: FROM, name: m.appName({}, { locale: input.locale }) },
			subject,
			html,
			text
		});
	} catch (err) {
		console.error('admin-link email send failed', err);
	}
}

// --- Planning poker room emails (openspec/specs/planning-poker "Room email") ---
//
// Two transactional emails, both to the controller's own address: the room's
// controller link when they attach it, and the results summary when the room
// closes. Composers are pure so the unit test asserts bodies without a binding.
//
// ponytail: rendered in the base language, like every other planning-poker
// surface today. When a room carries its own language, pass it through here -
// the composers already take a locale.

export interface PokerLinkEmailInput {
	roomTitle: string;
	controllerUrl: string;
	locale?: Locale;
}

export function composePokerLinkEmail({
	roomTitle,
	controllerUrl,
	locale = baseLocale
}: PokerLinkEmailInput): { subject: string; text: string; html: string } {
	const subject = m.pokerEmailLinkSubject({ title: roomTitle }, { locale });
	const intro = m.pokerEmailLinkIntro({ title: roomTitle }, { locale });
	const linkLabel = m.pokerEmailControllerLinkLabel({}, { locale });
	const warning = m.pokerEmailSecretWarning({}, { locale });

	const text = `${intro}\n\n${linkLabel}: ${controllerUrl}\n\n${warning}`;
	const html =
		`<p>${intro}</p>` +
		`<p>${linkLabel}: <a href="${controllerUrl}">${controllerUrl}</a></p>` +
		`<p>${warning}</p>`;
	return { subject, text, html };
}

export interface PokerSummaryEmailInput {
	roomTitle: string;
	results: { title: string; estimate: string }[];
	locale?: Locale;
}

/**
 * The closing summary: the room's title and every decided item with its final
 * estimate, in the order they were decided. A room closed without deciding
 * anything says so rather than sending an empty list.
 */
export function composePokerSummaryEmail({
	roomTitle,
	results,
	locale = baseLocale
}: PokerSummaryEmailInput): { subject: string; text: string; html: string } {
	const subject = m.pokerEmailSummarySubject({ title: roomTitle }, { locale });
	const intro = m.pokerEmailSummaryIntro({ title: roomTitle }, { locale });

	if (results.length === 0) {
		const empty = m.pokerEmailSummaryEmpty({}, { locale });
		return { subject, text: `${intro}\n\n${empty}`, html: `<p>${intro}</p><p>${empty}</p>` };
	}

	const text = [intro, '', ...results.map((r) => `${r.title}: ${r.estimate}`)].join('\n');
	const html =
		`<p>${intro}</p><ul>` +
		results.map((r) => `<li>${escapeHtml(r.title)}: <strong>${r.estimate}</strong></li>`).join('') +
		`</ul>`;
	return { subject, text, html };
}

// Item titles are controller-typed free text and land inside the HTML body.
function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

async function send(
	platform: App.Platform | undefined,
	to: string,
	locale: Locale,
	built: { subject: string; text: string; html: string },
	what: string
): Promise<void> {
	const binding = platform?.env.EMAIL;
	if (!binding) return;
	try {
		await binding.send({
			to,
			from: { email: FROM, name: m.appName({}, { locale }) },
			subject: built.subject,
			html: built.html,
			text: built.text
		});
	} catch (err) {
		console.error(`${what} email send failed`, err);
	}
}

/** Best-effort, same discipline as the admin-link email: never throws. */
export async function sendPokerLinkEmail(
	platform: App.Platform | undefined,
	input: PokerLinkEmailInput & { to: string }
): Promise<void> {
	const locale = input.locale ?? baseLocale;
	await send(platform, input.to, locale, composePokerLinkEmail(input), 'poker room link');
}

export async function sendPokerSummaryEmail(
	platform: App.Platform | undefined,
	input: PokerSummaryEmailInput & { to: string }
): Promise<void> {
	const locale = input.locale ?? baseLocale;
	await send(platform, input.to, locale, composePokerSummaryEmail(input), 'poker room summary');
}
