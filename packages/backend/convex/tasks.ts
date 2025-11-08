import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { generateDisplayId } from "./counters";
import {
	calculateSortPath,
	updateDescendantsStatus,
	deleteTaskAndDescendants,
	buildTaskHierarchy,
} from "./hierarchy";

export const getAll = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view tasks");
		}
		// Return only the current user's tasks, ordered by creation time (newest first)
		const tasks = await ctx.db
			.query("tasks")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.order("desc")
			.collect();

		return tasks;
	},
});

export const create = mutation({
	args: {
		title: v.string(),
		status: v.string(),
		label: v.string(),
		priority: v.string(),
		description: v.optional(v.string()),
		dueDate: v.optional(v.number()),
		parentTaskId: v.optional(v.id("tasks")),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to create tasks");
		}

		// Calculate hierarchy fields (level and sortPath)
		const { level, sortPath } = await calculateSortPath(
			ctx,
			identity.subject,
			args.parentTaskId
		);

		// Generate display ID
		const displayId = await generateDisplayId(ctx, "tasks");

		const newTaskId = await ctx.db.insert("tasks", {
			title: args.title,
			status: args.status,
			label: args.label,
			priority: args.priority,
			userId: identity.subject,
			description: args.description,
			dueDate: args.dueDate,
			displayId,
			parentTaskId: args.parentTaskId,
			level,
			sortPath,
		});
		return await ctx.db.get(newTaskId);
	},
});

export const update = mutation({
	args: {
		id: v.id("tasks"),
		title: v.string(),
		status: v.string(),
		label: v.string(),
		priority: v.string(),
		description: v.optional(v.string()),
		dueDate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to update tasks");
		}
		// Verify the task belongs to the current user
		const task = await ctx.db.get(args.id);
		if (!task) {
			throw new Error("Task not found");
		}
		if (task.userId !== identity.subject) {
			throw new Error("Unauthorized: Cannot update another user's task");
		}

		// Update the task
		await ctx.db.patch(args.id, {
			title: args.title,
			status: args.status,
			label: args.label,
			priority: args.priority,
			description: args.description,
			dueDate: args.dueDate,
		});

		// STATUS INHERITANCE: If task is marked as done, update all descendants
		if (args.status === "done" && task.status !== "done") {
			await updateDescendantsStatus(ctx, args.id, "done");
		}
		// If task is marked as canceled, update all descendants
		else if (args.status === "canceled" && task.status !== "canceled") {
			await updateDescendantsStatus(ctx, args.id, "canceled");
		}

		return await ctx.db.get(args.id);
	},
});

export const remove = mutation({
	args: {
		id: v.id("tasks"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to delete tasks");
		}
		// Verify the task belongs to the current user
		const task = await ctx.db.get(args.id);
		if (!task) {
			throw new Error("Task not found");
		}
		if (task.userId !== identity.subject) {
			throw new Error("Unauthorized: Cannot delete another user's task");
		}

		// CASCADE DELETE: Remove task and all its descendants
		await deleteTaskAndDescendants(ctx, args.id);

		return { success: true };
	},
});

export const removeMany = mutation({
	args: {
		ids: v.array(v.id("tasks")),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to delete tasks");
		}

		// Verify all tasks belong to the current user
		for (const id of args.ids) {
			const task = await ctx.db.get(id);
			if (!task) {
				throw new Error(`Task ${id} not found`);
			}
			if (task.userId !== identity.subject) {
				throw new Error(`Unauthorized: Cannot delete task ${id}`);
			}
		}

		// CASCADE DELETE: Remove all tasks and their descendants
		for (const id of args.ids) {
			await deleteTaskAndDescendants(ctx, id);
		}

		return { success: true, deleted: args.ids.length };
	},
});

export const getTaskStats = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view task stats");
		}

		const allTasks = await ctx.db
			.query("tasks")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		const rootTasks = allTasks.filter((t) => t.level === 0);
		const now = Date.now();

		const stats = {
			total: allTasks.length,
			rootTasks: rootTasks.length,
			byStatus: {
				backlog: allTasks.filter((t) => t.status === "backlog").length,
				todo: allTasks.filter((t) => t.status === "todo").length,
				"in progress": allTasks.filter((t) => t.status === "in progress")
					.length,
				done: allTasks.filter((t) => t.status === "done").length,
				canceled: allTasks.filter((t) => t.status === "canceled").length,
			},
			overdue: allTasks.filter(
				(t) =>
					t.dueDate &&
					t.dueDate < now &&
					t.status !== "done" &&
					t.status !== "canceled"
			).length,
			hierarchyStats: {
				maxDepth: allTasks.length > 0 ? Math.max(...allTasks.map((t) => t.level)) : 0,
				totalParents: rootTasks.filter((t) =>
					allTasks.some((child) => child.parentTaskId === t._id)
				).length,
			},
		};

		return stats;
	},
});

/**
 * Get all tasks in hierarchical tree structure
 * Returns tasks with nested subRows for parent-child relationships
 */
export const getHierarchy = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view tasks");
		}

		// Get all tasks ordered by sortPath for proper hierarchical sorting
		const allTasks = await ctx.db
			.query("tasks")
			.withIndex("by_userId_and_sortPath", (q) =>
				q.eq("userId", identity.subject)
			)
			.collect();

		// Transform flat list to hierarchical structure
		return buildTaskHierarchy(allTasks);
	},
});

/**
 * Get all root tasks (tasks with no parent)
 */
export const getRootTasks = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view tasks");
		}

		return await ctx.db
			.query("tasks")
			.withIndex("by_userId_and_level", (q) =>
				q.eq("userId", identity.subject).eq("level", 0)
			)
			.order("desc")
			.collect();
	},
});

/**
 * Get direct children of a specific task
 */
export const getChildTasks = query({
	args: {
		parentTaskId: v.optional(v.id("tasks")),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view tasks");
		}

		if (!args.parentTaskId) {
			return [];
		}

		// Verify the parent task belongs to the user
		const parentTask = await ctx.db.get(args.parentTaskId);
		if (!parentTask || parentTask.userId !== identity.subject) {
			throw new Error("Parent task not found or unauthorized");
		}

		return await ctx.db
			.query("tasks")
			.withIndex("by_parentTaskId", (q) =>
				q.eq("parentTaskId", args.parentTaskId)
			)
			.collect();
	},
});

/**
 * Get task by display ID (for URL routing)
 */
export const getByDisplayId = query({
	args: {
		displayId: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view tasks");
		}

		const task = await ctx.db
			.query("tasks")
			.withIndex("by_displayId", (q) => q.eq("displayId", args.displayId))
			.first();

		if (!task) {
			return null;
		}

		// Verify the task belongs to the user
		if (task.userId !== identity.subject) {
			return null;
		}

		return task;
	},
});

/**
 * Get tasks by date range (for calendar/timeline views)
 */
export const getByDateRange = query({
	args: {
		startDate: v.number(),
		endDate: v.number(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view tasks");
		}

		// Get all user's tasks first, then filter by date range
		const tasks = await ctx.db
			.query("tasks")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		// Filter by date range
		return tasks.filter((task) => {
			if (!task.dueDate) return false;
			return task.dueDate >= args.startDate && task.dueDate <= args.endDate;
		});
	},
});

/**
 * Get overdue tasks
 */
export const getOverdue = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view tasks");
		}

		const now = Date.now();
		const tasks = await ctx.db
			.query("tasks")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		return tasks.filter(
			(task) =>
				task.dueDate &&
				task.dueDate < now &&
				task.status !== "done" &&
				task.status !== "canceled"
		);
	},
});

/**
 * Get upcoming tasks (next 7 days)
 */
export const getUpcoming = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view tasks");
		}

		const now = Date.now();
		const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;

		const tasks = await ctx.db
			.query("tasks")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		return tasks.filter(
			(task) =>
				task.dueDate &&
				task.dueDate >= now &&
				task.dueDate <= weekFromNow &&
				task.status !== "done" &&
				task.status !== "canceled"
		);
	},
});

/**
 * Get tasks by status
 */
export const getByStatus = query({
	args: {
		status: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view tasks");
		}

		const tasks = await ctx.db
			.query("tasks")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		return tasks.filter((task) => task.status === args.status);
	},
});

/**
 * Bulk update task status
 */
export const updateManyStatus = mutation({
	args: {
		ids: v.array(v.id("tasks")),
		status: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to update tasks");
		}

		// Verify all tasks belong to the current user and update them
		for (const id of args.ids) {
			const task = await ctx.db.get(id);
			if (!task) {
				throw new Error(`Task ${id} not found`);
			}
			if (task.userId !== identity.subject) {
				throw new Error(`Unauthorized: Cannot update task ${id}`);
			}

			await ctx.db.patch(id, { status: args.status });

			// Handle status inheritance for subtasks
			if (args.status === "done" || args.status === "canceled") {
				await updateDescendantsStatus(ctx, id, args.status);
			}
		}

		return { success: true, updated: args.ids.length };
	},
});
