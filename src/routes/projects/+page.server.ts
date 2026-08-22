import { getDb } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform?.env?.DB) {
		return { projects: [] };
	}

	const db = getDb(platform.env.DB);
	const rows = await db.select().from(project).orderBy(desc(project.createdAt));

	return {
		projects: rows.map((p) => ({
			...p,
			tags: p.tags ? (() => { try { return JSON.parse(p.tags); } catch { return []; } })() : []
		}))
	};
};
