import { useState, useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { TodoItem } from "./todo-item";
import { TodoForm } from "./todo-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Trash2, CheckCircle2, Circle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";

export function TodoList() {
	const todosQuery = useSuspenseQuery(convexQuery(api.todos.getAll, {}));
	const statsQuery = useSuspenseQuery(convexQuery(api.todos.getTodoStats, {}));
	const todos = todosQuery.data;
	const stats = statsQuery.data;
	
	const [selectedIds, setSelectedIds] = useState<Set<Id<"todos">>>(new Set());
	const [showBulkActions, setShowBulkActions] = useState(false);
	
	const deleteCompleted = useMutation(api.todos.deleteCompleted);
	const deleteMany = useMutation(api.todos.deleteMany);
	
	const completedCount = todos?.filter(t => t.completed).length || 0;
	const activeCount = (todos?.length || 0) - completedCount;
	
	const toggleSelectAll = () => {
		if (selectedIds.size === todos?.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(todos?.map(t => t._id) || []));
		}
	};
	
	const toggleSelect = (id: Id<"todos">, checked: boolean) => {
		const newSelected = new Set(selectedIds);
		if (checked) {
			newSelected.add(id);
		} else {
			newSelected.delete(id);
		}
		setSelectedIds(newSelected);
	};
	
	const handleDeleteCompleted = async () => {
		try {
			await deleteCompleted();
			toast.success("Completed todos cleared");
		} catch (error) {
			console.error("Failed to delete completed todos:", error);
			toast.error("Failed to clear completed todos");
		}
	};
	
	const handleDeleteSelected = async () => {
		if (selectedIds.size === 0) return;
		try {
			await deleteMany({ ids: Array.from(selectedIds) });
			toast.success(`${selectedIds.size} todos deleted`);
			setSelectedIds(new Set());
			setShowBulkActions(false);
		} catch (error) {
			console.error("Failed to delete selected todos:", error);
			toast.error("Failed to delete selected todos");
		}
	};

	return (
		<div className="space-y-4">
			{/* Statistics */}
			{stats && todos && todos.length > 0 && (
				<div className="grid grid-cols-3 gap-4">
					<Card className="p-4">
						<div className="flex items-center space-x-2">
							<Circle className="h-5 w-5 text-muted-foreground" />
							<div>
								<p className="text-sm text-muted-foreground">Active</p>
								<p className="text-2xl font-bold">{activeCount}</p>
							</div>
						</div>
					</Card>
					<Card className="p-4">
						<div className="flex items-center space-x-2">
							<CheckCircle2 className="h-5 w-5 text-green-600" />
							<div>
								<p className="text-sm text-muted-foreground">Completed</p>
								<p className="text-2xl font-bold">{completedCount}</p>
							</div>
						</div>
					</Card>
					<Card className="p-4">
						<div className="flex items-center space-x-2">
							<TrendingUp className="h-5 w-5 text-blue-600" />
							<div>
								<p className="text-sm text-muted-foreground">Completion</p>
								<p className="text-2xl font-bold">{stats.completionRate}%</p>
							</div>
						</div>
					</Card>
				</div>
			)}
			
			{/* Add todo form */}
			<TodoForm />
			
			{/* Bulk actions toolbar */}
			{todos && todos.length > 0 && (
				<div className="flex items-center justify-between rounded-lg border p-2">
					<div className="flex items-center space-x-2">
						<Checkbox
							checked={showBulkActions}
							onCheckedChange={(checked) => {
								setShowBulkActions(checked as boolean);
								if (!checked) setSelectedIds(new Set());
							}}
						/>
						<span className="text-sm text-muted-foreground">
							{showBulkActions && selectedIds.size > 0 
								? `${selectedIds.size} selected`
								: "Select items"
							}
						</span>
						{showBulkActions && todos.length > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={toggleSelectAll}
							>
								{selectedIds.size === todos.length ? "Deselect all" : "Select all"}
							</Button>
						)}
					</div>
					<div className="flex items-center space-x-2">
						{showBulkActions && selectedIds.size > 0 && (
							<Button
								variant="destructive"
								size="sm"
								onClick={handleDeleteSelected}
							>
								<Trash2 className="h-4 w-4 mr-1" />
								Delete {selectedIds.size}
							</Button>
						)}
						{completedCount > 0 && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleDeleteCompleted}
							>
								Clear completed ({completedCount})
							</Button>
						)}
					</div>
				</div>
			)}
			
			{/* Todo list */}
			{todos?.length === 0 ? (
				<div className="py-8 text-center">
					<p className="text-muted-foreground">No todos yet. Add one above!</p>
				</div>
			) : (
				<ul className="space-y-2">
					{todos?.map((todo) => (
						<TodoItem
							key={todo._id}
							id={todo._id}
							text={todo.text}
							completed={todo.completed}
							selected={selectedIds.has(todo._id)}
							onSelect={(checked) => toggleSelect(todo._id, checked)}
							showSelect={showBulkActions}
						/>
					))}
				</ul>
			)}
			
			{/* Today's summary */}
			{stats && stats.todaysCompleted > 0 && (
				<div className="mt-4 p-4 rounded-lg bg-accent/50 text-center">
					<p className="text-sm text-muted-foreground">
						Great job! You've completed {stats.todaysCompleted} {stats.todaysCompleted === 1 ? 'todo' : 'todos'} today! 🎉
					</p>
				</div>
			)}
		</div>
	);
}
