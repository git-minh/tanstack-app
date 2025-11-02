import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/login")({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			redirect: (search.redirect as string) || "/dashboard",
		};
	},
	beforeLoad: async ({ context, search }) => {
		// If already authenticated, redirect to destination
		if (context.userId) {
			throw redirect({
				to: search.redirect as string,
			});
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const [showSignIn, setShowSignIn] = useState(true);
	const { redirect: redirectTo } = Route.useSearch();

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md">
				{showSignIn ? (
					<SignInForm
						onSwitchToSignUp={() => setShowSignIn(false)}
						redirectTo={redirectTo}
					/>
				) : (
					<SignUpForm
						onSwitchToSignIn={() => setShowSignIn(true)}
						redirectTo={redirectTo}
					/>
				)}
			</div>
		</div>
	);
}
