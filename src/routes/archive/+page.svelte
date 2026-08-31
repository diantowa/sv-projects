<script lang="ts">
	import FilterableMasonry from '$lib/components/FilterableMasonry.svelte';
	import type { BlogPost } from '$lib/types';

	let { data } = $props();
	const posts = $derived(data.posts as BlogPost[]);
</script>

<section id="articles" class="page-section">
	<div class="page-inner">
		<span class="label animate-in">Archive</span>
		<h1 class="page-title animate-in-2">Writing & Articles</h1>
		<p class="page-subtitle animate-in-3">Thoughts on development, design, and building for the web.</p>

		<FilterableMasonry
			items={posts}
			searchPlaceholder="Search articles…"
			noun="article"
			searchText={(post) => post.excerpt}
		>
			{#snippet card(item)}
				{@const post = item as BlogPost}
				<a href={`/blog/${post.slug}`} class="arch-link">
					<div class="arch-meta">
						<time datetime={post.date}>{post.date}</time>
					</div>
					<h2 class="arch-title">{post.title}</h2>
					<p class="arch-excerpt">{post.excerpt}</p>
					<div class="arch-tags">
						{#each post.tags as tag (tag)}
							<span class="tag">{tag}</span>
						{/each}
					</div>
				</a>
			{/snippet}
		</FilterableMasonry>
	</div>
</section>

<style>
	.page-section {
		padding: var(--space-section) 0;
	}

	.page-inner {
		max-width: 1100px;
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

	/* ── Card content (rendered inside the shared .arch-card shell) ── */
	.arch-link {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 1.25rem;
		height: 100%;
	}

	.arch-meta time {
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.arch-title {
		font-size: var(--text-lg);
		font-weight: 600;
		line-height: 1.3;
		letter-spacing: -0.01em;
	}

	.arch-excerpt {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: 1.6;
	}

	.arch-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-top: auto;
	}

	.tag {
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: 0.03em;
		padding: 0.25rem 0.625rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}
</style>