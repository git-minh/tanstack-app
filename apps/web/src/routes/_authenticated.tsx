import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import Loader from "@/components/loader";

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
	pendingComponent: Loader,
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	return (
		<DashboardLayout>
			<Outlet />
		</DashboardLayout>
	);
}
