# Colabo Contact Flow Implementation Plan

1. Add pure identity parsing and contact-link builders with Bun tests.
2. Replace the long `/colabo` form with the approved two-field composer.
3. Add an accessible anchored liquid dialog for channel selection and private-note details.
4. Harden the private-note server action and lazy-load Turnstile only for that route.
5. Rebuild the shared D1 `inquiry` table so email is nullable and contact metadata is stored.
6. Synchronize the inquiry declaration and presentation in `sv_manager`.
7. Run Bun 1.4 tests, Svelte checks, and production builds in both projects.
8. Back up D1 metadata, migrate production, deploy manager first, deploy project second, and smoke-test.

