<script lang="ts">
    import SectionNav from "$lib/components/SectionNav.svelte";
    import FilterableMasonry from "$lib/components/FilterableMasonry.svelte";
    import CTA from "$lib/components/CTA.svelte";
    import { reveal } from "$lib/actions/reveal";
    import { sections } from "$lib/configs/navs";
    import type { Project } from "$lib/types";

    let { data } = $props();
    const projects = $derived(data.projects as Project[]);
</script>

<SectionNav sections={sections.projects} />

<section id="projects" class="page-section">
    <div class="page-inner">
        <span class="label page-label animate-in">Projects</span>
        <h1 class="page-title animate-in-2">Selected Work</h1>
        <p class="page-subtitle animate-in-3">
            A collection of projects spanning web applications, design systems,
            and developer tools.
        </p>

        <FilterableMasonry
            items={projects}
            searchPlaceholder="Search projects…"
            noun="project"
            collapseMaxHeight={700}
            seeMoreLabel="See more projects"
        >
            {#snippet card(item)}
                {@const project = item as Project}
                {#if project.image}
                    <img class="proj-image" src={project.image} alt={project.title} loading="lazy" />
                {/if}
                <div class="proj-body">
                    <div class="proj-meta">
                        <span class="proj-year">{project.year}</span>
                    </div>
                    <h2 class="proj-title">{project.title}</h2>
                    <p class="proj-desc">{project.description}</p>
                    <div class="proj-tags">
                        {#each project.tags as tag (tag)}
                            <span class="tag">{tag}</span>
                        {/each}
                    </div>
                    {#if project.link}
                        <a href={project.link} class="proj-link" target="_blank" rel="noopener"
                            >View project →</a
                        >
                    {/if}
                </div>
            {/snippet}
        </FilterableMasonry>
    </div>
</section>

<section id="contact">
    <CTA
        label="Collaboration"
        headline="Have a project in mind?"
        description="I'm always interested in new challenges and opportunities to build something meaningful."
        buttons={[{ label: "Let's Talk", href: "/colabo" }]}
    />
</section>

<style>
    .page-section {
        padding: var(--space-section) 0;
    }

    .page-inner {
        max-width: 1100px;
        margin: 0 auto;
        padding: 0 1.5rem;
    }

    .page-section .label {
        display: block;
        margin-bottom: 0.5rem;
    }

    .page-title {
        font-size: var(--text-3xl);
        font-weight: 700;
        letter-spacing: -0.02em;
        margin-bottom: 0.5rem;
    }

    @media (min-width: 768px) {
        .page-title {
            font-size: var(--text-4xl);
        }
    }

    .page-subtitle {
        font-size: var(--text-base);
        color: var(--color-text-muted);
        max-width: 48ch;
        margin-bottom: var(--space-block);
    }

    /* ── Card content (rendered inside the shared .arch-card shell) ── */
    .proj-image {
        width: 100%;
        aspect-ratio: 16 / 10;
        object-fit: cover;
        display: block;
    }

    .proj-body {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        padding: 1.25rem;
        flex: 1;
    }

    .proj-meta .proj-year {
        font-size: var(--text-xs);
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--color-text-muted);
    }

    .proj-title {
        font-size: var(--text-lg);
        font-weight: 600;
        line-height: 1.3;
        letter-spacing: -0.01em;
    }

    .proj-desc {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        line-height: 1.6;
    }

    .proj-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
        margin-top: auto;
    }

    .tag {
        font-size: var(--text-xs);
        font-weight: 500;
        letter-spacing: 0.03em;
        padding: 0.25rem 0.625rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
    }

    .proj-link {
        font-size: var(--text-sm);
        font-weight: 600;
        letter-spacing: 0.03em;
        color: var(--color-accent);
        border-bottom: 1px solid var(--color-accent-border);
        padding-bottom: 1px;
        width: fit-content;
        transition: border-color var(--duration-fast) var(--ease-default);
    }

    .proj-link:hover {
        border-color: var(--color-accent);
    }

    @media (max-width: 640px) {
        .proj-body {
            padding: 1rem;
        }
    }
</style>