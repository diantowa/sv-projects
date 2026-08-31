import { CONTACT_TYPES, type ContactType } from '$lib/colabo/contact';
import { getDb } from '$lib/server/db';
import { inquiry } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const LIMITS = {
	name: 120,
	company: 160,
	message: 5000,
	contactValue: 320
} as const;

const str = (value: FormDataEntryValue | null) =>
	typeof value === 'string' ? value.trim() : '';

const isContactType = (value: string): value is ContactType =>
	(CONTACT_TYPES as readonly string[]).includes(value);

export const load: PageServerLoad = async ({ platform }) => ({
	siteKey: platform?.env?.TURNSTILE_SITE_KEY ?? ''
});

export const actions: Actions = {
	inquire: async ({ request, platform }) => {
		const form = await request.formData();

		if (str(form.get('website'))) return { success: true };

		const name = str(form.get('name'));
		const company = str(form.get('company')) || null;
		const message = str(form.get('message'));
		const contactTypeValue = str(form.get('contactType')) || 'none';
		const contactValue = str(form.get('contactValue')) || null;

		if (!name || !message) {
			return fail(400, { error: 'Add your name and message before sending.' });
		}

		if (
			name.length > LIMITS.name ||
			(company?.length ?? 0) > LIMITS.company ||
			message.length > LIMITS.message ||
			(contactValue?.length ?? 0) > LIMITS.contactValue
		) {
			return fail(400, { error: 'One or more fields are too long.' });
		}

		if (!isContactType(contactTypeValue)) {
			return fail(400, { error: 'Choose a valid contact method.' });
		}

		if (contactTypeValue !== 'none' && !contactValue) {
			return fail(400, { error: 'Add your contact detail or choose No contact.' });
		}

		if (contactTypeValue === 'email' && contactValue && !/^\S+@\S+\.\S+$/.test(contactValue)) {
			return fail(400, { error: 'Enter a valid email address.' });
		}

		const secret = platform?.env?.TURNSTILE_SECRET;
		if (secret) {
			const token = str(form.get('cf-turnstile-response'));
			if (!token) return fail(400, { error: 'Please complete the verification.' });

			try {
				const body = new FormData();
				body.append('secret', secret);
				body.append('response', token);
				const ip = request.headers.get('CF-Connecting-IP');
				if (ip) body.append('remoteip', ip);

				const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
					method: 'POST',
					body
				});
				const outcome = (await verify.json()) as { success?: boolean };
				if (!outcome.success) {
					return fail(400, { error: 'Verification failed. Please try again.' });
				}
			} catch (error) {
				console.error('Turnstile verification failed', error);
				return fail(503, { error: 'Verification is temporarily unavailable.' });
			}
		}

		if (!platform?.env?.DB) {
			return fail(503, { error: 'Private inbox is unavailable. Your draft is still here.' });
		}

		try {
			await getDb(platform.env.DB).insert(inquiry).values({
				name,
				email: contactTypeValue === 'email' ? contactValue : null,
				company,
				message,
				contactType: contactTypeValue,
				contactValue: contactTypeValue === 'none' ? null : contactValue,
				source: 'private_note'
			});
		} catch (error) {
			console.error('Failed to store inquiry', error);
			return fail(503, { error: 'Private inbox is unavailable. Your draft is still here.' });
		}

		return { success: true };
	}
};
