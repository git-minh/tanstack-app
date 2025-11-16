import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	todos: defineTable({
		text: v.string(),
		completed: v.boolean(),
		userId: v.string(),
	}).index("by_userId", ["userId"]),
	projects: defineTable({
		name: v.string(),
		description: v.optional(v.string()),
		status: v.string(),
		priority: v.string(),
		color: v.optional(v.string()),
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
		userId: v.string(),
		displayId: v.string(),
		parentProjectId: v.optional(v.id("projects")),
		level: v.number(),
		sortPath: v.string(),
	})
		.index("by_userId", ["userId"])
		.index("by_status", ["status"])
		.index("by_displayId", ["displayId"])
		.index("by_parentProjectId", ["parentProjectId"])
		.index("by_userId_and_level", ["userId", "level"])
		.index("by_userId_and_sortPath", ["userId", "sortPath"])
		.index("by_userId_and_status", ["userId", "status"])
		.index("by_userId_and_priority", ["userId", "priority"])
		.searchIndex("search_name", {
			searchField: "name",
			filterFields: ["userId", "status"],
		}),
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
		projectId: v.optional(v.id("projects")),
		level: v.number(),
		sortPath: v.string(),
	})
		.index("by_userId", ["userId"])
		.index("by_dueDate", ["dueDate"])
		.index("by_displayId", ["displayId"])
		.index("by_parentTaskId", ["parentTaskId"])
		.index("by_projectId", ["projectId"])
		.index("by_userId_and_projectId", ["userId", "projectId"])
		.index("by_userId_and_level", ["userId", "level"])
		.index("by_userId_and_sortPath", ["userId", "sortPath"])
		.searchIndex("search_title", {
			searchField: "title",
			filterFields: ["userId", "status"],
		}),
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
	userUsage: defineTable({
		userId: v.string(),
		aiGenerationCount: v.number(),
		subscriptionTier: v.string(), // "free" or "pro"
		lastResetDate: v.number(), // Monthly reset timestamp
		creditsRemaining: v.number(), // Current available credits
		creditsTotal: v.number(), // Total credits for current tier (100 for free)
		lastCreditReset: v.number(), // Timestamp of last monthly credit reset
		websiteCrawlsThisHour: v.optional(v.array(v.number())), // Timestamps of crawls in last hour
	}).index("by_userId", ["userId"]),
	chatSessions: defineTable({
		userId: v.string(),
		displayId: v.string(),
		title: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
		messageCount: v.number(),
	})
		.index("by_userId", ["userId"])
		.index("by_displayId", ["displayId"])
		.index("by_userId_and_updatedAt", ["userId", "updatedAt"]),
	chatMessages: defineTable({
		sessionId: v.id("chatSessions"),
		userId: v.string(),
		role: v.string(), // "user" or "assistant"
		content: v.string(),
		tokens: v.optional(v.number()),
		creditsUsed: v.optional(v.number()),
		createdAt: v.number(),
		isStreaming: v.optional(v.boolean()),
	})
		.index("by_sessionId", ["sessionId"])
		.index("by_userId", ["userId"]),
	designReferences: defineTable({
		userId: v.string(),
		displayId: v.string(),
		url: v.string(),
		siteName: v.string(),
		description: v.optional(v.string()),
		analysis: v.object({
			uiPatterns: v.array(v.string()),
			colorPalette: v.object({
				primary: v.array(v.string()),
				secondary: v.array(v.string()),
				accent: v.array(v.string()),
			}),
			typography: v.object({
				headingFont: v.optional(v.string()),
				bodyFont: v.optional(v.string()),
				sizes: v.optional(
					v.object({
						h1: v.optional(v.string()),
						h2: v.optional(v.string()),
						h3: v.optional(v.string()),
						body: v.optional(v.string()),
					})
				),
			}),
			techStack: v.array(v.string()),
			components: v.array(
				v.object({
					name: v.string(),
					description: v.string(),
				})
			),
		}),
		clonePrompts: v.object({
			fullPage: v.string(),
			components: v.array(
				v.object({
					name: v.string(),
					prompt: v.string(),
				})
			),
			designSystem: v.string(),
		}),
		tags: v.array(v.string()),
		style: v.string(), // "minimal", "corporate", "creative", etc.
		industry: v.optional(v.string()),
		thumbnail: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_userId", ["userId"])
		.index("by_displayId", ["displayId"])
		.index("by_userId_and_style", ["userId", "style"]),
});
