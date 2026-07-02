import { describe, it, expect } from 'vitest';
import { sanitizeRichText, richTextIsEmpty, isRichText, toEditorHtml } from './richtext';

// sanitizeRichText() reduces markup to the allowed formatting subset;
// richTextIsEmpty()/isRichText()/toEditorHtml() handle NULL-ing and the
// legacy plain-text path (src/lib/forms/richtext).

describe('sanitizeRichText', () => {
	it('keeps every allowed tag', () => {
		const html =
			'<p><strong>a</strong> <em>b</em> <small>c</small><br></p><ul><li>d</li></ul><ol><li>e</li></ol>';
		expect(sanitizeRichText(html)).toBe(html);
	});

	it('escapes a script tag into inert text', () => {
		expect(sanitizeRichText('<p>ok</p><script>alert(1)</script>')).toBe(
			'<p>ok</p>&lt;script&gt;alert(1)&lt;/script&gt;'
		);
	});

	it('escapes allowed tag names carrying attributes', () => {
		expect(sanitizeRichText('<p onclick="x">hi</p>')).toBe('&lt;p onclick="x"&gt;hi</p>');
		expect(sanitizeRichText('<a href="https://x">y</a>')).toBe(
			'&lt;a href="https://x"&gt;y&lt;/a&gt;'
		);
	});

	it('passes text entities through untouched and is idempotent', () => {
		const html = '<p>fish &amp; chips &lt;3</p>';
		expect(sanitizeRichText(html)).toBe(html);
		expect(sanitizeRichText(sanitizeRichText(html))).toBe(sanitizeRichText(html));
	});
});

describe('richTextIsEmpty', () => {
	it('treats an empty paragraph as empty', () => {
		expect(richTextIsEmpty('<p></p>')).toBe(true);
		expect(richTextIsEmpty('<p>&nbsp;</p>')).toBe(true);
		expect(richTextIsEmpty('')).toBe(true);
	});

	it('treats any visible text as non-empty', () => {
		expect(richTextIsEmpty('<p>hej</p>')).toBe(false);
	});
});

describe('isRichText', () => {
	it('recognizes editor HTML and not legacy plain text', () => {
		expect(isRichText('<p>x</p>')).toBe(true);
		expect(isRichText('<ul><li>x</li></ul>')).toBe(true);
		expect(isRichText('Vi mødes ved indgangen.')).toBe(false);
	});
});

describe('toEditorHtml', () => {
	it('passes rich HTML through', () => {
		expect(toEditorHtml('<p>x</p>')).toBe('<p>x</p>');
	});

	it('wraps each legacy line in an escaped paragraph', () => {
		expect(toEditorHtml('a < b\nfish & chips')).toBe('<p>a &lt; b</p><p>fish &amp; chips</p>');
	});
});
