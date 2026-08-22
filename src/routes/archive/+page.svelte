<script lang="ts">
	import SectionNav from '$lib/components/SectionNav.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { smoothScrollTo } from '$lib/utils/scroll';
	import { sections } from '$lib/configs/navs';
	import type { BlogPost } from '$lib/types';

	const PAGE_SIZE = 9;

	let { data } = $props();

	// ── Live filter: operates on the FULL dataset client-side ──
	const allPosts: BlogPost[] = $derived(data.posts);
	const allTags = $derived.by(() => {
		const set = new Set<string>();
		for (const post of allPosts) for (const tag of post.tags) set.add(tag);
		return [...set].sort();
	});

	// Search query — filters on title, excerpt, and tags.
	let query = $state('');
	// Selected tag filter. null = All.
	let activeTag: string | null = $state(null);
	// Tag dropdown open state.
	let menuOpen = $state(false);
	let menuEl = $state<HTMLDivElement | null>(null);

	const q = $derived(query.trim().toLowerCase());
	const tag = $derived(activeTag);
	const filtered = $derived(
		allPosts.filter((p) => {
			if (tag && !p.tags.includes(tag)) return false;
			if (!q) return true;
			return (
				p.title.toLowerCase().includes(q) ||
				p.excerpt.toLowerCase().includes(q) ||
				p.tags.some((t) => t.toLowerCase().includes(q))
			);
		})
	);

	// Close the dropdown on outside click.
	$effect(() => {
		const node = menuEl;
		if (!node) return;
		const onDown = (e: MouseEvent) => {
			if (!node.contains(e.target as Node)) menuOpen = false;
		};
		document.addEventListener('mousedown', onDown);
		return () => document.removeEventListener('mousedown', onDown);
	});

	// ── Infinite scroll: reveal a window of the filtered feed ──
	let visibleCount = $state(PAGE_SIZE);
	let sentinel = $state<HTMLDivElement | null>(null);
	let loading = $state(false);
	let observer: IntersectionObserver | null = null;
	let pendingBatch: HTMLElement[] = [];

	$effect(() => {
		const node = sentinel;
		const tag = activeTag; // re-arm observer + immediate check on filter change
		if (!node) return;
		observer?.disconnect();
		const obs = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && visibleCount < filtered.length) {
					visibleCount = Math.min(visibleCount + PAGE_SIZE, filtered.length);
				}
			},
			{ rootMargin: '600px 0px' }
		);
		obs.observe(node);
		observer = obs;
		// If the sentinel is already inside the root margin (e.g. filter changed
		// while scrolled to the bottom), load the next batch immediately.
		queueMicrotask(() => {
			const rect = node.getBoundingClientRect();
			if (rect.top < window.innerHeight + 600 && visibleCount < filtered.length) {
				visibleCount = Math.min(visibleCount + PAGE_SIZE, filtered.length);
			}
		});
		void tag;
		return () => obs.disconnect();
	});

	const hasMore = $derived(visibleCount < filtered.length);
	const visiblePosts = $derived(filtered.slice(0, visibleCount));

	// Reset the reveal window whenever the filter or query changes so a new
	// filter starts from its first page.
	$effect(() => {
		const tag = activeTag;
		const q = query;
		visibleCount = PAGE_SIZE;
		void tag;
		void q;
	});

	// When the filter/search changes while scrolled down past the toolbar,
	// smooth-scroll back up to the first article so results are visible
	// (the masonry keeps its height, so without this the user could be
	// staring at empty space / the middle of a short result set).
	let lastTag: string | null = null;
	let lastQuery = '';
	$effect(() => {
		const tag = activeTag;
		const q = query;
		if (tag !== lastTag || q !== lastQuery) {
			const toolbar = document.querySelector('.toolbar');
			if (toolbar) {
				const rect = toolbar.getBoundingClientRect();
				// Only scroll back if the toolbar is scrolled out of view
				// (rect.bottom < 0 means it's above the viewport).
				if (rect.bottom < 0) {
					smoothScrollTo('.toolbar', { duration: 0.6 });
				}
			}
		}
		lastTag = tag;
		lastQuery = q;
	});

	// After the DOM flushes, run newly appended cards' entrance animation.
	// Two-pass so IntersectionObserver triggers don't fire before the node is
	// in the layout (the observer that loads the next batch is separate from
	// the one that reveals cards).
	$effect(() => {
		const count = visiblePosts.length;
		if (count === 0) return;
		queueMicrotask(() => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					const cards = document.querySelectorAll('.arch-card:not(.running)');
					cards.forEach((card, i) => {
						card.classList.add('running');
						(card as HTMLElement).style.animationDelay = `${Math.min(i, 6) * 55}ms`;
					});
				});
			});
		});
	});

	// ── Masonry layout: Pinterest-style shortest-column placement ──
	// Cards flow horizontally — each new card goes into the shortest column,
	// so the reading order goes left-to-right across the top instead of
	// top-to-bottom (CSS columns fill vertically).
	let masonryEl = $state<HTMLElement | null>(null);
	let columns = $state(3);
	let cardWidth = $state(0);

	$effect(() => {
		const node = masonryEl;
		if (!node) return;
		const measure = () => {
			const w = node.clientWidth;
			const colCount = w >= 1024 ? 3 : w >= 640 ? 2 : 1;
			columns = colCount;
			cardWidth = (w - (colCount - 1) * 20) / colCount;
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(node);
		return () => ro.disconnect();
	});

	// Layout the visible cards once they exist and metrics are known.
	$effect(() => {
		const node = masonryEl;
		const posts = visiblePosts;
		if (!node || posts.length === 0 || cardWidth <= 0) return;
		const gap = 20;
		const heights = new Array<number>(columns).fill(0);
		const cards = Array.from(node.querySelectorAll(':scope > .arch-card')) as HTMLElement[];
		requestAnimationFrame(() => {
			cards.forEach((card, i) => {
				const col = heights.indexOf(Math.min(...heights));
				card.style.width = `${cardWidth}px`;
				card.style.left = `${col * (cardWidth + gap)}px`;
				card.style.top = `${heights[col]}px`;
				heights[col] += card.offsetHeight + gap;
			});
			node.style.height = `${Math.max(...heights) - gap}px`;
		});
	});
</script>

<SectionNav sections={sections.archive} />

<section id="articles" class="page-section">
	<div class="page-inner">
		<span class="label animate-in">Archive</span>
		<h1 class="page-title animate-in-2">Writing & Articles</h1>
		<p class="page-subtitle animate-in-3">Thoughts on development, design, and building for the web.</p>

		<!-- Toolbar: search input (left) + tag dropdown filter (right) -->
		<div class="toolbar" use:reveal={{ mode: 'transition', immediate: true }}>
			<div class="search-wrap">
				<svg class="search-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<circle cx="11" cy="11" r="8" />
					<line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
				<input
					type="search"
					class="search-input"
					placeholder="Search articles…"
					aria-label="Search articles"
					bind:value={query}
				/>
			</div>

			<div class="filter-dropdown" bind:this={menuEl}>
				<button
					class="filter-btn"
					class:active={activeTag !== null}
					aria-haspopup="listbox"
					aria-expanded={menuOpen}
					onclick={() => (menuOpen = !menuOpen)}
				>
					<span>{activeTag ?? 'Filters'}</span>
					<svg class="chevron" class:open={menuOpen} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<polyline points="6 9 12 15 18 9" />
					</svg>
				</button>

				{#if menuOpen}
					<div class="filter-menu" role="listbox" aria-label="Filter by tag" data-lenis-prevent>
						<button
							class="menu-item"
							class:selected={activeTag === null}
							role="option"
							aria-selected={activeTag === null}
							onclick={() => {
								activeTag = null;
								menuOpen = false;
							}}
						>
							<span class="menu-check" aria-hidden="true">{activeTag === null ? '✓' : ''}</span>
							All Tags
						</button>
						{#each allTags as tag (tag)}							<button
								class="menu-item"
								class:selected={activeTag === tag}
								role="option"
								aria-selected={activeTag === tag}
								onclick={() => {
									activeTag = activeTag === tag ? null : tag;
									menuOpen = false;
								}}
							>
								<span class="menu-check" aria-hidden="true">{activeTag === tag ? '✓' : ''}</span>
								{tag}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<a href="/rss.xml" class="rss-btn" target="_blank" rel="noopener" aria-label="RSS feed">
				<svg class="rss-icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
					<path d="M6.18 17.82a2.18 2.18 0 1 0 0 4.36 2.18 2.18 0 0 0 0-4.36zM4 4.44v3.13c7.03 0 12.44 5.41 12.44 12.43h3.13C19.56 11.14 12.86 4.44 4 4.44zm0 6.26v3.13a8.05 8.05 0 0 1 8.03 8.03h3.13A11.16 11.16 0 0 0 4 10.7z" />
				</svg>
				<span>RSS</span>
			</a>
		</div>

		<p class="archive-count" aria-live="polite">
			{filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
		</p>

		<div class="archive-masonry" bind:this={masonryEl}>
			{#each visiblePosts as post (post.id)}
				<article class="arch-card rise-in">
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
				</article>
			{/each}
		</div>

		<div class="archive-status" bind:this={sentinel}>
			{#if hasMore}
				<span class="archive-spinner" aria-hidden="true"></span>
			{:else if filtered.length > 0}
				<span>End of the archive — that's all {filtered.length} articles.</span>
			{:else}
				<span>No articles match this filter.</span>
			{/if}
		</div>
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

	/* ── Toolbar: search + tag dropdown ── */
	.toolbar {
		position: sticky;
		top: 56px; /* sits right below the 56px sticky header */
		z-index: 50;
		display: flex;
		align-items: stretch;
		gap: 0.75rem;
		margin: 0 calc(-1 * var(--space-element)) var(--space-block);
		padding: 0.75rem var(--space-element);
		background: var(--color-bg);
	}

	/* Wrap so sticky toolbar aligns with the .page-inner content box */
	@media (min-width: 768px) {
		.toolbar {
			margin-left: calc(-1 * var(--space-element));
			margin-right: calc(-1 * var(--space-element));
		}
	}

	.search-wrap {
		position: relative;
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}

		.search-icon {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color-text-muted);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		height: 100%;
		padding: 0.5rem 0.875rem 0.5rem 2rem;
		font-size: var(--text-sm);
		font-family: inherit;
		color: var(--color-text);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		box-sizing: border-box;
		transition:
			border-color var(--duration-fast) var(--ease-default),
			box-shadow var(--duration-fast) var(--ease-default);
	}

	.search-input::placeholder {
		color: var(--color-text-muted);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-accent-border);
		box-shadow: 0 0 0 3px var(--color-accent-muted);
	}

	/* Dropdown trigger button */
	.filter-dropdown {
		position: relative;
		display: flex;
		align-items: stretch;
		z-index: 1; /* keep the open menu above sibling controls (rss-btn) */
	}

	.filter-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0 0.875rem;
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-text);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		white-space: nowrap;
		box-sizing: border-box;
		transition:
			border-color var(--duration-fast) var(--ease-default),
			background var(--duration-fast) var(--ease-default),
			color var(--duration-fast) var(--ease-default);
	}

	/* Compact RSS subscribe button, same height as the filter button */
	.rss-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0 0.875rem;
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-accent);
		background: var(--color-accent-muted);
		border: 1px solid var(--color-accent-border);
		border-radius: var(--radius-sm);
		white-space: nowrap;
		box-sizing: border-box;
		transition:
			background var(--duration-fast) var(--ease-default),
			border-color var(--duration-fast) var(--ease-default),
			color var(--duration-fast) var(--ease-default);
	}
	.rss-btn:hover {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: oklch(99% 0.002 260);
	}
	.rss-btn:active {
		transform: translateY(1px);
	}
	.rss-icon {
		flex-shrink: 0;
	}

	/* Mobile: icon-only RSS button (label hidden, aria-label remains) */
	@media (max-width: 640px) {
		.rss-btn span {
			display: none;
		}
		.rss-btn {
			padding: 0 0.75rem;
		}
	}

	.filter-btn:hover {
		border-color: var(--color-border-hover);
	}

	.filter-btn.active {
		background: var(--color-accent-muted);
		border-color: var(--color-accent-border);
		color: var(--color-accent);
	}

	.chevron {
		transition: transform var(--duration-fast) var(--ease-default);
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	/* Dropdown menu */
	.filter-menu {
		position: absolute;
		top: calc(100% + 0.375rem);
		right: 0;
		z-index: 60; /* above the toolbar (z-50) so items overlap the RSS button */
		min-width: 180px;
		max-height: 320px;
		overflow-y: auto;
		padding: 0.25rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		box-shadow: 0 12px 32px var(--shadow-lg);
		animation: menu-in 160ms var(--ease-motion) both;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.625rem;
		font-size: var(--text-sm);
		color: var(--color-text);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		text-align: left;
		transition:
			background var(--duration-fast) var(--ease-default),
			color var(--duration-fast) var(--ease-default);
	}

	.menu-item:hover {
		background: var(--color-accent-muted);
	}

	.menu-item.selected {
		color: var(--color-accent);
		font-weight: 600;
	}

	.menu-check {
		width: 1rem;
		flex-shrink: 0;
		text-align: center;
	}

	.archive-count {
		position: sticky;
		/* sits right below the stuck toolbar (56 header + 50 toolbar ≈ 106) */
		top: 106px;
		z-index: 49;
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin: 0 0 0.75rem;
		padding: 0.375rem 0.5rem 0;
		background: var(--color-bg);
		width: fit-content;
	}

	/* Masonry card — surface panel, hairline border, lift on hover */
	.arch-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		transition:
			border-color var(--duration-fast) var(--ease-default),
			transform var(--duration-fast) var(--ease-default),
			box-shadow var(--duration-fast) var(--ease-default);
	}
	.arch-card:hover {
		border-color: var(--color-border-hover);
		transform: translateY(-2px);
		box-shadow: 0 8px 24px var(--shadow-md);
	}

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
