import { useState } from "react";
import {
	type ColumnDef,
	type SortingState,
	type ColumnFiltersState,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
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
import { type Contact } from "../data/schema";
import { ContactsToolbar } from "./contacts-toolbar";
import { ContactsEmptyState } from "./contacts-empty-state";

interface ContactsTableProps {
	data: Contact[];
	columns: ColumnDef<Contact>[];
	onDeleteContact: (id: string) => void;
	onDeleteMany: (ids: string[]) => void;
	onEditContact: (contact: Contact) => void;
	onCreateContact: () => void;
}

export function ContactsTable({
	data,
	columns,
	onDeleteContact,
	onDeleteMany,
	onEditContact,
	onCreateContact,
}: ContactsTableProps) {
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
			deleteContact: onDeleteContact,
			editContact: onEditContact,
		},
	});

	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const isFiltered = table.getState().columnFilters.length > 0;

	// Show empty state if no data
	if (data.length === 0 && !isFiltered) {
		return <ContactsEmptyState onCreateContact={onCreateContact} />;
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<ContactsToolbar table={table} />
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
									<ContactsEmptyState
										onCreateContact={onCreateContact}
										isFiltered={isFiltered}
									/>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex items-center justify-between space-x-2 py-4">
				<div className="flex-1 text-sm text-muted-foreground">
					{selectedRows.length} of {table.getFilteredRowModel().rows.length}{" "}
					row(s) selected.
				</div>
				<div className="space-x-2">
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
