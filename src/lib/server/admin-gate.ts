import type { CookieSerializeOptions } from 'cookie';

// Per-event admin-unlock cookie, mirroring the `edit_${id}` submitter cookie in
// the /s route. Holds the admin code so a trusted browser skips the prompt.
export const adminCookie = (eventId: string) => `admin_${eventId}`;

// HttpOnly + long-lived, same shape as the /s submit cookie: the browser is the
// session, so the code lives 180 days.
export const ADMIN_COOKIE_OPTS: CookieSerializeOptions & { path: string } = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	maxAge: 60 * 60 * 24 * 180
};

/**
 * Constant-time equality: whether the browser's cookie holds the poll's admin
 * code. Length mismatch (incl. a missing cookie) is false; equal-length inputs
 * compare every char so timing leaks nothing about a partial match.
 */
export function codeMatches(cookieVal: string | undefined, code: string): boolean {
	if (cookieVal?.length !== code.length) return false;
	let diff = 0;
	for (let i = 0; i < code.length; i++) diff |= cookieVal.charCodeAt(i) ^ code.charCodeAt(i);
	return diff === 0;
}
