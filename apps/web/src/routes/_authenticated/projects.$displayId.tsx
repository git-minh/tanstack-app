import React from "react";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
	ArrowLeft, 
	Calendar, 
	AlertCircle,
	Edit2,
	Trash2,
	CheckCircle2,
	Pause,
	Archive,
	FileText,
	Flag,
	Copy,
	ListTodo,
	Circle,
	ArrowUp,
	ArrowDown,
	Minus
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/projects/$displayId")({
	component: ProjectDetailRoute,
});

function ProjectDetailRoute() {
	const { displayId } = Route.useParams();
	const navigate = useNavigate();
	const project = useQuery(api.projects.getByDisplayId, { displayId });
	const projectTasks = useQuery(
		api.tasks.getByProject,
		project ? { projectId: project._id as Id<"projects"> } : "skip"
	);
	const parentProject = useQuery(
		api.projects.get,
		project?.parentProjectId ? { id: project.parentProjectId } : "skip"
	);
	const deleteProject = useMutation(api.projects.remove);
	const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);

	const handleEdit = () => {
		// Navigate to projects page with search param to open the edit dialog
		navigate({
			to: "/projects",
			search: { editProjectId: project?._id }
		});
	};

	const handleDelete = async () => {
		if (!project) return;

		setIsDeleting(true);
		try {
			await deleteProject({ id: project._id as Id<"projects"> });
			toast.success("Project deleted successfully");
			setDeleteDialogOpen(false);
			// Navigate back to projects list
			navigate({ to: "/projects" });
		} catch (error) {
			toast.error("Failed to delete project");
			console.error(error);
		} finally {
			setIsDeleting(false);
		}
	};

	if (project === undefined) {
		// Loading state
		return <ProjectDetailSkeleton />;
	}

	if (project === null) {
		// Project not found - redirect to projects page
		return <Navigate to="/projects" />;
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
			case "archived":
				return <Archive className="h-5 w-5 text-gray-600" />;
			case "on-hold":
				return <Pause className="h-5 w-5 text-yellow-600" />;
			case "active":
			default:
				return <Circle className="h-5 w-5 text-green-600" />;
		}
	};

	const getPriorityIcon = (priority: string) => {
		switch (priority) {
			case "critical":
				return <AlertCircle className="h-5 w-5 text-red-600" />;
			case "high":
				return <ArrowUp className="h-5 w-5 text-orange-600" />;
			case "low":
				return <ArrowDown className="h-5 w-5 text-blue-600" />;
			case "medium":
			default:
				return <Minus className="h-5 w-5 text-yellow-600" />;
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

	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "archived":
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
			case "on-hold":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
			case "active":
			default:
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
		}
	};

	const taskStats = projectTasks ? {
		total: projectTasks.length,
		completed: projectTasks.filter(t => t.status === "done").length,
		inProgress: projectTasks.filter(t => t.status === "in progress").length,
		todo: projectTasks.filter(t => t.status === "todo" || t.status === "backlog").length,
	} : null;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Link to="/projects">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Projects
						</Button>
					</Link>
					<div>
						<div className="flex items-center space-x-2">
							<h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
							<Badge variant="outline" className="text-xs">
								{project.displayId}
							</Badge>
							{project.color && (
								<div 
									className="w-6 h-6 rounded-full border-2 border-gray-200" 
									style={{ backgroundColor: project.color }}
									title={`Project color: ${project.color}`}
								/>
							)}
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
					<Button
						variant="outline"
						size="sm"
						onClick={handleEdit}
						aria-label="Edit project"
					>
						<Edit2 className="mr-2 h-4 w-4" />
						Edit
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
						onClick={() => setDeleteDialogOpen(true)}
						disabled={isDeleting}
						aria-label="Delete project"
					>
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
							{getStatusIcon(project.status)}
							<div>
								<p className="text-xs text-muted-foreground">Status</p>
								<Badge className={getStatusColor(project.status)}>
									{project.status}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							{getPriorityIcon(project.priority)}
							<div>
								<p className="text-xs text-muted-foreground">Priority</p>
								<Badge className={getPriorityColor(project.priority)}>
									{project.priority}
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
								<p className="text-xs text-muted-foreground">Start Date</p>
								{project.startDate ? (
									<p className="font-semibold">
										{format(new Date(project.startDate), "MMM d, yyyy")}
									</p>
								) : (
									<p className="text-muted-foreground">Not set</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							<Calendar className="h-5 w-5" />
							<div>
								<p className="text-xs text-muted-foreground">End Date</p>
								{project.endDate ? (
									<p className="font-semibold">
										{format(new Date(project.endDate), "MMM d, yyyy")}
									</p>
								) : (
									<p className="text-muted-foreground">Not set</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Description */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<FileText className="mr-2 h-5 w-5" />
						Description
					</CardTitle>
				</CardHeader>
				<CardContent>
					{project.description ? (
						<p className="whitespace-pre-wrap">{project.description}</p>
					) : (
						<p className="text-muted-foreground italic">No description provided</p>
					)}
				</CardContent>
			</Card>

			{/* Tasks in This Project */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<div className="flex items-center">
							<ListTodo className="mr-2 h-5 w-5" />
							Tasks in This Project
						</div>
						{taskStats && (
							<Badge variant="outline" className="text-xs">
								{taskStats.total} total
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{projectTasks === undefined ? (
						<div className="space-y-2">
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
						</div>
					) : projectTasks.length > 0 ? (
						<div>
							{/* Task Stats */}
							<div className="grid grid-cols-4 gap-4 mb-4">
								<div className="text-center">
									<p className="text-2xl font-bold">{taskStats?.total || 0}</p>
									<p className="text-xs text-muted-foreground">Total</p>
								</div>
								<div className="text-center">
									<p className="text-2xl font-bold text-green-600">{taskStats?.completed || 0}</p>
									<p className="text-xs text-muted-foreground">Completed</p>
								</div>
								<div className="text-center">
									<p className="text-2xl font-bold text-blue-600">{taskStats?.inProgress || 0}</p>
									<p className="text-xs text-muted-foreground">In Progress</p>
								</div>
								<div className="text-center">
									<p className="text-2xl font-bold text-yellow-600">{taskStats?.todo || 0}</p>
									<p className="text-xs text-muted-foreground">To Do</p>
								</div>
							</div>

							{/* Task List */}
							<div className="space-y-2">
								{projectTasks.slice(0, 10).map((task) => (
									<Link 
										key={task._id} 
										to="/tasks/$displayId" 
										params={{ displayId: task.displayId }}
										className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
									>
										<div className="flex items-center space-x-3">
											<Badge variant="outline" className="text-xs">
												{task.displayId}
											</Badge>
											<span className="font-medium">{task.title}</span>
										</div>
										<div className="flex items-center space-x-2">
											<Badge className="text-xs capitalize">{task.status}</Badge>
											<Badge className={getPriorityColor(task.priority) + " text-xs"}>
												{task.priority}
											</Badge>
										</div>
									</Link>
								))}
								{projectTasks.length > 10 && (
									<p className="text-sm text-muted-foreground text-center pt-2">
										... and {projectTasks.length - 10} more tasks
									</p>
								)}
							</div>
						</div>
					) : (
						<div className="text-center py-8">
							<ListTodo className="mx-auto h-12 w-12 text-muted-foreground/50" />
							<p className="mt-2 text-muted-foreground">No tasks in this project yet</p>
							<Link to="/tasks">
								<Button variant="outline" size="sm" className="mt-4">
									Create Task
								</Button>
							</Link>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Metadata */}
			<Card>
				<CardHeader>
					<CardTitle>Project Information</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">Created:</span>
							<span className="ml-2">
								{format(new Date(project._creationTime), "MMM d, yyyy 'at' h:mm a")}
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">Level:</span>
							<span className="ml-2">{project.level === 0 ? "Root Project" : `Level ${project.level}`}</span>
						</div>
						{project.parentProjectId && (
							<div className="col-span-2">
								<span className="text-muted-foreground">Parent Project:</span>
								{parentProject === undefined ? (
									<span className="ml-2 text-muted-foreground">Loading...</span>
								) : parentProject ? (
									<Link
										to="/projects/$displayId"
										params={{ displayId: parentProject.displayId }}
										className="ml-2 text-primary hover:underline font-medium"
									>
										{parentProject.name}
									</Link>
								) : (
									<span className="ml-2 text-muted-foreground italic">Not found</span>
								)}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Project</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{project.name}"? This action cannot be undone.
							All subprojects and their data will also be deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function ProjectDetailSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Skeleton className="h-9 w-32" />
					<Skeleton className="h-9 w-64" />
				</div>
				<div className="flex items-center space-x-2">
					<Skeleton className="h-9 w-24" />
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
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-32 w-full" />
				</CardContent>
			</Card>
		</div>
	);
}
