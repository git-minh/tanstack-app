import { useState } from "react";
import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
	type ExpandedState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	getExpandedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { type Project } from "../data/schema";
import { cn } from "@/lib/utils";

interface ProjectsTableProps {
	data: Project[];
	columns: ColumnDef<Project>[];
	onDeleteProject: (id: string) => void;
	onDeleteMany: (ids: string[]) => void;
	onEditProject: (project: Project) => void;
	onArchiveProject?: (id: string) => void;
	onCreateSubproject: (parentId: string) => void;
}

export function ProjectsTable({
	data,
	columns,
	onDeleteProject,
	onDeleteMany,
	onEditProject,
	onArchiveProject,
	onCreateSubproject,
}: ProjectsTableProps) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});
	const [expanded, setExpanded] = useState<ExpandedState>({});

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getSubRows: (row) => row.subRows,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		onExpandedChange: setExpanded,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			expanded,
		},
		meta: {
			deleteProject: onDeleteProject,
			editProject: onEditProject,
			archiveProject: onArchiveProject,
			createSubproject: onCreateSubproject,
		},
	});

	const selectedRows = table.getFilteredSelectedRowModel().rows;

	return (
		<div className="space-y-4">
			{selectedRows.length > 0 && (
				<div className="flex items-center justify-end">
					<Button
						variant="destructive"
						size="sm"
						onClick={() => {
							const ids = selectedRows.map((row) => row.original._id);
							onDeleteMany(ids);
							table.resetRowSelection();
						}}
					>
						Delete {selectedRows.length} selected
					</Button>
				</div>
			)}

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
											  )}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => {
								const level = row.original.level || 0;
								const isParent = row.original.subRows && row.original.subRows.length > 0;
								
								return (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}
										className={cn(
											"border-b transition-colors",
											level === 0 && "bg-accent/5 hover:bg-accent/10 border-l-4 border-l-primary/20",
											level === 1 && "bg-muted/20 hover:bg-muted/30 border-l-2 border-l-muted-foreground/30",
											level >= 2 && "bg-background hover:bg-muted/20 border-l border-l-border",
											isParent && level === 0 && "font-medium"
										)}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</TableCell>
										))}
									</TableRow>
								);
							})
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No projects found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex items-center justify-between space-x-2 py-4">
				<div className="text-sm text-muted-foreground">
					{selectedRows.length} of {table.getFilteredRowModel().rows.length}{" "}
					row(s) selected.
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
						aria-label="Go to previous page"
					>
						Previous
					</Button>
					<div className="flex items-center gap-1 text-sm text-muted-foreground">
						<span className="hidden sm:inline">Page</span>
						<span className="font-medium text-foreground">
							{table.getState().pagination.pageIndex + 1}
						</span>
						<span>of</span>
						<span className="font-medium text-foreground">
							{table.getPageCount()}
						</span>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
						aria-label="Go to next page"
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
}
