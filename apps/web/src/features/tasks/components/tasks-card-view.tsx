import { useState } from "react";
import { TasksMobileCard } from "./tasks-mobile-card";
import { TasksEmptyState } from "./tasks-empty-state";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import type { Task } from "../data/schema";

interface TasksCardViewProps {
	data: Task[];
	onEditTask: (task: Task) => void;
	onDeleteTask: (id: string) => void;
	onCreateTask: () => void;
	onCreateSubtask?: (parentId: string) => void;
	onBulkStatusUpdate?: (ids: string[], status: string) => void;
	onBulkPriorityUpdate?: (ids: string[], priority: string) => void;
	onDeleteMany?: (ids: string[]) => void;
}

export function TasksCardView({
	data,
	onEditTask,
	onDeleteTask,
	onCreateTask,
	onCreateSubtask,
	onBulkStatusUpdate,
	onBulkPriorityUpdate,
	onDeleteMany,
}: TasksCardViewProps) {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [searchQuery, setSearchQuery] = useState("");

	// Filter tasks by search query
	const filteredData = searchQuery
		? data.filter((task) =>
				task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				task.displayId.toLowerCase().includes(searchQuery.toLowerCase())
		  )
		: data;

	const toggleSelect = (id: string) => {
		const newSelected = new Set(selectedIds);
		if (newSelected.has(id)) {
			newSelected.delete(id);
		} else {
			newSelected.add(id);
		}
		setSelectedIds(newSelected);
	};

	const selectAll = () => {
		if (selectedIds.size === filteredData.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(filteredData.map((t) => t._id)));
		}
	};

	const clearSelection = () => {
		setSelectedIds(new Set());
	};

	if (data.length === 0) {
		return <TasksEmptyState onCreateTask={onCreateTask} />;
	}

	return (
		<div className="space-y-4">
			{/* Mobile toolbar */}
			<div className="flex flex-col gap-2">
				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search tasks..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 pr-9"
					/>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery("")}
							className="absolute right-3 top-1/2 -translate-y-1/2"
						>
							<X className="h-4 w-4 text-muted-foreground" />
						</button>
					)}
				</div>

				{/* Select controls */}
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={selectAll}
						className="flex-1"
					>
						{selectedIds.size === filteredData.length ? "Deselect All" : "Select All"}
					</Button>
					{selectedIds.size > 0 && (
						<span className="text-sm text-muted-foreground">
							{selectedIds.size} selected
						</span>
					)}
				</div>
			</div>

			{/* Bulk actions bar */}
			{selectedIds.size > 0 && (
				<div className="flex flex-col gap-2 p-3 border rounded-lg bg-muted/50">
					<div className="text-sm font-medium">
						{selectedIds.size} task{selectedIds.size !== 1 ? 's' : ''} selected
					</div>
					<div className="flex flex-col gap-2">
						<Select
							onValueChange={(status) => {
								onBulkStatusUpdate?.(Array.from(selectedIds), status);
								clearSelection();
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Set status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="backlog">Backlog</SelectItem>
								<SelectItem value="todo">Todo</SelectItem>
								<SelectItem value="in progress">In Progress</SelectItem>
								<SelectItem value="done">Done</SelectItem>
								<SelectItem value="canceled">Canceled</SelectItem>
							</SelectContent>
						</Select>

						<Select
							onValueChange={(priority) => {
								onBulkPriorityUpdate?.(Array.from(selectedIds), priority);
								clearSelection();
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Set priority" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="low">Low</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="high">High</SelectItem>
								<SelectItem value="critical">Critical</SelectItem>
							</SelectContent>
						</Select>

						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={clearSelection}
								className="flex-1"
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={() => {
									onDeleteMany?.(Array.from(selectedIds));
									clearSelection();
								}}
								className="flex-1"
							>
								Delete {selectedIds.size}
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Cards list */}
			<div className="space-y-3">
				{filteredData.length > 0 ? (
					filteredData.map((task) => (
						<TasksMobileCard
							key={task._id}
							task={task}
							isSelected={selectedIds.has(task._id)}
							onToggleSelect={() => toggleSelect(task._id)}
							onEdit={() => onEditTask(task)}
							onDelete={() => onDeleteTask(task._id)}
							onCreateSubtask={
								onCreateSubtask ? () => onCreateSubtask(task._id) : undefined
							}
						/>
					))
				) : (
					<div className="text-center py-12 text-muted-foreground">
						<p>No tasks found for "{searchQuery}"</p>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setSearchQuery("")}
							className="mt-2"
						>
							Clear search
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
