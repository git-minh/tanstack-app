import SignInForm from "@/components/features/auth/sign-in-form";
import SignUpForm from "@/components/features/auth/sign-up-form";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_auth/login")({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			redirect: (search.redirect as string) || "/dashboard",
		};
	},
	component: LoginRoute,
});

function LoginRoute() {
	const [showSignIn, setShowSignIn] = useState(true);
	const { redirect: redirectTo } = Route.useSearch();

	return (
		<>
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
		</>
	);
}
