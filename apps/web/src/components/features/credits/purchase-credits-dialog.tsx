import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, CreditCard, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import { toast } from "sonner";

interface CreditPackage {
	id: string;
	credits: number;
	price: number;
	priceId: string;
	popular: boolean;
}

interface PurchaseCreditsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	package: CreditPackage;
}

export function PurchaseCreditsDialog({
	open,
	onOpenChange,
	package: pkg,
}: PurchaseCreditsDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const checkout = useMutation(api.autumn.checkout);

	const handlePurchase = async () => {
		try {
			setIsLoading(true);

			// Create checkout session with Autumn
			const result = await checkout({
				priceId: pkg.priceId,
				metadata: {
					credits: pkg.credits.toString(),
					packageId: pkg.id,
					type: "credit_purchase",
				},
			});

			// Autumn checkout returns a URL to redirect to
			if (result && typeof result === "object" && "url" in result) {
				window.location.href = result.url as string;
			} else {
				throw new Error("Invalid checkout response");
			}
		} catch (error) {
			console.error("Checkout error:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to start checkout. Please try again."
			);
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-primary" />
						Purchase {pkg.credits.toLocaleString()} Credits
					</DialogTitle>
					<DialogDescription>
						Add credits to your account for continued AI-powered features.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Package Summary */}
					<div className="rounded-lg border bg-muted/50 p-4 space-y-3">
						<div className="flex justify-between items-center">
							<span className="text-sm text-muted-foreground">
								Credits
							</span>
							<span className="font-semibold">
								{pkg.credits.toLocaleString()}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-sm text-muted-foreground">Price</span>
							<span className="text-2xl font-bold">${pkg.price}</span>
						</div>
					</div>

					{/* What You Get */}
					<div className="space-y-2">
						<h4 className="text-sm font-medium">What you get:</h4>
						<div className="space-y-2 text-sm text-muted-foreground">
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
								<span>
									~{Math.floor(pkg.credits / 3)} chat messages
								</span>
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
								<span>
									~{Math.floor(pkg.credits / 15)} AI generations
								</span>
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
								<span>~{Math.floor(pkg.credits / 5)} URL scrapes</span>
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
								<span>Credits never expire</span>
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
								<span>Added immediately after purchase</span>
							</div>
						</div>
					</div>

					{/* Payment Info */}
					<div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-3">
						<p className="text-xs text-blue-600 dark:text-blue-400">
							<CreditCard className="h-3 w-3 inline mr-1" />
							Secure payment powered by Autumn. You'll be redirected
							to complete your purchase.
						</p>
					</div>
				</div>

				<DialogFooter className="flex-col sm:flex-row gap-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						onClick={handlePurchase}
						disabled={isLoading}
						className="w-full sm:w-auto"
					>
						{isLoading ? (
							<>
								<span className="animate-spin mr-2">⏳</span>
								Processing...
							</>
						) : (
							<>
								<CreditCard className="h-4 w-4 mr-2" />
								Continue to Payment
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
