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
