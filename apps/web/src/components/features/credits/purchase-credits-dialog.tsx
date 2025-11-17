import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
			<DialogContent className="sm:max-w-md rounded-none border-2 border-foreground">
				<DialogHeader>
					<DialogTitle className="text-[10px] uppercase tracking-widest font-medium">
						Purchase {pkg.credits.toLocaleString()} Credits
					</DialogTitle>
					<DialogDescription className="font-light">
						Add credits to your account for continued AI-powered features.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Package Summary */}
					<div className="border-2 border-foreground bg-foreground/5 p-4 space-y-3">
						<div className="flex justify-between items-center">
							<span className="text-[10px] uppercase tracking-widest text-muted-foreground">
								Credits
							</span>
							<span className="font-light text-lg">
								{pkg.credits.toLocaleString()}
							</span>
						</div>
						<div className="flex justify-between items-center border-t border-border pt-3">
							<span className="text-[10px] uppercase tracking-widest text-muted-foreground">Price</span>
							<span className="text-2xl font-light">${pkg.price}</span>
						</div>
					</div>

					{/* What You Get */}
					<div className="space-y-3">
						<h4 className="text-[10px] uppercase tracking-widest font-medium">What you get</h4>
						<div className="space-y-1.5 text-sm font-light border-l-2 border-foreground pl-3">
							<div>
								~{Math.floor(pkg.credits / 3)} chat messages
							</div>
							<div>
								~{Math.floor(pkg.credits / 15)} AI generations
							</div>
							<div>
								~{Math.floor(pkg.credits / 5)} URL scrapes
							</div>
							<div>
								Credits never expire
							</div>
							<div>
								Added immediately after purchase
							</div>
						</div>
					</div>

					{/* Payment Info */}
					<div className="border border-foreground p-3">
						<p className="text-xs font-light">
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
						className="rounded-none border-foreground font-light"
					>
						Cancel
					</Button>
					<Button
						onClick={handlePurchase}
						disabled={isLoading}
						className="w-full sm:w-auto rounded-none bg-foreground text-background hover:bg-foreground/90 font-light"
					>
						{isLoading ? "Processing..." : "Continue to Payment"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
