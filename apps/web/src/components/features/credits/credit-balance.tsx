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
					className="h-auto px-3 py-1.5 border border-border/40 bg-muted/30 hover:bg-muted/50 hover:border-border/60"
				>
					<div className="flex flex-col items-end gap-0.5">
						<span className="font-mono text-[7px] uppercase tracking-[0.25em] font-medium opacity-30 leading-none">
							CREDITS
						</span>
						<span className="text-[15px] font-medium tracking-[-0.01em] leading-none tabular-nums">
							{displayText}
						</span>
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-80 rounded-none border-2 border-foreground"
				align="end"
			>
				<div className="space-y-6">
					{/* Header */}
					<div className="space-y-3">
						<h4 className="font-mono text-[9px] uppercase tracking-[0.25em] font-medium opacity-40">
							Credit Balance
						</h4>
						<p className="text-[15px] font-light leading-relaxed tracking-[-0.01em]">
							{credits.isUnlimited
								? "Unlimited credits with Pro plan."
								: `${credits.creditsRemaining} of ${credits.creditsTotal} credits remaining this month.`}
						</p>
					</div>

					{!credits.isUnlimited && (
						<>
							{/* Pricing Table */}
							<div className="space-y-3 border-t-2 border-border pt-5">
								<div className="flex items-baseline justify-between">
									<span className="font-mono text-[9px] uppercase tracking-[0.2em] font-light opacity-60">
										Chat message
									</span>
									<span className="text-[15px] font-medium tabular-nums tracking-tight">3</span>
								</div>
								<div className="flex items-baseline justify-between">
									<span className="font-mono text-[9px] uppercase tracking-[0.2em] font-light opacity-60">
										AI project generation
									</span>
									<span className="text-[15px] font-medium tabular-nums tracking-tight">15</span>
								</div>
								<div className="flex items-baseline justify-between">
									<span className="font-mono text-[9px] uppercase tracking-[0.2em] font-light opacity-60">
										URL scraping
									</span>
									<span className="text-[15px] font-medium tabular-nums tracking-tight">5</span>
								</div>
							</div>

							{/* Reset Info */}
							<div className="border-t-2 border-border pt-5">
								<p className="font-mono text-[9px] uppercase tracking-[0.2em] font-light opacity-60">
									Resets monthly on the{" "}
									<span className="tabular-nums font-medium opacity-100">
										{new Date(credits.lastCreditReset).getDate()}th
									</span>
								</p>
							</div>

							{/* Low Credit Warning */}
							{credits.creditsRemaining < 20 && (
								<div className="border-2 border-foreground p-4 bg-muted/30">
									<p className="font-mono text-[9px] uppercase tracking-[0.25em] font-medium opacity-40 mb-2">
										Low credit balance
									</p>
									<p className="text-[15px] font-light leading-relaxed tracking-[-0.01em]">
										Consider upgrading or purchasing additional credits.
									</p>
								</div>
							)}

							{/* Actions */}
							<div className="flex gap-3 border-t-2 border-border pt-5">
								<Button
									asChild
									className="flex-1 rounded-none bg-foreground text-background hover:bg-foreground/90 h-auto py-2.5 text-[13px] font-medium tracking-tight"
								>
									<Link to="/pricing">
										Buy Credits
									</Link>
								</Button>
								<Button
									asChild
									variant="outline"
									className="flex-1 rounded-none border-2 border-foreground hover:bg-foreground hover:text-background h-auto py-2.5 text-[13px] font-medium tracking-tight"
								>
									<Link to="/pricing">Upgrade</Link>
								</Button>
							</div>
						</>
					)}

					{credits.isUnlimited && (
						<div className="border-2 border-foreground p-5 bg-muted/30">
							<p className="font-mono text-[9px] uppercase tracking-[0.25em] font-medium opacity-40 mb-3">
								Pro Plan Active
							</p>
							<p className="text-[15px] font-light leading-relaxed tracking-[-0.01em]">
								Unlimited AI generations, chat messages, and URL scraping.
							</p>
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
