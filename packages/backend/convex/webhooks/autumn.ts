import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { logger, safeStringify } from "../lib/logger";

interface AutumnWebhookPayload {
	type?: string;
	event_type?: string;
	customer_id?: string;
	metadata?: {
		type?: string;
		credits?: string;
		packageId?: string;
	};
	id?: string;
	product_id?: string;
	status?: string;
	error?: string;
}

/**
 * Autumn webhook handler for payment events
 * This endpoint receives notifications from Autumn when payments are completed
 */
export const handleAutumnWebhook = httpAction(async (ctx, request) => {
	try {
		const body = (await request.json()) as AutumnWebhookPayload;

		logger.debug("Autumn webhook received:", safeStringify(body));

		// Verify webhook signature (implement based on Autumn's webhook security)
		const signature = request.headers.get("x-autumn-signature");
		const isValid = await verifyAutumnSignature(body, signature);

		if (!isValid) {
			logger.error("Invalid webhook signature");
			return new Response("Unauthorized", { status: 401 });
		}

		// Handle different event types
		const eventType = body.type || body.event_type;

		switch (eventType) {
			case "checkout.completed":
			case "payment.succeeded":
				await handlePaymentSuccess(ctx, body);
				break;

			case "checkout.failed":
			case "payment.failed":
				await handlePaymentFailure(ctx, body);
				break;

			case "subscription.created":
			case "subscription.updated":
				await handleSubscriptionUpdate(ctx, body);
				break;

			case "subscription.cancelled":
			case "subscription.deleted":
				await handleSubscriptionCancellation(ctx, body);
				break;

			default:
				logger.debug(`Unhandled webhook event type: ${eventType}`);
		}

		return new Response(JSON.stringify({ received: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		logger.error("Webhook processing error:", error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Internal server error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
});

/**
 * Verify Autumn webhook signature
 */
async function verifyAutumnSignature(
	_body: AutumnWebhookPayload,
	signature: string | null
): Promise<boolean> {
	// TODO: Implement proper signature verification based on Autumn's documentation
	// For now, check if signature exists and webhook secret is configured
	const webhookSecret = process.env.AUTUMN_WEBHOOK_SECRET;

	if (!webhookSecret) {
		logger.warn("AUTUMN_WEBHOOK_SECRET not configured, skipping verification");
		return true; // Allow in development, but log warning
	}

	if (!signature) {
		return false;
	}

	// Implement actual signature verification here
	// Example: Use crypto.subtle.digest or similar based on Autumn's spec
	return true; // Placeholder
}

/**
 * Handle successful payment for credit purchase
 */
async function handlePaymentSuccess(ctx: any, body: AutumnWebhookPayload) {
	const { customer_id: customerId, metadata } = body;

	if (!customerId) {
		throw new Error("Missing customer_id in webhook payload");
	}

	// Check if this is a credit purchase
	if (metadata?.type === "credit_purchase") {
		const creditsStr = metadata.credits;
		if (!creditsStr) {
			throw new Error("Missing credits amount in metadata");
		}

		const credits = parseInt(creditsStr, 10);

		if (isNaN(credits) || credits <= 0) {
			throw new Error("Invalid credits amount in metadata");
		}

		// Add credits to user account
		await ctx.runMutation(internal.webhooks.autumn.addCreditsInternal, {
			userId: customerId,
			amount: credits,
			reason: `Credit purchase: ${metadata.packageId || "unknown package"}`,
		});

		logger.debug(
			`Added ${credits} credits to user ${customerId} from payment ${body.id || "unknown"}`
		);
	}
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(_ctx: any, body: AutumnWebhookPayload) {
	const { customer_id: customerId, error } = body;

	logger.error(
		`Payment failed for customer ${customerId}:`,
		error || "Unknown error"
	);

	// TODO: Notify user about payment failure
	// Could send an email or in-app notification
}

/**
 * Get list of Pro plan product IDs from environment
 * Configure in Convex dashboard: PRO_PRODUCT_IDS="prod_xxx,prod_yyy"
 */
function getProProductIds(): Set<string> {
	const proIds = process.env.PRO_PRODUCT_IDS || "";
	return new Set(
		proIds
			.split(",")
			.map((id) => id.trim())
			.filter((id) => id.length > 0)
	);
}

/**
 * Handle subscription creation/update (e.g., upgrading to Pro)
 */
async function handleSubscriptionUpdate(ctx: any, body: AutumnWebhookPayload) {
	const { customer_id: customerId, product_id: productId, status } = body;

	if (!customerId) {
		throw new Error("Missing customer_id in webhook payload");
	}

	if (!productId) {
		logger.warn("Subscription update missing product_id, skipping");
		return;
	}

	// Check if this is a Pro plan subscription using explicit product ID matching
	const proProductIds = getProProductIds();
	const normalizedProductId = productId.toLowerCase().trim();
	const isProPlan = proProductIds.has(normalizedProductId);

	if (isProPlan && status === "active") {
		await ctx.runMutation(internal.webhooks.autumn.upgradeToProInternal, {
			userId: customerId,
		});

		logger.debug(`Upgraded user ${customerId} to Pro plan (product: ${productId})`);
	} else if (!isProPlan) {
		logger.debug(
			`Subscription update for non-Pro product ${productId}, no action taken`
		);
	}
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancellation(ctx: any, body: AutumnWebhookPayload) {
	const { customer_id: customerId } = body;

	if (!customerId) {
		throw new Error("Missing customer_id in webhook payload");
	}

	await ctx.runMutation(internal.webhooks.autumn.downgradeToFreeInternal, {
		userId: customerId,
	});

	logger.debug(`Downgraded user ${customerId} to Free plan`);
}

/**
 * Internal mutation to add credits (called from webhook)
 */
export const addCreditsInternal = internalMutation({
	args: {
		userId: v.string(),
		amount: v.number(),
		reason: v.optional(v.string()),
	},
	handler: async (ctx, { userId, amount, reason }) => {
		// Get or create user usage record
		const existing = await ctx.db
			.query("userUsage")
			.withIndex("by_userId", (q: any) => q.eq("userId", userId))
			.first();

		if (existing) {
			const creditsRemaining = existing.creditsRemaining ?? 100;
			const newBalance = creditsRemaining + amount;

			await ctx.db.patch(existing._id, {
				creditsRemaining: newBalance,
			});

			logger.debug(
				`Credits added to existing user: ${amount} (${reason || "no reason"}). New balance: ${newBalance}`
			);
		} else {
			// Create new usage record
			await ctx.db.insert("userUsage", {
				userId,
				aiGenerationCount: 0,
				subscriptionTier: "free",
				lastResetDate: Date.now(),
				creditsRemaining: 100 + amount,
				creditsTotal: 100,
				lastCreditReset: Date.now(),
			});

			logger.debug(
				`Credits added to new user: ${amount} (${reason || "no reason"})`
			);
		}

		return { success: true };
	},
});

/**
 * Internal mutation to upgrade user to Pro
 */
export const upgradeToProInternal = internalMutation({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, { userId }) => {
		const existing = await ctx.db
			.query("userUsage")
			.withIndex("by_userId", (q: any) => q.eq("userId", userId))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				subscriptionTier: "pro",
			});
		} else {
			await ctx.db.insert("userUsage", {
				userId,
				aiGenerationCount: 0,
				subscriptionTier: "pro",
				lastResetDate: Date.now(),
				creditsRemaining: 0, // Pro has unlimited credits
				creditsTotal: 0,
				lastCreditReset: Date.now(),
			});
		}

		return { success: true };
	},
});

/**
 * Internal mutation to downgrade user to Free
 */
export const downgradeToFreeInternal = internalMutation({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, { userId }) => {
		const existing = await ctx.db
			.query("userUsage")
			.withIndex("by_userId", (q: any) => q.eq("userId", userId))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				subscriptionTier: "free",
				creditsRemaining: 100,
				creditsTotal: 100,
				lastCreditReset: Date.now(),
			});
		}

		return { success: true };
	},
});
