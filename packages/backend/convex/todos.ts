import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

export const getAll = query({
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Unauthorized: Must be logged in to view todos");
		}
		// Return only the current user's todos
		return await ctx.db
			.query("todos")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.collect();
	},
});

export const create = mutation({
	args: {
		text: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Unauthorized: Must be logged in to create todos");
		}
		const newTodoId = await ctx.db.insert("todos", {
			text: args.text,
			completed: false,
			userId: user._id,
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
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Unauthorized: Must be logged in to update todos");
		}
		// Verify the todo belongs to the current user
		const todo = await ctx.db.get(args.id);
		if (!todo) {
			throw new Error("Todo not found");
		}
		if (todo.userId !== user._id) {
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
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Unauthorized: Must be logged in to delete todos");
		}
		// Verify the todo belongs to the current user
		const todo = await ctx.db.get(args.id);
		if (!todo) {
			throw new Error("Todo not found");
		}
		if (todo.userId !== user._id) {
			throw new Error("Unauthorized: Cannot delete another user's todo");
		}
		await ctx.db.delete(args.id);
		return { success: true };
	},
});
