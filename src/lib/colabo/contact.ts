export const CONTACT_TYPES = [
	'email',
	'whatsapp',
	'telegram',
	'instagram',
	'messenger',
	'x',
	'threads',
	'none'
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];

export type MessageDraft = {
	name: string;
	company?: string;
	message: string;
};

export function parseIdentity(value: string): {
	name: string;
	company: string;
	hasSeparator: boolean;
} {
	const separator = value.indexOf('/');
	if (separator === -1) return { name: value, company: '', hasSeparator: false };

	return {
		name: value.slice(0, separator).trimEnd(),
		company: value.slice(separator + 1).trimStart(),
		hasSeparator: true
	};
}

export function composeContactMessage({ name, company, message }: MessageDraft): string {
	const identity = company ? `${name} — ${company}` : name;
	return `Hi Wahyu,\n\n${message}\n\n— ${identity}`;
}

export function buildWhatsAppUrl(number: string, draft: MessageDraft): string {
	const normalizedNumber = number.replace(/\D/g, '');
	return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(composeContactMessage(draft))}`;
}

export function buildMailtoUrl(address: string, draft: MessageDraft): string {
	const subject = draft.company ? `Hello from ${draft.name} / ${draft.company}` : `Hello from ${draft.name}`;
	return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(composeContactMessage(draft))}`;
}
