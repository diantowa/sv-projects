import { getDb } from '$lib/server/db';
import { blogPost } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import { marked } from 'marked';

const SITE_URL = 'https://kakyu.dev';

const escapeXml = (s: string) =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

export const prerender = false;

export async function GET({ platform }) {
	if (!platform?.env?.DB) {
		return new Response('Database unavailable', { status: 503 });
	}

	const db = getDb(platform.env.DB);
	const rows = await db.select().from(blogPost).orderBy(desc(blogPost.createdAt));

	const items = await Promise.all(
		rows.map(async (post) => {
			const slug = post.slug;
			const title = escapeXml(post.title ?? '');
			const link = `${SITE_URL}/blog/${slug}`;
			const date = post.date
				? new Date(post.date).toUTCString()
				: new Date(post.createdAt ?? Date.now()).toUTCString();
			const body = post.body
				? await marked.parse(post.body, { gfm: true, breaks: false })
				: '';
			const excerpt = escapeXml(post.excerpt ?? '');
			const tags = (() => {
				try {
					return JSON.parse(post.tags ?? '[]');
				} catch {
					return [];
				}
			})() as string[];

			return `  <item>
    <title>${title}</title>
    <link>${link}</link>
    <guid isPermaLink="false">${escapeXml(post.id)}</guid>
    <pubDate>${date}</pubDate>
${tags.map((t) => `    <category>${escapeXml(t)}</category>`).join('\n')}
    <description>${excerpt}</description>
${body ? `    <content:encoded><![CDATA[${body}]]></content:encoded>` : ''}
  </item>`;
		})
	);

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Wahyudi Chrisdianto - Blog</title>
    <link>${SITE_URL}</link>
    <description>Thoughts on development, design, and building for the web.</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600'
		}
	});
}
