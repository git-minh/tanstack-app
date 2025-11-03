import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	todos: defineTable({
		text: v.string(),
		completed: v.boolean(),
		userId: v.string(),
	}).index("by_userId", ["userId"]),
	tasks: defineTable({
		title: v.string(),
		status: v.string(),
		label: v.string(),
		priority: v.string(),
		userId: v.string(),
		description: v.optional(v.string()),
		dueDate: v.optional(v.number()),
	})
		.index("by_userId", ["userId"])
		.index("by_dueDate", ["dueDate"]),
});
