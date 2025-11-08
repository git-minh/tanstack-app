import { createFileRoute } from "@tanstack/react-router";
import { Tasks } from "@/features/tasks";
import { ErrorBoundary } from "@/components/error-boundary";

export const Route = createFileRoute("/_authenticated/tasks")({
	component: TasksRoute,
});

function TasksRoute() {
	return (
		<ErrorBoundary>
			<Tasks />
		</ErrorBoundary>
	);
}
