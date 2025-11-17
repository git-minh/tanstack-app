import { useState, useRef, useEffect, Suspense, lazy } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { Sparkles, ArrowRight, Activity } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ErrorBoundary } from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import type {
	GenerateProjectFormValues,
	GenerateResult,
} from "@/features/ai-generation";

// Lazy load dialogs
const GenerateDialog = lazy(() =>
	import("@/features/ai-generation").then(m => ({ default: m.GenerateDialog }))
);

const AnalyzeWebsiteDialog = lazy(() =>
	import("@/features/design-references/components/analyze-website-dialog").then(m => ({ default: m.AnalyzeWebsiteDialog }))
);

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: DashboardRoute,
});

function DashboardRoute() {
	const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
	const [analyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);
	const generateProject = useAction(api.ai.generateProject);
	const navigate = useNavigate();
	const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

			if (result.summary.projectId) {
				if (navigationTimeoutRef.current) {
					clearTimeout(navigationTimeoutRef.current);
				}
				navigationTimeoutRef.current = setTimeout(() => {
					navigate({ to: "/projects" });
				}, 1000);
			}

			return {
				projectsCount: result.summary.projectId ? 1 : 0,
				tasksCount: result.summary.tasksCreated || 0,
				contactsCount: result.summary.contactsCreated || 0,
			};
		} catch (error) {
			throw error;
		}
	};

	return (
		<ErrorBoundary>
			<AuthGuard>
				<DashboardContent
					onGenerateClick={() => setGenerateDialogOpen(true)}
					onAnalyzeClick={() => setAnalyzeDialogOpen(true)}
				/>
			</AuthGuard>

			<Suspense fallback={null}>
				<GenerateDialog
					open={generateDialogOpen}
					onOpenChange={setGenerateDialogOpen}
					onSubmit={handleGenerate}
				/>
			</Suspense>

			<Suspense fallback={null}>
				<AnalyzeWebsiteDialog
					open={analyzeDialogOpen}
					onOpenChange={setAnalyzeDialogOpen}
				/>
			</Suspense>
		</ErrorBoundary>
	);
}

interface DashboardContentProps {
	onGenerateClick: () => void;
	onAnalyzeClick: () => void;
}

function DashboardContent({ onGenerateClick, onAnalyzeClick }: DashboardContentProps) {
	const { data } = useSuspenseQuery(
		convexQuery(api.dashboard.getDashboardData, {})
	);

	const activeTasksPercentage = data.stats.totalTasks > 0
		? Math.round((data.stats.activeTasks / data.stats.totalTasks) * 100)
		: 0;

	// Get most recent activities (limit to 5)
	const recentActivities = data.recentActivity.slice(0, 5);

	return (
		<div className="min-h-[calc(100vh-8rem)] flex flex-col">
			{/* Hero Stats - Ultra Minimal */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-foreground border-y-2 border-foreground">
				{/* Primary Stat - Active Tasks */}
				<div className="bg-background p-12 md:p-16 border-r-0 md:border-r-2 border-foreground">
					<div className="space-y-4">
						<div className="text-[clamp(4rem,15vw,12rem)] font-light leading-none tabular-nums tracking-tighter">
							{data.stats.activeTasks}
						</div>
						<div className="space-y-1">
							<div className="text-sm uppercase tracking-widest font-medium">
								Active Tasks
							</div>
							<div className="text-xs text-muted-foreground">
								{activeTasksPercentage}% of total workload
							</div>
						</div>
					</div>
				</div>

				{/* Secondary Stat - Completed */}
				<div className="bg-background p-12 md:p-16 border-r-0 md:border-r-2 border-foreground">
					<div className="space-y-4">
						<div className="text-[clamp(4rem,15vw,12rem)] font-light leading-none tabular-nums tracking-tighter">
							{data.stats.completedTasks}
						</div>
						<div className="space-y-1">
							<div className="text-sm uppercase tracking-widest font-medium">
								Completed
							</div>
							<div className="text-xs text-muted-foreground">
								{data.stats.completionRate}% completion rate
							</div>
						</div>
					</div>
				</div>

				{/* Tertiary Stat - Total */}
				<div className="bg-background p-12 md:p-16">
					<div className="space-y-4">
						<div className="text-[clamp(4rem,15vw,12rem)] font-light leading-none tabular-nums tracking-tighter">
							{data.stats.totalTasks}
						</div>
						<div className="space-y-1">
							<div className="text-sm uppercase tracking-widest font-medium">
								Total Tasks
							</div>
							<div className="text-xs text-muted-foreground">
								All items tracked
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Actions Bar - Minimal */}
			<div className="border-b-2 border-foreground bg-background">
				<div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div className="space-y-1">
						<h2 className="text-lg font-medium">Quick Actions</h2>
						<p className="text-xs text-muted-foreground">
							Generate projects or analyze designs
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Button
							onClick={onAnalyzeClick}
							variant="outline"
							size="sm"
							className="rounded-none font-light"
						>
							Analyze
						</Button>
						<Button
							onClick={onGenerateClick}
							size="sm"
							className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-light group"
						>
							<Sparkles className="mr-2 h-3.5 w-3.5" />
							Generate
							<ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
						</Button>
					</div>
				</div>
			</div>

			{/* Recent Activity - Text Only */}
			<div className="flex-1 p-6 md:p-12">
				<div className="max-w-4xl">
					<div className="mb-8 flex items-baseline gap-3">
						<Activity className="h-5 w-5 mt-1" strokeWidth={1.5} />
						<h2 className="text-2xl font-light tracking-tight">
							Recent Activity
						</h2>
					</div>

					{recentActivities.length === 0 ? (
						<div className="py-20 text-center">
							<p className="text-muted-foreground text-sm">
								No recent activity. Start by creating a task or project.
							</p>
						</div>
					) : (
						<div className="space-y-px">
							{recentActivities.map((activity, index) => (
								<div
									key={activity._id}
									className="group py-4 border-b border-border/50 last:border-0 hover:pl-4 transition-all duration-200"
								>
									<div className="flex items-start justify-between gap-4">
										<div className="flex-1 space-y-1">
											<div className="flex items-center gap-3">
												<span className="text-xs font-medium uppercase tracking-wider text-muted-foreground tabular-nums">
													{new Date(activity._creationTime).toLocaleDateString('en-US', {
														month: 'short',
														day: 'numeric',
													})}
												</span>
												<span className="h-1 w-1 rounded-full bg-muted-foreground" />
												<span className="text-xs uppercase tracking-wider text-muted-foreground">
													{activity.type}
												</span>
											</div>
											<p className="text-sm leading-relaxed">
												{activity.description}
											</p>
											{activity.taskTitle && (
												<Link
													to={activity.taskId ? `/tasks?taskId=${activity.taskId}` : '/tasks'}
													className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
												>
													{activity.taskTitle}
													<ArrowRight className="h-3 w-3" />
												</Link>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}

					{recentActivities.length > 0 && (
						<div className="mt-8 pt-6 border-t border-border/50">
							<Link
								to="/tasks"
								className="text-xs uppercase tracking-widest font-medium hover:text-muted-foreground transition-colors inline-flex items-center gap-2"
							>
								View All Tasks
								<ArrowRight className="h-3.5 w-3.5" />
							</Link>
						</div>
					)}
				</div>
			</div>

			{/* Inline Styles for Staggered Animations */}
			<style>{`
				@keyframes slideIn {
					from {
						opacity: 0;
						transform: translateX(-10px);
					}
					to {
						opacity: 1;
						transform: translateX(0);
					}
				}

				.group:hover {
					animation: slideIn 0.2s ease-out;
				}
			`}</style>
		</div>
	);
}
