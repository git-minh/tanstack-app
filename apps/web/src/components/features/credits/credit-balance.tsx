import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, Info } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CreditBalance() {
	const { data: credits } = useSuspenseQuery(
		convexQuery(api.credits.getUserCredits, {})
	);

	// Determine color based on credits remaining
	const getColorClass = () => {
		if (credits.isUnlimited) return "text-purple-600 dark:text-purple-400";
		if (credits.creditsRemaining > 50)
			return "text-green-600 dark:text-green-400";
		if (credits.creditsRemaining >= 20)
			return "text-yellow-600 dark:text-yellow-400";
		return "text-red-600 dark:text-red-400";
	};

	const displayText = credits.isUnlimited
		? "Unlimited"
		: `${credits.creditsRemaining}`;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={`gap-2 ${getColorClass()}`}
				>
					<Sparkles className="h-4 w-4" />
					<span className="font-semibold">{displayText}</span>
					{!credits.isUnlimited && (
						<span className="text-xs text-muted-foreground">credits</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80" align="end">
				<div className="space-y-4">
					<div className="space-y-2">
						<h4 className="font-semibold leading-none">Credit Balance</h4>
						<p className="text-sm text-muted-foreground">
							{credits.isUnlimited
								? "You have unlimited credits with your Pro plan."
								: `You have ${credits.creditsRemaining} of ${credits.creditsTotal} credits remaining this month.`}
						</p>
					</div>

					{!credits.isUnlimited && (
						<>
							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">
										Chat message
									</span>
									<span className="font-medium">3 credits</span>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">
										AI project generation
									</span>
									<span className="font-medium">15 credits</span>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">URL scraping</span>
									<span className="font-medium">5 credits</span>
								</div>
							</div>

							<div className="rounded-lg bg-muted p-3 space-y-2">
								<div className="flex items-start gap-2">
									<Info className="h-4 w-4 text-muted-foreground mt-0.5" />
									<p className="text-xs text-muted-foreground">
										Credits reset monthly on the{" "}
										{new Date(
											credits.lastCreditReset
										).getDate()}th. Upgrade to Pro for unlimited
										credits.
									</p>
								</div>
							</div>

							{credits.creditsRemaining < 20 && (
								<div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-3">
									<p className="text-xs text-red-600 dark:text-red-400 font-medium">
										⚠️ Running low on credits! Consider upgrading or
										purchasing more.
									</p>
								</div>
							)}

							<div className="flex gap-2">
								<Button asChild className="flex-1" size="sm">
									<Link to="/pricing">
										<Plus className="h-4 w-4 mr-1" />
										Buy Credits
									</Link>
								</Button>
								<Button asChild variant="outline" className="flex-1" size="sm">
									<Link to="/pricing">Upgrade to Pro</Link>
								</Button>
							</div>
						</>
					)}

					{credits.isUnlimited && (
						<div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 p-3">
							<p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
								✨ Pro Plan Active
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								Enjoy unlimited AI generations, chat messages, and URL scraping.
							</p>
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
