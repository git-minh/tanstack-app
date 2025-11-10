import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexReactClient } from "convex/react";
import { routeTree } from "./routeTree.gen";
import Loader from "./components/loader";
import { NotFound } from "./components/error-pages/not-found";
import * as Sentry from "@sentry/react";
import "./index.css";

export function getRouter() {
	const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
	if (!CONVEX_URL) {
		console.error("missing envar VITE_CONVEX_URL");
	}

	// Initialize Sentry for error monitoring and performance tracking
	// Only run on client-side to avoid SSR issues
	const SENTRY_DSN = (import.meta as any).env.VITE_SENTRY_DSN;
	if (SENTRY_DSN && typeof window !== 'undefined') {
		Sentry.init({
			dsn: SENTRY_DSN,
			integrations: [
				Sentry.browserTracingIntegration(),
				Sentry.replayIntegration(),
			],
			// Performance Monitoring
			tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
			// Session Replay
			replaysSessionSampleRate: 0.1, // 10% of sessions
			replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
		});
	}

	const convex = new ConvexReactClient(CONVEX_URL, {
		unsavedChangesWarning: false,
		// Pause queries until user is authenticated to prevent "Unauthorized" errors
		expectAuth: true,
	});

	const convexQueryClient = new ConvexQueryClient(convex);

	const queryClient: QueryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn(),
			},
		},
	});
	convexQueryClient.connect(queryClient);

	const router = routerWithQueryClient(
		createTanStackRouter({
			routeTree,
			defaultPreload: "intent",
			defaultPendingComponent: () => <Loader />,
			defaultNotFoundComponent: NotFound,
			context: { queryClient, convexClient: convex, convexQueryClient },
			// ConvexBetterAuthProvider in __root.tsx handles both Convex and auth
			// No need for ConvexProvider wrapper here
		}),
		queryClient,
	);
	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
