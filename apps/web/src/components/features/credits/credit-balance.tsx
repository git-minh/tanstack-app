import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function CreditBalance() {
	const { data: credits } = useSuspenseQuery(
		convexQuery(api.credits.getUserCredits, {})
	);

	const displayText = credits.isUnlimited
		? "Unlimited"
		: `${credits.creditsRemaining}`;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="font-light hover:bg-accent"
				>
					<span className="text-[10px] uppercase tracking-widest">
						{displayText}
					</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 rounded-none border-foreground" align="end">
				<div className="space-y-6">
					{/* Header */}
					<div className="space-y-2">
						<h4 className="text-[10px] uppercase tracking-widest font-medium">
							Credit Balance
						</h4>
						<p className="font-light text-sm">
							{credits.isUnlimited
								? "Unlimited credits with Pro plan."
								: `${credits.creditsRemaining} of ${credits.creditsTotal} credits remaining this month.`}
						</p>
					</div>

					{!credits.isUnlimited && (
						<>
							{/* Pricing Table */}
							<div className="space-y-1.5 border-t border-border pt-4">
								<div className="flex items-center justify-between">
									<span className="text-[10px] uppercase tracking-widest font-light">
										Chat message
									</span>
									<span className="text-sm font-light">3</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-[10px] uppercase tracking-widest font-light">
										AI project generation
									</span>
									<span className="text-sm font-light">15</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-[10px] uppercase tracking-widest font-light">
										URL scraping
									</span>
									<span className="text-sm font-light">5</span>
								</div>
							</div>

							{/* Reset Info */}
							<div className="border-t border-border pt-4">
								<p className="text-[10px] uppercase tracking-widest font-light">
									Resets monthly on the{" "}
									{new Date(credits.lastCreditReset).getDate()}th
								</p>
							</div>

							{/* Low Credit Warning */}
							{credits.creditsRemaining < 20 && (
								<div className="border border-foreground p-4">
									<p className="text-[10px] uppercase tracking-widest font-medium">
										Low credit balance
									</p>
									<p className="text-sm font-light mt-1">
										Consider upgrading or purchasing additional credits.
									</p>
								</div>
							)}

							{/* Actions */}
							<div className="flex gap-2 border-t border-border pt-4">
								<Button
									asChild
									className="flex-1 rounded-none bg-foreground text-background hover:bg-foreground/90 font-light"
									size="sm"
								>
									<Link to="/pricing">
										Buy Credits
									</Link>
								</Button>
								<Button
									asChild
									variant="outline"
									className="flex-1 rounded-none border-foreground font-light"
									size="sm"
								>
									<Link to="/pricing">Upgrade</Link>
								</Button>
							</div>
						</>
					)}

					{credits.isUnlimited && (
						<div className="border border-foreground p-4">
							<p className="text-[10px] uppercase tracking-widest font-medium">
								Pro Plan Active
							</p>
							<p className="text-sm font-light mt-1">
								Unlimited AI generations, chat messages, and URL scraping.
							</p>
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
