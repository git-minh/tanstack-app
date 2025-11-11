import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { generateDisplayId } from "./counters";
import {
	calculateProjectSortPath,
	updateProjectDescendantsStatus,
	deleteProjectAndDescendants,
	buildProjectHierarchy,
} from "./hierarchy";
import type { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Shared authentication helper
 * Verifies user identity and throws error if unauthorized
 * @returns User identity with subject (userId)
 */
async function requireAuth(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Unauthorized: Must be logged in to access projects");
	}
	return identity;
}

// Shared validators for status and priority enums
const statusValidator = v.union(
	v.literal("active"),
	v.literal("on-hold"),
	v.literal("completed"),
	v.literal("archived")
);

const priorityValidator = v.union(
	v.literal("low"),
	v.literal("medium"),
	v.literal("high"),
	v.literal("critical")
);

export const getAll = query({
	handler: async (ctx) => {
		const identity = await requireAuth(ctx);
		const projects = await ctx.db
			.query("projects")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.order("desc")
			.collect();

		return projects;
	},
});

export const getHierarchy = query({
	handler: async (ctx) => {
		const identity = await requireAuth(ctx);

		const projects = await ctx.db
			.query("projects")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		// Build hierarchy using project-specific utility
		return buildProjectHierarchy(projects);
	},
});

export const getRootProjects = query({
	handler: async (ctx) => {
		const identity = await requireAuth(ctx);

		const rootProjects = await ctx.db
			.query("projects")
			.withIndex("by_userId_and_level", (q) =>
				q.eq("userId", identity.subject).eq("level", 0)
			)
			.order("desc")
			.collect();

		return rootProjects;
	},
});

/**
 * OPTIMIZED: Get all projects page data in a single query
 * Consolidates getHierarchy + getRootProjects to eliminate redundant database calls
 * Following dashboard.getDashboardData and tasks.getTasksPageData pattern
 */
export const getProjectsPageData = query({
	handler: async (ctx) => {
		const identity = await requireAuth(ctx);

		// Single database query - fetch all projects
		const allProjects = await ctx.db
			.query("projects")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		// Build hierarchical structure
		const hierarchicalProjects = buildProjectHierarchy(allProjects);

		// Extract root projects from same dataset (no additional query needed)
		const rootProjects = allProjects.filter(project => project.level === 0);

		// Return all data needed by projects page
		return {
			hierarchicalProjects,
			rootProjects,
		};
	},
});

export const getActive = query({
	handler: async (ctx) => {
		const identity = await requireAuth(ctx);

		const activeProjects = await ctx.db
			.query("projects")
			.withIndex("by_userId_and_status", (q) =>
				q.eq("userId", identity.subject).eq("status", "active")
			)
			.collect();

		return activeProjects;
	},
});

export const getByStatus = query({
	args: { status: statusValidator },
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);

		const projects = await ctx.db
			.query("projects")
			.withIndex("by_userId_and_status", (q) =>
				q.eq("userId", identity.subject).eq("status", args.status)
			)
			.collect();

		return projects;
	},
});

export const get = query({
	args: { id: v.id("projects") },
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);

		const project = await ctx.db.get(args.id);

		if (!project || project.userId !== identity.subject) {
			return null;
		}

		return project;
	},
});

export const getByDisplayId = query({
	args: { displayId: v.string() },
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);

		const project = await ctx.db
			.query("projects")
			.withIndex("by_displayId", (q) => q.eq("displayId", args.displayId))
			.first();

		if (!project || project.userId !== identity.subject) {
			return null;
		}

		return project;
	},
});

export const getProjectStats = query({
	handler: async (ctx) => {
		const identity = await requireAuth(ctx);

		// Use indexed count queries to avoid loading all documents into memory
		// Each query only loads the filtered subset using the appropriate index
		const userId = identity.subject;

		// Count by status and priority in parallel using compound indexes
		const [
			activeCount,
			onHoldCount,
			completedCount,
			archivedCount,
			lowCount,
			mediumCount,
			highCount,
			criticalCount,
		] = await Promise.all([
			// Status counts using by_userId_and_status index
			ctx.db
				.query("projects")
				.withIndex("by_userId_and_status", (q) =>
					q.eq("userId", userId).eq("status", "active")
				)
				.collect()
				.then((projects) => projects.length),
			ctx.db
				.query("projects")
				.withIndex("by_userId_and_status", (q) =>
					q.eq("userId", userId).eq("status", "on-hold")
				)
				.collect()
				.then((projects) => projects.length),
			ctx.db
				.query("projects")
				.withIndex("by_userId_and_status", (q) =>
					q.eq("userId", userId).eq("status", "completed")
				)
				.collect()
				.then((projects) => projects.length),
			ctx.db
				.query("projects")
				.withIndex("by_userId_and_status", (q) =>
					q.eq("userId", userId).eq("status", "archived")
				)
				.collect()
				.then((projects) => projects.length),
			// Priority counts using by_userId_and_priority index
			ctx.db
				.query("projects")
				.withIndex("by_userId_and_priority", (q) =>
					q.eq("userId", userId).eq("priority", "low")
				)
				.collect()
				.then((projects) => projects.length),
			ctx.db
				.query("projects")
				.withIndex("by_userId_and_priority", (q) =>
					q.eq("userId", userId).eq("priority", "medium")
				)
				.collect()
				.then((projects) => projects.length),
			ctx.db
				.query("projects")
				.withIndex("by_userId_and_priority", (q) =>
					q.eq("userId", userId).eq("priority", "high")
				)
				.collect()
				.then((projects) => projects.length),
			ctx.db
				.query("projects")
				.withIndex("by_userId_and_priority", (q) =>
					q.eq("userId", userId).eq("priority", "critical")
				)
				.collect()
				.then((projects) => projects.length),
		]);

		// Calculate total from status counts (avoids additional query)
		const totalCount = activeCount + onHoldCount + completedCount + archivedCount;

		const stats = {
			total: totalCount,
			active: activeCount,
			onHold: onHoldCount,
			completed: completedCount,
			archived: archivedCount,
			byPriority: {
				low: lowCount,
				medium: mediumCount,
				high: highCount,
				critical: criticalCount,
			},
		};

		return stats;
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
		status: statusValidator,
		priority: priorityValidator,
		color: v.optional(v.string()),
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
		parentProjectId: v.optional(v.id("projects")),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);

		// Validate date range if both dates are provided
		if (args.startDate !== undefined && args.endDate !== undefined) {
			if (typeof args.startDate !== 'number' || typeof args.endDate !== 'number') {
				throw new Error("Invalid date range: startDate and endDate must be numbers");
			}
			if (args.startDate > args.endDate) {
				throw new Error("Invalid date range: startDate must be <= endDate");
			}
		}

		const { level, sortPath } = await calculateProjectSortPath(
			ctx,
			identity.subject,
			args.parentProjectId
		);

		const displayId = await generateDisplayId(ctx, "projects");

		const newProjectId = await ctx.db.insert("projects", {
			name: args.name,
			description: args.description,
			status: args.status,
			priority: args.priority,
			color: args.color,
			startDate: args.startDate,
			endDate: args.endDate,
			userId: identity.subject,
			displayId,
			parentProjectId: args.parentProjectId,
			level,
			sortPath,
		});

		return await ctx.db.get(newProjectId);
	},
});

export const update = mutation({
	args: {
		id: v.id("projects"),
		name: v.string(),
		description: v.optional(v.string()),
		status: statusValidator,
		priority: priorityValidator,
		color: v.optional(v.string()),
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
		parentProjectId: v.optional(v.id("projects")),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);

		const project = await ctx.db.get(args.id);
		if (!project) {
			throw new Error("Project not found");
		}
		if (project.userId !== identity.subject) {
			throw new Error("Unauthorized: Cannot update another user's project");
		}

		// Compute effective start and end dates with fallbacks to existing project
		const newStart = args.startDate ?? project.startDate;
		const newEnd = args.endDate ?? project.endDate;

		// Validate date range if both effective dates exist
		if (newStart !== undefined && newEnd !== undefined) {
			if (newStart > newEnd) {
				throw new Error("Invalid date range: startDate must be <= endDate");
			}
		}

		// Check if parent changed - if so, recalculate level and sortPath
		let levelAndSortPath: { level: number; sortPath: string } | undefined;
		if (args.parentProjectId !== project.parentProjectId) {
			levelAndSortPath = await calculateProjectSortPath(
				ctx,
				identity.subject,
				args.parentProjectId
			);
		}

		await ctx.db.patch(args.id, {
			name: args.name,
			description: args.description,
			status: args.status,
			priority: args.priority,
			color: args.color,
			startDate: args.startDate,
			endDate: args.endDate,
			parentProjectId: args.parentProjectId,
			...(levelAndSortPath && {
				level: levelAndSortPath.level,
				sortPath: levelAndSortPath.sortPath,
			}),
		});

		// If status changed to completed/archived, update descendants
		if ((args.status === "completed" || args.status === "archived") &&
		    project.status !== args.status) {
			await updateProjectDescendantsStatus(ctx, args.id, args.status);
		}

		return await ctx.db.get(args.id);
	},
});

export const remove = mutation({
	args: {
		id: v.id("projects"),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);

		const project = await ctx.db.get(args.id);
		if (!project) {
			throw new Error("Project not found");
		}
		if (project.userId !== identity.subject) {
			throw new Error("Unauthorized: Cannot delete another user's project");
		}

		// CASCADE DELETE: Remove project and all its descendants
		await deleteProjectAndDescendants(ctx, args.id);

		return { success: true };
	},
});

export const removeMany = mutation({
	args: {
		ids: v.array(v.id("projects")),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);

		// Track detailed results for each operation
		const deletedIds: string[] = [];
		const skippedIds: string[] = [];
		const errors: Array<{ id: string; error: string }> = [];

		for (const id of args.ids) {
			try {
				const project = await ctx.db.get(id);

				// Skip if project doesn't exist
				if (!project) {
					skippedIds.push(id);
					continue;
				}

				// Skip if user doesn't own the project
				if (project.userId !== identity.subject) {
					skippedIds.push(id);
					continue;
				}

				// Attempt to delete project and descendants
				await deleteProjectAndDescendants(ctx, id);
				deletedIds.push(id);
			} catch (error) {
				// Record any errors that occur during deletion
				errors.push({
					id,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		return {
			success: true,
			deleted: deletedIds,
			skipped: skippedIds,
			errors,
		};
	},
});

export const archive = mutation({
	args: {
		id: v.id("projects"),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);

		const project = await ctx.db.get(args.id);
		if (!project) {
			throw new Error("Project not found");
		}
		if (project.userId !== identity.subject) {
			throw new Error("Unauthorized: Cannot archive another user's project");
		}

		await ctx.db.patch(args.id, { status: "archived" });

		return await ctx.db.get(args.id);
	},
});
