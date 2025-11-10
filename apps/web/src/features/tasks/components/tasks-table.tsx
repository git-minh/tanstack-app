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
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	TouchSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragStartEvent,
	DragOverlay,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type Task } from "../data/schema";
import { TasksToolbar } from "./tasks-toolbar";
import { TasksEmptyState } from "./tasks-empty-state";
import { SortableTaskRow } from "./sortable-task-row";
import { DragOverlayTask } from "./drag-overlay-task";
import { cn } from "@/lib/utils";

interface TasksTableProps {
	data: Task[];
	columns: ColumnDef<Task>[];
	onDeleteTask: (id: string) => void;
	onDeleteMany: (ids: string[]) => void;
	onEditTask: (task: Task) => void;
	onCreateTask: () => void;
	onCreateSubtask?: (parentTaskId: string) => void;
	onBulkStatusUpdate?: (ids: string[], status: string) => void;
	onBulkPriorityUpdate?: (ids: string[], priority: string) => void;
	onReorderTask?: (taskId: string, overTaskId: string) => void;
	enablePagination?: boolean;
}

export function TasksTable({
	data,
	columns,
	onDeleteTask,
	onDeleteMany,
	onEditTask,
	onCreateTask,
	onCreateSubtask,
	onBulkStatusUpdate,
	onBulkPriorityUpdate,
	onReorderTask,
	enablePagination = true,
}: TasksTableProps) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});
	const [expanded, setExpanded] = useState<ExpandedState>({});
	const [activeId, setActiveId] = useState<string | null>(null);

	// Drag-and-drop sensors
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 250,
				tolerance: 5,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		
		if (over && active.id !== over.id) {
			onReorderTask?.(active.id as string, over.id as string);
		}
		
		setActiveId(null);
	};

	const handleDragCancel = () => {
		setActiveId(null);
	};

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		...(enablePagination && { getPaginationRowModel: getPaginationRowModel() }),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getSubRows: (row) => row.subRows,
		paginateExpandedRows: false, // Don't paginate expanded subtasks - show all on parent's page
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
			deleteTask: onDeleteTask,
			editTask: onEditTask,
			createSubtask: onCreateSubtask,
		},
	});

	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const isFiltered = table.getState().columnFilters.length > 0;
	const filteredRowCount = table.getFilteredRowModel().rows.length;

	// Get task IDs for sortable context
	const taskIds = data.map((task) => task._id);

	// Find active task for drag overlay
	const activeTask = activeId ? data.find((task) => task._id === activeId) : null;

	// Show empty state if no data
	if (data.length === 0 && !isFiltered) {
		return <TasksEmptyState onCreateTask={onCreateTask} />;
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
		>
			<div className="space-y-4">
			{/* ARIA live region for screen readers */}
			<div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
				{isFiltered 
					? `Showing ${filteredRowCount} filtered ${filteredRowCount === 1 ? 'task' : 'tasks'}`
					: `Showing ${data.length} ${data.length === 1 ? 'task' : 'tasks'}`
				}
			</div>
			{selectedRows.length > 0 && (
				<div className="sr-only" role="alert" aria-live="assertive">
					{selectedRows.length} {selectedRows.length === 1 ? 'task' : 'tasks'} selected
				</div>
			)}

			<div className="flex items-center justify-between">
				<TasksToolbar table={table} />
			</div>
			{selectedRows.length > 0 && (
				<div className="flex items-center justify-between gap-2 p-2 border rounded-lg bg-muted/50">
					<div className="text-sm text-muted-foreground">
						{selectedRows.length} {selectedRows.length === 1 ? 'task' : 'tasks'} selected
					</div>
					<div className="flex items-center gap-2">
						<Select
							onValueChange={(status) => {
								const ids = selectedRows.map((row) => row.original._id);
								onBulkStatusUpdate?.(ids, status);
								table.resetRowSelection();
							}}
						>
							<SelectTrigger className="h-8 w-[140px]">
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
								const ids = selectedRows.map((row) => row.original._id);
								onBulkPriorityUpdate?.(ids, priority);
								table.resetRowSelection();
							}}
						>
							<SelectTrigger className="h-8 w-[140px]">
								<SelectValue placeholder="Set priority" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="low">Low</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="high">High</SelectItem>
								<SelectItem value="critical">Critical</SelectItem>
							</SelectContent>
						</Select>

						<Button
							variant="destructive"
							size="sm"
							onClick={() => {
								const ids = selectedRows.map((row) => row.original._id);
								onDeleteMany(ids);
								table.resetRowSelection();
							}}
						>
							Delete {selectedRows.length}
						</Button>
					</div>
				</div>
			)}

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{/* Add drag handle header */}
								<TableHead className="w-[40px]"></TableHead>
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
						<SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => {
									const level = row.original.level || 0;
									const isParent = row.original.subRows && row.original.subRows.length > 0;
									
									return (
										<SortableTaskRow
											key={row.id}
											row={row}
											level={level}
											isParent={isParent}
										/>
									);
								})
							) : (
								<TableRow>
									<TableCell colSpan={columns.length + 1} className="p-0">
										<TasksEmptyState onCreateTask={onCreateTask} isFiltered={isFiltered} />
									</TableCell>
								</TableRow>
							)}
						</SortableContext>
					</TableBody>
				</Table>
			</div>

			{/* Drag overlay */}
			<DragOverlay>
				{activeTask ? <DragOverlayTask task={activeTask} /> : null}
			</DragOverlay>

			<div className="flex items-center justify-between space-x-2 py-4">
				<div className="text-sm text-muted-foreground">
					{selectedRows.length} of {table.getFilteredRowModel().rows.length}{" "}
					row(s) selected.
					{!enablePagination && data.length > 0 && (
						<span className="ml-2 text-muted-foreground/80">
							(Showing all {data.length} {data.length === 1 ? "task" : "tasks"})
						</span>
					)}
				</div>
				{enablePagination && (
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
				)}
			</div>
			</div>
		</DndContext>
	);
}
