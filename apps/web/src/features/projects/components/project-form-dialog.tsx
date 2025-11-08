import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import { projectStatuses, projectPriorities } from "../data/data";
import {
	type Project,
	projectFormSchema,
	type ProjectFormValues,
} from "../data/schema";

interface ProjectFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	project?: Project;
	onSubmit: (values: ProjectFormValues) => Promise<void>;
	mode: "create" | "edit";
	rootProjects?: Project[];
	parentProjectId?: string;
}

export function ProjectFormDialog({
	open,
	onOpenChange,
	project,
	onSubmit,
	mode,
	rootProjects,
	parentProjectId,
}: ProjectFormDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		watch,
		reset,
	} = useForm<ProjectFormValues>({
		resolver: zodResolver(projectFormSchema),
		defaultValues: {
			name: project?.name || "",
			status: project?.status || "active",
			priority: project?.priority || "medium",
			description: project?.description || "",
			color: project?.color || "",
			startDate: project?.startDate,
			endDate: project?.endDate,
			parentProjectId: parentProjectId || project?.parentProjectId || undefined,
		},
	});

	// Reset form when dialog opens/closes or project changes
	useEffect(() => {
		if (open) {
			reset({
				name: project?.name || "",
				status: project?.status || "active",
				priority: project?.priority || "medium",
				description: project?.description || "",
				color: project?.color || "",
				startDate: project?.startDate,
				endDate: project?.endDate,
				parentProjectId: parentProjectId || project?.parentProjectId || undefined,
			});
		}
	}, [open, project, parentProjectId, reset]);

	const onFormSubmit = async (values: ProjectFormValues) => {
		setIsSubmitting(true);
		try {
			await onSubmit(values);
			onOpenChange(false);
		} catch (error) {
			// Log full error for debugging
			console.error("Form submission error:", error);

			// Display user-friendly error message
			const errorMessage = error instanceof Error
				? error.message
				: "An unexpected error occurred";

			toast.error(
				mode === "create"
					? `Failed to create project: ${errorMessage}`
					: `Failed to update project: ${errorMessage}`
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Watch date values for DatePicker components
	const startDate = watch("startDate");
	const endDate = watch("endDate");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Create Project" : "Edit Project"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Add a new project to organize your work"
							: "Make changes to your project"}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onFormSubmit)}>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Project Name</Label>
							<Input
								id="name"
								placeholder="Project name"
								{...register("name")}
								className={errors.name ? "border-destructive" : ""}
							/>
							{errors.name && (
								<p className="text-sm text-destructive">
									{errors.name.message}
								</p>
							)}
						</div>

						<div className="grid gap-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								placeholder="Project description (optional)"
								{...register("description")}
								rows={3}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
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
										{projectStatuses.map((status) => (
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
										{projectPriorities.map((priority) => (
											<SelectItem key={priority.value} value={priority.value}>
												{priority.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="color">Color (optional)</Label>
							<Input
								id="color"
								type="color"
								{...register("color")}
								className="h-10 w-full"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label htmlFor="startDate">Start Date</Label>
								<DatePicker
									date={startDate ? new Date(startDate) : undefined}
									onDateChange={(date) => setValue("startDate", date?.getTime())}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="endDate">End Date</Label>
								<DatePicker
									date={endDate ? new Date(endDate) : undefined}
									onDateChange={(date) => setValue("endDate", date?.getTime())}
								/>
							</div>
						</div>

						{mode === "create" && rootProjects && rootProjects.length > 0 && (
							<div className="grid gap-2">
								<Label htmlFor="parentProjectId">Parent Project (optional)</Label>
								<Select
									value={watch("parentProjectId") || "none"}
									onValueChange={(value) =>
										setValue("parentProjectId", value === "none" ? undefined : value)
									}
								>
									<SelectTrigger id="parentProjectId">
										<SelectValue placeholder="Select parent project" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">No parent</SelectItem>
										{rootProjects.map((proj) => (
											<SelectItem key={proj._id} value={proj._id}>
												{proj.displayId} - {proj.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
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
							{isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
