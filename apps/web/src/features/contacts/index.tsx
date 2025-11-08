import { Suspense, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContactsTable } from "./components/contacts-table";
import { columns } from "./components/contacts-columns";
import { ContactFormDialog } from "./components/contact-form-dialog";
import { ContactsStats } from "./components/contacts-stats";
import { ContactsSkeleton } from "./components/contacts-skeleton";
import { UserPlus, Filter, Users, UserCheck, UserX, Building, Mail, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Contact } from "./data/schema";

export function Contacts() {
	const [filterView, setFilterView] = useState<"all" | "byStatus" | "byCategory" | "byFilters" | "byEmail">("all");
	const [statusFilter, setStatusFilter] = useState<string | undefined>();
	const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
	const [emailFilter, setEmailFilter] = useState<string>("");
	
	// Main contacts query
	const { data: allContacts } = useSuspenseQuery(
		convexQuery(api.contacts.getAll, {})
	);
	
	// Filtered queries based on filter view
	const statusContacts = useQuery(
		api.contacts.getByStatus,
		filterView === "byStatus" && statusFilter ? { status: statusFilter } : "skip"
	);
	const categoryContacts = useQuery(
		api.contacts.getByCategory,
		filterView === "byCategory" && categoryFilter ? { category: categoryFilter } : "skip"
	);
	const filteredContacts = useQuery(
		api.contacts.getByFilters,
		filterView === "byFilters" && (statusFilter || categoryFilter) 
			? { status: statusFilter, category: categoryFilter }
			: "skip"
	);
	const emailContacts = useQuery(
		api.contacts.searchByEmail,
		filterView === "byEmail" && emailFilter.includes("@") ? { email: emailFilter } : "skip"
	);
	
	const createContact = useMutation(api.contacts.create);
	const updateContact = useMutation(api.contacts.update);
	const deleteContact = useMutation(api.contacts.remove);
	const deleteMany = useMutation(api.contacts.removeMany);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingContact, setEditingContact] = useState<Contact | undefined>();
	const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

	const handleCreateContact = () => {
		setEditingContact(undefined);
		setDialogMode("create");
		setDialogOpen(true);
	};

	const handleEditContact = (contact: Contact) => {
		setEditingContact(contact);
		setDialogMode("edit");
		setDialogOpen(true);
	};

	const handleSubmitContact = async (values: {
		firstName: string;
		lastName: string;
		email: string;
		phone?: string;
		company?: string;
		title?: string;
		department?: string;
		website?: string;
		address?: string;
		notes?: string;
		status: string;
		category: string;
	}) => {
		try {
			if (dialogMode === "create") {
				await createContact(values);
				toast.success("Contact added successfully");
			} else {
				if (!editingContact) return;
				await updateContact({
					id: editingContact._id as any,
					...values,
				});
				toast.success("Contact updated successfully");
			}
		} catch (error) {
			toast.error(`Failed to ${dialogMode} contact`);
			console.error(error);
		}
	};

	const handleDeleteContact = async (id: string) => {
		try {
			await deleteContact({ id: id as any });
			toast.success("Contact deleted successfully");
		} catch (error) {
			toast.error("Failed to delete contact");
			console.error(error);
		}
	};

	const handleDeleteMany = async (ids: string[]) => {
		try {
			await deleteMany({ ids: ids as any });
			toast.success(`${ids.length} contacts deleted successfully`);
		} catch (error) {
			toast.error("Failed to delete contacts");
			console.error(error);
		}
	};

	// Determine which contacts to display
	const displayContacts = filterView === "byStatus"
		? statusContacts
		: filterView === "byCategory"
		? categoryContacts
		: filterView === "byFilters"
		? filteredContacts
		: filterView === "byEmail"
		? emailContacts
		: allContacts;

	// Calculate filter badge count
	const getFilterCount = () => {
		if (filterView === "byStatus") return statusContacts?.length || 0;
		if (filterView === "byCategory") return categoryContacts?.length || 0;
		if (filterView === "byFilters") return filteredContacts?.length || 0;
		if (filterView === "byEmail") return emailContacts?.length || 0;
		return allContacts?.length || 0;
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "active":
				return <UserCheck className="mr-2 h-4 w-4 text-green-500" />;
			case "inactive":
				return <UserX className="mr-2 h-4 w-4 text-gray-500" />;
			case "qualified":
				return <Users className="mr-2 h-4 w-4 text-blue-500" />;
			case "lead":
				return <Users className="mr-2 h-4 w-4 text-purple-500" />;
			default:
				return <Users className="mr-2 h-4 w-4" />;
		}
	};

	const getCategoryIcon = (category: string) => {
		switch (category) {
			case "client":
				return <Building className="mr-2 h-4 w-4 text-green-500" />;
			case "supplier":
				return <Building className="mr-2 h-4 w-4 text-blue-500" />;
			case "partner":
				return <Building className="mr-2 h-4 w-4 text-purple-500" />;
			default:
				return <Building className="mr-2 h-4 w-4" />;
		}
	};

	return (
		<>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-3xl font-bold tracking-tight">Contacts</h2>
						<p className="text-muted-foreground">
							Manage your contacts and keep track of relationships
						</p>
					</div>
					<div className="flex items-center space-x-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm">
									<Filter className="mr-2 h-4 w-4" />
									Filter View
									{filterView !== "all" && (
										<Badge className="ml-2" variant="secondary">
											{getFilterCount()}
										</Badge>
									)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-[200px]">
								<DropdownMenuLabel>Quick Filters</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => setFilterView("all")}>
									<Users className="mr-2 h-4 w-4" />
									All Contacts
									{filterView === "all" && <Badge className="ml-auto" variant="default">Active</Badge>}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuLabel>By Status</DropdownMenuLabel>
								<DropdownMenuItem onClick={() => {
									setFilterView("byStatus");
									setStatusFilter("active");
								}}>
									{getStatusIcon("active")}
									Active
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => {
									setFilterView("byStatus");
									setStatusFilter("inactive");
								}}>
									{getStatusIcon("inactive")}
									Inactive
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => {
									setFilterView("byStatus");
									setStatusFilter("qualified");
								}}>
									{getStatusIcon("qualified")}
									Qualified
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => {
									setFilterView("byStatus");
									setStatusFilter("lead");
								}}>
									{getStatusIcon("lead")}
									Lead
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuLabel>By Category</DropdownMenuLabel>
								<DropdownMenuItem onClick={() => {
									setFilterView("byCategory");
									setCategoryFilter("client");
								}}>
									{getCategoryIcon("client")}
									Client
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => {
									setFilterView("byCategory");
									setCategoryFilter("supplier");
								}}>
									{getCategoryIcon("supplier")}
									Supplier
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => {
									setFilterView("byCategory");
									setCategoryFilter("partner");
								}}>
									{getCategoryIcon("partner")}
									Partner
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => {
									setFilterView("byCategory");
									setCategoryFilter("other");
								}}>
									{getCategoryIcon("other")}
									Other
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuLabel>Combined Filters</DropdownMenuLabel>
								<DropdownMenuItem onClick={() => {
									setFilterView("byFilters");
									setStatusFilter("active");
									setCategoryFilter("client");
								}}>
									Active Clients
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => {
									setFilterView("byFilters");
									setStatusFilter("qualified");
									setCategoryFilter("lead");
								}}>
									Qualified Leads
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuLabel>Email Search</DropdownMenuLabel>
								<div className="px-2 py-1">
									<div className="flex items-center space-x-2">
										<Input
											placeholder="Search by email..."
											value={emailFilter}
											onChange={(e) => {
												setEmailFilter(e.target.value);
												if (e.target.value.includes("@")) {
													setFilterView("byEmail");
												}
											}}
											className="h-8"
										/>
										{emailFilter && (
											<Button
												size="sm"
												variant="ghost"
												onClick={() => {
													setEmailFilter("");
													setFilterView("all");
												}}
											>
												Clear
											</Button>
										)}
									</div>
								</div>
							</DropdownMenuContent>
						</DropdownMenu>
						<Button onClick={handleCreateContact}>
							<UserPlus className="mr-2 h-4 w-4" />
							Add Contact
						</Button>
					</div>
				</div>

				<Suspense fallback={<ContactsSkeleton />}>
					<ContactsStats />
				</Suspense>

				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>
								{filterView === "byStatus" ? `Contacts - ${statusFilter}` :
								 filterView === "byCategory" ? `Contacts - ${categoryFilter}` :
								 filterView === "byFilters" ? `Filtered Contacts` :
								 filterView === "byEmail" ? `Email: ${emailFilter}` :
								 "All Contacts"}
							</CardTitle>
							{filterView !== "all" && (
								<Badge variant="outline">
									{getFilterCount()} {getFilterCount() === 1 ? "contact" : "contacts"}
								</Badge>
							)}
						</div>
					</CardHeader>
					<CardContent>
						<ContactsTable
							data={displayContacts || []}
							columns={columns}
							onDeleteContact={handleDeleteContact}
							onDeleteMany={handleDeleteMany}
							onEditContact={handleEditContact}
							onCreateContact={handleCreateContact}
						/>
					</CardContent>
				</Card>
			</div>

			<ContactFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				contact={editingContact}
				onSubmit={handleSubmitContact}
				mode={dialogMode}
			/>
		</>
	);
}
