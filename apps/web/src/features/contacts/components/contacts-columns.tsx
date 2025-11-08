import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Mail, Phone } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Contact } from "../data/schema";
import { statuses, categories } from "../data/data";

export const columns: ColumnDef<Contact>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
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
		accessorKey: "displayId",
		header: "ID",
		cell: ({ row }) => {
			const contact = row.original;
			return (
				<Link
					to={`/contacts/${contact.displayId}`}
					className="font-mono text-xs font-medium text-primary hover:underline"
				>
					{contact.displayId}
				</Link>
			);
		},
	},
	{
		id: "name",
		accessorFn: (row) => `${row.firstName} ${row.lastName}`,
		header: "Name",
		cell: ({ row }) => {
			const contact = row.original;
			return (
				<div className="flex flex-col">
					<span className="font-medium">
						{contact.firstName} {contact.lastName}
					</span>
					{contact.title && contact.company && (
						<span className="text-sm text-muted-foreground">
							{contact.title} at {contact.company}
						</span>
					)}
				</div>
			);
		},
	},
	{
		accessorKey: "email",
		header: "Email",
		cell: ({ row }) => {
			const email = row.getValue("email") as string;
			return (
				<a
					href={`mailto:${email}`}
					className="flex items-center gap-2 text-blue-600 hover:underline"
				>
					<Mail className="h-4 w-4" />
					{email}
				</a>
			);
		},
	},
	{
		accessorKey: "phone",
		header: "Phone",
		cell: ({ row }) => {
			const phone = row.original.phone;
			if (!phone) return <span className="text-muted-foreground">—</span>;
			return (
				<a
					href={`tel:${phone}`}
					className="flex items-center gap-2 text-blue-600 hover:underline"
				>
					<Phone className="h-4 w-4" />
					{phone}
				</a>
			);
		},
	},
	{
		accessorKey: "company",
		header: "Company",
		cell: ({ row }) => {
			const company = row.original.company;
			if (!company) return <span className="text-muted-foreground">—</span>;
			return <span>{company}</span>;
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
		accessorKey: "category",
		header: "Category",
		cell: ({ row }) => {
			const category = categories.find(
				(cat) => cat.value === row.getValue("category")
			);
			if (!category) return null;
			return <Badge variant="outline">{category.label}</Badge>;
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		id: "actions",
		cell: ({ row, table }) => {
			const contact = row.original;
			// Get functions from table meta
			const meta = table.options.meta as {
				deleteContact?: (id: string) => void;
				editContact?: (contact: Contact) => void;
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
						<DropdownMenuItem onClick={() => meta.editContact?.(contact)}>
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => {
								navigator.clipboard.writeText(contact.displayId);
							}}
						>
							Copy ID
						</DropdownMenuItem>
						<DropdownMenuItem
							className="text-destructive"
							onClick={() => meta.deleteContact?.(contact._id)}
						>
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
