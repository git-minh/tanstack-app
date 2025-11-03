import { useState } from "react";
import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
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
import { type Task } from "../data/schema";
import { TasksToolbar } from "./tasks-toolbar";
import { TasksEmptyState } from "./tasks-empty-state";

interface TasksTableProps {
	data: Task[];
	columns: ColumnDef<Task>[];
	onDeleteTask: (id: string) => void;
	onDeleteMany: (ids: string[]) => void;
	onEditTask: (task: Task) => void;
	onCreateTask: () => void;
}

export function TasksTable({
	data,
	columns,
	onDeleteTask,
	onDeleteMany,
	onEditTask,
	onCreateTask,
}: TasksTableProps) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
		meta: {
			deleteTask: onDeleteTask,
			editTask: onEditTask,
		},
	});

	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const isFiltered = table.getState().columnFilters.length > 0;

	// Show empty state if no data
	if (data.length === 0 && !isFiltered) {
		return <TasksEmptyState onCreateTask={onCreateTask} />;
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<TasksToolbar table={table} />
			</div>
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
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
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
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="p-0">
									<TasksEmptyState onCreateTask={onCreateTask} isFiltered={isFiltered} />
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
				<div className="flex space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
}
