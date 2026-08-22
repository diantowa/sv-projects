<script lang="ts">
	let { data } = $props();
	const post = $derived(data.post);
</script>

<svelte:head>
	<title>{post.title} — Wahyudi Chrisdianto</title>
	{#if post.excerpt}
		<meta name="description" content={post.excerpt} />
	{/if}
</svelte:head>

<article class="post-section">
	<div class="page-inner">
		<a href="/archive" class="back animate-in">← Archive</a>

		<div class="post-meta animate-in-2">
			{#if post.date}<time datetime={post.date}>{post.date}</time>{/if}
			{#each post.tags as tag (tag)}
				<span class="tag">{tag}</span>
			{/each}
		</div>

		<h1 class="post-title animate-in-3">{post.title}</h1>

		{#if post.excerpt}
			<p class="post-excerpt">{post.excerpt}</p>
		{/if}

		<!-- Body is Markdown rendered to HTML server-side (authored via ../sv_manager). -->
		<div class="post-body">
			{@html post.bodyHtml}
		</div>
	</div>
</article>

<style>
	.post-section {
		padding: var(--space-section) 0;
	}

	.page-inner {
		max-width: 720px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	.back {
		display: inline-block;
		margin-bottom: var(--space-block);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		transition: color var(--duration-fast) var(--ease-default);
	}

	.back:hover {
		color: var(--color-text);
	}

	.post-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.post-meta time {
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.tag {
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: 0.03em;
		padding: 0.25rem 0.625rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.post-title {
		font-size: var(--text-3xl);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.1;
		margin-bottom: 1rem;
	}

	@media (min-width: 768px) {
		.post-title {
			font-size: var(--text-4xl);
		}
	}

	.post-excerpt {
		font-size: var(--text-lg);
		color: var(--color-text-muted);
		line-height: 1.5;
		margin-bottom: var(--space-block);
	}

	.post-body {
		border-top: 1px solid var(--color-border);
		padding-top: var(--space-block);
		font-size: var(--text-base);
		line-height: 1.75;
		color: var(--color-text);
	}

	/* ── Rendered Markdown (rich content from the WYSIWYG editor) ── */
	.post-body :global(p),
	.post-body :global(ul),
	.post-body :global(ol),
	.post-body :global(blockquote),
	.post-body :global(pre),
	.post-body :global(figure),
	.post-body :global(table) {
		margin: 0 0 1.1rem;
	}

	.post-body :global(h2) {
		font-size: var(--text-2xl);
		font-weight: 700;
		letter-spacing: -0.01em;
		margin: 2rem 0 0.75rem;
	}
	.post-body :global(h3) {
		font-size: var(--text-xl);
		font-weight: 600;
		margin: 1.6rem 0 0.5rem;
	}

	.post-body :global(a) {
		color: var(--color-text);
		text-decoration: underline;
		text-underline-offset: 2px;
		text-decoration-color: var(--color-border-hover);
	}
	.post-body :global(a:hover) {
		text-decoration-color: var(--color-text);
	}

	.post-body :global(ul),
	.post-body :global(ol) {
		padding-left: 1.4rem;
	}
	.post-body :global(li) {
		margin-bottom: 0.4rem;
	}

	.post-body :global(strong) {
		font-weight: 600;
	}

	.post-body :global(blockquote) {
		padding-left: 1.1rem;
		border-left: 2px solid var(--color-border);
		color: var(--color-text-muted);
		font-style: italic;
	}

	.post-body :global(code) {
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.875em;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 0.1em 0.35em;
	}
	.post-body :global(pre) {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 1rem 1.25rem;
		overflow-x: auto;
	}
	.post-body :global(pre code) {
		background: none;
		border: none;
		padding: 0;
	}

	/* Responsive images (and figures) — the key requirement. */
	.post-body :global(img) {
		display: block;
		max-width: 100%;
		height: auto;
		margin: 1.5rem 0;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
	}
	.post-body :global(figure) {
		margin: 1.5rem 0;
	}
	.post-body :global(figure img) {
		margin: 0 0 0.5rem;
	}
	.post-body :global(figcaption) {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-align: center;
	}

	.post-body :global(hr) {
		border: none;
		border-top: 1px solid var(--color-border);
		margin: 2rem 0;
	}
</style>
