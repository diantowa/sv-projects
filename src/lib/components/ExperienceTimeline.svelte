<script lang="ts">
    import { reveal } from "$lib/actions/reveal";

    interface ResumeExperience {
        id: string;
        title: string;
        company: string;
        location?: string | null;
        startDate: string;
        endDate: string;
        bullets: string[];
        techStack?: string | null;
    }

    interface Props {
        id?: string;
        experiences: ResumeExperience[];
    }
    let { id, experiences }: Props = $props();

    let expanded = $state(false);
    let toggleBtnEl = $state<HTMLButtonElement | null>(null);
    const DEFAULT_COUNT = 3;

    const visible = $derived(
        expanded ? experiences : experiences.slice(0, DEFAULT_COUNT)
    );
    const canToggle = $derived(experiences.length > DEFAULT_COUNT);

    // techStack is a comma-separated string from the résumé editor.
    const tags = (raw?: string | null): string[] =>
        raw
            ? raw
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
            : [];

    // Items beyond the default count only exist when expanded — reveal them
    // immediately (no scroll dependency) so the drawer "opens" with motion.
    // Slower + staggered to match the deliberate scroll (1s), so items rise
    // while the view glides down. The first items keep scroll-triggered reveal.
    function revealFor(i: number) {
        return i >= DEFAULT_COUNT
            ? {
                  mode: "rise" as const,
                  immediate: true,
                  duration: 1100,
                  delay: (i - DEFAULT_COUNT) * 90,
              }
            : { mode: "rise" as const };
    }

    function toggle() {
        expanded = !expanded;
        // Deterministic anchor + deliberate eased scroll. The toggle button is
        // scrolled to sit ~24px above the viewport bottom — same frame every
        // time regardless of row heights. Reduced-motion: instant jump.
        requestAnimationFrame(() => {
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (expanded) {
                if (toggleBtnEl) {
                    const rect = toggleBtnEl.getBoundingClientRect();
                    const targetY = window.scrollY + rect.top - (window.innerHeight - rect.height - 24);
                    if (reduce) window.scrollTo(0, targetY);
                    else easedScrollTo(targetY, 1200);
                }
            } else if (id) {
                const el = document.getElementById(id);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    const targetY = window.scrollY + rect.top - 16;
                    if (reduce) window.scrollTo(0, targetY);
                    else easedScrollTo(targetY, 800);
                }
            }
        });
    }

    // cubic-bezier(0.22, 1, 0.36, 1) — the site's --ease-motion token.
    function easeMotion(t: number): number {
        const x1 = 0.22, y1 = 1, x2 = 0.36, y2 = 1;
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        let u = t;
        for (let i = 0; i < 8; i++) {
            const omu = 1 - u;
            const x = 3 * omu * omu * u * x1 + 3 * omu * u * u * x2 + u * u * u;
            const dx = 3 * omu * omu * x1 + 6 * omu * u * (x2 - x1) + 3 * u * u * (1 - x2);
            const err = x - t;
            if (Math.abs(err) < 1e-6) break;
            u -= err / dx;
            if (u < 0) u = 0;
            else if (u > 1) u = 1;
        }
        const omu = 1 - u;
        return 3 * omu * omu * u * y1 + 3 * omu * u * u * y2 + u * u * u;
    }

    function easedScrollTo(targetY: number, duration: number) {
        const startY = window.scrollY;
        const delta = targetY - startY;
        if (Math.abs(delta) < 1) return;
        const start = performance.now();
        const step = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            window.scrollTo(0, startY + delta * easeMotion(t));
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }
</script>

<section {id} class="experience" aria-label="Experience">
    <div class="experience-inner grid-container">
        <div class="section-head" use:reveal={{ mode: "rise" }}>
            <span class="label">Experience</span>
            <h2 class="section-title">Career Timeline</h2>
        </div>

        <div class="timeline" class:expanded-all={expanded}>
            {#each visible as exp, i (exp.id)}
                <div class="timeline-item" use:reveal={revealFor(i)}>
                    <div class="timeline-marker">
                        <span class="timeline-dot"></span>
                        {#if i < visible.length - 1}
                            <span class="timeline-line"></span>
                        {/if}
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <h3 class="timeline-role">{exp.title}</h3>
                            <span class="timeline-date"
                                >{exp.startDate} — {exp.endDate}</span
                            >
                        </div>
                        <p class="timeline-company">
                            {exp.company}{#if exp.location} · {exp.location}{/if}
                        </p>
                        <div class="timeline-desc-wrap">
                            <div class="timeline-desc-inner">
                                {#each exp.bullets as bullet, bi (bi)}
                                    <p class="timeline-desc">{bullet}</p>
                                {/each}
                            </div>
                        </div>
                        {#if tags(exp.techStack).length > 0}
                            <div class="timeline-tags">
                                {#each tags(exp.techStack) as tech}
                                    <span class="tag">{tech}</span>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>

        {#if canToggle}
            <button
                class="toggle-btn"
                class:expanded
                bind:this={toggleBtnEl}
                onclick={toggle}
            >
                <span
                    >{expanded
                        ? "Show less"
                        : `Show all ${experiences.length} experiences`}</span
                >
                <span class="toggle-caret" aria-hidden="true">▾</span>
            </button>
        {/if}
    </div>
</section>

<style>
    .experience {
        padding: var(--space-section) 0;
        border-top: 1px solid var(--color-border);
    }

    .experience-inner {
        margin: 0 auto;
        padding: 0 1.5rem;
    }

    .section-head {
        margin-bottom: var(--space-block);
    }

    .section-head .label {
        display: block;
        margin-bottom: 0.5rem;
    }

    .section-title {
        font-size: var(--text-2xl);
        font-weight: 700;
        letter-spacing: -0.02em;
        margin-bottom: 0;
    }

    .timeline {
        position: relative;
    }

    /* Items are individually revealed (`rise-el` + `revealed` in non-stagger
       rise mode). Dot pops, line draws downward once an item reveals. */
    .timeline-item {
        position: relative;
        padding-bottom: var(--space-block);
        min-height: 72px;
    }

    .timeline-item:last-child {
        padding-bottom: 0;
    }

    .timeline-marker {
        position: absolute;
        left: -1.25rem;
        top: 0.35rem;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .timeline-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--color-text);
        flex-shrink: 0;
        transform: scale(0.2);
        opacity: 0;
        transition:
            transform 500ms var(--ease-motion) 120ms,
            opacity 400ms var(--ease-motion) 120ms;
    }
    .timeline-item.revealed .timeline-dot {
        transform: scale(1);
        opacity: 1;
    }

    .timeline-line {
        width: 1px;
        flex: 1;
        background: var(--color-border);
        margin-top: 0.5rem;
        transform: scaleY(0);
        transform-origin: top;
        opacity: 0;
        transition:
            transform 650ms var(--ease-motion) 200ms,
            opacity 400ms var(--ease-motion) 200ms;
    }
    .timeline-item.revealed .timeline-line {
        transform: scaleY(1);
        opacity: 1;
    }

    .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 1rem;
        margin-bottom: 0.25rem;
    }

    .timeline-role {
        font-size: var(--text-lg);
        font-weight: 600;
        transition: color var(--duration-fast) var(--ease-default);
    }

    .timeline-date {
        font-size: var(--text-xs);
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--color-text-muted);
        white-space: nowrap;
    }

    .timeline-company {
        font-size: var(--text-base);
        color: var(--color-text-muted);
        margin-bottom: 0.75rem;
    }

    .timeline-desc {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        line-height: 1.6;
        margin-bottom: 0.75rem;
    }

    /* ── Job descriptions hidden by default; reveal on item hover or when
       "Show all" expands the list. grid-template-rows 0fr→1fr animates the
       height without JS measuring. ── */
    .timeline-desc-wrap {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows 450ms var(--ease-motion);
    }
    .timeline-desc-inner {
        overflow: hidden;
        min-height: 0;
    }
    .timeline-desc-inner .timeline-desc:first-child {
        margin-top: 0.5rem;
    }
    .timeline-item:hover .timeline-desc-wrap,
    .timeline.expanded-all .timeline-desc-wrap {
        grid-template-rows: 1fr;
    }

    .timeline-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .tag {
        font-size: var(--text-xs);
        font-weight: 500;
        letter-spacing: 0.03em;
        padding: 0.25rem 0.625rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
    }

    /* ── Hover feedback: dot blooms, role tints ── */
    .timeline-item:hover .timeline-dot {
        transform: scale(1.5);
        background: var(--color-accent);
        box-shadow: 0 0 0 4px var(--color-accent-muted);
    }

    /* ── Show-all toggle with rotating caret ── */
    .toggle-btn {
        margin-top: var(--space-element);
        padding: 0.75rem 1.5rem;
        font-size: var(--text-sm);
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        background: none;
        border: 1px solid var(--color-border);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: all var(--duration-fast) var(--ease-default);
    }

    .toggle-btn:hover {
        border-color: var(--color-text);
        background: var(--color-text);
        color: var(--color-surface);
    }

    .toggle-caret {
        display: inline-block;
        font-size: 0.7em;
        line-height: 1;
        transition: transform var(--duration-fast) var(--ease-default);
    }

    .toggle-btn.expanded .toggle-caret {
        transform: rotate(180deg);
    }

    /* ── Reduced motion is handled globally (see global.css): reveals snap, ──
       transitions/animations collapse to 0.01ms. */
</style>