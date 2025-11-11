import { Suspense, useState, useEffect, lazy } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectsTable } from "./components/projects-table";
import { columns } from "./components/projects-columns";
import { ProjectsStats } from "./components/projects-stats";

// Lazy load ProjectFormDialog - only loads when user clicks "New Project" button
const ProjectFormDialog = lazy(() =>
	import("./components/project-form-dialog").then(m => ({ default: m.ProjectFormDialog }))
);
import { ProjectsSkeleton } from "./components/projects-skeleton";
import Plus from "lucide-react/dist/esm/icons/plus";
import Filter from "lucide-react/dist/esm/icons/filter";
import { toast } from "sonner";
import type { Project } from "./data/schema";

export function Projects() {
	const search = useSearch({ from: "/_authenticated/projects" }) as { editProjectId?: string };
	const navigate = useNavigate();
	const [filterView, setFilterView] = useState<"all" | "byStatus">("all");
	const [statusFilter, setStatusFilter] = useState<string | undefined>();

	// Use hierarchical query for tree structure
	const { data: hierarchicalProjects } = useSuspenseQuery(
		convexQuery(api.projects.getHierarchy, {})
	);
	// Get root projects for parent selector
	const { data: rootProjects } = useSuspenseQuery(
		convexQuery(api.projects.getRootProjects, {})
	);

	// Additional queries based on filter
	const statusProjects = useQuery(
		api.projects.getByStatus,
		filterView === "byStatus" && statusFilter ? { status: statusFilter } : "skip"
	);

	const createProject = useMutation(api.projects.create);
	const updateProject = useMutation(api.projects.update);
	const deleteProject = useMutation(api.projects.remove);
	const deleteMany = useMutation(api.projects.removeMany);
	const archiveProject = useMutation(api.projects.archive);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingProject, setEditingProject] = useState<Project | undefined>();
	const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
	const [parentProjectId, setParentProjectId] = useState<string | undefined>();

	const handleCreateProject = () => {
		setEditingProject(undefined);
		setParentProjectId(undefined);
		setDialogMode("create");
		setDialogOpen(true);
	};

	const handleCreateSubproject = (parentId: string) => {
		setEditingProject(undefined);
		setParentProjectId(parentId);
		setDialogMode("create");
		setDialogOpen(true);
	};

	const handleEditProject = (project: Project) => {
		setEditingProject(project);
		setParentProjectId(undefined);
		setDialogMode("edit");
		setDialogOpen(true);
	};

	// Handle opening edit dialog from navigation
	useEffect(() => {
		if (search.editProjectId && hierarchicalProjects) {
			// Find the project recursively in the hierarchy
			const findProject = (projects: Project[]): Project | undefined => {
				for (const project of projects) {
					if (project._id === search.editProjectId) {
						return project;
					}
					if (project.subRows) {
						const found = findProject(project.subRows);
						if (found) return found;
					}
				}
				return undefined;
			};

			const projectToEdit = findProject(hierarchicalProjects);
			if (projectToEdit) {
				handleEditProject(projectToEdit);
				// Clear the search param after opening dialog
				navigate({
					to: "/projects",
					search: {},
					replace: true
				});
			}
		}
	}, [search.editProjectId, hierarchicalProjects, navigate]);

	const handleSubmitProject = async (values: {
		name: string;
		status: string;
		priority: string;
		description?: string;
		color?: string;
		startDate?: number;
		endDate?: number;
		parentProjectId?: string;
	}) => {
		try {
			if (dialogMode === "create") {
				await createProject(values);
				toast.success(
					values.parentProjectId
						? "Subproject created successfully"
						: "Project created successfully"
				);
			} else if (editingProject) {
				await updateProject({
					id: editingProject._id,
					name: values.name,
					status: values.status,
					priority: values.priority,
					description: values.description,
					color: values.color,
					startDate: values.startDate,
					endDate: values.endDate,
					parentProjectId: values.parentProjectId,
				});
				toast.success("Project updated successfully");
			}
			setDialogOpen(false);
		} catch (error) {
			toast.error(
				`Failed to ${dialogMode === "create" ? "create" : "update"} project`
			);
			console.error(error);
		}
	};

	const handleDeleteProject = async (id: string) => {
		try {
			await deleteProject({ id });
			toast.success("Project deleted successfully");
		} catch (error) {
			toast.error("Failed to delete project");
			console.error(error);
		}
	};

	const handleDeleteMany = async (ids: string[]) => {
		try {
			await deleteMany({ ids });
			toast.success(`${ids.length} projects deleted successfully`);
		} catch (error) {
			toast.error("Failed to delete projects");
			console.error(error);
		}
	};

	const handleArchiveProject = async (id: string) => {
		try {
			await archiveProject({ id });
			toast.success("Project archived successfully");
		} catch (error) {
			toast.error("Failed to archive project");
			console.error(error);
		}
	};

	// Determine which data to show based on filter
	const displayData =
		filterView === "byStatus" && statusProjects
			? statusProjects
			: hierarchicalProjects;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Projects</h1>
					<p className="text-muted-foreground">
						Manage and organize your projects
					</p>
				</div>
				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<Filter className="h-4 w-4 mr-2" />
								Filter
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuLabel>View</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => setFilterView("all")}>
								All Projects
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuLabel>By Status</DropdownMenuLabel>
							<DropdownMenuItem
								onClick={() => {
									setFilterView("byStatus");
									setStatusFilter("active");
								}}
							>
								Active
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									setFilterView("byStatus");
									setStatusFilter("on-hold");
								}}
							>
								On Hold
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									setFilterView("byStatus");
									setStatusFilter("completed");
								}}
							>
								Completed
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									setFilterView("byStatus");
									setStatusFilter("archived");
								}}
							>
								Archived
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button onClick={handleCreateProject}>
						<Plus className="h-4 w-4 mr-2" />
						New Project
					</Button>
				</div>
			</div>

			<Suspense fallback={<ProjectsSkeleton />}>
				<ProjectsStats />
			</Suspense>

			<Card>
				<CardHeader>
					<CardTitle>All Projects</CardTitle>
				</CardHeader>
				<CardContent>
					<Suspense fallback={<ProjectsSkeleton />}>
						<ProjectsTable
							data={displayData || []}
							columns={columns}
							onDeleteProject={handleDeleteProject}
							onDeleteMany={handleDeleteMany}
							onEditProject={handleEditProject}
							onArchiveProject={handleArchiveProject}
							onCreateSubproject={handleCreateSubproject}
						/>
					</Suspense>
				</CardContent>
			</Card>

			<Suspense fallback={null}>
				<ProjectFormDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					project={editingProject}
					onSubmit={handleSubmitProject}
					mode={dialogMode}
					rootProjects={rootProjects}
					parentProjectId={parentProjectId}
				/>
			</Suspense>
		</div>
	);
}
