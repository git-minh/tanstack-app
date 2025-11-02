import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { SidebarProvider } from "@/components/ui/sidebar";

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
	return (
		<SidebarProvider defaultOpen={true}>
			<DashboardLayout>
				<Outlet />
			</DashboardLayout>
		</SidebarProvider>
	);
}
