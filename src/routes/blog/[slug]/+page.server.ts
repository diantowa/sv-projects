import { getDb } from '$lib/server/db';
import { blogPost } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { marked } from 'marked';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform }) => {
	if (!platform?.env?.DB) {
		throw error(404, 'Article not found');
	}

	const db = getDb(platform.env.DB);
	const [post] = await db.select().from(blogPost).where(eq(blogPost.slug, params.slug));

	if (!post) {
		throw error(404, 'Article not found');
	}

	// Body is Markdown (authored via ../sv_manager). Render to HTML (incl. images) server-side.
	const bodyHtml = post.body ? await marked.parse(post.body, { gfm: true, breaks: false }) : '';

	return {
		post: {
			...post,
			bodyHtml,
			tags: post.tags
				? (() => {
						try {
							return JSON.parse(post.tags);
						} catch {
							return [];
						}
					})()
				: []
		}
	};
};
