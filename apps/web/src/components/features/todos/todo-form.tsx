import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

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
		<form onSubmit={handleAddTodo} className="flex items-center gap-2 max-w-3xl">
			<Input
				value={newTodoText}
				onChange={(e) => setNewTodoText(e.target.value)}
				placeholder="Add a new task..."
				className="flex-1 rounded-none border-foreground font-light"
			/>
			<Button
				type="submit"
				disabled={!newTodoText.trim()}
				className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-light group px-4"
			>
				Add
				<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
			</Button>
		</form>
	);
}
