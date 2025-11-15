import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "@tanstack/react-router";
import { AlertCircle, Sparkles } from "lucide-react";

interface InsufficientCreditsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	creditsNeeded: number;
	creditsAvailable: number;
	featureName?: string;
}

export function InsufficientCreditsDialog({
	open,
	onOpenChange,
	creditsNeeded,
	creditsAvailable,
	featureName = "this feature",
}: InsufficientCreditsDialogProps) {
	const creditsShort = creditsNeeded - creditsAvailable;

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
							<AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
						</div>
						<AlertDialogTitle>Insufficient Credits</AlertDialogTitle>
					</div>
					<AlertDialogDescription className="space-y-3 pt-4">
						<p>
							You don't have enough credits to use {featureName}.
						</p>
						<div className="rounded-lg border bg-muted p-3 space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">
									Credits needed:
								</span>
								<span className="font-semibold">
									{creditsNeeded}
								</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">
									Credits available:
								</span>
								<span className="font-semibold text-red-600 dark:text-red-400">
									{creditsAvailable}
								</span>
							</div>
							<div className="border-t pt-2 flex items-center justify-between text-sm">
								<span className="text-muted-foreground">
									Credits short:
								</span>
								<span className="font-semibold text-red-600 dark:text-red-400">
									{creditsShort}
								</span>
							</div>
						</div>
						<p className="text-sm">
							Purchase more credits or upgrade to Pro for unlimited access.
						</p>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction asChild>
						<Link to="/pricing">
							<Sparkles className="mr-2 h-4 w-4" />
							Buy More Credits
						</Link>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
