import { useEffect, useRef } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

/**
 * Hook to monitor credit balance and show warning toasts
 * when credits drop below certain thresholds
 */
export function useCreditWarnings() {
	const { data: credits } = useSuspenseQuery(
		convexQuery(api.credits.getUserCredits, {})
	);

	// Track previous credits to detect changes
	const prevCreditsRef = useRef(credits.creditsRemaining);
	// Track if we've shown warnings to avoid spam
	const warningsShownRef = useRef({
		low: false, // < 20 credits
		veryLow: false, // < 10 credits
		critical: false, // < 5 credits
	});

	useEffect(() => {
		// Skip warnings for unlimited credits
		if (credits.isUnlimited) {
			return;
		}

		const currentCredits = credits.creditsRemaining;
		const prevCredits = prevCreditsRef.current;

		// Only show warnings when credits decrease
		if (currentCredits < prevCredits) {
			// Critical warning: < 5 credits
			if (currentCredits < 5 && !warningsShownRef.current.critical) {
				toast.error("Critical: Almost out of credits!", {
					description: `Only ${currentCredits} credits remaining. Purchase more to continue.`,
					action: {
						label: "Buy Credits",
						onClick: () => {
							window.location.href = "/pricing";
						},
					},
					duration: 10000,
				});
				warningsShownRef.current.critical = true;
			}
			// Very low warning: < 10 credits
			else if (
				currentCredits < 10 &&
				!warningsShownRef.current.veryLow
			) {
				toast.warning("Running very low on credits", {
					description: `${currentCredits} credits remaining. Consider purchasing more.`,
					action: {
						label: "View Pricing",
						onClick: () => {
							window.location.href = "/pricing";
						},
					},
					duration: 7000,
				});
				warningsShownRef.current.veryLow = true;
			}
			// Low warning: < 20 credits
			else if (currentCredits < 20 && !warningsShownRef.current.low) {
				toast.warning("Credit balance is getting low", {
					description: `${currentCredits} credits remaining. You may want to purchase more soon.`,
					action: {
						label: "View Pricing",
						onClick: () => {
							window.location.href = "/pricing";
						},
					},
					duration: 5000,
				});
				warningsShownRef.current.low = true;
			}
		}

		// Update previous credits
		prevCreditsRef.current = currentCredits;
	}, [credits.creditsRemaining, credits.isUnlimited]);

	return credits;
}
