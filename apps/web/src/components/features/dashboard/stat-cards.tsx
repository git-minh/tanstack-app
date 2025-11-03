import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { CheckCircle2, Circle, ListTodo, TrendingUp } from "lucide-react";

export function StatCards() {
	const { data: stats } = useSuspenseQuery(
		convexQuery(api.dashboard.getStats, {})
	);

	const cards = [
		{
			title: "Total Tasks",
			value: stats.totalTasks,
			icon: ListTodo,
			description: "All tasks in your list",
		},
		{
			title: "Active Tasks",
			value: stats.activeTasks,
			icon: Circle,
			description: "Tasks pending completion",
		},
		{
			title: "Completed Tasks",
			value: stats.completedTasks,
			icon: CheckCircle2,
			description: "Successfully finished",
		},
		{
			title: "Completion Rate",
			value: `${stats.completionRate}%`,
			icon: TrendingUp,
			description: "Overall progress",
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{cards.map((card) => {
				const Icon = card.icon;
				return (
					<Card key={card.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{card.title}
							</CardTitle>
							<Icon className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{card.value}</div>
							<p className="text-xs text-muted-foreground">
								{card.description}
							</p>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
