import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// ponytail: temporary binding probe, delete once Iteration 2 lands real routes.
export const GET: RequestHandler = async ({ platform }) => {
	const row = await platform!.env.DB.prepare('SELECT 1 as ok').first<{ ok: number }>();
	return json({ ok: row?.ok === 1 });
};
