import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	CheckCircle,
	Circle,
	Timer,
	AlertTriangle,
} from "lucide-react";

export function TasksStats() {
	const { data: stats } = useSuspenseQuery(
		convexQuery(api.tasks.getTaskStats, {})
	);

	const statCards = [
		{
			title: "Total Tasks",
			value: stats.total,
			icon: Circle,
			description: "All tasks",
		},
		{
			title: "In Progress",
			value: stats.byStatus["in progress"],
			icon: Timer,
			description: "Active tasks",
		},
		{
			title: "Completed",
			value: stats.byStatus.done,
			icon: CheckCircle,
			description: "Done tasks",
		},
		{
			title: "Overdue",
			value: stats.overdue,
			icon: AlertTriangle,
			description: "Past due date",
			variant: stats.overdue > 0 ? "destructive" : "default",
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{statCards.map((stat) => (
				<Card key={stat.title}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
						<stat.icon
							className={`h-4 w-4 ${
								stat.variant === "destructive"
									? "text-destructive"
									: "text-muted-foreground"
							}`}
						/>
					</CardHeader>
					<CardContent>
						<div
							className={`text-2xl font-bold ${
								stat.variant === "destructive" ? "text-destructive" : ""
							}`}
						>
							{stat.value}
						</div>
						<p className="text-xs text-muted-foreground">{stat.description}</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
