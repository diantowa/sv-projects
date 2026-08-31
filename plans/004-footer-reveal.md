# 004 — Reveal the footer on scroll

- **Status**: DONE
- **Commit**: 2136456
- **Severity**: LOW
- **Category**: Missed opportunity (additive)
- **Estimated scope**: 1 file, +1 import +1 directive

## Problem

Every page section rises in with the site's shared `rise-in` motion, but the footer is static chrome. When it enters the viewport it simply appears — a mild cohesion gap against the unified motion language. The footer should enter the viewport with the same fade+rise used everywhere else.

The site already has a reusable `reveal` Svelte action and the `rise-in` keyframe; this just applies them to the footer columns.

## Target

Apply the site's scroll-reveal to the footer's three columns so they rise in when the footer scrolls into view:

```svelte
<!-- src/lib/components/Footer.svelte — target -->
<script lang="ts">
    import ThemeSwitcher from "$lib/components/ThemeSwitcher.svelte";
    import { reveal } from "$lib/actions/reveal";
    /* ... */
</script>

<!-- on the footer grid -->
<div class="footer-grid" use:reveal={{ mode: "rise", stagger: true, staggerInterval: 60 }}>
    <!-- .footer-col x3 -->
</div>
```

No new CSS is needed — `mode: "rise"` adds `rise-el` to each `.footer-col`, and the global `rise-in` keyframe (`global.css:340`, `--ease-motion`, 800ms) plus the `reveal-stagger`/`.revealed` rules handle the animation. Reduced-motion is handled by the existing global rule.

## Repo conventions to follow

- This is the exact pattern already used on the colabo list: `use:reveal={{ mode: "rise", stagger: true, staggerInterval: 70 }}` (`src/routes/colabo/+page.svelte:19`). Imitate it; a footer-appropriate `staggerInterval: 60` keeps 3 columns tight.
- The `reveal` action lives in `src/lib/actions/reveal.ts`; `rise` mode uses the shared `rise-in` keyframe so it matches the hero/page-header entrances.
- The global `@media (prefers-reduced-motion: reduce)` rule (`global.css:453`) force-reveals `.reveal-stagger > *` and runs `rise-el` at near-zero duration, so reduced-motion users get instant reveal with no extra branch.

## Steps

1. In `src/lib/components/Footer.svelte`, add `import { reveal } from "$lib/actions/reveal";` to the script block.
2. Add `use:reveal={{ mode: "rise", stagger: true, staggerInterval: 60 }}` to the `.footer-grid` element (the `<div class="footer-grid">`). Keep all existing classes.
3. Do not touch `.footer-bottom` or `.footer-watermark` — only the three columns inside `.footer-grid` reveal.

## Boundaries

- Do NOT modify markup inside the columns (labels, nav, links, CTA) — only add the directive to the container.
- Do NOT add any new CSS rules or files; the existing `rise-in`/`reveal-stagger` machinery does the work.
- Do NOT touch `src/routes/+layout.svelte` (the footer is already rendered there; the change is inside `Footer.svelte`).
- This is the one plan that adds a `use:` directive (markup attribute). It is required for the JS-triggered reveal and is otherwise a motion enhancement.

## Verification

- **Mechanical**: `bun run build` succeeds. Confirm `$lib/actions/reveal` resolves (it is already imported elsewhere in the app).
- **Feel check**: run the site, scroll to the bottom, and confirm:
  - The footer columns rise in with the site's fade+rise using `--ease-motion`, staggered ~60ms apart.
  - Nothing inside the footer has layout shift or a pop — only `opacity` + `transform` animate.
  - On a short page where the footer is visible at load, the `revealIfAbove` fallback reveals it immediately (no invisible footer).
  - Toggle `prefers-reduced-motion` and confirm the columns are instantly visible with no movement.
- **Done when**: scrolling into the footer reveals the three columns with the shared rise motion, reduced-motion shows them instantly, and no source other than `Footer.svelte` changed.
