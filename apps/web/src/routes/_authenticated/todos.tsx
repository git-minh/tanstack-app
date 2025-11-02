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
		<div className="mx-auto w-full max-w-md">
			<Card>
				<CardHeader>
					<CardTitle>Todo List (Convex)</CardTitle>
					<CardDescription>Manage your tasks efficiently</CardDescription>
				</CardHeader>
				<CardContent>
					<TodoList />
				</CardContent>
			</Card>
		</div>
	);
}
