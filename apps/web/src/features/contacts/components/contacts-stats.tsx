import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, Archive, Briefcase } from "lucide-react";

export function ContactsStats() {
	const { data: stats } = useSuspenseQuery(
		convexQuery(api.contacts.getContactStats, {})
	);

	const statCards = [
		{
			title: "Total Contacts",
			value: stats.total,
			icon: Users,
			description: "All contacts",
		},
		{
			title: "Active",
			value: stats.byStatus.active,
			icon: CheckCircle,
			description: "Active contacts",
		},
		{
			title: "Archived",
			value: stats.byStatus.archived,
			icon: Archive,
			description: "Archived contacts",
		},
		{
			title: "Clients",
			value: stats.byCategory.client,
			icon: Briefcase,
			description: "Client contacts",
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{statCards.map((stat) => (
				<Card key={stat.title}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
						<stat.icon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stat.value}</div>
						<p className="text-xs text-muted-foreground">{stat.description}</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
