<script lang="ts">
	import { enhance } from '$app/forms';
	import ContactChannelSheet from '$lib/components/ContactChannelSheet.svelte';
	import { buildMailtoUrl, buildWhatsAppUrl, parseIdentity, type ContactType } from '$lib/colabo/contact';
	import { WHATSAPP_NUMBER } from '$lib/configs/navs';
	import { onDestroy, tick } from 'svelte';

	type SheetStep = 'channels' | 'private' | 'success';
	type TurnstileApi = {
		render: (element: HTMLElement, options: { sitekey: string }) => string | number;
		reset: (id: string | number) => void;
		remove: (id: string | number) => void;
	};

	let { data } = $props();
	const formId = 'colabo-composer';
	const publicEmail = 'wahyu@kakyu.dev';
	let formElement = $state<HTMLFormElement | null>(null);
	let identityInput = $state<HTMLInputElement | null>(null);
	let companyInput = $state<HTMLInputElement | null>(null);
	let sendButton = $state<HTMLButtonElement | null>(null);
	let turnstileElement = $state<HTMLDivElement | null>(null);
	let identity = $state('');
	let company = $state('');
	let companyVisible = $state(false);
	let message = $state('');
	let sheetOpen = $state(false);
	let sheetStep = $state<SheetStep>('channels');
	let contactType = $state<ContactType>('none');
	let contactValue = $state('');
	let submitting = $state(false);
	let composerError = $state('');
	let serverError = $state('');
	let anchorRight = $state(24);
	let anchorTop = $state(160);
	let turnstileId: string | number | null = null;
	let turnstileLoading = false;

	function turnstileApi(): TurnstileApi | undefined {
		return (window as typeof window & { turnstile?: TurnstileApi }).turnstile;
	}

	function mountTurnstile() {
		if (!data.siteKey || !turnstileElement || turnstileId !== null) return;
		const api = turnstileApi();
		if (api) {
			turnstileId = api.render(turnstileElement, { sitekey: data.siteKey });
			turnstileLoading = false;
			return;
		}
		if (turnstileLoading) return;
		turnstileLoading = true;
		let script = document.querySelector<HTMLScriptElement>('script[data-turnstile]');
		if (!script) {
			script = document.createElement('script');
			script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
			script.async = true;
			script.defer = true;
			script.dataset.turnstile = '';
			document.head.appendChild(script);
		}
		script.addEventListener('load', mountTurnstile, { once: true });
	}

	function resetTurnstile() {
		const api = turnstileApi();
		if (api && turnstileId !== null) api.reset(turnstileId);
	}

	function removeTurnstile() {
		const api = typeof window === 'undefined' ? undefined : turnstileApi();
		if (api && turnstileId !== null) api.remove(turnstileId);
		turnstileId = null;
		turnstileLoading = false;
	}

	$effect(() => {
		if (sheetOpen && sheetStep === 'private' && data.siteKey && turnstileElement) mountTurnstile();
		if (!sheetOpen && turnstileId !== null) removeTurnstile();
	});

	onDestroy(removeTurnstile);

	function handleIdentityInput(event: Event) {
		const next = (event.currentTarget as HTMLInputElement).value;
		const parsed = parseIdentity(next);
		if (!parsed.hasSeparator) { identity = next; return; }
		identity = parsed.name;
		company = parsed.company;
		companyVisible = true;
		void tick().then(() => companyInput?.focus());
	}

	function collapseEmptyCompany() { if (!company.trim()) companyVisible = false; }
	function draft() { return { name: identity.trim(), company: company.trim(), message: message.trim() }; }

	function openChooser() {
		composerError = '';
		if (!formElement?.checkValidity()) {
			composerError = 'Add your name and message first.';
			formElement?.reportValidity();
			return;
		}
		const rect = sendButton?.getBoundingClientRect();
		if (rect) {
			anchorRight = Math.max(24, window.innerWidth - rect.right);
			anchorTop = Math.max(24, Math.min(rect.bottom + 12, window.innerHeight - 600));
		}
		sheetStep = 'channels'; contactType = 'none'; contactValue = ''; serverError = ''; sheetOpen = true;
	}

	function continueWhatsApp() {
		const next = window.open(buildWhatsAppUrl(WHATSAPP_NUMBER, draft()), '_blank', 'noopener,noreferrer');
		if (next) next.opener = null;
		sheetOpen = false;
	}

	function continueEmail() {
		window.location.href = buildMailtoUrl(publicEmail, draft());
		sheetOpen = false;
	}

	function sendAnother() {
		removeTurnstile();
		identity = ''; company = ''; companyVisible = false; message = '';
		contactType = 'none'; contactValue = ''; composerError = ''; serverError = '';
		sheetStep = 'channels'; sheetOpen = false;
		void tick().then(() => identityInput?.focus());
	}
</script>

<svelte:head>
	<title>Collaborations & Contact — Wahyu</title>
	<meta name="description" content="Start a collaboration or send Wahyu a message." />
</svelte:head>

<section id="contact" class="page-section">
	<div class="page-inner">
		<span class="label animate-in">Colabo</span>
		<h1 class="page-title animate-in-2">Collaborations & Contact</h1>
		<p class="page-subtitle animate-in-3">Have a thought, a project, or simply a hello? Start with the essentials.</p>

		<form id={formId} class="composer" bind:this={formElement} method="POST" action="/colabo?/inquire"
			use:enhance={() => {
				submitting = true; serverError = '';
				return async ({ result }) => {
					submitting = false;
					if (result.type === 'success') {
						removeTurnstile(); sheetStep = 'success';
					} else if (result.type === 'failure') {
						serverError = String(result.data?.error ?? 'Something went wrong. Please try again.');
						resetTurnstile();
					} else if (result.type === 'error') {
						serverError = 'Network error. Your draft is still here.'; resetTurnstile();
					}
				};
			}}>
			<input class="honeypot" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
			<input type="hidden" name="name" value={identity.trim()} />
			<input type="hidden" name="company" value={company.trim()} />

			<label class="composer-field identity-field">
				<span>Name <i>/ Company</i></span>
				<input bind:this={identityInput} value={identity} oninput={handleIdentityInput}
					type="text" autocomplete="name" maxlength="120" placeholder="Your name / company" required />
			</label>

			{#if companyVisible}
				<label class="composer-field company-field">
					<span>Company <i>optional</i></span>
					<input bind:this={companyInput} bind:value={company} onblur={collapseEmptyCompany}
						type="text" autocomplete="organization" maxlength="160" placeholder="Company or studio" />
				</label>
			{/if}

			<label class="composer-field message-field">
				<span>Message</span>
				<textarea bind:value={message} name="message" maxlength="5000" required
					placeholder="What would you like to make happen?"></textarea>
			</label>

			{#if composerError}<p class="composer-error" role="alert">{composerError}</p>{/if}

			<footer class="composer-foot">
				<p>Your draft is only sent after you choose a route.</p>
				<button bind:this={sendButton} class="send" type="button" onclick={openChooser}>
					<span>Send message</span><span class="send-arrow" aria-hidden="true">↗</span>
				</button>
			</footer>

			<ContactChannelSheet bind:open={sheetOpen} bind:step={sheetStep}
				bind:contactType bind:contactValue bind:turnstileElement
				{submitting} errorMessage={serverError} siteKey={data.siteKey} {formId}
				{anchorRight} {anchorTop} triggerElement={sendButton}
				onWhatsApp={continueWhatsApp} onEmail={continueEmail} onReset={sendAnother} />
		</form>
	</div>
</section>

<style>
	.page-section { padding: var(--space-section) 0; border-top: 1px solid var(--color-border); }
	.page-inner { max-width: 860px; margin: 0 auto; padding: 0 1.5rem; }
	.page-inner > .label { display: block; margin-bottom: 0.5rem; }
	.page-title {
		max-width: 12ch; margin: 0 0 0.65rem; font-size: var(--text-3xl); font-weight: 700;
		line-height: 1.03; letter-spacing: -0.035em;
	}
	.page-subtitle {
		max-width: 46ch; margin: 0 0 var(--space-block); color: var(--color-text-muted);
		font-size: var(--text-base); line-height: 1.65;
	}
	.composer {
		position: relative; display: grid; max-width: 680px; gap: 1.8rem;
		padding-top: clamp(2rem, 5vw, 3.5rem); border-top: 1px solid var(--color-border);
	}
	.composer-field { display: grid; gap: 0.72rem; }
	.composer-field > span {
		font-size: 0.68rem; font-weight: 650; letter-spacing: 0.12em;
		text-transform: uppercase; color: var(--color-text-muted);
	}
	.composer-field > span i { font-style: normal; color: color-mix(in oklch, var(--color-text-muted) 58%, transparent); }
	.composer-field input, .composer-field textarea {
		width: 100%; padding: 0.35rem 0 0.85rem; border: 0; border-bottom: 1px solid var(--color-border);
		border-radius: 0; outline: 0; background: transparent; color: var(--color-text); font: inherit;
		transition: border-color 180ms ease, padding-left 180ms ease;
	}
	.composer-field input {
		font-size: clamp(1.25rem, 3.2vw, 1.8rem); letter-spacing: -0.025em;
	}
	.composer-field textarea {
		min-height: 150px; resize: vertical; font-size: clamp(1.05rem, 2.3vw, 1.3rem); line-height: 1.55;
	}
	.composer-field input::placeholder, .composer-field textarea::placeholder {
		color: color-mix(in oklch, var(--color-text-muted) 52%, transparent);
	}
	.composer-field input:focus, .composer-field textarea:focus {
		padding-left: 0.4rem; border-color: var(--color-text);
	}
	.company-field { animation: company-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both; }
	.composer-error { margin: -0.9rem 0 0; color: #ff9a9a; font-size: 0.78rem; }
	.honeypot {
		position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; pointer-events: none;
	}
	.composer-foot {
		display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-top: 0.45rem;
	}
	.composer-foot p {
		max-width: 28ch; margin: 0; color: var(--color-text-muted); font-size: 0.7rem; line-height: 1.5;
	}
	.send {
		display: inline-flex; min-height: 50px; align-items: center; gap: 1rem;
		padding: 0.35rem 0.4rem 0.35rem 1.2rem; border: 1px solid var(--color-text);
		border-radius: 0.45rem; background: var(--color-text); color: var(--color-surface);
		font: inherit; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.07em;
		text-transform: uppercase; cursor: pointer;
		transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1), border-radius 220ms ease, background 180ms ease, color 180ms ease;
	}
	.send:hover { transform: translateY(-2px); background: transparent; color: var(--color-text); }
	.send:active { transform: translateY(1px) scale(0.97); border-radius: 62% 38% 44% 56%; }
	.send-arrow {
		display: grid; width: 2.3rem; height: 2.3rem; place-items: center;
		border-radius: 0.28rem; background: color-mix(in oklch, var(--color-surface) 10%, transparent); font-size: 1rem;
	}
	.send:hover .send-arrow { background: color-mix(in oklch, var(--color-text) 8%, transparent); }
	@keyframes company-in {
		from { opacity: 0; transform: translateY(-12px); clip-path: inset(0 0 100%); }
		to { opacity: 1; transform: translateY(0); clip-path: inset(0); }
	}
	@media (min-width: 768px) { .page-title { font-size: var(--text-4xl); } }
	@media (max-width: 540px) {
		.page-inner { padding: 0 1.1rem; }
		.composer { gap: 1.5rem; }
		.composer-foot { align-items: stretch; flex-direction: column; }
		.send { justify-content: space-between; width: 100%; }
	}
	@media (prefers-reduced-motion: reduce) {
		.company-field { animation-duration: 1ms; }
		.send { transition: none; }
	}
</style>
