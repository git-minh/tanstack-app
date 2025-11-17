import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TodoItemProps {
	id: Id<"todos">;
	text: string;
	completed: boolean;
}

export function TodoItem({ id, text, completed }: TodoItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editText, setEditText] = useState(text);

	const toggleTodo = useMutation(api.todos.toggle);
	const removeTodo = useMutation(api.todos.deleteTodo);
	const updateText = useMutation(api.todos.updateText);

	const handleToggle = async () => {
		try {
			await toggleTodo({ id, completed: !completed });
		} catch (error) {
			console.error("Failed to toggle todo:", error);
			toast.error("Failed to toggle todo");
		}
	};

	const handleDelete = async () => {
		try {
			await removeTodo({ id });
			toast.success("Todo deleted");
		} catch (error) {
			console.error("Failed to delete todo:", error);
			toast.error("Failed to delete todo");
		}
	};

	const handleSaveEdit = async () => {
		if (editText.trim() && editText !== text) {
			try {
				await updateText({ id, text: editText.trim() });
				toast.success("Todo updated");
			} catch (error) {
				console.error("Failed to update todo:", error);
				toast.error("Failed to update todo");
			}
		}
		setIsEditing(false);
		setEditText(text);
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
		setEditText(text);
	};

	return (
		<div className="group py-3 border-b border-border/30 last:border-0 hover:pl-4 transition-all duration-200 flex items-center gap-4">
			<Checkbox
				checked={completed}
				onCheckedChange={handleToggle}
				id={`todo-${id}`}
				className="rounded-none border-foreground flex-shrink-0"
			/>

			{isEditing ? (
				<Input
					value={editText}
					onChange={(e) => setEditText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleSaveEdit();
						if (e.key === "Escape") handleCancelEdit();
					}}
					onBlur={handleSaveEdit}
					className="flex-1 h-7 rounded-none border-foreground"
					autoFocus
				/>
			) : (
				<label
					htmlFor={`todo-${id}`}
					className={cn(
						"flex-1 cursor-pointer font-light text-sm",
						completed && "text-muted-foreground line-through"
					)}
					onDoubleClick={() => !completed && setIsEditing(true)}
				>
					{text}
				</label>
			)}

			<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
				{!isEditing && !completed && (
					<button
						onClick={() => setIsEditing(true)}
						className="text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-muted transition-colors"
					>
						Edit
					</button>
				)}
				{!isEditing && (
					<button
						onClick={handleDelete}
						className="text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-destructive/10 hover:text-destructive transition-colors"
					>
						Delete
					</button>
				)}
			</div>
		</div>
	);
}
