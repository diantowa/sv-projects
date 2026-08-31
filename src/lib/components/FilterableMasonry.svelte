<script lang="ts" generics="T extends FilterableItem">
    import { reveal } from "$lib/actions/reveal";
    import { masonryLayout } from "$lib/actions/masonryLayout";
    import { smoothScrollTo } from "$lib/utils/scroll";
    import { onMount, untrack } from "svelte";
    import type { Snippet } from "svelte";
    import type { FilterableItem } from "$lib/types";

    interface Props {
        items: T[];
        /** Search placeholder, e.g. "Search articles…". */
        searchPlaceholder: string;
        /** Count noun, e.g. "article" / "project". */
        noun: string;
        /** Extra searchable text per item (e.g. BlogPost excerpt). */
        searchText?: (item: T) => string;
        /** Renders one card for an item (already keyed by the parent each). */
        card: Snippet<[T]>;
        /** Page size for infinite scroll. */
        pageSize?: number;
        /** Cap the grid height + fade the bottom until "See more" (desktop px). */
        collapseMaxHeight?: number;
        /** Label for the "See more" reveal button. */
        seeMoreLabel?: string;
    }

    let {
        items,
        searchPlaceholder,
        noun,
        searchText,
        card,
        pageSize = 9,
        collapseMaxHeight,
        seeMoreLabel = "See more",
    }: Props = $props();

    // pageSize is fixed per-instance (routes use the default). Read it once
    // so effects reference a stable value. untrack() marks the intentional
    // read-once so the compiler doesn't warn (state_referenced_locally).
    const PAGE_SIZE = untrack(() => pageSize);

    // ── Live filter: operates on the FULL dataset client-side ──
    const allTags = $derived.by(() => {
        const set = new Set<string>();
        for (const item of items) for (const tag of item.tags) set.add(tag);
        return [...set].sort();
    });

    let query = $state("");
    let activeTag: string | null = $state(null);
    let menuOpen = $state(false);
    let menuEl = $state<HTMLDivElement | null>(null);

    const q = $derived(query.trim().toLowerCase());
    const tag = $derived(activeTag);
    const filtered = $derived(
        items.filter((item) => {
            if (tag && !item.tags.includes(tag)) return false;
            if (!q) return true;
            const desc = item.description ?? searchText?.(item) ?? "";
            return (
                item.title.toLowerCase().includes(q) ||
                desc.toLowerCase().includes(q) ||
                item.tags.some((t) => t.toLowerCase().includes(q))
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
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    });

    // ── Infinite scroll: reveal a window of the filtered feed ──
    let visibleCount = $state(PAGE_SIZE);
    let sentinel = $state<HTMLDivElement | null>(null);
    let observer: IntersectionObserver | null = null;

    $effect(() => {
        const node = sentinel;
        const tag = activeTag; // re-arm observer + immediate check on filter change
        // While collapsed, the "See more" button is the only reveal trigger —
        // don't auto-load or the hidden feed would silently grow behind the fade.
        if (!node || (collapseMaxHeight && !expanded)) return;
        observer?.disconnect();
        const obs = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && visibleCount < filtered.length) {
                    visibleCount = Math.min(visibleCount + PAGE_SIZE, filtered.length);
                }
            },
            { rootMargin: "600px 0px" }
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
    const visibleItems = $derived(filtered.slice(0, visibleCount));

    // ── Collapsible grid ("See more"): cap the height + fade the bottom. ──
    let expanded = $state(false);
    let feedEl = $state<HTMLDivElement | null>(null);
    let feedHeight = $state(0);
    let vw = $state(typeof window !== "undefined" ? window.innerWidth : 1024);

    // Mobile gets a taller cap (1.5–2x) so a single-column stack isn't cramped;
    // keep this in sync with the CSS multiplier below.
    const cap = $derived(
        collapseMaxHeight ? collapseMaxHeight * (vw < 640 ? 1.75 : 1) : 0
    );
    // Only show the fade + button when content actually overflows the cap.
    const overflows = $derived(cap > 0 && feedHeight > cap + 1);

    // "See more" reveals the whole filtered set and un-caps the grid.
    function expandAll() {
        expanded = true;
        visibleCount = filtered.length;
    }

    // Track the masonry's rendered height so we know when it overflows.
    $effect(() => {
        if (!collapseMaxHeight) return; // archive (non-collapsible) has no cap
        const node = feedEl;
        if (!node) return;
        const measure = () => (feedHeight = node.offsetHeight);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(node);
        return () => ro.disconnect();
    });

    onMount(() => {
        const onResize = () => (vw = window.innerWidth);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    });

    // Reset the reveal window whenever the filter or query changes.
    $effect(() => {
        const tag = activeTag;
        const q = query;
        visibleCount = PAGE_SIZE;
        expanded = false; // re-collapse on a fresh filter/search so the cap re-applies
        void tag;
        void q;
    });

    // When the filter/search changes while scrolled down past the toolbar,
    // smooth-scroll back up so results are visible.
    let lastTag: string | null = null;
    let lastQuery = "";
    $effect(() => {
        const tag = activeTag;
        const q = query;
        if (tag !== lastTag || q !== lastQuery) {
            const toolbar = document.querySelector(".toolbar");
            if (toolbar) {
                const rect = toolbar.getBoundingClientRect();
                if (rect.bottom < 0) {
                    smoothScrollTo(".toolbar", { duration: 0.6 });
                }
            }
        }
        lastTag = tag;
        lastQuery = q;
    });

    // Cards' entrance animation plays when each card actually enters the
    // viewport (rootMargin gives a small look-ahead) — below-fold cards never
    // rise unseen, and infinite-scroll/filter batches animate as they arrive.
    let cardObserver: IntersectionObserver | null = null;
    $effect(() => {
        cardObserver?.disconnect();
        cardObserver = null;
        const count = visibleItems.length;
        if (count === 0) return;
        queueMicrotask(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const cards = document.querySelectorAll(".arch-card:not(.running)");
                    if (cards.length === 0) return;
                    const obs = new IntersectionObserver(
                        (entries) => {
                            for (const entry of entries) {
                                if (!entry.isIntersecting) continue;
                                const el = entry.target as HTMLElement;
                                obs.unobserve(el);
                                el.classList.add("running");
                                const parent = el.parentElement;
                                const i = parent ? [...parent.children].indexOf(el) : 0;
                                el.style.animationDelay = `${Math.min(i, 6) * 55}ms`;
                            }
                        },
                        { threshold: 0.01, rootMargin: "120px 0px" },
                    );
                    cards.forEach((cardEl) => obs.observe(cardEl));
                    cardObserver = obs;
                });
            });
        });
    });
</script>

<!-- Toolbar: search input (left) + tag dropdown filter (right) -->
<div class="toolbar" use:reveal={{ mode: "transition", immediate: true }}>
    <div class="search-wrap">
        <svg
            class="search-icon"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
            type="search"
            class="search-input"
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
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
            <span>{activeTag ?? "Filters"}</span>
            <svg
                class="chevron"
                class:open={menuOpen}
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
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
                    <span class="menu-check" aria-hidden="true">{activeTag === null ? "✓" : ""}</span>
                    All Tags
                </button>
                {#each allTags as tag (tag)}
                    <button
                        class="menu-item"
                        class:selected={activeTag === tag}
                        role="option"
                        aria-selected={activeTag === tag}
                        onclick={() => {
                            activeTag = activeTag === tag ? null : tag;
                            menuOpen = false;
                        }}
                    >
                        <span class="menu-check" aria-hidden="true">{activeTag === tag ? "✓" : ""}</span>
                        {tag}
                    </button>
                {/each}
            </div>
        {/if}
    </div>
</div>

<p class="page-count" aria-live="polite">
    {filtered.length} {filtered.length === 1 ? noun : `${noun}s`}
</p>

<!-- Masonry feed (Pinterest-style shortest-column, see masonryLayout action) -->
<div
    class="masonry-clip"
    class:collapsible={!!collapseMaxHeight}
    class:expanded={expanded}
    style={collapseMaxHeight ? `--collapse-h: ${collapseMaxHeight}px` : undefined}
>
    <div class="archive-masonry" use:masonryLayout bind:this={feedEl}>
        {#each visibleItems as item (item.id)}
            <article class="arch-card rise-in">
                {@render card(item)}
            </article>
        {/each}
    </div>
    {#if collapseMaxHeight && !expanded && overflows}
        <div class="masonry-fade" aria-hidden="true"></div>
    {/if}
</div>

{#if collapseMaxHeight && !expanded}
    {#if filtered.length === 0}
        <div class="archive-status"><span>No {noun}s match this filter.</span></div>
    {/if}
{:else}
    <div class="archive-status" bind:this={sentinel}>
        {#if hasMore}
            <span class="archive-spinner" aria-hidden="true"></span>
        {:else if filtered.length > 0}
            <span
                >End of the {noun === "article" ? "archive" : "list"} — that's all {filtered.length}
                {filtered.length === 1 ? noun : `${noun}s`}.</span
            >
        {:else}
            <span>No {noun}s match this filter.</span>
        {/if}
    </div>
{/if}

{#if collapseMaxHeight && !expanded && overflows}
    <div class="see-more-wrap">
        <button class="see-more" onclick={expandAll}>
            {seeMoreLabel}
            <span class="see-more-caret" aria-hidden="true">↓</span>
        </button>
    </div>
{/if}

<style>
    /* ── Toolbar: search + tag dropdown ── */
    .toolbar {
        position: sticky;
        top: 57px; /* sits flush below the 57px sticky header */
        z-index: 50;
        display: flex;
        align-items: stretch;
        gap: 0.75rem;
        margin: 0 calc(-1 * var(--space-element)) var(--space-block);
        padding: 0.75rem var(--space-element);
        background: var(--color-bg);
        border-bottom: 1px solid var(--color-border);
    }

    .search-wrap {
        position: relative;
        flex: 1;
        min-width: 0;
        display: flex;
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
        z-index: 1; /* keep the open menu above sibling controls */
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
        z-index: 60; /* above the toolbar (z-50) so items overlap other controls */
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

    /* Static (not sticky): a floating sticky chip over the feed read as
       cropped card text while scrolling. It scrolls away with the page. */
    .page-count {
        font-size: var(--text-xs);
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--color-text-muted);
        margin: 0 0 0.75rem;
    }

    /* ── Collapsible masonry: height cap + bottom fade until "See more" ── */
    .masonry-clip {
        position: relative;
    }
    .masonry-clip.collapsible {
        overflow: hidden;
        max-height: var(--collapse-h);
    }
    .masonry-clip.collapsible.expanded {
        max-height: none;
        overflow: visible;
    }
    /* Mobile: a single-column stack gets a taller cap (1.75x desktop). */
    @media (max-width: 640px) {
        .masonry-clip.collapsible:not(.expanded) {
            max-height: calc(var(--collapse-h) * 1.75);
        }
    }
    .masonry-fade {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 120px;
        z-index: 2;
        pointer-events: none;
        background: linear-gradient(to top, var(--color-bg), transparent);
    }
    .see-more-wrap {
        display: flex;
        justify-content: center;
        margin-top: var(--space-element);
    }
    .see-more {
        padding: 0.75rem 1.5rem;
        font-size: var(--text-sm);
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--color-text);
        background: none;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition:
            border-color var(--duration-fast) var(--ease-default),
            background var(--duration-fast) var(--ease-default),
            color var(--duration-fast) var(--ease-default);
    }
    .see-more:hover {
        border-color: var(--color-text);
        background: var(--color-text);
        color: var(--color-surface);
    }
    .see-more-caret {
        display: inline-block;
        font-size: 0.75em;
    }
</style>