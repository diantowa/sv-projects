import type { Action } from "svelte/action";

interface RevealOptions {
    /** Fraction of the element that must be visible before revealing. */
    threshold?: number;
    /** Delay (ms) before the transition starts. */
    delay?: number;
    /** Stagger children instead of the element itself. */
    stagger?: boolean;
    /** Stagger interval (ms) between children when `stagger` is true. */
    staggerInterval?: number;
    /** Reveal immediately on mount (skips the observer). */
    immediate?: boolean;
    /** Animation duration (ms) — overrides the 800ms default. */
    duration?: number;
    /**
     * Animation style. "transition" (default) uses the CSS transition
     * primitives; "rise" uses the shared `rise-in` keyframe — the same motion
     * language as the hero entrance (fade + rise, --ease-motion).
     */
    mode?: "transition" | "rise";
}

/**
 * Scroll-triggered reveal. Adds classes so CSS owns the animation; the global
 * `prefers-reduced-motion` rule force-reveals everything, so no JS
 * reduced-motion branch is needed.
 *
 * "rise" mode runs the shared `rise-in` keyframe. Non-stagger: the node itself
 * is a `.rise-el` and un-pauses when it gains `.revealed`. Stagger: children
 * are `.rise-el` and un-pause when the parent (`.reveal-stagger`) gains
 * `.revealed`.
 */
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (
    node,
    options = {},
) => {
    const {
        threshold = 0.15,
        delay = 0,
        stagger = false,
        staggerInterval = 90,
        immediate = false,
        mode = "transition",
        duration,
    } = options;

    if (mode === "rise") {
        if (stagger) {
            node.classList.add("reveal-stagger");
            const children = Array.from(node.children) as HTMLElement[];
            children.forEach((child, i) => {
                child.classList.add("rise-el");
                child.style.animationDelay = `${delay + i * staggerInterval}ms`;
                if (duration) child.style.animationDuration = `${duration}ms`;
            });
        } else {
            node.classList.add("rise-el");
            if (delay > 0) node.style.animationDelay = `${delay}ms`;
            if (duration) node.style.animationDuration = `${duration}ms`;
        }
        if (immediate) node.classList.add("revealed");
    } else {
        const cls = stagger ? "reveal-stagger" : "reveal";
        node.classList.add(cls);
        if (immediate) {
            node.classList.add("revealed");
            return;
        }
        if (stagger) {
            const children = Array.from(node.children) as HTMLElement[];
            children.forEach((child, i) => {
                child.style.transitionDelay = `${delay + i * staggerInterval}ms`;
            });
        } else if (delay > 0) {
            node.style.transitionDelay = `${delay}ms`;
        }
    }

    let revealed = false;
    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting && !revealed) {
                    revealed = true;
                    node.classList.add("revealed");
                    observer.disconnect();
                }
            }
        },
        { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);

    // Handle scroll-restored pages: if the element is already at/above the
    // viewport top on mount (e.g. returning visitor lands mid-page), the
    // observer's bottom-margin never fires — reveal it immediately so content
    // above the fold is never left invisible.
    const revealIfAbove = () => {
        if (revealed) return;
        const rect = node.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9) {
            revealed = true;
            node.classList.add("revealed");
            observer.disconnect();
        }
    };
    // Defer so layout (preloader/restored scroll) settles before measuring.
    requestAnimationFrame(revealIfAbove);
    window.addEventListener("scroll", revealIfAbove, { once: true, passive: true });

    return {
        destroy() {
            observer.disconnect();
            window.removeEventListener("scroll", revealIfAbove);
            if (mode === "rise") {
                if (stagger) {
                    Array.from(node.children).forEach((child) => {
                        const el = child as HTMLElement;
                        el.classList.remove("rise-el");
                        el.style.animationDelay = "";
                    });
                } else {
                    node.classList.remove("rise-el");
                    node.style.animationDelay = "";
                }
            } else if (stagger) {
                Array.from(node.children).forEach(
                    (child) =>
                        ((child as HTMLElement).style.transitionDelay = ""),
                );
            } else {
                node.style.transitionDelay = "";
            }
        },
    };
};