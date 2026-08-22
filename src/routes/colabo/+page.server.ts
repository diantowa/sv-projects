import { getDb } from '$lib/server/db';
import { collaboration, inquiry } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const siteKey = platform?.env?.TURNSTILE_SITE_KEY ?? '';

	if (!platform?.env?.DB) {
		return { collaborations: [], siteKey };
	}

	const db = getDb(platform.env.DB);
	const collaborations = await db
		.select()
		.from(collaboration)
		.where(eq(collaboration.published, true))
		.orderBy(desc(collaboration.createdAt));

	return { collaborations, siteKey };
};

const str = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v.trim() : '');

export const actions: Actions = {
	inquire: async ({ request, platform }) => {
		const form = await request.formData();

		// Honeypot: real users never fill this hidden field — silently accept + drop.
		if (str(form.get('website'))) {
			return { success: true };
		}

		const name = str(form.get('name'));
		const email = str(form.get('email'));
		const message = str(form.get('message'));
		const company = str(form.get('company')) || null;
		const link = str(form.get('link')) || null;
		const projectType = str(form.get('projectType')) || null;
		const budget = str(form.get('budget')) || null;
		const timeline = str(form.get('timeline')) || null;

		const values = { name, email, company, link, projectType, budget, timeline, message };

		if (!name || !email || !message) {
			return fail(400, { error: 'Name, email, and project details are required.', values });
		}

		// Cloudflare Turnstile — only enforced when a secret is configured.
		const secret = platform?.env?.TURNSTILE_SECRET;
		if (secret) {
			const token = str(form.get('cf-turnstile-response'));
			if (!token) {
				return fail(400, { error: 'Please complete the verification.', values });
			}
			const body = new FormData();
			body.append('secret', secret);
			body.append('response', token);
			const ip = request.headers.get('CF-Connecting-IP');
			if (ip) body.append('remoteip', ip);
			const verify = await fetch(
				'https://challenges.cloudflare.com/turnstile/v0/siteverify',
				{ method: 'POST', body }
			);
			const outcome = (await verify.json()) as { success?: boolean };
			if (!outcome.success) {
				return fail(400, { error: 'Verification failed. Please try again.', values });
			}
		}

		if (!platform?.env?.DB) {
			return fail(503, { error: 'Service unavailable. Please try again later.', values });
		}

		const db = getDb(platform.env.DB);
		await db.insert(inquiry).values({
			name,
			email,
			company,
			projectType,
			budget,
			timeline,
			message,
			link
		});

		return { success: true };
	}
};
