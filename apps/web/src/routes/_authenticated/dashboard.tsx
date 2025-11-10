import { useState, useRef, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import { Sparkles } from "lucide-react";
import { StatCards } from "@/components/features/dashboard/stat-cards";
import { ActivityChart } from "@/components/features/dashboard/activity-chart";
import { RecentActivityTable } from "@/components/features/dashboard/recent-activity-table";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ErrorBoundary } from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import {
	GenerateDialog,
	type GenerateProjectFormValues,
	type GenerateResult,
} from "@/features/ai-generation";

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: DashboardRoute,
});

function DashboardRoute() {
	const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
	const generateProject = useAction(api.ai.generateProject);
	const navigate = useNavigate();
	const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (navigationTimeoutRef.current) {
				clearTimeout(navigationTimeoutRef.current);
			}
		};
	}, []);

	const handleGenerate = async (
		values: GenerateProjectFormValues
	): Promise<GenerateResult> => {
		try {
			const result = await generateProject({ prompt: values.prompt });

			// Navigate to projects page after successful creation
			if (result.summary.projectId) {
				// Clear any existing timeout
				if (navigationTimeoutRef.current) {
					clearTimeout(navigationTimeoutRef.current);
				}
				// Use setTimeout to allow success toast to display before navigation
				navigationTimeoutRef.current = setTimeout(() => {
					navigate({ to: "/projects" });
				}, 1000);
			}

			// Return counts for success toast
			// projectsCount is derived from whether a project was created (projectId exists)
			return {
				projectsCount: result.summary.projectId ? 1 : 0,
				tasksCount: result.summary.tasksCreated || 0,
				contactsCount: result.summary.contactsCreated || 0,
			};
		} catch (error) {
			// Re-throw error for dialog error handling
			throw error;
		}
	};

	return (
		<ErrorBoundary>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
						<p className="text-muted-foreground">
							Track your tasks and productivity at a glance
						</p>
					</div>
					<Button onClick={() => setGenerateDialogOpen(true)}>
						<Sparkles className="mr-2 h-4 w-4" />
						Generate Project with AI
					</Button>
				</div>

				{/* AuthGuard prevents queries from executing before auth is ready */}
				<AuthGuard>
					{/* Stat Cards */}
					<StatCards />

					{/* Activity Chart */}
					<ActivityChart />

					{/* Recent Activity Table */}
					<RecentActivityTable />
				</AuthGuard>
			</div>

			<GenerateDialog
				open={generateDialogOpen}
				onOpenChange={setGenerateDialogOpen}
				onSubmit={handleGenerate}
			/>
		</ErrorBoundary>
	);
}
