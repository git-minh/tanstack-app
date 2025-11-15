import { Suspense } from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { LayoutProvider } from "@/context/layout-provider";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { SkipToMain } from "@/components/skip-to-main";
import { getCookie } from "@/lib/cookies";
import { cn } from "@/lib/utils";
import { useCreditWarnings } from "@/hooks/use-credit-warnings";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ context, location }) => {
		// Check if user is authenticated
		if (!context.userId) {
			// Redirect to login with the current path for redirect after login
			throw redirect({
				to: "/login",
				search: {
					redirect: location.pathname,
				},
			});
		}
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	const defaultOpen = getCookie("sidebar_state") !== "false";

	return (
		<LayoutProvider>
			<SidebarProvider defaultOpen={defaultOpen}>
				<SkipToMain />
				<AppSidebar />
				<SidebarInset
					className={cn(
						// Set content container, so we can use container queries
						"@container/content",

						// If layout is fixed, set the height
						// to 100svh to prevent overflow
						"has-[[data-layout=fixed]]:h-svh",

						// If layout is fixed and sidebar is inset,
						// set the height to 100svh - spacing (total margins) to prevent overflow
						"peer-data-[variant=inset]:has-[[data-layout=fixed]]:h-[calc(100svh-(var(--spacing)*4))]"
					)}
				>
					<DashboardLayout>
						{/* Monitor credit balance and show warnings */}
						<Suspense fallback={null}>
							<CreditWarningsMonitor />
						</Suspense>
						<Outlet />
					</DashboardLayout>
				</SidebarInset>
			</SidebarProvider>
		</LayoutProvider>
	);
}

/**
 * Component that monitors credit balance and shows toast warnings
 */
function CreditWarningsMonitor() {
	useCreditWarnings();
	return null;
}
