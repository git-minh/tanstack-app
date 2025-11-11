import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(({ mode }) => {
	const isProd = mode === 'production';
	const isCI = process.env.CI === 'true';

	return {
		plugins: [
			cloudflare({ viteEnvironment: { name: 'ssr' } }),
			tsconfigPaths(),
			tailwindcss(),
			tanstackStart(),
			viteReact(),
			// Upload source maps to Sentry (production only)
			isProd && process.env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
				org: process.env.SENTRY_ORG,
				project: process.env.SENTRY_PROJECT,
				authToken: process.env.SENTRY_AUTH_TOKEN,
			}),
		].filter(Boolean),
		build: {
			// Disable source maps in CI to save memory
			sourcemap: isCI ? false : (isProd ? 'hidden' : true),
			// Increase chunk size warning limit (we're code splitting intentionally)
			chunkSizeWarningLimit: 1000,
			rollupOptions: {
				output: {
					// Manual chunk splitting for better caching
					manualChunks: (id) => {
						// Vendor chunks
						if (id.includes('node_modules')) {
							// Charts library - lazy loaded on dashboard only
							if (id.includes('recharts')) {
								return 'vendor-charts';
							}
							// UI/Icons - used across app
							if (id.includes('lucide-react') || id.includes('@radix-ui')) {
								return 'vendor-ui';
							}
							// Forms/validation - used in multiple features
							if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
								return 'vendor-forms';
							}
							// Convex/data - core functionality
							if (id.includes('convex')) {
								return 'vendor-convex';
							}
							// Auth - critical path
							if (id.includes('better-auth') || id.includes('autumn')) {
								return 'vendor-auth';
							}
							// Everything else
							return 'vendor';
						}
					},
				},
			},
			// Use esbuild in CI (faster, less memory), terser locally for better compression
			minify: isCI ? 'esbuild' : 'terser',
			// Terser options (only used in local prod builds)
			terserOptions: !isCI ? {
				maxWorkers: 2, // Limit workers to reduce memory usage
				compress: {
					// Remove console logs in production
					drop_console: isProd,
					// Remove debugger statements
					drop_debugger: isProd,
				},
			} : undefined,
		},
		// Optimize dependencies
		optimizeDeps: {
			include: [
				'react',
				'react-dom',
				'@tanstack/react-router',
				'@tanstack/react-query',
			],
			// Force bundling of commonly used modules
			force: mode === 'development',
		},
	};
});
