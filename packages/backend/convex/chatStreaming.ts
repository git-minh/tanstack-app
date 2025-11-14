import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/**
 * Subtask 37.1: Streaming mutations for real-time message display
 *
 * These mutations manage the streaming state of assistant messages:
 * - startStreamingMessage: Creates a placeholder message with isStreaming=true
 * - appendStreamChunk: Appends tokens to message content
 * - finalizeStreamMessage: Marks message as complete with final token count
 *
 * These are internal mutations that should only be called from the chat action.
 */

/**
 * Start a new streaming message
 * Creates a placeholder message with empty content and isStreaming=true
 */
export const startStreamingMessage = internalMutation({
	args: {
		sessionId: v.id("chatSessions"),
		role: v.string(), // "assistant" typically
	},
	handler: async (ctx, args): Promise<Id<"chatMessages">> => {
		// 1. Authenticate user
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in");
		}

		// 2. Verify session ownership
		const session = await ctx.db.get(args.sessionId);
		if (!session) {
			throw new Error("Session not found");
		}
		if (session.userId !== identity.subject) {
			throw new Error("Unauthorized: Session does not belong to user");
		}

		// 3. Create placeholder message with isStreaming=true
		const messageId = await ctx.db.insert("chatMessages", {
			sessionId: args.sessionId,
			userId: identity.subject,
			role: args.role,
			content: "", // Empty content initially
			tokens: 0,
			creditsUsed: 0,
			createdAt: Date.now(),
			isStreaming: true, // Flag for streaming state
		});

		return messageId;
	},
});

/**
 * Append a chunk of tokens to a streaming message
 * Updates the content of an existing message with new tokens
 */
export const appendStreamChunk = internalMutation({
	args: {
		messageId: v.id("chatMessages"),
		chunk: v.string(), // New tokens to append
	},
	handler: async (ctx, args): Promise<void> => {
		// 1. Authenticate user
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in");
		}

		// 2. Get the message
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new Error("Message not found");
		}

		// 3. Verify ownership
		if (message.userId !== identity.subject) {
			throw new Error("Unauthorized: Message does not belong to user");
		}

		// 4. Verify message is still streaming
		if (!message.isStreaming) {
			throw new Error("Message is not in streaming state");
		}

		// 5. Append the chunk to existing content
		await ctx.db.patch(args.messageId, {
			content: message.content + args.chunk,
		});
	},
});

/**
 * Finalize a streaming message
 * Marks the message as complete and updates final metadata
 */
export const finalizeStreamMessage = internalMutation({
	args: {
		messageId: v.id("chatMessages"),
		tokens: v.number(), // Final token count
		creditsUsed: v.number(), // Credits consumed
	},
	handler: async (ctx, args): Promise<void> => {
		// 1. Authenticate user
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Must be logged in");
		}

		// 2. Get the message
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new Error("Message not found");
		}

		// 3. Verify ownership
		if (message.userId !== identity.subject) {
			throw new Error("Unauthorized: Message does not belong to user");
		}

		// 4. Finalize the message
		await ctx.db.patch(args.messageId, {
			isStreaming: false, // Mark streaming as complete
			tokens: args.tokens,
			creditsUsed: args.creditsUsed,
		});
	},
});
