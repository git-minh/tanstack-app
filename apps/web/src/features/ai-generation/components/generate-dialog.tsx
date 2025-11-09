import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	generateProjectFormSchema,
	type GenerateProjectFormValues,
} from "../data/schema";

export interface GenerateResult {
	projectsCount?: number;
	tasksCount?: number;
	contactsCount?: number;
}

interface GenerateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: GenerateProjectFormValues) => Promise<GenerateResult | void>;
}

export function GenerateDialog({
	open,
	onOpenChange,
	onSubmit,
}: GenerateDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<GenerateProjectFormValues>({
		resolver: zodResolver(generateProjectFormSchema),
		defaultValues: {
			prompt: "",
		},
	});

	const onFormSubmit = async (values: GenerateProjectFormValues) => {
		setIsSubmitting(true);
		try {
			const result = await onSubmit(values);

			// Build success message with counts
			const counts: string[] = [];
			if (result?.projectsCount) {
				counts.push(`${result.projectsCount} project${result.projectsCount !== 1 ? 's' : ''}`);
			}
			if (result?.tasksCount) {
				counts.push(`${result.tasksCount} task${result.tasksCount !== 1 ? 's' : ''}`);
			}
			if (result?.contactsCount) {
				counts.push(`${result.contactsCount} contact${result.contactsCount !== 1 ? 's' : ''}`);
			}

			const message = counts.length > 0
				? `Successfully generated ${counts.join(', ')}`
				: "Project generated successfully";

			toast.success(message);

			// Close dialog after 500ms on success
			setTimeout(() => {
				reset();
				onOpenChange(false);
			}, 500);
		} catch (error) {
			// Show error toast and keep dialog open
			const errorMessage = error instanceof Error
				? error.message
				: "Failed to generate project. Please try again.";
			toast.error(errorMessage);
			console.error("Form submission error:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Generate Project with AI</DialogTitle>
					<DialogDescription>
						{isSubmitting
							? "Please wait while we generate your project"
							: "Describe your project and AI will generate the structure, tasks, and initial setup for you."}
					</DialogDescription>
				</DialogHeader>
				{isSubmitting ? (
					<div className="flex flex-col items-center justify-center py-8 gap-4">
						<Loader2 className="h-12 w-12 animate-spin text-primary" />
						<div className="text-center space-y-2">
							<p className="text-lg font-medium">AI is analyzing your project...</p>
							<p className="text-sm text-muted-foreground">
								This usually takes 10-30 seconds
							</p>
						</div>
					</div>
				) : (
					<form onSubmit={handleSubmit(onFormSubmit)}>
						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor="prompt">Project Description</Label>
								<Textarea
									id="prompt"
									placeholder="E.g., A task management app with projects, tags, and due dates..."
									{...register("prompt")}
									className={errors.prompt ? "border-destructive" : ""}
									rows={8}
								/>
								<p className="text-xs text-muted-foreground">
									Provide a detailed description of your project (20-2000 characters)
								</p>
								{errors.prompt && (
									<p className="text-sm text-destructive">
										{errors.prompt.message}
									</p>
								)}
							</div>
						</div>
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit">Generate</Button>
						</div>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
