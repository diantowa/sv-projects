# 005 — Add a subtle hover micro-interaction to colabo cards

- **Status**: DONE
- **Commit**: 2136456
- **Severity**: LOW
- **Category**: Missed opportunity (additive)
- **Estimated scope**: 1 file, ~6 lines

## Problem

The collaboration cards (`.colabo-item`) sit completely flat. Beyond the existing underline on "View details →", hovering a card does nothing. A restrained advance of the link on card hover fits the Swiss-minimal personality and gives the list a touch of life without breaking the calm tone.

Current code in `src/routes/colabo/+page.svelte:146`:

```css
/* src/routes/colabo/+page.svelte:146 — current */
.colabo-link {
    display: inline-block;
    margin-top: 0.75rem;
    font-size: var(--text-sm);
    font-weight: 600;
    letter-spacing: 0.03em;
    color: var(--color-text);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 1px;
    transition: border-color var(--duration-fast) var(--ease-default);
}

/* src/routes/colabo/+page.svelte:158 — current */
.colabo-link:hover {
    border-color: var(--color-text);
}
```

## Target

Advance the "View details →" link gently when its card is hovered, gated so touch devices don't get a false hover. Add `transform` to the link's transition and a card-hover rule:

```css
/* src/routes/colabo/+page.svelte — target */
.colabo-link {
    display: inline-block;
    margin-top: 0.75rem;
    font-size: var(--text-sm);
    font-weight: 600;
    letter-spacing: 0.03em;
    color: var(--color-text);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 1px;
    transition:
        border-color var(--duration-fast) var(--ease-default),
        transform var(--duration-fast) var(--ease-default);
}

@media (hover: hover) and (pointer: fine) {
    .colabo-item:hover .colabo-link {
        transform: translateX(2px);
    }
}
```

`translateX(2px)` is a small, deliberate advance — not a bouncy transition. Gating on `(hover: hover) and (pointer: fine)` prevents touch devices from firing a false hover on tap. The existing `.colabo-link:hover` `border-color` rule is preserved.

## Repo conventions to follow

- Use `var(--duration-fast)` / `var(--ease-default)` tokens; the `.colabo-link` already uses them for `border-color`.
- Transform-only movement keeps it GPU-friendly.
- The hover gate matches the rule catalog's accessibility guidance ("touch fires false hovers on tap").

## Steps

1. In `src/routes/colabo/+page.svelte`, update the `.colabo-link` `transition` (line 153) to include `transform var(--duration-fast) var(--ease-default)` alongside the existing `border-color`.
2. Add a new `@media (hover: hover) and (pointer: fine)` block (e.g. after the `.colabo-link:hover` rule ~line 158) containing `.colabo-item:hover .colabo-link { transform: translateX(2px); }`.
3. Leave everything else — the card reveal, `colabo-name`, `colabo-year`, `colabo-role` — untouched.

## Boundaries

- Do NOT change the card markup; the arrow `→` is a text character inside the link and is advanced as part of the whole link, so no wrapper span is needed.
- Do NOT touch `.colabo-item`'s borders, the reveal action, or the CTA in the contact section.
- Do NOT add a bigger transform or a scale — keep it to a 2px advance that reads as intentional, not playful.

## Verification

- **Mechanical**: `bun run build` succeeds. Grep to confirm the new `transform var(--duration-fast)` is in the `.colabo-link` transition and the `@media (hover: hover)` block exists.
- **Feel check**: run the site, go to `/colabo`, and:
  - Hover a card with the mouse and confirm "View details →" advances ~2px to the right and returns on mouse-out, with the underline darkening as before.
  - On a touch device / with DevTools device emulation, confirm tapping a card does not trigger a persistent hover advance.
  - Toggle `prefers-reduced-motion` and confirm the transform collapses but the underline hover still works.
- **Done when**: hovering a colabo card advances its link 2px (transform-only, hover-gated, token-based) and nothing else changed.
