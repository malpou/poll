import { describe, it, expect } from 'vitest';
import { composeAdminEmail, composePokerLinkEmail, composePokerSummaryEmail } from './email';
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

describe('planning-poker room emails', () => {
	const CTRL = 'https://poll.malpou.io/poker/c/abc123';

	it('the link email carries the room title and the controller link', () => {
		const { subject, text, html } = composePokerLinkEmail({
			roomTitle: 'Sprint 12',
			controllerUrl: CTRL
		});
		expect(subject).toContain('Sprint 12');
		for (const body of [text, html]) {
			expect(body).toContain(CTRL);
			expect(body).toContain('Sprint 12');
			expect(body).toContain(m.pokerEmailSecretWarning());
		}
	});

	it('the summary carries the title and every decided item with its estimate', () => {
		const { subject, text, html } = composePokerSummaryEmail({
			roomTitle: 'Sprint 12',
			results: [
				{ title: 'CDX-123', estimate: '5' },
				{ title: 'CDX-124', estimate: 'split' }
			]
		});
		expect(subject).toContain('Sprint 12');
		for (const body of [text, html]) {
			expect(body).toContain('CDX-123');
			expect(body).toContain('5');
			expect(body).toContain('CDX-124');
			expect(body).toContain('split');
		}
	});

	it('says so rather than sending an empty list', () => {
		const { text } = composePokerSummaryEmail({ roomTitle: 'Sprint 12', results: [] });
		expect(text).toContain(m.pokerEmailSummaryEmpty());
	});

	it('escapes a controller-typed item title in the html body', () => {
		const { html } = composePokerSummaryEmail({
			roomTitle: 'Sprint 12',
			results: [{ title: '<img src=x onerror=alert(1)>', estimate: '5' }]
		});
		expect(html).not.toContain('<img');
		expect(html).toContain('&lt;img');
	});

	it('renders in the requested locale, not the base one', () => {
		const da = composePokerSummaryEmail({ roomTitle: 'S', results: [], locale: 'da' });
		const fr = composePokerSummaryEmail({ roomTitle: 'S', results: [], locale: 'fr' });
		expect(da.subject).not.toBe(fr.subject);
	});
});
