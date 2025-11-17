import { cn } from "@/lib/utils";

interface SkeletonProps extends React.ComponentProps<"div"> {
	/**
	 * Skeleton variant for different loading states
	 * - border: Shows as a bordered box (default brutalist style)
	 * - shimmer: Adds subtle shimmer animation
	 * - pulse: Traditional pulse animation (use sparingly)
	 */
	variant?: "border" | "shimmer" | "pulse";
}

function Skeleton({
	className,
	variant = "border",
	...props
}: SkeletonProps) {
	return (
		<div
			data-slot="skeleton"
			className={cn(
				"rounded-none", // Brutalist square corners
				variant === "border" && "border-2 border-foreground/10 bg-background",
				variant === "shimmer" &&
					"border-2 border-foreground/10 bg-background animate-shimmer",
				variant === "pulse" && "bg-accent animate-pulse",
				className
			)}
			{...props}
		/>
	);
}

export { Skeleton };
