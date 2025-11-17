"use client";

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type SignOutDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSignOut = async () => {
		setIsLoading(true);
		setError(null);

		try {
			await authClient.signOut({
				fetchOptions: {
					onSuccess: () => {
						// Close dialog before navigation
						onOpenChange(false);
						// Navigate to login
						navigate({
							to: "/login",
							search: { redirect: "/dashboard" },
						});
					},
					onError: (ctx) => {
						setError("Failed to sign out. Please try again.");
						console.error("Sign out error:", ctx.error);
					},
				},
			});
		} catch (err) {
			setError("An unexpected error occurred.");
			console.error("Sign out error:", err);
		} finally {
			// Always reset loading state
			setIsLoading(false);
		}
	};

	if (!open) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in-0"
				onClick={() => !isLoading && onOpenChange(false)}
			/>

			{/* Dialog */}
			<div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 animate-in fade-in-0 zoom-in-95 duration-200">
				<div className="w-full max-w-md border-4 border-foreground bg-background shadow-2xl">
					{/* Header */}
					<div className="border-b-4 border-foreground bg-background p-6">
						<div className="flex items-start justify-between gap-4">
							<div className="flex-1 space-y-2">
								<div className="flex items-center gap-3">
									<div className="h-10 w-10 border-2 border-foreground flex items-center justify-center">
										<LogOut className="h-5 w-5" strokeWidth={2} />
									</div>
									<h2 className="text-lg font-light tracking-tight leading-none">
										Sign Out
									</h2>
								</div>
								<div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
									CONFIRM ACTION
								</div>
							</div>
							<button
								onClick={() => !isLoading && onOpenChange(false)}
								disabled={isLoading}
								className="h-8 w-8 border-2 border-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
								aria-label="Close"
							>
								<X className="h-4 w-4" strokeWidth={2} />
							</button>
						</div>
					</div>

					{/* Content */}
					<div className="p-6 space-y-6">
						<div className="space-y-3">
							<p className="text-sm leading-relaxed font-light">
								Are you sure you want to sign out of your account?
							</p>
							<p className="text-xs text-muted-foreground leading-relaxed">
								You will be redirected to the login page and will need to sign
								in again to access your workspace.
							</p>
						</div>

						{/* Error Message */}
						{error && (
							<div className="border-2 border-destructive bg-destructive/5 p-4">
								<div className="text-[9px] uppercase tracking-[0.2em] font-medium text-destructive mb-2">
									ERROR
								</div>
								<p className="text-xs text-destructive font-light">{error}</p>
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="border-t-4 border-foreground bg-background p-6">
						<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
							<Button
								onClick={() => onOpenChange(false)}
								disabled={isLoading}
								variant="outline"
								className="rounded-none border-2 text-xs uppercase tracking-[0.15em] font-medium h-10"
							>
								Cancel
							</Button>
							<Button
								onClick={handleSignOut}
								disabled={isLoading}
								className="rounded-none bg-foreground text-background hover:bg-foreground/90 text-xs uppercase tracking-[0.15em] font-medium h-10 min-w-[120px]"
							>
								{isLoading ? (
									<span className="flex items-center gap-2">
										<span className="h-3 w-3 border-2 border-background border-t-transparent rounded-full animate-spin" />
										Signing Out
									</span>
								) : (
									<span className="flex items-center gap-2">
										<LogOut className="h-3.5 w-3.5" strokeWidth={2} />
										Sign Out
									</span>
								)}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
