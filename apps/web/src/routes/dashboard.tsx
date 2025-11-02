import UserMenu from "@/components/user-menu";
import { api } from "@tanstack/backend/convex/_generated/api";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: async ({ context }) => {
		if (!context.userId) {
			throw redirect({
				to: "/login",
				search: {
					redirect: "/dashboard",
				},
			});
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const privateData = useQuery(api.privateData.get);

	return (
		<div>
			<h1>Dashboard</h1>
			<p>privateData: {privateData?.message}</p>
			<UserMenu />
		</div>
	);
}
