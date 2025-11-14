"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";
import { CREDIT_COSTS } from "./credits";
import type { Id } from "./_generated/dataModel";

// Azure OpenAI configuration
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;

// Validate environment variables
if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY || !AZURE_OPENAI_DEPLOYMENT) {
	throw new Error(
		"Missing required Azure OpenAI environment variables. Please configure AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY, and AZURE_OPENAI_DEPLOYMENT."
	);
}

/**
 * Azure OpenAI streaming chunk type
 */
interface AzureOpenAIStreamChunk {
	choices: Array<{
		delta: {
			content?: string;
		};
		finish_reason?: string | null;
	}>;
}

/**
 * Call Azure OpenAI API for chat completions with streaming support
 */
async function callAzureOpenAIStreaming(
	messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
	onChunk: (chunk: string) => Promise<void>,
	options: {
		maxTokens?: number;
	} = {}
): Promise<{ totalTokens: number }> {
	const { maxTokens = 4000 } = options;

	const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-08-01-preview`;

	// Build request with streaming enabled
	const requestBody = {
		messages,
		max_completion_tokens: maxTokens,
		stream: true, // Enable streaming
	};

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"api-key": AZURE_OPENAI_KEY!,
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Azure OpenAI API error (${response.status}): ${errorText}`
			);
		}

		if (!response.body) {
			throw new Error("Response body is null");
		}

		// Process the streaming response
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";
		let totalTokensEstimate = 0;

		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				break;
			}

			// Decode the chunk
			buffer += decoder.decode(value, { stream: true });

			// Process complete lines
			const lines = buffer.split("\n");
			buffer = lines.pop() || ""; // Keep incomplete line in buffer

			for (const line of lines) {
				const trimmedLine = line.trim();

				// Skip empty lines and comments
				if (!trimmedLine || trimmedLine.startsWith(":")) {
					continue;
				}

				// Remove "data: " prefix
				if (trimmedLine.startsWith("data: ")) {
					const data = trimmedLine.slice(6);

					// Check for end of stream
					if (data === "[DONE]") {
						continue;
					}

					try {
						const parsed = JSON.parse(data) as AzureOpenAIStreamChunk;

						// Extract content from delta
						const content = parsed.choices[0]?.delta?.content;
						if (content) {
							await onChunk(content);
							// Rough estimate: ~4 characters per token
							totalTokensEstimate += Math.ceil(content.length / 4);
						}
					} catch (parseError) {
						console.error("Failed to parse streaming chunk:", parseError);
						// Continue processing other chunks
					}
				}
			}
		}

		return { totalTokens: totalTokensEstimate };
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Failed to call Azure OpenAI: ${error.message}`);
		}
		throw new Error("Failed to call Azure OpenAI: Unknown error");
	}
}

/**
 * Send chat message response types
 */
type SendChatMessageSuccessResponse = {
	success: true;
	messageId: Id<"chatMessages">; // Return messageId for frontend polling
	tokensUsed: number;
	creditsRemaining: number;
	sessionId: string;
};

type SendChatMessageErrorResponse = {
	success: false;
	error: string;
};

type SendChatMessageResponse =
	| SendChatMessageSuccessResponse
	| SendChatMessageErrorResponse;

/**
 * Send a chat message and get AI response with streaming support (Task #37.2)
 */
export const sendChatMessage = action({
	args: {
		sessionId: v.id("chatSessions"),
		message: v.string(),
		includeContext: v.optional(v.boolean()),
	},
	handler: async (ctx, args): Promise<SendChatMessageResponse> => {
		let assistantMessageId: Id<"chatMessages"> | null = null;

		try {
			// 1. Authenticate user
			const identity = await ctx.auth.getUserIdentity();
			if (!identity) {
				throw new Error("Unauthorized: Must be logged in to chat");
			}

			// 2. Check credits
			const creditCheck = await ctx.runQuery(api.credits.checkCredits, {
				amount: CREDIT_COSTS.CHAT_MESSAGE,
			});

			if (!creditCheck.hasEnough) {
				throw new Error(
					`Insufficient credits. Chat requires ${CREDIT_COSTS.CHAT_MESSAGE} credits but you only have ${creditCheck.creditsRemaining}. Upgrade to Pro for unlimited credits.`
				);
			}

			// 3. Verify session ownership
			const session: any = await ctx.runQuery(api.chatSessions.getSession, {
				id: args.sessionId,
			});

			if (!session) {
				throw new Error("Session not found");
			}

			// 4. Save user message first
			await ctx.runMutation(api.chatMessages.saveMessage, {
				sessionId: args.sessionId,
				role: "user",
				content: args.message,
				tokens: 0,
				creditsUsed: 0,
			});

			// 5. Get conversation history (last 10 messages)
			const conversationHistory = await ctx.runQuery(
				api.chatMessages.getMessages,
				{
					sessionId: args.sessionId,
					limit: 10,
				}
			);

			// 6. Optionally get user context
			let userContext = "";
			if (args.includeContext) {
				const contextData = await ctx.runQuery(
					internal.chatContext.getUserContext,
					{
						userId: identity.subject,
					}
				);
				userContext = contextData.context;
			}

			// 7. Build messages array for Azure OpenAI
			const messages: Array<{
				role: "user" | "assistant" | "system";
				content: string;
			}> = [];

			// Add system message
			const systemPrompt = `You are a helpful AI assistant for a task and project management application. You can help users with their projects, tasks, contacts, and general questions.

${userContext ? `\n${userContext}\n` : ""}

Be concise, helpful, and professional. When referencing specific items, use their display IDs (e.g., TD-000001, PR-000001).`;

			messages.push({
				role: "system",
				content: systemPrompt,
			});

			// Add conversation history (exclude the just-added user message)
			const historyMessages = conversationHistory.slice(0, -1);
			for (const msg of historyMessages) {
				messages.push({
					role: msg.role as "user" | "assistant",
					content: msg.content,
				});
			}

			// Add current user message
			messages.push({
				role: "user",
				content: args.message,
			});

			// 8. Create streaming placeholder message (Task #37.2 step 1)
			assistantMessageId = await ctx.runMutation(
				internal.chatStreaming.startStreamingMessage,
				{
					sessionId: args.sessionId,
					role: "assistant",
				}
			);

			console.log(
				"Started streaming message:",
				assistantMessageId,
				"for session:",
				session.displayId
			);

			// 9. Set up batching logic (every 10 tokens or 50ms) (Task #37.2 step 3-4)
			let batchBuffer = "";
			let tokenCount = 0;
			let lastUpdateTime = Date.now();
			const BATCH_TOKEN_COUNT = 10;
			const BATCH_TIME_MS = 50;

			const flushBatch = async () => {
				if (batchBuffer && assistantMessageId) {
					await ctx.runMutation(internal.chatStreaming.appendStreamChunk, {
						messageId: assistantMessageId,
						chunk: batchBuffer,
					});
					batchBuffer = "";
				}
			};

			// 10. Call Azure OpenAI with streaming (Task #37.2 step 2)
			console.log("Calling Azure OpenAI with streaming...");
			const result = await callAzureOpenAIStreaming(
				messages,
				async (chunk: string) => {
					// Accumulate chunks
					batchBuffer += chunk;
					tokenCount++;

					const now = Date.now();
					const timeSinceLastUpdate = now - lastUpdateTime;

					// Flush batch if we hit token count or time threshold
					if (tokenCount >= BATCH_TOKEN_COUNT || timeSinceLastUpdate >= BATCH_TIME_MS) {
						await flushBatch();
						lastUpdateTime = now;
						tokenCount = 0;
					}
				},
				{
					maxTokens: 2000,
				}
			);

			// 11. Flush any remaining content
			await flushBatch();

			console.log("Streaming complete. Total tokens:", result.totalTokens);

			// 12. Finalize the streaming message (Task #37.2 step 5)
			await ctx.runMutation(internal.chatStreaming.finalizeStreamMessage, {
				messageId: assistantMessageId,
				tokens: result.totalTokens,
				creditsUsed: CREDIT_COSTS.CHAT_MESSAGE,
			});

			// 13. Deduct credits
			const creditResult: any = await ctx.runMutation(
				api.credits.deductCredits,
				{
					amount: CREDIT_COSTS.CHAT_MESSAGE,
					reason: `Chat message in session ${session.displayId}`,
				}
			);

			// 14. Return response with messageId for frontend polling (Task #37.2 step 7)
			return {
				success: true,
				messageId: assistantMessageId!, // Non-null assertion: guaranteed to exist at this point
				tokensUsed: result.totalTokens,
				creditsRemaining: creditResult.creditsRemaining,
				sessionId: args.sessionId,
			};
		} catch (error) {
			console.error("Chat message failed:", error);

			// Cleanup: If we created a streaming message, mark it as failed
			if (assistantMessageId) {
				try {
					await ctx.runMutation(internal.chatStreaming.finalizeStreamMessage, {
						messageId: assistantMessageId,
						tokens: 0,
						creditsUsed: 0,
					});
				} catch (cleanupError) {
					console.error("Failed to cleanup streaming message:", cleanupError);
				}
			}

			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to process chat message",
			};
		}
	},
});
