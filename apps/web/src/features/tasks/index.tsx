import { Suspense, useState, lazy } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Circle, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Task } from "./data/schema";
import { cn } from "@/lib/utils";

// Lazy load TaskFormDialog
const TaskFormDialog = lazy(() =>
	import("./components/task-form-dialog").then(m => ({ default: m.TaskFormDialog }))
);

export function Tasks() {
	const [filterStatus, setFilterStatus] = useState<string | undefined>();
	const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();

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
			await updateTask({
				id: task._id as any,
				status: newStatus,
			});
		} catch (error) {
			toast.error("Failed to update task");
		}
	};

	// Determine which tasks to display
	const displayTasks = selectedProjectId && projectTasks
		? projectTasks
		: filterStatus
		? statusTasks
		: hierarchicalTasks;

	// Calculate stats
	const totalTasks = hierarchicalTasks?.length || 0;
	const doneTasks = hierarchicalTasks?.filter(t => t.status === "done").length || 0;
	const inProgressTasks = hierarchicalTasks?.filter(t => t.status === "in progress").length || 0;
	const overdueTasks = hierarchicalTasks?.filter(t => {
		if (!t.dueDate) return false;
		return t.dueDate < Date.now() && t.status !== "done";
	}).length || 0;

	// Flatten hierarchical tasks for display
	const flattenTasks = (tasks: Task[], level = 0): Array<Task & { displayLevel: number }> => {
		const result: Array<Task & { displayLevel: number }> = [];
		for (const task of tasks) {
			result.push({ ...task, displayLevel: level });
			if (task.subRows && task.subRows.length > 0) {
				result.push(...flattenTasks(task.subRows, level + 1));
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
								{totalTasks}
							</div>
							<div className="text-xs uppercase tracking-widest font-medium">
								Total
							</div>
						</div>
					</div>

					<div className="bg-background p-8 md:p-12 border-r-0 md:border-r-2 border-foreground">
						<div className="space-y-2">
							<div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
								{inProgressTasks}
							</div>
							<div className="text-xs uppercase tracking-widest font-medium">
								Active
							</div>
						</div>
					</div>

					<div className="bg-background p-8 md:p-12 border-r-2 border-foreground">
						<div className="space-y-2">
							<div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
								{doneTasks}
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
								{overdueTasks}
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
											className="group py-3 border-b border-border/30 last:border-0 hover:pl-4 transition-all duration-200 flex items-start gap-4"
											style={{ paddingLeft: `${task.displayLevel * 2}rem` }}
										>
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
															"text-sm font-light",
															task.status === "done" && "line-through text-muted-foreground"
														)}
													>
														{task.title}
													</h3>
													<span className="text-[10px] uppercase tracking-widest text-muted-foreground">
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
													<p className="text-xs text-muted-foreground mt-1 line-clamp-1">
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
													className="text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-muted transition-colors"
												>
													Edit
												</button>
												<button
													onClick={() => handleDeleteTask(task._id)}
													className="text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-destructive/10 hover:text-destructive transition-colors"
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
