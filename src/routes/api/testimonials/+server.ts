import { json, type RequestEvent } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { testimonial } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export async function GET({ platform }: RequestEvent) {
	if (!platform?.env?.DB) {
		return json([]);
	}
	const db = getDb(platform.env.DB);
	const rows = await db.select().from(testimonial).orderBy(desc(testimonial.createdAt));
	const parsed = rows.map(r => ({
		...r,
		socialLinks: r.socialLinks ? (() => { try { return JSON.parse(r.socialLinks); } catch { return null; } })() : null
	}));
	return json(parsed);
}

// Writes are CMS-only (sv-manager, behind auth). No public POST: anyone could inject testimonials.
