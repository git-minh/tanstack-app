"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			toastOptions={{
				classNames: {
					toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-2 group-[.toaster]:border-foreground group-[.toaster]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-[.toaster]:rounded-none",
					description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs group-[.toast]:uppercase group-[.toast]:tracking-widest group-[.toast]:font-light",
					actionButton: "group-[.toast]:bg-foreground group-[.toast]:text-background group-[.toast]:border-2 group-[.toast]:border-foreground group-[.toast]:rounded-none group-[.toast]:font-light group-[.toast]:uppercase group-[.toast]:tracking-widest group-[.toast]:text-[10px]",
					cancelButton: "group-[.toast]:bg-background group-[.toast]:text-foreground group-[.toast]:border-2 group-[.toast]:border-foreground group-[.toast]:rounded-none group-[.toast]:font-light group-[.toast]:uppercase group-[.toast]:tracking-widest group-[.toast]:text-[10px]",
					error: "group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive",
					success: "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-foreground",
					warning: "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-foreground",
					info: "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-foreground",
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
