import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export function RecentActivityTable() {
	const { data: activities } = useSuspenseQuery(
		convexQuery(api.dashboard.getRecentActivity, {})
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Activity</CardTitle>
				<CardDescription>
					Your most recent tasks and their status
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Task</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Created</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{activities.length === 0 ? (
							<TableRow>
								<TableCell colSpan={3} className="text-center text-muted-foreground">
									No tasks yet. Create your first task to get started!
								</TableCell>
							</TableRow>
						) : (
							activities.map((activity) => (
								<TableRow key={activity.id}>
									<TableCell className="font-medium">
										{activity.text}
									</TableCell>
									<TableCell>
										<Badge
											variant={
												activity.status === "completed"
													? "default"
													: "secondary"
											}
										>
											{activity.status}
										</Badge>
									</TableCell>
									<TableCell className="text-right">
										{activity.createdAt}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
