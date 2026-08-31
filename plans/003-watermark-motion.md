# 003 — Fix the footer watermark motion

- **Status**: DONE
- **Commit**: 2136456
- **Severity**: LOW
- **Category**: Cohesion & tokens + Performance
- **Estimated scope**: 1 file, ~3 lines

## Problem

The footer watermark has two motion nits:

1. It animates `font-size`, which triggers layout + paint — against the "animate transform and opacity only" rule. (It only runs on a resize crossing the 768px breakpoint, so impact is low, but it's the wrong property.)
2. It hardcodes `cubic-bezier(0.4, 0, 0.2, 1)`, which is exactly the `--ease-default` token, instead of using the variable. This is a token-consolidation finding.

Current code in `src/lib/components/Footer.svelte:208`:

```css
/* src/lib/components/Footer.svelte:208 — current */
.footer-watermark {
    position: absolute;
    bottom: 0.2em;
    left: 50%;
    transition:
        transform 400ms cubic-bezier(0.4, 0, 0.2, 1),
        font-size 400ms cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateX(-30%);
    font-size: clamp(8rem, 16vw, 18rem);
    /* ... */
}
```

## Target

Keep the `transform` smoothing across the responsive breakpoint, drop the layout-triggering `font-size`, and use the token:

```css
/* src/lib/components/Footer.svelte — target */
.footer-watermark {
    position: absolute;
    bottom: 0.2em;
    left: 50%;
    transition: transform 400ms var(--ease-default);
    transform: translateX(-30%);
    font-size: clamp(8rem, 16vw, 18rem);
    /* ... */
}
```

The `font-size` now snaps instantly on a resize crossing the breakpoint. This is imperceptible (it's a resize, not an interaction), and it removes a layout-animation from a very large element. The `var(--ease-default)` token duplicates the currently hardcoded curve — no visual change, but it becomes a single source of truth.

## Repo conventions to follow

- Use `var(--ease-default)` (defined in `src/lib/styles/global.css:54`) instead of a literal curve wherever the value matches.
- The rest of the site transitions only `transform`/`opacity`; this aligns the watermark.
- The watermark's ambient `watermark-drift` animation (defined in `global.css`) is unaffected — leave it.

## Steps

1. In `src/lib/components/Footer.svelte`, edit the `.footer-watermark` `transition` (lines 208–209) to `transition: transform 400ms var(--ease-default);`.
2. Remove the `font-size 400ms cubic-bezier(0.4, 0, 0.2, 1)` transition entry entirely.
3. Confirm the base `font-size: clamp(8rem, 16vw, 18rem);` and the `@media (min-width: 768px)` override remain untouched — only the transition changes.

## Boundaries

- Do NOT touch the `watermark-drift` animation or either `mask-image`/`-webkit-mask-image` block.
- Do NOT change the watermark's `transform`, `font-size`, `opacity`, or breakpoint values.
- Do NOT add/remove files or JS.

## Verification

- **Mechanical**: `bun run build` succeeds. Grep the file to confirm no `cubic-bezier(0.4` literal remains in the transition (the `@theme`/`:root` token definitions are fine to keep).
- **Feel check**: run the site, open DevTools, and:
  - Resize across 768px and confirm the watermark's horizontal position still eases (transform transition) and the font snaps — no visible jank or reflow flicker.
  - Confirm the watermark's color drift (the slow 24s animation) still runs identically.
  - Toggle `prefers-reduced-motion` and confirm the drift stops and the transition collapses.
- **Done when**: `.footer-watermark` transitions only `transform 400ms var(--ease-default)` and no `font-size` or literal curve appears in that rule.
