import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get all messages for a chat session
 */
export const getMessages = query({
	args: {
		sessionId: v.id("chatSessions"),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		// Verify session ownership
		const session = await ctx.db.get(args.sessionId);
		if (!session) {
			throw new Error("Session not found");
		}

		if (session.userId !== identity.subject) {
			throw new Error("Unauthorized: You don't own this session");
		}

		const limit = args.limit ?? 100;

		const messages = await ctx.db
			.query("chatMessages")
			.withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
			.order("asc") // Oldest first for conversation flow
			.take(limit);

		return messages;
	},
});

/**
 * Save a new message to a chat session
 */
export const saveMessage = mutation({
	args: {
		sessionId: v.id("chatSessions"),
		role: v.string(), // "user" or "assistant"
		content: v.string(),
		tokens: v.optional(v.number()),
		creditsUsed: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		// Verify session ownership
		const session = await ctx.db.get(args.sessionId);
		if (!session) {
			throw new Error("Session not found");
		}

		if (session.userId !== identity.subject) {
			throw new Error("Unauthorized: You don't own this session");
		}

		const messageId = await ctx.db.insert("chatMessages", {
			sessionId: args.sessionId,
			userId: identity.subject,
			role: args.role,
			content: args.content,
			tokens: args.tokens,
			creditsUsed: args.creditsUsed,
			createdAt: Date.now(),
		});

		// Update session message count and updatedAt
		await ctx.db.patch(args.sessionId, {
			messageCount: session.messageCount + 1,
			updatedAt: Date.now(),
		});

		return messageId;
	},
});

/**
 * Delete a message (optional - for cleanup)
 */
export const deleteMessage = mutation({
	args: {
		id: v.id("chatMessages"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const message = await ctx.db.get(args.id);
		if (!message) {
			throw new Error("Message not found");
		}

		// Verify ownership
		if (message.userId !== identity.subject) {
			throw new Error("Unauthorized: You don't own this message");
		}

		// Get session to decrement message count
		const session = await ctx.db.get(message.sessionId);
		if (session) {
			await ctx.db.patch(message.sessionId, {
				messageCount: Math.max(0, session.messageCount - 1),
				updatedAt: Date.now(),
			});
		}

		await ctx.db.delete(args.id);

		return { success: true };
	},
});
