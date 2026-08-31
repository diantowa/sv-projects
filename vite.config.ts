import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		watch: {
			ignored: [
				'**/src/lib/paraglide/**',
				'**/worker-configuration.d.ts',
				'**/.gsd/**',
				'**/.bg-shell/**',
				'**/.omc/**',
				'**/.pi/**',
				'**/.claude/**',
				'**/.agents/**',
				'**/.artifacts/**',
				'**/.wrangler/**',
				'**/plans/**',
				'**/notes/**',
				'**/outputs/**',
				'**/test-results/**',
				'**/*.sqlite*',
				'**/*.db*'
			]
		}
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide' })
	]
});
