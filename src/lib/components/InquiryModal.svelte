<script lang="ts">
    import { beforeNavigate } from "$app/navigation";
    import { enhance } from "$app/forms";
    import { onMount } from "svelte";

    let { open = $bindable(false), siteKey = "" }: { open?: boolean; siteKey?: string } =
        $props();

    let dialogEl = $state<HTMLDialogElement | null>(null);
    let turnstileEl = $state<HTMLDivElement | null>(null);
    let submitting = $state(false);
    let success = $state(false);
    let errorMsg = $state("");

    const projectTypes = ["Web app", "Website", "Mobile app", "UI/UX design", "Consulting", "Other"];
    const budgets = ["< $1k", "$1k–5k", "$5k–15k", "$15k+", "Let's discuss"];
    const timelines = ["ASAP", "1–3 months", "3–6 months", "Flexible"];

    let turnstileId: unknown = null;

    // Keep the native <dialog> (top layer) in sync with `open`.
    $effect(() => {
        const d = dialogEl;
        if (!d) return;
        if (open && !d.open) d.showModal();
        else if (!open && d.open) d.close();
    });

    // Render Turnstile into the form once the widget mounts (only when a key is set).
    $effect(() => {
        if (!open || !siteKey || !turnstileEl) return;
        const w = window as unknown as { turnstile?: { render: (el: HTMLElement, o: object) => unknown } };
        if (w.turnstile && turnstileId === null) {
            turnstileId = w.turnstile.render(turnstileEl, { sitekey: siteKey });
        }
    });

    function resetTurnstile() {
        const w = window as unknown as { turnstile?: { reset: (id: unknown) => void } };
        if (w.turnstile && turnstileId !== null) w.turnstile.reset(turnstileId);
    }

    function close() {
        open = false;
        // Reset for next open.
        success = false;
        errorMsg = "";
        submitting = false;
    }

    onMount(() => {
        if (!siteKey) return;
        if (document.querySelector('script[data-turnstile]')) return;
        const s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        s.async = true;
        s.defer = true;
        s.setAttribute("data-turnstile", "");
        document.head.appendChild(s);
    });

    beforeNavigate(close);
</script>

<dialog
    bind:this={dialogEl}
    class="modal"
    onclose={close}
    onclick={(e) => {
        if (e.target === dialogEl) close();
    }}
>
    {#if open}
        {#if success}
            <div class="success">
                <h3>Thanks — message received 🙌</h3>
                <p>I read every inquiry personally and usually reply within 2 business days.</p>
                <button class="ghost" type="button" onclick={close}>Close</button>
            </div>
        {:else}
            <form
                method="POST"
                action="/colabo?/inquire"
                class="form"
                use:enhance={() => {
                    submitting = true;
                    errorMsg = "";
                    return async ({ result }) => {
                        submitting = false;
                        if (result.type === "success") {
                            success = true;
                        } else if (result.type === "failure") {
                            errorMsg =
                                (result.data?.error as string) ??
                                "Something went wrong. Please try again.";
                            resetTurnstile();
                        } else if (result.type === "error") {
                            errorMsg = "Network error. Please try again.";
                            resetTurnstile();
                        }
                    };
                }}
            >
                <div class="modal-head">
                    <h3>Tell me about your project</h3>
                    <button class="x" type="button" aria-label="Close" onclick={close}>✕</button>
                </div>

                <div class="modal-body">
                    {#if errorMsg}
                        <p class="alert" role="alert">{errorMsg}</p>
                    {/if}

                    <!-- honeypot: hidden from humans -->
                    <input
                        class="hp"
                        type="text"
                        name="website"
                        tabindex="-1"
                        autocomplete="off"
                        aria-hidden="true"
                    />

                    <div class="row">
                        <label class="field">
                            Name *
                            <input type="text" name="name" required />
                        </label>
                        <label class="field">
                            Email *
                            <input type="email" name="email" required />
                        </label>
                    </div>

                    <div class="row">
                        <label class="field">
                            Company <span class="opt">(optional)</span>
                            <input type="text" name="company" />
                        </label>
                        <label class="field">
                            Link <span class="opt">(optional)</span>
                            <input type="url" name="link" placeholder="https://" />
                        </label>
                    </div>

                    <fieldset class="chips">
                        <legend>What do you need?</legend>
                        {#each projectTypes as opt (opt)}
                            <label class="chip">
                                <input type="radio" name="projectType" value={opt} />
                                <span>{opt}</span>
                            </label>
                        {/each}
                    </fieldset>

                    <fieldset class="chips">
                        <legend>Budget</legend>
                        {#each budgets as opt (opt)}
                            <label class="chip">
                                <input type="radio" name="budget" value={opt} />
                                <span>{opt}</span>
                            </label>
                        {/each}
                    </fieldset>

                    <fieldset class="chips">
                        <legend>Timeline</legend>
                        {#each timelines as opt (opt)}
                            <label class="chip">
                                <input type="radio" name="timeline" value={opt} />
                                <span>{opt}</span>
                            </label>
                        {/each}
                    </fieldset>

                    <label class="field">
                        Project details *
                        <textarea
                            name="message"
                            required
                            placeholder="What are you trying to build, and how can I help?"
                        ></textarea>
                    </label>

                    {#if siteKey}
                        <div class="turnstile" bind:this={turnstileEl}></div>
                    {/if}
                </div>

                <div class="modal-foot">
                    <button class="ghost" type="button" onclick={close}>Cancel</button>
                    <button class="submit" type="submit" disabled={submitting}>
                        {submitting ? "Sending…" : "Send inquiry"}
                    </button>
                </div>
            </form>
        {/if}
    {/if}
</dialog>

<style>
    .modal {
        width: min(620px, 92vw);
        height: fit-content;
        max-height: 90vh;
        margin: auto;
        padding: 0;
        position: fixed;
        inset: 0;
        overflow: hidden;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg);
        color: var(--color-text);
        box-shadow: 0 24px 64px oklch(0% 0 0 / 0.25);
    }
    .modal::backdrop {
        background: oklch(0% 0 0 / 0.5);
        -webkit-backdrop-filter: blur(3px);
        backdrop-filter: blur(3px);
    }

    .form {
        display: flex;
        flex-direction: column;
        max-height: 90vh;
    }

    .modal-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.1rem 1.5rem;
        border-bottom: 1px solid var(--color-border);
    }
    .modal-head h3 {
        margin: 0;
        font-size: var(--text-lg);
        font-weight: 700;
        letter-spacing: -0.01em;
    }
    .x {
        background: none;
        border: none;
        color: var(--color-text-muted);
        font-size: 0.9rem;
        cursor: pointer;
        padding: 0.25rem;
        line-height: 1;
    }
    .x:hover {
        color: var(--color-text);
    }

    .modal-body {
        display: flex;
        flex-direction: column;
        gap: 1.1rem;
        padding: 1.5rem;
        overflow-y: auto;
    }

    .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
    @media (max-width: 540px) {
        .row {
            grid-template-columns: 1fr;
        }
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        font-size: var(--text-xs);
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--color-text-muted);
    }
    .field .opt {
        text-transform: none;
        letter-spacing: normal;
        font-weight: 500;
    }
    .field input,
    .field textarea {
        font-family: inherit;
        font-size: var(--text-base);
        text-transform: none;
        letter-spacing: normal;
        padding: 0.7rem 0.9rem;
        background: var(--color-surface);
        color: var(--color-text);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        transition: border-color var(--duration-fast) var(--ease-default);
    }
    .field input:focus,
    .field textarea:focus {
        border-color: var(--color-text);
        outline: none;
    }
    .field textarea {
        resize: vertical;
        min-height: 96px;
    }

    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin: 0;
        padding: 0;
        border: none;
    }
    .chips legend {
        width: 100%;
        margin-bottom: 0.5rem;
        font-size: var(--text-xs);
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--color-text-muted);
    }
    .chip {
        cursor: pointer;
    }
    .chip input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
    }
    .chip span {
        display: inline-flex;
        align-items: center;
        min-height: 40px;
        padding: 0.45rem 0.85rem;
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        border: 1px solid var(--color-border);
        border-radius: 999px;
        transition:
            border-color var(--duration-fast) var(--ease-default),
            color var(--duration-fast) var(--ease-default),
            background var(--duration-fast) var(--ease-default);
    }
    .chip:hover span {
        border-color: var(--color-border-hover);
        color: var(--color-text);
    }
    .chip:has(input:checked) span {
        background: var(--color-accent);
        border-color: var(--color-accent);
        color: oklch(99% 0.002 260);
    }
    .chip input:focus-visible + span {
        outline: 2px solid var(--color-accent);
        outline-offset: 2px;
    }

    .turnstile {
        min-height: 65px;
    }

    .modal-foot {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--color-border);
    }
    .ghost {
        padding: 0.75rem 1.25rem;
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--color-text-muted);
        background: none;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        cursor: pointer;
    }
    .ghost:hover {
        color: var(--color-text);
        border-color: var(--color-border-hover);
    }
    .submit {
        padding: 0.75rem 1.75rem;
        font-size: var(--text-sm);
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--color-surface);
        background: var(--color-text);
        border: 1px solid var(--color-text);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-default);
    }
    .submit:hover:not(:disabled) {
        background: transparent;
        color: var(--color-text);
    }
    .submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .alert {
        padding: 0.75rem 1rem;
        font-size: var(--text-sm);
        color: oklch(55% 0.18 25);
        border: 1px solid oklch(60% 0.15 25);
        border-radius: var(--radius-sm);
    }

    .hp {
        position: absolute;
        left: -9999px;
        opacity: 0;
        width: 1px;
        height: 1px;
        pointer-events: none;
    }

    .success {
        padding: 2.5rem 1.5rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.6rem;
    }
    .success h3 {
        margin: 0;
        font-size: var(--text-lg);
        font-weight: 700;
    }
    .success p {
        margin: 0;
        max-width: 42ch;
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        line-height: 1.5;
    }
    .success .ghost {
        margin-top: 0.8rem;
    }
</style>
