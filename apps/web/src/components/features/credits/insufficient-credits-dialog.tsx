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
			<AlertDialogContent className="rounded-none border-2 border-foreground">
				<AlertDialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center border-2 border-destructive bg-destructive/10">
							<AlertCircle className="h-5 w-5 text-destructive" />
						</div>
						<AlertDialogTitle className="text-2xl font-light tracking-tight">
							Insufficient Credits
						</AlertDialogTitle>
					</div>
					<div className="space-y-4 pt-4">
						<p className="text-sm font-light">
							You don't have enough credits to use {featureName}.
						</p>
						<div className="border-2 border-foreground bg-foreground/5 p-4 space-y-3">
							<div className="flex items-center justify-between text-sm">
								<span className="text-[10px] uppercase tracking-widest text-muted-foreground">
									Credits needed
								</span>
								<span className="font-light">
									{creditsNeeded}
								</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-[10px] uppercase tracking-widest text-muted-foreground">
									Credits available
								</span>
								<span className="font-light text-destructive">
									{creditsAvailable}
								</span>
							</div>
							<div className="border-t border-border pt-3 flex items-center justify-between text-sm">
								<span className="text-[10px] uppercase tracking-widest text-muted-foreground">
									Credits short
								</span>
								<span className="font-light text-destructive">
									{creditsShort}
								</span>
							</div>
						</div>
						<p className="text-xs font-light text-muted-foreground">
							Purchase more credits or upgrade to Pro for unlimited access.
						</p>
					</div>
				</AlertDialogHeader>
				<AlertDialogFooter className="flex gap-2">
					<AlertDialogCancel className="rounded-none border-foreground font-light">
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction asChild>
						<Link
							to="/pricing"
							className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-light inline-flex items-center justify-center"
						>
							Buy More Credits
						</Link>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
