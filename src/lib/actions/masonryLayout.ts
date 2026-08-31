import type { Action } from "svelte/action";

interface MasonryOptions {
    /** Gap between columns/cards in px. */
    gap?: number;
}

/**
 * Pinterest-style shortest-column masonry layout.
 *
 * Positions the node's direct children absolutely: each card is placed into
 * the currently shortest column, so the reading order flows left-to-right
 * across the top (CSS columns fill vertically instead). Sets the container
 * height to the tallest column. Re-layouts via ResizeObserver on container
 * resize, and after each browser frame so newly mounted cards get placed.
 *
 * Children must be `position: absolute` (see `.archive-masonry` global CSS);
 * width, left, top, and the container height are set inline.
 */
export const masonryLayout: Action<HTMLElement, MasonryOptions | undefined> = (
    node,
    options = {},
) => {
    const { gap = 20 } = options;
    let columns = 1;
    let cardWidth = 0;

    const measure = () => {
        const w = node.clientWidth;
        columns = w >= 1024 ? 3 : w >= 640 ? 2 : 1;
        cardWidth = (w - (columns - 1) * gap) / columns;
    };

    const layout = () => {
        if (cardWidth <= 0) return;
        const cards = Array.from(node.children) as HTMLElement[];
        if (cards.length === 0) return;
        const heights = new Array<number>(columns).fill(0);
        cards.forEach((card) => {
            const col = heights.indexOf(Math.min(...heights));
            card.style.width = `${cardWidth}px`;
            card.style.left = `${col * (cardWidth + gap)}px`;
            card.style.top = `${heights[col]}px`;
            heights[col] += card.offsetHeight + gap;
        });
        node.style.height = `${Math.max(...heights) - gap}px`;
    };

    measure();
    layout();

    const ro = new ResizeObserver(() => {
        measure();
        layout();
    });
    ro.observe(node);

    // Re-place on every frame so cards that mount later (infinite scroll,
    // filter changes) settle into the shortest column.
    let raf = 0;
    const rafLoop = () => {
        layout();
        raf = requestAnimationFrame(rafLoop);
    };
    raf = requestAnimationFrame(rafLoop);

    return {
        update() {
            measure();
            layout();
        },
        destroy() {
            ro.disconnect();
            cancelAnimationFrame(raf);
        },
    };
};