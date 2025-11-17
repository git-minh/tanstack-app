import { Suspense, useState, lazy } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";
import type { Contact } from "./data/schema";
import { cn } from "@/lib/utils";

// Lazy load ContactFormDialog
const ContactFormDialog = lazy(() =>
	import("./components/contact-form-dialog").then(m => ({ default: m.ContactFormDialog }))
);

export function Contacts() {
	const [filterStatus, setFilterStatus] = useState<string | undefined>();
	const [filterCategory, setFilterCategory] = useState<string | undefined>();

	// Main contacts query
	const { data: allContacts } = useSuspenseQuery(
		convexQuery(api.contacts.getAll, {})
	);

	// Filtered queries
	const statusContacts = useQuery(
		api.contacts.getByStatus,
		filterStatus ? { status: filterStatus } : "skip"
	);
	const categoryContacts = useQuery(
		api.contacts.getByCategory,
		filterCategory ? { category: filterCategory } : "skip"
	);

	const createContact = useMutation(api.contacts.create);
	const updateContact = useMutation(api.contacts.update);
	const deleteContact = useMutation(api.contacts.remove);

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
				toast.success("Contact added");
			} else {
				if (!editingContact) return;
				await updateContact({
					id: editingContact._id as any,
					...values,
				});
				toast.success("Contact updated");
			}
		} catch (error) {
			toast.error(`Failed to ${dialogMode} contact`);
			console.error(error);
		}
	};

	const handleDeleteContact = async (id: string) => {
		try {
			await deleteContact({ id: id as any });
			toast.success("Contact deleted");
		} catch (error) {
			toast.error("Failed to delete contact");
			console.error(error);
		}
	};

	// Determine which contacts to display
	const displayContacts = filterStatus
		? statusContacts
		: filterCategory
		? categoryContacts
		: allContacts;

	// Calculate stats
	const totalContacts = allContacts?.length || 0;
	const activeContacts = allContacts?.filter(c => c.status === "active").length || 0;
	const clientContacts = allContacts?.filter(c => c.category === "client").length || 0;
	const leadContacts = allContacts?.filter(c => c.status === "lead").length || 0;

	return (
		<>
			<div className="min-h-[calc(100vh-8rem)] flex flex-col">
				{/* Hero Stats - Ultra Minimal */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-foreground border-y-2 border-foreground">
					<div className="bg-background p-8 md:p-12 border-r-2 border-foreground">
						<div className="space-y-2">
							<div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
								{totalContacts}
							</div>
							<div className="text-xs uppercase tracking-widest font-medium">
								Total
							</div>
						</div>
					</div>

					<div className="bg-background p-8 md:p-12 border-r-0 md:border-r-2 border-foreground">
						<div className="space-y-2">
							<div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
								{activeContacts}
							</div>
							<div className="text-xs uppercase tracking-widest font-medium">
								Active
							</div>
						</div>
					</div>

					<div className="bg-background p-8 md:p-12 border-r-2 border-foreground">
						<div className="space-y-2">
							<div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
								{clientContacts}
							</div>
							<div className="text-xs uppercase tracking-widest font-medium">
								Clients
							</div>
						</div>
					</div>

					<div className="bg-background p-8 md:p-12">
						<div className="space-y-2">
							<div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
								{leadContacts}
							</div>
							<div className="text-xs uppercase tracking-widest font-medium">
								Leads
							</div>
						</div>
					</div>
				</div>

				{/* Filters Bar - Minimal */}
				<div className="border-b-2 border-foreground bg-background">
					<div className="p-4 flex flex-wrap items-center gap-2">
						{/* Status Filters */}
						<button
							onClick={() => {
								setFilterStatus(undefined);
								setFilterCategory(undefined);
							}}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								!filterStatus && !filterCategory && "bg-foreground text-background"
							)}
						>
							All
						</button>
						<button
							onClick={() => {
								setFilterStatus("active");
								setFilterCategory(undefined);
							}}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								filterStatus === "active" && "bg-foreground text-background"
							)}
						>
							Active
						</button>
						<button
							onClick={() => {
								setFilterStatus("inactive");
								setFilterCategory(undefined);
							}}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								filterStatus === "inactive" && "bg-foreground text-background"
							)}
						>
							Inactive
						</button>
						<button
							onClick={() => {
								setFilterStatus("qualified");
								setFilterCategory(undefined);
							}}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								filterStatus === "qualified" && "bg-foreground text-background"
							)}
						>
							Qualified
						</button>
						<button
							onClick={() => {
								setFilterStatus("lead");
								setFilterCategory(undefined);
							}}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								filterStatus === "lead" && "bg-foreground text-background"
							)}
						>
							Lead
						</button>

						<div className="h-4 w-px bg-border mx-2" />

						{/* Category Filters */}
						<button
							onClick={() => {
								setFilterCategory("client");
								setFilterStatus(undefined);
							}}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								filterCategory === "client" && "bg-foreground text-background"
							)}
						>
							Clients
						</button>
						<button
							onClick={() => {
								setFilterCategory("supplier");
								setFilterStatus(undefined);
							}}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								filterCategory === "supplier" && "bg-foreground text-background"
							)}
						>
							Suppliers
						</button>
						<button
							onClick={() => {
								setFilterCategory("partner");
								setFilterStatus(undefined);
							}}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								filterCategory === "partner" && "bg-foreground text-background"
							)}
						>
							Partners
						</button>

						<div className="flex-1" />
						<Button
							onClick={handleCreateContact}
							size="sm"
							className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-light group h-7"
						>
							<Plus className="mr-1.5 h-3.5 w-3.5" />
							New
							<ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
						</Button>
					</div>
				</div>

				{/* Contacts List - Text Only */}
				<div className="flex-1 p-6 md:p-12">
					<div className="max-w-5xl">
						{displayContacts && displayContacts.length === 0 ? (
							<div className="py-20 text-center border-2 border-dashed border-border">
								<p className="text-sm text-muted-foreground mb-4">
									No contacts found
								</p>
								<Button
									onClick={handleCreateContact}
									variant="outline"
									size="sm"
									className="rounded-none font-light"
								>
									<Plus className="mr-2 h-4 w-4" />
									Add your first contact
								</Button>
							</div>
						) : (
							<div className="space-y-px">
								{displayContacts?.map((contact) => (
									<div
										key={contact._id}
										className="group py-4 border-b border-border/30 last:border-0 hover:pl-4 transition-all duration-200 flex items-start gap-4"
									>
										<div className="flex-1 min-w-0">
											<div className="flex items-baseline gap-3 flex-wrap mb-2">
												<button
													onClick={() => handleEditContact(contact)}
													className="text-base font-light hover:underline text-left"
												>
													{contact.firstName} {contact.lastName}
												</button>
												<span className="text-[10px] uppercase tracking-widest text-muted-foreground">
													{contact.displayId}
												</span>
											</div>

											<div className="space-y-1.5 text-sm font-light">
												{contact.email && (
													<div className="flex items-center gap-2 text-muted-foreground">
														<Mail className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
														<a
															href={`mailto:${contact.email}`}
															className="hover:text-foreground transition-colors truncate"
														>
															{contact.email}
														</a>
													</div>
												)}
												{contact.company && (
													<div className="flex items-center gap-2 text-muted-foreground">
														<Building2 className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
														<span className="truncate">
															{contact.company}
															{contact.title && ` · ${contact.title}`}
														</span>
													</div>
												)}
											</div>

											<div className="flex items-center gap-3 mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
												<span>{contact.status}</span>
												<span className="h-1 w-1 rounded-full bg-muted-foreground" />
												<span>{contact.category}</span>
												{contact.phone && (
													<>
														<span className="h-1 w-1 rounded-full bg-muted-foreground" />
														<span className="font-normal">{contact.phone}</span>
													</>
												)}
											</div>
										</div>

										<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
											<button
												onClick={() => handleEditContact(contact)}
												className="text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-muted transition-colors"
											>
												Edit
											</button>
											<button
												onClick={() => handleDeleteContact(contact._id)}
												className="text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-destructive/10 hover:text-destructive transition-colors"
											>
												Delete
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			<Suspense fallback={null}>
				<ContactFormDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					contact={editingContact}
					onSubmit={handleSubmitContact}
					mode={dialogMode}
				/>
			</Suspense>
		</>
	);
}
