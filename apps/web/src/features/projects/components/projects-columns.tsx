import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ChevronRight, ChevronDown, FolderOpen, FileText } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Project } from "../data/schema";
import { projectStatuses, projectPriorities } from "../data/data";
import { cn } from "@/lib/utils";

const hasDescendants = (project: Project) => {
	return project.subRows && project.subRows.length > 0;
};

export const columns: ColumnDef<Project>[] = [
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
							<div 
								className="absolute left-0 top-0 bottom-0 w-px bg-border"
								style={{ left: `${(level - 1) * 32 + 16}px` }}
							/>
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
			const project = row.original;
			const isSubProject = project.level > 0;

			return (
				<div className="flex items-center gap-2">
					{isSubProject && (
						<Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
							L{project.level}
						</Badge>
					)}
					<Link
						to={`/projects/${project.displayId}`}
						className="font-mono text-xs font-medium text-primary hover:underline"
					>
						{project.displayId}
					</Link>
				</div>
			);
		},
	},
	{
		accessorKey: "name",
		header: "Project Name",
		cell: ({ row }) => {
			const project = row.original;
			const isParent = hasDescendants(project);
			const isRoot = project.level === 0;
			const level = project.level || 0;

			return (
				<div className="flex items-center space-x-2">
					{project.color && (
						<div 
							className="w-3 h-3 rounded-full border" 
							style={{ backgroundColor: project.color }}
						/>
					)}
					{isParent && (
						<Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5">
							<FolderOpen className="h-2.5 w-2.5 mr-1" />
							{project.subRows?.length || 0}
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
						{row.getValue("name")}
					</span>
				</div>
			);
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = projectStatuses.find(
				(status) => status.value === row.getValue("status")
			);
			if (!status) return null;
			return (
				<div className="flex items-center">
					{status.icon && (
						<status.icon className={cn("mr-2 h-4 w-4", status.color)} />
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
			const priority = projectPriorities.find(
				(priority) => priority.value === row.getValue("priority")
			);
			if (!priority) return null;
			return (
				<div className="flex items-center">
					{priority.icon && (
						<priority.icon className={cn("mr-2 h-4 w-4", priority.color)} />
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
		accessorKey: "startDate",
		header: "Start Date",
		cell: ({ row }) => {
			const startDate = row.original.startDate;
			if (!startDate) return <span className="text-muted-foreground">—</span>;
			return (
				<div className="text-sm">
					{format(new Date(startDate), "MMM d, yyyy")}
				</div>
			);
		},
	},
	{
		accessorKey: "endDate",
		header: "End Date",
		cell: ({ row }) => {
			const endDate = row.original.endDate;
			if (!endDate) return <span className="text-muted-foreground">—</span>;

			const isPast = endDate < Date.now();
			const isCompleted = row.original.status === "completed" || row.original.status === "archived";

			return (
				<div className={cn(
					"text-sm",
					isPast && !isCompleted && "text-destructive font-medium"
				)}>
					{format(new Date(endDate), "MMM d, yyyy")}
					{isPast && !isCompleted && (
						<span className="block text-xs">Overdue</span>
					)}
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
			const project = row.original;
			const meta = table.options.meta as {
				deleteProject?: (id: string) => void;
				editProject?: (project: Project) => void;
				archiveProject?: (id: string) => void;
				createSubproject?: (parentId: string) => void;
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
						<DropdownMenuItem onClick={() => meta.editProject?.(project)}>
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => meta.createSubproject?.(project._id)}>
							Create Subproject
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => {
								navigator.clipboard.writeText(project.displayId);
							}}
						>
							Copy ID
						</DropdownMenuItem>
						{project.status !== "archived" && (
							<DropdownMenuItem onClick={() => meta.archiveProject?.(project._id)}>
								Archive
							</DropdownMenuItem>
						)}
						<DropdownMenuItem
							className="text-destructive"
							onClick={() => meta.deleteProject?.(project._id)}
						>
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
