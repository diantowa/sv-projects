<script lang="ts">
    import type { SectionItem } from "$lib/types";
    import { onMount } from "svelte";
    import { smoothScrollTo } from "$lib/utils/scroll";

    interface Props {
        sections: SectionItem[];
    }
    let { sections }: Props = $props();

    let activeId = $state<string>("");
    let pendingId = $state<string>("");
    let dockEl = $state<HTMLDivElement | null>(null);
    let dockWidth = $state(0);
    let useWrap = $state(false);
    let shouldWrap = $state(false);

    // Char width estimate for 0.625rem uppercase font (~6.5px per char)
    const CHAR_WIDTH = 6.5;
    const GAP = 4; // 0.25rem
    const ITEM_PAD_X = 12; // 0.375rem * 2 sides (from .nav-item padding)

    // Active-section zone: 30% down the viewport. The nav highlights the
    // section whose vertical range contains this line — deterministic per
    // pixel, no threshold gaps.
    const ACTIVE_ZONE = 0.3;
    let firstId = $state<string>("");

    $effect(() => {
        const f = sections[0]?.id;
        if (f && !firstId) {
            firstId = f;
            if (!activeId) activeId = f;
        }
    });

    function updateActive() {
        // Measure from layout (offsetTop against body) so CSS transforms from
        // reveal transitions can't shift boundaries transiently.
        const spy = window.scrollY + window.innerHeight * ACTIVE_ZONE;
        let current = "";
        for (const section of sections) {
            const el = document.getElementById(section.id);
            if (!el) continue;
            const top = el.offsetTop;
            const bottom = top + el.offsetHeight;
            if (top <= spy && bottom > spy) {
                current = section.id;
                break;
            }
        }
        if (current !== activeId) {
            activeId = current || firstId; // above first section → first
        }
        if (pendingId && pendingId === activeId) pendingId = "";
    }

    function scrollTo(id: string) {
        pendingId = id;
        const el = document.getElementById(id);
        if (el) {
            smoothScrollTo(el);
        }
        // Fallback: if the spy never lands on it (e.g. same section), clear after a delay
        setTimeout(() => {
            if (pendingId === id) pendingId = "";
        }, 1200);
    }

    // Wrap detection (mobile label overflow) — runs on mount/resize.
    function updateWrap() {
        if (!dockEl || sections.length === 0) return;
        const isMobile = window.innerWidth < 1024;
        if (!isMobile) {
            useWrap = false;
            shouldWrap = false;
            return;
        }
        const count = sections.length;
        const totalGap = (count - 1) * GAP;
        const totalPadding = count * ITEM_PAD_X;
        const availableTextWidth = dockWidth - totalGap - totalPadding;
        const widthPerItem = availableTextWidth / count;
        const maxChars = Math.floor(widthPerItem / CHAR_WIDTH);
        const needsWrap = sections.some(
            (s) => s.label.length > maxChars && s.wrap,
        );
        useWrap = needsWrap;
        shouldWrap = count > 7;
    }

    onMount(() => {
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                dockWidth = entry.contentRect.width;
            }
        });

        if (dockEl) ro.observe(dockEl);

        const onResize = () => {
            if (dockEl) dockWidth = dockEl.getBoundingClientRect().width;
            updateActive();
            updateWrap();
        };
        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", updateActive, { passive: true });
        updateActive();

        return () => {
            ro.disconnect();
            window.removeEventListener("resize", onResize);
            window.removeEventListener("scroll", updateActive);
        };
    });
</script>

<nav class="section-nav" aria-label="Section navigation">
    <div class="nav-dock" class:wrap={shouldWrap} bind:this={dockEl}>
        {#each sections as item}
            <button
                class="nav-item"
                class:active={activeId === item.id}
                class:pending={pendingId === item.id}
                onclick={() => scrollTo(item.id)}
            >
                <span class="nav-label">
                    {useWrap && item.wrap ? item.wrap : item.label}
                </span>
                <span class="nav-indicator"></span>
            </button>
        {/each}
    </div>
</nav>

<style>
    .section-nav {
        position: fixed;
        z-index: 100;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 0 1rem 0.75rem;
        pointer-events: none;
    }

    .nav-dock {
        display: flex;
        gap: 0.25rem;
        margin: 0 auto;
        max-width: 480px;
        background: color-mix(in oklch, var(--color-surface) 72%, transparent);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid
            color-mix(in oklch, var(--color-border) 50%, transparent);
        padding: 0.375rem;
        box-shadow:
            0 1px 3px oklch(0% 0 0 / 0.06),
            0 4px 12px oklch(0% 0 0 / 0.04);
        pointer-events: auto;
        transition:
            transform 350ms var(--ease-default),
            box-shadow 350ms var(--ease-default);
    }

    .nav-dock.wrap {
        flex-wrap: wrap;
    }

    .nav-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem 0.375rem;
        font-size: 0.625rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--color-text-muted);
        background: none;
        border: none;
        cursor: pointer;
        transition: color var(--duration-fast) var(--ease-default);
        position: relative;
        min-width: 0;
    }

    .nav-dock.wrap .nav-item {
        flex: 1 1 calc(33.333% - 0.25rem);
        min-width: 72px;
    }

    .nav-item:hover {
        color: var(--color-text);
    }

    .nav-item.active {
        color: var(--color-text);
        background: var(--color-bg);
    }

    .nav-item.pending {
        color: var(--color-text);
    }

    .nav-item.pending .nav-indicator {
        background: var(--color-text);
    }

    .nav-indicator {
        margin-top: -2px;
        width: 10px;
        height: 1.5px;
        background: transparent;
        transition: background var(--duration-fast) var(--ease-default);
    }

    .nav-item.active .nav-indicator {
        background: var(--color-text);
    }

    .nav-label {
        white-space: nowrap;
        line-height: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
    }

    /* ── Desktop: vertical right-aligned dock ── */
    @media (min-width: 1024px) {
        .section-nav {
            top: 0;
            right: 0;
            left: auto;
            bottom: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            pointer-events: none;
            width: 2.75rem;
        }

        /* Hover the right-edge sliver to expand */
        .section-nav::before {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: auto;
        }

        .nav-dock {
            max-width: none;
            margin: 0;
            flex-direction: column;
            align-items: flex-end;
            gap: 0.25rem;
            padding: 0.5rem 0.5rem 0.5rem 0;
            background: color-mix(
                in oklch,
                var(--color-surface) 22%,
                transparent
            );
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid
                color-mix(in oklch, var(--color-border) 20%, transparent);
            box-shadow:
                0 1px 4px oklch(0% 0 0 / 0.01),
                0 8px 24px oklch(0% 0 0 / 0.02);
            transform: translateX(calc(100% - 5.8rem)) scale(0.75);
            transform-origin: right center;
            transition:
                transform 350ms var(--ease-default),
                box-shadow 350ms var(--ease-default);
            pointer-events: auto;
        }

        .section-nav:hover .nav-dock,
        .section-nav:focus-within .nav-dock {
            transform: translateX(0) scale(1.2);
            box-shadow:
                0 2px 8px oklch(0% 0 0 / 0.02),
                0 12px 32px oklch(0% 0 0 / 0.1);
        }

        .nav-item {
            flex: none;
            flex-direction: row-reverse;
            justify-content: flex-end;
            gap: 0.625rem;
            padding: 0.5rem 0.75rem;
            font-size: 0.6875rem;
            letter-spacing: 0.08em;
            min-width: 8rem;
            width: 100%;
        }

        .nav-dock.wrap .nav-item {
            flex: none;
            min-width: 8rem;
        }

        .nav-item.active {
            color: var(--color-text);
            background: var(--color-bg);
        }

        .nav-item.pending {
            color: var(--color-text);
        }

        .nav-indicator {
            margin-top: 0px;
            width: 2px;
            height: 14px;
        }

        .nav-label {
            white-space: nowrap;
            overflow: visible;
            text-overflow: clip;
            max-width: none;
        }
    }
</style>
