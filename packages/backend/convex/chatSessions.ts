import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateDisplayId } from "./counters";

/**
 * Create a new chat session
 */
export const createSession = mutation({
	args: {
		title: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const displayId = await generateDisplayId(ctx, "chatSessions");
		const now = Date.now();

		const sessionId = await ctx.db.insert("chatSessions", {
			userId: identity.subject,
			displayId,
			title: args.title || "New Chat",
			createdAt: now,
			updatedAt: now,
			messageCount: 0,
		});

		return {
			_id: sessionId,
			displayId,
			title: args.title || "New Chat",
		};
	},
});

/**
 * Get all chat sessions for the current user
 */
export const getSessions = query({
	args: {
		limit: v.optional(v.number()),
		offset: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const limit = args.limit ?? 50;
		const offset = args.offset ?? 0;

		const sessions = await ctx.db
			.query("chatSessions")
			.withIndex("by_userId_and_updatedAt", (q) =>
				q.eq("userId", identity.subject)
			)
			.order("desc")
			.take(limit + offset);

		// Apply offset manually (skip first N items)
		const paginatedSessions = sessions.slice(offset, offset + limit);

		return {
			sessions: paginatedSessions,
			total: sessions.length,
			hasMore: sessions.length > offset + limit,
		};
	},
});

/**
 * Get a single chat session by ID or displayId
 */
export const getSession = query({
	args: {
		id: v.optional(v.id("chatSessions")),
		displayId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		if (!args.id && !args.displayId) {
			throw new Error("Either id or displayId must be provided");
		}

		let session;

		if (args.id) {
			session = await ctx.db.get(args.id);
		} else if (args.displayId) {
			session = await ctx.db
				.query("chatSessions")
				.withIndex("by_displayId", (q) => q.eq("displayId", args.displayId!))
				.first();
		}

		if (!session) {
			return null;
		}

		// Verify ownership
		if (session.userId !== identity.subject) {
			throw new Error("Unauthorized: You don't own this session");
		}

		return session;
	},
});

/**
 * Delete a chat session (and all its messages)
 */
export const deleteSession = mutation({
	args: {
		id: v.id("chatSessions"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const session = await ctx.db.get(args.id);
		if (!session) {
			throw new Error("Session not found");
		}

		// Verify ownership
		if (session.userId !== identity.subject) {
			throw new Error("Unauthorized: You don't own this session");
		}

		// Delete all messages in this session
		const messages = await ctx.db
			.query("chatMessages")
			.withIndex("by_sessionId", (q) => q.eq("sessionId", args.id))
			.collect();

		for (const message of messages) {
			await ctx.db.delete(message._id);
		}

		// Delete the session
		await ctx.db.delete(args.id);

		return { success: true };
	},
});

/**
 * Update chat session title
 */
export const updateSessionTitle = mutation({
	args: {
		id: v.id("chatSessions"),
		title: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const session = await ctx.db.get(args.id);
		if (!session) {
			throw new Error("Session not found");
		}

		// Verify ownership
		if (session.userId !== identity.subject) {
			throw new Error("Unauthorized: You don't own this session");
		}

		await ctx.db.patch(args.id, {
			title: args.title,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});
