import { Suspense, useState, useEffect, lazy } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import type { Project } from "./data/schema";
import { cn } from "@/lib/utils";

// Lazy load ProjectFormDialog
const ProjectFormDialog = lazy(() =>
	import("./components/project-form-dialog").then(m => ({ default: m.ProjectFormDialog }))
);

export function Projects() {
	const search = useSearch({ from: "/_authenticated/projects" }) as { editProjectId?: string };
	const navigate = useNavigate();
	const [filterStatus, setFilterStatus] = useState<string | undefined>();

	// Main projects query
	const { data: projectsPageData } = useSuspenseQuery(
		convexQuery(api.projects.getProjectsPageData, {})
	);
	const { hierarchicalProjects, rootProjects } = projectsPageData;

	// Filtered query
	const statusProjects = useQuery(
		api.projects.getByStatus,
		filterStatus ? { status: filterStatus } : "skip"
	);

	// Stats query
	const { data: stats } = useSuspenseQuery(
		convexQuery(api.projects.getProjectStats, {})
	);

	const createProject = useMutation(api.projects.create);
	const updateProject = useMutation(api.projects.update);
	const deleteProject = useMutation(api.projects.remove);
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

	const handleEditProject = (project: Project) => {
		setEditingProject(project);
		setParentProjectId(undefined);
		setDialogMode("edit");
		setDialogOpen(true);
	};

	// Handle opening edit dialog from navigation
	useEffect(() => {
		if (search.editProjectId && hierarchicalProjects) {
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
				toast.success("Project created");
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
				toast.success("Project updated");
			}
			setDialogOpen(false);
		} catch (error) {
			toast.error(`Failed to ${dialogMode} project`);
			console.error(error);
		}
	};

	const handleDeleteProject = async (id: string) => {
		try {
			await deleteProject({ id });
			toast.success("Project deleted");
		} catch (error) {
			toast.error("Failed to delete project");
			console.error(error);
		}
	};

	const handleArchiveProject = async (id: string) => {
		try {
			await archiveProject({ id });
			toast.success("Project archived");
		} catch (error) {
			toast.error("Failed to archive project");
			console.error(error);
		}
	};

	// Determine which projects to display
	const displayProjects = filterStatus
		? statusProjects
		: hierarchicalProjects;

	// Flatten hierarchical projects for display
	const flattenProjects = (projects: Project[], level = 0): Array<Project & { displayLevel: number }> => {
		const result: Array<Project & { displayLevel: number }> = [];
		for (const project of projects) {
			result.push({ ...project, displayLevel: level });
			if (project.subRows && project.subRows.length > 0) {
				result.push(...flattenProjects(project.subRows, level + 1));
			}
		}
		return result;
	};

	const flatProjects = flattenProjects(displayProjects || []);

	return (
		<>
			<div className="min-h-[calc(100vh-8rem)] flex flex-col">
				{/* Hero Stats - Ultra Minimal */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-foreground border-y-2 border-foreground">
					<div className="bg-background p-8 md:p-12 border-r-2 border-foreground">
						<div className="space-y-2">
							<div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
								{stats.total}
							</div>
							<div className="text-xs uppercase tracking-widest font-medium">
								Total
							</div>
						</div>
					</div>

					<div className="bg-background p-8 md:p-12 border-r-0 md:border-r-2 border-foreground">
						<div className="space-y-2">
							<div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
								{stats.active}
							</div>
							<div className="text-xs uppercase tracking-widest font-medium">
								Active
							</div>
						</div>
					</div>

					<div className="bg-background p-8 md:p-12 border-r-2 border-foreground">
						<div className="space-y-2">
							<div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
								{stats.completed}
							</div>
							<div className="text-xs uppercase tracking-widest font-medium">
								Done
							</div>
						</div>
					</div>

					<div className="bg-background p-8 md:p-12">
						<div className="space-y-2">
							<div className="text-[clamp(3rem,10vw,8rem)] font-light leading-none tabular-nums tracking-tighter">
								{stats.onHold}
							</div>
							<div className="text-xs uppercase tracking-widest font-medium">
								On Hold
							</div>
						</div>
					</div>
				</div>

				{/* Filters Bar - Minimal */}
				<div className="border-b-2 border-foreground bg-background">
					<div className="p-4 flex flex-wrap items-center gap-2">
						{/* Status Filters */}
						<button
							onClick={() => setFilterStatus(undefined)}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								!filterStatus && "bg-foreground text-background"
							)}
						>
							All
						</button>
						<button
							onClick={() => setFilterStatus("active")}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								filterStatus === "active" && "bg-foreground text-background"
							)}
						>
							Active
						</button>
						<button
							onClick={() => setFilterStatus("on-hold")}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								filterStatus === "on-hold" && "bg-foreground text-background"
							)}
						>
							On Hold
						</button>
						<button
							onClick={() => setFilterStatus("completed")}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								filterStatus === "completed" && "bg-foreground text-background"
							)}
						>
							Completed
						</button>
						<button
							onClick={() => setFilterStatus("archived")}
							className={cn(
								"px-3 py-1 text-xs uppercase tracking-widest font-light hover:font-normal transition-all border border-border",
								filterStatus === "archived" && "bg-foreground text-background"
							)}
						>
							Archived
						</button>

						<div className="flex-1" />
						<Button
							onClick={handleCreateProject}
							size="sm"
							className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-light group h-7"
						>
							<Plus className="mr-1.5 h-3.5 w-3.5" />
							New
							<ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
						</Button>
					</div>
				</div>

				{/* Projects List - Text Only */}
				<div className="flex-1 p-6 md:p-12">
					<div className="max-w-5xl">
						{flatProjects.length === 0 ? (
							<div className="py-20 text-center border-2 border-dashed border-border">
								<p className="text-sm text-muted-foreground mb-4">
									No projects found
								</p>
								<Button
									onClick={handleCreateProject}
									variant="outline"
									size="sm"
									className="rounded-none font-light"
								>
									<Plus className="mr-2 h-4 w-4" />
									Create your first project
								</Button>
							</div>
						) : (
							<div className="space-y-px">
								{flatProjects.map((project) => (
									<div
										key={project._id}
										className="group py-4 border-b border-border/30 last:border-0 hover:pl-4 transition-all duration-200 flex items-start gap-4"
										style={{ paddingLeft: `${project.displayLevel * 2}rem` }}
									>
										<div className="flex-1 min-w-0">
											<div className="flex items-baseline gap-3 flex-wrap mb-2">
												<button
													onClick={() => handleEditProject(project)}
													className="text-base font-light hover:underline text-left"
												>
													{project.name}
												</button>
												<span className="text-[10px] uppercase tracking-widest text-muted-foreground">
													{project.displayId}
												</span>
											</div>

											{project.description && (
												<p className="text-sm text-muted-foreground font-light mb-3 line-clamp-2">
													{project.description}
												</p>
											)}

											<div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
												<span>{project.status}</span>
												<span className="h-1 w-1 rounded-full bg-muted-foreground" />
												<span>{project.priority}</span>
												{project.startDate && (
													<>
														<span className="h-1 w-1 rounded-full bg-muted-foreground" />
														<span>
															Starts {new Date(project.startDate).toLocaleDateString('en-US', {
																month: 'short',
																day: 'numeric',
																year: 'numeric'
															})}
														</span>
													</>
												)}
												{project.endDate && (
													<>
														<span className="h-1 w-1 rounded-full bg-muted-foreground" />
														<span>
															Ends {new Date(project.endDate).toLocaleDateString('en-US', {
																month: 'short',
																day: 'numeric',
																year: 'numeric'
															})}
														</span>
													</>
												)}
											</div>
										</div>

										<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
											<button
												onClick={() => handleEditProject(project)}
												className="text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-muted transition-colors"
											>
												Edit
											</button>
											<button
												onClick={() => handleArchiveProject(project._id)}
												className="text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-muted transition-colors"
											>
												Archive
											</button>
											<button
												onClick={() => handleDeleteProject(project._id)}
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
		</>
	);
}
