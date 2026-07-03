import { describe, it, expect } from 'vitest';
import { composeAdminEmail } from './email';
import { m } from '$lib/paraglide/messages';

const URL = 'https://poll.malpou.io/e/abc123';
const CODE = 'ABCD2345';

describe('composeAdminEmail', () => {
	it('builds subject and body from the poll locale (da) and carries the link + code', () => {
		const { subject, text, html } = composeAdminEmail({
			organizerUrl: URL,
			adminCode: CODE,
			locale: 'da'
		});
		expect(subject).toBe(m.emailSubject({}, { locale: 'da' }));
		for (const body of [text, html]) {
			expect(body).toContain(URL);
			expect(body).toContain(CODE);
			expect(body).toContain(m.emailSecretWarning({}, { locale: 'da' }));
		}
	});

	it('renders in the requested locale, not the base one', () => {
		const da = composeAdminEmail({ organizerUrl: URL, adminCode: CODE, locale: 'da' });
		const fr = composeAdminEmail({ organizerUrl: URL, adminCode: CODE, locale: 'fr' });
		expect(da.subject).not.toBe(fr.subject);
		expect(fr.subject).toBe(m.emailSubject({}, { locale: 'fr' }));
	});
});
