import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ChevronRight, ChevronDown, FolderOpen, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Task } from "../data/schema";
import { statuses, priorities, labels } from "../data/data";
import { hasDescendants } from "../utils/hierarchy";
import { cn } from "@/lib/utils";

export const columns: ColumnDef<Task>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && "indeterminate")
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		id: "expand",
		header: () => null,
		cell: ({ row }) => {
			const canExpand = row.getCanExpand();
			const isExpanded = row.getIsExpanded();
			const level = row.original.level || 0;
			const isParent = hasDescendants(row.original);

			return (
				<div
					className="flex items-center relative"
					style={{ paddingLeft: `${level * 32}px` }}
				>
					{/* Hierarchy connector lines */}
					{level > 0 && (
						<>
							{/* Vertical line from parent */}
							<div 
								className="absolute left-0 top-0 bottom-0 w-px bg-border"
								style={{ left: `${(level - 1) * 32 + 16}px` }}
							/>
							{/* Horizontal connector */}
							<div 
								className="absolute top-1/2 w-4 h-px bg-border"
								style={{ left: `${(level - 1) * 32 + 16}px` }}
							/>
						</>
					)}
					
					{canExpand ? (
						<button
							type="button"
							onClick={row.getToggleExpandedHandler()}
							className={cn(
								"p-1.5 hover:bg-accent rounded-full transition-all mr-2 z-10",
								"border border-transparent hover:border-border",
								isExpanded && "bg-accent/50"
							)}
							aria-label={isExpanded ? "Collapse" : "Expand"}
						>
							{isExpanded ? (
								<ChevronDown className="h-4 w-4 transition-transform" />
							) : (
								<ChevronRight className="h-4 w-4 transition-transform" />
							)}
						</button>
					) : level > 0 ? (
						<div className="w-8 mr-2 flex items-center justify-center z-10">
							<FileText className="h-3.5 w-3.5 text-muted-foreground" />
						</div>
					) : isParent ? (
						<div className="w-8 mr-2 flex items-center justify-center z-10">
							<FolderOpen className="h-4 w-4 text-primary/60" />
						</div>
					) : (
						<div className="w-8 mr-2" />
					)}
				</div>
			);
		},
		enableSorting: false,
		enableHiding: false,
		size: 80,
	},
	{
		accessorKey: "displayId",
		header: "ID",
		cell: ({ row }) => {
			const task = row.original;
			const isSubtask = task.level > 0;

			return (
				<div className="flex items-center gap-2">
					{isSubtask && (
						<Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
							L{task.level}
						</Badge>
					)}
					<Link
						to={`/tasks/${task.displayId}`}
						className="font-mono text-xs font-medium text-primary hover:underline"
					>
						{task.displayId}
					</Link>
				</div>
			);
		},
	},
	{
		accessorKey: "title",
		header: "Title",
		cell: ({ row }) => {
			const task = row.original;
			const label = labels.find((l) => l.value === task.label);
			const isParent = hasDescendants(task);
			const isRoot = task.level === 0;
			const level = task.level || 0;

			return (
				<div className="flex items-center space-x-2">
					{label && <Badge variant="outline" className="text-xs">{label.label}</Badge>}
					{isParent && (
						<Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5">
							<FolderOpen className="h-2.5 w-2.5 mr-1" />
							{task.subRows?.length || 0}
						</Badge>
					)}
					<span
						className={cn(
							"max-w-[500px] truncate",
							isRoot && "font-semibold text-foreground",
							level === 1 && "font-medium text-foreground/95",
							level >= 2 && "font-normal text-muted-foreground"
						)}
					>
						{row.getValue("title")}
					</span>
				</div>
			);
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = statuses.find(
				(status) => status.value === row.getValue("status")
			);
			if (!status) return null;
			return (
				<div className="flex items-center">
					{status.icon && (
						<status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
					)}
					<span>{status.label}</span>
				</div>
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "priority",
		header: "Priority",
		cell: ({ row }) => {
			const priority = priorities.find(
				(priority) => priority.value === row.getValue("priority")
			);
			if (!priority) return null;
			return (
				<div className="flex items-center">
					{priority.icon && (
						<priority.icon className="mr-2 h-4 w-4 text-muted-foreground" />
					)}
					<span>{priority.label}</span>
				</div>
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "dueDate",
		header: "Due Date",
		cell: ({ row }) => {
			const dueDate = row.original.dueDate;
			if (!dueDate) return <span className="text-muted-foreground">—</span>;

			const isPast = dueDate < Date.now();
			const isCompleted = row.original.status === "done" || row.original.status === "canceled";

			return (
				<div className={isPast && !isCompleted ? "text-destructive font-medium" : ""}>
					{formatDistanceToNow(new Date(dueDate), { addSuffix: true })}
				</div>
			);
		},
	},
	{
		accessorKey: "description",
		header: "Description",
		cell: ({ row }) => {
			const description = row.original.description;
			if (!description) return <span className="text-muted-foreground">—</span>;
			return (
				<div className="max-w-[300px] truncate text-sm text-muted-foreground" title={description}>
					{description}
				</div>
			);
		},
	},
	{
		id: "actions",
		cell: ({ row, table }) => {
			const task = row.original;
			// Get functions from table meta
			const meta = table.options.meta as {
				deleteTask?: (id: string) => void;
				editTask?: (task: Task) => void;
				createSubtask?: (parentTaskId: string) => void;
			};

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => meta.editTask?.(task)}>
							Edit
						</DropdownMenuItem>
						{meta.createSubtask && (
							<DropdownMenuItem onClick={() => meta.createSubtask?.(task._id)}>
								Add Subtask
							</DropdownMenuItem>
						)}
						<DropdownMenuItem
							onClick={() => {
								navigator.clipboard.writeText(task.displayId);
							}}
						>
							Copy ID
						</DropdownMenuItem>
						<DropdownMenuItem
							className="text-destructive"
							onClick={() => meta.deleteTask?.(task._id)}
						>
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
