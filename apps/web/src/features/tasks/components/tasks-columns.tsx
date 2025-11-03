import { type ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Task } from "../data/schema";
import { statuses, priorities, labels } from "../data/data";

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
		accessorKey: "_id",
		header: "ID",
		cell: ({ row }) => <div className="w-[80px]">{row.getValue("_id")}</div>,
	},
	{
		accessorKey: "title",
		header: "Title",
		cell: ({ row }) => {
			const label = labels.find((label) => label.value === row.original.label);
			return (
				<div className="flex space-x-2">
					{label && <Badge variant="outline">{label.label}</Badge>}
					<span className="max-w-[500px] truncate font-medium">
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
						<DropdownMenuItem
							onClick={() => {
								navigator.clipboard.writeText(task._id);
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
