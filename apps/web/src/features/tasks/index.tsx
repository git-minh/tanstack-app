import { Suspense, useState, lazy, useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Circle, CheckCircle2, AlertCircle, ChevronsDown, ChevronsUp } from "lucide-react";
import { toast } from "sonner";
import type { Task } from "./data/schema";
import { cn } from "@/lib/utils";
import { useHotkeys } from "react-hotkeys-hook";

// Lazy load TaskFormDialog
const TaskFormDialog = lazy(() =>
	import("./components/task-form-dialog").then(m => ({ default: m.TaskFormDialog }))
);

export function Tasks() {
	const [filterStatus, setFilterStatus] = useState<string | undefined>();
	const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();

	// Expansion state with localStorage persistence
	const [expandedTasks, setExpandedTasks] = useState<Set<string>>(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem("tasks-expanded-state");
			if (stored) {
				try {
					return new Set(JSON.parse(stored));
				} catch {
					return new Set();
				}
			}
		}
		return new Set();
	});

	// Persist expansion state to localStorage
	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("tasks-expanded-state", JSON.stringify([...expandedTasks]));
		}
	}, [expandedTasks]);

	// Fetch all tasks data
	const { data: tasksPageData } = useSuspenseQuery(
		convexQuery(api.tasks.getTasksPageData, {})
	);
	const { hierarchicalTasks, rootTasks } = tasksPageData;

	// Get active projects for filter
	const { data: projects } = useSuspenseQuery(
		convexQuery(api.projects.getActive, {})
	);

	// Conditional queries
	const projectTasks = useQuery(
		api.tasks.getByProject,
		selectedProjectId ? { projectId: selectedProjectId as Id<"projects"> } : "skip"
	);
	const statusTasks = useQuery(
		api.tasks.getByStatus,
		filterStatus ? { status: filterStatus } : "skip"
	);

	const createTask = useMutation(api.tasks.create);
	const updateTask = useMutation(api.tasks.update);
	const updateTaskStatus = useMutation(api.tasks.updateStatus);
	const deleteTask = useMutation(api.tasks.remove);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingTask, setEditingTask] = useState<Task | undefined>();
	const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
	const [parentTaskId, setParentTaskId] = useState<string | undefined>();

	const handleCreateTask = () => {
		setEditingTask(undefined);
		setParentTaskId(undefined);
		setDialogMode("create");
		setDialogOpen(true);
	};

	const handleEditTask = (task: Task) => {
		setEditingTask(task);
		setParentTaskId(undefined);
		setDialogMode("edit");
		setDialogOpen(true);
	};

	const handleSubmitTask = async (values: {
		title: string;
		status: string;
		priority: string;
		label: string;
		description?: string;
		dueDate?: number;
		parentTaskId?: string;
		projectId?: string;
	}) => {
		try {
			if (dialogMode === "create") {
				await createTask(values);
				toast.success("Task created");
			} else {
				if (!editingTask) return;
				await updateTask({
					id: editingTask._id as any,
					title: values.title,
					status: values.status,
					priority: values.priority,
					label: values.label,
					description: values.description,
					dueDate: values.dueDate,
					projectId: values.projectId,
				});
				toast.success("Task updated");
			}
		} catch (error) {
			toast.error(`Failed to ${dialogMode} task`);
			console.error(error);
		}
	};

	const handleDeleteTask = async (id: string) => {
		try {
			await deleteTask({ id: id as any });
			toast.success("Task deleted");
		} catch (error) {
			toast.error("Failed to delete task");
			console.error(error);
		}
	};

	const handleToggleStatus = async (task: Task) => {
		const newStatus = task.status === "done" ? "todo" : "done";
		try {
			await updateTaskStatus({
				id: task._id as any,
				status: newStatus,
			});
		} catch (error) {
			toast.error("Failed to update task");
			console.error(error);
		}
	};

	// Expand/collapse functions
	const toggleExpand = (taskId: string) => {
		setExpandedTasks(prev => {
			const next = new Set(prev);
			if (next.has(taskId)) {
				next.delete(taskId);
			} else {
				next.add(taskId);
			}
			return next;
		});
	};

	const expandAll = () => {
		const allTaskIds = new Set<string>();
		const collectIds = (tasks: Task[]) => {
			tasks.forEach(task => {
				if (task.subRows && task.subRows.length > 0) {
					allTaskIds.add(task._id);
					collectIds(task.subRows);
				}
			});
		};
		collectIds(hierarchicalTasks || []);
		setExpandedTasks(allTaskIds);
	};

	const collapseAll = () => {
		setExpandedTasks(new Set());
	};

	// Keyboard shortcuts
	useHotkeys('mod+e', (e) => {
		e.preventDefault();
		expandAll();
		toast.success("Expanded all tasks");
	}, [hierarchicalTasks]);

	useHotkeys('mod+shift+e', (e) => {
		e.preventDefault();
		collapseAll();
		toast.success("Collapsed all tasks");
	}, []);

	// Determine which tasks to display
	const displayTasks = selectedProjectId && projectTasks
		? projectTasks
		: filterStatus
		? statusTasks
		: hierarchicalTasks;

	// Check if filters are active
	const isFiltered = !!(filterStatus || selectedProjectId);

	// Calculate global stats (always from all tasks)
	const globalTotalTasks = hierarchicalTasks?.length || 0;
	const globalDoneTasks = hierarchicalTasks?.filter(t => t.status === "done").length || 0;
	const globalInProgressTasks = hierarchicalTasks?.filter(t => t.status === "in progress").length || 0;
	const globalOverdueTasks = hierarchicalTasks?.filter(t => {
		if (!t.dueDate) return false;
		return t.dueDate < Date.now() && t.status !== "done";
	}).length || 0;

	// Calculate filtered stats (from displayTasks when filtered)
	const filteredTotalTasks = displayTasks?.length || 0;
	const filteredDoneTasks = displayTasks?.filter(t => t.status === "done").length || 0;
	const filteredInProgressTasks = displayTasks?.filter(t => t.status === "in progress").length || 0;
	const filteredOverdueTasks = displayTasks?.filter(t => {
		if (!t.dueDate) return false;
		return t.dueDate < Date.now() && t.status !== "done";
	}).length || 0;

	// Display stats: show filtered/total when filtered, otherwise just total
	const totalTasks = isFiltered ? filteredTotalTasks : globalTotalTasks;
	const doneTasks = isFiltered ? filteredDoneTasks : globalDoneTasks;
	const inProgressTasks = isFiltered ? filteredInProgressTasks : globalInProgressTasks;
	const overdueTasks = isFiltered ? filteredOverdueTasks : globalOverdueTasks;

	// Flatten hierarchical tasks for display, respecting expansion state
	const flattenTasks = (tasks: Task[], level = 0, parentExpanded = true): Array<Task & { displayLevel: number; hasChildren: boolean; isExpanded: boolean; childCount: number }> => {
		const result: Array<Task & { displayLevel: number; hasChildren: boolean; isExpanded: boolean; childCount: number }> = [];
		for (const task of tasks) {
			const hasChildren = !!(task.subRows && task.subRows.length > 0);
			const isExpanded = expandedTasks.has(task._id);
			const childCount = task.subRows?.length || 0;

			result.push({
				...task,
				displayLevel: level,
				hasChildren,
				isExpanded,
				childCount
			});

			// Only show children if parent is expanded
			if (hasChildren && isExpanded && parentExpanded) {
				result.push(...flattenTasks(task.subRows!, level + 1, true));
			}
		}
		return result;
	};

	const flatTasks = flattenTasks(displayTasks || []);

	// Active project name
	const activeProject = selectedProjectId
		? projects?.find(p => p._id === selectedProjectId)
		: null;

	return (
		<>
			<div className="min-h-[calc(100vh-8rem)] flex flex-col">
				{/* Hero Stats - Ultra Minimal */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-foreground border-y-2 border-foreground">
					<div className="bg-background p-8 md:p-12 border-r-2 border-foreground">
						<div className="space-y-2">
							<div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
								{isFiltered ? (
									<>
										<span className="font-medium">{totalTasks}</span>
										<span className="text-border">/</span>
										<span className="text-muted-foreground">{globalTotalTasks}</span>
									</>
								) : (
									totalTasks
								)}
							</div>
							<div className="text-xs uppercase tracking-widest font-medium">
								Total
							</div>
						</div>
					</div>

					<div className="bg-background p-8 md:p-12 border-r-0 md:border-r-2 border-foreground">
						<div className="space-y-2">
							<div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
								{isFiltered ? (
									<>
										<span className="font-medium">{inProgressTasks}</span>
										<span className="text-border">/</span>
										<span className="text-muted-foreground">{globalInProgressTasks}</span>
									</>
								) : (
									inProgressTasks
								)}
							</div>
							<div className="text-xs uppercase tracking-widest font-medium">
								Active
							</div>
						</div>
					</div>

					<div className="bg-background p-8 md:p-12 border-r-2 border-foreground">
						<div className="space-y-2">
							<div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
								{isFiltered ? (
									<>
										<span className="font-medium">{doneTasks}</span>
										<span className="text-border">/</span>
										<span className="text-muted-foreground">{globalDoneTasks}</span>
									</>
								) : (
									doneTasks
								)}
							</div>
							<div className="text-xs uppercase tracking-widest font-medium">
								Done
							</div>
						</div>
					</div>

					<div className="bg-background p-8 md:p-12">
						<div className="space-y-2">
							<div className={cn(
								"text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter",
								overdueTasks > 0 && "text-red-500"
							)}>
								{isFiltered ? (
									<>
										<span className="font-medium">{overdueTasks}</span>
										<span className="text-border">/</span>
										<span className="text-muted-foreground">{globalOverdueTasks}</span>
									</>
								) : (
									overdueTasks
								)}
							</div>
							<div className="text-xs uppercase tracking-widest font-medium">
								Overdue
							</div>
						</div>
					</div>
				</div>

				{/* Filters Bar - Minimal */}
				<div className="border-b-2 border-foreground bg-background">
					<div className="p-4 flex flex-wrap items-center gap-2">
						<button
							onClick={() => {
								setFilterStatus(undefined);
								setSelectedProjectId(undefined);
							}}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								!filterStatus && !selectedProjectId && "bg-foreground text-background"
							)}
						>
							All
						</button>
						<button
							onClick={() => {
								setFilterStatus("todo");
								setSelectedProjectId(undefined);
							}}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								filterStatus === "todo" && "bg-foreground text-background"
							)}
						>
							Todo
						</button>
						<button
							onClick={() => {
								setFilterStatus("in progress");
								setSelectedProjectId(undefined);
							}}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								filterStatus === "in progress" && "bg-foreground text-background"
							)}
						>
							In Progress
						</button>
						<button
							onClick={() => {
								setFilterStatus("done");
								setSelectedProjectId(undefined);
							}}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								filterStatus === "done" && "bg-foreground text-background"
							)}
						>
							Done
						</button>

						{projects && projects.length > 0 && (
							<>
								<div className="h-4 w-px bg-border mx-2" />
								{projects.slice(0, 3).map((project) => (
									<button
										key={project._id}
										onClick={() => {
											setSelectedProjectId(project._id);
											setFilterStatus(undefined);
										}}
										className={cn(
											"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
											selectedProjectId === project._id && "bg-foreground text-background"
										)}
									>
										{project.name}
									</button>
								))}
							</>
						)}

						<div className="flex-1" />

						{/* Expand/Collapse Controls */}
						<div className="flex items-center gap-1 border-l border-border pl-2">
							<button
								onClick={expandAll}
								className="px-2 py-1 text-[10px] uppercase tracking-widest font-light hover:bg-accent transition-colors"
								title="Expand All (⌘+E)"
							>
								Expand All
							</button>
							<button
								onClick={collapseAll}
								className="px-2 py-1 text-[10px] uppercase tracking-widest font-light hover:bg-accent transition-colors"
								title="Collapse All (⌘+⇧+E)"
							>
								Collapse All
							</button>
						</div>

						<Button
							onClick={handleCreateTask}
							size="sm"
							className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-light group h-7"
						>
							<Plus className="mr-1.5 h-3.5 w-3.5" />
							New
							<ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
						</Button>
					</div>
				</div>

				{/* Tasks List - Text Only */}
				<div className="flex-1 p-6 md:p-12">
					<div className="max-w-5xl">
						{activeProject && (
							<div className="mb-6 pb-4 border-b border-border/50">
								<div className="text-xs uppercase tracking-widest text-muted-foreground">
									Project
								</div>
								<div className="text-lg font-light mt-1">{activeProject.name}</div>
							</div>
						)}

						{flatTasks.length === 0 ? (
							<div className="py-20 text-center border-2 border-dashed border-border">
								<p className="text-sm text-muted-foreground mb-4">
									No tasks found
								</p>
								<Button
									onClick={handleCreateTask}
									variant="outline"
									size="sm"
									className="rounded-none font-light"
								>
									<Plus className="mr-2 h-4 w-4" />
									Create your first task
								</Button>
							</div>
						) : (
							<div className="space-y-px">
								{flatTasks.map((task) => {
									const isOverdue = task.dueDate && task.dueDate < Date.now() && task.status !== "done";
									const StatusIcon = task.status === "done" ? CheckCircle2 : Circle;

									return (
										<div
											key={task._id}
											className={cn(
												"group py-3 border-b border-border/30 last:border-0 hover:bg-accent/5 transition-all duration-200 flex items-start gap-3",
												// Visual hierarchy based on level
												task.displayLevel === 0 && "border-l-2 border-l-foreground/20",
												task.displayLevel === 1 && "border-l border-l-foreground/10 opacity-95",
												task.displayLevel >= 2 && "opacity-90",
												// Parent tasks get stronger styling
												task.hasChildren && task.displayLevel === 0 && "bg-accent/[0.02]"
											)}
											style={{ paddingLeft: `${task.displayLevel * 2.5 + 1}rem` }}
										>
											{/* Expansion indicator */}
											{task.hasChildren ? (
												<button
													onClick={() => toggleExpand(task._id)}
													className="mt-0.5 flex-shrink-0 hover:bg-accent rounded transition-all w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
													aria-label={task.isExpanded ? "Collapse" : "Expand"}
												>
													<span className="text-sm font-light select-none">
														{task.isExpanded ? "−" : "+"}
													</span>
												</button>
											) : (
												<div className="w-5 flex-shrink-0" />
											)}

											{/* Status checkbox */}
											<button
												onClick={() => handleToggleStatus(task)}
												className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
											>
												<StatusIcon
													className={cn(
														"h-4 w-4",
														task.status === "done" ? "text-foreground" : "text-muted-foreground"
													)}
													strokeWidth={1.5}
												/>
											</button>

											<div className="flex-1 min-w-0">
												<div className="flex items-baseline gap-3 flex-wrap">
													<h3
														className={cn(
															"text-sm transition-all",
															// Font weight hierarchy
															task.displayLevel === 0 && task.hasChildren && "font-medium",
															task.displayLevel === 0 && !task.hasChildren && "font-normal",
															task.displayLevel === 1 && "font-light",
															task.displayLevel >= 2 && "font-light text-sm",
															task.status === "done" && "line-through text-muted-foreground"
														)}
													>
														{task.title}
														{/* Show subtask count when collapsed */}
														{task.hasChildren && !task.isExpanded && (
															<span className="ml-2 text-[10px] uppercase tracking-widest text-muted-foreground font-light">
																({task.childCount})
															</span>
														)}
													</h3>
													<span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
														{task.displayId}
													</span>
													{isOverdue && (
														<span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-red-500">
															<AlertCircle className="h-3 w-3" />
															Overdue
														</span>
													)}
												</div>

												{task.description && (
													<p className="text-xs text-muted-foreground mt-1 line-clamp-1 font-light">
														{task.description}
													</p>
												)}

												<div className="flex items-center gap-3 mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
													<span>{task.status}</span>
													<span className="h-1 w-1 rounded-full bg-muted-foreground" />
													<span>{task.priority}</span>
													{task.dueDate && (
														<>
															<span className="h-1 w-1 rounded-full bg-muted-foreground" />
															<span>
																Due {new Date(task.dueDate).toLocaleDateString('en-US', {
																	month: 'short',
																	day: 'numeric',
																})}
															</span>
														</>
													)}
												</div>
											</div>

											<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<button
													onClick={() => handleEditTask(task)}
													className="text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-muted transition-colors font-light"
												>
													Edit
												</button>
												<button
													onClick={() => handleDeleteTask(task._id)}
													className="text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-destructive/10 hover:text-destructive transition-colors font-light"
												>
													Delete
												</button>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>

			<Suspense fallback={null}>
				<TaskFormDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					task={editingTask}
					onSubmit={handleSubmitTask}
					mode={dialogMode}
					rootTasks={rootTasks}
					parentTaskId={parentTaskId}
				/>
			</Suspense>
		</>
	);
}
