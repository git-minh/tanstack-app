import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view todos");
		}
		// Return only the current user's todos, ordered by creation time (newest first)
		const todos = await ctx.db
			.query("todos")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.order("desc")
			.collect();

		// Sort by completion status (incomplete first), then by creation time
		return todos.sort((a, b) => {
			// Incomplete todos come first
			if (a.completed !== b.completed) {
				return a.completed ? 1 : -1;
			}
			// Within same completion status, sort by creation time (newest first)
			return b._creationTime - a._creationTime;
		});
	},
});

export const create = mutation({
	args: {
		text: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to create todos");
		}
		const newTodoId = await ctx.db.insert("todos", {
			text: args.text,
			completed: false,
			userId: identity.subject,
		});
		return await ctx.db.get(newTodoId);
	},
});

export const toggle = mutation({
	args: {
		id: v.id("todos"),
		completed: v.boolean(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to update todos");
		}
		// Verify the todo belongs to the current user
		const todo = await ctx.db.get(args.id);
		if (!todo) {
			throw new Error("Todo not found");
		}
		if (todo.userId !== identity.subject) {
			throw new Error("Unauthorized: Cannot update another user's todo");
		}
		await ctx.db.patch(args.id, { completed: args.completed });
		return { success: true };
	},
});

export const deleteTodo = mutation({
	args: {
		id: v.id("todos"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to delete todos");
		}
		// Verify the todo belongs to the current user
		const todo = await ctx.db.get(args.id);
		if (!todo) {
			throw new Error("Todo not found");
		}
		if (todo.userId !== identity.subject) {
			throw new Error("Unauthorized: Cannot delete another user's todo");
		}
		await ctx.db.delete(args.id);
		return { success: true };
	},
});

/**
 * Update todo text
 */
export const updateText = mutation({
	args: {
		id: v.id("todos"),
		text: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to update todos");
		}
		// Verify the todo belongs to the current user
		const todo = await ctx.db.get(args.id);
		if (!todo) {
			throw new Error("Todo not found");
		}
		if (todo.userId !== identity.subject) {
			throw new Error("Unauthorized: Cannot update another user's todo");
		}
		await ctx.db.patch(args.id, { text: args.text });
		return await ctx.db.get(args.id);
	},
});

/**
 * Delete all completed todos
 */
export const deleteCompleted = mutation({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to delete todos");
		}
		// Get all completed todos for the user
		const completedTodos = await ctx.db
			.query("todos")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		const todosToDelete = completedTodos.filter((todo) => todo.completed);

		// Delete each completed todo
		for (const todo of todosToDelete) {
			await ctx.db.delete(todo._id);
		}

		return { success: true, deleted: todosToDelete.length };
	},
});

/**
 * Get todo statistics
 */
export const getTodoStats = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to view stats");
		}

		const todos = await ctx.db
			.query("todos")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.collect();

		const completed = todos.filter((t) => t.completed).length;
		const pending = todos.filter((t) => !t.completed).length;
		const total = todos.length;

		// Calculate completion rate
		const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

		// Get today's created todos
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayMs = today.getTime();

		const todaysTodos = todos.filter((t) => t._creationTime >= todayMs);
		const todaysCompleted = todaysTodos.filter((t) => t.completed).length;

		return {
			total,
			completed,
			pending,
			completionRate,
			todaysTotal: todaysTodos.length,
			todaysCompleted,
		};
	},
});

/**
 * Delete multiple todos
 */
export const deleteMany = mutation({
	args: {
		ids: v.array(v.id("todos")),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in to delete todos");
		}

		// Verify all todos belong to the current user
		for (const id of args.ids) {
			const todo = await ctx.db.get(id);
			if (!todo) {
				throw new Error(`Todo ${id} not found`);
			}
			if (todo.userId !== identity.subject) {
				throw new Error(`Unauthorized: Cannot delete todo ${id}`);
			}
		}

		// Delete all todos
		for (const id of args.ids) {
			await ctx.db.delete(id);
		}

		return { success: true, deleted: args.ids.length };
	},
});
