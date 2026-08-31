# 002 — Polish the colabo "Start a project" CTA

- **Status**: DONE
- **Commit**: 2136456
- **Severity**: MEDIUM
- **Category**: Performance + Physicality & origin
- **Estimated scope**: 1 file, ~8 lines

## Problem

The contact CTA on the colabo page (`.cta`) has two issues, both on the same element:

1. `transition: all` animates every property off-GPU. Only `background-color` and `color` change on hover, so `all` is a sloppy catch-all that risks animating unintended props.
2. There is no `:active` press state. The button changes on hover but doesn't read as pressed on click (it's a primary conversion action).

Current code in `src/routes/colabo/+page.svelte:168`:

```css
/* src/routes/colabo/+page.svelte:168 — current */
.cta {
    margin-top: 0.5rem;
    padding: 0.875rem 2rem;
    font-size: var(--text-sm);
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-surface);
    background: var(--color-text);
    border: 1px solid var(--color-text);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-default);
}

/* src/routes/colabo/+page.svelte:183 — current */
.cta:hover {
    background: transparent;
    color: var(--color-text);
}
```

## Target

Target exactly the properties that change, and add a press feedback:

```css
/* src/routes/colabo/+page.svelte — target */
.cta {
    /* ...all props above unchanged... */
    transition:
        background-color var(--duration-fast) var(--ease-default),
        color var(--duration-fast) var(--ease-default),
        transform var(--duration-fast) var(--ease-default);
}

.cta:hover {
    background-color: transparent;
    color: var(--color-text);
}

.cta:active {
    transform: scale(0.98);
}
```

`scale(0.98)` is within the 0.95–0.98 press range from the rule catalog. The transition duration is `var(--duration-fast)` (150ms), within the 100–160ms button-press budget. `background` → `background-color` in `:hover` so the transition targets the actual changing property (there is no background image), which also prevents the shorthand from resetting the whole `background`.

## Repo conventions to follow

- Use the tokens `--duration-fast` / `--ease-default` from `src/lib/styles/global.css` — never hardcode a curve here.
- The sibling `.colabo-link` (line 146) already transitions `border-color var(--duration-fast) var(--ease-default)`; this plan extends the same token language to the CTA.
- `transform`-only press feedback (no width/height/margin) keeps it GPU-friendly.

## Steps

1. In `src/routes/colabo/+page.svelte`, replace the `.cta` `transition: all ...` line (line 180) with the three targeted properties `background-color`, `color`, `transform` (values `var(--duration-fast) var(--ease-default)`).
2. Change `.cta:hover`'s `background: transparent;` to `background-color: transparent;` so it aligns with the transitioned property.
3. Add a new `.cta:active { transform: scale(0.98); }` rule after the `.cta:hover` block (after line 186).
4. Leave all other `.cta` props (padding, border, radius, cursor) untouched.

## Boundaries

- Do NOT touch `.cta-inner`, `.colabo-*`, the colabo list reveal, or anything outside this `.cta` block.
- Do NOT change the button's markup (`<button class="cta">Start a project →</button>` in the `#contact` section).
- Do NOT add new files or dependencies.

## Verification

- **Mechanical**: `bun run build` succeeds. Confirm the `.cta` rule has no `transition: all` remaining (grep the file).
- **Feel check**: run the site, go to `/colabo`, scroll to "Let's work together", and:
  - Hover the CTA and confirm the background fades to transparent and text inverts smoothly (not a snap).
  - Press and confirm the button scales down to ~0.98, then returns on release.
  - In DevTools Animations panel at 10% playback, confirm only `background-color`, `color`, and `transform` are keyed — no layout properties.
  - Toggle `prefers-reduced-motion` and confirm transitions collapse but the hover color inversion still applies.
- **Done when**: `.cta` has no `transition: all`, `:active` scales to `0.98`, and `:hover` uses `background-color` only.
