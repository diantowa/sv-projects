import { getDb } from '$lib/server/db';
import { blogPost } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform?.env?.DB) {
		return { posts: [] };
	}

	const db = getDb(platform.env.DB);
	const rows = await db.select().from(blogPost).orderBy(desc(blogPost.createdAt));

	return {
		posts: rows.map((p) => ({
			id: p.id,
			title: p.title,
			excerpt: p.excerpt ?? '',
			slug: p.slug,
			date: p.date ?? '',
			tags: p.tags ? (() => { try { return JSON.parse(p.tags); } catch { return []; } })() : []
		}))
	};
};
