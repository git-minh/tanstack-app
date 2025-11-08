import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
	ArrowLeft, 
	Mail, 
	Phone, 
	Building,
	Globe,
	MapPin,
	FileText,
	Edit2,
	Trash2,
	User,
	Briefcase,
	Tag,
	Copy
} from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/contacts/$displayId")({
	component: ContactDetailRoute,
});

function ContactDetailRoute() {
	const { displayId } = Route.useParams();
	const contact = useQuery(api.contacts.getByDisplayId, { displayId });

	if (contact === undefined) {
		// Loading state
		return <ContactDetailSkeleton />;
	}

	if (contact === null) {
		// Contact not found - redirect to contacts page
		return <Navigate to="/contacts" />;
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "inactive":
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
			case "qualified":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "lead":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			default:
				return "";
		}
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "client":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "supplier":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "partner":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			case "other":
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
			default:
				return "";
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Link to="/contacts">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Contacts
						</Button>
					</Link>
					<div>
						<div className="flex items-center space-x-2">
							<h1 className="text-3xl font-bold tracking-tight">
								{contact.firstName} {contact.lastName}
							</h1>
							<Badge variant="outline" className="text-xs">
								{contact.displayId}
							</Badge>
						</div>
						<p className="text-muted-foreground">{contact.email}</p>
					</div>
				</div>
				<div className="flex items-center space-x-2">
					<Button 
						variant="outline" 
						size="sm"
						onClick={() => {
							const url = window.location.href;
							navigator.clipboard.writeText(url);
							toast.success("Link copied to clipboard");
						}}
					>
						<Copy className="mr-2 h-4 w-4" />
						Copy Link
					</Button>
					<Button variant="outline" size="sm">
						<Edit2 className="mr-2 h-4 w-4" />
						Edit
					</Button>
					<Button variant="outline" size="sm" className="text-red-600">
						<Trash2 className="mr-2 h-4 w-4" />
						Delete
					</Button>
				</div>
			</div>

			{/* Quick Info Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							<User className="h-5 w-5 text-muted-foreground" />
							<div className="flex-1">
								<p className="text-xs text-muted-foreground">Status</p>
								<Badge className={getStatusColor(contact.status)}>
									{contact.status}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							<Tag className="h-5 w-5 text-muted-foreground" />
							<div className="flex-1">
								<p className="text-xs text-muted-foreground">Category</p>
								<Badge className={getCategoryColor(contact.category)}>
									{contact.category}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				{contact.company && (
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<Building className="h-5 w-5 text-muted-foreground" />
								<div className="flex-1 min-w-0">
									<p className="text-xs text-muted-foreground">Company</p>
									<p className="font-semibold truncate">{contact.company}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{contact.title && (
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<Briefcase className="h-5 w-5 text-muted-foreground" />
								<div className="flex-1 min-w-0">
									<p className="text-xs text-muted-foreground">Title</p>
									<p className="font-semibold truncate">{contact.title}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Contact Information */}
			<Card>
				<CardHeader>
					<CardTitle>Contact Information</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="flex items-start space-x-3">
							<Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
							<div>
								<p className="text-sm font-medium">Email</p>
								<a href={`mailto:${contact.email}`} className="text-sm text-primary hover:underline">
									{contact.email}
								</a>
							</div>
						</div>

						{contact.phone && (
							<div className="flex items-start space-x-3">
								<Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
								<div>
									<p className="text-sm font-medium">Phone</p>
									<a href={`tel:${contact.phone}`} className="text-sm text-primary hover:underline">
										{contact.phone}
									</a>
								</div>
							</div>
						)}

						{contact.website && (
							<div className="flex items-start space-x-3">
								<Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
								<div>
									<p className="text-sm font-medium">Website</p>
									<a 
										href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`} 
										target="_blank" 
										rel="noopener noreferrer"
										className="text-sm text-primary hover:underline"
									>
										{contact.website}
									</a>
								</div>
							</div>
						)}

						{contact.address && (
							<div className="flex items-start space-x-3">
								<MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
								<div>
									<p className="text-sm font-medium">Address</p>
									<p className="text-sm text-muted-foreground">{contact.address}</p>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Professional Information */}
			{(contact.department || contact.company || contact.title) && (
				<Card>
					<CardHeader>
						<CardTitle>Professional Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{contact.company && (
								<div>
									<p className="text-sm font-medium text-muted-foreground">Company</p>
									<p className="text-sm">{contact.company}</p>
								</div>
							)}
							{contact.title && (
								<div>
									<p className="text-sm font-medium text-muted-foreground">Job Title</p>
									<p className="text-sm">{contact.title}</p>
								</div>
							)}
							{contact.department && (
								<div>
									<p className="text-sm font-medium text-muted-foreground">Department</p>
									<p className="text-sm">{contact.department}</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Notes */}
			{contact.notes && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<FileText className="mr-2 h-5 w-5" />
							Notes
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="whitespace-pre-wrap">{contact.notes}</p>
					</CardContent>
				</Card>
			)}

			{/* Metadata */}
			<Card>
				<CardHeader>
					<CardTitle>Contact Metadata</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-sm text-muted-foreground">
						<p>
							Added on {format(new Date(contact._creationTime), "MMMM d, yyyy 'at' h:mm a")}
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function ContactDetailSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Skeleton className="h-9 w-32" />
					<div>
						<Skeleton className="h-9 w-64 mb-2" />
						<Skeleton className="h-5 w-48" />
					</div>
				</div>
				<div className="flex items-center space-x-2">
					<Skeleton className="h-9 w-20" />
					<Skeleton className="h-9 w-24" />
				</div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<CardContent className="p-4">
							<Skeleton className="h-12 w-full" />
						</CardContent>
					</Card>
				))}
			</div>
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-40" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{[...Array(4)].map((_, i) => (
							<Skeleton key={i} className="h-12 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
