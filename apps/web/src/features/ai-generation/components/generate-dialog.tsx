import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Link as LinkIcon, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAction, useQuery } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import { useCustomer } from "autumn-js/react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
	const [urlInput, setUrlInput] = useState("");
	const [scrapedContent, setScrapedContent] = useState("");
	const [isScrapingUrl, setIsScrapingUrl] = useState(false);
	const [urlOpen, setUrlOpen] = useState(false);

	const scrapeUrl = useAction(api.ai.scrapeUrl);
	const usage = useQuery(api.usage.getUserUsage);
	const { checkout } = useCustomer();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
		clearErrors,
		getValues,
		trigger,
	} = useForm<GenerateProjectFormValues>({
		resolver: zodResolver(generateProjectFormSchema),
		defaultValues: {
			prompt: "",
		},
	});

	const handleScrapeUrl = async () => {
		if (!urlInput.trim()) {
			toast.error("Please enter a URL");
			return;
		}

		setIsScrapingUrl(true);
		try {
			const result = await scrapeUrl({ url: urlInput });

			if (result.success && result.markdown) {
				setScrapedContent(result.markdown);
				// Clear prompt validation errors since scraped content can be used instead
				clearErrors("prompt");
				toast.success(
					`Scraped ${result.originalLength} characters${result.truncated ? " (truncated to 20,000)" : ""}`
				);
			} else {
				toast.error(result.error || "Failed to scrape URL");
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to scrape URL");
		} finally {
			setIsScrapingUrl(false);
		}
	};

	const handleClearScrapedContent = () => {
		setScrapedContent("");
		setUrlInput("");
	};

	const handleUpgrade = async () => {
		try {
			const checkoutUrl = await checkout({
				priceId: "price_pro_monthly", // Update this with actual Autumn price ID
			});

			if (checkoutUrl) {
				window.location.href = checkoutUrl;
			}
		} catch (error) {
			toast.error("Failed to start checkout. Please try again.");
			console.error("Checkout error:", error);
		}
	};

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Always run form validation first
		const isValid = await trigger();
		const values = getValues();

		// Check if we have either valid prompt or scraped content
		const hasValidPrompt = values.prompt && values.prompt.length >= 20;
		const hasScrapedContent = scrapedContent && scrapedContent.trim();

		// Proceed if validation passed OR if we have scraped content (alternate data source)
		if (!isValid && !hasScrapedContent) {
			// Validation failed and no scraped content - let form errors display
			return;
		}

		if (!hasValidPrompt && !hasScrapedContent) {
			toast.error("Please provide either a project description or scrape a URL");
			return;
		}

		await onFormSubmit(values);
	};

	const onFormSubmit = async (values: GenerateProjectFormValues) => {
		setIsSubmitting(true);
		try {
			// Combine scraped content with user prompt
			const finalPrompt = scrapedContent
				? `Content from ${urlInput}:\n\n${scrapedContent}\n\n---\n\nAdditional context: ${values.prompt || "No additional context provided."}`
				: values.prompt;

			const result = await onSubmit({ prompt: finalPrompt });

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
				setScrapedContent("");
				setUrlInput("");
				setUrlOpen(false);
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
			<DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col gap-0 p-0">
				<DialogHeader className="px-6 pt-6 pb-4">
					<DialogTitle>Generate Project with AI</DialogTitle>
					<DialogDescription>
						{isSubmitting
							? "Please wait while we generate your project"
							: "Describe your project and AI will generate the structure, tasks, and initial setup for you."}
					</DialogDescription>
					{usage && !isSubmitting && (
						<div className="mt-3 p-3 rounded-md bg-muted">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Sparkles className="h-4 w-4 text-primary" />
									<span className="text-sm font-medium">
										{usage.tier === "free" ? "Free Plan" : "Pro Plan"}
									</span>
								</div>
								<span className="text-sm text-muted-foreground">
									{usage.tier === "free"
										? `${usage.remaining} of ${usage.limit} generations remaining`
										: "Unlimited generations"}
								</span>
							</div>
							{usage.tier === "free" && usage.remaining <= 2 && (
								<div className="mt-2 pt-2 border-t">
									<p className="text-xs text-muted-foreground mb-2">
										You're running low on generations. Upgrade to Pro for unlimited AI generations.
									</p>
									<Button
										size="sm"
										variant="default"
										onClick={handleUpgrade}
										className="w-full"
									>
										Upgrade to Pro - $9/month
									</Button>
								</div>
							)}
							{usage.tier === "free" && !usage.hasAccess && (
								<div className="mt-2 pt-2 border-t">
									<p className="text-xs text-destructive font-medium mb-2">
										You've reached your monthly limit. Upgrade to continue generating projects.
									</p>
									<Button
										size="sm"
										variant="default"
										onClick={handleUpgrade}
										className="w-full"
									>
										Upgrade to Pro - $9/month
									</Button>
								</div>
							)}
						</div>
					)}
				</DialogHeader>
				{isSubmitting ? (
					<div className="flex flex-col items-center justify-center py-8 gap-4 px-6 pb-6">
						<Loader2 className="h-12 w-12 animate-spin text-primary" aria-label="Loading spinner" />
						<div className="text-center space-y-2">
							<p className="text-lg font-medium">AI is analyzing your project...</p>
							<p className="text-sm text-muted-foreground">
								This usually takes 10-30 seconds
							</p>
						</div>
					</div>
				) : (
					<form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0">
						<div className="flex-1 overflow-y-auto px-6 py-4">
							<div className="grid gap-4">
								{/* URL Import Section */}
								<Collapsible open={urlOpen} onOpenChange={setUrlOpen}>
									<div className="flex items-center gap-2">
										<CollapsibleTrigger asChild>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="w-full justify-start gap-2 text-sm font-medium"
											>
												<LinkIcon className="h-4 w-4" />
												Import from URL (optional)
											</Button>
										</CollapsibleTrigger>
									</div>
									<CollapsibleContent className="mt-2 space-y-2">
										<div className="flex gap-2">
											<Input
												placeholder="https://github.com/..."
												value={urlInput}
												onChange={(e) => setUrlInput(e.target.value)}
												disabled={isScrapingUrl}
											/>
											<Button
												type="button"
												onClick={handleScrapeUrl}
												disabled={isScrapingUrl || !urlInput.trim()}
												size="sm"
											>
												{isScrapingUrl ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Scraping...
													</>
												) : (
													"Scrape"
												)}
											</Button>
										</div>
										{scrapedContent && (
											<div className="rounded-md border bg-muted p-3 space-y-2">
												<div className="flex items-center justify-between">
													<p className="text-sm font-medium">
														Scraped content ({scrapedContent.length} chars)
													</p>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={handleClearScrapedContent}
													>
														<X className="h-4 w-4" />
													</Button>
												</div>
												<p className="text-xs text-muted-foreground line-clamp-3">
													{scrapedContent.substring(0, 200)}...
												</p>
											</div>
										)}
									</CollapsibleContent>
								</Collapsible>

								{/* Project Description */}
								<div className="grid gap-2">
									<Label htmlFor="prompt">
										Project Description
										{scrapedContent && (
											<span className="ml-2 text-xs font-normal text-muted-foreground">(optional with scraped content)</span>
										)}
									</Label>
									<Textarea
										id="prompt"
										placeholder={scrapedContent
											? "Add any additional context about your project (optional)..."
											: "E.g., A task management app with projects, tags, and due dates..."}
										{...register("prompt")}
										className={`resize-y min-h-[200px] max-h-[600px] overflow-y-auto ${errors.prompt ? "border-destructive" : ""}`}
									/>
									<p className="text-xs text-muted-foreground">
										{scrapedContent
											? "The scraped content will be used as the main input. You can add extra details here if needed."
											: "Provide a detailed description of your project (20-30,000 characters)"}
									</p>
									{errors.prompt && !scrapedContent && (
										<p className="text-sm text-destructive">
											{errors.prompt.message}
										</p>
									)}
								</div>
							</div>
						</div>
						<div className="flex justify-end gap-2 border-t bg-background px-6 py-4">
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
