import { query } from "./_generated/server";

/**
 * Get dashboard statistics/KPIs
 * Returns key metrics for display in stat cards
 */
export const getStats = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthorized: Must be logged in to view dashboard stats");

		const userId = identity.subject;

		// Get user's todo count
		const allTodos = await ctx.db
			.query("todos")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();

		const completedTodos = allTodos.filter((todo) => todo.completed).length;
		const activeTodos = allTodos.length - completedTodos;

		// Mock data for other stats - replace with real queries as needed
		return {
			totalTasks: allTodos.length,
			activeTasks: activeTodos,
			completedTasks: completedTodos,
			completionRate: allTodos.length > 0 ? Math.round((completedTodos / allTodos.length) * 100) : 0,
		};
	},
});

/**
 * Get chart data for activity over time
 * Returns time-series data for the last 7 days
 */
export const getChartData = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthorized: Must be logged in to view dashboard chart data");

		const userId = identity.subject;

		// Get user's todos
		const todos = await ctx.db
			.query("todos")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();

		// Generate data for the last 7 days
		const today = new Date();
		const chartData = [];

		for (let i = 6; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			const dateStr = date.toISOString().split("T")[0];

			// Count todos created on this day
			const dayStart = new Date(date);
			dayStart.setHours(0, 0, 0, 0);
			const dayEnd = new Date(date);
			dayEnd.setHours(23, 59, 59, 999);

			const created = todos.filter((todo) => {
				const createdDate = new Date(todo._creationTime);
				return createdDate >= dayStart && createdDate <= dayEnd;
			}).length;

			const completed = todos.filter((todo) => {
				const createdDate = new Date(todo._creationTime);
				return (
					createdDate >= dayStart &&
					createdDate <= dayEnd &&
					todo.completed
				);
			}).length;

			chartData.push({
				date: dateStr,
				created,
				completed,
			});
		}

		return chartData;
	},
});

/**
 * Get recent activity for data table
 * Returns user's recent todos with details
 */
export const getRecentActivity = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthorized: Must be logged in to view recent activity");

		const userId = identity.subject;

		// Get user's recent todos
		const todos = await ctx.db
			.query("todos")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.order("desc")
			.take(10);

		return todos.map((todo) => ({
			id: todo._id,
			text: todo.text,
			status: todo.completed ? "completed" : "active",
			createdAt: new Date(todo._creationTime).toLocaleDateString(),
			completed: todo.completed,
		}));
	},
});

