import { Table } from "@tanstack/react-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TodoForm } from "./todo-form";

interface DataTableToolbarProps<TData> {
	table: Table<TData>;
}

export function DataTableToolbar<TData>({
	table,
}: DataTableToolbarProps<TData>) {
	return (
		<div className="flex flex-col gap-4">
			{/* Add Todo Form */}
			<TodoForm />

			{/* Filter Dropdown */}
			<div className="flex items-center gap-2">
				<span className="text-sm font-medium">Filter:</span>
				<Select
					defaultValue="all"
					onValueChange={(value) => {
						// Use a custom filter ID that we'll define in the data-table
						if (value === "all") {
							table.getColumn("status")?.setFilterValue(undefined);
						} else {
							table.getColumn("status")?.setFilterValue(value);
						}
					}}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Tasks</SelectItem>
						<SelectItem value="active">Active Only</SelectItem>
						<SelectItem value="completed">Completed Only</SelectItem>
					</SelectContent>
				</Select>
				<span className="text-sm text-muted-foreground">
					{table.getFilteredRowModel().rows.length} task(s)
				</span>
			</div>
		</div>
	);
}
