import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { TodoItem } from "./todo-item";
import { TodoForm } from "./todo-form";

export function TodoList() {
	const todosQuery = useSuspenseQuery(convexQuery(api.todos.getAll, {}));
	const todos = todosQuery.data;

	return (
		<>
			<TodoForm />
			{todos?.length === 0 ? (
				<p className="py-4 text-center">No todos yet. Add one above!</p>
			) : (
				<ul className="space-y-2">
					{todos?.map((todo) => (
						<TodoItem
							key={todo._id}
							id={todo._id}
							text={todo.text}
							completed={todo.completed}
						/>
					))}
				</ul>
			)}
		</>
	);
}
