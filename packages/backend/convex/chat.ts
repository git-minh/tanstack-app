"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";
import { CREDIT_COSTS } from "./credits";

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
 * Azure OpenAI API response type
 */
interface AzureOpenAIResponse {
	choices: Array<{
		message: {
			content: string;
		};
	}>;
	usage?: {
		total_tokens: number;
		prompt_tokens: number;
		completion_tokens: number;
	};
}

/**
 * Call Azure OpenAI API for chat completions
 */
async function callAzureOpenAI(
	messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
	options: {
		maxTokens?: number;
	} = {}
): Promise<AzureOpenAIResponse> {
	const { maxTokens = 4000 } = options;

	const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-08-01-preview`;

	// Build request for o1-mini model
	const requestBody = {
		messages,
		max_completion_tokens: maxTokens,
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

		const data = (await response.json()) as AzureOpenAIResponse;

		if (!data.choices || !data.choices[0] || !data.choices[0].message) {
			throw new Error("Invalid response structure from Azure OpenAI");
		}

		return data;
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
	message: string;
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
 * Send a chat message and get AI response
 */
export const sendChatMessage = action({
	args: {
		sessionId: v.id("chatSessions"),
		message: v.string(),
		includeContext: v.optional(v.boolean()),
	},
	handler: async (ctx, args): Promise<SendChatMessageResponse> => {
		try {
			// 1. Authenticate user
			const identity = await ctx.auth.getUserIdentity();
			if (!identity) {
				throw new Error("Unauthorized: Must be logged in to chat");
			}

			// 2. Check credits (Task #35.4 step 1)
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

			// 4. Get conversation history (last 10 messages) (Task #35.4 step 2)
			const conversationHistory = await ctx.runQuery(
				api.chatMessages.getMessages,
				{
					sessionId: args.sessionId,
					limit: 10,
				}
			);

			// 5. Optionally get user context (Task #35.4 step 3)
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

			// 6. Build messages array for Azure OpenAI (Task #35.4 step 4)
			const messages: Array<{
				role: "user" | "assistant" | "system";
				content: string;
			}> = [];

			// Add system message with optional context
			const systemPrompt = `You are a helpful AI assistant for a task and project management application. You can help users with their projects, tasks, contacts, and general questions.

${userContext ? `\n${userContext}\n` : ""}

Be concise, helpful, and professional. When referencing specific items, use their display IDs (e.g., TD-000001, PR-000001).`;

			// For o1-mini, combine system message with conversation
			// Start with system context
			let combinedUserMessage = systemPrompt + "\n\n---\n\n";

			// Add conversation history
			if (conversationHistory.length > 0) {
				combinedUserMessage += "Previous conversation:\n\n";
				for (const msg of conversationHistory) {
					combinedUserMessage += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n\n`;
				}
				combinedUserMessage += "---\n\n";
			}

			// Add current user message
			combinedUserMessage += `Current user message: ${args.message}`;

			messages.push({
				role: "user",
				content: combinedUserMessage,
			});

			// 7. Call Azure OpenAI API (Task #35.4 step 5)
			console.log("Calling Azure OpenAI for chat...");
			const aiResponse = await callAzureOpenAI(messages, {
				maxTokens: 2000,
			});

			if (!aiResponse.choices[0]?.message?.content) {
				throw new Error("AI response is missing content");
			}

			const assistantMessage = aiResponse.choices[0].message.content;
			const tokensUsed = aiResponse.usage?.total_tokens ?? 0;

			console.log("AI response received:", {
				length: assistantMessage.length,
				tokens: tokensUsed,
			});

			// 8. Save user message (Task #35.4 step 6)
			await ctx.runMutation(api.chatMessages.saveMessage, {
				sessionId: args.sessionId,
				role: "user",
				content: args.message,
				tokens: 0, // We don't track individual message tokens
				creditsUsed: 0,
			});

			// 9. Save assistant response (Task #35.4 step 6)
			await ctx.runMutation(api.chatMessages.saveMessage, {
				sessionId: args.sessionId,
				role: "assistant",
				content: assistantMessage,
				tokens: tokensUsed,
				creditsUsed: CREDIT_COSTS.CHAT_MESSAGE,
			});

			// 10. Deduct credits (Task #35.4 step 7)
			const creditResult: any = await ctx.runMutation(api.credits.deductCredits, {
				amount: CREDIT_COSTS.CHAT_MESSAGE,
				reason: `Chat message in session ${session.displayId}`,
			});

			// 11. Return response with credit balance (Task #35.4 step 9)
			return {
				success: true,
				message: assistantMessage,
				tokensUsed,
				creditsRemaining: creditResult.creditsRemaining,
				sessionId: args.sessionId,
			};
		} catch (error) {
			console.error("Chat message failed:", error);

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
