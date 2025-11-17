import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { TodoItem } from "./todo-item";
import { TodoForm } from "./todo-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function TodoList() {
	const todosQuery = useSuspenseQuery(convexQuery(api.todos.getAll, {}));
	const statsQuery = useSuspenseQuery(convexQuery(api.todos.getTodoStats, {}));
	const todos = todosQuery.data;
	const stats = statsQuery.data;

	const deleteCompleted = useMutation(api.todos.deleteCompleted);

	const completedCount = todos?.filter(t => t.completed).length || 0;
	const activeCount = (todos?.length || 0) - completedCount;

	const handleDeleteCompleted = async () => {
		try {
			await deleteCompleted();
			toast.success("Completed todos cleared");
		} catch (error) {
			console.error("Failed to delete completed todos:", error);
			toast.error("Failed to clear completed todos");
		}
	};

	return (
		<div className="min-h-[calc(100vh-8rem)] flex flex-col">
			{/* Hero Stats - Ultra Minimal */}
			<div className="grid grid-cols-3 gap-px bg-foreground border-y-2 border-foreground">
				<div className="bg-background p-8 md:p-12 border-r-2 border-foreground">
					<div className="space-y-2">
						<div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
							{activeCount}
						</div>
						<div className="text-xs uppercase tracking-widest font-medium">
							Active
						</div>
					</div>
				</div>

				<div className="bg-background p-8 md:p-12 border-r-2 border-foreground">
					<div className="space-y-2">
						<div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
							{completedCount}
						</div>
						<div className="text-xs uppercase tracking-widest font-medium">
							Done
						</div>
					</div>
				</div>

				<div className="bg-background p-8 md:p-12">
					<div className="space-y-2">
						<div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
							{stats?.completionRate || 0}%
						</div>
						<div className="text-xs uppercase tracking-widest font-medium">
							Rate
						</div>
					</div>
				</div>
			</div>

			{/* Add Todo Form */}
			<div className="border-b-2 border-foreground bg-background p-4">
				<TodoForm />
			</div>

			{/* Actions Bar */}
			{completedCount > 0 && (
				<div className="border-b-2 border-foreground bg-background p-4 flex justify-end">
					<button
						onClick={handleDeleteCompleted}
						className="text-[10px] uppercase tracking-widest px-3 py-1 hover:bg-destructive/10 hover:text-destructive transition-colors border border-border"
					>
						Clear {completedCount} completed
					</button>
				</div>
			)}

			{/* Todo List */}
			<div className="flex-1 p-6 md:p-12">
				<div className="max-w-3xl">
					{todos?.length === 0 ? (
						<div className="py-20 text-center border-2 border-dashed border-border">
							<p className="text-sm text-muted-foreground">
								No todos yet
							</p>
						</div>
					) : (
						<div className="space-y-px">
							{todos?.map((todo) => (
								<TodoItem
									key={todo._id}
									id={todo._id}
									text={todo.text}
									completed={todo.completed}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
