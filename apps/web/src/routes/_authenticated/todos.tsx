import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";
import { TodoList } from "@/components/features/todos/todo-list";

export const Route = createFileRoute("/_authenticated/todos")({
	component: TodosRoute,
});

function TodosRoute() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Todos</h1>
				<p className="text-muted-foreground">
					Manage your tasks efficiently
				</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Todo List</CardTitle>
					<CardDescription>
						Powered by Convex real-time database
					</CardDescription>
				</CardHeader>
				<CardContent>
					<TodoList />
				</CardContent>
			</Card>
		</div>
	);
}
