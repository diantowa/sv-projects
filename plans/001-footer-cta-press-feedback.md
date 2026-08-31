# 001 — Add press feedback to the footer WhatsApp CTA

- **Status**: DONE
- **Commit**: 2136456
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 1 file, ~2 lines

## Problem

The primary contact CTA (`.wa-btn`) feels dead on click. On hover it lifts up 1px (`translateY(-1px)`), but on press it only returns to rest (`translateY(0)`). There is no press-in feel — the button doesn't read as "pressed". Per the animation bar, a pressable element needs `transform: scale(0.97)` on `:active` (keep it subtle, 0.95–0.98).

Current code in `src/lib/components/Footer.svelte:171`:

```css
/* src/lib/components/Footer.svelte:171 — current */
.wa-btn:active {
    transform: translateY(0);
}
```

The `.wa-btn` block at `Footer.svelte:145` already has a `transform` transition, so the press will animate smoothly without extra wiring:

```css
/* src/lib/components/Footer.svelte:145 — current (transform is already present) */
transition:
    background var(--duration-fast) var(--ease-default),
    border-color var(--duration-fast) var(--ease-default),
    transform var(--duration-fast) var(--ease-default);
```

## Target

Hold the vertical at rest while pressing in, so the button drops to its base position *and* scales down:

```css
/* src/lib/components/Footer.svelte — target */
.wa-btn:active {
    transform: translateY(0) scale(0.97);
}
```

`scale(0.97)` is the exact value from the rule catalog. The transition uses the repo's `var(--duration-fast)` (150ms) — within the 100–160ms button-press budget. The existing hover lift (`translateY(-1px)`) is preserved.

## Repo conventions to follow

- Duration/easing already live as tokens: `--duration-fast: 150ms`, `--ease-default: cubic-bezier(0.4, 0, 0.2, 1)` (defined in `src/lib/styles/global.css:54` and `:root` at `:268`). Use them — do not hardcode.
- `src/lib/components/Header.svelte:171` is an existing press-adjacent pattern that transitions `transform` via `var(--duration-fast) var(--ease-default)`. Imitate it.
- The gradient/transform-only rule already holds here: only `transform` changes on press, so no layout animation.

## Steps

1. In `src/lib/components/Footer.svelte`, change the `.wa-btn:active` rule (around line 171) from `transform: translateY(0);` to `transform: translateY(0) scale(0.97);`.
2. Confirm the `.wa-btn` block (line 145) still lists `transform` in its `transition`, so the press animates. Do not alter the hover rule (line 165) — it keeps `translateY(-1px)`.
3. No touch-ups to the `.wa-icon` or text — press applies to the whole button, which is correct.

## Boundaries

- Do NOT touch `.footer-nav a`, `.footer-links a`, `.footer-watermark`, or anything outside `src/lib/components/Footer.svelte`.
- Do NOT change the markup inside `.wa-btn` (the SVG/`span` structure stays).
- Do NOT add dependencies, build steps, or JS — this is pure CSS.
- Do NOT remove the hover lift; it is intentional.

## Verification

- **Mechanical**: `bun run build` succeeds (SvelteKit). No new warnings from the CSS.
- **Feel check**: run the site, hover the WhatsApp button and confirm it lifts 1px; press and confirm it drops to rest and scales to ~0.97, then returns smoothly on release.
  - In DevTools, set the Animations panel playback to 10% and confirm the press is a single transform interpolation (no jump to `scale(0)`).
  - Toggle `prefers-reduced-motion` (Rendering panel) and confirm the transition collapses to near-zero and the button still visually presses (transform still applied) — the global rule only shortens duration, it does not remove the transform.
- **Done when**: the `.wa-btn` visibly presses in on `:active` and both `transform: translateY(0) scale(0.97)` and the existing hover lift are present.
