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
			<DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-none border-2 border-foreground">
				<DialogHeader>
					<DialogTitle className="text-2xl font-light tracking-tight">
						{mode === "create" ? "Create Project" : "Edit Project"}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onFormSubmit)}>
					<div className="grid gap-6 py-4">
						<div className="grid gap-1.5">
							<Label htmlFor="name" className="text-[10px] uppercase tracking-widest font-medium">
								Project Name
							</Label>
							<Input
								id="name"
								placeholder="Enter project name"
								{...register("name")}
								className={`rounded-none border-foreground font-light ${errors.name ? "border-destructive" : ""}`}
							/>
							{errors.name && (
								<p className="text-[10px] text-destructive uppercase tracking-widest">
									{errors.name.message}
								</p>
							)}
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

						<div className="grid grid-cols-2 gap-4">
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
										{projectStatuses.map((status) => (
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
										{projectPriorities.map((priority) => (
											<SelectItem key={priority.value} value={priority.value} className="font-light">
												{priority.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid gap-1.5">
							<Label htmlFor="color" className="text-[10px] uppercase tracking-widest font-medium">
								Color
							</Label>
							<div className="flex items-center gap-3">
								<Input
									id="color"
									type="color"
									{...register("color")}
									className="h-10 w-16 rounded-none border-foreground cursor-pointer"
								/>
								<Input
									type="text"
									value={watch("color") || "#000000"}
									onChange={(e) => setValue("color", e.target.value)}
									placeholder="#000000"
									className="flex-1 rounded-none border-foreground font-mono text-xs font-light"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-1.5">
								<Label htmlFor="startDate" className="text-[10px] uppercase tracking-widest font-medium">
									Start Date
								</Label>
								<DatePicker
									date={startDate ? new Date(startDate) : undefined}
									onDateChange={(date) => setValue("startDate", date?.getTime())}
									placeholder="Select start date"
								/>
							</div>

							<div className="grid gap-1.5">
								<Label htmlFor="endDate" className="text-[10px] uppercase tracking-widest font-medium">
									End Date
								</Label>
								<DatePicker
									date={endDate ? new Date(endDate) : undefined}
									onDateChange={(date) => setValue("endDate", date?.getTime())}
									placeholder="Select end date"
								/>
							</div>
						</div>

						{mode === "create" && rootProjects && rootProjects.length > 0 && (
							<div className="grid gap-1.5">
								<Label htmlFor="parentProjectId" className="text-[10px] uppercase tracking-widest font-medium">
									Parent Project
								</Label>
								<Select
									value={watch("parentProjectId") || "none"}
									onValueChange={(value) =>
										setValue("parentProjectId", value === "none" ? undefined : value)
									}
								>
									<SelectTrigger id="parentProjectId" className="rounded-none border-foreground font-light">
										<SelectValue placeholder="No parent" />
									</SelectTrigger>
									<SelectContent className="rounded-none">
										<SelectItem value="none" className="font-light">None (root project)</SelectItem>
										{rootProjects.map((proj) => (
											<SelectItem key={proj._id} value={proj._id} className="font-light">
												{proj.displayId} - {proj.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
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
							{isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
