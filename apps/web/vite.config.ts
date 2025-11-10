import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
	plugins: [
		cloudflare({ viteEnvironment: { name: 'ssr' } }),
		tsconfigPaths(),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		// Upload source maps to Sentry
		process.env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
			org: process.env.SENTRY_ORG,
			project: process.env.SENTRY_PROJECT,
			authToken: process.env.SENTRY_AUTH_TOKEN,
		}),
	].filter(Boolean),
	build: {
		sourcemap: true, // Enable source maps for better error tracking
	},
});
