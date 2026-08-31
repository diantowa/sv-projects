import type { Handle } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleParaglide: Handle = ({ event, resolve }) => paraglideMiddleware(event.request, ({ request, locale }) => {
	event.request = request;

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale).replace('%paraglide.dir%', getTextDirection(locale))
	});
});

export const handle: Handle = (input) => {
	if (input.event.url.hostname === 'kaiyu.dev') {
		const canonicalUrl = new URL(input.event.url);
		canonicalUrl.protocol = 'https:';
		canonicalUrl.hostname = 'kakyu.dev';
		canonicalUrl.port = '';

		return new Response(null, {
			status: 308,
			headers: { location: canonicalUrl.toString() }
		});
	}

	return handleParaglide(input);
};
