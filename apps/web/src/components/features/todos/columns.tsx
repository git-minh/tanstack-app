import { ColumnDef } from "@tanstack/react-table";
import { Doc } from "@tanstack/backend/convex/_generated/dataModel";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";

type Todo = Doc<"todos">;

export const columns: ColumnDef<Todo>[] = [
	{
		id: "completed",
		header: "Status",
		cell: ({ row }) => {
			const todo = row.original;
			const toggleTodo = useMutation(api.todos.toggle);

			return (
				<Checkbox
					checked={todo.completed}
					onCheckedChange={(checked) => {
						toggleTodo({
							id: todo._id,
							completed: Boolean(checked),
						});
					}}
					aria-label="Toggle todo completion"
				/>
			);
		},
		enableSorting: false,
	},
	{
		accessorKey: "text",
		header: "Task",
		cell: ({ row }) => {
			const text = row.getValue("text") as string;
			const completed = row.original.completed;
			return (
				<span className={completed ? "line-through text-muted-foreground" : ""}>
					{text}
				</span>
			);
		},
	},
	{
		id: "status",
		header: "Completion",
		cell: ({ row }) => {
			const completed = row.original.completed;
			return (
				<Badge variant={completed ? "default" : "secondary"}>
					{completed ? "Completed" : "Active"}
				</Badge>
			);
		},
		filterFn: (row, id, value) => {
			// Custom filter function for status
			const completed = row.original.completed;
			if (value === "active") return !completed;
			if (value === "completed") return completed;
			return true; // "all" shows everything
		},
		enableSorting: false,
	},
	{
		id: "actions",
		header: "",
		cell: ({ row }) => {
			const todo = row.original;
			const deleteTodo = useMutation(api.todos.deleteTodo);

			return (
				<Button
					variant="ghost"
					size="icon"
					onClick={() => deleteTodo({ id: todo._id })}
					aria-label="Delete todo"
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			);
		},
		enableSorting: false,
	},
];
