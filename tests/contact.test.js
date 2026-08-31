import { describe, expect, test } from 'bun:test';
import { buildMailtoUrl, buildWhatsAppUrl, parseIdentity } from '../src/lib/colabo/contact.ts';

describe('parseIdentity', () => {
	test('keeps a plain name intact', () => {
		expect(parseIdentity('Wahyu')).toEqual({ name: 'Wahyu', company: '', hasSeparator: false });
	});
	test('splits only the first slash', () => {
		expect(parseIdentity('Wahyu / Kakyu / Studio')).toEqual({
			name: 'Wahyu', company: 'Kakyu / Studio', hasSeparator: true
		});
	});
});

describe('contact links', () => {
	const draft = { name: 'Ayu', company: 'Studio & Co', message: 'Let us build / ship.' };
	test('normalizes and encodes WhatsApp', () => {
		const url = new URL(buildWhatsAppUrl('+62 896-8740-7837', draft));
		expect(url.origin + url.pathname).toBe('https://wa.me/6289687407837');
		expect(url.searchParams.get('text')).toContain('Studio & Co');
	});
	test('encodes mail subject and body', () => {
		const url = buildMailtoUrl('wahyu@kakyu.dev', draft);
		expect(url).toStartWith('mailto:wahyu@kakyu.dev?');
		expect(decodeURIComponent(url)).toContain('Hello from Ayu / Studio & Co');
	});
});
