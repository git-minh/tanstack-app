import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

const FREE_TIER_LIMIT = 5;
const PRO_TIER_LIMIT = Infinity;

/**
 * Get or create user usage record (for queries - read-only)
 */
async function getUserUsageRecord(ctx: QueryCtx, userId: string) {
  return await ctx.db
    .query("userUsage")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();
}

/**
 * Get or create user usage record (for mutations - read-write)
 */
async function ensureUserUsage(ctx: MutationCtx, userId: string) {
  const existing = await ctx.db
    .query("userUsage")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();

  if (existing) {
    // Check if we need to reset monthly counter
    const now = Date.now();
    const lastReset = new Date(existing.lastResetDate);
    const currentDate = new Date(now);

    // Reset if it's a new month
    if (
      lastReset.getMonth() !== currentDate.getMonth() ||
      lastReset.getFullYear() !== currentDate.getFullYear()
    ) {
      await ctx.db.patch(existing._id, {
        aiGenerationCount: 0,
        lastResetDate: now,
      });
      return { ...existing, aiGenerationCount: 0, lastResetDate: now };
    }

    return existing;
  }

  // Create new usage record for user
  const id = await ctx.db.insert("userUsage", {
    userId,
    aiGenerationCount: 0,
    subscriptionTier: "free",
    lastResetDate: Date.now(),
  });

  return {
    _id: id,
    userId,
    aiGenerationCount: 0,
    subscriptionTier: "free",
    lastResetDate: Date.now(),
  };
}

/**
 * Get usage information for current user
 */
export const getUserUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const usage = await getUserUsageRecord(ctx, identity.subject);

    // If no usage record exists, return default values for free tier
    if (!usage) {
      return {
        count: 0,
        limit: FREE_TIER_LIMIT,
        tier: "free" as const,
        hasAccess: true,
        remaining: FREE_TIER_LIMIT,
      };
    }

    const limit =
      usage.subscriptionTier === "pro" ? PRO_TIER_LIMIT : FREE_TIER_LIMIT;

    return {
      count: usage.aiGenerationCount,
      limit,
      tier: usage.subscriptionTier as "free" | "pro",
      hasAccess: usage.aiGenerationCount < limit,
      remaining: Math.max(0, limit - usage.aiGenerationCount),
    };
  },
});

/**
 * Increment usage count for AI generation
 */
export const incrementUsageCount = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const usage = await ensureUserUsage(ctx, identity.subject);

    // Check if user has access
    const limit =
      usage.subscriptionTier === "pro" ? PRO_TIER_LIMIT : FREE_TIER_LIMIT;

    if (usage.aiGenerationCount >= limit) {
      throw new Error(
        "Usage limit reached. Please upgrade to Pro for unlimited generations."
      );
    }

    // Increment counter
    await ctx.db.patch(usage._id, {
      aiGenerationCount: usage.aiGenerationCount + 1,
    });

    return {
      count: usage.aiGenerationCount + 1,
      limit,
      remaining: Math.max(0, limit - (usage.aiGenerationCount + 1)),
    };
  },
});

/**
 * Update subscription tier for user
 */
export const updateSubscriptionTier = mutation({
  args: {
    tier: v.union(v.literal("free"), v.literal("pro")),
  },
  handler: async (ctx, { tier }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const usage = await ensureUserUsage(ctx, identity.subject);

    await ctx.db.patch(usage._id, {
      subscriptionTier: tier,
    });

    return {
      tier,
      success: true,
    };
  },
});
