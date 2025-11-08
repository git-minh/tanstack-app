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
		displayId: v.string(),
		parentTaskId: v.optional(v.id("tasks")),
		level: v.number(),
		sortPath: v.string(),
	})
		.index("by_userId", ["userId"])
		.index("by_dueDate", ["dueDate"])
		.index("by_displayId", ["displayId"])
		.index("by_parentTaskId", ["parentTaskId"])
		.index("by_userId_and_level", ["userId", "level"])
		.index("by_userId_and_sortPath", ["userId", "sortPath"]),
	contacts: defineTable({
		firstName: v.string(),
		lastName: v.string(),
		email: v.string(),
		phone: v.optional(v.string()),
		company: v.optional(v.string()),
		title: v.optional(v.string()),
		department: v.optional(v.string()),
		website: v.optional(v.string()),
		address: v.optional(v.string()),
		notes: v.optional(v.string()),
		status: v.string(),
		category: v.string(),
		userId: v.string(),
		displayId: v.string(),
	})
		.index("by_userId", ["userId"])
		.index("by_status", ["status"])
		.index("by_category", ["category"])
		.index("by_email", ["email"])
		.index("by_displayId", ["displayId"]),
	counters: defineTable({
		name: v.string(),
		value: v.number(),
	}).index("by_name", ["name"]),
});
