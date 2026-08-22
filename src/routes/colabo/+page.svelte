<script lang="ts">
	import SectionNav from '$lib/components/SectionNav.svelte';
	import InquiryModal from '$lib/components/InquiryModal.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { sections } from '$lib/configs/navs';

	let { data } = $props();
	let inquiryOpen = $state(false);
</script>

<SectionNav sections={sections.colabo} />

<section id="collaborations" class="page-section">
	<div class="page-inner">
		<span class="label animate-in">Colabo</span>
		<h1 class="page-title animate-in-2">Collaborations & Contact</h1>
		<p class="page-subtitle animate-in-3">Partnerships, open source contributions, and community involvement.</p>

		<div class="colabo-list" use:reveal={{ mode: "rise", stagger: true, staggerInterval: 70 }}>
			{#each data.collaborations as colabo (colabo.id)}
				<article class="colabo-item" id={colabo.id}>
					<div class="colabo-header">
						<div>
							<span class="colabo-role">{colabo.role}</span>
							<h2 class="colabo-name">{colabo.name}</h2>
							<p class="colabo-desc">{colabo.description}</p>
						</div>
						<span class="colabo-year">{colabo.year}</span>
					</div>
					{#if colabo.link}
						<a href={colabo.link} class="colabo-link">View details →</a>
					{/if}
				</article>
			{/each}
		</div>
	</div>
</section>

<section id="contact" class="page-section work">
	<div class="page-inner cta-inner">
		<span class="label">Get in touch</span>
		<h2 class="page-title">Let's work together</h2>
		<p class="page-subtitle">
			Have a project or a partnership in mind? Send a quick brief — it takes under a minute.
		</p>
		<button class="cta" type="button" onclick={() => (inquiryOpen = true)}>
			Start a project →
		</button>
	</div>
</section>

<InquiryModal bind:open={inquiryOpen} siteKey={data.siteKey} />

<style>
	.page-section {
		padding: var(--space-section) 0;
	}

	.page-section:first-of-type {
		border-top: 1px solid var(--color-border);
	}

	.page-inner {
		max-width: 860px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	.page-section .label {
		display: block;
		margin-bottom: 0.5rem;
	}

	.page-title {
		font-size: var(--text-3xl);
		font-weight: 700;
		letter-spacing: -0.02em;
		margin-bottom: 0.5rem;
	}

	@media (min-width: 768px) {
		.page-title {
			font-size: var(--text-4xl);
		}
	}

	.page-subtitle {
		font-size: var(--text-base);
		color: var(--color-text-muted);
		max-width: 48ch;
		margin-bottom: var(--space-block);
	}

	.colabo-list {
		display: flex;
		flex-direction: column;
	}

	.colabo-item {
		padding: var(--space-element) 0;
		border-top: 1px solid var(--color-border);
	}

	.colabo-item:last-child {
		border-bottom: 1px solid var(--color-border);
	}

	.colabo-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 2rem;
	}

	.colabo-role {
		display: inline-block;
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin-bottom: 0.5rem;
	}

	.colabo-name {
		font-size: var(--text-xl);
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.colabo-desc {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: 1.6;
		max-width: 56ch;
	}

	.colabo-year {
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.colabo-link {
		display: inline-block;
		margin-top: 0.75rem;
		font-size: var(--text-sm);
		font-weight: 600;
		letter-spacing: 0.03em;
		color: var(--color-text);
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 1px;
		transition: border-color var(--duration-fast) var(--ease-default);
	}

	.colabo-link:hover {
		border-color: var(--color-text);
	}

	.cta-inner {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.cta {
		margin-top: 0.5rem;
		padding: 0.875rem 2rem;
		font-size: var(--text-sm);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-surface);
		background: var(--color-text);
		border: 1px solid var(--color-text);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-default);
	}

	.cta:hover {
		background: transparent;
		color: var(--color-text);
	}
</style>
