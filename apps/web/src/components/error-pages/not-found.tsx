import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, LogIn } from "lucide-react";

export function NotFound() {
	const navigate = useNavigate();
	const context = useRouteContext({ from: "__root__" });
	const isAuthenticated = !!context.userId;

	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<Card className="w-full max-w-lg border shadow-sm">
				<CardContent className="pt-8 pb-8 space-y-6 text-center">
					{/* Error Code */}
					<div className="space-y-2">
						<h1 className="text-6xl font-light tracking-tight text-muted-foreground">
							404
						</h1>
						<h2 className="text-2xl font-medium">Page Not Found</h2>
						<p className="text-muted-foreground">
							The page you're looking for doesn't exist or has been moved.
						</p>
					</div>

					{/* Navigation Options */}
					<div className="flex flex-col sm:flex-row gap-3 pt-4">
						{isAuthenticated ? (
							<>
								<Button
									onClick={() => navigate({ to: "/dashboard" })}
									variant="default"
									className="flex-1"
								>
									<Home className="mr-2 h-4 w-4" />
									Go to Dashboard
								</Button>
								<Button
									onClick={() => navigate({ to: "/" })}
									variant="outline"
									className="flex-1"
								>
									Go Home
								</Button>
							</>
						) : (
							<>
								<Button
									onClick={() => navigate({ to: "/" })}
									variant="default"
									className="flex-1"
								>
									<Home className="mr-2 h-4 w-4" />
									Go Home
								</Button>
								<Button
									onClick={() =>
										navigate({ to: "/login", search: { redirect: "/dashboard" } })
									}
									variant="outline"
									className="flex-1"
								>
									<LogIn className="mr-2 h-4 w-4" />
									Sign In
								</Button>
							</>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
