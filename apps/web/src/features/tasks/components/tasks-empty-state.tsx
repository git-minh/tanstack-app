import { CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TasksEmptyStateProps {
	onCreateTask: () => void;
	isFiltered?: boolean;
}

export function TasksEmptyState({
	onCreateTask,
	isFiltered = false,
}: TasksEmptyStateProps) {
	if (isFiltered) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<div className="rounded-full bg-muted p-6 mb-4">
					<CheckSquare className="h-10 w-10 text-muted-foreground" />
				</div>
				<h3 className="text-lg font-semibold mb-2">No tasks found</h3>
				<p className="text-sm text-muted-foreground max-w-sm mb-4">
					No tasks match your current filters. Try adjusting your search or filter
					criteria.
				</p>
				<Button variant="outline" size="sm" onClick={() => window.location.reload()}>
					Clear filters
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<div className="rounded-full bg-muted p-8 mb-6">
				<CheckSquare className="h-16 w-16 text-muted-foreground" />
			</div>
			<h3 className="text-2xl font-semibold mb-2">No tasks yet</h3>
			<p className="text-muted-foreground max-w-md mb-6">
				Get started by creating your first task. Organize your work, track
				progress, and stay productive.
			</p>
			<Button onClick={onCreateTask}>Create your first task</Button>
		</div>
	);
}
