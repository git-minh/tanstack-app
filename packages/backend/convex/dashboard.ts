import { query } from "./_generated/server";

/**
 * COMPREHENSIVE DASHBOARD DATA
 * Fetches tasks, projects, contacts, and todos with full analytics
 * Optimized with parallel queries and single-pass processing
 */
export const getDashboardData = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthorized: Must be logged in to view dashboard");

		const userId = identity.subject;

		// Parallel fetch all user data
		const [tasks, projects, contacts, todos] = await Promise.all([
			ctx.db
				.query("tasks")
				.withIndex("by_userId", (q) => q.eq("userId", userId))
				.collect(),
			ctx.db
				.query("projects")
				.withIndex("by_userId", (q) => q.eq("userId", userId))
				.collect(),
			ctx.db
				.query("contacts")
				.withIndex("by_userId", (q) => q.eq("userId", userId))
				.collect(),
			ctx.db
				.query("todos")
				.withIndex("by_userId", (q) => q.eq("userId", userId))
				.collect(),
		]);

		// Task analytics
		const taskStats = {
			total: tasks.length,
			todo: tasks.filter((t) => t.status === "todo").length,
			inProgress: tasks.filter((t) => t.status === "in-progress").length,
			done: tasks.filter((t) => t.status === "done").length,
			cancelled: tasks.filter((t) => t.status === "cancelled").length,
			byPriority: {
				high: tasks.filter((t) => t.priority === "high").length,
				medium: tasks.filter((t) => t.priority === "medium").length,
				low: tasks.filter((t) => t.priority === "low").length,
			},
		};

		// Project analytics
		const projectStats = {
			total: projects.length,
			planning: projects.filter((p) => p.status === "planning").length,
			active: projects.filter((p) => p.status === "active").length,
			onHold: projects.filter((p) => p.status === "on-hold").length,
			completed: projects.filter((p) => p.status === "completed").length,
			cancelled: projects.filter((p) => p.status === "cancelled").length,
		};

		// Contact analytics
		const contactStats = {
			total: contacts.length,
			active: contacts.filter((c) => c.status === "active").length,
			inactive: contacts.filter((c) => c.status === "inactive").length,
			byCategory: {
				client: contacts.filter((c) => c.category === "client").length,
				partner: contacts.filter((c) => c.category === "partner").length,
				vendor: contacts.filter((c) => c.category === "vendor").length,
				other: contacts.filter((c) => c.category === "other").length,
			},
		};

		// Todo analytics
		const todoStats = {
			total: todos.length,
			active: todos.filter((t) => !t.completed).length,
			completed: todos.filter((t) => t.completed).length,
		};

		// Recent activity - combine all entities
		type Activity = {
			_id: string;
			_creationTime: number;
			type: "task" | "project" | "contact" | "todo";
			title: string;
			status?: string;
			displayId?: string;
		};

		const allActivities: Activity[] = [
			...tasks.map((t) => ({
				_id: t._id,
				_creationTime: t._creationTime,
				type: "task" as const,
				title: t.title,
				status: t.status,
				displayId: t.displayId,
			})),
			...projects.map((p) => ({
				_id: p._id,
				_creationTime: p._creationTime,
				type: "project" as const,
				title: p.name,
				status: p.status,
				displayId: p.displayId,
			})),
			...contacts.map((c) => ({
				_id: c._id,
				_creationTime: c._creationTime,
				type: "contact" as const,
				title: `${c.firstName} ${c.lastName}`,
				status: c.status,
				displayId: c.displayId,
			})),
			...todos.map((t) => ({
				_id: t._id,
				_creationTime: t._creationTime,
				type: "todo" as const,
				title: t.text,
				status: t.completed ? "completed" : "active",
			})),
		];

		const recentActivity = allActivities
			.sort((a, b) => b._creationTime - a._creationTime)
			.slice(0, 15)
			.map((item) => ({
				_id: item._id,
				_creationTime: item._creationTime,
				type: item.type,
				title: item.title,
				status: item.status,
				displayId: item.displayId,
			}));

		return {
			tasks: taskStats,
			projects: projectStats,
			contacts: contactStats,
			todos: todoStats,
			recentActivity,
		};
	},
});

