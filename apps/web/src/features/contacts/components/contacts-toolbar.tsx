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
import { type Contact } from "../data/schema";
import { statuses, categories } from "../data/data";

interface ContactsToolbarProps {
	table: Table<Contact>;
}

export function ContactsToolbar({ table }: ContactsToolbarProps) {
	const isFiltered = table.getState().columnFilters.length > 0;

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 items-center space-x-2">
				<Input
					placeholder="Search contacts..."
					value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
					onChange={(event) =>
						table.getColumn("name")?.setFilterValue(event.target.value)
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
				{table.getColumn("category") && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="h-8 border-dashed">
								Category
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-[200px]">
							<DropdownMenuLabel>Filter by category</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{categories.map((category) => {
								const isSelected = (
									table.getColumn("category")?.getFilterValue() as string[]
								)?.includes(category.value);

								return (
									<DropdownMenuCheckboxItem
										key={category.value}
										checked={isSelected}
										onCheckedChange={(checked) => {
											const filterValue = (table
												.getColumn("category")
												?.getFilterValue() as string[]) || [];
											const newFilterValue = checked
												? [...filterValue, category.value]
												: filterValue.filter((v) => v !== category.value);
											table
												.getColumn("category")
												?.setFilterValue(
													newFilterValue.length ? newFilterValue : undefined
												);
										}}
									>
										<div className="flex items-center">
											{category.icon && (
												<category.icon className="mr-2 h-4 w-4 text-muted-foreground" />
											)}
											<span>{category.label}</span>
										</div>
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
