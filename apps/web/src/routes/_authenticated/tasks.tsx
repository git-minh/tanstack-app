import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { lazyRoute } from "@/lib/lazy-route";
import { ErrorBoundary } from "@/components/error-boundary";
import { TasksSkeleton } from "@/features/tasks/components/tasks-skeleton";

// Lazy load Tasks feature (37 KB) - only loads when route is accessed
const Tasks = lazyRoute(() => import("@/features/tasks").then(m => ({ default: m.Tasks })));

export const Route = createFileRoute("/_authenticated/tasks")({
	component: TasksRoute,
});

function TasksRoute() {
	return (
		<ErrorBoundary>
			<Suspense fallback={<TasksSkeleton />}>
				<Tasks />
			</Suspense>
		</ErrorBoundary>
	);
}
