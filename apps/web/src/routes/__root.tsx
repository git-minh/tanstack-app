import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { AutumnProvider } from "autumn-js/react";

import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
	useRouterState,
	useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import appCss from "../index.css?url";
import type { QueryClient } from "@tanstack/react-query";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import type { ConvexReactClient } from "convex/react";
import Loader from "@/components/loader";

import { createServerFn } from "@tanstack/react-start";
import { getRequest, getCookie } from "@tanstack/react-start/server";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import {
	fetchSession,
	getCookieName,
} from "@convex-dev/better-auth/react-start";
import { authClient } from "@/lib/auth-client";
import { createAuth } from "@tanstack/backend/convex/auth";
import { api } from "@tanstack/backend/convex/_generated/api";

const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
	const { session } = await fetchSession(getRequest());
	const sessionCookieName = getCookieName(createAuth);
	const token = getCookie(sessionCookieName);
	return {
		userId: session?.user.id,
		token,
	};
});

export interface RouterAppContext {
	queryClient: QueryClient;
	convexClient: ConvexReactClient;
	convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Streamline",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			// Theme-aware favicons
			{
				rel: "icon",
				type: "image/png",
				href: "/favicon-light.png",
				media: "(prefers-color-scheme: light)",
			},
			{
				rel: "icon",
				type: "image/png",
				href: "/favicon-dark.png",
				media: "(prefers-color-scheme: dark)",
			},
			// Fallback for browsers without media query support
			{
				rel: "icon",
				type: "image/png",
				href: "/favicon-light.png",
			},
		],
	}),

	component: RootDocument,
	beforeLoad: async (ctx) => {
		const { userId, token } = await fetchAuth();
		if (token) {
			// Set auth token for server-side queries (SSR) only
			// ConvexBetterAuthProvider handles client-side auth automatically
			ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
		}
		return { userId, token };
	},
});

function RootDocument() {
	const isFetching = useRouterState({ select: (s) => s.isLoading });
	const context = useRouteContext({ from: Route.id });
	return (
		<ConvexBetterAuthProvider
			client={context.convexClient}
			authClient={authClient}
		>
			<AutumnProvider convex={context.convexClient} convexApi={(api as any).autumn}>
				<html lang="en" suppressHydrationWarning>
					<head>
						<HeadContent />
					</head>
					<body>
						<ThemeProvider
							attribute="class"
							defaultTheme="light"
							enableSystem
							disableTransitionOnChange
						>
							{/* Subtle loading indicator that doesn't cause layout shift */}
							{isFetching && (
								<div className="fixed top-0 left-0 right-0 h-1 z-50 bg-gradient-to-r from-primary/50 via-primary to-primary/50 animate-pulse" />
							)}
							<Outlet />
							<Toaster richColors />
							<TanStackRouterDevtools position="bottom-left" />
						</ThemeProvider>
						<Scripts />
					</body>
				</html>
			</AutumnProvider>
		</ConvexBetterAuthProvider>
	);
}
