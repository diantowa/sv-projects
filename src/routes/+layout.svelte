<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onNavigate, afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	// Type-only import — Lenis is loaded lazily in onMount so the server bundle
	// never statically imports it (a bare `import "lenis"` in SSR is dropped by
	// esbuild because lenis declares sideEffects:false, which triggers a
	// wrangler ignored-bare-import warning on deploy).
	import type Lenis from 'lenis';
	import { setLenis } from '$lib/utils/scroll';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import '$lib/styles/global.css';
	import favicon from '$lib/assets/favicon.svg';
	import Preloader from '$lib/components/Preloader.svelte';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	const SITE_URL = 'https://kakyu.dev';
	const SITE_NAME = 'Wahyudi Chrisdianto';
	const SITE_TITLE = 'Wahyudi Chrisdianto — Full Stack Developer';
	const SITE_DESCRIPTION =
		'Wahyudi Chrisdianto (Kaiyu) is a Full Stack Software Engineer and UI/UX Designer based in Banten, Indonesia. Specializing in Svelte, React, Node.js, TypeScript, cloud-native web applications, and product-first development.';
	const OG_IMAGE = `${SITE_URL}/og-image.png`;

	let { children } = $props();

	// ── IO-gate `.animate-in*` entrances (hero + page headers). Previously
	//    these fired on mount, so every entrance played at once even before it
	//    was on screen. Now each is revealed only when it enters the viewport
	//    (or immediately if already above the fold). Mirrors the `reveal`
	//    action's intersect + above-fold fallback.
	let animateInsObs: IntersectionObserver | null = null;
	const seenAnimateIns = new WeakSet<HTMLElement>();

	function revealAnimateIns() {
		if (!animateInsObs) {
			animateInsObs = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) {
							entry.target.classList.add('running');
							animateInsObs?.unobserve(entry.target);
						}
					}
				},
				{ threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
			);
		}

		for (const el of document.querySelectorAll<HTMLElement>('.animate-in, .animate-in-2, .animate-in-3')) {
			if (seenAnimateIns.has(el)) continue;
			seenAnimateIns.add(el);
			// Above the fold, or scrolled-past on a restored page: reveal now so
			// it's never left hidden. Otherwise wait for the observer.
			if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
				el.classList.add('running');
			} else {
				animateInsObs.observe(el);
			}
		}
	}

	// Smooth scrolling — Lenis (lightweight, transform-based, GPU-friendly).
	// Manual rAF loop (more predictable than autoRaf across environments);
	// respectReducedMotion disables smoothing for reduced-motion users.
	let lenis: Lenis | null = null;
	let rafId = 0;

	onMount(() => {
		revealAnimateIns();
		let unmounted = false;

		(async () => {
			const { default: Lenis } = await import('lenis');
			if (unmounted) return;
			lenis = new Lenis({
				respectReducedMotion: true,
				anchors: true,
			});
			setLenis(lenis);

			const raf = (time: number) => {
				if (unmounted) return;
				lenis?.raf(time);
				rafId = requestAnimationFrame(raf);
			};
			rafId = requestAnimationFrame(raf);
		})();

		return () => {
			unmounted = true;
			cancelAnimationFrame(rafId);
			lenis?.destroy();
			lenis = null;
			setLenis(null);
		};
	});

	// Re-run on every client-side navigation so newly-rendered `.animate-in*`
	// elements are observed too (deduped via seenAnimateIns).
	afterNavigate(() => revealAnimateIns());

	// Cross-fade client-side navigations via the View Transitions API.
	// Skipped for reduced-motion users and while the first-load Preloader is
	// still covering the viewport (its slide-up would be cross-faded away).
	onNavigate((navigation) => {
		if (prefersReducedMotion.current) return;
		if (document.querySelector('.preloader:not(.done)')) return;
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />

	<!-- Primary SEO -->
	<title>{SITE_TITLE}</title>
	<meta name="description" content={SITE_DESCRIPTION} />
	<meta name="author" content={SITE_NAME} />
	<meta name="keywords" content="Wahyudi Chrisdianto, Kaiyu, full stack developer, UI UX designer, Svelte developer, SvelteKit, React, Node.js, TypeScript, cloud-native web applications, software engineer Indonesia, Banten developer, frontend engineer, product-first development, Svelte 5, TailwindCSS, PostgreSQL, Cloudflare Workers" />
	<meta name="robots" content="index, follow" />
	<meta name="googlebot" content="index, follow" />
	<link rel="canonical" href={SITE_URL} />

	<!-- Open Graph / Facebook -->
	<meta property="og:site_name" content="Wahyudi Chrisdianto" />
	<meta property="og:title" content={SITE_TITLE} />
	<meta property="og:description" content={SITE_DESCRIPTION} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:image" content={OG_IMAGE} />
	<meta property="og:image:alt" content="Wahyudi Chrisdianto — Full Stack Developer" />
	<meta property="og:locale" content="en_US" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={SITE_TITLE} />
	<meta name="twitter:description" content={SITE_DESCRIPTION} />
	<meta name="twitter:image" content={OG_IMAGE} />
	<meta name="twitter:image:alt" content="Wahyudi Chrisdianto — Full Stack Developer" />

	<!-- JSON-LD Structured Data -->
	<script type="application/ld+json">
		{{
			"@context": "https://schema.org",
			"@type": "Person",
			"name": "Wahyudi Chrisdianto",
			"alternateName": "Kaiyu",
			"url": SITE_URL,
			"jobTitle": "Full Stack Software Engineer",
			"description": SITE_DESCRIPTION,
			"address": {
				"@type": "Place",
				"addressLocality": "Banten",
				"addressCountry": "ID"
			},
			"knowsAbout": [
				"Svelte",
				"SvelteKit",
				"React",
				"TypeScript",
				"JavaScript",
				"Node.js",
				"TailwindCSS",
				"PostgreSQL",
				"Cloudflare Workers",
				"UI/UX Design",
				"Full Stack Development",
				"Product Development"
			],
			"sameAs": [
				"https://www.linkedin.com/in/wahyudichrisdianto",
				"https://github.com/wahyudichrisdianto",
				"https://portoshare.com"
			]
		}}
	</script>

	<!-- View Transitions — default cross-fade; themed via global.css -->
	<style>
		::view-transition-old(root),
		::view-transition-new(root) {
			animation-duration: 280ms;
			animation-timing-function: var(--ease-motion);
		}
	</style>

	<!-- WebSite Schema (for Google Sitelinks Search Box) -->
	<script type="application/ld+json">
		{{
			"@context": "https://schema.org",
			"@type": "WebSite",
			"name": "Wahyudi Chrisdianto",
			"url": SITE_URL,
			"description": "Personal portfolio of Wahyudi Chrisdianto — Full Stack Developer"
		}}
	</script>
</svelte:head>

<Preloader />
<Header />
<main>
	{@render children()}
</main>
<Footer />

<div style="display:none">
	{#each locales as locale (locale)}
		<a
			href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}
		>{locale}</a>
	{/each}
</div>
