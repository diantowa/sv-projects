import type Lenis from 'lenis';

// Module-scope singleton: the root layout owns the Lenis instance.
// Lenis smooths *user* wheel/touch scrolling; programmatic scrolls use the
// native smooth API (reliable everywhere, and Lenis syncs to native scroll).
let lenis: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
	lenis = instance;
}

export function getLenis(): Lenis | null {
	return lenis;
}

/**
 * Smooth-scroll to a target. When Lenis is active it drives the animation
 * (native smooth-scroll fights Lenis's rAF loop and can snap/teleport);
 * falls back to the native API when Lenis is unavailable.
 */
export function smoothScrollTo(
	target: number | string | HTMLElement,
	options: { offset?: number; duration?: number; immediate?: boolean } = {},
) {
	const { offset = 0, duration, immediate = false } = options;
	const y = resolveY(target);
	if (y === null) return;
	const top = y + offset;
	if (lenis) {
		lenis.scrollTo(top, {
			...(duration !== undefined ? { duration } : {}),
			...(immediate ? { immediate: true } : {}),
		});
		return;
	}
	if (immediate) {
		window.scrollTo(0, top);
	} else {
		window.scrollTo({ top, behavior: 'smooth' });
	}
}

/** Instant (no animation) scroll — for reduced-motion paths. */
export function instantScrollTo(target: number | string | HTMLElement, offset = 0) {
	smoothScrollTo(target, { offset, immediate: true });
}

function resolveY(target: number | string | HTMLElement): number | null {
	if (typeof target === 'number') return target;
	const el = typeof target === 'string' ? document.querySelector(target) : target;
	if (!el) return null;
	return el.getBoundingClientRect().top + window.scrollY;
}