import { createFileRoute } from "@tanstack/react-router";
import { TodoList } from "@/components/features/todos/todo-list";

export const Route = createFileRoute("/_authenticated/todos")({
	component: TodosRoute,
});

function TodosRoute() {
	return <TodoList />;
}
