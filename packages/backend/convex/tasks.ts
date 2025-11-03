import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to create tasks");
		}
		const newTaskId = await ctx.db.insert("tasks", {
			title: args.title,
			status: args.status,
			label: args.label,
			priority: args.priority,
			userId: identity.subject,
			description: args.description,
			dueDate: args.dueDate,
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
		await ctx.db.patch(args.id, {
			title: args.title,
			status: args.status,
			label: args.label,
			priority: args.priority,
			description: args.description,
			dueDate: args.dueDate,
		});
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
		await ctx.db.delete(args.id);
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
		// Verify all tasks belong to the current user and delete them
		for (const id of args.ids) {
			const task = await ctx.db.get(id);
			if (!task) {
				throw new Error(`Task ${id} not found`);
			}
			if (task.userId !== identity.subject) {
				throw new Error(`Unauthorized: Cannot delete task ${id}`);
			}
			await ctx.db.delete(id);
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

		const now = Date.now();
		const stats = {
			total: allTasks.length,
			byStatus: {
				backlog: allTasks.filter((t) => t.status === "backlog").length,
				todo: allTasks.filter((t) => t.status === "todo").length,
				"in progress": allTasks.filter((t) => t.status === "in progress").length,
				done: allTasks.filter((t) => t.status === "done").length,
				canceled: allTasks.filter((t) => t.status === "canceled").length,
			},
			overdue: allTasks.filter((t) => t.dueDate && t.dueDate < now && t.status !== "done" && t.status !== "canceled").length,
		};

		return stats;
	},
});
