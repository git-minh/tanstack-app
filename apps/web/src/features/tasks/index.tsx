import { Suspense, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TasksTable } from "./components/tasks-table";
import { columns } from "./components/tasks-columns";
import { TaskFormDialog } from "./components/task-form-dialog";
import { TasksStats } from "./components/tasks-stats";
import { TasksSkeleton } from "./components/tasks-skeleton";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Task } from "./data/schema";

export function Tasks() {
	const { data: tasks } = useSuspenseQuery(convexQuery(api.tasks.getAll, {}));
	const createTask = useMutation(api.tasks.create);
	const updateTask = useMutation(api.tasks.update);
	const deleteTask = useMutation(api.tasks.remove);
	const deleteMany = useMutation(api.tasks.removeMany);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingTask, setEditingTask] = useState<Task | undefined>();
	const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

	const handleCreateTask = () => {
		setEditingTask(undefined);
		setDialogMode("create");
		setDialogOpen(true);
	};

	const handleEditTask = (task: Task) => {
		setEditingTask(task);
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
	}) => {
		try {
			if (dialogMode === "create") {
				await createTask(values);
				toast.success("Task created successfully");
			} else {
				if (!editingTask) return;
				await updateTask({
					id: editingTask._id as any,
					...values,
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
					<Button onClick={handleCreateTask}>
						<Plus className="mr-2 h-4 w-4" />
						New Task
					</Button>
				</div>

				<Suspense fallback={<TasksSkeleton />}>
					<TasksStats />
				</Suspense>

				<Card>
					<CardHeader>
						<CardTitle>All Tasks</CardTitle>
					</CardHeader>
					<CardContent>
						<TasksTable
							data={tasks}
							columns={columns}
							onDeleteTask={handleDeleteTask}
							onDeleteMany={handleDeleteMany}
							onEditTask={handleEditTask}
							onCreateTask={handleCreateTask}
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
			/>
		</>
	);
}
