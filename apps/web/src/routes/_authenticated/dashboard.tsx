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

	return (
		<div className="min-h-[calc(100vh-8rem)]">
			{/* Hero Metrics Grid - Bloomberg Terminal Aesthetic */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-foreground border-y-2 border-foreground dashboard-stagger">
				{/* Tasks */}
				<div className="bg-background p-8 lg:p-12 border-r-2 border-foreground" style={{ animationDelay: '0ms' }}>
					<div className="space-y-3">
						<div className="text-[clamp(3rem,12vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
							{data.tasks.total}
						</div>
						<div className="text-[7px] uppercase tracking-[0.2em] font-medium opacity-60">
							TASKS
						</div>
						<div className="flex gap-2 flex-wrap text-[10px] uppercase tracking-wider">
							<span className="tabular-nums">{data.tasks.todo} TODO</span>
							<span className="opacity-30">·</span>
							<span className="tabular-nums">{data.tasks.inProgress} ACTIVE</span>
							<span className="opacity-30">·</span>
							<span className="tabular-nums">{data.tasks.done} DONE</span>
						</div>
					</div>
				</div>

				{/* Projects */}
				<div className="bg-background p-8 lg:p-12 border-r-0 lg:border-r-2 border-foreground" style={{ animationDelay: '100ms' }}>
					<div className="space-y-3">
						<div className="text-[clamp(3rem,12vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
							{data.projects.total}
						</div>
						<div className="text-[7px] uppercase tracking-[0.2em] font-medium opacity-60">
							PROJECTS
						</div>
						<div className="flex gap-2 flex-wrap text-[10px] uppercase tracking-wider">
							<span className="tabular-nums">{data.projects.planning} PLAN</span>
							<span className="opacity-30">·</span>
							<span className="tabular-nums">{data.projects.active} ACTIVE</span>
							<span className="opacity-30">·</span>
							<span className="tabular-nums">{data.projects.completed} DONE</span>
						</div>
					</div>
				</div>

				{/* Contacts */}
				<div className="bg-background p-8 lg:p-12 border-r-2 border-foreground" style={{ animationDelay: '200ms' }}>
					<div className="space-y-3">
						<div className="text-[clamp(3rem,12vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
							{data.contacts.total}
						</div>
						<div className="text-[7px] uppercase tracking-[0.2em] font-medium opacity-60">
							CONTACTS
						</div>
						<div className="flex gap-2 flex-wrap text-[10px] uppercase tracking-wider">
							<span className="tabular-nums">{data.contacts.byCategory.client} CLIENT</span>
							<span className="opacity-30">·</span>
							<span className="tabular-nums">{data.contacts.byCategory.partner} PARTNER</span>
							<span className="opacity-30">·</span>
							<span className="tabular-nums">{data.contacts.byCategory.vendor} VENDOR</span>
						</div>
					</div>
				</div>

				{/* Todos */}
				<div className="bg-background p-8 lg:p-12" style={{ animationDelay: '300ms' }}>
					<div className="space-y-3">
						<div className="text-[clamp(3rem,12vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
							{data.todos.total}
						</div>
						<div className="text-[7px] uppercase tracking-[0.2em] font-medium opacity-60">
							TODOS
						</div>
						<div className="flex gap-2 flex-wrap text-[10px] uppercase tracking-wider">
							<span className="tabular-nums">{data.todos.active} ACTIVE</span>
							<span className="opacity-30">·</span>
							<span className="tabular-nums">{data.todos.completed} DONE</span>
						</div>
					</div>
				</div>
			</div>

			{/* Actions Bar */}
			<div className="border-b-2 border-foreground bg-background">
				<div className="px-6 py-4 flex items-center justify-between gap-4">
					<div className="text-[7px] uppercase tracking-[0.25em] font-medium opacity-40">
						QUICK ACTIONS
					</div>
					<div className="flex items-center gap-2">
						<Button
							onClick={onAnalyzeClick}
							variant="outline"
							size="sm"
							className="rounded-none text-[10px] uppercase tracking-wider h-8"
						>
							Analyze
						</Button>
						<Button
							onClick={onGenerateClick}
							size="sm"
							className="rounded-none bg-foreground text-background hover:bg-foreground/90 text-[10px] uppercase tracking-wider h-8 group"
						>
							<Sparkles className="mr-1.5 h-3 w-3" />
							Generate
							<ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
						</Button>
					</div>
				</div>
			</div>

			{/* Recent Activity - Dense Table */}
			<div className="p-6 lg:p-12">
				<div className="mb-6 flex items-baseline gap-3">
					<Activity className="h-4 w-4 mt-0.5 opacity-40" strokeWidth={1.5} />
					<h2 className="text-[7px] uppercase tracking-[0.25em] font-medium opacity-60">
						RECENT ACTIVITY
					</h2>
				</div>

				{data.recentActivity.length === 0 ? (
					<div className="py-20 text-center border-2 border-dashed border-foreground/10">
						<p className="text-[10px] uppercase tracking-wider opacity-40">
							No activity yet
						</p>
					</div>
				) : (
					<div className="border-2 border-foreground overflow-hidden">
						{/* Table Header */}
						<div className="grid grid-cols-[80px_1fr_100px_120px] gap-4 px-4 py-2 bg-foreground text-background border-b-2 border-foreground">
							<div className="text-[8px] uppercase tracking-[0.2em] font-medium">TYPE</div>
							<div className="text-[8px] uppercase tracking-[0.2em] font-medium">TITLE</div>
							<div className="text-[8px] uppercase tracking-[0.2em] font-medium">STATUS</div>
							<div className="text-[8px] uppercase tracking-[0.2em] font-medium text-right">DATE</div>
						</div>

						{/* Table Rows */}
						<div className="divide-y divide-foreground/10">
							{data.recentActivity.map((item, index) => (
								<Link
									key={item._id}
									to={
										item.type === 'task'
											? '/tasks'
											: item.type === 'project'
											? '/projects'
											: item.type === 'contact'
											? '/contacts'
											: '/dashboard'
									}
									className="grid grid-cols-[80px_1fr_100px_120px] gap-4 px-4 py-3 hover:bg-foreground/5 transition-colors activity-row"
									style={{ animationDelay: `${index * 30}ms` }}
								>
									<div className="text-[10px] uppercase tracking-wider font-medium tabular-nums">
										{item.type}
										{item.displayId && (
											<span className="opacity-40 ml-2">{item.displayId.split('-')[0]}</span>
										)}
									</div>
									<div className="text-sm truncate font-light">
										{item.title}
									</div>
									<div className="text-[9px] uppercase tracking-wider opacity-60">
										{item.status}
									</div>
									<div className="text-[10px] tabular-nums text-right opacity-60">
										{new Date(item._creationTime).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric',
										})}
									</div>
								</Link>
							))}
						</div>
					</div>
				)}

				{data.recentActivity.length > 0 && (
					<div className="mt-6 flex justify-end">
						<Link
							to="/tasks"
							className="text-[9px] uppercase tracking-[0.2em] font-medium hover:opacity-60 transition-opacity inline-flex items-center gap-2"
						>
							VIEW ALL
							<ArrowRight className="h-3 w-3" />
						</Link>
					</div>
				)}
			</div>

			{/* Animations */}
			<style>{`
				@keyframes dashboardFadeIn {
					from {
						opacity: 0;
						transform: translateY(20px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				@keyframes activitySlide {
					from {
						opacity: 0;
						transform: translateX(-10px);
					}
					to {
						opacity: 1;
						transform: translateX(0);
					}
				}

				.dashboard-stagger > div {
					animation: dashboardFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
					opacity: 0;
				}

				.activity-row {
					animation: activitySlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
					opacity: 0;
				}
			`}</style>
		</div>
	);
}
