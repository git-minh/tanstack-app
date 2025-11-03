import { createFileRoute } from "@tanstack/react-router";
import { StatCards } from "@/components/features/dashboard/stat-cards";
import { ActivityChart } from "@/components/features/dashboard/activity-chart";
import { RecentActivityTable } from "@/components/features/dashboard/recent-activity-table";

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: DashboardRoute,
});

function DashboardRoute() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
				<p className="text-muted-foreground">
					Track your tasks and productivity at a glance
				</p>
			</div>

			{/* Stat Cards */}
			<StatCards />

			{/* Activity Chart */}
			<ActivityChart />

			{/* Recent Activity Table */}
			<RecentActivityTable />
		</div>
	);
}
