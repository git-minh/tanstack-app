import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

const FREE_TIER_CREDITS = 100;

// Credit costs for different operations
export const CREDIT_COSTS = {
	CHAT_MESSAGE: 3,
	AI_GENERATION: 15,
	URL_SCRAPE: 5,
	WEBSITE_ANALYSIS: 10,
} as const;

/**
 * Get user usage record (read-only for queries)
 */
async function getUserUsageRecord(ctx: QueryCtx, userId: string) {
	return await ctx.db
		.query("userUsage")
		.withIndex("by_userId", (q: any) => q.eq("userId", userId))
		.first();
}

/**
 * Get or create user usage record with credit fields (for mutations)
 */
async function ensureUserUsageWithCredits(ctx: MutationCtx, userId: string) {
	const existing = await ctx.db
		.query("userUsage")
		.withIndex("by_userId", (q: any) => q.eq("userId", userId))
		.first();

	if (existing) {
		// Check if credits need monthly reset
		const now = Date.now();
		const lastReset = existing.lastCreditReset || existing.lastResetDate;
		const lastResetDate = new Date(lastReset);
		const currentDate = new Date(now);

		// Reset if it's a new month (only for free tier)
		if (
			existing.subscriptionTier === "free" &&
			(lastResetDate.getMonth() !== currentDate.getMonth() ||
				lastResetDate.getFullYear() !== currentDate.getFullYear())
		) {
			const creditsTotal = existing.creditsTotal || FREE_TIER_CREDITS;
			await ctx.db.patch(existing._id, {
				creditsRemaining: creditsTotal,
				lastCreditReset: now,
			});
			return {
				...existing,
				creditsRemaining: creditsTotal,
				lastCreditReset: now,
			};
		}

		// Migrate old records that don't have credit fields
		if (
			existing.creditsRemaining === undefined ||
			existing.creditsTotal === undefined ||
			existing.lastCreditReset === undefined
		) {
			await ctx.db.patch(existing._id, {
				creditsRemaining: FREE_TIER_CREDITS,
				creditsTotal: FREE_TIER_CREDITS,
				lastCreditReset: Date.now(),
			});
			return {
				...existing,
				creditsRemaining: FREE_TIER_CREDITS,
				creditsTotal: FREE_TIER_CREDITS,
				lastCreditReset: Date.now(),
			};
		}

		return existing;
	}

	// Create new usage record for user
	const id = await ctx.db.insert("userUsage", {
		userId,
		aiGenerationCount: 0,
		subscriptionTier: "free",
		lastResetDate: Date.now(),
		creditsRemaining: FREE_TIER_CREDITS,
		creditsTotal: FREE_TIER_CREDITS,
		lastCreditReset: Date.now(),
	});

	return {
		_id: id,
		userId,
		aiGenerationCount: 0,
		subscriptionTier: "free",
		lastResetDate: Date.now(),
		creditsRemaining: FREE_TIER_CREDITS,
		creditsTotal: FREE_TIER_CREDITS,
		lastCreditReset: Date.now(),
	};
}

/**
 * Get current credit balance for authenticated user
 */
export const getUserCredits = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const usage = await getUserUsageRecord(ctx, identity.subject);

		// Return default values for new users
		if (!usage) {
			return {
				creditsRemaining: FREE_TIER_CREDITS,
				creditsTotal: FREE_TIER_CREDITS,
				tier: "free" as const,
				isUnlimited: false,
				lastCreditReset: Date.now(),
			};
		}

		const isProTier = usage.subscriptionTier === "pro";
		const creditsRemaining = usage.creditsRemaining ?? FREE_TIER_CREDITS;
		const creditsTotal = usage.creditsTotal ?? FREE_TIER_CREDITS;
		const lastCreditReset = usage.lastCreditReset ?? usage.lastResetDate ?? Date.now();

		return {
			creditsRemaining: isProTier ? Infinity : creditsRemaining,
			creditsTotal: isProTier ? Infinity : creditsTotal,
			tier: usage.subscriptionTier as "free" | "pro",
			isUnlimited: isProTier,
			lastCreditReset,
		};
	},
});

/**
 * Check if user has enough credits for an operation
 */
export const checkCredits = query({
	args: {
		amount: v.number(),
	},
	handler: async (ctx, { amount }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const usage = await getUserUsageRecord(ctx, identity.subject);

		if (!usage) {
			return {
				hasEnough: amount <= FREE_TIER_CREDITS,
				creditsRemaining: FREE_TIER_CREDITS,
			};
		}

		// Pro tier has unlimited credits
		if (usage.subscriptionTier === "pro") {
			return {
				hasEnough: true,
				creditsRemaining: Infinity,
			};
		}

		const creditsRemaining = usage.creditsRemaining ?? FREE_TIER_CREDITS;

		return {
			hasEnough: creditsRemaining >= amount,
			creditsRemaining,
		};
	},
});

/**
 * Deduct credits from user account (atomic operation)
 */
export const deductCredits = mutation({
	args: {
		amount: v.number(),
		reason: v.optional(v.string()),
	},
	handler: async (ctx, { amount, reason }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const usage = await ensureUserUsageWithCredits(ctx, identity.subject);

		// Pro tier has unlimited credits
		if (usage.subscriptionTier === "pro") {
			return {
				success: true,
				creditsRemaining: Infinity,
				creditsDeducted: 0, // No actual deduction for pro
			};
		}

		const creditsRemaining = usage.creditsRemaining ?? FREE_TIER_CREDITS;

		// Check if user has enough credits
		if (creditsRemaining < amount) {
			throw new Error(
				`Insufficient credits. You need ${amount} credits but only have ${creditsRemaining}. Upgrade to Pro for unlimited credits.`
			);
		}

		// Deduct credits atomically
		const newBalance = creditsRemaining - amount;
		await ctx.db.patch(usage._id, {
			creditsRemaining: newBalance,
		});

		console.log(
			`Credits deducted: ${amount} (${reason || "no reason"}). New balance: ${newBalance}`
		);

		return {
			success: true,
			creditsRemaining: newBalance,
			creditsDeducted: amount,
		};
	},
});

/**
 * Add credits to user account (for purchases)
 */
export const addCredits = mutation({
	args: {
		amount: v.number(),
		reason: v.optional(v.string()),
	},
	handler: async (ctx, { amount, reason }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const usage = await ensureUserUsageWithCredits(ctx, identity.subject);

		// Can't add credits to pro tier (unlimited)
		if (usage.subscriptionTier === "pro") {
			return {
				success: true,
				creditsRemaining: Infinity,
				creditsAdded: 0,
			};
		}

		const creditsRemaining = usage.creditsRemaining ?? FREE_TIER_CREDITS;
		const newBalance = creditsRemaining + amount;

		await ctx.db.patch(usage._id, {
			creditsRemaining: newBalance,
		});

		console.log(
			`Credits added: ${amount} (${reason || "no reason"}). New balance: ${newBalance}`
		);

		return {
			success: true,
			creditsRemaining: newBalance,
			creditsAdded: amount,
		};
	},
});

/**
 * Reset monthly credits for free tier users
 */
export const resetMonthlyCredits = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const usage = await ensureUserUsageWithCredits(ctx, identity.subject);

		// Only reset for free tier
		if (usage.subscriptionTier !== "free") {
			return {
				success: false,
				message: "Pro tier has unlimited credits",
			};
		}

		const creditsTotal = usage.creditsTotal ?? FREE_TIER_CREDITS;

		await ctx.db.patch(usage._id, {
			creditsRemaining: creditsTotal,
			lastCreditReset: Date.now(),
		});

		return {
			success: true,
			creditsRemaining: creditsTotal,
			message: "Monthly credits have been reset",
		};
	},
});

/**
 * Helper: Check and auto-reset credits if month has passed
 * Returns the updated usage record
 */
export async function checkAndResetCredits(
	ctx: MutationCtx,
	userId: string
) {
	return await ensureUserUsageWithCredits(ctx, userId);
}

/**
 * Get user usage record for authenticated user
 * Used for rate limiting and other usage tracking
 */
export const getUserUsage = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		return await getUserUsageRecord(ctx, identity.subject);
	},
});

/**
 * Update user usage record
 * Used for updating rate limiting data
 */
export const updateUserUsage = mutation({
	args: {
		websiteCrawlsThisHour: v.optional(v.array(v.number())),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const usage = await ensureUserUsageWithCredits(ctx, identity.subject);

		await ctx.db.patch(usage._id, {
			...args,
		});

		return { success: true };
	},
});
