import {
	CheckCircle,
	Archive,
	Briefcase,
	Package,
	Users,
	Handshake,
	User,
	MoreHorizontal,
} from "lucide-react";

export const statuses = [
	{
		label: "Active",
		value: "active" as const,
		icon: CheckCircle,
	},
	{
		label: "Archived",
		value: "archived" as const,
		icon: Archive,
	},
];

export const categories = [
	{
		label: "Client",
		value: "client" as const,
		icon: Briefcase,
	},
	{
		label: "Vendor",
		value: "vendor" as const,
		icon: Package,
	},
	{
		label: "Colleague",
		value: "colleague" as const,
		icon: Users,
	},
	{
		label: "Partner",
		value: "partner" as const,
		icon: Handshake,
	},
	{
		label: "Personal",
		value: "personal" as const,
		icon: User,
	},
	{
		label: "Other",
		value: "other" as const,
		icon: MoreHorizontal,
	},
];
