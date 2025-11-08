import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import { Trash2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface TodoItemProps {
	id: Id<"todos">;
	text: string;
	completed: boolean;
	selected?: boolean;
	onSelect?: (checked: boolean) => void;
	showSelect?: boolean;
}

export function TodoItem({ 
	id, 
	text, 
	completed, 
	selected = false,
	onSelect,
	showSelect = false 
}: TodoItemProps) {
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
		<li className="flex items-center justify-between rounded-md border p-2 hover:bg-accent/50 transition-colors">
			<div className="flex items-center space-x-2 flex-grow">
				{showSelect ? (
					<Checkbox
						checked={selected}
						onCheckedChange={(checked) => onSelect?.(checked as boolean)}
						aria-label="Select todo"
					/>
				) : null}
				<Checkbox
					checked={completed}
					onCheckedChange={handleToggle}
					id={`todo-${id}`}
					aria-label="Toggle completion"
				/>
				{isEditing ? (
					<Input
						value={editText}
						onChange={(e) => setEditText(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSaveEdit();
							if (e.key === "Escape") handleCancelEdit();
						}}
						className="flex-grow h-7"
						autoFocus
					/>
				) : (
					<label
						htmlFor={`todo-${id}`}
						className={`flex-grow cursor-pointer ${
							completed ? "text-muted-foreground line-through" : ""
						}`}
						onDoubleClick={() => !completed && setIsEditing(true)}
					>
						{text}
					</label>
				)}
			</div>
			<div className="flex items-center space-x-1">
				{isEditing ? (
					<>
						<Button
							variant="ghost"
							size="icon"
							onClick={handleSaveEdit}
							aria-label="Save edit"
						>
							<Check className="h-4 w-4 text-green-600" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={handleCancelEdit}
							aria-label="Cancel edit"
						>
							<X className="h-4 w-4 text-red-600" />
						</Button>
					</>
				) : (
					<>
						{!completed && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsEditing(true)}
								aria-label="Edit todo"
							>
								<Edit2 className="h-4 w-4" />
							</Button>
						)}
						<Button
							variant="ghost"
							size="icon"
							onClick={handleDelete}
							aria-label="Delete todo"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</>
				)}
			</div>
		</li>
	);
}
