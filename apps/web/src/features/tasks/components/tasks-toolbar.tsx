import { type Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Task } from "../data/schema";
import { priorities, statuses, labels } from "../data/data";

interface TasksToolbarProps {
	table: Table<Task>;
}

export function TasksToolbar({ table }: TasksToolbarProps) {
	const isFiltered = table.getState().columnFilters.length > 0;

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 items-center space-x-2">
				<Input
					placeholder="Filter tasks..."
					value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
					onChange={(event) =>
						table.getColumn("title")?.setFilterValue(event.target.value)
					}
					className="h-8 w-[150px] lg:w-[250px]"
				/>
				{table.getColumn("status") && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="h-8 border-dashed">
								Status
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-[200px]">
							<DropdownMenuLabel>Filter by status</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{statuses.map((status) => {
								const isSelected = (
									table.getColumn("status")?.getFilterValue() as string[]
								)?.includes(status.value);

								return (
									<DropdownMenuCheckboxItem
										key={status.value}
										checked={isSelected}
										onCheckedChange={(checked) => {
											const filterValue = (table
												.getColumn("status")
												?.getFilterValue() as string[]) || [];
											const newFilterValue = checked
												? [...filterValue, status.value]
												: filterValue.filter((v) => v !== status.value);
											table
												.getColumn("status")
												?.setFilterValue(
													newFilterValue.length ? newFilterValue : undefined
												);
										}}
									>
										<div className="flex items-center">
											{status.icon && (
												<status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
											)}
											<span>{status.label}</span>
										</div>
									</DropdownMenuCheckboxItem>
								);
							})}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
				{table.getColumn("priority") && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="h-8 border-dashed">
								Priority
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-[200px]">
							<DropdownMenuLabel>Filter by priority</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{priorities.map((priority) => {
								const isSelected = (
									table.getColumn("priority")?.getFilterValue() as string[]
								)?.includes(priority.value);

								return (
									<DropdownMenuCheckboxItem
										key={priority.value}
										checked={isSelected}
										onCheckedChange={(checked) => {
											const filterValue = (table
												.getColumn("priority")
												?.getFilterValue() as string[]) || [];
											const newFilterValue = checked
												? [...filterValue, priority.value]
												: filterValue.filter((v) => v !== priority.value);
											table
												.getColumn("priority")
												?.setFilterValue(
													newFilterValue.length ? newFilterValue : undefined
												);
										}}
									>
										<div className="flex items-center">
											{priority.icon && (
												<priority.icon className="mr-2 h-4 w-4 text-muted-foreground" />
											)}
											<span>{priority.label}</span>
										</div>
									</DropdownMenuCheckboxItem>
								);
							})}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
				{table.getColumn("label") && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="h-8 border-dashed">
								Label
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-[200px]">
							<DropdownMenuLabel>Filter by label</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{labels.map((label) => {
								const column = table.getColumn("title");
								if (!column) return null;

								// Get label from the original row data
								const isSelected = table
									.getFilteredRowModel()
									.rows.some((row) => row.original.label === label.value);

								return (
									<DropdownMenuCheckboxItem
										key={label.value}
										checked={isSelected}
										onCheckedChange={(checked) => {
											// Custom filter implementation for label
											const currentFilter =
												(column.getFilterValue() as string) || "";
											if (checked) {
												// This is a simple text-based approach
												// You might need to implement custom filtering
												column.setFilterValue(label.label);
											} else {
												column.setFilterValue("");
											}
										}}
									>
										<span>{label.label}</span>
									</DropdownMenuCheckboxItem>
								);
							})}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
				{isFiltered && (
					<Button
						variant="ghost"
						onClick={() => table.resetColumnFilters()}
						className="h-8 px-2 lg:px-3"
					>
						Reset
						<X className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="sm" className="ml-auto h-8">
						Columns
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-[150px]">
					<DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{table
						.getAllColumns()
						.filter(
							(column) =>
								typeof column.accessorFn !== "undefined" && column.getCanHide()
						)
						.map((column) => {
							return (
								<DropdownMenuCheckboxItem
									key={column.id}
									className="capitalize"
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
								>
									{column.id}
								</DropdownMenuCheckboxItem>
							);
						})}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
