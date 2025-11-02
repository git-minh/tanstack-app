import { createFileRoute, useRouteContext, useNavigate } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const context = useRouteContext({ from: Route.id });
	const navigate = useNavigate({ from: "/" });
	const healthCheck = useQuery(convexQuery(api.healthCheck.get, {}));

	const isAuthenticated = !!context.userId;

	const handleGetStarted = () => {
		if (isAuthenticated) {
			navigate({ to: "/dashboard" });
		} else {
			navigate({ to: "/login" });
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<Card className="w-full max-w-lg border-0 shadow-none">
				<CardContent className="pt-8 space-y-8 text-center">
					{/* Hero Section */}
					<div className="space-y-4">
						<h1 className="text-4xl font-light tracking-tight">
							Streamline
						</h1>
						<p className="text-lg text-muted-foreground font-light">
							A clean, focused approach to productivity
						</p>
					</div>

					{/* Call-to-Action Button */}
					<Button
						onClick={handleGetStarted}
						variant="default"
						className="w-full h-12 text-base"
					>
						{isAuthenticated ? "Go to Dashboard" : "Get Started"}
					</Button>

					{/* System Status */}
					<div className="flex items-center justify-center gap-2 pt-4 border-t border-border/50">
						<div
							className={`h-1.5 w-1.5 rounded-full ${
								healthCheck.data === "OK"
									? "bg-green-500"
									: healthCheck.isLoading
										? "bg-orange-400"
										: "bg-red-500"
							}`}
						/>
						<span className="text-xs text-muted-foreground">
							{healthCheck.isLoading
								? "Checking system..."
								: healthCheck.data === "OK"
									? "System online"
									: "System offline"}
						</span>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
