import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import { useState } from "react";

export function TodoForm() {
	const [newTodoText, setNewTodoText] = useState("");
	const createTodo = useMutation(api.todos.create);

	const handleAddTodo = async (e: React.FormEvent) => {
		e.preventDefault();
		const text = newTodoText.trim();
		if (text) {
			setNewTodoText("");
			try {
				await createTodo({ text });
			} catch (error) {
				console.error("Failed to add todo:", error);
				setNewTodoText(text);
			}
		}
	};

	return (
		<form onSubmit={handleAddTodo} className="mb-6 flex items-center space-x-2">
			<Input
				value={newTodoText}
				onChange={(e) => setNewTodoText(e.target.value)}
				placeholder="Add a new task..."
			/>
			<Button type="submit" disabled={!newTodoText.trim()}>
				Add
			</Button>
		</form>
	);
}
