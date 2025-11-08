import { Suspense, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { TasksTable } from "./components/tasks-table";
import { columns } from "./components/tasks-columns";
import { TaskFormDialog } from "./components/task-form-dialog";
import { TasksStats } from "./components/tasks-stats";
import { TasksSkeleton } from "./components/tasks-skeleton";
import { Plus, Filter, Calendar, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Task } from "./data/schema";

export function Tasks() {
	const [filterView, setFilterView] = useState<"all" | "overdue" | "upcoming" | "byStatus">("all");
	const [statusFilter, setStatusFilter] = useState<string | undefined>();

	// Use hierarchical query for tree structure
	const { data: hierarchicalTasks } = useSuspenseQuery(
		convexQuery(api.tasks.getHierarchy, {})
	);
	// Get root tasks for parent selector
	const { data: rootTasks } = useSuspenseQuery(
		convexQuery(api.tasks.getRootTasks, {})
	);
	
	// Additional queries based on filter
	const overdueTasks = useQuery(
		api.tasks.getOverdue,
		filterView === "overdue" ? {} : "skip"
	);
	const upcomingTasks = useQuery(
		api.tasks.getUpcoming,
		filterView === "upcoming" ? {} : "skip"
	);
	const statusTasks = useQuery(
		api.tasks.getByStatus,
		filterView === "byStatus" && statusFilter ? { status: statusFilter } : "skip"
	);

	const createTask = useMutation(api.tasks.create);
	const updateTask = useMutation(api.tasks.update);
	const deleteTask = useMutation(api.tasks.remove);
	const deleteMany = useMutation(api.tasks.removeMany);
	const updateManyStatus = useMutation(api.tasks.updateManyStatus);

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

	const handleCreateSubtask = (parentId: string) => {
		setEditingTask(undefined);
		setParentTaskId(parentId);
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
	}) => {
		try {
			if (dialogMode === "create") {
				await createTask(values);
				toast.success(
					values.parentTaskId
						? "Subtask created successfully"
						: "Task created successfully"
				);
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
				});
				toast.success("Task updated successfully");
			}
		} catch (error) {
			toast.error(`Failed to ${dialogMode} task`);
			console.error(error);
		}
	};

	const handleDeleteTask = async (id: string) => {
		try {
			await deleteTask({ id: id as any });
			toast.success("Task deleted successfully");
		} catch (error) {
			toast.error("Failed to delete task");
			console.error(error);
		}
	};

	const handleDeleteMany = async (ids: string[]) => {
		try {
			await deleteMany({ ids: ids as any });
			toast.success(`${ids.length} tasks deleted successfully`);
		} catch (error) {
			toast.error("Failed to delete tasks");
			console.error(error);
		}
	};

	// Determine which tasks to display
	const displayTasks = filterView === "overdue" 
		? overdueTasks 
		: filterView === "upcoming" 
		? upcomingTasks 
		: filterView === "byStatus" 
		? statusTasks 
		: hierarchicalTasks;

	// Calculate filter badge count
	const getFilterCount = () => {
		if (filterView === "overdue") return overdueTasks?.length || 0;
		if (filterView === "upcoming") return upcomingTasks?.length || 0;
		if (filterView === "byStatus") return statusTasks?.length || 0;
		return hierarchicalTasks?.length || 0;
	};

	const handleBulkStatusUpdate = async (ids: string[], status: string) => {
		try {
			await updateManyStatus({ ids: ids as any, status });
			toast.success(`Updated ${ids.length} tasks to ${status}`);
		} catch (error) {
			toast.error("Failed to update tasks");
			console.error(error);
		}
	};

	return (
		<>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
						<p className="text-muted-foreground">
							Manage your tasks and track their status
						</p>
					</div>
					<div className="flex items-center space-x-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm">
									<Filter className="mr-2 h-4 w-4" />
									Filter View
									{filterView !== "all" && (
										<Badge className="ml-2" variant="secondary">
											{getFilterCount()}
										</Badge>
									)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-[200px]">
								<DropdownMenuLabel>Quick Filters</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => setFilterView("all")}>
									<CheckCircle2 className="mr-2 h-4 w-4" />
									All Tasks
									{filterView === "all" && <Badge className="ml-auto" variant="default">Active</Badge>}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setFilterView("overdue")}>
									<AlertCircle className="mr-2 h-4 w-4 text-red-500" />
									Overdue
									{filterView === "overdue" && <Badge className="ml-auto" variant="default">Active</Badge>}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setFilterView("upcoming")}>
									<Clock className="mr-2 h-4 w-4 text-yellow-500" />
									Upcoming (7 days)
									{filterView === "upcoming" && <Badge className="ml-auto" variant="default">Active</Badge>}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuLabel>By Status</DropdownMenuLabel>
								<DropdownMenuItem onClick={() => {
									setFilterView("byStatus");
									setStatusFilter("backlog");
								}}>
									Backlog
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => {
									setFilterView("byStatus");
									setStatusFilter("todo");
								}}>
									Todo
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => {
									setFilterView("byStatus");
									setStatusFilter("in progress");
								}}>
									In Progress
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => {
									setFilterView("byStatus");
									setStatusFilter("done");
								}}>
									Done
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => {
									setFilterView("byStatus");
									setStatusFilter("canceled");
								}}>
									Canceled
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<Button onClick={handleCreateTask}>
							<Plus className="mr-2 h-4 w-4" />
							New Task
						</Button>
					</div>
				</div>

				<Suspense fallback={<TasksSkeleton />}>
					<TasksStats />
				</Suspense>

				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>
								{filterView === "overdue" ? "Overdue Tasks" :
								 filterView === "upcoming" ? "Upcoming Tasks" :
								 filterView === "byStatus" ? `Tasks - ${statusFilter}` :
								 "All Tasks"}
							</CardTitle>
							{filterView !== "all" && (
								<Badge variant="outline">
									{getFilterCount()} {getFilterCount() === 1 ? "task" : "tasks"}
								</Badge>
							)}
						</div>
					</CardHeader>
					<CardContent>
						<TasksTable
							data={displayTasks || []}
							columns={columns}
							onDeleteTask={handleDeleteTask}
							onDeleteMany={handleDeleteMany}
							onEditTask={handleEditTask}
							onCreateTask={handleCreateTask}
							onCreateSubtask={handleCreateSubtask}
						/>
					</CardContent>
				</Card>
			</div>

			<TaskFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				task={editingTask}
				onSubmit={handleSubmitTask}
				mode={dialogMode}
				rootTasks={rootTasks}
				parentTaskId={parentTaskId}
			/>
		</>
	);
}
