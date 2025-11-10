import { createFileRoute } from "@tanstack/react-router";
import { Projects } from "@/features/projects";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthGuard } from "@/components/auth/auth-guard";

export const Route = createFileRoute("/_authenticated/projects")({
	component: ProjectsRoute,
});

function ProjectsRoute() {
	return (
		<ErrorBoundary>
			<AuthGuard>
				<Projects />
			</AuthGuard>
		</ErrorBoundary>
	);
}
