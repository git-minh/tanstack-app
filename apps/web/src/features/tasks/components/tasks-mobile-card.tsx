import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, MoreVertical, CheckCircle2, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task } from "../data/schema";
import { statuses, priorities, labels } from "../data/data";

interface TasksMobileCardProps {
	task: Task;
	isSelected: boolean;
	onToggleSelect: () => void;
	onEdit: () => void;
	onDelete: () => void;
	onCreateSubtask?: () => void;
}

export function TasksMobileCard({
	task,
	isSelected,
	onToggleSelect,
	onEdit,
	onDelete,
	onCreateSubtask,
}: TasksMobileCardProps) {
	const status = statuses.find((s) => s.value === task.status);
	const priority = priorities.find((p) => p.value === task.priority);
	const label = labels.find((l) => l.value === task.label);

	const isOverdue = task.dueDate && task.dueDate < Date.now() && 
		task.status !== "done" && task.status !== "canceled";

	const isCompleted = task.status === "done";

	return (
		<Card 
			className={cn(
				"p-4 space-y-3 transition-all",
				isSelected && "ring-2 ring-primary",
				isCompleted && "opacity-60"
			)}
		>
			{/* Header */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-start gap-3 flex-1 min-w-0">
					{/* Checkbox with larger touch target */}
					<div className="p-2 -m-2">
						<Checkbox
							checked={isSelected}
							onCheckedChange={onToggleSelect}
							aria-label={`Select ${task.title}`}
						/>
					</div>

					{/* Title and ID */}
					<div className="flex-1 min-w-0">
						<div className={cn(
							"font-semibold text-sm leading-tight mb-1",
							isCompleted && "line-through text-muted-foreground"
						)}>
							{task.title}
						</div>
						<div className="text-xs text-muted-foreground font-mono">
							{task.displayId}
						</div>
					</div>
				</div>

				{/* Actions dropdown with larger touch target */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button 
							variant="ghost" 
							size="sm"
							className="h-9 w-9 p-0 -mr-2"
						>
							<MoreVertical className="h-4 w-4" />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={onEdit}>
							Edit
						</DropdownMenuItem>
						{onCreateSubtask && (
							<DropdownMenuItem onClick={onCreateSubtask}>
								Add Subtask
							</DropdownMenuItem>
						)}
						<DropdownMenuItem onClick={() => navigator.clipboard.writeText(task.displayId)}>
							Copy ID
						</DropdownMenuItem>
						<DropdownMenuItem 
							onClick={onDelete}
							className="text-destructive"
						>
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Badges */}
			<div className="flex flex-wrap gap-2">
				{status && (
					<Badge variant="outline" className="text-xs">
						{status.icon && <status.icon className="mr-1 h-3 w-3" />}
						{status.label}
					</Badge>
				)}
				{priority && (
					<Badge 
						variant="secondary" 
						className={cn(
							"text-xs",
							priority.value === "critical" && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
							priority.value === "high" && "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
						)}
					>
						{priority.icon && <priority.icon className="mr-1 h-3 w-3" />}
						{priority.label}
					</Badge>
				)}
				{label && (
					<Badge className="text-xs">
						{label.label}
					</Badge>
				)}
			</div>

			{/* Due date */}
			{task.dueDate && (
				<div className={cn(
					"flex items-center gap-1.5 text-sm",
					isOverdue && "text-destructive font-medium"
				)}>
					<Calendar className="h-3.5 w-3.5" />
					<span>
						{formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
					</span>
				</div>
			)}

			{/* Description */}
			{task.description && (
				<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
					{task.description}
				</p>
			)}

			{/* Subtasks indicator */}
			{task.subRows && task.subRows.length > 0 && (
				<div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t">
					<CheckCircle2 className="h-3 w-3" />
					<span>{task.subRows.length} subtask{task.subRows.length !== 1 ? 's' : ''}</span>
				</div>
			)}
		</Card>
	);
}
