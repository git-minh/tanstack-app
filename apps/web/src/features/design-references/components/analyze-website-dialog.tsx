import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Globe, Check } from "lucide-react";
import { toast } from "sonner";
import { useAction, useMutation } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCreditsCheck } from "@/hooks/use-credits-check";
import { InsufficientCreditsDialog } from "@/components/features/credits/insufficient-credits-dialog";

// Form schema
const analyzeWebsiteSchema = z.object({
	url: z.string().url("Please enter a valid HTTP or HTTPS URL"),
	tags: z.string().optional(),
	style: z.enum(["minimal", "corporate", "creative"]),
	industry: z.string().optional(),
});

type AnalyzeWebsiteFormValues = z.infer<typeof analyzeWebsiteSchema>;

interface AnalyzeWebsiteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

// Analysis steps for progress UI
const ANALYSIS_STEPS = [
	{ id: 1, title: "Crawling website", duration: "10-20s" },
	{ id: 2, title: "Analyzing design", duration: "15-30s" },
	{ id: 3, title: "Generating prompts", duration: "10-15s" },
] as const;

export function AnalyzeWebsiteDialog({
	open,
	onOpenChange,
}: AnalyzeWebsiteDialogProps) {
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [currentStep, setCurrentStep] = useState<number | null>(null);
	const navigate = useNavigate();

	const analyzeWebsite = useAction(api.ai.analyzeWebsite);
	const createDesignReference = useMutation(api.designReferences.createDesignReference);

	const {
		hasEnoughCredits,
		creditsAvailable,
		isUnlimited,
		insufficientDialogOpen,
		setInsufficientDialogOpen,
		setCreditsNeeded,
		setFeatureName,
	} = useCreditsCheck();

	const ANALYSIS_COST = 10;

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
		watch,
	} = useForm<AnalyzeWebsiteFormValues>({
		resolver: zodResolver(analyzeWebsiteSchema),
		defaultValues: {
			url: "",
			tags: "",
			style: "minimal",
			industry: "",
		},
	});

	const selectedStyle = watch("style");

	const onSubmit = async (values: AnalyzeWebsiteFormValues) => {
		// Check credits before submitting
		if (!hasEnoughCredits(ANALYSIS_COST)) {
			setCreditsNeeded(ANALYSIS_COST);
			setFeatureName("website analysis");
			setInsufficientDialogOpen(true);
			return;
		}

		setIsAnalyzing(true);
		setCurrentStep(1);

		try {
			// Parse and validate URL first
			let siteName: string;
			try {
				const urlObj = new URL(values.url);
				siteName = urlObj.hostname.replace(/^www\./, "");
			} catch (error) {
				toast.error("Invalid URL format. Please enter a valid HTTP or HTTPS URL.");
				setIsAnalyzing(false);
				setCurrentStep(null);
				return;
			}

			// Step 2: Call analyzeWebsite action
			setCurrentStep(2);
			const result = await analyzeWebsite({ url: values.url });

			if (!result.success) {
				throw new Error(result.error || "Analysis failed");
			}

			// Step 3: Generate prompts (already done in action, now complete)
			setCurrentStep(3);

			// Parse tags from comma-separated string
			const tags = values.tags
				? values.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
				: [];

			// Save to database
			const reference = await createDesignReference({
				url: values.url,
				siteName,
				description: `Design analysis for ${siteName}`,
				analysis: result.analysis,
				clonePrompts: result.clonePrompts,
				tags,
				style: values.style,
				industry: values.industry || undefined,
			});

			if (!reference) {
				throw new Error("Failed to save design reference");
			}

			toast.success(
				`Successfully analyzed ${siteName} (${result.pagesAnalyzed} pages in ${Math.round(result.analysisTime / 1000)}s)`
			);

			// Close dialog and navigate to detail view
			setTimeout(() => {
				reset();
				setCurrentStep(null);
				onOpenChange(false);
				// Navigate to the design reference detail page
				navigate({ to: `/design-references` });
			}, 500);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to analyze website. Please try again.";
			toast.error(errorMessage);
			console.error("Analysis error:", error);
		} finally {
			setIsAnalyzing(false);
			setCurrentStep(null);
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-[600px] rounded-none border-2 border-foreground">
					<DialogHeader>
						<DialogTitle className="text-2xl font-light tracking-tight">
							Analyze Website
						</DialogTitle>
						{!isAnalyzing && (
							<div className="mt-4 p-4 border-2 border-foreground bg-foreground/5">
								<div className="flex items-center justify-between mb-3">
									<span className="text-[10px] uppercase tracking-widest font-medium">
										Credits
									</span>
									<span className="text-xs font-light">
										{isUnlimited ? "Unlimited" : `${creditsAvailable} remaining`}
									</span>
								</div>
								<div className="flex justify-between items-center pt-3 border-t border-border">
									<span className="text-[10px] uppercase tracking-widest text-muted-foreground">
										Website Analysis
									</span>
									<span className="text-sm font-light">{ANALYSIS_COST} credits</span>
								</div>
							</div>
						)}
					</DialogHeader>

					{isAnalyzing ? (
						<div className="flex flex-col items-center justify-center py-8 gap-6">
							<Globe className="h-12 w-12 text-foreground" />
							<div className="w-full max-w-md space-y-3">
								{ANALYSIS_STEPS.map((step) => {
									const isActive = currentStep === step.id;
									const isComplete = currentStep !== null && currentStep > step.id;

									return (
										<div
											key={step.id}
											className={`flex items-center gap-3 p-3 border-2 ${
												isActive
													? "border-foreground bg-foreground/5"
													: isComplete
														? "border-foreground bg-foreground/5"
														: "border-border"
											}`}
										>
											<div
												className={`flex h-8 w-8 items-center justify-center border-2 ${
													isActive
														? "border-foreground bg-foreground text-background"
														: isComplete
															? "border-foreground bg-foreground text-background"
															: "border-border text-muted-foreground"
												}`}
											>
												{isComplete ? (
													<Check className="h-4 w-4" />
												) : isActive ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<span className="text-xs font-medium">{step.id}</span>
												)}
											</div>
											<div className="flex-1">
												<p className="text-sm font-light">{step.title}</p>
												<p className="text-[10px] uppercase tracking-widest text-muted-foreground">
													{step.duration}
												</p>
											</div>
										</div>
									);
								})}
							</div>
							<p className="text-[10px] uppercase tracking-widest text-muted-foreground">
								Up to 60 seconds
							</p>
						</div>
					) : (
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
							<div className="grid gap-1.5">
								<Label htmlFor="url" className="text-[10px] uppercase tracking-widest font-medium">
									Website URL *
								</Label>
								<Input
									id="url"
									type="url"
									placeholder="https://example.com"
									{...register("url")}
									className={`rounded-none border-foreground font-light ${errors.url ? "border-destructive" : ""}`}
								/>
								{errors.url && (
									<p className="text-[10px] text-destructive uppercase tracking-widest">
										{errors.url.message}
									</p>
								)}
							</div>

							<div className="grid gap-1.5">
								<Label htmlFor="style" className="text-[10px] uppercase tracking-widest font-medium">
									Design Style *
								</Label>
								<Select
									value={selectedStyle}
									onValueChange={(value) =>
										setValue("style", value as "minimal" | "corporate" | "creative")
									}
								>
									<SelectTrigger id="style" className="rounded-none border-foreground font-light">
										<SelectValue placeholder="Select style" />
									</SelectTrigger>
									<SelectContent className="rounded-none">
										<SelectItem value="minimal" className="font-light">Minimal</SelectItem>
										<SelectItem value="corporate" className="font-light">Corporate</SelectItem>
										<SelectItem value="creative" className="font-light">Creative</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="grid gap-1.5">
								<Label htmlFor="tags" className="text-[10px] uppercase tracking-widest font-medium">
									Tags
								</Label>
								<Input
									id="tags"
									placeholder="design, portfolio, saas"
									{...register("tags")}
									className="rounded-none border-foreground font-light"
								/>
							</div>

							<div className="grid gap-1.5">
								<Label htmlFor="industry" className="text-[10px] uppercase tracking-widest font-medium">
									Industry
								</Label>
								<Input
									id="industry"
									placeholder="SaaS, E-commerce, Portfolio"
									{...register("industry")}
									className="rounded-none border-foreground font-light"
								/>
							</div>

							<div className="flex justify-end gap-2 pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
									className="rounded-none border-foreground font-light"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={!hasEnoughCredits(ANALYSIS_COST) || isAnalyzing}
									className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-light"
								>
									Analyze ({ANALYSIS_COST} credits)
								</Button>
							</div>
						</form>
					)}
				</DialogContent>
			</Dialog>

			<InsufficientCreditsDialog
				open={insufficientDialogOpen}
				onOpenChange={setInsufficientDialogOpen}
				creditsNeeded={ANALYSIS_COST}
				creditsAvailable={creditsAvailable}
				featureName="website analysis"
			/>
		</>
	);
}
