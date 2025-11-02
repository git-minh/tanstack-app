import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AuthLayout } from "@/components/layouts/auth-layout";

export const Route = createFileRoute("/_auth")({
	beforeLoad: async ({ context }) => {
		// If user is already authenticated, redirect to dashboard
		if (context.userId) {
			throw redirect({
				to: "/dashboard",
			});
		}
	},
	component: AuthRouteLayout,
});

function AuthRouteLayout() {
	return (
		<AuthLayout>
			<Outlet />
		</AuthLayout>
	);
}
