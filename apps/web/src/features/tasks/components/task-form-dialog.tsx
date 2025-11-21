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
			<DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-none border-2 border-foreground">
				<DialogHeader>
					<DialogTitle className="text-2xl font-light tracking-tight">
						{mode === "create" ? "Create Task" : "Edit Task"}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onFormSubmit)}>
					<div className="grid gap-6 py-4">
						{mode === "create" && parentTask && (
							<div className="border-2 border-foreground p-4 bg-foreground/5">
								<p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
									Subtask under {parentTask.displayId}
								</p>
								<p className="text-xs text-muted-foreground">
									Inherited: {parentTask.priority}, {parentTask.label}{parentTask.projectId && ", Project"}
								</p>
							</div>
						)}
						<div className="grid gap-1.5">
							<Label htmlFor="title" className="text-[10px] uppercase tracking-widest font-medium">
								Title
							</Label>
							<Input
								id="title"
								placeholder="Task title"
								{...register("title")}
								className={`rounded-none border-foreground font-light ${errors.title ? "border-destructive" : ""}`}
							/>
							{errors.title && (
								<p className="text-[10px] text-destructive uppercase tracking-widest">
									{errors.title.message}
								</p>
							)}
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div className="grid gap-1.5">
								<Label htmlFor="status" className="text-[10px] uppercase tracking-widest font-medium">
									Status
								</Label>
								<Select
									value={watch("status")}
									onValueChange={(value) => setValue("status", value)}
								>
									<SelectTrigger id="status" className="rounded-none border-foreground font-light">
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
									<SelectContent className="rounded-none">
										{statuses.map((status) => (
											<SelectItem key={status.value} value={status.value} className="font-light">
												{status.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="grid gap-1.5">
								<Label htmlFor="priority" className="text-[10px] uppercase tracking-widest font-medium">
									Priority
								</Label>
								<Select
									value={watch("priority")}
									onValueChange={(value) => setValue("priority", value)}
								>
									<SelectTrigger id="priority" className="rounded-none border-foreground font-light">
										<SelectValue placeholder="Select priority" />
									</SelectTrigger>
									<SelectContent className="rounded-none">
										{priorities.map((priority) => (
											<SelectItem key={priority.value} value={priority.value} className="font-light">
												{priority.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="grid gap-1.5">
								<Label htmlFor="label" className="text-[10px] uppercase tracking-widest font-medium">
									Label
								</Label>
								<Select
									value={watch("label")}
									onValueChange={(value) => setValue("label", value)}
								>
									<SelectTrigger id="label" className="rounded-none border-foreground font-light">
										<SelectValue placeholder="Select label" />
									</SelectTrigger>
									<SelectContent className="rounded-none">
										{labels.map((label) => (
											<SelectItem key={label.value} value={label.value} className="font-light">
												{label.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{mode === "create" && rootTasks && (
							<div className="grid gap-1.5">
								<Label htmlFor="parentTaskId" className="text-[10px] uppercase tracking-widest font-medium">
									Parent Task
								</Label>
								<Select
									value={watch("parentTaskId") || "__none__"}
									onValueChange={(value) =>
										setValue("parentTaskId", value === "__none__" ? undefined : value)
									}
								>
									<SelectTrigger id="parentTaskId" className="rounded-none border-foreground font-light">
										<SelectValue placeholder="No parent" />
									</SelectTrigger>
									<SelectContent className="rounded-none">
										<SelectItem value="__none__" className="font-light">None (root task)</SelectItem>
										{rootTasks.map((rootTask) => (
											<SelectItem key={rootTask._id} value={rootTask._id} className="font-light">
												{rootTask.displayId} - {rootTask.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						<div className="grid gap-1.5">
							<Label htmlFor="projectId" className="text-[10px] uppercase tracking-widest font-medium">
								Project
							</Label>
							<Select
								value={watch("projectId") || "__none__"}
								onValueChange={(value) => setValue("projectId", value === "__none__" ? undefined : value)}
							>
								<SelectTrigger id="projectId" className="rounded-none border-foreground font-light">
									<SelectValue placeholder="No project" />
								</SelectTrigger>
								<SelectContent className="rounded-none">
									<SelectItem value="__none__" className="font-light">None</SelectItem>
									{projects?.map((project) => (
										<SelectItem key={project._id} value={project._id} className="font-light">
											{project.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-1.5">
							<Label htmlFor="description" className="text-[10px] uppercase tracking-widest font-medium">
								Description
							</Label>
							<Textarea
								id="description"
								placeholder="Add description (optional)"
								{...register("description")}
								rows={3}
								className="rounded-none border-foreground font-light"
							/>
						</div>

						<div className="grid gap-1.5">
							<Label htmlFor="dueDate" className="text-[10px] uppercase tracking-widest font-medium">
								Due Date
							</Label>
							<DatePicker
								date={
									watch("dueDate") ? new Date(watch("dueDate")!) : undefined
								}
								onDateChange={(date) =>
									setValue("dueDate", date ? date.getTime() : undefined)
								}
								placeholder="Select date (optional)"
							/>
						</div>
					</div>
					<DialogFooter className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
							className="rounded-none border-foreground font-light"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-light"
						>
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
