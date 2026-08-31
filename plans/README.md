# Motion Improvement Plans — Footer + Colabo

Audit of animation/motion on the footer (`src/lib/components/Footer.svelte`) and the
colabo page (`src/routes/colabo/+page.svelte`). These are advisory plans; they do not
modify source directly — run each with `improve-animations execute <plan>` or hand it
to any agent.

| # | Title | Severity | Category | Status |
|---|-------|----------|----------|--------|
| 002 | Polish the colabo "Start a project" CTA | MEDIUM | Performance + Physicality | DONE |
| 001 | Add press feedback to the footer WhatsApp CTA | MEDIUM | Physicality & origin | DONE |
| 005 | Add a subtle hover micro-interaction to colabo cards | LOW | Missed opportunity | DONE |
| 003 | Fix the footer watermark motion | LOW | Cohesion & tokens | DONE |
| 004 | Reveal the footer on scroll | LOW | Missed opportunity | DONE |

## Recommended execution order

Run by leverage, high → low. Each plan is self-contained; order only matters for
balancing felt impact, not for correctness.

1. **002** — the colabo contact CTA is a primary conversion action; fixing `transition: all`
   and adding press feedback gives the most felt payoff.
2. **001** — the WhatsApp CTA is the footer's primary action; press feedback makes it feel alive.
3. **005** — a small, tasteful addition that lifts the colabo list without over-engineering.
4. **003** — token consolidation + removing a layout-animating property on the watermark.
5. **004** — an additive footer reveal that completes the unified motion language (optional polish).

## Dependencies

- **No plan depends on any other** — each is independently executable.
- **Shared files, distinct rules**: `001` and `003` both edit `src/lib/components/Footer.svelte` but touch different rules (`.wa-btn:active` vs `.footer-watermark`) with no overlap. `002` and `005` both edit `src/routes/colabo/+page.svelte` but touch `.cta` vs `.colabo-link`/card-hover with no overlap.
- If running serially, there is no conflict. If running in parallel, keep each in its own worktree/branch.

## Notes

- All values are pulled from the rule catalog (`AUDIT.md`) and use the repo's existing
  token system (`--ease-default`, `--ease-motion`, `--duration-fast`, `--duration-enter`,
  defined in `src/lib/styles/global.css`).
- Reduced-motion is covered globally in `global.css`; each plan only extends that behavior.
