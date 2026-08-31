<script lang="ts">
	import type { ContactType } from '$lib/colabo/contact';
	import { onDestroy, tick } from 'svelte';

	type Step = 'channels' | 'private' | 'success';
	type Props = {
		open: boolean; step: Step; contactType: ContactType; contactValue: string;
		submitting?: boolean; errorMessage?: string; siteKey?: string; formId: string;
		anchorRight?: number; anchorTop?: number; triggerElement?: HTMLButtonElement | null;
		turnstileElement: HTMLDivElement | null;
		onWhatsApp: () => void; onEmail: () => void; onReset: () => void;
	};

	let {
		open = $bindable(), step = $bindable(), contactType = $bindable(), contactValue = $bindable(),
		submitting = false, errorMessage = '', siteKey = '', formId, anchorRight = 24,
		anchorTop = 160, triggerElement = null, turnstileElement = $bindable(),
		onWhatsApp, onEmail, onReset
	}: Props = $props();

	const contactOptions: { value: ContactType; label: string }[] = [
		{ value: 'email', label: 'Email' }, { value: 'whatsapp', label: 'WhatsApp' },
		{ value: 'telegram', label: 'Telegram' }, { value: 'instagram', label: 'Instagram' },
		{ value: 'messenger', label: 'Messenger' }, { value: 'x', label: 'X' },
		{ value: 'threads', label: 'Threads' }, { value: 'none', label: 'No contact' }
	];

	let dialogElement = $state<HTMLDialogElement | null>(null);
	let firstAction = $state<HTMLButtonElement | null>(null);
	let closing = $state(false);
	let closeTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (!dialogElement) return;
		if (open && !dialogElement.open) {
			closing = false;
			dialogElement.showModal();
			void tick().then(() => firstAction?.focus());
		} else if (!open && dialogElement.open) dialogElement.close();
	});

	onDestroy(() => { if (closeTimer) clearTimeout(closeTimer); });

	function finishClose() {
		closing = false; open = false; dialogElement?.close();
		void tick().then(() => triggerElement?.focus());
	}

	function requestClose() {
		if (closing) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return finishClose();
		closing = true;
		closeTimer = setTimeout(finishClose, 220);
	}

	function inputMeta(type: ContactType): {
		type: 'email' | 'tel' | 'text';
		placeholder: string;
		autocomplete: 'email' | 'tel' | 'off';
	} {
		if (type === 'email') return { type: 'email', placeholder: 'you@company.com', autocomplete: 'email' };
		if (type === 'whatsapp') return { type: 'tel', placeholder: '+62 …', autocomplete: 'tel' };
		if (type === 'telegram') return { type: 'text', placeholder: '@username', autocomplete: 'off' };
		return { type: 'text', placeholder: '@handle or profile URL', autocomplete: 'off' };
	}
</script>

<dialog bind:this={dialogElement} class:closing
	style={`--anchor-right: ${anchorRight}px; --anchor-top: ${anchorTop}px;`}
	aria-labelledby="contact-sheet-title"
	oncancel={(event) => { event.preventDefault(); requestClose(); }}
	onclick={(event) => { if (event.target === dialogElement) requestClose(); }}>
	<section class="sheet" aria-live="polite">
		<div class="sheet-grip" aria-hidden="true"></div>
		<header class="sheet-header">
			{#if step === 'private'}
				<button class="back" type="button" onclick={() => (step = 'channels')} aria-label="Back to delivery options">←</button>
			{:else}<span class="sheet-kicker">Colabo / send</span>{/if}
			<button class="close" type="button" onclick={requestClose} aria-label="Close delivery options">×</button>
		</header>

		{#if step === 'channels'}
			<div class="sheet-copy">
				<h2 id="contact-sheet-title">Choose the route</h2>
				<p>Your draft stays yours until you choose where it goes.</p>
			</div>
			<div class="channel-list">
				<button bind:this={firstAction} class="channel recommended" type="button" onclick={() => (step = 'private')}>
					<span class="channel-index">01</span><span class="channel-copy"><strong>Private note</strong><small>Send to my private inbox</small></span><span class="channel-mark">Recommended</span>
				</button>
				<button class="channel" type="button" onclick={onWhatsApp}>
					<span class="channel-index">02</span><span class="channel-copy"><strong>WhatsApp</strong><small>Continue in WhatsApp</small></span><span class="arrow">↗</span>
				</button>
				<button class="channel" type="button" onclick={onEmail}>
					<span class="channel-index">03</span><span class="channel-copy"><strong>Email</strong><small>Open your mail app</small></span><span class="arrow">↗</span>
				</button>
				<div class="channel disabled" aria-disabled="true">
					<span class="channel-index">04</span><span class="channel-copy"><strong>Live chat</strong><small>Realtime conversation</small></span><span class="channel-mark">Coming soon</span>
				</div>
			</div>
		{:else if step === 'private'}
			<div class="sheet-copy">
				<h2 id="contact-sheet-title">Send a private note</h2>
				<p>Optionally leave one place where I can reply.</p>
			</div>
			<fieldset class="contact-options">
				<legend>Reply via</legend>
				<div class="contact-grid">
					{#each contactOptions as option (option.value)}
						<label class="contact-option">
							<input form={formId} type="radio" name="contactType" value={option.value} bind:group={contactType} onchange={() => (contactValue = '')} />
							<span>{option.label}</span>
						</label>
					{/each}
				</div>
			</fieldset>
			{#if contactType !== 'none'}
				<label class="contact-field">
					<span>Your {contactOptions.find((option) => option.value === contactType)?.label}</span>
					<input form={formId} name="contactValue" type={inputMeta(contactType).type}
						placeholder={inputMeta(contactType).placeholder} autocomplete={inputMeta(contactType).autocomplete}
						maxlength="320" required bind:value={contactValue} />
				</label>
			{/if}
			{#if errorMessage}<p class="sheet-error" role="alert">{errorMessage}</p>{/if}
			{#if siteKey}<div class="turnstile" bind:this={turnstileElement}></div>{/if}
			<div class="private-foot">
				<p>Stored privately. Never published.</p>
				<button class="confirm" form={formId} type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send privately'}</button>
			</div>
		{:else}
			<div class="success-state">
				<div class="success-mark" aria-hidden="true">✓</div>
				<span class="sheet-kicker">Delivered / private</span>
				<h2 id="contact-sheet-title">Message received</h2>
				<p>I read every note personally and usually reply within two business days.</p>
				<button class="confirm" type="button" onclick={onReset}>Send another</button>
			</div>
		{/if}
	</section>
</dialog>

<style>
	dialog {
		position: fixed; inset: 0; width: 100%; height: 100%; max-width: none; max-height: none;
		margin: 0; padding: 0; border: 0; background: transparent; color: var(--color-text); overflow: hidden;
	}
	dialog::backdrop {
		background: color-mix(in oklch, var(--color-bg) 74%, transparent);
		backdrop-filter: blur(8px); animation: veil-in 280ms ease-out both;
	}
	dialog.closing::backdrop { animation: veil-out 220ms ease-in both; }
	.sheet {
		position: absolute; top: var(--anchor-top); right: var(--anchor-right);
		width: min(440px, calc(100vw - 3rem)); max-height: min(680px, calc(100dvh - 3rem));
		overflow: auto; padding: 1.15rem;
		border: 1px solid color-mix(in oklch, var(--color-border) 84%, var(--color-text));
		border-radius: 1.5rem 0.45rem 1.5rem 1.5rem;
		background: color-mix(in oklch, var(--color-surface) 96%, black);
		box-shadow: 0 32px 90px color-mix(in oklch, black 56%, transparent);
		transform-origin: 88% 0; animation: liquid-enter 480ms cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	dialog.closing .sheet { animation: liquid-exit 220ms cubic-bezier(0.7, 0, 0.84, 0) both; }
	.sheet-grip { display: none; }
	.sheet-header {
		display: flex; min-height: 2rem; align-items: center; justify-content: space-between; margin-bottom: 1rem;
	}
	.sheet-kicker, .contact-options legend, .contact-field > span {
		font-size: 0.68rem; font-weight: 650; letter-spacing: 0.12em; text-transform: uppercase;
		color: var(--color-text-muted);
	}
	.close, .back {
		display: grid; width: 2rem; height: 2rem; place-items: center; padding: 0;
		border: 1px solid var(--color-border); border-radius: 50%; background: transparent;
		color: var(--color-text-muted); font: inherit; font-size: 1.1rem; cursor: pointer;
		transition: border-color 160ms ease, color 160ms ease, transform 160ms ease;
	}
	.close { margin-left: auto; }
	.close:hover, .back:hover { border-color: var(--color-text); color: var(--color-text); transform: rotate(4deg); }
	.sheet-copy { margin-bottom: 1.35rem; }
	.sheet-copy h2, .success-state h2 {
		margin: 0; font-size: clamp(1.55rem, 4vw, 2.1rem); letter-spacing: -0.035em;
	}
	.sheet-copy p, .success-state p {
		margin: 0.45rem 0 0; color: var(--color-text-muted); font-size: 0.88rem; line-height: 1.55;
	}
	.channel-list { display: grid; gap: 0.45rem; }
	.channel {
		display: grid; grid-template-columns: 2.2rem minmax(0, 1fr) auto; align-items: center;
		gap: 0.65rem; width: 100%; min-height: 68px; padding: 0.75rem; text-align: left;
		border: 1px solid var(--color-border); border-radius: 0.8rem; background: transparent;
		color: var(--color-text); font: inherit; cursor: pointer;
		transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
	}
	.channel:hover:not(.disabled), .channel:focus-visible {
		transform: translateY(-2px); border-color: var(--color-border-hover);
		background: color-mix(in oklch, var(--color-text) 4%, transparent);
	}
	.channel.recommended { border-color: color-mix(in oklch, var(--color-accent) 48%, var(--color-border)); }
	.channel.disabled { cursor: not-allowed; opacity: 0.42; }
	.channel-index {
		font-size: 0.64rem; font-variant-numeric: tabular-nums; letter-spacing: 0.08em; color: var(--color-text-muted);
	}
	.channel-copy { display: grid; gap: 0.12rem; }
	.channel-copy strong { font-size: 0.9rem; font-weight: 650; }
	.channel-copy small { font-size: 0.72rem; color: var(--color-text-muted); }
	.channel-mark, .arrow { font-size: 0.65rem; letter-spacing: 0.06em; color: var(--color-accent); }
	.contact-options { margin: 0; padding: 0; border: 0; }
	.contact-options legend { margin-bottom: 0.65rem; }
	.contact-grid { display: flex; flex-wrap: wrap; gap: 0.45rem; }
	.contact-option input { position: absolute; width: 1px; height: 1px; opacity: 0; }
	.contact-option span {
		display: inline-flex; min-height: 36px; align-items: center; padding: 0.4rem 0.72rem;
		border: 1px solid var(--color-border); border-radius: 999px; color: var(--color-text-muted);
		font-size: 0.76rem; cursor: pointer;
		transition: border-color 160ms ease, background 160ms ease, color 160ms ease;
	}
	.contact-option input:checked + span { border-color: var(--color-text); background: var(--color-text); color: var(--color-surface); }
	.contact-option input:focus-visible + span { outline: 2px solid var(--color-accent); outline-offset: 2px; }
	.contact-field { display: grid; gap: 0.5rem; margin-top: 1rem; }
	.contact-field input {
		min-height: 48px; padding: 0.75rem 0.85rem; border: 1px solid var(--color-border);
		border-radius: 0.55rem; background: var(--color-bg); color: var(--color-text); font: inherit;
	}
	.contact-field input:focus { outline: 2px solid var(--color-accent); outline-offset: 2px; }
	.turnstile { min-height: 65px; margin-top: 1rem; }
	.sheet-error {
		margin: 1rem 0 0; padding: 0.65rem 0.75rem;
		border: 1px solid color-mix(in oklch, #ff6b6b 48%, transparent); border-radius: 0.55rem;
		color: #ff9a9a; font-size: 0.78rem;
	}
	.private-foot {
		display: flex; align-items: center; justify-content: space-between; gap: 1rem;
		margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--color-border);
	}
	.private-foot p { margin: 0; color: var(--color-text-muted); font-size: 0.68rem; }
	.confirm {
		min-height: 44px; padding: 0.65rem 1rem; border: 1px solid var(--color-text);
		border-radius: 0.5rem; background: var(--color-text); color: var(--color-surface);
		font: inherit; font-size: 0.78rem; font-weight: 650; cursor: pointer;
	}
	.confirm:disabled { cursor: wait; opacity: 0.58; }
	.success-state { display: grid; justify-items: start; padding: 1.2rem 0.2rem 0.35rem; }
	.success-mark {
		display: grid; width: 3rem; height: 3rem; place-items: center; margin-bottom: 1.5rem;
		border: 1px solid var(--color-accent); border-radius: 55% 45% 62% 38%; color: var(--color-accent);
	}
	.success-state .sheet-kicker { margin-bottom: 0.5rem; }
	.success-state .confirm { margin-top: 1.4rem; }
	@keyframes liquid-enter {
		0% { opacity: 0; transform: translateY(-16px) scale(0.22, 0.1); border-radius: 999px 0.25rem 999px 999px; clip-path: inset(0 0 74% 68% round 999px); }
		52% { opacity: 1; border-radius: 2.4rem 0.35rem 1.8rem 2.2rem; }
		100% { transform: translateY(0) scale(1); clip-path: inset(0 round 0); }
	}
	@keyframes liquid-exit {
		to { opacity: 0; transform: translateY(-10px) scale(0.5, 0.18); border-radius: 999px; clip-path: inset(0 0 64% 54% round 999px); }
	}
	@keyframes veil-in { from { opacity: 0; } to { opacity: 1; } }
	@keyframes veil-out { from { opacity: 1; } to { opacity: 0; } }
	@media (max-width: 640px) {
		.sheet {
			top: auto; right: 0; bottom: 0; left: 0; width: 100%; max-height: min(82dvh, 720px);
			padding: 0.8rem 1rem calc(1rem + env(safe-area-inset-bottom)); border-width: 1px 0 0;
			border-radius: 1.5rem 1.5rem 0 0; transform-origin: 50% 100%;
		}
		.sheet-grip {
			display: block; width: 2.8rem; height: 3px; margin: 0 auto 0.7rem;
			border-radius: 99px; background: var(--color-border-hover);
		}
		.private-foot { align-items: stretch; flex-direction: column; }
		.confirm { width: 100%; }
	}
	@media (prefers-reduced-motion: reduce) {
		dialog::backdrop, dialog.closing::backdrop, .sheet, dialog.closing .sheet { animation-duration: 1ms; }
		.channel, .close, .back { transition: none; }
	}
</style>
