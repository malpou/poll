import { m } from '$lib/paraglide/messages';
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
