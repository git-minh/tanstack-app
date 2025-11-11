import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { lazyRoute, createRouteSkeleton } from "@/lib/lazy-route";
import { ErrorBoundary } from "@/components/error-boundary";

// Lazy load Tasks feature (37 KB) - only loads when route is accessed
const Tasks = lazyRoute(() => import("@/features/tasks").then(m => ({ default: m.Tasks })));

// Create skeleton loader for tasks route
const TasksSkeleton = createRouteSkeleton({
	title: "Tasks",
	description: "Manage your tasks and track progress",
});

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
