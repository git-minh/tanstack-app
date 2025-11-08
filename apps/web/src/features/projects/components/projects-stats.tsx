import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Circle, CheckCircle, Pause, Archive } from "lucide-react";

export function ProjectsStats() {
	const { data: stats } = useSuspenseQuery(
		convexQuery(api.projects.getProjectStats, {})
	);

	return (
		<div className="grid gap-4 md:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Total Projects</CardTitle>
					<Circle className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.total}</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Active</CardTitle>
					<Circle className="h-4 w-4 text-green-600" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.active}</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">On Hold</CardTitle>
					<Pause className="h-4 w-4 text-yellow-600" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.onHold}</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Completed</CardTitle>
					<CheckCircle className="h-4 w-4 text-blue-600" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.completed}</div>
				</CardContent>
			</Card>
		</div>
	);
}
