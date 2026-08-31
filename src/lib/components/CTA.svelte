<script lang="ts">
    import { reveal } from "$lib/actions/reveal";

    interface Props {
        id?: string;
        label?: string;
        headline?: string;
        description?: string;
        buttons?: { label: string; href: string; external?: boolean }[];
    }

    let {
        id,
        label = "Get in Touch",
        headline = "Let's work together",
        description = "Have a project in mind or want to collaborate? I'd love to hear from you.",
        buttons = [
            {
                label: "Email",
                href: "mailto:wahyudi.chrisdianto@gmail.com",
                external: true,
            },
            {
                label: "WhatsApp",
                href: "https://wa.me/6289687407837",
                external: true,
            },
        ],
    }: Props = $props();

    // Context text shown next to the icon on hover/focus: "send" for Email,
    // "start chat" for WhatsApp.
    const hoverText: Record<string, string> = {
        Email: "send",
        WhatsApp: "start chat",
    };
</script>

<section {id} class="cta" aria-label="Call to action">
    <div class="cta-inner grid-container" use:reveal={{ mode: "rise", stagger: true, staggerInterval: 90 }}>
        <span class="label">{label}</span>
        <h2 class="cta-headline">{headline}</h2>
        <p class="cta-description">{description}</p>

        <div class="cta-buttons">
            {#each buttons as item}
                <a
                    class="cta-button"
                    href={item.href}
                    {...item.external
                        ? { target: "_blank", rel: "noopener" }
                        : {}}
                >
                    <span class="svg-wrapper-1">
                        <span class="svg-wrapper">
                            {#if item.label === "WhatsApp"}
                                <!-- Chat bubble (rest) -->
                                <svg
                                    class="cta-icon-bubble"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="16"
                                    height="16"
                                    aria-hidden="true"
                                >
                                    <path fill="none" d="M0 0h24v24H0z"></path>
                                    <path
                                        fill="currentColor"
                                        d="M12 2C6.48 2 2 6.04 2 11c0 2.7 1.31 5.1 3.41 6.71L4.5 22l4.42-2.28c.97.26 2.01.4 3.08.4 5.52 0 10-4.04 10-9.12S17.52 2 12 2z"
                                    ></path>
                                </svg>
                                <!-- Paper plane (hover) -->
                                <svg
                                    class="cta-icon-plane"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="16"
                                    height="16"
                                    aria-hidden="true"
                                >
                                    <path fill="none" d="M0 0h24v24H0z"></path>
                                    <path
                                        fill="currentColor"
                                        d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                                    ></path>
                                </svg>
                            {:else}
                                <!-- Paper plane -->
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="16"
                                    height="16"
                                    aria-hidden="true"
                                >
                                    <path fill="none" d="M0 0h24v24H0z"></path>
                                    <path
                                        fill="currentColor"
                                        d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                                    ></path>
                                </svg>
                            {/if}
                        </span>
                        <span class="cta-hover-text">{hoverText[item.label] ?? "go"}</span>
                    </span>
                    <span class="cta-button-label">{item.label}</span>
                </a>
            {/each}
        </div>
    </div>
</section>

<style>
    .cta {
        padding: var(--space-section) 0;
        border-top: 1px solid var(--color-border);
    }

    .cta-inner {
        margin: 0 auto;
        padding: 0 1.5rem;
        text-align: center;
    }

    .cta .label {
        display: block;
        margin-bottom: 1rem;
    }

    .cta-headline {
        font-size: var(--text-3xl);
        font-weight: 700;
        letter-spacing: -0.02em;
        margin-bottom: 1rem;
    }

    @media (min-width: 768px) {
        .cta-headline {
            font-size: var(--text-4xl);
        }
    }

    .cta-description {
        font-size: var(--text-base);
        color: var(--color-text-muted);
        max-width: 48ch;
        margin: 0 auto var(--space-element);
        line-height: 1.6;
    }

    .cta-buttons {
        display: flex;
        justify-content: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .cta-button {
        display: inline-flex;
        align-items: center;
        padding: 0.875rem 2.5rem;
        font-size: var(--text-sm);
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        background: var(--color-text);
        color: var(--color-surface);
        border: 1px solid var(--color-text);
        border-radius: var(--radius-sm);
        overflow: hidden;
        transition:
            background-color var(--duration-normal) var(--ease-default),
            color var(--duration-normal) var(--ease-default),
            border-color var(--duration-normal) var(--ease-default),
            transform 120ms var(--ease-default);
        cursor: pointer;
    }

    /* Darken: invert to surface with text color on hover. */
    .cta-button:hover {
        background: var(--color-surface);
        color: var(--color-text);
        border-color: var(--color-text);
    }

    .cta-button:active {
        transform: scale(0.95);
    }

    /* ── Original fly-to-center motion (uiverse "smart-moth", site colors).
       At rest: icon + label are a normal flex row (tight gap). On hover the
       icon+text group becomes absolutely centered; label slides out. ── */
    .cta-button {
        position: relative;
    }

    .cta-button .svg-wrapper-1 {
        display: flex;
        align-items: center;
        position: relative;
        transition:
            left 0.3s ease-in-out,
            transform 0.3s ease-in-out;
        white-space: nowrap;
    }

    .cta-button .svg-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }

    .cta-button .cta-icon-plane {
        position: absolute;
        opacity: 0;
        transition:
            opacity 0.25s ease-in-out,
            transform 0.3s ease-in-out;
    }

    /* WhatsApp: bubble at rest → paper-plane arrow on hover. */
    .cta-button:hover .cta-icon-bubble {
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
    }

    .cta-button:hover .cta-icon-plane {
        opacity: 1;
        transform: rotate(45deg);
    }

    .cta-button svg {
        display: block;
        transform-origin: center center;
        transition: transform 0.3s ease-in-out;
    }

    .cta-hover-text {
        text-transform: none;
        letter-spacing: 0.02em;
        opacity: 0;
        position: absolute;
        left: calc(100% + 0.5em);
        white-space: nowrap;
        transition: opacity 0.25s ease-in-out;
    }

    .cta-button .cta-button-label {
        display: block;
        margin-left: 0.5em;
        transition:
            transform 0.3s ease-in-out,
            opacity 0.25s ease-in-out;
    }

    .cta-button:hover .svg-wrapper {
        animation: cta-fly 0.6s ease-in-out infinite alternate;
    }

    .cta-button:hover .svg-wrapper-1 {
        transform: scale(1.15);
    }

    .cta-button:hover svg {
        transform: rotate(45deg);
    }

    .cta-button:hover .cta-hover-text {
        opacity: 1;
    }

    .cta-button:hover .cta-button-label {
        transform: translateX(4em);
        opacity: 0;
    }

    @keyframes cta-fly {
        from {
            transform: translateY(0.1em);
        }
        to {
            transform: translateY(-0.1em);
        }
    }
</style>
