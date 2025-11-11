import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { lazyRoute } from "@/lib/lazy-route";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ProjectsSkeleton } from "@/features/projects/components/projects-skeleton";

// Lazy load Projects feature (19 KB) - only loads when route is accessed
const Projects = lazyRoute(() => import("@/features/projects").then(m => ({ default: m.Projects })));

export const Route = createFileRoute("/_authenticated/projects")({
	component: ProjectsRoute,
});

function ProjectsRoute() {
	return (
		<ErrorBoundary>
			<AuthGuard>
				<Suspense fallback={<ProjectsSkeleton />}>
					<Projects />
				</Suspense>
			</AuthGuard>
		</ErrorBoundary>
	);
}
