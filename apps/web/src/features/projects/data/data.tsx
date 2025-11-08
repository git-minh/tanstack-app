import {
	Circle,
	Pause,
	CheckCircle,
	Archive,
	AlertCircle,
	ArrowUp,
	ArrowDown,
	Minus,
} from "lucide-react";

export const projectStatuses = [
	{
		value: "active",
		label: "Active",
		icon: Circle,
		color: "text-green-600",
	},
	{
		value: "on-hold",
		label: "On Hold",
		icon: Pause,
		color: "text-yellow-600",
	},
	{
		value: "completed",
		label: "Completed",
		icon: CheckCircle,
		color: "text-blue-600",
	},
	{
		value: "archived",
		label: "Archived",
		icon: Archive,
		color: "text-gray-600",
	},
];

export const projectPriorities = [
	{
		value: "low",
		label: "Low",
		icon: ArrowDown,
		color: "text-blue-600",
	},
	{
		value: "medium",
		label: "Medium",
		icon: Minus,
		color: "text-yellow-600",
	},
	{
		value: "high",
		label: "High",
		icon: ArrowUp,
		color: "text-orange-600",
	},
	{
		value: "critical",
		label: "Critical",
		icon: AlertCircle,
		color: "text-red-600",
	},
];
