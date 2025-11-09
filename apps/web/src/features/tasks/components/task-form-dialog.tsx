import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { statuses, priorities, labels } from "../data/data";
import {
	type Task,
	taskFormSchema,
	type TaskFormValues,
} from "../data/schema";

interface TaskFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	task?: Task;
	onSubmit: (values: TaskFormValues) => Promise<void>;
	mode: "create" | "edit";
	rootTasks?: Task[];
	parentTaskId?: string;
}

export function TaskFormDialog({
	open,
	onOpenChange,
	task,
	onSubmit,
	mode,
	rootTasks,
	parentTaskId,
}: TaskFormDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Get active projects for selector
	const { data: projects } = useSuspenseQuery(
		convexQuery(api.projects.getActive, {})
	);

	// Fetch parent task for inheritance (only when creating subtask)
	const { data: parentTask } = useQuery(
		convexQuery(
			api.tasks.getById,
			parentTaskId ? { id: parentTaskId as Id<"tasks"> } : "skip"
		)
	);

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		watch,
		reset,
	} = useForm<TaskFormValues>({
		resolver: zodResolver(taskFormSchema),
		defaultValues: {
			title: task?.title || "",
			status: task?.status || "todo",
			priority: parentTask?.priority || task?.priority || "medium",
			label: parentTask?.label || task?.label || "feature",
			description: task?.description || "",
			dueDate: task?.dueDate,
			parentTaskId: parentTaskId || task?.parentTaskId || undefined,
			projectId: parentTask?.projectId || (task as any)?.projectId || undefined,
		},
	});

	// Reset form when dialog opens/closes or task changes
	useEffect(() => {
		if (open) {
			reset({
				title: task?.title || "",
				status: task?.status || "todo",
				priority: parentTask?.priority || task?.priority || "medium",
				label: parentTask?.label || task?.label || "feature",
				description: task?.description || "",
				dueDate: task?.dueDate,
				parentTaskId: parentTaskId || task?.parentTaskId || undefined,
				projectId: parentTask?.projectId || (task as any)?.projectId || undefined,
			});
		}
	}, [open, task, parentTask, parentTaskId, reset]);

	const onFormSubmit = async (values: TaskFormValues) => {
		setIsSubmitting(true);
		try {
			await onSubmit(values);
			onOpenChange(false);
		} catch (error) {
			console.error("Form submission error:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Create Task" : "Edit Task"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Add a new task to your list"
							: "Make changes to your task"}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onFormSubmit)}>
					<div className="grid gap-4 py-4">
						{mode === "create" && parentTask && (
							<div className="rounded-md bg-muted p-3 text-sm space-y-1">
								<p className="font-medium">
									Creating subtask under{" "}
									<span className="font-mono text-xs bg-background px-1.5 py-0.5 rounded">
										{parentTask.displayId}
									</span>
								</p>
								<p className="text-xs text-muted-foreground">
									Inherited: Priority ({parentTask.priority}), Label ({parentTask.label})
									{parentTask.projectId && ", Project"}
								</p>
							</div>
						)}
						<div className="grid gap-2">
							<Label htmlFor="title">Title</Label>
							<Input
								id="title"
								placeholder="Task title"
								{...register("title")}
								className={errors.title ? "border-destructive" : ""}
							/>
							{errors.title && (
								<p className="text-sm text-destructive">
									{errors.title.message}
								</p>
							)}
						</div>

						<div className="grid gap-2">
							<Label htmlFor="status">Status</Label>
							<Select
								value={watch("status")}
								onValueChange={(value) => setValue("status", value)}
							>
								<SelectTrigger id="status">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									{statuses.map((status) => (
										<SelectItem key={status.value} value={status.value}>
											{status.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="priority">Priority</Label>
							<Select
								value={watch("priority")}
								onValueChange={(value) => setValue("priority", value)}
							>
								<SelectTrigger id="priority">
									<SelectValue placeholder="Select priority" />
								</SelectTrigger>
								<SelectContent>
									{priorities.map((priority) => (
										<SelectItem key={priority.value} value={priority.value}>
											{priority.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="label">Label</Label>
							<Select
								value={watch("label")}
								onValueChange={(value) => setValue("label", value)}
							>
								<SelectTrigger id="label">
									<SelectValue placeholder="Select label" />
								</SelectTrigger>
								<SelectContent>
									{labels.map((label) => (
										<SelectItem key={label.value} value={label.value}>
											{label.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{mode === "create" && rootTasks && (
							<div className="grid gap-2">
								<Label htmlFor="parentTaskId">Parent Task (Optional)</Label>
								<Select
									value={watch("parentTaskId") || "__none__"}
									onValueChange={(value) =>
										setValue("parentTaskId", value === "__none__" ? undefined : value)
									}
								>
									<SelectTrigger id="parentTaskId">
										<SelectValue placeholder="No parent (root task)" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__none__">No parent (root task)</SelectItem>
										{rootTasks.map((rootTask) => (
											<SelectItem key={rootTask._id} value={rootTask._id}>
												{rootTask.displayId} - {rootTask.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">
									Select a parent task to create a subtask
								</p>
							</div>
						)}

						<div className="grid gap-2">
							<Label htmlFor="projectId">Project (Optional)</Label>
							<Select
								value={watch("projectId") || "__none__"}
								onValueChange={(value) => setValue("projectId", value === "__none__" ? undefined : value)}
							>
								<SelectTrigger id="projectId">
									<SelectValue placeholder="No project" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none__">No Project</SelectItem>
									{projects?.map((project) => (
										<SelectItem key={project._id} value={project._id}>
											<div className="flex items-center">
												{project.color && (
													<div 
														className="mr-2 w-3 h-3 rounded-full border" 
														style={{ backgroundColor: project.color }}
													/>
												)}
												{project.name}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								placeholder="Add a description (optional)"
								{...register("description")}
								rows={3}
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="dueDate">Due Date</Label>
							<DatePicker
								date={
									watch("dueDate") ? new Date(watch("dueDate")!) : undefined
								}
								onDateChange={(date) =>
									setValue("dueDate", date ? date.getTime() : undefined)
								}
								placeholder="Select due date (optional)"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting
								? mode === "create"
									? "Creating..."
									: "Saving..."
								: mode === "create"
									? "Create"
									: "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
