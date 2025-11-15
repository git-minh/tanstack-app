import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";

interface UseCreditsCheckResult {
	/** Check if user has enough credits */
	hasEnoughCredits: (creditsNeeded: number) => boolean;
	/** Get current credit balance */
	creditsAvailable: number;
	/** Is user on unlimited plan */
	isUnlimited: boolean;
	/** Show insufficient credits dialog state */
	insufficientDialogOpen: boolean;
	/** Set insufficient credits dialog state */
	setInsufficientDialogOpen: (open: boolean) => void;
	/** Credits needed for current operation (for dialog) */
	creditsNeeded: number;
	/** Set credits needed (for dialog) */
	setCreditsNeeded: (credits: number) => void;
	/** Feature name for dialog */
	featureName: string;
	/** Set feature name for dialog */
	setFeatureName: (name: string) => void;
}

/**
 * Hook to check if user has enough credits before performing an action
 * and show an insufficient credits dialog if needed
 */
export function useCreditsCheck(): UseCreditsCheckResult {
	const { data: credits } = useSuspenseQuery(
		convexQuery(api.credits.getUserCredits, {})
	);

	const [insufficientDialogOpen, setInsufficientDialogOpen] = useState(false);
	const [creditsNeeded, setCreditsNeeded] = useState(0);
	const [featureName, setFeatureName] = useState("this feature");

	const hasEnoughCredits = (needed: number): boolean => {
		// Unlimited users always have enough
		if (credits.isUnlimited) {
			return true;
		}

		return credits.creditsRemaining >= needed;
	};

	return {
		hasEnoughCredits,
		creditsAvailable: credits.creditsRemaining,
		isUnlimited: credits.isUnlimited,
		insufficientDialogOpen,
		setInsufficientDialogOpen,
		creditsNeeded,
		setCreditsNeeded,
		featureName,
		setFeatureName,
	};
}
