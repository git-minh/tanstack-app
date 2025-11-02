import { api } from "@tanstack/backend/convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: DashboardRoute,
});

function DashboardRoute() {
	const privateData = useQuery(api.privateData.get);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
				<p className="text-muted-foreground">
					Welcome to your protected dashboard
				</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Private Data</CardTitle>
					<CardDescription>Data from your Convex backend</CardDescription>
				</CardHeader>
				<CardContent>
					<p>{privateData?.message || "Loading..."}</p>
				</CardContent>
			</Card>
		</div>
	);
}
