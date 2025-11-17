"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Import logos (TypeScript will handle these as module imports)
// Place your PNG files at: apps/web/src/assets/logos/
import logoBlackBg from "@/assets/logos/s-logo-blackbackground.png";
import logoWhiteBg from "@/assets/logos/s-logo-whitebackground.png";

interface LogoProps {
	className?: string;
	/** Override the default theme-based logo selection */
	variant?: "light" | "dark";
}

/**
 * Theme-aware logo component that automatically switches between
 * black and white background variants based on the current theme.
 *
 * - Light theme: Shows black logo (for white background)
 * - Dark theme: Shows white logo (for black background)
 */
export function Logo({ className, variant }: LogoProps) {
	const { theme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Avoid hydration mismatch by waiting for client-side mount
	useEffect(() => {
		setMounted(true);
	}, []);

	// Determine which logo to show
	const currentTheme = variant || theme;
	const logoSrc = currentTheme === "dark" ? logoWhiteBg : logoBlackBg;

	// During SSR or before mount, render a placeholder to prevent layout shift
	if (!mounted) {
		return (
			<div
				className={cn(
					"h-8 w-8 border-2 border-foreground flex items-center justify-center",
					className
				)}
				aria-label="Streamline"
			>
				<span className="text-xs font-bold">S</span>
			</div>
		);
	}

	return (
		<img
			src={logoSrc}
			alt="Streamline"
			className={cn(
				"h-8 w-auto object-contain transition-opacity duration-300",
				mounted ? "opacity-100" : "opacity-0",
				className
			)}
			// Prevent layout shift during load
			style={{ maxWidth: "100%" }}
		/>
	);
}
