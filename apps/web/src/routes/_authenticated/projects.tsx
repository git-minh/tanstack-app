import { createFileRoute } from "@tanstack/react-router";
import { Projects } from "@/features/projects";
import { ErrorBoundary } from "@/components/error-boundary";

export const Route = createFileRoute("/_authenticated/projects")({
	component: ProjectsRoute,
});

function ProjectsRoute() {
	return (
		<ErrorBoundary>
			<Projects />
		</ErrorBoundary>
	);
}
