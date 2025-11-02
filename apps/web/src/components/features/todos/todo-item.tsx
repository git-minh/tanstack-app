import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import { Trash2 } from "lucide-react";

interface TodoItemProps {
	id: Id<"todos">;
	text: string;
	completed: boolean;
}

export function TodoItem({ id, text, completed }: TodoItemProps) {
	const toggleTodo = useMutation(api.todos.toggle);
	const removeTodo = useMutation(api.todos.deleteTodo);

	const handleToggle = async () => {
		try {
			await toggleTodo({ id, completed: !completed });
		} catch (error) {
			console.error("Failed to toggle todo:", error);
		}
	};

	const handleDelete = async () => {
		try {
			await removeTodo({ id });
		} catch (error) {
			console.error("Failed to delete todo:", error);
		}
	};

	return (
		<li className="flex items-center justify-between rounded-md border p-2">
			<div className="flex items-center space-x-2">
				<Checkbox
					checked={completed}
					onCheckedChange={handleToggle}
					id={`todo-${id}`}
				/>
				<label
					htmlFor={`todo-${id}`}
					className={`${
						completed ? "text-muted-foreground line-through" : ""
					}`}
				>
					{text}
				</label>
			</div>
			<Button
				variant="ghost"
				size="icon"
				onClick={handleDelete}
				aria-label="Delete todo"
			>
				<Trash2 className="h-4 w-4" />
			</Button>
		</li>
	);
}
