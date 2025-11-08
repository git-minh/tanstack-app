import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
	ArrowLeft, 
	Calendar, 
	Clock, 
	AlertCircle,
	Edit2,
	Trash2,
	CheckCircle2,
	XCircle,
	FileText,
	Tag,
	Flag,
	Share2,
	Copy
} from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";

export const Route = createFileRoute("/_authenticated/tasks/$displayId")({
	component: TaskDetailRoute,
});

function TaskDetailRoute() {
	const { displayId } = Route.useParams();
	const task = useQuery(api.tasks.getByDisplayId, { displayId });

	if (task === undefined) {
		// Loading state
		return <TaskDetailSkeleton />;
	}

	if (task === null) {
		// Task not found - redirect to tasks page
		return <Navigate to="/tasks" />;
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "done":
				return <CheckCircle2 className="h-5 w-5 text-green-600" />;
			case "canceled":
				return <XCircle className="h-5 w-5 text-gray-600" />;
			case "in progress":
				return <Clock className="h-5 w-5 text-blue-600" />;
			default:
				return <AlertCircle className="h-5 w-5 text-yellow-600" />;
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "critical":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			case "high":
				return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
			case "medium":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
			case "low":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			default:
				return "";
		}
	};

	const getLabelColor = (label: string) => {
		switch (label) {
			case "bug":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			case "feature":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			case "documentation":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			default:
				return "";
		}
	};

	const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "done" && task.status !== "canceled";

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Link to="/tasks">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Tasks
						</Button>
					</Link>
					<div>
						<div className="flex items-center space-x-2">
							<h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
							<Badge variant="outline" className="text-xs">
								{task.displayId}
							</Badge>
						</div>
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

			{/* Status Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							{getStatusIcon(task.status)}
							<div>
								<p className="text-xs text-muted-foreground">Status</p>
								<p className="font-semibold capitalize">{task.status}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							<Flag className="h-5 w-5" />
							<div>
								<p className="text-xs text-muted-foreground">Priority</p>
								<Badge className={getPriorityColor(task.priority)}>
									{task.priority}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							<Tag className="h-5 w-5" />
							<div>
								<p className="text-xs text-muted-foreground">Label</p>
								<Badge className={getLabelColor(task.label)}>
									{task.label}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							<Calendar className="h-5 w-5" />
							<div>
								<p className="text-xs text-muted-foreground">Due Date</p>
								{task.dueDate ? (
									<p className={`font-semibold ${isOverdue ? "text-red-600" : ""}`}>
										{format(new Date(task.dueDate), "MMM d, yyyy")}
										<span className="text-xs text-muted-foreground block">
											{isOverdue ? "Overdue" : formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
										</span>
									</p>
								) : (
									<p className="text-muted-foreground">No due date</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<FileText className="mr-2 h-5 w-5" />
						Description
					</CardTitle>
				</CardHeader>
				<CardContent>
					{task.description ? (
						<p className="whitespace-pre-wrap">{task.description}</p>
					) : (
						<p className="text-muted-foreground italic">No description provided</p>
					)}
				</CardContent>
			</Card>

			{/* Metadata */}
			<Card>
				<CardHeader>
					<CardTitle>Task Information</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">Created:</span>
							<span className="ml-2">
								{format(new Date(task._creationTime), "MMM d, yyyy 'at' h:mm a")}
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">Level:</span>
							<span className="ml-2">{task.level === 0 ? "Root Task" : `Level ${task.level}`}</span>
						</div>
						{task.parentTaskId && (
							<div className="col-span-2">
								<span className="text-muted-foreground">Parent Task:</span>
								<span className="ml-2">Subtask of another task</span>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function TaskDetailSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Skeleton className="h-9 w-32" />
					<Skeleton className="h-9 w-64" />
				</div>
				<div className="flex items-center space-x-2">
					<Skeleton className="h-9 w-20" />
					<Skeleton className="h-9 w-24" />
				</div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
					<Skeleton className="h-6 w-32" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-20 w-full" />
				</CardContent>
			</Card>
		</div>
	);
}
