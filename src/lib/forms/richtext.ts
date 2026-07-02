// Rich-text description helpers. The editor emits a small HTML subset; the
// server re-derives safety by escaping everything and unescaping only the
// exact allowed tokens - no attributes can survive, so no attribute context
// exists in the output and entity passthrough is safe.

// ponytail: exact-token allowlist over an HTML parser - the allowed tags carry
// no attributes, so string matching is complete; swap for a real sanitizer only
// if attributes (e.g. links) ever become allowed.
const ALLOWED = [
	'p',
	'/p',
	'strong',
	'/strong',
	'em',
	'/em',
	'ul',
	'/ul',
	'ol',
	'/ol',
	'li',
	'/li',
	'small',
	'/small',
	'br'
];

/**
 * Reduce arbitrary markup to the allowed formatting subset. Text entities from
 * the editor (&amp; etc.) pass through untouched, so the function is idempotent.
 */
export function sanitizeRichText(input: string): string {
	let s = input.replaceAll('<', '&lt;').replaceAll('>', '&gt;');
	for (const t of ALLOWED) s = s.replaceAll(`&lt;${t}&gt;`, `<${t}>`);
	return s;
}

/**
 * True when the HTML has no visible text (an empty editor serializes as
 * `<p></p>`); such a description is stored as NULL.
 */
export function richTextIsEmpty(html: string): boolean {
	return (
		html
			.replace(/<[^>]*>/g, '')
			.replaceAll('&nbsp;', ' ')
			.trim() === ''
	);
}

/**
 * Distinguish editor-produced HTML from a legacy plain-text description, which
 * renders through the old whitespace-preserving path.
 */
export function isRichText(description: string): boolean {
	return /^<(p|ul|ol)>/.test(description);
}

/**
 * Seed the editor from a stored description: HTML passes through, legacy plain
 * text becomes one escaped <p> per line so its line breaks survive editing.
 */
export function toEditorHtml(description: string): string {
	if (description === '' || isRichText(description)) return description;
	return description
		.split('\n')
		.map(
			(line) =>
				`<p>${line.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>`
		)
		.join('');
}
